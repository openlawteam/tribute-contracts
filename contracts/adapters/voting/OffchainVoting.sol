pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/bank/Bank.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../interfaces/IVoting.sol";
import "./Voting.sol";
import "./KickBadReporterAdapter.sol";
import "./OffchainVotingHash.sol";
import "./SnapshotProposalContract.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "../../helpers/GuildKickHelper.sol";
import "../../helpers/DaoHelper.sol";

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

contract OffchainVotingContract is IVoting, MemberGuard, AdapterGuard, Ownable {
    enum BadNodeError {
        OK,
        WRONG_PROPOSAL_ID,
        INVALID_CHOICE,
        AFTER_VOTING_PERIOD,
        BAD_SIGNATURE,
        INDEX_OUT_OF_BOUND
    }

    struct ProposalChallenge {
        address reporter;
        uint256 units;
    }

    event VoteResultSubmitted(
        address daoAddress,
        bytes32 proposalId,
        uint256 nbNo,
        uint256 nbYes,
        bytes32 resultRoot,
        address memberAddr
    );
    event ResultChallenged(
        address daoAddress,
        bytes32 proposalId,
        bytes32 resultRoot
    );

    uint256 private constant NB_CHOICES = 2;
    SnapshotProposalContract private _snapshotContract;
    OffchainVotingHashContract public ovHash;
    KickBadReporterAdapter private _handleBadReporterAdapter;

    string private constant ADAPTER_NAME = "OffchainVotingContract";
    bytes32 private constant VotingPeriod =
        keccak256("offchainvoting.votingPeriod");
    bytes32 private constant GracePeriod =
        keccak256("offchainvoting.gracePeriod");
    bytes32 private constant FallbackThreshold =
        keccak256("offchainvoting.fallbackThreshold");

    mapping(bytes32 => mapping(uint256 => uint256)) private retrievedStepsFlags;

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

    modifier onlyBadReporterAdapter() {
        require(msg.sender == address(_handleBadReporterAdapter), "only:hbra");
        _;
    }

    VotingContract private fallbackVoting;

    mapping(address => mapping(bytes32 => ProposalChallenge))
        private challengeProposals;
    mapping(address => mapping(bytes32 => Voting)) public votes;

    constructor(
        VotingContract _c,
        OffchainVotingHashContract _ovhc,
        SnapshotProposalContract _spc,
        KickBadReporterAdapter _hbra,
        address _owner
    ) {
        require(address(_c) != address(0x0), "voting contract");
        require(
            address(_ovhc) != address(0x0),
            "offchain voting hash proposal"
        );
        require(address(_spc) != address(0x0), "snapshot proposal");
        require(address(_hbra) != address(0x0), "handle bad reporter");
        fallbackVoting = _c;
        ovHash = _ovhc;
        _handleBadReporterAdapter = _hbra;
        _snapshotContract = _spc;
        Ownable(_owner);
    }

    function adminFailProposal(DaoRegistry dao, bytes32 proposalId)
        external
        onlyOwner
    {
        Voting storage vote = votes[address(dao)][proposalId];
        require(vote.startingTime > 0, "proposal has not started yet");

        vote.forceFailed = true;
    }

    function getAdapterName() external pure override returns (string memory) {
        return ADAPTER_NAME;
    }

    function getChallengeDetails(DaoRegistry dao, bytes32 proposalId)
        external
        view
        returns (uint256, address)
    {
        return (
            challengeProposals[address(dao)][proposalId].units,
            challengeProposals[address(dao)][proposalId].reporter
        );
    }

    function configureDao(
        DaoRegistry dao,
        uint256 votingPeriod,
        uint256 gracePeriod,
        uint256 fallbackThreshold
    ) external onlyAdapter(dao) {
        dao.setConfiguration(VotingPeriod, votingPeriod);
        dao.setConfiguration(GracePeriod, gracePeriod);
        dao.setConfiguration(FallbackThreshold, fallbackThreshold);
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
        bytes32 resultRoot,
        address reporter,
        OffchainVotingHashContract.VoteResultNode memory result,
        bytes memory rootSig
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        // slither-disable-next-line timestamp
        require(vote.snapshot > 0, "vote:not started");

        if (vote.resultRoot == bytes32(0) || vote.isChallenged) {
            // slither-disable-next-line timestamp
            require(
                _readyToSubmitResult(dao, vote, result.nbYes, result.nbNo),
                "vote:notReadyToSubmitResult"
            );
        }

        address memberAddr = dao.getAddressIfDelegated(reporter);
        require(isActiveMember(dao, memberAddr), "not active member");

        (address adapterAddress, ) = dao.proposals(proposalId);

        require(
            SignatureChecker.isValidSignatureNow(
                reporter,
                ovHash.hashResultRoot(dao, adapterAddress, resultRoot),
                rootSig
            ),
            "invalid sig"
        );

        require(
            MerkleProof.verify(
                result.proof,
                resultRoot,
                ovHash.nodeHash(dao, adapterAddress, result)
            ),
            "proof:bad"
        );

        // slither-disable-next-line timestamp
        require(
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
                .getPriorAmount(
                DaoHelper.TOTAL,
                DaoHelper.MEMBER_COUNT,
                vote.snapshot
            ) -
                1 ==
                result.index,
            "index:member_count mismatch"
        );

        // slither-disable-next-line timestamp
        require(
            vote.nbYes + vote.nbNo < result.nbYes + result.nbNo,
            "result weight too low"
        );

        if (
            vote.gracePeriodStartingTime == 0 ||
            vote.nbNo > vote.nbYes != result.nbNo > result.nbYes // check whether the new result changes the outcome
        ) {
            vote.gracePeriodStartingTime = block.timestamp;
        }

        vote.nbNo = result.nbNo;
        vote.nbYes = result.nbYes;
        vote.resultRoot = resultRoot;
        vote.reporter = memberAddr;
        vote.isChallenged = false;

        emit VoteResultSubmitted(
            address(dao),
            proposalId,
            result.nbNo,
            result.nbYes,
            resultRoot,
            memberAddr
        );
    }

    function requestStep(
        DaoRegistry dao,
        bytes32 proposalId,
        uint256 index
    ) external {
        address memberAddr = dao.getAddressIfDelegated(msg.sender);
        Voting storage vote = votes[address(dao)][proposalId];
        require(isActiveMember(dao, memberAddr), "not active member");
        uint256 currentFlag = retrievedStepsFlags[vote.resultRoot][index / 256];
        require(
            DaoHelper.getFlag(currentFlag, index % 256) == false,
            "step already requested"
        );

        retrievedStepsFlags[vote.resultRoot][index / 256] = DaoHelper.setFlag(
            currentFlag,
            index % 256,
            true
        );
        // slither-disable-next-line timestamp
        require(vote.stepRequested == 0, "other step already requested");
        require(
            voteResult(dao, proposalId) == VotingState.GRACE_PERIOD,
            "should be grace period"
        );
        vote.stepRequested = index;
        vote.gracePeriodStartingTime = block.timestamp;
    }

    /**
    This function marks the proposal as challenged if a step requested by a member never came.
    The rule is, if a step has been requested and we are after the grace period, then challenge it
     */
    function challengeMissingStep(DaoRegistry dao, bytes32 proposalId)
        external
    {
        Voting storage vote = votes[address(dao)][proposalId];
        uint256 gracePeriod = dao.getConfiguration(GracePeriod);
        //if the vote has started but the voting period has not passed yet, it's in progress
        require(vote.stepRequested > 0, "no step request");
        // slither-disable-next-line timestamp
        require(
            block.timestamp >= vote.gracePeriodStartingTime + gracePeriod,
            "grace period"
        );

        _challengeResult(dao, proposalId);
    }

    function provideStep(
        DaoRegistry dao,
        address adapterAddress,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external {
        Voting storage vote = votes[address(dao)][node.proposalId];
        // slither-disable-next-line timestamp
        require(vote.stepRequested == node.index, "wrong step provided");
        bytes32 hashCurrent = ovHash.nodeHash(dao, adapterAddress, node);
        // slither-disable-next-line timestamp
        require(
            MerkleProof.verify(node.proof, vote.resultRoot, hashCurrent),
            "proof:bad"
        );

        vote.stepRequested = 0;
        vote.gracePeriodStartingTime = block.timestamp;
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
        BankExtension bank =
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK));
        uint256 totalWeight =
            bank.getPriorAmount(
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

    function getSenderAddress(
        DaoRegistry dao,
        address actionId,
        bytes memory data,
        address
    ) external view override returns (address) {
        SnapshotProposalContract.ProposalMessage memory proposal =
            abi.decode(data, (SnapshotProposalContract.ProposalMessage));
        require(
            SignatureChecker.isValidSignatureNow(
                proposal.submitter,
                _snapshotContract.hashMessage(dao, actionId, proposal),
                proposal.sig
            ),
            "invalid sig"
        );

        return proposal.submitter;
    }

    function startNewVotingForProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) external override onlyAdapter(dao) {
        SnapshotProposalContract.ProposalMessage memory proposal =
            abi.decode(data, (SnapshotProposalContract.ProposalMessage));
        (bool success, uint256 blockNumber) =
            ovHash.stringToUint(proposal.payload.snapshot);
        require(success, "snapshot conversion error");
        BankExtension bank =
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK));

        address memberAddr = dao.getAddressIfDelegated(proposal.submitter);
        require(
            bank.balanceOf(memberAddr, DaoHelper.UNITS) > 0,
            "noActiveMember"
        );

        bytes32 proposalHash =
            _snapshotContract.hashMessage(dao, msg.sender, proposal);
        require(
            SignatureChecker.isValidSignatureNow(
                proposal.submitter,
                proposalHash,
                proposal.sig
            ),
            "invalid sig"
        );

        require(blockNumber <= block.number, "snapshot block in future");
        require(blockNumber > 0, "block number cannot be 0");

        votes[address(dao)][proposalId].startingTime = block.timestamp;
        votes[address(dao)][proposalId].snapshot = blockNumber;
    }

    function _fallbackVotingActivated(
        DaoRegistry dao,
        uint256 fallbackVotesCount
    ) internal view returns (bool) {
        return
            fallbackVotesCount >
            (dao.getNbMembers() * 100) /
                dao.getConfiguration(FallbackThreshold);
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
        public
        view
        override
        returns (VotingState state)
    {
        Voting storage vote = votes[address(dao)][proposalId];
        if (vote.startingTime == 0) {
            return VotingState.NOT_STARTED;
        }

        if (vote.forceFailed) {
            return VotingState.NOT_PASS;
        }

        if (_fallbackVotingActivated(dao, vote.fallbackVotesCount)) {
            return fallbackVoting.voteResult(dao, proposalId);
        }

        if (vote.isChallenged) {
            return VotingState.IN_PROGRESS;
        }

        if (vote.stepRequested > 0) {
            return VotingState.IN_PROGRESS;
        }

        uint256 votingPeriod = dao.getConfiguration(VotingPeriod);

        // If the vote has started but the voting period has not passed yet,
        // it's in progress
        // slither-disable-next-line timestamp
        if (block.timestamp < vote.startingTime + votingPeriod) {
            return VotingState.IN_PROGRESS;
        }

        uint256 gracePeriod = dao.getConfiguration(GracePeriod);

        // If no result have been submitted but we are before grace + voting period,
        // then the proposal is GRACE_PERIOD
        // slither-disable-next-line timestamp
        if (
            vote.gracePeriodStartingTime == 0 &&
            block.timestamp < vote.startingTime + gracePeriod + votingPeriod
        ) {
            return VotingState.GRACE_PERIOD;
        }

        // If the vote has started but the voting period has not passed yet, it's in progress
        // slither-disable-next-line timestamp
        if (block.timestamp < vote.gracePeriodStartingTime + gracePeriod) {
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

    function challengeBadFirstNode(
        DaoRegistry dao,
        bytes32 proposalId,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external {
        require(node.index == 0, "only first node");
        Voting storage vote = votes[address(dao)][proposalId];
        (address adapterAddress, ) = dao.proposals(proposalId);
        require(vote.resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = ovHash.nodeHash(dao, adapterAddress, node);
        //check that the step is indeed part of the result
        require(
            MerkleProof.verify(node.proof, vote.resultRoot, hashCurrent),
            "proof:bad"
        );

        (address actionId, ) = dao.proposals(proposalId);

        if (
            ovHash.checkStep(
                dao,
                actionId,
                node,
                vote.snapshot,
                OffchainVotingHashContract.VoteStepParams(0, 0, proposalId)
            )
        ) {
            _challengeResult(dao, proposalId);
        } else {
            revert("nothing to challenge");
        }
    }

    function challengeBadNode(
        DaoRegistry dao,
        bytes32 proposalId,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        BankExtension bank =
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK));
        if (
            getBadNodeError(
                dao,
                proposalId,
                false,
                vote.resultRoot,
                vote.snapshot,
                vote.gracePeriodStartingTime,
                bank.getPriorAmount(
                    DaoHelper.TOTAL,
                    DaoHelper.MEMBER_COUNT,
                    vote.snapshot
                ),
                node
            ) != BadNodeError.OK
        ) {
            _challengeResult(dao, proposalId);
        } else {
            revert("nothing to challenge");
        }
    }

    function _isValidChoice(uint256 choice) internal pure returns (bool) {
        return choice > 0 && choice < NB_CHOICES + 1;
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
        (address adapterAddress, ) = dao.proposals(proposalId);
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = ovHash.nodeHash(dao, adapterAddress, node);
        //check that the step is indeed part of the result
        require(
            MerkleProof.verify(node.proof, resultRoot, hashCurrent),
            "proof:bad"
        );
        if (node.index >= nbMembers) {
            return BadNodeError.INDEX_OUT_OF_BOUND;
        }
        address account = dao.getMemberAddress(node.index);
        //return 1 if yes, 2 if no and 0 if the vote is incorrect
        address voter = dao.getPriorDelegateKey(account, blockNumber);

        (address actionId, ) = dao.proposals(proposalId);

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

        return BadNodeError.OK;
    }

    function challengeBadStep(
        DaoRegistry dao,
        bytes32 proposalId,
        OffchainVotingHashContract.VoteResultNode memory nodePrevious,
        OffchainVotingHashContract.VoteResultNode memory nodeCurrent
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;

        (address adapterAddress, ) = dao.proposals(proposalId);
        require(resultRoot != bytes32(0), "no result!");
        bytes32 hashCurrent = ovHash.nodeHash(dao, adapterAddress, nodeCurrent);
        bytes32 hashPrevious =
            ovHash.nodeHash(dao, adapterAddress, nodePrevious);
        require(
            MerkleProof.verify(nodeCurrent.proof, resultRoot, hashCurrent),
            "proof invalid for current"
        );
        require(
            MerkleProof.verify(nodePrevious.proof, resultRoot, hashPrevious),
            "proof invalid for previous"
        );

        require(nodeCurrent.index == nodePrevious.index + 1, "not consecutive");

        (address actionId, ) = dao.proposals(proposalId);
        OffchainVotingHashContract.VoteStepParams memory params =
            OffchainVotingHashContract.VoteStepParams(
                nodePrevious.nbYes,
                nodePrevious.nbNo,
                proposalId
            );
        if (
            ovHash.checkStep(dao, actionId, nodeCurrent, vote.snapshot, params)
        ) {
            _challengeResult(dao, proposalId);
        } else {
            revert("nothing to challenge");
        }
    }

    function requestFallback(DaoRegistry dao, bytes32 proposalId)
        external
        onlyMember(dao)
    {
        // slither-disable-next-line timestamp
        require(
            votes[address(dao)][proposalId].fallbackVotes[msg.sender] == false,
            "fallback vote duplicate"
        );
        votes[address(dao)][proposalId].fallbackVotes[msg.sender] = true;
        votes[address(dao)][proposalId].fallbackVotesCount += 1;

        if (
            _fallbackVotingActivated(
                dao,
                votes[address(dao)][proposalId].fallbackVotesCount
            )
        ) {
            fallbackVoting.startNewVotingForProposal(dao, proposalId, "");
        }
    }

    function sponsorChallengeProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address sponsoredBy
    ) external onlyBadReporterAdapter {
        dao.sponsorProposal(proposalId, sponsoredBy, address(this));
    }

    function processChallengeProposal(DaoRegistry dao, bytes32 proposalId)
        external
        onlyBadReporterAdapter
    {
        dao.processProposal(proposalId);
    }

    // slither-disable-next-line reentrancy-events
    function _challengeResult(DaoRegistry dao, bytes32 proposalId) internal {
        BankExtension bank =
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK));

        votes[address(dao)][proposalId].isChallenged = true;
        address challengedReporter = votes[address(dao)][proposalId].reporter;
        bytes32 challengeProposalId =
            keccak256(
                abi.encodePacked(
                    proposalId,
                    votes[address(dao)][proposalId].resultRoot
                )
            );

        challengeProposals[address(dao)][
            challengeProposalId
        ] = ProposalChallenge(
            challengedReporter,
            bank.balanceOf(challengedReporter, DaoHelper.UNITS)
        );

        GuildKickHelper.lockMemberTokens(dao, challengedReporter);

        dao.submitProposal(challengeProposalId);

        emit ResultChallenged(
            address(dao),
            proposalId,
            votes[address(dao)][proposalId].resultRoot
        );
    }
}
