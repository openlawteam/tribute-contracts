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
        bytes32 resultRoot,
        bytes32 challengeProposalId
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

    /**
     * @notice Forcefully fails a given proposal
     * @param dao The DAO address
     * @param proposalId The proposal id to mark as failed
     */
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
     * @notice Saves the vote result to the storage if resultNode (vote) is valid
     * @notice A valid vote result node must satisfy all the conditions in the function, so it can be stored
     * @param dao The DAO address
     * @param proposalId The proposa id that was voted on the vote result
     * @param resultRoot The hash of the vote result tree
     * @param reporter The address of the member that is reporting the vote result
     * @param result The last leaf node of the voting tree that represents the vote result with the voting weights
     * @param rootSig The signature of the voting tree signed by the reporter
     */
    // The function is protected against reentrancy with the reimbursable modifier
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
        require(vote.snapshot > 0, "vote not started");
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
            "not ready for vote result"
        );

        require(
            vote.gracePeriodStartingTime == 0 ||
                vote.gracePeriodStartingTime +
                    dao.getConfiguration(VotingPeriod) <=
                block.timestamp,
            "grace period finished"
        );

        require(isActiveMember(dao, reporter), "not active member");

        uint256 membersCount = _getBank(dao).getPriorAmount(
            DaoHelper.TOTAL,
            DaoHelper.MEMBER_COUNT,
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
            "invalid result signature"
        );

        // slither-disable-next-line timestamp
        require(
            vote.nbYes + vote.nbNo < result.nbYes + result.nbNo,
            "result weight too low"
        );

        // check whether the new result changes the outcome
        if (
            vote.gracePeriodStartingTime == 0 ||
            // changed from yes to no or from no to yes
            vote.nbNo > vote.nbYes != result.nbNo > result.nbYes ||
            // changed from tie to yes/no or from yes/no to tie
            ((vote.nbNo == vote.nbYes) != (result.nbNo == result.nbYes))
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

    /**
     * @notice Allows DAO members to reveal specific leaf nodes of the voting tree (steps) if they are not found off-chain for any reason
     * @notice A step represents a vote of a DAO member, and the index indicates which index that member is stored in the DAO
     * @param dao The DAO address
     * @param proposalId The proposalId associated with the step
     * @param index The index of the step in the voting tree
     */
    // slither-disable-next-line reentrancy-benign
    function requestStep(
        DaoRegistry dao,
        bytes32 proposalId,
        uint256 index
    ) external reimbursable(dao) onlyMember(dao) {
        Voting storage vote = votes[address(dao)][proposalId];
        require(index > 0 && index < vote.nbMembers, "index out of bound");
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
            "should be in grace period"
        );
        vote.stepRequested = index;
        vote.gracePeriodStartingTime = uint64(block.timestamp);
    }

    /**
     * @notice Submits an step that was requested or not.
     * @notice The step is verified to make sure it is part of the voting tree.
     * @notice Bad steps might be submitted, but they can be challenged as well.
     * @notice Providing an step indicates that the step/vote is revealed, so it can be verified.
     * @param dao The DAO Address
     * @param adapterAddress The address of the adapter that was used as actionId to build the vote step proof.
     * @param node The vote/node/step to be revealed.
     */
    // slither-disable-next-line reentrancy-benign
    function provideStep(
        DaoRegistry dao,
        address adapterAddress,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external reimbursable(dao) {
        Voting storage vote = votes[address(dao)][node.proposalId];
        // slither-disable-next-line timestamp
        require(
            node.index > 0 && vote.stepRequested == node.index,
            "wrong step provided"
        );

        _verifyNode(dao, adapterAddress, node, vote.resultRoot);

        vote.stepRequested = 0;
        vote.gracePeriodStartingTime = uint64(block.timestamp);
    }

    /*
     * @notice This function marks the proposal as challenged if a step requested by a member never came (was not provided/revealed).
     * @notice The rule is, if a step has been requested and we are after the grace period, then challenge it
     * @param dao The DAO address
     * @param proposalId The proposal id associated with the missing step
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
            "wait for the grace period"
        );

        _challengeResult(dao, proposalId);
    }

    /**
     * @notice Allows anyone to challenge the first vote step in the result tree.
     * @param dao The DAO address.
     * @param proposalId The proposal id associated with the vote step.
     * @param node The actual vote step that is being challenged.
     */
    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function challengeBadFirstStep(
        DaoRegistry dao,
        bytes32 proposalId,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external reimbursable(dao) {
        require(node.index == 1, "only first step");

        Voting storage vote = votes[address(dao)][proposalId];
        require(vote.resultRoot != bytes32(0), "vote result not found");

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

    /**
     * @notice Challenges a bad node that was revealed in the provideStep function.
     * @notice A bad node step is verified using the OffchainVotingHelper.getBadNodeError
     * @param dao The DAO address.
     * @param proposalId The proposal id associated with the bad node.
     * @param node The node to be challenged.
     */
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

    /**
     * @notice Challenges a bad step based on the current and previous nodes.
     * @notice The current and previous nodes must be consecutive,
     */
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

        require(resultRoot != bytes32(0), "missing vote result");
        require(
            nodeCurrent.index > 0 && nodePrevious.index > 0,
            "invalid step index"
        );
        require(
            nodeCurrent.index == nodePrevious.index + 1,
            "not consecutive steps"
        );

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

    /**
     * @notice Enables the fallback voting strategy if the request is valid
     * @notice Current voting must be in progress
     * @notice It is not possible to request it more than once for the same member
     * @param dao The DAO address
     * @param proposalId The proposalId that will used in the fallback voting contract
     */
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

    /**
     * @notice Starts a new offchain voting proposal
     * @param dao The DAO address
     * @param proposalId The new proposal id
     * @param data The bytes data containing the proposal payload (SnapshotProposalContract.ProposalMessage)
     */
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
            "not active member"
        );

        require(
            SignatureChecker.isValidSignatureNow(
                proposal.submitter,
                _snapshotContract.hashMessage(dao, msg.sender, proposal),
                proposal.sig
            ),
            "invalid proposal signature"
        );
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

    /**
     * @notice Marks the vote result as challenged
     * @notice Creates a new proposal in the DAO registry. The new proposal is the Challenge Proposal
     * @notice Puts the vote result reporter into jail until the challenge process is finalized
     * @notice If the reporter is a malicous actor, the Challenge Proposal will be voted, and that reporter will be kicked out of the DAO
     * @notice If the report is not a malicious actor, the Challenge Proposal will not pass, and the reporter will be unjailed
     * @param dao The DAO address
     * @param proposalId The proposal id associated with the challenged vote result
     */
    // slither-disable-next-line reentrancy-events,reentrancy-benign
    function _challengeResult(DaoRegistry dao, bytes32 proposalId) internal {
        Voting storage vote = votes[address(dao)][proposalId];
        vote.isChallenged = true;

        address challengedReporter = vote.reporter;
        bytes32 resultRoot = vote.resultRoot;
        bytes32 challengeProposalId = keccak256(
            abi.encodePacked(proposalId, resultRoot)
        );

        challengeProposals[address(dao)][
            challengeProposalId
        ] = ProposalChallenge(
            challengedReporter,
            _getBank(dao).balanceOf(challengedReporter, DaoHelper.UNITS)
        );

        dao.jailMember(challengedReporter);

        dao.submitProposal(challengeProposalId);

        emit ResultChallenged(
            address(dao),
            proposalId,
            resultRoot,
            challengeProposalId
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
            "invalid step proof"
        );
    }

    function _getBank(DaoRegistry dao) internal view returns (BankExtension) {
        return BankExtension(dao.getExtensionAddress(DaoHelper.BANK));
    }
}
