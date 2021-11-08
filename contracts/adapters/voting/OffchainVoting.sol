pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/bank/Bank.sol";
import "../../core/DaoConstants.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../../utils/Signatures.sol";
import "../interfaces/IVoting.sol";
import "./Voting.sol";
import "./KickBadReporterAdapter.sol";
import "./SnapshotProposalContract.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

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
    DaoConstants,
    MemberGuard,
    AdapterGuard,
    Signatures,
    Ownable
{
    enum BadNodeError {
        OK,
        WRONG_PROPOSAL_ID,
        INVALID_CHOICE,
        AFTER_VOTING_PERIOD,
        BAD_SIGNATURE
    }

    struct ProposalChallenge {
        address reporter;
        uint256 units;
    }

    uint256 public constant NB_CHOICES = 2;

    SnapshotProposalContract private _snapshotContract;
    KickBadReporterAdapter private _handleBadReporterAdapter;

    string public constant VOTE_RESULT_NODE_TYPE =
        "Message(uint64 timestamp,uint88 nbYes,uint88 nbNo,uint32 index,uint32 choice,bytes32 proposalId)";

    string public constant ADAPTER_NAME = "OffchainVotingContract";
    string public constant VOTE_RESULT_ROOT_TYPE = "Message(bytes32 root)";
    bytes32 public constant VOTE_RESULT_NODE_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_RESULT_NODE_TYPE));
    bytes32 public constant VOTE_RESULT_ROOT_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_RESULT_ROOT_TYPE));

    bytes32 constant VotingPeriod = keccak256("offchainvoting.votingPeriod");
    bytes32 constant GracePeriod = keccak256("offchainvoting.gracePeriod");
    bytes32 constant FallbackThreshold =
        keccak256("offchainvoting.fallbackThreshold");

    struct VoteStepParams {
        uint256 previousYes;
        uint256 previousNo;
        bytes32 proposalId;
    }

    struct Voting {
        uint256 snapshot;
        address reporter;
        bytes32 resultRoot;
        uint256 nbYes;
        uint256 nbNo;
        uint256 startingTime;
        uint256 gracePeriodStartingTime;
        bool isChallenged;
        bool forceFailed;
        mapping(address => bool) fallbackVotes;
        uint256 fallbackVotesCount;
    }

    struct VoteResultNode {
        uint32 choice;
        uint64 index;
        uint64 timestamp;
        uint88 nbNo;
        uint88 nbYes;
        bytes sig;
        bytes32 proposalId;
        bytes32[] proof;
    }

    modifier onlyBadReporterAdapter() {
        require(msg.sender == address(_handleBadReporterAdapter), "only:hbra");
        _;
    }

    VotingContract public fallbackVoting;

    mapping(address => mapping(bytes32 => ProposalChallenge)) challengeProposals;
    mapping(address => mapping(bytes32 => Voting)) public votes;

    constructor(
        VotingContract _c,
        SnapshotProposalContract _spc,
        KickBadReporterAdapter _hbra,
        address _owner
    ) {
        require(address(_c) != address(0x0), "voting contract");
        require(address(_spc) != address(0x0), "snapshot proposal");
        require(address(_hbra) != address(0x0), "handle bad reporter");
        fallbackVoting = _c;
        _snapshotContract = _spc;
        _handleBadReporterAdapter = _hbra;
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

    function hashResultRoot(
        DaoRegistry dao,
        address actionId,
        bytes32 resultRoot
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    _snapshotContract.DOMAIN_SEPARATOR(dao, actionId),
                    keccak256(abi.encode(VOTE_RESULT_ROOT_TYPEHASH, resultRoot))
                )
            );
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

    function hashVotingResultNode(VoteResultNode memory node)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    VOTE_RESULT_NODE_TYPEHASH,
                    node.timestamp,
                    node.nbYes,
                    node.nbNo,
                    node.index,
                    node.choice,
                    node.proposalId
                )
            );
    }

    function nodeHash(
        DaoRegistry dao,
        address actionId,
        VoteResultNode memory node
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    _snapshotContract.DOMAIN_SEPARATOR(dao, actionId),
                    hashVotingResultNode(node)
                )
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
        VoteResultNode memory result,
        bytes memory rootSig
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        require(vote.snapshot > 0, "vote:not started");

        if (vote.resultRoot == bytes32(0) || vote.isChallenged) {
            require(
                _readyToSubmitResult(dao, vote, result.nbYes, result.nbNo),
                "vote:notReadyToSubmitResult"
            );
        }

        (address adapterAddress, ) = dao.proposals(proposalId);
        address reporter = ECDSA.recover(
            hashResultRoot(dao, adapterAddress, resultRoot),
            rootSig
        );
        address memberAddr = dao.getAddressIfDelegated(reporter);
        require(isActiveMember(dao, memberAddr), "not active member");
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        uint256 nbMembers = bank.getPriorAmount(
            TOTAL,
            MEMBER_COUNT,
            vote.snapshot
        );
        require(nbMembers - 1 == result.index, "index:member_count mismatch");
        require(
            getBadNodeError(
                dao,
                proposalId,
                true,
                resultRoot,
                vote.snapshot,
                vote.gracePeriodStartingTime,
                result
            ) == BadNodeError.OK,
            "bad result"
        );

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
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        uint256 totalWeight = bank.getPriorAmount(TOTAL, UNITS, vote.snapshot);
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
        return vote.startingTime + votingPeriod <= block.timestamp;
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
        (bool success, uint256 blockNumber) = _stringToUint(
            proposal.payload.snapshot
        );
        require(success, "snapshot conversion error");
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));

        bytes32 proposalHash = _snapshotContract.hashMessage(
            dao,
            msg.sender,
            proposal
        );
        address addr = ECDSA.recover(proposalHash, proposal.sig);

        address memberAddr = dao.getAddressIfDelegated(addr);
        require(bank.balanceOf(memberAddr, UNITS) > 0, "noActiveMember");
        require(
            blockNumber <= block.number,
            "snapshot block number should not be in the future"
        );
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
        external
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

        uint256 votingPeriod = dao.getConfiguration(VotingPeriod);

        //if the vote has started but the voting period has not passed yet, it's in progress
        if (block.timestamp < vote.startingTime + votingPeriod) {
            return VotingState.IN_PROGRESS;
        }

        uint256 gracePeriod = dao.getConfiguration(GracePeriod);

        //if no result have been submitted but we are before grace + voting period, then the proposal is GRACE_PERIOD
        if (
            vote.gracePeriodStartingTime == 0 &&
            block.timestamp < vote.startingTime + gracePeriod + votingPeriod
        ) {
            return VotingState.GRACE_PERIOD;
        }

        //if the vote has started but the voting period has not passed yet, it's in progress
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
        VoteResultNode memory node
    ) external {
        require(node.index == 0, "only first node");
        Voting storage vote = votes[address(dao)][proposalId];
        (address adapterAddress, ) = dao.proposals(proposalId);
        require(vote.resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = nodeHash(dao, adapterAddress, node);
        //check that the step is indeed part of the result
        require(
            MerkleProof.verify(node.proof, vote.resultRoot, hashCurrent),
            "proof:bad"
        );

        (address actionId, ) = dao.proposals(proposalId);

        if (_checkStep(dao, actionId, node, VoteStepParams(0, 0, proposalId))) {
            _challengeResult(dao, proposalId);
        }
    }

    function challengeBadNode(
        DaoRegistry dao,
        bytes32 proposalId,
        VoteResultNode memory node
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        if (
            getBadNodeError(
                dao,
                proposalId,
                false,
                vote.resultRoot,
                vote.snapshot,
                vote.gracePeriodStartingTime,
                node
            ) != BadNodeError.OK
        ) {
            _challengeResult(dao, proposalId);
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
        VoteResultNode memory node
    ) public view returns (BadNodeError) {
        (address adapterAddress, ) = dao.proposals(proposalId);
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = nodeHash(dao, adapterAddress, node);
        //check that the step is indeed part of the result
        require(
            MerkleProof.verify(node.proof, resultRoot, hashCurrent),
            "proof:bad"
        );
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
            !_hasVoted(
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
        VoteResultNode memory nodePrevious,
        VoteResultNode memory nodeCurrent
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;

        (address adapterAddress, ) = dao.proposals(proposalId);
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = nodeHash(dao, adapterAddress, nodeCurrent);
        bytes32 hashPrevious = nodeHash(dao, adapterAddress, nodePrevious);
        require(
            MerkleProof.verify(nodeCurrent.proof, resultRoot, hashCurrent),
            "proof check for current invalid for current node"
        );
        require(
            MerkleProof.verify(nodePrevious.proof, resultRoot, hashPrevious),
            "proof check for previous invalid for previous node"
        );

        require(
            nodeCurrent.index == nodePrevious.index + 1,
            "those nodes are not consecutive"
        );

        (address actionId, ) = dao.proposals(proposalId);
        VoteStepParams memory params = VoteStepParams(
            nodePrevious.nbYes,
            nodePrevious.nbNo,
            proposalId
        );
        if (_checkStep(dao, actionId, nodeCurrent, params)) {
            _challengeResult(dao, proposalId);
        }
    }

    function requestFallback(DaoRegistry dao, bytes32 proposalId)
        external
        onlyMember(dao)
    {
        require(
            votes[address(dao)][proposalId].fallbackVotes[msg.sender] == false,
            "the member has already voted for this vote to fallback"
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

    function _checkStep(
        DaoRegistry dao,
        address actionId,
        VoteResultNode memory node,
        VoteStepParams memory params
    ) internal view returns (bool) {
        Voting storage vote = votes[address(dao)][params.proposalId];
        address account = dao.getMemberAddress(node.index);
        address voter = dao.getPriorDelegateKey(account, vote.snapshot);
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        uint256 weight = bank.getPriorAmount(account, UNITS, vote.snapshot);

        if (node.choice == 0) {
            if (params.previousYes != node.nbYes) {
                return true;
            } else if (params.previousNo != node.nbNo) {
                return true;
            }
        }

        if (
            _hasVoted(
                dao,
                actionId,
                voter,
                node.timestamp,
                node.proposalId,
                1,
                node.sig
            )
        ) {
            if (params.previousYes + weight != node.nbYes) {
                return true;
            } else if (params.previousNo != node.nbNo) {
                return true;
            }
        }
        if (
            _hasVoted(
                dao,
                actionId,
                voter,
                node.timestamp,
                node.proposalId,
                2,
                node.sig
            )
        ) {
            if (params.previousYes != node.nbYes) {
                return true;
            } else if (params.previousNo + weight != node.nbNo) {
                return true;
            }
        }

        return false;
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

    function _challengeResult(DaoRegistry dao, bytes32 proposalId) internal {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));

        votes[address(dao)][proposalId].isChallenged = true;
        address challengedReporter = votes[address(dao)][proposalId].reporter;
        bytes32 challengeProposalId = keccak256(
            abi.encodePacked(
                proposalId,
                votes[address(dao)][proposalId].resultRoot
            )
        );

        dao.submitProposal(challengeProposalId);

        uint256 units = bank.balanceOf(challengedReporter, UNITS);

        challengeProposals[address(dao)][
            challengeProposalId
        ] = ProposalChallenge(challengedReporter, units);

        // Burns / subtracts from member's balance the number of units to burn.
        bank.subtractFromBalance(challengedReporter, UNITS, units);
        // Burns / subtracts from member's balance the number of loot to burn.
        // bank.subtractFromBalance(memberToKick, LOOT, kick.lootToBurn);
        bank.addToBalance(challengedReporter, LOOT, units);
    }

    function _hasVoted(
        DaoRegistry dao,
        address actionId,
        address voter,
        uint64 timestamp,
        bytes32 proposalId,
        uint32 choiceIdx,
        bytes memory sig
    ) internal view returns (bool) {
        bytes32 voteHash = _snapshotContract.hashVote(
            dao,
            actionId,
            SnapshotProposalContract.VoteMessage(
                timestamp,
                SnapshotProposalContract.VotePayload(choiceIdx, proposalId)
            )
        );

        return ECDSA.recover(voteHash, sig) == voter;
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
}
