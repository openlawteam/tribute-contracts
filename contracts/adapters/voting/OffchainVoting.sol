pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/Bank.sol";
import "../../core/DaoConstants.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../../utils/Signatures.sol";
import "../interfaces/IVoting.sol";
import "./Voting.sol";
import "./KickBadReporterAdapter.sol";
import "./SnapshotProposalContract.sol";

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
    Signatures
{
    struct ProposalChallenge {
        address reporter;
        uint256 shares;
    }

    SnapshotProposalContract private _snapshotContract;
    KickBadReporterAdapter private _handleBadReporterAdapter;

    string public constant VOTE_RESULT_NODE_TYPE =
        "Message(address account,uint256 timestamp,uint256 nbYes,uint256 nbNo,uint256 index,uint256 choice,bytes32 proposalHash)";

    string public constant ADAPTER_NAME = "OffchainVotingContract";
    string public constant VOTE_RESULT_ROOT_TYPE = "Message(bytes32 root)";
    bytes32 public constant VOTE_RESULT_NODE_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_RESULT_NODE_TYPE));
    bytes32 public constant VOTE_RESULT_ROOT_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_RESULT_ROOT_TYPE));

    VotingContract public fallbackVoting;

    mapping(address => mapping(bytes32 => ProposalChallenge)) challengeProposals;

    struct Voting {
        uint256 snapshot;
        bytes32 proposalHash;
        address reporter;
        bytes32 resultRoot;
        uint256 nbVoters;
        uint256 nbYes;
        uint256 nbNo;
        uint256 index;
        uint256 startingTime;
        uint256 gracePeriodStartingTime;
        bool isChallenged;
        mapping(address => bool) fallbackVotes;
        uint256 fallbackVotesCount;
    }

    struct VoteResultNode {
        address account;
        uint256 timestamp;
        uint256 nbNo;
        uint256 nbYes;
        bytes sig;
        bytes rootSig;
        uint256 index;
        uint256 choice;
        bytes32 proposalHash;
        bytes32[] proof;
    }

    struct ProposalMessage {
        uint256 timestamp;
        bytes32 spaceHash;
        ProposalPayload payload;
        bytes sig;
    }

    struct ProposalPayload {
        bytes32 nameHash;
        bytes32 bodyHash;
        string[] choices;
        uint256 start;
        uint256 end;
        string snapshot;
    }

    struct VoteMessage {
        uint256 timestamp;
        VotePayload payload;
    }

    struct VotePayload {
        uint256 choice;
        bytes32 proposalHash;
    }

    modifier onlyBadReporterAdapter() {
        require(msg.sender == address(_handleBadReporterAdapter), "only:hbra");
        _;
    }

    bytes32 constant VotingPeriod = keccak256("offchainvoting.votingPeriod");
    bytes32 constant GracePeriod = keccak256("offchainvoting.gracePeriod");
    bytes32 constant StakingAmount = keccak256("offchainvoting.stakingAmount");
    bytes32 constant FallbackThreshold =
        keccak256("offchainvoting.fallbackThreshold");

    mapping(address => mapping(bytes32 => Voting)) public votes;

    constructor(
        VotingContract _c,
        SnapshotProposalContract _spc,
        KickBadReporterAdapter _hbra
    ) {
        require(address(_c) != address(0x0), "voting contract");
        require(address(_spc) != address(0x0), "snapshot proposal");
        require(address(_hbra) != address(0x0), "handle bad reporter");
        fallbackVoting = _c;
        _snapshotContract = _spc;
        _handleBadReporterAdapter = _hbra;
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
            challengeProposals[address(dao)][proposalId].shares,
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
                    node.account,
                    node.timestamp,
                    node.nbYes,
                    node.nbNo,
                    node.index,
                    node.choice,
                    node.proposalHash
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

    function toHashArray(string[] memory arr)
        internal
        pure
        returns (bytes32[] memory result)
    {
        result = new bytes32[](arr.length);
        for (uint256 i = 0; i < arr.length; i++) {
            result[i] = keccak256(abi.encodePacked(arr[i]));
        }
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
        VoteResultNode memory result
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        require(vote.snapshot > 0, "vote:not stsarted");

        if (vote.resultRoot == bytes32(0) || vote.isChallenged) {
            require(
                _readyToSubmitResult(dao, vote, result.nbYes, result.nbNo),
                "vote:notReadyToSubmitResult"
            );
            _submitVoteResult(dao, vote, proposalId, result, resultRoot);
        } else {
            require(result.index > vote.index, "vote:notEnoughSteps");
            _submitVoteResult(dao, vote, proposalId, result, resultRoot);
        }
    }

    function _readyToSubmitResult(
        DaoRegistry dao,
        Voting storage vote,
        uint256 nbYes,
        uint256 nbNo
    ) internal view returns (bool) {
        uint256 diff;
        if (nbYes > nbNo) {
            diff = nbYes - nbNo;
        } else {
            diff = nbNo - nbYes;
        }
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        uint256 totalWeight = bank.getPriorAmount(TOTAL, SHARES, vote.snapshot);
        uint256 unvotedWeights = totalWeight - nbYes - nbNo;
        if (diff > unvotedWeights) {
            return true;
        }

        uint256 votingPeriod = dao.getConfiguration(VotingPeriod);

        return vote.startingTime + votingPeriod <= block.timestamp;
    }

    function _submitVoteResult(
        DaoRegistry dao,
        Voting storage vote,
        bytes32 proposalId,
        VoteResultNode memory result,
        bytes32 resultRoot
    ) internal {
        (address adapterAddress, ) = dao.proposals(proposalId);
        address reporter =
            recover(
                hashResultRoot(dao, adapterAddress, resultRoot),
                result.rootSig
            );

        require(
            verify(
                resultRoot,
                nodeHash(dao, adapterAddress, result),
                result.proof
            ),
            "vote:proof bad"
        );
        (address actionId, ) = dao.proposals(proposalId);
        require(
            _hasVoted(
                dao,
                actionId,
                dao.getPriorDelegateKey(result.account, vote.snapshot),
                result.timestamp,
                result.proposalHash,
                result.sig
            ) != 0,
            "vote:sig bad"
        );

        if (
            vote.gracePeriodStartingTime == 0 ||
            vote.nbNo > vote.nbYes != result.nbNo > result.nbYes
        ) {
            vote.gracePeriodStartingTime = block.timestamp;
        }

        vote.nbNo = result.nbNo;
        vote.nbYes = result.nbYes;
        vote.index = result.index;
        vote.resultRoot = resultRoot;
        vote.reporter = reporter;
        vote.isChallenged = false;
    }

    function getSenderAddress(
        DaoRegistry dao,
        address actionId,
        bytes memory data,
        address
    ) external view override returns (address) {
        SnapshotProposalContract.ProposalMessage memory proposal =
            abi.decode(data, (SnapshotProposalContract.ProposalMessage));
        return
            recover(
                _snapshotContract.hashMessage(dao, actionId, proposal),
                proposal.sig
            );
    }

    function startNewVotingForProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) public override onlyAdapter(dao) {
        SnapshotProposalContract.ProposalMessage memory proposal =
            abi.decode(data, (SnapshotProposalContract.ProposalMessage));
        (bool success, uint256 blockNumber) =
            _stringToUint(proposal.payload.snapshot);
        require(success, "snapshot conversion error");

        bytes32 proposalHash =
            _snapshotContract.hashMessage(dao, msg.sender, proposal);
        address addr = recover(proposalHash, proposal.sig);
        require(dao.isActiveMember(addr), "noActiveMember");
        require(
            blockNumber <= block.number,
            "snapshot block number should not be in the future"
        );
        require(blockNumber > 0, "block number cannot be 0");

        votes[address(dao)][proposalId].startingTime = block.timestamp;
        votes[address(dao)][proposalId].snapshot = blockNumber;
        votes[address(dao)][proposalId].proposalHash = proposalHash;
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

        if (vote.isChallenged) {
            return VotingState.IN_PROGRESS;
        }

        if (
            block.timestamp <
            vote.startingTime + dao.getConfiguration(VotingPeriod)
        ) {
            return VotingState.IN_PROGRESS;
        }

        if (
            block.timestamp <
            vote.gracePeriodStartingTime + dao.getConfiguration(GracePeriod)
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

    function challengeWrongSignature(
        DaoRegistry dao,
        bytes32 proposalId,
        VoteResultNode memory nodeCurrent
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;
        uint256 blockNumber = vote.snapshot;
        (address adapterAddress, ) = dao.proposals(proposalId);
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = nodeHash(dao, adapterAddress, nodeCurrent);
        require(
            verify(resultRoot, hashCurrent, nodeCurrent.proof),
            "proof check for current invalid for current node"
        );

        //return 1 if yes, 2 if no and 0 if the vote is incorrect
        address voter =
            dao.getPriorDelegateKey(nodeCurrent.account, blockNumber);

        (address actionId, ) = dao.proposals(proposalId);

        if (
            _hasVoted(
                dao,
                actionId,
                voter,
                nodeCurrent.timestamp,
                nodeCurrent.proposalHash,
                nodeCurrent.sig
            ) == 0
        ) {
            _challengeResult(dao, proposalId);
        }
    }

    function challengeDuplicate(
        DaoRegistry dao,
        bytes32 proposalId,
        VoteResultNode memory node1,
        VoteResultNode memory node2
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;
        (address adapterAddress, ) = dao.proposals(proposalId);
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = nodeHash(dao, adapterAddress, node1);
        bytes32 hashPrevious = nodeHash(dao, adapterAddress, node2);
        require(
            verify(resultRoot, hashCurrent, node1.proof),
            "proof check for current invalid for current node"
        );
        require(
            verify(resultRoot, hashPrevious, node2.proof),
            "proof check for previous invalid for previous node"
        );

        if (node1.account == node2.account) {
            _challengeResult(dao, proposalId);
        }
    }

    function challengeWrongStep(
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
            verify(resultRoot, hashCurrent, nodeCurrent.proof),
            "proof check for current invalid for current node"
        );
        require(
            verify(resultRoot, hashPrevious, nodePrevious.proof),
            "proof check for previous invalid for previous node"
        );

        require(
            nodeCurrent.index == nodePrevious.index + 1,
            "those nodes are not consecutive"
        );

        //voters not in order
        if (nodeCurrent.account > nodePrevious.account) {
            _challengeResult(dao, proposalId);
        }
        (address actionId, ) = dao.proposals(proposalId);

        _checkStep(dao, actionId, nodeCurrent, nodePrevious, proposalId);
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
    }

    function _checkStep(
        DaoRegistry dao,
        address actionId,
        VoteResultNode memory nodeCurrent,
        VoteResultNode memory nodePrevious,
        bytes32 proposalId
    ) internal {
        Voting storage vote = votes[address(dao)][proposalId];
        address voter =
            dao.getPriorDelegateKey(nodeCurrent.account, vote.snapshot);
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        uint256 weight =
            bank.getPriorAmount(nodeCurrent.account, SHARES, vote.snapshot);

        if (
            _hasVotedYes(
                dao,
                actionId,
                voter,
                nodeCurrent.timestamp,
                nodeCurrent.proposalHash,
                nodeCurrent.sig
            )
        ) {
            if (nodePrevious.nbYes + weight != nodeCurrent.nbYes) {
                _challengeResult(dao, proposalId);
            } else if (nodePrevious.nbNo != nodeCurrent.nbNo) {
                _challengeResult(dao, proposalId);
            }
        } else {
            if (nodePrevious.nbYes != nodeCurrent.nbYes) {
                _challengeResult(dao, proposalId);
            } else if (nodePrevious.nbNo + weight != nodeCurrent.nbNo) {
                _challengeResult(dao, proposalId);
            }
        }
    }

    function sponsorChallengeProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address sponsoredBy
    ) external onlyBadReporterAdapter {
        dao.sponsorProposal(proposalId, sponsoredBy);
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
        bytes32 challengeProposalId =
            keccak256(
                abi.encodePacked(
                    proposalId,
                    votes[address(dao)][proposalId].resultRoot
                )
            );

        dao.submitProposal(challengeProposalId);

        uint256 shares = bank.balanceOf(challengedReporter, SHARES);

        challengeProposals[address(dao)][
            challengeProposalId
        ] = ProposalChallenge(challengedReporter, shares);

        // Burns / subtracts from member's balance the number of shares to burn.
        bank.subtractFromBalance(challengedReporter, SHARES, shares);
        // Burns / subtracts from member's balance the number of loot to burn.
        // bank.subtractFromBalance(memberToKick, LOOT, kick.lootToBurn);
        bank.addToBalance(challengedReporter, LOOT, shares);
    }

    function getSignedHash(
        bytes32 snapshotRoot,
        address dao,
        bytes32 proposalId
    ) external pure returns (bytes32) {
        bytes32 proposalHash =
            keccak256(abi.encode(snapshotRoot, dao, proposalId));
        return keccak256(abi.encode(proposalHash, 1));
    }

    function getSignedAddress(
        bytes32 snapshotRoot,
        address dao,
        bytes32 proposalId,
        bytes calldata sig
    ) external pure returns (address) {
        bytes32 proposalHash =
            keccak256(abi.encode(snapshotRoot, dao, proposalId));
        return
            recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        keccak256(abi.encode(proposalHash, 1))
                    )
                ),
                sig
            );
    }

    function _hasVotedYes(
        DaoRegistry dao,
        address actionId,
        address voter,
        uint256 timestamp,
        bytes32 proposalHash,
        bytes memory sig
    ) internal view returns (bool) {
        uint256 result =
            _hasVoted(dao, actionId, voter, timestamp, proposalHash, sig);
        require(result != 0, "invalid sig");
        return result == 1;
    }

    function _hasVoted(
        DaoRegistry dao,
        address actionId,
        address voter,
        uint256 timestamp,
        bytes32 proposalHash,
        bytes memory sig
    ) internal view returns (uint256) {
        bytes32 voteHashYes =
            _snapshotContract.hashVote(
                dao,
                actionId,
                SnapshotProposalContract.VoteMessage(
                    timestamp,
                    SnapshotProposalContract.VotePayload(1, proposalHash)
                )
            );

        bytes32 voteHashNo =
            _snapshotContract.hashVote(
                dao,
                actionId,
                SnapshotProposalContract.VoteMessage(
                    timestamp,
                    SnapshotProposalContract.VotePayload(2, proposalHash)
                )
            );

        if (recover(voteHashYes, sig) == voter) {
            return 1;
        } else if (recover(voteHashNo, sig) == voter) {
            return 2;
        } else {
            return 0;
        }
    }

    function verify(
        bytes32 root,
        bytes32 leaf,
        bytes32[] memory proof
    ) public pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash < proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(
                    abi.encodePacked(computedHash, proofElement)
                );
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(
                    abi.encodePacked(proofElement, computedHash)
                );
            }
        }

        // Check if the computed hash (root) is equal to the provided root
        return computedHash == root;
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
