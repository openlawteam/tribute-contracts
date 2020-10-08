pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../adapters/interfaces/IOnboarding.sol";
import "../helpers/FlagHelper128.sol";
import "../utils/SafeMath.sol";
import "./DaoConstants.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/AdapterGuard.sol";
import "../utils/IERC20.sol";

contract DaoRegistry is DaoConstants, AdapterGuard {
    /*
     * LIBRARIES
     */
    using FlagHelper128 for uint128;
    using SafeMath for uint256;

    enum DaoState {
        CREATION,
        READY
    }

    /*
     * EVENTS
     */ 
    /// @dev - Events for Proposals
    event SubmittedProposal(
        uint64 proposalId,
        uint128 flags,
        address applicant
    );
    event SponsoredProposal(
        uint64 proposalId,
        uint128 flags,
        uint64 startingTime
    );
    event ProcessedProposal(
        uint64 proposalId,
        uint64 processingTime,
        uint128 flags
    );

    /// @dev - Events for Members
    event UpdateMemberShares(address member, uint256 shares);
    event UpdateMemberLoot(address member, uint256 loot);
    event UpdateDelegateKey(
        address indexed memberAddress,
        address newDelegateKey
    );

    /// @dev - Events for Bank
    event TokensCollected(
        address indexed moloch,
        address indexed token,
        uint256 amountToCollect
    );
    event Transfer(
        address indexed fromAddress,
        address indexed toAddress,
        address token,
        uint256 amount
    );

    /*
     * STRUCTURES
     */
    struct Proposal {
        // the structure to track all the proposals in the DAO
        address applicant; // the address of the sender that submitted the proposal
        bytes32 adapterId; // the adapter id that called the functions to change the DAO state
        address adapterAddress; // the adapter address that called the functions to change the DAO state
        uint128 flags; // flags to track the state of the proposal: exist, sponsored, processed, canceled, etc.
    }

    struct Member {
        // the structure to track all the members in the DAO
        uint128 flags; // flags to track the state of the member: exist, jailed, etc
        address delegateKey; // ?
    }

    struct Checkpoint {
        // A checkpoint for marking number of votes from a given block
        uint96 fromBlock;
        uint160 votes;
    }

    struct Bank {
        address[] tokens;
        mapping(address => bool) availableTokens;
        mapping(address => mapping(address => uint256)) tokenBalances;
    }

    /*
     * PUBLIC VARIABLES
     */
    mapping(address => Member) public members; // the map to track all members of the DAO
    mapping(address => address) public memberAddresses; // the member address map
    mapping(address => address) public memberAddressesByDelegatedKey; // ???
    Bank private _bank; // the state of the DAO Bank

    DaoState public state = DaoState.CREATION;

    /// @notice The number of proposals submitted to the DAO
    uint64 public proposalCount;
    /// @notice The map that keeps track of all proposasls submitted to the DAO
    mapping(uint64 => Proposal) public proposals;
    /// @notice The map that keeps track of all adapters registered in the DAO
    mapping(bytes32 => address) public registry;
    /// @notice The inverse map to get the adapter id based on its address
    mapping(address => bytes32) public inverseRegistry;
    /// @notice A record of votes checkpoints for each account, by index
    mapping(address => mapping(uint32 => Checkpoint)) public checkpoints;
    /// @notice The number of checkpoints for each account
    mapping(address => uint32) public numCheckpoints;

    /// @notice The maximum number of tokens supported by the bank
    uint256 public constant MAX_TOKENS = 100;

    constructor() {
        address memberAddr = msg.sender;
        Member storage member = members[memberAddr];
        member.flags = member.flags.setExists(true);
        member.delegateKey = memberAddr;
        memberAddressesByDelegatedKey[memberAddr] = memberAddr;
        _unsafeAddToBalance(memberAddr, SHARES, 1);
    }

    /*
     * PUBLIC NON RESTRICTED FUNCTIONS
     */
    receive() external payable {
        if (!isAdapter(msg.sender)) {
            IOnboarding onboarding = IOnboarding(registry[ONBOARDING]);
            uint256 amount = onboarding.submitMembershipProposal(
                this,
                msg.sender,
                msg.value,
                address(0x0) //RAW ETH
            );
            if (msg.value > amount) {
                msg.sender.transfer(msg.value - amount);
            }
        }
    }

    function finalizeDao() external {
        state = DaoState.READY;
    }

    function onboard(
        IERC20 token,
        uint256 tokenAmount,
        address onboardingAdapter
    ) external payable {
        require(isAdapter(onboardingAdapter), "invalid adapter");

        if (address(token) == address(0x0)) {
            // ETH onboarding
            require(msg.value > 0, "not enough ETH");
            // If the applicant sends ETH to onboard, use the msg.value as default token amount
            tokenAmount = msg.value;
        } else {
            // ERC20 onboarding
            require(
                token.allowance(msg.sender, address(this)) == tokenAmount,
                "ERC20 transfer not allowed"
            );
            require(
                token.transferFrom(msg.sender, address(this), tokenAmount),
                "ERC20 failed transferFrom"
            );
        }

        IOnboarding onboarding = IOnboarding(onboardingAdapter);
        uint256 amountUsed = onboarding.submitMembershipProposal(
            this,
            msg.sender,
            tokenAmount,
            address(token)
        );

        if (amountUsed < tokenAmount) {
            uint256 amount = tokenAmount - amountUsed;
            if (address(token) == address(0x0)) {
                msg.sender.transfer(amount);
            } else {
                require(
                    token.transfer(msg.sender, amount),
                    "ERC20 failed transfer"
                );
            }
        }
    }

    function addAdapter(bytes32 adapterId, address adapterAddress)
        external
        onlyAdapter(this)
    {
        require(adapterId != bytes32(0), "adapterId must not be empty");
        require(
            adapterAddress != address(0x0),
            "adapterAddress must not be empty"
        );
        require(
            registry[adapterId] == address(0x0),
            "adapterId already in use"
        );
        registry[adapterId] = adapterAddress;
        inverseRegistry[adapterAddress] = adapterId;
    }

    function removeAdapter(bytes32 adapterId) external onlyAdapter(this) {
        require(adapterId != bytes32(0), "adapterId must not be empty");
        require(
            registry[adapterId] != address(0x0),
            "adapterId not registered"
        );
        delete inverseRegistry[registry[adapterId]];
        delete registry[adapterId];
    }

    function isAdapter(address adapterAddress) public view returns (bool) {
        return inverseRegistry[adapterAddress] != bytes32(0);
    }

    function isDao(address daoAddress) public view returns (bool) {
        return daoAddress == address(this);
    }

    function getAdapterAddress(bytes32 adapterId)
        external
        view
        returns (address)
    {
        return registry[adapterId];
    }

    function execute(
        address _actionTo,
        uint256 _actionValue,
        bytes calldata _actionData
    ) external onlyAdapter(this) returns (bytes memory) {
        (bool success, bytes memory retData) = _actionTo.call{
            value: _actionValue
        }(_actionData);

        if (!success) {
            string memory m = _getRevertMsg(retData);
            revert(m);
        }
        return retData;
    }

    /**
     * PROPOSALS
     */
    /// @dev - Proposal: submit proposals to the DAO registry
    function submitProposal(address applicant)
        external
        onlyAdapter(this)
        returns (uint64)
    {
        proposals[proposalCount++] = Proposal(
            applicant,
            inverseRegistry[msg.sender],
            msg.sender,
            1
        );
        uint64 proposalId = proposalCount - 1;

        emit SubmittedProposal(proposalId, 1, applicant);

        return proposalId;
    }

    /// @dev - Proposal: sponsor proposals that were submitted to the DAO registry
    function sponsorProposal(
        uint256 _proposalId,
        address sponsoringMember,
        bytes calldata votingData
    ) external onlyAdapter(this) {
        require (_proposalId < type(uint64).max, "proposal Id should only be uint64");
        uint64 proposalId = uint64(_proposalId);
        Proposal memory proposal = proposals[proposalId];
        require(proposal.flags.exists(), "proposal does not exist");
        require(
            !proposal.flags.isSponsored(),
            "proposal must not be sponsored"
        );
        require(
            !proposal.flags.isCancelled(),
            "proposal must not be cancelled"
        );
        require(
            !proposal.flags.isProcessed(),
            "proposal must not be processed"
        );

        require(
            isActiveMember(sponsoringMember),
            "only active members can sponsor proposals"
        );

        IVoting votingContract = IVoting(registry[VOTING]);
        votingContract.startNewVotingForProposal(
            DaoRegistry(this),
            proposalId,
            votingData
        );

        proposals[proposalId].flags = proposal.flags.setSponsored(true);

        emit SponsoredProposal(
            proposalId,
            proposals[proposalCount].flags,
            uint64(block.timestamp)
        );
    }

    /// @dev - Proposal: mark a proposal as processed in the DAO registry
    function processProposal(uint256 _proposalId) external onlyAdapter(this) {
        require (_proposalId < type(uint64).max, "proposal Id should only be uint64");
        uint64 proposalId = uint64(_proposalId);

        Proposal memory proposal = proposals[proposalId];
        require(
            proposal.flags.exists(),
            "proposal does not exist for this dao"
        );
        require(proposal.flags.isSponsored(), "proposal not sponsored");
        require(!proposal.flags.isProcessed(), "proposal already processed");

        proposals[proposalId].flags = proposal.flags.setProcessed(true);

        emit ProcessedProposal(
            proposalId,
            uint64(block.timestamp),
            proposals[proposalCount].flags
        );
    }

    /*
     * MEMBERS
     */
    function isActiveMember(address addr) public view returns (bool) {
        address memberAddr = memberAddressesByDelegatedKey[addr];
        uint128 memberFlags = members[memberAddr].flags;
        return
            memberFlags.exists() &&
            !memberFlags.isJailed() &&
            (   balanceOf(memberAddr, SHARES) > 0   ||
                balanceOf(memberAddr, LOOT) > 0    ||
                balanceOf(memberAddr, LOCKED_LOOT) > 0
            );
    }

    function memberAddress(address memberOrDelegateKey)
        external
        view
        returns (address)
    {
        return memberAddresses[memberOrDelegateKey];
    }

    function mintSharesToMember(address memberAddr, uint256 shares)
        public
        onlyAdapter(this)
    {
        balanceOf(TOTAL, LOOT).add(balanceOf(TOTAL, SHARES)).add(shares); // this throws if it overflows

        Member storage member = members[memberAddr];
        if (member.delegateKey == address(0x0)) {
            member.flags = member.flags.setExists(true);
            member.delegateKey = memberAddr;
            memberAddressesByDelegatedKey[member.delegateKey] = memberAddr;
        }
        _unsafeAddToBalance(memberAddr, SHARES, shares);
        
        emit UpdateMemberShares(memberAddr, shares);
    }

    function mintLootToMember(address memberAddr, uint256 loot)
        external
        onlyAdapter(this)
    {
        balanceOf(TOTAL, LOOT).add(balanceOf(TOTAL, SHARES)).add(loot); // this throws if it overflows

        Member storage member = members[memberAddr];
        if (member.delegateKey == address(0x0)) {
            member.flags = member.flags.setExists(true);
            member.delegateKey = memberAddr;
            memberAddressesByDelegatedKey[member.delegateKey] = memberAddr;
        }

        _unsafeAddToBalance(memberAddr, LOOT, loot);    

        emit UpdateMemberLoot(memberAddr, loot);
    }

    function updateDelegateKey(address memberAddr, address newDelegateKey)
        external
        onlyAdapter(this)
    {
        require(newDelegateKey != address(0), "newDelegateKey cannot be 0");

        // skip checks if member is setting the delegate key to their member address
        if (newDelegateKey != memberAddr) {
            require(
                memberAddresses[newDelegateKey] == address(0x0),
                "cannot overwrite existing members"
            );
            require(
                memberAddresses[memberAddressesByDelegatedKey[newDelegateKey]] ==
                    address(0x0),
                "cannot overwrite existing delegate keys"
            );
        }

        Member storage member = members[memberAddr];
        require(member.flags.exists(), "member does not exist");
        memberAddressesByDelegatedKey[member.delegateKey] = address(0x0);
        memberAddressesByDelegatedKey[newDelegateKey] = memberAddr;
        member.delegateKey = newDelegateKey;

        emit UpdateDelegateKey(memberAddr, newDelegateKey);
    }

    function nbShares(address member) external view returns (uint256) {
        return balanceOf(memberAddressesByDelegatedKey[member], SHARES);
    }

    function nbLoot(address member) external view returns (uint256) {
        return balanceOf(memberAddressesByDelegatedKey[member], LOOT);
    }

    /*
     * BANK
     */

    function addToEscrow(address token, uint256 amount) external onlyAdapter(this) {
        require(
            isNotReservedAddress(token),
            "invalid token"
        );
        _unsafeAddToBalance(ESCROW, token, amount);
        _registerPotentialNewToken(token);
    }

    function _registerPotentialNewToken(address token) internal {
        if(isNotReservedAddress(token) && !_bank.availableTokens[token]) {
            require(_bank.tokens.length < MAX_TOKENS, "max limit reached");
            _bank.availableTokens[token] = true;
            _bank.tokens.push(token);
        }
    
    }
    function addToGuild(address token, uint256 amount) external onlyAdapter(this) {
        require(
            isNotReservedAddress(token),
            "invalid token"
        );
        _unsafeAddToBalance(GUILD, token, amount);
        _registerPotentialNewToken(token);
    }

    function transferFromGuild(
        address applicant,
        address token,
        uint256 amount
    ) external onlyAdapter(this) {
        require(
            _bank.tokenBalances[GUILD][token] >= amount,
            "insufficient balance"
        );
        _unsafeSubtractFromBalance(GUILD, token, amount);
        _unsafeAddToBalance(applicant, token, amount);
        emit Transfer(GUILD, applicant, token, amount);
    }

    function burnLockedLoot(address memberAddr, uint256 lootToBurn)
        external
        onlyAdapter(this)
    {
        //lock if member has enough loot
        require(balanceOf(memberAddr, LOCKED_LOOT) >= lootToBurn, "insufficient loot");

        // burn locked loot
        _unsafeSubtractFromBalance(memberAddr, LOCKED_LOOT, lootToBurn);
    }

    function lockLoot(address memberAddr, uint256 lootToLock)
        external
        onlyAdapter(this)
    {
        //lock if member has enough loot
        require(isActiveMember(memberAddr), "must be an active member");
        require(balanceOf(memberAddr, LOOT) >= lootToLock, "insufficient loot");

        // lock loot
        _unsafeAddToBalance(memberAddr, LOCKED_LOOT, lootToLock);
        _unsafeSubtractFromBalance(memberAddr, LOOT, lootToLock);
    }

    function releaseLoot(address memberAddr, uint256 lootToRelease)
        external
        onlyAdapter(this)
    {
        //release if member has enough locked loot
        require(isActiveMember(memberAddr), "must be an active member");
        require(balanceOf(memberAddr, LOCKED_LOOT) >= lootToRelease, "insufficient loot locked");

        // release loot
        _unsafeAddToBalance(memberAddr, LOOT, lootToRelease);
        _unsafeSubtractFromBalance(memberAddr, LOCKED_LOOT, lootToRelease);
    }

    function burnShares(
        address memberAddr,
        uint256 sharesToBurn,
        uint256 lootToBurn
    ) external onlyAdapter(this) {
        //Burn if member has enough shares and loot
        require(balanceOf(memberAddr, SHARES) >= sharesToBurn, "insufficient shares");
        require(balanceOf(memberAddr, LOOT) >= lootToBurn, "insufficient loot");

        //TODO: require(canRagequit(member.highestIndexYesVote), "cannot ragequit until highest index proposal member voted YES on is processed");

        uint256 initialTotalSharesAndLoot = balanceOf(TOTAL, SHARES).add(balanceOf(TOTAL, LOOT)).add(balanceOf(TOTAL, LOCKED_LOOT));

        // burn shares and loot
        uint256 sharesAndLootToBurn = sharesToBurn.add(lootToBurn);
        _unsafeSubtractFromBalance(memberAddr, SHARES, sharesToBurn);
        _unsafeSubtractFromBalance(memberAddr, LOOT, lootToBurn);

        //Update internal Guild and Member balances
        for (uint256 i = 0; i < _bank.tokens.length; i++) {
            address token = _bank.tokens[i];
            uint256 amountToRagequit = _fairShare(
                balanceOf(GUILD, token),
                sharesAndLootToBurn,
                initialTotalSharesAndLoot
            );
            if (amountToRagequit > 0) {
                // gas optimization to allow a higher maximum token limit
                // deliberately not using safemath here to keep overflows from preventing the function execution
                // (which would break ragekicks) if a token overflows,
                // it is because the supply was artificially inflated to oblivion, so we probably don"t care about it anyways
                _unsafeInternalTransfer(GUILD, memberAddr, token, amountToRagequit);
                //TODO: do we want to emit an event for each token transfer?
                // emit Transfer(GUILD, applicant, token, amount);
            }
        }
    }

    /**
     * Public read-only functions
     */
    function balanceOf(address user, address token)
        public
        view
        returns (uint256)
    {
        return _bank.tokenBalances[user][token];
    }

    function isNotReservedAddress(address applicant)
        public
        pure
        returns (bool)
    {
        return
            applicant != GUILD &&
            applicant != ESCROW &&
            applicant != LOOT &&
            applicant != SHARES &&
            applicant != LOCKED_LOOT &&
            applicant != TOTAL;
    }

    /**
     * Internal bookkeeping
     */
    function _unsafeAddToBalance(
        address user,
        address token,
        uint256 amount
    ) internal {
        _bank.tokenBalances[user][token] += amount;
        _bank.tokenBalances[TOTAL][token] += amount;
        if(token == SHARES) {
            _moveDelegates(
                address(0),
                user,
                _bank.tokenBalances[user][token]
            );

            _moveDelegates(
                address(0),
                TOTAL,
                _bank.tokenBalances[TOTAL][token]
            );
        }
    }

    function _unsafeSubtractFromBalance(
        address user,
        address token,
        uint256 amount
    ) internal {
        _bank.tokenBalances[user][token] -= amount;
        _bank.tokenBalances[TOTAL][token] -= amount;
    }

    function _unsafeInternalTransfer(
        address from,
        address to,
        address token,
        uint256 amount
    ) internal {
        _unsafeSubtractFromBalance(from, token, amount);
        _unsafeAddToBalance(to, token, amount);
    }

    /**
     * Internal utility
     */
    function _fairShare(
        uint256 balance,
        uint256 shares,
        uint256 _totalShares
    ) internal pure returns (uint256) {
        require(_totalShares != 0, "total shares should not be 0");
        if (balance == 0) {
            return 0;
        }
        uint256 prod = balance * shares;
        if (prod / balance == shares) {
            // no overflow in multiplication above?
            return prod / _totalShares;
        }
        return (balance / _totalShares) * shares;
    }

    /**
     * @notice Gets the current votes balance for `account`
     * @param account The address to get votes balance
     * @return The number of current votes for `account`
     */
    function getCurrentVotes(address account) external view returns (uint256) {
        uint32 nCheckpoints = numCheckpoints[account];
        return
            nCheckpoints > 0 ? checkpoints[account][nCheckpoints - 1].votes : 0;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorVotes(address account, uint256 blockNumber)
        external
        view
        returns (uint256)
    {
        require(
            blockNumber < block.number,
            "Uni::getPriorVotes: not yet determined"
        );

        uint32 nCheckpoints = numCheckpoints[account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (checkpoints[account][nCheckpoints - 1].fromBlock <= blockNumber) {
            return checkpoints[account][nCheckpoints - 1].votes;
        }

        // Next check implicit zero balance
        if (checkpoints[account][0].fromBlock > blockNumber) {
            return 0;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = checkpoints[account][center];
            if (cp.fromBlock == blockNumber) {
                return cp.votes;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[account][lower].votes;
    }

    function _moveDelegates(
        address srcRep,
        address dstRep,
        uint256 amount
    ) internal {
        if (srcRep != dstRep && amount > 0) {
            if (srcRep != address(0)) {
                uint32 srcRepNum = numCheckpoints[srcRep];
                uint256 srcRepOld = srcRepNum > 0
                    ? checkpoints[srcRep][srcRepNum - 1].votes
                    : 0;
                uint256 srcRepNew = srcRepOld.sub(amount);
                _writeCheckpoint(srcRep, srcRepNum, srcRepNew);
            }

            if (dstRep != address(0)) {
                uint32 dstRepNum = numCheckpoints[dstRep];
                uint256 dstRepOld = dstRepNum > 0
                    ? checkpoints[dstRep][dstRepNum - 1].votes
                    : 0;
                uint256 dstRepNew = dstRepOld.add(amount);
                _writeCheckpoint(dstRep, dstRepNum, dstRepNew);
            }
        }
    }

    function _writeCheckpoint(
        address delegatee,
        uint32 nCheckpoints,
        uint256 _newVotes
    ) internal {
        require(_newVotes < type(uint160).max, "too big of a vote");
        uint160 newVotes = uint160(_newVotes);
        
        if (
            nCheckpoints > 0 &&
            checkpoints[delegatee][nCheckpoints - 1].fromBlock == block.number
        ) {
            checkpoints[delegatee][nCheckpoints - 1].votes = newVotes;
        } else {
            checkpoints[delegatee][nCheckpoints] = Checkpoint(
                uint96(block.number),
                newVotes
            );
            numCheckpoints[delegatee] = nCheckpoints + 1;
        }
    }

    /**
     * Internal Utility Functions
     */

    /*
     * Internal Utility Functions
     */

    /// @dev Get the revert message from a call
    /// @notice This is needed in order to get the human-readable revert message from a call
    /// @param _res Response of the call
    /// @return Revert message string
    function _getRevertMsg(bytes memory _res)
        internal
        pure
        returns (string memory)
    {
        // If the _res length is less than 68, then the transaction failed silently (without a revert message)
        if (_res.length < 68) return "Transaction reverted silently";
        bytes memory revertData = _slice(_res, 4, _res.length - 4); // Remove the selector which is the first 4 bytes
        return abi.decode(revertData, (string)); // All that remains is the revert string
    }

    function _slice(
        bytes memory _bytes,
        uint256 _start,
        uint256 _length
    ) internal pure returns (bytes memory) {
        require(_bytes.length >= (_start + _length), "Read out of bounds");

        bytes memory tempBytes;

        assembly {
            switch iszero(_length)
                case 0 {
                    // Get a location of some free memory and store it in tempBytes as
                    // Solidity does for memory variables.
                    tempBytes := mload(0x40)

                    // The first word of the slice result is potentially a partial
                    // word read from the original array. To read it, we calculate
                    // the length of that partial word and start copying that many
                    // bytes into the array. The first word we copy will start with
                    // data we don't care about, but the last `lengthmod` bytes will
                    // land at the beginning of the contents of the new array. When
                    // we're done copying, we overwrite the full first word with
                    // the actual length of the slice.
                    let lengthmod := and(_length, 31)

                    // The multiplication in the next line is necessary
                    // because when slicing multiples of 32 bytes (lengthmod == 0)
                    // the following copy loop was copying the origin's length
                    // and then ending prematurely not copying everything it should.
                    let mc := add(
                        add(tempBytes, lengthmod),
                        mul(0x20, iszero(lengthmod))
                    )
                    let end := add(mc, _length)

                    for {
                        // The multiplication in the next line has the same exact purpose
                        // as the one above.
                        let cc := add(
                            add(
                                add(_bytes, lengthmod),
                                mul(0x20, iszero(lengthmod))
                            ),
                            _start
                        )
                    } lt(mc, end) {
                        mc := add(mc, 0x20)
                        cc := add(cc, 0x20)
                    } {
                        mstore(mc, mload(cc))
                    }

                    mstore(tempBytes, _length)

                    //update free-memory pointer
                    //allocating the array padded to 32 bytes like the compiler does now
                    mstore(0x40, and(add(mc, 31), not(31)))
                }
                //if we want a zero-length slice let's just return a zero-length array
                default {
                    tempBytes := mload(0x40)

                    mstore(0x40, add(tempBytes, 0x20))
                }
        }

        return tempBytes;
    }
}
