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
contract OffchainVotingHelperContract {
    uint256 private constant NB_CHOICES = 2;
    bytes32 public constant VotingPeriod =
        keccak256("offchainvoting.votingPeriod");
    bytes32 public constant GracePeriod =
        keccak256("offchainvoting.gracePeriod");
    bytes32 public constant FallbackThreshold =
        keccak256("offchainvoting.fallbackThreshold");

    enum BadNodeError {
        OK,
        WRONG_PROPOSAL_ID,
        INVALID_CHOICE,
        AFTER_VOTING_PERIOD,
        BAD_SIGNATURE,
        INDEX_OUT_OF_BOUND,
        VOTE_NOT_ALLOWED
    }

    OffchainVotingHashContract private _ovHash;

    constructor(OffchainVotingHashContract _contract) {
        _ovHash = _contract;
    }

    function checkMemberCount(
        DaoRegistry dao,
        uint256 resultIndex,
        uint256 blockNumber
    ) external view returns (uint256 membersCount) {
        membersCount = BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
            .getPriorAmount(
                DaoHelper.TOTAL,
                DaoHelper.MEMBER_COUNT,
                blockNumber
            );
        // slither-disable-next-line timestamp
        require(membersCount - 1 == resultIndex, "index:member_count mismatch");
    }

    function checkBadNodeError(
        DaoRegistry dao,
        bytes32 proposalId,
        bool submitNewVote,
        bytes32 resultRoot,
        uint256 blockNumber,
        uint256 gracePeriodStartingTime,
        uint256 nbMembers,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external view {
        require(
            getBadNodeError(
                dao,
                proposalId,
                submitNewVote,
                resultRoot,
                blockNumber,
                gracePeriodStartingTime,
                nbMembers,
                node
            ) == OffchainVotingHelperContract.BadNodeError.OK,
            "bad node"
        );
    }

    function getBadNodeError(
        DaoRegistry dao,
        bytes32 proposalId,
        bool submitNewVote,
        bytes32 resultRoot,
        uint256 blockNumber,
        uint256 gracePeriodStartingTime,
        uint256 nbMembers,
        OffchainVotingHashContract.VoteResultNode memory node
    ) public view returns (BadNodeError) {
        (address actionId, ) = dao.proposals(proposalId);
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = _ovHash.nodeHash(dao, actionId, node);
        //check that the step is indeed part of the result
        require(
            MerkleProof.verify(node.proof, resultRoot, hashCurrent),
            "proof:bad"
        );
        if (node.index >= nbMembers) {
            return BadNodeError.INDEX_OUT_OF_BOUND;
        }

        address memberAddr = dao.getMemberAddress(node.index);

        //invalid choice
        if (
            (node.sig.length == 0 && node.choice != 0) || // no vote
            (node.sig.length > 0 && !isValidChoice(node.choice))
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
            !_ovHash.hasVoted(
                dao,
                actionId,
                dao.getPriorDelegateKey(memberAddr, blockNumber),
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
                memberAddr, // always check the weight of the member, not the delegate
                node.proposalId,
                blockNumber
            ) == 0
        ) {
            return BadNodeError.VOTE_NOT_ALLOWED;
        }

        return BadNodeError.OK;
    }

    function getSenderAddress(
        DaoRegistry dao,
        address actionId,
        bytes memory data,
        address,
        SnapshotProposalContract snapshotContract
    ) external view returns (address) {
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

    function isValidChoice(uint256 choice) public pure returns (bool) {
        return choice > 0 && choice < NB_CHOICES + 1;
    }

    function isFallbackVotingActivated(
        DaoRegistry dao,
        uint256 fallbackVotesCount
    ) external view returns (bool) {
        return
            fallbackVotesCount >
            (dao.getNbMembers() * dao.getConfiguration(FallbackThreshold)) /
                100;
    }

    function isReadyToSubmitResult(
        DaoRegistry dao,
        bool forceFailed,
        uint256 snapshot,
        uint256 startingTime,
        uint256 votingPeriod,
        uint256 nbYes,
        uint256 nbNo,
        uint256 blockTs
    ) external view returns (bool) {
        if (forceFailed) {
            return false;
        }

        uint256 diff;
        if (nbYes > nbNo) {
            diff = nbYes - nbNo;
        } else {
            diff = nbNo - nbYes;
        }

        uint256 totalWeight = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        ).getPriorAmount(DaoHelper.TOTAL, DaoHelper.UNITS, snapshot);
        uint256 unvotedWeights = totalWeight - nbYes - nbNo;
        if (diff > unvotedWeights) {
            return true;
        }

        // slither-disable-next-line timestamp
        return startingTime + votingPeriod <= blockTs;
    }

    function getVoteResult(
        uint256 startingTime,
        bool forceFailed,
        bool isChallenged,
        uint256 stepRequested,
        uint256 gracePeriodStartingTime,
        uint256 nbYes,
        uint256 nbNo,
        uint256 votingPeriod, // dao.getConfiguration(VotingPeriod)
        uint256 gracePeriod //dao.getConfiguration(GracePeriod)
    ) external view returns (IVoting.VotingState state) {
        if (startingTime == 0) {
            return IVoting.VotingState.NOT_STARTED;
        }

        if (forceFailed) {
            return IVoting.VotingState.NOT_PASS;
        }

        if (isChallenged) {
            return IVoting.VotingState.IN_PROGRESS;
        }

        if (stepRequested > 0) {
            return IVoting.VotingState.IN_PROGRESS;
        }

        // If the vote has started but the voting period has not passed yet,
        // it's in progress
        // slither-disable-next-line timestamp
        if (block.timestamp < startingTime + votingPeriod) {
            return IVoting.VotingState.IN_PROGRESS;
        }

        // If no result have been submitted but we are before grace + voting period,
        // then the proposal is GRACE_PERIOD
        // slither-disable-next-line timestamp
        if (
            gracePeriodStartingTime == 0 &&
            block.timestamp < startingTime + gracePeriod + votingPeriod
        ) {
            return IVoting.VotingState.GRACE_PERIOD;
        }

        // If the vote has started but the voting period has not passed yet, it's in progress
        // slither-disable-next-line timestamp
        if (block.timestamp < gracePeriodStartingTime + gracePeriod) {
            return IVoting.VotingState.GRACE_PERIOD;
        }

        if (nbYes > nbNo) {
            return IVoting.VotingState.PASS;
        }
        if (nbYes < nbNo) {
            return IVoting.VotingState.NOT_PASS;
        }

        return IVoting.VotingState.TIE;
    }
}
