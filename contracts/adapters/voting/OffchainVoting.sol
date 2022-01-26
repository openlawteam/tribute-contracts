pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/bank/Bank.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../modifiers/Reimbursable.sol";
import "../interfaces/IVoting.sol";
import "./Voting.sol";
import "./KickBadReporterAdapter.sol";
import "./OffchainVotingHash.sol";
import "./SnapshotProposalContract.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "../../helpers/DaoHelper.sol";
import "../../helpers/GuildKickHelper.sol";
import "../../helpers/OffchainVotingHelper.sol";

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

contract OffchainVotingContract is
    IVoting,
    MemberGuard,
    AdapterGuard,
    Ownable,
    Reimbursable
{
    struct ProposalChallenge {
        address reporter;
        uint256 units;
    }

    struct Voting {
        uint256 snapshot;
        address reporter;
        bytes32 resultRoot;
        uint256 nbYes;
        uint256 nbNo;
        uint64 startingTime;
        uint64 gracePeriodStartingTime;
        bool isChallenged;
        bool forceFailed;
        uint256 nbMembers;
        uint256 stepRequested;
        uint256 fallbackVotesCount;
        mapping(address => bool) fallbackVotes;
    }

    struct VotingDetails {
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
        uint256 fallbackVotesCount;
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

    bytes32 public constant VotingPeriod =
        keccak256("offchainvoting.votingPeriod");
    bytes32 public constant GracePeriod =
        keccak256("offchainvoting.gracePeriod");
    bytes32 public constant FallbackThreshold =
        keccak256("offchainvoting.fallbackThreshold");

    SnapshotProposalContract private _snapshotContract;
    OffchainVotingHashContract public ovHash;
    OffchainVotingHelperContract private _ovHelper;
    KickBadReporterAdapter private _handleBadReporterAdapter;

    string private constant ADAPTER_NAME = "OffchainVotingContract";

    mapping(bytes32 => mapping(uint256 => uint256)) private retrievedStepsFlags;

    modifier onlyBadReporterAdapter() {
        require(msg.sender == address(_handleBadReporterAdapter), "only:hbra");
        _;
    }

    VotingContract private fallbackVoting;

    mapping(address => mapping(bytes32 => ProposalChallenge))
        private challengeProposals;
    mapping(address => mapping(bytes32 => Voting)) private votes;

    constructor(
        VotingContract _c,
        OffchainVotingHashContract _ovhc,
        OffchainVotingHelperContract _ovhelper,
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
        _ovHelper = _ovhelper;
        Ownable(_owner);
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

    function getVote(DaoRegistry dao, bytes32 proposalId)
        external
        view
        returns (VotingDetails memory)
    {
        Voting storage vote = votes[address(dao)][proposalId];

        return
            VotingDetails(
                vote.snapshot,
                vote.reporter,
                vote.resultRoot,
                vote.nbYes,
                vote.nbNo,
                vote.startingTime,
                vote.gracePeriodStartingTime,
                vote.isChallenged,
                vote.stepRequested,
                vote.forceFailed,
                vote.fallbackVotesCount
            );
    }

    // slither-disable-next-line reentrancy-benign
    function adminFailProposal(DaoRegistry dao, bytes32 proposalId)
        external
        onlyOwner
        reentrancyGuard(dao)
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

    function getSenderAddress(
        DaoRegistry dao,
        address actionId,
        bytes memory data,
        address addr
    ) external view override returns (address) {
        return
            _ovHelper.getSenderAddress(
                dao,
                actionId,
                data,
                addr,
                _snapshotContract
            );
    }

    /*
     * @notice Returns the voting result of a given proposal.
     * possible results:
     * 0: has not started
     * 1: tie
     * 2: pass
     * 3: not pass
     * 4: in progress
     */
    function voteResult(DaoRegistry dao, bytes32 proposalId)
        public
        view
        override
        returns (VotingState state)
    {
        Voting storage vote = votes[address(dao)][proposalId];
        if (_ovHelper.isFallbackVotingActivated(dao, vote.fallbackVotesCount)) {
            return fallbackVoting.voteResult(dao, proposalId);
        }

        return
            _ovHelper.getVoteResult(
                vote.startingTime,
                vote.forceFailed,
                vote.isChallenged,
                vote.stepRequested,
                vote.gracePeriodStartingTime,
                vote.nbYes,
                vote.nbNo,
                dao.getConfiguration(VotingPeriod),
                dao.getConfiguration(GracePeriod)
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
    ) external view returns (OffchainVotingHelperContract.BadNodeError) {
        return
            _ovHelper.getBadNodeError(
                dao,
                proposalId,
                submitNewVote,
                resultRoot,
                blockNumber,
                gracePeriodStartingTime,
                nbMembers,
                node
            );
    }

    /*
     * Saves the vote result to the storage if resultNode (vote) is valid.
     * A valid vote node must satisfy all the conditions in the function,
     * so it can be stored.
     * What needs to be checked before submitting a vote result:
     * - if the grace period has ended, do nothing
     * - if it's the first result (vote), is this a right time to submit it?
     * - is the diff between nbYes and nbNo +50% of the votes ?
     * - is this after the voting period ?
     * - if we already have a result that has been challenged
     *   - same as if there were no result yet
     * - if we already have a result that has not been challenged
     *   - is the new one heavier than the previous one?
     */
    // The function is protected against reentrancy with the reentrancyGuard
    // slither-disable-next-line reentrancy-events,reentrancy-benign,reentrancy-no-eth
    function submitVoteResult(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes32 resultRoot,
        address reporter,
        OffchainVotingHashContract.VoteResultNode memory result,
        bytes memory rootSig
    ) external reimbursable(dao) {
        Voting storage vote = votes[address(dao)][proposalId];
        // slither-disable-next-line timestamp
        require(vote.snapshot > 0, "vote:not started");

        if (vote.resultRoot == bytes32(0) || vote.isChallenged) {
            require(
                _ovHelper.isReadyToSubmitResult(
                    dao,
                    vote.forceFailed,
                    vote.snapshot,
                    vote.startingTime,
                    dao.getConfiguration(VotingPeriod),
                    result.nbYes,
                    result.nbNo,
                    block.timestamp
                ),
                "vote:notReadyToSubmitResult"
            );
        }

        require(
            vote.gracePeriodStartingTime == 0 ||
                vote.gracePeriodStartingTime +
                    dao.getConfiguration(VotingPeriod) <=
                block.timestamp,
            "graceperiod finished!"
        );

        require(isActiveMember(dao, reporter), "not active member");

        uint256 membersCount = _ovHelper.checkMemberCount(
            dao,
            result.index,
            vote.snapshot
        );

        _ovHelper.checkBadNodeError(
            dao,
            proposalId,
            true,
            resultRoot,
            vote.snapshot,
            0,
            membersCount,
            result
        );

        (address adapterAddress, ) = dao.proposals(proposalId);
        require(
            SignatureChecker.isValidSignatureNow(
                reporter,
                ovHash.hashResultRoot(dao, adapterAddress, resultRoot),
                rootSig
            ),
            "invalid sig"
        );

        _verifyNode(dao, adapterAddress, result, resultRoot);

        // slither-disable-next-line timestamp
        require(
            vote.nbYes + vote.nbNo < result.nbYes + result.nbNo,
            "result weight too low"
        );

        if (
            vote.gracePeriodStartingTime == 0 ||
            // check whether the new result changes the outcome
            vote.nbNo > vote.nbYes != result.nbNo > result.nbYes
        ) {
            vote.gracePeriodStartingTime = uint64(block.timestamp);
        }
        vote.nbNo = result.nbNo;
        vote.nbYes = result.nbYes;
        vote.resultRoot = resultRoot;
        vote.reporter = dao.getAddressIfDelegated(reporter);
        vote.isChallenged = false;
        vote.nbMembers = membersCount;

        emit VoteResultSubmitted(
            address(dao),
            proposalId,
            result.nbNo,
            result.nbYes,
            resultRoot,
            vote.reporter
        );
    }

    // slither-disable-next-line reentrancy-benign
    function requestStep(
        DaoRegistry dao,
        bytes32 proposalId,
        uint256 index
    ) external reimbursable(dao) onlyMember(dao) {
        Voting storage vote = votes[address(dao)][proposalId];
        require(index < vote.nbMembers, "index out of bound");
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
        vote.gracePeriodStartingTime = uint64(block.timestamp);
    }

    /*
     * @notice This function marks the proposal as challenged if a step requested by a member never came.
     * @notice The rule is, if a step has been requested and we are after the grace period, then challenge it
     */
    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function challengeMissingStep(DaoRegistry dao, bytes32 proposalId)
        external
        reimbursable(dao)
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

    // slither-disable-next-line reentrancy-benign
    function provideStep(
        DaoRegistry dao,
        address adapterAddress,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external reimbursable(dao) {
        Voting storage vote = votes[address(dao)][node.proposalId];
        // slither-disable-next-line timestamp
        require(vote.stepRequested == node.index, "wrong step provided");

        _verifyNode(dao, adapterAddress, node, vote.resultRoot);

        vote.stepRequested = 0;
        vote.gracePeriodStartingTime = uint64(block.timestamp);
    }

    // slither-disable-next-line reentrancy-benign
    function startNewVotingForProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) external override onlyAdapter(dao) {
        SnapshotProposalContract.ProposalMessage memory proposal = abi.decode(
            data,
            (SnapshotProposalContract.ProposalMessage)
        );
        (bool success, uint256 blockNumber) = ovHash.stringToUint(
            proposal.payload.snapshot
        );
        require(success, "snapshot conversion error");
        require(blockNumber <= block.number, "snapshot block in future");
        require(blockNumber > 0, "block number cannot be 0");

        votes[address(dao)][proposalId].startingTime = uint64(block.timestamp);
        votes[address(dao)][proposalId].snapshot = blockNumber;

        require(
            _getBank(dao).balanceOf(
                dao.getAddressIfDelegated(proposal.submitter),
                DaoHelper.UNITS
            ) > 0,
            "noActiveMember"
        );

        require(
            SignatureChecker.isValidSignatureNow(
                proposal.submitter,
                _snapshotContract.hashMessage(dao, msg.sender, proposal),
                proposal.sig
            ),
            "invalid sig"
        );
    }

    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function challengeBadFirstNode(
        DaoRegistry dao,
        bytes32 proposalId,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external reimbursable(dao) {
        require(node.index == 0, "only first node");

        Voting storage vote = votes[address(dao)][proposalId];
        require(vote.resultRoot != bytes32(0), "no result available yet!");
        (address actionId, ) = dao.proposals(proposalId);
        _verifyNode(dao, actionId, node, vote.resultRoot);

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

    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function challengeBadNode(
        DaoRegistry dao,
        bytes32 proposalId,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external reimbursable(dao) {
        Voting storage vote = votes[address(dao)][proposalId];
        if (
            _ovHelper.getBadNodeError(
                dao,
                proposalId,
                false,
                vote.resultRoot,
                vote.snapshot,
                vote.gracePeriodStartingTime,
                _getBank(dao).getPriorAmount(
                    DaoHelper.TOTAL,
                    DaoHelper.MEMBER_COUNT,
                    vote.snapshot
                ),
                node
            ) != OffchainVotingHelperContract.BadNodeError.OK
        ) {
            _challengeResult(dao, proposalId);
        } else {
            revert("nothing to challenge");
        }
    }

    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function challengeBadStep(
        DaoRegistry dao,
        bytes32 proposalId,
        OffchainVotingHashContract.VoteResultNode memory nodePrevious,
        OffchainVotingHashContract.VoteResultNode memory nodeCurrent
    ) external reimbursable(dao) {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;

        (address actionId, ) = dao.proposals(proposalId);

        require(resultRoot != bytes32(0), "no result!");
        require(nodeCurrent.index == nodePrevious.index + 1, "not consecutive");

        _verifyNode(dao, actionId, nodeCurrent, vote.resultRoot);
        _verifyNode(dao, actionId, nodePrevious, vote.resultRoot);

        OffchainVotingHashContract.VoteStepParams
            memory params = OffchainVotingHashContract.VoteStepParams(
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

    // slither-disable-next-line reentrancy-benign
    function requestFallback(DaoRegistry dao, bytes32 proposalId)
        external
        reentrancyGuard(dao)
        onlyMember(dao)
    {
        VotingState state = voteResult(dao, proposalId);
        require(
            state != VotingState.PASS &&
                state != VotingState.NOT_PASS &&
                state != VotingState.TIE,
            "voting ended"
        );

        address memberAddr = dao.getAddressIfDelegated(msg.sender);
        // slither-disable-next-line timestamp,incorrect-equality
        require(
            votes[address(dao)][proposalId].fallbackVotes[memberAddr] == false,
            "fallback vote duplicate"
        );
        votes[address(dao)][proposalId].fallbackVotes[memberAddr] = true;
        votes[address(dao)][proposalId].fallbackVotesCount += 1;

        if (
            _ovHelper.isFallbackVotingActivated(
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
    ) external reentrancyGuard(dao) onlyBadReporterAdapter {
        dao.sponsorProposal(proposalId, sponsoredBy, address(this));
    }

    function processChallengeProposal(DaoRegistry dao, bytes32 proposalId)
        external
        reentrancyGuard(dao)
        onlyBadReporterAdapter
    {
        dao.processProposal(proposalId);
    }

    // slither-disable-next-line reentrancy-events,reentrancy-benign
    function _challengeResult(DaoRegistry dao, bytes32 proposalId) internal {
        votes[address(dao)][proposalId].isChallenged = true;
        address challengedReporter = votes[address(dao)][proposalId].reporter;
        bytes32 challengeProposalId = keccak256(
            abi.encodePacked(
                proposalId,
                votes[address(dao)][proposalId].resultRoot
            )
        );

        challengeProposals[address(dao)][
            challengeProposalId
        ] = ProposalChallenge(
            challengedReporter,
            _getBank(dao).balanceOf(challengedReporter, DaoHelper.UNITS)
        );

        GuildKickHelper.lockMemberTokens(dao, challengedReporter);

        dao.submitProposal(challengeProposalId);

        emit ResultChallenged(
            address(dao),
            proposalId,
            votes[address(dao)][proposalId].resultRoot
        );
    }

    function _verifyNode(
        DaoRegistry dao,
        address adapterAddress,
        OffchainVotingHashContract.VoteResultNode memory node,
        bytes32 root
    ) internal view {
        require(
            MerkleProof.verify(
                node.proof,
                root,
                ovHash.nodeHash(dao, adapterAddress, node)
            ),
            "proof:bad"
        );
    }

    function _getBank(DaoRegistry dao) internal view returns (BankExtension) {
        return BankExtension(dao.getExtensionAddress(DaoHelper.BANK));
    }
}
