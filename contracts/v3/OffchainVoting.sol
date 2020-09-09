pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './ModuleRegistry.sol';
import './Proposal.sol';
import './Member.sol';
import './HelperMoloch.sol';

contract OffchainVotingContract is IVotingContract {

    bytes32 constant MEMBER_MODULE = keccak256("member");

    using FlagHelper for uint256;

    struct VotingConfig {
        uint256 flags;
        uint256 votingPeriod;
        uint256 votingCount;
    }
    struct Voting {
        bytes32 snapshotRoot;
        bytes32 resultRoot;
        uint256 nbYes;
        uint256 nbNo;
        uint256 startingTime;
    }
    
    mapping(address => mapping(uint256 => Voting)) votes;
    mapping(address => VotingConfig) votingConfigs;

    function registerDao(address dao, uint256 votingPeriod) override external {
        votingConfigs[dao].flags = 1; // mark as exists
        votingConfigs[dao].votingPeriod = votingPeriod;
    }

    /**
    possible results here:
    0: has not started
    1: tie
    2: pass
    3: not pass
    4: in progress
     */
    function voteResult(ModuleRegistry dao, uint256 proposalId) override external view returns (uint256 state) {
        Voting storage vote = votes[address(dao)][proposalId];
        if(vote.startingTime == 0) {
            return 0;
        }

        if(block.timestamp < vote.startingTime + votingConfigs[address(dao)].votingPeriod) {
            return 4;
        }

        if(vote.nbYes > vote.nbNo) {
            return 2;
        } else if (vote.nbYes < vote.nbNo) {
            return 3;
        } else {
            return 1;
        }
    }
    
    function submitVoteResult(ModuleRegistry dao, uint256 proposalId, uint256 nbYes, uint256 nbNo, bytes32 resultRoot) external {
        Voting storage vote = votes[address(dao)][proposalId];
        vote.nbNo = nbNo;
        vote.nbYes = nbYes;
        vote.resultRoot = resultRoot;
    }

    function startNewVotingForProposal(ModuleRegistry dao, uint256 proposalId, bytes memory data) override external returns (uint256) {
        require(data.length == 32, "vote data should represent a merkle tree root (bytes32)");
    
        Voting storage vote = votes[address(dao)][proposalId];
        vote.startingTime = block.timestamp;
        bytes32 root;

        assembly {
            root := mload(add(data, 32))
        }

        vote.snapshotRoot = root;
    }

    function prepareData(address voter, uint256 weight, bytes memory voteSignature, uint256 nbYes, uint256 nbNo, bytes32 previousHash, bytes32 nextHash) public pure returns (bytes memory) {
        return abi.encode(voter, weight, voteSignature, nbYes, nbNo, previousHash, nextHash);
    }

    function fixResult(ModuleRegistry dao, uint256 proposalId, address voter, uint256 weight, uint256 nbYes, uint256 nbNo, bytes calldata voteSignature, bytes32 previousHash, bytes memory proof, uint256 index) view external {
        Voting memory vote = votes[address(dao)][proposalId];
        bytes memory data = prepareData(voter, weight, voteSignature, nbYes, nbNo, previousHash, bytes32(0));
        bytes32 hash = keccak256(data);
        require(checkProofOrdered(proof, vote.resultRoot, hash, index), "proof check mismatch!");
        if(vote.nbYes != nbYes) {
            vote.nbYes = nbYes;
        }
        if(vote.nbNo != nbNo) {
            vote.nbNo = nbNo;
        }
    }

    function checkProofOrdered(bytes memory proof, bytes32 root, bytes32 hash, uint256 index) pure internal returns (bool) {
        // use the index to determine the node ordering
        // index ranges 1 to n

        bytes32 el;
        bytes32 h = hash;
        uint256 remaining;

        for (uint256 j = 32; j <= proof.length; j += 32) {
        assembly {
            el := mload(add(proof, j))
        }

        // calculate remaining elements in proof
        remaining = (proof.length - j + 32) / 32;

        // we don't assume that the tree is padded to a power of 2
        // if the index is odd then the proof will start with a hash at a higher
        // layer, so we have to adjust the index to be the index at that layer
        while (remaining > 0 && index % 2 == 1 && index > 2 ** remaining) {
            index = uint(index) / 2 + 1;
        }

        if (index % 2 == 0) {
            h = keccak256(abi.encodePacked(el, h));
            index = index / 2;
        } else {
            h = keccak256(abi.encodePacked(h, el));
            index = uint(index) / 2 + 1;
        }
        }

        return h == root;
    }
}