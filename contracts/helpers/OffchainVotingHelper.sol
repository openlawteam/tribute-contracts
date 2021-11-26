pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";

import "../adapters/interfaces/IVoting.sol";

import "../adapters/voting/Voting.sol";

import "../adapters/voting/OffchainVotingHash.sol";

import "../adapters/voting/SnapshotProposalContract.sol";

import "./GovernanceHelper.sol";

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

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
library OffchainVotingHelper {
    uint256 private constant NB_CHOICES = 2;
    bytes32 public constant VotingPeriod =
        keccak256("offchainvoting.votingPeriod");
    bytes32 public constant GracePeriod =
        keccak256("offchainvoting.gracePeriod");
    bytes32 public constant FallbackThreshold =
        keccak256("offchainvoting.fallbackThreshold");

    struct Voting {
        uint256 snapshot;
        address reporter;
        bytes32 resultRoot;
        uint256 nbYes;
        uint256 nbNo;
        uint256 startingTime;
        uint256 gracePeriodStartingTime;
        bool isChallenged;
        uint256 stepRequested;
        bool forceFailed;
        mapping(address => bool) fallbackVotes;
        uint256 fallbackVotesCount;
    }

    enum BadNodeError {
        OK,
        WRONG_PROPOSAL_ID,
        INVALID_CHOICE,
        AFTER_VOTING_PERIOD,
        BAD_SIGNATURE,
        INDEX_OUT_OF_BOUND,
        VOTE_NOT_ALLOWED
    }

    function _getBadNodeError(
        DaoRegistry dao,
        bytes32 proposalId,
        bool submitNewVote,
        bytes32 resultRoot,
        uint256 blockNumber,
        uint256 gracePeriodStartingTime,
        uint256 nbMembers,
        OffchainVotingHashContract.VoteResultNode memory node,
        OffchainVotingHashContract ovHash
    ) internal view returns (BadNodeError) {
        (address actionId, ) = dao.proposals(proposalId);
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = ovHash.nodeHash(dao, actionId, node);
        //check that the step is indeed part of the result
        require(
            MerkleProof.verify(node.proof, resultRoot, hashCurrent),
            "proof:bad"
        );
        if (node.index >= nbMembers) {
            return BadNodeError.INDEX_OUT_OF_BOUND;
        }
        //return 1 if yes, 2 if no and 0 if the vote is incorrect
        address voter = dao.getPriorDelegateKey(
            dao.getMemberAddress(node.index),
            blockNumber
        );

        //invalid choice
        if (
            (node.sig.length == 0 && node.choice != 0) || // no vote
            (node.sig.length > 0 && !_isValidChoice(node.choice))
        ) {
            return BadNodeError.INVALID_CHOICE;
        }

        //invalid proposal hash
        if (node.proposalId != proposalId) {
            return BadNodeError.WRONG_PROPOSAL_ID;
        }

        //has voted outside of the voting time
        if (!submitNewVote && node.timestamp > gracePeriodStartingTime) {
            return BadNodeError.AFTER_VOTING_PERIOD;
        }

        //bad signature
        if (
            node.sig.length > 0 && // a vote has happened
            !ovHash.hasVoted(
                dao,
                actionId,
                voter,
                node.timestamp,
                node.proposalId,
                node.choice,
                node.sig
            )
        ) {
            return BadNodeError.BAD_SIGNATURE;
        }

        // If the weight is 0, the member has no permission to vote
        if (
            GovernanceHelper.getVotingWeight(
                dao,
                voter,
                node.proposalId,
                blockNumber
            ) == 0
        ) {
            return BadNodeError.VOTE_NOT_ALLOWED;
        }

        return BadNodeError.OK;
    }

    function _getSenderAddress(
        DaoRegistry dao,
        address actionId,
        bytes memory data,
        address,
        SnapshotProposalContract snapshotContract
    ) internal view returns (address) {
        SnapshotProposalContract.ProposalMessage memory proposal = abi.decode(
            data,
            (SnapshotProposalContract.ProposalMessage)
        );
        require(
            SignatureChecker.isValidSignatureNow(
                proposal.submitter,
                snapshotContract.hashMessage(dao, actionId, proposal),
                proposal.sig
            ),
            "invalid sig"
        );

        return proposal.submitter;
    }

    function _isValidChoice(uint256 choice) internal pure returns (bool) {
        return choice > 0 && choice < NB_CHOICES + 1;
    }

    function _fallbackVotingActivated(
        DaoRegistry dao,
        uint256 fallbackVotesCount
    ) internal view returns (bool) {
        return
            fallbackVotesCount >
            (dao.getNbMembers() * 100) /
                dao.getConfiguration(OffchainVotingHelper.FallbackThreshold);
    }

    /**
    possible results here:
    0: has not started
    1: tie
    2: pass
    3: not pass
    4: in progress
     */
    function _getVoteResult(
        DaoRegistry dao,
        bytes32 proposalId,
        OffchainVotingHelper.Voting storage vote,
        VotingContract fallbackVoting
    ) public view returns (IVoting.VotingState state) {
        if (vote.startingTime == 0) {
            return IVoting.VotingState.NOT_STARTED;
        }

        if (vote.forceFailed) {
            return IVoting.VotingState.NOT_PASS;
        }

        if (_fallbackVotingActivated(dao, vote.fallbackVotesCount)) {
            return fallbackVoting.voteResult(dao, proposalId);
        }

        if (vote.isChallenged) {
            return IVoting.VotingState.IN_PROGRESS;
        }

        if (vote.stepRequested > 0) {
            return IVoting.VotingState.IN_PROGRESS;
        }

        uint256 votingPeriod = dao.getConfiguration(VotingPeriod);

        // If the vote has started but the voting period has not passed yet,
        // it's in progress
        // slither-disable-next-line timestamp
        if (block.timestamp < vote.startingTime + votingPeriod) {
            return IVoting.VotingState.IN_PROGRESS;
        }

        uint256 gracePeriod = dao.getConfiguration(GracePeriod);

        // If no result have been submitted but we are before grace + voting period,
        // then the proposal is GRACE_PERIOD
        // slither-disable-next-line timestamp
        if (
            vote.gracePeriodStartingTime == 0 &&
            block.timestamp < vote.startingTime + gracePeriod + votingPeriod
        ) {
            return IVoting.VotingState.GRACE_PERIOD;
        }

        // If the vote has started but the voting period has not passed yet, it's in progress
        // slither-disable-next-line timestamp
        if (block.timestamp < vote.gracePeriodStartingTime + gracePeriod) {
            return IVoting.VotingState.GRACE_PERIOD;
        }

        if (vote.nbYes > vote.nbNo) {
            return IVoting.VotingState.PASS;
        }
        if (vote.nbYes < vote.nbNo) {
            return IVoting.VotingState.NOT_PASS;
        }

        return IVoting.VotingState.TIE;
    }

    function _readyToSubmitResult(
        DaoRegistry dao,
        Voting storage vote,
        uint256 nbYes,
        uint256 nbNo
    ) internal view returns (bool) {
        if (vote.forceFailed) {
            return false;
        }
        BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
        uint256 totalWeight = bank.getPriorAmount(
            DaoHelper.TOTAL,
            DaoHelper.UNITS,
            vote.snapshot
        );
        uint256 unvotedWeights = totalWeight - nbYes - nbNo;

        uint256 diff;
        if (nbYes > nbNo) {
            diff = nbYes - nbNo;
        } else {
            diff = nbNo - nbYes;
        }

        if (diff > unvotedWeights) {
            return true;
        }

        uint256 votingPeriod = dao.getConfiguration(VotingPeriod);
        // slither-disable-next-line timestamp
        return vote.startingTime + votingPeriod <= block.timestamp;
    }
}
