pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../adapters/interfaces/IOnboarding.sol";
import "../helpers/FlagHelper.sol";
import "../utils/SafeMath.sol";
import "./DaoConstants.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/AdapterGuard.sol";
import "../utils/IERC20.sol";

contract DaoRegistry is DaoConstants, AdapterGuard {
    /*
     * LIBRARIES
     */
    using FlagHelper for uint256;
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
        uint256 proposalId,
        uint256 proposalIndex,
        address applicant,
        uint256 flags
    );
    event SponsoredProposal(
        uint256 proposalId,
        uint256 proposalIndex,
        uint256 startingTime,
        uint256 flags
    );
    event ProcessedProposal(
        uint256 proposalId,
        uint256 processingTime,
        uint256 flags
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
        uint256 flags; // flags to track the state of the proposal: exist, sponsored, processed, canceled, etc.
    }

    struct Member {
        // the structure to track all the members in the DAO
        uint256 flags; // flags to track the state of the member: exist, jailed, etc
        address delegateKey; // ?
        uint256 nbShares; // number of shares of the DAO member
        uint256 nbLoot; // number of non-voting shares of the DAO member
        uint256 lockedLoot;
    }

    struct Checkpoint {
        // A checkpoint for marking number of votes from a given block
        uint256 fromBlock;
        uint256 votes;
    }

    struct Bank {
        address[] tokens;
        mapping(address => bool) availableTokens;
        mapping(address => mapping(address => uint256)) tokenBalances;
    }

    /*
     * PRIVATE VARIABLES
     */
    mapping(address => Member) private members; // the map to track all members of the DAO
    mapping(address => address) private memberAddresses; // the member address map
    mapping(address => address) private memberAddressesByDelegatedKey; // ???
    Bank private bank; // the state of the DAO Bank

    DaoState public state = DaoState.CREATION;

    /*
     * PUBLIC VARIABLES
     */
    /// @notice The total shares in the DAO, which has its maximum number at 2**256 - 1
    uint256 public totalShares = 0;
    /// @notice The total non-voting shares in the DAO, which has its maximum number at 2**256 - 1
    uint256 public totalLoot = 0; // total loot across all members
    /// @notice The number of proposals submitted to the DAO
    uint256 public proposalCount;
    /// @notice The map that keeps track of all proposasls submitted to the DAO
    mapping(uint256 => Proposal) public proposals;
    /// @notice The map that keeps track of all adapters registered in the DAO
    mapping(bytes32 => address) public registry;
    /// @notice The inverse map to get the adapter id based on its address
    mapping(address => bytes32) public inverseRegistry;
    /// @notice A record of votes checkpoints for each account, by index
    mapping(address => mapping(uint32 => Checkpoint)) public checkpoints;
    /// @notice The number of checkpoints for each account
    mapping(address => uint32) public numCheckpoints;
    /// @notice The reserved address for Guild bank account
    address public constant GUILD = address(0xdead);
    /// @notice The reserved address for Escrow bank account
    address public constant ESCROW = address(0xbeef);
    /// @notice The reserved address for Total funds bank account
    address public constant TOTAL = address(0xbabe);
    /// @notice The maximum number of tokens supported by the bank
    uint256 public constant MAX_TOKENS = 100;

    constructor() {
        address memberAddr = msg.sender;
        Member storage member = members[memberAddr];
        member.flags = member.flags.setExists(true);
        member.delegateKey = memberAddr;
        member.nbShares = 1;
        totalShares = 1;

        memberAddressesByDelegatedKey[memberAddr] = memberAddr;
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
        returns (uint256)
    {
        Proposal memory p = Proposal(
            applicant,
            inverseRegistry[msg.sender],
            msg.sender,
            1
        );
        proposals[proposalCount++] = p;
        uint256 proposalId = proposalCount - 1;

        emit SubmittedProposal(proposalId, proposalCount, applicant, p.flags);

        return proposalId;
    }

    /// @dev - Proposal: sponsor proposals that were submitted to the DAO registry
    function sponsorProposal(
        uint256 proposalId,
        address sponsoringMember,
        bytes calldata votingData
    ) external onlyAdapter(this) {
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
        uint256 votingId = votingContract.startNewVotingForProposal(
            DaoRegistry(this),
            proposalId,
            votingData
        );

        proposals[proposalId].flags = proposal.flags.setSponsored(true);

        emit SponsoredProposal(
            proposalId,
            votingId,
            block.timestamp,
            proposals[proposalCount].flags
        );
    }

    /// @dev - Proposal: mark a proposal as processed in the DAO registry
    function processProposal(uint256 proposalId) external onlyAdapter(this) {
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
            block.timestamp,
            proposals[proposalCount].flags
        );
    }

    /*
     * MEMBERS
     */
    function isActiveMember(address addr) public view returns (bool) {
        address memberAddr = memberAddressesByDelegatedKey[addr];
        uint256 memberFlags = members[memberAddr].flags;
        return
            memberFlags.exists() &&
            !memberFlags.isJailed() &&
            (members[memberAddr].nbShares > 0 ||
                members[memberAddr].nbLoot > 0);
    }

    function memberAddress(address memberOrDelegateKey)
        external
        view
        returns (address)
    {
        return memberAddresses[memberOrDelegateKey];
    }

    function updateMemberShares(address memberAddr, uint256 shares)
        public
        onlyAdapter(this)
    {
        require(
            totalShares.add(totalLoot).add(shares) < type(uint256).max,
            "too many shares requested"
        );

        Member storage member = members[memberAddr];
        if (member.delegateKey == address(0x0)) {
            member.flags = member.flags.setExists(true);
            member.delegateKey = memberAddr;
        }

        member.nbShares = shares;

        totalShares = totalShares.add(shares);

        memberAddressesByDelegatedKey[member.delegateKey] = memberAddr;

        emit UpdateMemberShares(memberAddr, shares);
    }

    function updateMemberLoot(address memberAddr, uint256 loot)
        external
        onlyAdapter(this)
    {
        require(
            totalShares.add(totalLoot).add(loot) < type(uint256).max,
            "too many loot requested"
        );

        Member storage member = members[memberAddr];
        if (member.delegateKey == address(0x0)) {
            member.flags = member.flags.setExists(true);
            member.delegateKey = memberAddr;
        }

        member.nbLoot = loot;

        totalLoot = totalLoot.add(loot);

        memberAddressesByDelegatedKey[member.delegateKey] = memberAddr;

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
        return members[memberAddressesByDelegatedKey[member]].nbShares;
    }

    function nbLoot(address member) external view returns (uint256) {
        return members[memberAddressesByDelegatedKey[member]].nbLoot;
    }

    /*
     * BANK
     */

    function addToEscrow(address token, uint256 amount) external onlyAdapter(this) {
        require(
            token != GUILD && token != ESCROW && token != TOTAL,
            "invalid token"
        );
        unsafeAddToBalance(ESCROW, token, amount);
        if (!bank.availableTokens[token]) {
            require(bank.tokens.length < MAX_TOKENS, "max limit reached");
            bank.availableTokens[token] = true;
            bank.tokens.push(token);
        }
    }

    function addToGuild(address token, uint256 amount) external onlyAdapter(this) {
        require(
            token != GUILD && token != ESCROW && token != TOTAL,
            "invalid token"
        );
        unsafeAddToBalance(GUILD, token, amount);
        if (!bank.availableTokens[token]) {
            require(bank.tokens.length < MAX_TOKENS, "max limit reached");
            bank.availableTokens[token] = true;
            bank.tokens.push(token);
        }
    }

    function transferFromGuild(
        address applicant,
        address token,
        uint256 amount
    ) external onlyAdapter(this) {
        require(
            bank.tokenBalances[GUILD][token] >= amount,
            "insufficient balance"
        );
        unsafeSubtractFromBalance(GUILD, token, amount);
        unsafeAddToBalance(applicant, token, amount);
        emit Transfer(GUILD, applicant, token, amount);
    }

    function burnLockedLoot(address memberAddr, uint256 lootToBurn)
        external
        onlyAdapter(this)
    {
        //lock if member has enough loot
        Member storage member = members[memberAddr];
        require(member.lockedLoot >= lootToBurn, "insufficient loot");

        // burn locked loot
        member.lockedLoot = member.lockedLoot.sub(lootToBurn);
        totalLoot = totalLoot.sub(lootToBurn);
    }

    function lockLoot(address memberAddr, uint256 lootToLock)
        external
        onlyAdapter(this)
    {
        //lock if member has enough loot
        require(isActiveMember(memberAddr), "must be an active member");
        Member storage member = members[memberAddr];
        require(member.nbLoot >= lootToLock, "insufficient loot");

        // lock loot
        member.nbLoot = member.nbLoot.sub(lootToLock);
        member.lockedLoot = member.lockedLoot.add(lootToLock);
    }

    function releaseLoot(address memberAddr, uint256 lootToRelease)
        external
        onlyAdapter(this)
    {
        //release if member has enough locked loot
        require(isActiveMember(memberAddr), "must be an active member");
        Member storage member = members[memberAddr];
        require(member.lockedLoot >= lootToRelease, "insufficient loot locked");

        // release loot
        member.lockedLoot = member.lockedLoot.sub(lootToRelease);
        member.nbLoot = member.nbLoot.add(lootToRelease);
    }

    function burnShares(
        address memberAddr,
        uint256 sharesToBurn,
        uint256 lootToBurn
    ) external onlyAdapter(this) {
        //Burn if member has enough shares and loot
        Member storage member = members[memberAddr];
        require(member.nbShares >= sharesToBurn, "insufficient shares");
        require(member.nbLoot >= lootToBurn, "insufficient loot");

        //TODO: require(canRagequit(member.highestIndexYesVote), "cannot ragequit until highest index proposal member voted YES on is processed");

        uint256 initialTotalSharesAndLoot = totalShares.add(totalLoot);

        // burn shares and loot
        uint256 sharesAndLootToBurn = sharesToBurn.add(lootToBurn);
        member.nbShares = member.nbShares.sub(sharesToBurn);
        member.nbLoot = member.nbLoot.sub(lootToBurn);
        totalShares = totalShares.sub(sharesToBurn);
        totalLoot = totalLoot.sub(lootToBurn);

        //Update internal Guild and Member balances
        for (uint256 i = 0; i < bank.tokens.length; i++) {
            address token = bank.tokens[i];
            uint256 amountToRagequit = fairShare(
                bank.tokenBalances[GUILD][token],
                sharesAndLootToBurn,
                initialTotalSharesAndLoot
            );
            if (amountToRagequit > 0) {
                // gas optimization to allow a higher maximum token limit
                // deliberately not using safemath here to keep overflows from preventing the function execution
                // (which would break ragekicks) if a token overflows,
                // it is because the supply was artificially inflated to oblivion, so we probably don"t care about it anyways
                bank.tokenBalances[GUILD][token] -= amountToRagequit;
                bank.tokenBalances[memberAddr][token] += amountToRagequit;
                //TODO: do we want to emit an event for each token transfer?
                // emit Transfer(GUILD, applicant, token, amount);
            }
        }
    }

    function isNotReservedAddress(address applicant)
        external
        pure
        returns (bool)
    {
        return
            applicant != address(0x0) &&
            applicant != GUILD &&
            applicant != ESCROW &&
            applicant != TOTAL;
    }

    /**
     * Public read-only functions
     */
    function balanceOf(address user, address token)
        external
        view
        returns (uint256)
    {
        return bank.tokenBalances[user][token];
    }

    /**
     * Internal bookkeeping
     */
    function unsafeAddToBalance(
        address user,
        address token,
        uint256 amount
    ) internal {
        bank.tokenBalances[user][token] += amount;
        bank.tokenBalances[TOTAL][token] += amount;
    }

    function unsafeSubtractFromBalance(
        address user,
        address token,
        uint256 amount
    ) internal {
        bank.tokenBalances[user][token] -= amount;
        bank.tokenBalances[TOTAL][token] -= amount;
    }

    function unsafeInternalTransfer(
        address from,
        address to,
        address token,
        uint256 amount
    ) internal {
        unsafeSubtractFromBalance(from, token, amount);
        unsafeAddToBalance(to, token, amount);
    }

    /**
     * Internal utility
     */
    function fairShare(
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
        uint256 newVotes
    ) internal {
        if (
            nCheckpoints > 0 &&
            checkpoints[delegatee][nCheckpoints - 1].fromBlock == block.number
        ) {
            checkpoints[delegatee][nCheckpoints - 1].votes = newVotes;
        } else {
            checkpoints[delegatee][nCheckpoints] = Checkpoint(
                block.number,
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
        bytes memory revertData = slice(_res, 4, _res.length - 4); // Remove the selector which is the first 4 bytes
        return abi.decode(revertData, (string)); // All that remains is the revert string
    }

    function slice(
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
