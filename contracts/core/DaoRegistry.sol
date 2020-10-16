pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../helpers/FlagHelper128.sol";
import "../utils/SafeMath.sol";
import "./DaoConstants.sol";
import "../guards/AdapterGuard.sol";
import "../utils/IERC20.sol";

/**
MIT License

Copyright (c) 2020 Openlaw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

contract DaoRegistry is DaoConstants, AdapterGuard {
    /*
     * LIBRARIES
     */
    using FlagHelper128 for uint128;
    using SafeMath for uint256;

    enum DaoState {CREATION, READY}

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
    event CancelledProposal(
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
        address indexed dao,
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
        _bank.tokenBalances[memberAddr][SHARES] = 1;
        _bank.tokenBalances[TOTAL][SHARES] = 1;
        _moveDelegates(address(0), memberAddr, 1);
        _moveDelegates(address(0), TOTAL, 1);
    }

    /**
    /*
     * PUBLIC NON RESTRICTED FUNCTIONS
     */

    receive() external payable {
        revert("you cannot send money back directly");
    }

    function finalizeDao() external {
        state = DaoState.READY;
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
        proposals[proposalCount++] = Proposal(applicant, msg.sender, 1);
        uint64 proposalId = proposalCount - 1;

        emit SubmittedProposal(proposalId, 1, applicant);

        return proposalId;
    }

		function isProposalCancelled(uint256 _proposalId)
		    external view returns (bool)
		{
        require(
            _proposalId < type(uint64).max,
            "proposal Id should only be uint64"
        );
        uint64 proposalId = uint64(_proposalId);
        proposals[proposalId].flags.isCancelled();
		}

		/// @dev - Proposal: cancel a proposal that has been submitted to the registry
    function cancelProposal(uint256 _proposalId) 
		    external
				onlyAdapter(this)
		{
        require(
            _proposalId < type(uint64).max,
            "proposal Id should only be uint64"
        );
        uint64 proposalId = uint64(_proposalId);
        Proposal storage proposal = proposals[proposalId];

        require(
            proposal.adapterAddress == msg.sender,
            "only the adapter that submitted the proposal can cancel it"
        );

        uint128 flags = proposal.flags;
        require(flags.exists(), "proposal does not exist for this dao");
        require(!flags.isCancelled(), "proposal already cancelled");
        require(!flags.isSponsored(), "proposal already sponsored, cannot cancel");
        flags = flags.setCancelled(true);
        proposals[proposalId].flags = flags;

        emit CancelledProposal(proposalId, uint64(block.timestamp), flags);
    }


    /// @dev - Proposal: sponsor proposals that were submitted to the DAO registry
    function sponsorProposal(uint256 _proposalId, address sponsoringMember)
        external
        onlyAdapter(this)
    {
        require(
            _proposalId < type(uint64).max,
            "proposal Id should only be uint64"
        );
        uint64 proposalId = uint64(_proposalId);
        Proposal storage proposal = proposals[proposalId];
        uint128 flags = proposal.flags;

        require(
            proposal.adapterAddress == msg.sender,
            "only the adapter that submitted the proposal can process it"
        );
        require(flags.exists(), "proposal does not exist");
        require(!flags.isSponsored(), "proposal must not be sponsored");
        require(!flags.isCancelled(), "proposal must not be cancelled");
        require(!flags.isProcessed(), "proposal must not be processed");
        require(
            isActiveMember(sponsoringMember),
            "only active members can sponsor proposals"
        );

        flags = flags.setSponsored(true);
        proposals[proposalId].flags = flags;

        emit SponsoredProposal(proposalId, flags, uint64(block.timestamp));
    }

    /// @dev - Proposal: mark a proposal as processed in the DAO registry
    function processProposal(uint256 _proposalId) external onlyAdapter(this) {
        require(
            _proposalId < type(uint64).max,
            "proposal Id should only be uint64"
        );
        uint64 proposalId = uint64(_proposalId);

        Proposal storage proposal = proposals[proposalId];

        require(
            proposal.adapterAddress == msg.sender,
            "only the adapter that submitted the proposal can process it"
        );

        uint128 flags = proposal.flags;
        require(flags.exists(), "proposal does not exist for this dao");
        require(flags.isSponsored(), "proposal not sponsored");
        require(!flags.isCancelled(), "proposal is cancelled");
        require(!flags.isProcessed(), "proposal already processed");
        flags = flags.setProcessed(true);
        proposals[proposalId].flags = flags;

        emit ProcessedProposal(proposalId, uint64(block.timestamp), flags);
    }

    function isInternalToken(address tokenToMint) external pure returns (bool) {
        return tokenToMint == SHARES || tokenToMint == LOOT;
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
            (balanceOf(memberAddr, SHARES) > 0 ||
                balanceOf(memberAddr, LOOT) > 0 ||
                balanceOf(memberAddr, LOCKED_LOOT) > 0);
    }

    function memberAddress(address delegateKey)
        external
        view
        returns (address)
    {
        return memberAddresses[delegateKey];
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

    function _registerPotentialNewToken(address token) internal {
        if (isNotReservedAddress(token) && !_bank.availableTokens[token]) {
            require(_bank.tokens.length < MAX_TOKENS, "max limit reached");
            _bank.availableTokens[token] = true;
            _bank.tokens.push(token);
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

    function tokens() external view returns (address[] memory) {
        return _bank.tokens;
    }

    function addToBalance(
        address user,
        address token,
        uint256 amount
    ) public onlyAdapter(this) {
        _bank.tokenBalances[user][token] += amount;
        _bank.tokenBalances[TOTAL][token] += amount;
        if (token == SHARES) {
            _moveDelegates(address(0), user, _bank.tokenBalances[user][token]);

            _moveDelegates(
                address(0),
                TOTAL,
                _bank.tokenBalances[TOTAL][token]
            );
        }

        _registerPotentialNewToken(token);

        Member storage member = members[user];
        if (member.delegateKey == address(0x0)) {
            member.flags = member.flags.setExists(true);
            member.delegateKey = user;
            memberAddressesByDelegatedKey[member.delegateKey] = user;
        }
    }

    function subtractFromBalance(
        address user,
        address token,
        uint256 amount
    ) public onlyAdapter(this) {
        _bank.tokenBalances[user][token] -= amount;
        _bank.tokenBalances[TOTAL][token] -= amount;
    }

    function internalTransfer(
        address from,
        address to,
        address token,
        uint256 amount
    ) public onlyAdapter(this) {
        subtractFromBalance(from, token, amount);
        addToBalance(to, token, amount);
    }

    /**
     * Internal utility
     */

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
