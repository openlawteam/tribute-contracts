pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../core/DaoConstants.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../interfaces/IVoting.sol";
import "./Voting.sol";

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
    AdapterGuard
{
    string public constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,address actionId)";
    string public constant PROPOSAL_MESSAGE_TYPE =
        "Message(uint256 timestamp,bytes32 spaceHash,MessagePayload payload)MessagePayload(bytes32 nameHash,bytes32 bodyHash,string[] choices,uint256 start,uint256 end,string snapshot)";
    string public constant PROPOSAL_PAYLOAD_TYPE =
        "MessagePayload(bytes32 nameHash,bytes32 bodyHash,string[] choices,uint256 start,uint256 end,string snapshot)";
    string public constant VOTE_MESSAGE_TYPE =
        "Message(uint256 timestamp,MessagePayload payload)MessagePayload(uint256 choice,bytes32 proposalHash)";
    string public constant VOTE_PAYLOAD_TYPE =
        "MessagePayload(uint256 choice,bytes32 proposalHash)";
    string public constant VOTE_RESULT_NODE_TYPE =
        "Message(address account,uint256 timestamp,uint256 nbYes,uint256 nbNo,uint256 index,uint256 choice,bytes32 proposalHash)";

    string public constant VOTE_RESULT_ROOT_TYPE = "Message(bytes32 root)";

    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));
    bytes32 public constant PROPOSAL_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(PROPOSAL_MESSAGE_TYPE));
    bytes32 public constant PROPOSAL_PAYLOAD_TYPEHASH =
        keccak256(abi.encodePacked(PROPOSAL_PAYLOAD_TYPE));
    bytes32 public constant VOTE_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_MESSAGE_TYPE));
    bytes32 public constant VOTE_PAYLOAD_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_PAYLOAD_TYPE));
    bytes32 public constant VOTE_RESULT_NODE_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_RESULT_NODE_TYPE));
    bytes32 public constant VOTE_RESULT_ROOT_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_RESULT_ROOT_TYPE));
    uint256 chainId;

    function DOMAIN_SEPARATOR(DaoRegistry dao, address actionId)
        public
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    EIP712_DOMAIN_TYPEHASH,
                    keccak256("Snapshot Message"), // string name
                    keccak256("4"), // string version
                    chainId, // uint256 chainId
                    address(dao), // address verifyingContract,
                    actionId
                )
            );
    }

    VotingContract public fallbackVoting;

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

    bytes32 constant VotingPeriod = keccak256("offchainvoting.votingPeriod");
    bytes32 constant GracePeriod = keccak256("offchainvoting.gracePeriod");
    bytes32 constant StakingAmount = keccak256("offchainvoting.stakingAmount");
    bytes32 constant FallbackThreshold =
        keccak256("offchainvoting.fallbackThreshold");

    mapping(address => mapping(bytes32 => Voting)) public votes;

    constructor(VotingContract _c, uint256 _chainId) {
        fallbackVoting = _c;
        chainId = _chainId;
    }

    function hashMessage(
        DaoRegistry dao,
        address actionId,
        ProposalMessage memory message
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    DOMAIN_SEPARATOR(dao, actionId),
                    hashProposalMessage(message)
                )
            );
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
                    DOMAIN_SEPARATOR(dao, actionId),
                    keccak256(abi.encode(VOTE_RESULT_ROOT_TYPEHASH, resultRoot))
                )
            );
    }

    function hashProposalMessage(ProposalMessage memory message)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    PROPOSAL_MESSAGE_TYPEHASH,
                    message.timestamp,
                    message.spaceHash,
                    hashProposalPayload(message.payload)
                )
            );
    }

    function hashProposalPayload(ProposalPayload memory payload)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    PROPOSAL_PAYLOAD_TYPEHASH,
                    payload.nameHash,
                    payload.bodyHash,
                    keccak256(abi.encodePacked(toHashArray(payload.choices))),
                    payload.start,
                    payload.end,
                    keccak256(abi.encodePacked(payload.snapshot))
                )
            );
    }

    function hashVote(
        DaoRegistry dao,
        address actionId,
        VoteMessage memory message
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    DOMAIN_SEPARATOR(dao, actionId),
                    hashVoteInternal(message)
                )
            );
    }

    function hashVoteInternal(VoteMessage memory message)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    VOTE_MESSAGE_TYPEHASH,
                    message.timestamp,
                    hashVotePayload(message.payload)
                )
            );
    }

    function hashVotePayload(VotePayload memory payload)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    VOTE_PAYLOAD_TYPEHASH,
                    payload.choice,
                    payload.proposalHash
                )
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
                    DOMAIN_SEPARATOR(dao, actionId),
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

        dao.registerPotentialNewInternalToken(LOCKED_LOOT);
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
        require(vote.snapshot > 0, "the vote has not started yet");

        if (vote.resultRoot == bytes32(0) || vote.isChallenged) {
            require(
                _readyToSubmitResult(dao, vote, result.nbYes, result.nbNo),
                "the voting period need to end or the difference between yes and no need to be more than 50% of the votes"
            );
            _submitVoteResult(dao, vote, proposalId, result, resultRoot);
        } else {
            //TODO: we shouldnt' check nbYes + nbNo but rather the index (the number of voters)
            require(
                result.index > vote.index,
                "to override a result, the sum of yes and no has to be greater than the current one"
            );
            _submitVoteResult(dao, vote, proposalId, result, resultRoot);
        }
    }

    //TODO: generale challenge to go through each node to see which vote has been missing

    function _readyToSubmitResult(
        DaoRegistry dao,
        Voting storage vote,
        uint256 nbYes,
        uint256 nbNo
    ) internal view returns (bool) {
        uint256 diff;
        if (vote.nbYes > nbNo) {
            diff = nbYes - nbNo;
        } else {
            diff = nbNo - nbYes;
        }
        if (diff * 2 > dao.getPriorAmount(TOTAL, SHARES, vote.snapshot)) {
            return true;
        }

        uint256 votingPeriod = dao.getConfiguration(VotingPeriod);

        return vote.startingTime + votingPeriod > block.timestamp;
    }

    function _submitVoteResult(
        DaoRegistry dao,
        Voting storage vote,
        bytes32 proposalId,
        VoteResultNode memory result,
        bytes32 resultRoot
    ) internal {
        (address adapterAddress, ) = dao.proposals(proposalId);
        bytes32 hashCurrent = nodeHash(dao, adapterAddress, result);
        uint256 blockNumber = vote.snapshot;
        address reporter =
            recover(
                hashResultRoot(dao, adapterAddress, resultRoot),
                result.rootSig
            );
        address voter = dao.getPriorDelegateKey(result.account, blockNumber);
        require(
            verify(resultRoot, hashCurrent, result.proof),
            "result node & result merkle root / proof mismatch"
        );
        (address actionId, ) = dao.proposals(proposalId);
        require(
            _hasVoted(
                dao,
                actionId,
                voter,
                result.timestamp,
                result.proposalHash,
                result.sig
            ) != 0,
            "wrong vote signature!"
        );

        _lockFunds(dao, reporter);
        vote.nbNo = result.nbNo;
        vote.nbYes = result.nbYes;
        vote.index = result.index;
        vote.resultRoot = resultRoot;
        vote.reporter = reporter;
        vote.isChallenged = false;
        vote.gracePeriodStartingTime = block.timestamp;
    }

    function _lockFunds(DaoRegistry dao, address memberAddr) internal {
        uint256 lootToLock = dao.getConfiguration(StakingAmount);
        //lock if member has enough loot
        require(dao.isActiveMember(memberAddr), "must be an active member");
        require(
            dao.balanceOf(memberAddr, LOOT) >= lootToLock,
            "insufficient loot"
        );

        // lock loot
        dao.addToBalance(memberAddr, LOCKED_LOOT, lootToLock);
        dao.subtractFromBalance(memberAddr, LOOT, lootToLock);
    }

    function _releaseFunds(DaoRegistry dao, address memberAddr) internal {
        uint256 lootToRelease = dao.getConfiguration(StakingAmount);
        //release if member has enough locked loot
        require(dao.isActiveMember(memberAddr), "must be an active member");
        require(
            dao.balanceOf(memberAddr, LOCKED_LOOT) >= lootToRelease,
            "insufficient loot locked"
        );

        // release loot
        dao.addToBalance(memberAddr, LOOT, lootToRelease);
        dao.subtractFromBalance(memberAddr, LOCKED_LOOT, lootToRelease);
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
        ProposalMessage memory proposal = abi.decode(data, (ProposalMessage));
        return recover(hashMessage(dao, actionId, proposal), proposal.sig);
    }

    function startNewVotingForProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) public override onlyAdapter(dao) {
        // it is called from Registry
        ProposalMessage memory proposal = abi.decode(data, (ProposalMessage));
        (bool success, uint256 blockNumber) =
            _stringToUint(proposal.payload.snapshot);
        require(success, "snapshot conversion error");

        bytes32 proposalHash = hashMessage(dao, msg.sender, proposal);
        address addr = recover(proposalHash, proposal.sig);
        require(dao.isActiveMember(addr), "noActiveMember");
        require(
            blockNumber < block.number,
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
        returns (uint256 state)
    {
        Voting storage vote = votes[address(dao)][proposalId];
        if (vote.startingTime == 0) {
            return 0;
        }

        if (vote.isChallenged) {
            return 4;
        }

        if (
            block.timestamp <
            vote.startingTime + dao.getConfiguration(VotingPeriod)
        ) {
            return 4;
        }

        if (
            block.timestamp <
            vote.gracePeriodStartingTime + dao.getConfiguration(GracePeriod)
        ) {
            return 4;
        }

        if (vote.nbYes > vote.nbNo) {
            return 2;
        }
        if (vote.nbYes < vote.nbNo) {
            return 3;
        }

        return 1;
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
        uint256 weight =
            dao.getPriorAmount(nodeCurrent.account, SHARES, vote.snapshot);

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

    function _challengeResult(DaoRegistry dao, bytes32 proposalId) internal {
        // burn locked loot
        dao.subtractFromBalance(
            votes[address(dao)][proposalId].reporter,
            LOCKED_LOOT,
            dao.getConfiguration(StakingAmount)
        );
        votes[address(dao)][proposalId].isChallenged = true;
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
        bytes32 voteHashYes =
            hashVote(
                dao,
                actionId,
                VoteMessage(timestamp, VotePayload(1, proposalHash))
            );

        bytes32 voteHashNo =
            hashVote(
                dao,
                actionId,
                VoteMessage(timestamp, VotePayload(2, proposalHash))
            );

        if (recover(voteHashYes, sig) == voter) {
            return true;
        } else if (recover(voteHashNo, sig) == voter) {
            return false;
        } else {
            revert("invalid signature or signed for neither yes nor no");
        }
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
            hashVote(
                dao,
                actionId,
                VoteMessage(timestamp, VotePayload(1, proposalHash))
            );

        bytes32 voteHashNo =
            hashVote(
                dao,
                actionId,
                VoteMessage(timestamp, VotePayload(2, proposalHash))
            );

        if (recover(voteHashYes, sig) == voter) {
            return 1;
        } else if (recover(voteHashNo, sig) == voter) {
            return 2;
        } else {
            return 0;
        }
    }

    /**
     * @dev Recover signer address from a message by using his signature
     * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
     * @param sig bytes signature, the signature is generated using web3.eth.sign()
     */
    function recover(bytes32 hash, bytes memory sig)
        public
        pure
        returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;

        //Check the signature length
        if (sig.length != 65) {
            return (address(0));
        }

        // Divide the signature in r, s and v variables
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }

        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return (address(0));
        }
        return ecrecover(hash, v, r, s);
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
}
