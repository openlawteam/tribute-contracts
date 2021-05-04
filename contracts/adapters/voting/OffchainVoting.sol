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
    struct ProposalChallenge {
        address reporter;
        uint256 units;
    }

    uint256 public constant NB_CHOICES = 2;

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
        address reporter;
        bytes32 resultRoot;
        uint256 nbYes;
        uint256 nbNo;
        uint256 index;
        uint256 startingTime;
        uint256 gracePeriodStartingTime;
        bool isChallenged;
        bool forceFailed;
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
    bytes32 constant FallbackThreshold =
        keccak256("offchainvoting.fallbackThreshold");

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
        require(vote.snapshot > 0, "vote:not started");

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

    function _submitVoteResult(
        DaoRegistry dao,
        Voting storage vote,
        bytes32 proposalId,
        VoteResultNode memory result,
        bytes32 resultRoot
    ) internal {
        (address adapterAddress, ) = dao.proposals(proposalId);
        address reporter =
            ECDSA.recover(
                hashResultRoot(dao, adapterAddress, resultRoot),
                result.rootSig
            );
        address memberAddr = dao.getAddressIfDelegated(reporter);
        require(isActiveMember(dao, memberAddr), "not active member");
        require(
            !_challengeBadNode(dao, proposalId, true, resultRoot, vote, result),
            "bad result"
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
        vote.reporter = memberAddr;
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
        SnapshotProposalContract.ProposalMessage memory proposal =
            abi.decode(data, (SnapshotProposalContract.ProposalMessage));
        (bool success, uint256 blockNumber) =
            _stringToUint(proposal.payload.snapshot);
        require(success, "snapshot conversion error");
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));

        bytes32 proposalHash =
            _snapshotContract.hashMessage(dao, msg.sender, proposal);
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

    function challengeBadNode(
        DaoRegistry dao,
        bytes32 proposalId,
        VoteResultNode memory nodeCurrent
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        if (
            _challengeBadNode(
                dao,
                proposalId,
                false,
                vote.resultRoot,
                vote,
                nodeCurrent
            )
        ) {
            _challengeResult(dao, proposalId);
        }
    }

    function _isValidChoice(uint256 choice) internal pure returns (bool) {
        return choice > 0 && choice < NB_CHOICES + 1;
    }

    function _challengeBadNode(
        DaoRegistry dao,
        bytes32 proposalId,
        bool submitNewVote,
        bytes32 resultRoot,
        Voting storage vote,
        VoteResultNode memory node
    ) internal view returns (bool) {
        uint256 blockNumber = vote.snapshot;
        (address adapterAddress, ) = dao.proposals(proposalId);
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = nodeHash(dao, adapterAddress, node);
        //check that the step is indeed part of the result
        require(
            MerkleProof.verify(node.proof, resultRoot, hashCurrent),
            "proof:bad"
        );

        //return 1 if yes, 2 if no and 0 if the vote is incorrect
        address voter = dao.getPriorDelegateKey(node.account, blockNumber);

        (address actionId, ) = dao.proposals(proposalId);

        //invalid choice
        if (!_isValidChoice(node.choice)) {
            return true;
        }

        //invalid proposal hash
        if (node.proposalHash != proposalId) {
            return true;
        }

        //has voted outside of the voting time
        if (!submitNewVote && node.timestamp > vote.gracePeriodStartingTime) {
            return true;
        }

        //bad signature
        if (
            !_hasVoted(
                dao,
                actionId,
                voter,
                node.timestamp,
                node.proposalHash,
                node.choice,
                node.sig
            )
        ) {
            return true;
        }

        if (node.index == 0) {
            _checkStep(dao, actionId, node, 0, 0, proposalId);
        }

        return false;
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

        //voters not in order
        if (nodeCurrent.account > nodePrevious.account) {
            _challengeResult(dao, proposalId);
        }
        (address actionId, ) = dao.proposals(proposalId);

        if (
            _checkStep(
                dao,
                actionId,
                nodeCurrent,
                nodePrevious.nbYes,
                nodePrevious.nbNo,
                proposalId
            )
        ) {
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
        VoteResultNode memory nodeCurrent,
        uint256 previousYes,
        uint256 previousNo,
        bytes32 proposalId
    ) internal view returns (bool) {
        Voting storage vote = votes[address(dao)][proposalId];
        address voter =
            dao.getPriorDelegateKey(nodeCurrent.account, vote.snapshot);
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        uint256 weight =
            bank.getPriorAmount(nodeCurrent.account, UNITS, vote.snapshot);

        if (
            _hasVoted(
                dao,
                actionId,
                voter,
                nodeCurrent.timestamp,
                nodeCurrent.proposalHash,
                1,
                nodeCurrent.sig
            )
        ) {
            if (previousYes + weight != nodeCurrent.nbYes) {
                return true;
            } else if (previousNo != nodeCurrent.nbNo) {
                return true;
            }
        } else {
            if (previousYes != nodeCurrent.nbYes) {
                return true;
            } else if (previousNo + weight != nodeCurrent.nbNo) {
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
        bytes32 challengeProposalId =
            keccak256(
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
            ECDSA.recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        keccak256(abi.encode(proposalHash, 1))
                    )
                ),
                sig
            );
    }

    function _hasVoted(
        DaoRegistry dao,
        address actionId,
        address voter,
        uint256 timestamp,
        bytes32 proposalHash,
        uint256 choiceIdx,
        bytes memory sig
    ) internal view returns (bool) {
        bytes32 voteHash =
            _snapshotContract.hashVote(
                dao,
                actionId,
                SnapshotProposalContract.VoteMessage(
                    timestamp,
                    SnapshotProposalContract.VotePayload(
                        choiceIdx,
                        proposalHash
                    )
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
