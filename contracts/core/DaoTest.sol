pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../adapters/interfaces/IOnboarding.sol";
import "../helpers/FlagHelper128.sol";
import "../utils/SafeMath.sol";
import "./DaoConstants.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/AdapterGuard.sol";
import "../utils/IERC20.sol";


contract DaoTest is DaoConstants, AdapterGuard {

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
        member.flags = 1;
        member.delegateKey = memberAddr;
        memberAddressesByDelegatedKey[memberAddr] = memberAddr;
        _unsafeAddToBalance(memberAddr, SHARES, 1);
    }

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
                uint256 srcRepNew = srcRepOld - amount;
                _writeCheckpoint(srcRep, srcRepNum, srcRepNew);
            }

            if (dstRep != address(0)) {
                uint32 dstRepNum = numCheckpoints[dstRep];
                uint256 dstRepOld = dstRepNum > 0
                    ? checkpoints[dstRep][dstRepNum - 1].votes
                    : 0;
                uint256 dstRepNew = dstRepOld + amount;
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
}