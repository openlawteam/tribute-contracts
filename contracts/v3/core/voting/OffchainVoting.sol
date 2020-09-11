pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

// SPDX-License-Identifier: MIT

import '../Registry.sol';
import '../Module.sol';
import '../interfaces/IProposal.sol';
import '../interfaces/IMember.sol';
import '../interfaces/IVoting.sol';
import '../../helpers/FlagHelper.sol';

contract OffchainVotingContract is IVoting, Module {

    using FlagHelper for uint256;

    struct VotingConfig {
        uint256 flags;
        uint256 votingPeriod;
        uint256 votingCount;
    }
    struct Voting {
        bytes32 snapshotRoot;
        bytes32 resultRoot;
        uint256 nbVoters;
        uint256 nbYes;
        uint256 nbNo;
        uint256 startingTime;
        bool isChallenged;
    }

    struct VoteResultNode {
        address voter;
        uint256 nbNo;
        uint256 nbYes;
        uint256 weight;
        bytes sig;
        bytes proof;
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
    function voteResult(Registry dao, uint256 proposalId) override external view returns (uint256 state) {
        Voting storage vote = votes[address(dao)][proposalId];
        if(vote.startingTime == 0) {
            return 0;
        }

        if(vote.nbYes * 2 > vote.nbVoters) {
            return 2;
        }

        if(vote.nbNo * 2 > vote.nbVoters) {
            return 2;
        }

        if(block.timestamp < vote.startingTime + votingConfigs[address(dao)].votingPeriod) {
            return 4;
        }

        if(vote.nbYes > vote.nbNo) {
            return 2;
        } 
        if (vote.nbYes < vote.nbNo) {
            return 3;
        } 

        return 1;
    }
    
    function submitVoteResult(Registry dao, uint256 proposalId, uint256 nbYes, uint256 nbNo, bytes32 resultRoot) external {
        Voting storage vote = votes[address(dao)][proposalId];
        vote.nbNo = nbNo;
        vote.nbYes = nbYes;
        vote.resultRoot = resultRoot;
    }

    function startNewVotingForProposal(Registry dao, uint256 proposalId, bytes memory data) override external returns (uint256) {
        require(data.length == 64, "vote data should represent a merkle tree root (bytes32) and number of voters (uint256)");
    
        Voting storage vote = votes[address(dao)][proposalId];
        vote.startingTime = block.timestamp;
        bytes32 root;
        uint256 nbVoters;

        assembly {
            root := mload(add(data, 32))
        }

        assembly {
            nbVoters := mload(add(data, 64))
        }

        vote.snapshotRoot = root;
        vote.nbVoters = nbVoters;
    }

    function challengeWrongOrder(Registry dao, uint256 proposalId, uint256 index, VoteResultNode memory nodePrevious, VoteResultNode memory nodeCurrent) view external {
        require(index > 0, "check between current and previous, index cannot be 0");
        Voting memory vote = votes[address(dao)][proposalId];
        bytes32 hashCurrent = keccak256(abi.encode(nodeCurrent.voter, nodeCurrent.weight, nodeCurrent.sig, nodeCurrent.nbYes, nodeCurrent.nbNo));
        bytes32 hashPrevious = keccak256(abi.encode(nodePrevious.voter, nodePrevious.weight, nodePrevious.sig, nodePrevious.nbYes, nodePrevious.nbNo));
        require(checkProofOrdered(nodeCurrent.proof, vote.resultRoot, hashCurrent, index), "proof check for current mismatch!");
        require(checkProofOrdered(nodePrevious.proof, vote.resultRoot, hashPrevious, index - 1), "proof check for previous mismatch!");

        bytes32 proposalHash = keccak256(abi.encode(vote.snapshotRoot, address(dao), proposalId));
        if(hasVotedYes(nodeCurrent.voter, proposalHash, nodeCurrent.sig)) {
            if(nodePrevious.nbYes + 1 != nodeCurrent.nbYes) {
                //reset vote
            } else if (nodePrevious.nbNo != nodeCurrent.nbNo) {
                //reset vote
            }
        } else {
            if(nodePrevious.nbYes != nodeCurrent.nbYes) {
                //reset vote
            } else if (nodePrevious.nbNo + 1 != nodeCurrent.nbNo) {
                //reset vote
            }
        }
    }

    function hasVotedYes(address voter, bytes32 proposalHash, bytes memory sig) internal pure returns(bool) {
        if(recover(keccak256(abi.encode(proposalHash, 1)), sig) == voter) {
            return true;
        } else if (recover(keccak256(abi.encode(proposalHash, 2)), sig) == voter) {
            return false;
        } else {
            revert("invalid signature");
        }
    }

    /**
     * @dev Returns the address that signed a hashed message (`hash`) with
     * `signature`. This address can then be used for verification purposes.
     *
     * The `ecrecover` EVM opcode allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {toEthSignedMessageHash} on it.
     */
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        // Check the signature length
        if (signature.length != 65) {
            revert("ECDSA: invalid signature length");
        }

        // Divide the signature in r, s and v variables
        bytes32 r;
        bytes32 s;
        uint8 v;

        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (281): 0 < s < secp256k1n ÷ 2 + 1, and for v in (282): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert("ECDSA: invalid signature 's' value");
        }

        if (v != 27 && v != 28) {
            revert("ECDSA: invalid signature 'v' value");
        }

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "ECDSA: invalid signature");

        return signer;
    }

    function fixResult(Registry dao, uint256 proposalId, address voter, uint256 weight, uint256 nbYes, uint256 nbNo, bytes calldata voteSignature, bytes memory proof) view external {
        Voting memory vote = votes[address(dao)][proposalId];
        bytes32 hash = keccak256(abi.encode(voter, weight, voteSignature, nbYes, nbNo));
        require(checkProofOrdered(proof, vote.resultRoot, hash, vote.nbVoters), "proof check mismatch!");
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