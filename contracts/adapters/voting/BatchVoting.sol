pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/bank/Bank.sol";
import "../../core/DaoConstants.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../interfaces/IVoting.sol";
import "../../utils/Signatures.sol";
import "./Voting.sol";
import "./SnapshotProposalContract.sol";

/**
MIT License

Copyright (c) 2021 Openlaw

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

contract BatchVotingContract is
    IVoting,
    DaoConstants,
    MemberGuard,
    AdapterGuard,
    Signatures
{
    struct Voting {
        uint256 snapshot;
        uint256 nbYes;
        uint256 nbNo;
        address actionId;
        bytes32 proposalHash;
        uint256 startingTime;
        uint256 gracePeriodStartingTime;
    }

    struct VoteEntry {
        SnapshotProposalContract.VoteMessage vote;
        address memberAddress;
        bytes sig;
    }

    event NewVoteResult(
        address dao,
        address actionId,
        uint256 nbYes,
        uint256 nbNo
    );

    string public constant ADAPTER_NAME = "BatchVotingContract";

    SnapshotProposalContract private _snapshotContract;

    bytes32 constant _VOTING_PERIOD = keccak256("batchvoting.votingPeriod");
    bytes32 constant _GRACE_PERIOD = keccak256("batchvoting.gracePeriod");

    mapping(address => mapping(bytes32 => Voting)) public votingSessions;

    constructor(SnapshotProposalContract _spc) {
        _snapshotContract = _spc;
    }

    function configureDao(
        DaoRegistry dao,
        uint256 votingPeriod,
        uint256 gracePeriod
    ) external onlyAdapter(dao) {
        dao.setConfiguration(_VOTING_PERIOD, votingPeriod);
        dao.setConfiguration(_GRACE_PERIOD, gracePeriod);
    }

    /** 
        What needs to be checked before submitting a vote result
        - if the grace period has ended, do nothing
        - if it's the first result, is this a right time to submit it?
             * is the diff between nbYes and nbNo +50% of the votes ?
             * is this after the voting period ?
        - if we already have a result that has been challenged
            * same as if there were no result yet

        - if we already have a result that has not been challenged
            * is the new one heavier than the previous one ?
    **/

    function submitVoteResult(
        DaoRegistry dao,
        bytes32 proposalId,
        VoteEntry[] memory votes
    ) external {
        Voting storage vote = votingSessions[address(dao)][proposalId];
        require(vote.snapshot > 0, "vote:not started");

        (uint256 nbYes, uint256 nbNo) = processVotes(dao, proposalId, votes);
        //if the new result has more weight than the previous one
        if (nbYes + nbNo > vote.nbYes + vote.nbNo) {
            if (
                vote.gracePeriodStartingTime == 0 ||
                ((nbYes > nbNo) != (vote.nbYes > nbNo))
            ) {
                vote.gracePeriodStartingTime = block.timestamp;
            }

            if (
                block.timestamp <
                vote.startingTime + dao.getConfiguration(_VOTING_PERIOD) ||
                block.timestamp <
                vote.gracePeriodStartingTime +
                    dao.getConfiguration(_GRACE_PERIOD)
            ) {
                vote.nbYes = nbYes;
                vote.nbNo = nbNo;

                emit NewVoteResult(address(dao), vote.actionId, nbYes, nbNo);
            }
        }
    }

    function getAdapterName() external pure override returns (string memory) {
        return ADAPTER_NAME;
    }

    function processVotes(
        DaoRegistry dao,
        bytes32 proposalId,
        VoteEntry[] memory entries
    ) public view returns (uint256 nbYes, uint256 nbNo) {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        Voting storage voteState = votingSessions[address(dao)][proposalId];
        uint256 snapshot = voteState.snapshot;
        address actionId = voteState.actionId;
        address previousMember = address(0x0);
        bytes32 proposalHash = voteState.proposalHash;

        for (uint256 i = 0; i < entries.length; i++) {
            VoteEntry memory entry = entries[i];

            uint256 weight = validateVote(
                dao,
                bank,
                actionId,
                snapshot,
                proposalHash,
                previousMember,
                entry
            );

            previousMember = entry.memberAddress;

            if (entry.vote.payload.choice == 1) {
                nbYes += weight;
            } else {
                nbNo += weight;
            }
        }
    }

    function validateVote(
        DaoRegistry dao,
        BankExtension bank,
        address actionId,
        uint256 snapshot,
        bytes32 proposalId,
        address previousAddress,
        VoteEntry memory entry
    ) public view returns (uint256) {
        bytes32 hashVote = _snapshotContract.hashVote(
            dao,
            actionId,
            entry.vote
        );

        address addr = ECDSA.recover(hashVote, entry.sig);

        address delegateKey = dao.getPriorDelegateKey(
            entry.memberAddress,
            snapshot
        );

        require(entry.memberAddress > previousAddress, "unsorted members");
        require(addr == delegateKey, "signing key mismatch");
        require(
            entry.vote.payload.proposalId == proposalId,
            "wrong proposal vote"
        );

        return bank.getPriorAmount(entry.memberAddress, UNITS, snapshot);
    }

    function _stringToUint(string memory s)
        internal
        pure
        returns (bool success, uint256 result)
    {
        bytes memory b = bytes(s);
        result = 0;
        success = false;
        for (uint256 i = 0; i < b.length; i++) {
            if (uint8(b[i]) >= 48 && uint8(b[i]) <= 57) {
                result = result * 10 + (uint8(b[i]) - 48);
                success = true;
            } else {
                result = 0;
                success = false;
                break;
            }
        }
        return (success, result);
    }

    function getSenderAddress(
        DaoRegistry dao,
        address actionId,
        bytes memory data,
        address
    ) external view override returns (address) {
        SnapshotProposalContract.ProposalMessage memory proposal = abi.decode(
            data,
            (SnapshotProposalContract.ProposalMessage)
        );

        return
            ECDSA.recover(
                _snapshotContract.hashMessage(dao, actionId, proposal),
                proposal.sig
            );
    }

    function startNewVotingForProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) public override onlyAdapter(dao) {
        SnapshotProposalContract.ProposalMessage memory proposal = abi.decode(
            data,
            (SnapshotProposalContract.ProposalMessage)
        );
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));

        (bool success, uint256 blockNumber) = _stringToUint(
            proposal.payload.snapshot
        );
        require(success, "snapshot conversion error");

        bytes32 proposalHash = _snapshotContract.hashMessage(
            dao,
            msg.sender,
            proposal
        );
        address addr = ECDSA.recover(proposalHash, proposal.sig);
        address memberAddr = dao.getAddressIfDelegated(addr);
        require(bank.balanceOf(memberAddr, UNITS) > 0, "noActiveMember");
        require(
            blockNumber < block.number,
            "snapshot block number should not be in the future"
        );
        require(blockNumber > 0, "block number cannot be 0");

        votingSessions[address(dao)][proposalId].actionId = msg.sender;
        votingSessions[address(dao)][proposalId].startingTime = block.timestamp;
        votingSessions[address(dao)][proposalId].snapshot = blockNumber;
        votingSessions[address(dao)][proposalId].proposalHash = proposalHash;
    }

    /**
    possible results here:
    0: has not started
    1: tie
    2: pass
    3: not pass
    4: in progress
     */
    function voteResult(DaoRegistry dao, bytes32 proposalId)
        external
        view
        override
        returns (VotingState state)
    {
        Voting storage vote = votingSessions[address(dao)][proposalId];
        if (vote.startingTime == 0) {
            return VotingState.NOT_STARTED;
        }

        if (
            block.timestamp <
            vote.startingTime + dao.getConfiguration(_VOTING_PERIOD)
        ) {
            return VotingState.IN_PROGRESS;
        }

        if (
            block.timestamp <
            vote.gracePeriodStartingTime + dao.getConfiguration(_GRACE_PERIOD)
        ) {
            return VotingState.GRACE_PERIOD;
        }

        if (vote.nbYes > vote.nbNo) {
            return VotingState.PASS;
        }
        if (vote.nbYes < vote.nbNo) {
            return VotingState.NOT_PASS;
        }

        return VotingState.TIE;
    }
}
