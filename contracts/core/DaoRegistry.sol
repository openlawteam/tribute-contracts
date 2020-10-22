pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../helpers/FlagHelper.sol";
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
    using FlagHelper for uint128;
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
        uint256 proposalId,
        uint128 flags,
        uint64 startingTime
    );
    event ProcessedProposal(
        uint256 proposalId,
        uint64 processingTime,
        uint128 flags
    );
    event CancelledProposal(
        uint256 proposalId,
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
        uint160 amount;
    }

    struct DelegateCheckpoint {
        // A checkpoint for marking number of votes from a given block
        uint96 fromBlock;
        address delegateKey;
    }

    struct Bank {
        address[] tokens;
        address[] internalTokens;
        mapping(address => bool) availableTokens;
        mapping(address => bool) availableInternalTokens;
        mapping(address => mapping(address => uint256)) tokenBalances;
        mapping(address => mapping(address => mapping(uint32 => Checkpoint))) checkpoints;
        mapping(address => mapping(address => uint32)) numCheckpoints;
    }

    struct AdapterDetails {
        bytes32 id;
        uint128 flags;
    }

    /*
     * PUBLIC VARIABLES
     */
    mapping(address => Member) public members; // the map to track all members of the DAO
    mapping(address => address) public memberAddressesByDelegatedKey; // delegate key -> member address mapping
    Bank private _bank; // the state of the DAO Bank

    mapping(address => mapping(uint32 => DelegateCheckpoint)) checkpoints;
    mapping(address => uint32) numCheckpoints;

    DaoState public state = DaoState.CREATION;

    /// @notice The number of proposals submitted to the DAO
    uint64 public proposalCount;
    /// @notice The map that keeps track of all proposasls submitted to the DAO
    mapping(uint64 => Proposal) public proposals;
    /// @notice The map that keeps track of all adapters registered in the DAO
    mapping(bytes32 => address) public registry;
    /// @notice The inverse map to get the adapter id based on its address
    mapping(address => AdapterDetails) public inverseRegistry;

    constructor() {
        address memberAddr = msg.sender;
        Member storage member = members[memberAddr];
        member.flags = member.flags.setFlag(FlagHelper.Flag.EXISTS, true);
        member.delegateKey = memberAddr;
        memberAddressesByDelegatedKey[memberAddr] = memberAddr;

        _bank.availableInternalTokens[SHARES] = true;
        _bank.internalTokens.push(SHARES);

        _bank.tokenBalances[SHARES][memberAddr] = 1;
        _bank.tokenBalances[SHARES][TOTAL] = 1;
        _createNewAmountCheckpoint(memberAddr, SHARES);
        _createNewAmountCheckpoint(TOTAL, SHARES);
    }

    receive() external payable {
        revert("you cannot send money back directly");
    }

    function finalizeDao() external {
        state = DaoState.READY;
    }

    function addAdapter(
        bytes32 adapterId,
        address adapterAddress,
        uint256 _flags
    ) external hasAccess(this, FlagHelper.Flag.ADD_ADAPTER) {
        require(_flags < type(uint128).max, "flags params overflow");
        uint128 flags = uint128(_flags);

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
        inverseRegistry[adapterAddress].id = adapterId;
        inverseRegistry[adapterAddress].flags = flags;
    }

    function removeAdapter(bytes32 adapterId)
        external
        hasAccess(this, FlagHelper.Flag.REMOVE_ADAPTER)
    {
        require(adapterId != bytes32(0), "adapterId must not be empty");
        require(
            registry[adapterId] != address(0x0),
            "adapterId not registered"
        );
        delete inverseRegistry[registry[adapterId]];
        delete registry[adapterId];
    }

    function isAdapter(address adapterAddress) public view returns (bool) {
        return inverseRegistry[adapterAddress].id != bytes32(0);
    }

    function hasAdapterAccess(address adapterAddress, FlagHelper.Flag flag)
        public
        view
        returns (bool)
    {
        return
            inverseRegistry[adapterAddress].id != bytes32(0) &&
            inverseRegistry[adapterAddress].flags.getFlag(flag);
    }

    function getAdapterAddress(bytes32 adapterId)
        external
        view
        returns (address)
    {
        return registry[adapterId];
    }

    function jailMember(address memberAddr)
        external
        hasAccess(this, FlagHelper.Flag.JAIL_MEMBER)
    {
        Member storage member = members[memberAddr];
        uint128 flags = member.flags;
        require(flags.getFlag(FlagHelper.Flag.EXISTS), "member does not exist");
        if (!flags.getFlag(FlagHelper.Flag.JAILED)) {
            member.flags = flags.setFlag(FlagHelper.Flag.JAILED, true);
            _createNewDelegateCheckpoint(memberAddr, address(1)); // we do this to avoid the member to vote at that point in time. We use 1 instead of 0 to avoid existence check with this
        }
    }

    function unjailMember(address memberAddr)
        external
        hasAccess(this, FlagHelper.Flag.UNJAIL_MEMBER)
    {
        Member storage member = members[memberAddr];
        uint128 flags = member.flags;
        require(flags.getFlag(FlagHelper.Flag.EXISTS), "member does not exist");
        if (flags.getFlag(FlagHelper.Flag.JAILED)) {
            member.flags = flags.setFlag(FlagHelper.Flag.JAILED, false);
            _createNewDelegateCheckpoint(
                memberAddr,
                members[memberAddr].delegateKey
            ); // we do this to re-allow votes
        }
    }

    function execute(
        address _actionTo,
        uint256 _actionValue,
        bytes calldata _actionData
    ) external hasAccess(this, FlagHelper.Flag.EXECUTE) returns (bytes memory) {
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
        hasAccess(this, FlagHelper.Flag.SUBMIT_PROPOSAL)
        returns (uint64)
    {
        proposals[proposalCount++] = Proposal(applicant, msg.sender, 1);
        uint64 proposalId = proposalCount - 1;

        emit SubmittedProposal(proposalId, 1, applicant);

        return proposalId;
    }

    /// @dev - Proposal: cancel a proposal that has been submitted to the registry
    function cancelProposal(uint256 _proposalId)
        external
        hasAccess(this, FlagHelper.Flag.CANCEL_PROPOSAL)
    {
        Proposal storage proposal = _setProposalFlag(
            _proposalId,
            FlagHelper.Flag.CANCELLED
        );

        uint128 flags = proposal.flags;

        require(
            !flags.getFlag(FlagHelper.Flag.SPONSORED),
            "proposal already sponsored, cannot cancel"
        );

        emit CancelledProposal(_proposalId, uint64(block.timestamp), flags);
    }

    /// @dev - Proposal: sponsor proposals that were submitted to the DAO registry
    function sponsorProposal(uint256 _proposalId, address sponsoringMember)
        external
        hasAccess(this, FlagHelper.Flag.SPONSOR_PROPOSAL)
    {
        Proposal storage proposal = _setProposalFlag(
            _proposalId,
            FlagHelper.Flag.SPONSORED
        );

        uint128 flags = proposal.flags;

        require(
            isActiveMember(sponsoringMember),
            "only active members can sponsor proposals"
        );

        emit SponsoredProposal(_proposalId, flags, uint64(block.timestamp));
    }

    /// @dev - Proposal: mark a proposal as processed in the DAO registry
    function processProposal(uint256 _proposalId)
        external
        hasAccess(this, FlagHelper.Flag.PROCESS_PROPOSAL)
    {
        Proposal storage proposal = _setProposalFlag(
            _proposalId,
            FlagHelper.Flag.PROCESSED
        );
        uint128 flags = proposal.flags;

        require(
            proposal.flags.getFlag(FlagHelper.Flag.SPONSORED),
            "proposal not sponsored"
        );

        emit ProcessedProposal(_proposalId, uint64(block.timestamp), flags);
    }

    /// @dev - Proposal: mark a proposal as processed in the DAO registry
    function _setProposalFlag(uint256 _proposalId, FlagHelper.Flag flag)
        internal
        returns (Proposal storage)
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
        require(
            flags.getFlag(FlagHelper.Flag.EXISTS),
            "proposal does not exist for this dao"
        );
        require(
            !flags.getFlag(FlagHelper.Flag.CANCELLED),
            "proposal is cancelled"
        );
        require(
            !flags.getFlag(FlagHelper.Flag.PROCESSED),
            "proposal already processed"
        );
        flags = flags.setFlag(flag, true);
        proposals[proposalId].flags = flags;

        return proposals[proposalId];
    }

    function isInternalToken(address tokenToMint) external view returns (bool) {
        return _bank.availableInternalTokens[tokenToMint];
    }

    /*
     * MEMBERS
     */
    function isActiveMember(address addr) public view returns (bool) {
        address memberAddr = memberAddressesByDelegatedKey[addr];
        uint128 memberFlags = members[memberAddr].flags;
        return
            memberFlags.getFlag(FlagHelper.Flag.EXISTS) &&
            !memberFlags.getFlag(FlagHelper.Flag.JAILED) &&
            (balanceOf(memberAddr, SHARES) > 0 ||
                balanceOf(memberAddr, LOOT) > 0 ||
                balanceOf(memberAddr, LOCKED_LOOT) > 0);
    }

    function getProposalFlag(uint64 proposalId, FlagHelper.Flag flag)
        external
        view
        returns (bool)
    {
        return proposals[proposalId].flags.getFlag(flag);
    }

    function updateDelegateKey(address memberAddr, address newDelegateKey)
        external
        hasAccess(this, FlagHelper.Flag.UPDATE_DELEGATE_KEY)
    {
        require(newDelegateKey != address(0), "newDelegateKey cannot be 0");

        // skip checks if member is setting the delegate key to their member address
        if (newDelegateKey != memberAddr) {
            require(
                memberAddressesByDelegatedKey[newDelegateKey] == address(0x0),
                "cannot overwrite existing members"
            );
            require(
                memberAddressesByDelegatedKey[memberAddressesByDelegatedKey[newDelegateKey]] ==
                    address(0x0),
                "cannot overwrite existing delegate keys"
            );
        }

        Member storage member = members[memberAddr];
        require(
            member.flags.getFlag(FlagHelper.Flag.EXISTS),
            "member does not exist"
        );
        memberAddressesByDelegatedKey[member.delegateKey] = address(0x0);
        memberAddressesByDelegatedKey[newDelegateKey] = memberAddr;
        member.delegateKey = newDelegateKey;

        _createNewDelegateCheckpoint(memberAddr, newDelegateKey);
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

    function registerPotentialNewToken(address token)
        external
        hasAccess(this, FlagHelper.Flag.REGISTER_NEW_TOKEN)
    {
        require(isNotReservedAddress(token), "reservedToken");
        require(!_bank.availableInternalTokens[token], "internalToken");

        if (!_bank.availableTokens[token]) {
            _bank.availableTokens[token] = true;
            _bank.tokens.push(token);
        }
    }

    function registerPotentialNewInternalToken(address token)
        external
        hasAccess(this, FlagHelper.Flag.REGISTER_NEW_INTERNAL_TOKEN)
    {
        require(isNotReservedAddress(token), "reservedToken");
        require(!_bank.availableTokens[token], "internalToken");
        if (!_bank.availableInternalTokens[token]) {
            _bank.availableInternalTokens[token] = true;
            _bank.internalTokens.push(token);
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
        return _bank.tokenBalances[token][user];
    }

    function isNotReservedAddress(address applicant)
        public
        pure
        returns (bool)
    {
        return applicant != GUILD && applicant != TOTAL;
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
    ) public hasAccess(this, FlagHelper.Flag.ADD_TO_BALANCE) {
        _addToBalanceInternal(user, token, amount);
    }

    function _addToBalanceInternal(
        address user,
        address token,
        uint256 amount
    ) internal {
        require(
            _bank.availableTokens[token] ||
                _bank.availableInternalTokens[token],
            "unknown token address"
        );
        _bank.tokenBalances[token][user] += amount;
        _bank.tokenBalances[token][TOTAL] += amount;
        _createNewAmountCheckpoint(user, token);
        _createNewAmountCheckpoint(TOTAL, token);

        Member storage member = members[user];
        if (member.delegateKey == address(0x0)) {
            member.flags = member.flags.setFlag(FlagHelper.Flag.EXISTS, true);
            member.delegateKey = user;
            memberAddressesByDelegatedKey[member.delegateKey] = user;
        }
    }

    function subtractFromBalance(
        address user,
        address token,
        uint256 amount
    ) public hasAccess(this, FlagHelper.Flag.SUB_FROM_BALANCE) {
        _subtractFromBalanceInternal(user, token, amount);
    }

    function _subtractFromBalanceInternal(
        address user,
        address token,
        uint256 amount
    ) internal {
        _bank.tokenBalances[token][user] -= amount;
        _bank.tokenBalances[token][TOTAL] -= amount;
    }

    function internalTransfer(
        address from,
        address to,
        address token,
        uint256 amount
    ) public hasAccess(this, FlagHelper.Flag.INTERNAL_TRANSFER) {
        _subtractFromBalanceInternal(from, token, amount);
        _addToBalanceInternal(to, token, amount);
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorAmount(
        address account,
        address tokenAddr,
        uint256 blockNumber
    ) external view returns (uint256) {
        require(
            blockNumber < block.number,
            "Uni::getPriorAmount: not yet determined"
        );

        uint32 nCheckpoints = _bank.numCheckpoints[tokenAddr][account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (
            _bank.checkpoints[tokenAddr][account][nCheckpoints - 1].fromBlock <=
            blockNumber
        ) {
            return
                _bank.checkpoints[tokenAddr][account][nCheckpoints - 1].amount;
        }

        // Next check implicit zero balance
        if (_bank.checkpoints[tokenAddr][account][0].fromBlock > blockNumber) {
            return 0;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = _bank
                .checkpoints[tokenAddr][account][center];
            if (cp.fromBlock == blockNumber) {
                return cp.amount;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return _bank.checkpoints[tokenAddr][account][lower].amount;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param memberAddr The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorDelegateKey(address memberAddr, uint256 blockNumber)
        external
        view
        returns (address)
    {
        require(
            blockNumber < block.number,
            "Uni::getPriorDelegateKey: not yet determined"
        );

        uint32 nCheckpoints = numCheckpoints[memberAddr];
        if (nCheckpoints == 0) {
            return memberAddr;
        }

        // First check most recent balance
        if (
            checkpoints[memberAddr][nCheckpoints - 1].fromBlock <= blockNumber
        ) {
            return checkpoints[memberAddr][nCheckpoints - 1].delegateKey;
        }

        // Next check implicit zero balance
        if (checkpoints[memberAddr][0].fromBlock > blockNumber) {
            return memberAddr;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            DelegateCheckpoint memory cp = checkpoints[memberAddr][center];
            if (cp.fromBlock == blockNumber) {
                return cp.delegateKey;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[memberAddr][lower].delegateKey;
    }

    function _createNewAmountCheckpoint(address member, address tokenAddr)
        internal
    {
        uint256 amount = _bank.tokenBalances[tokenAddr][member];
        uint32 srcRepNum = _bank.numCheckpoints[tokenAddr][member];
        _writeAmountCheckpoint(member, tokenAddr, srcRepNum, amount);
    }

    function _createNewDelegateCheckpoint(
        address member,
        address newDelegateKey
    ) internal {
        uint32 srcRepNum = numCheckpoints[member];
        _writeDelegateCheckpoint(member, srcRepNum, newDelegateKey);
    }

    function _writeDelegateCheckpoint(
        address member,
        uint32 nCheckpoints,
        address newDelegateKey
    ) internal {
        if (
            nCheckpoints > 0 &&
            checkpoints[member][nCheckpoints - 1].fromBlock == block.number
        ) {
            checkpoints[member][nCheckpoints - 1].delegateKey = newDelegateKey;
        } else {
            checkpoints[member][nCheckpoints] = DelegateCheckpoint(
                uint96(block.number),
                newDelegateKey
            );
            numCheckpoints[member] = nCheckpoints + 1;
        }
    }

    function _writeAmountCheckpoint(
        address member,
        address tokenAddr,
        uint32 nCheckpoints,
        uint256 _newAmount
    ) internal {
        require(_newAmount < type(uint160).max, "too big of a vote");
        uint160 newAmount = uint160(_newAmount);

        if (
            nCheckpoints > 0 &&
            _bank.checkpoints[tokenAddr][member][nCheckpoints - 1].fromBlock ==
            block.number
        ) {
            _bank.checkpoints[tokenAddr][member][nCheckpoints - 1]
                .amount = newAmount;
        } else {
            _bank.checkpoints[tokenAddr][member][nCheckpoints] = Checkpoint(
                uint96(block.number),
                newAmount
            );
            _bank.numCheckpoints[tokenAddr][member] = nCheckpoints + 1;
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
