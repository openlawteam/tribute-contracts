pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

// SPDX-License-Identifier: MIT

import '../../core/Registry.sol';
import '../../core/Module.sol';
import '../../core/interfaces/IProposal.sol';
import '../../core/interfaces/IMember.sol';
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
        bytes32[] proof;
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
        //TODO: check vote status
        //TODO: if vote result already exists, check that the new one should be able to override
        votes[address(dao)][proposalId].nbNo = nbNo;
        votes[address(dao)][proposalId].nbYes = nbYes;
        votes[address(dao)][proposalId].resultRoot = resultRoot;
    }

    function startNewVotingForProposal(Registry dao, uint256 proposalId, bytes memory data) override external returns (uint256) {
        require(data.length == 64, "vote data should represent a merkle tree root (bytes32) and number of voters (uint256)");

        bytes32 root;
        uint256 nbVoters;

        assembly {
            root := mload(add(data, 32))
        }

        assembly {
            nbVoters := mload(add(data, 64))
        }
        require(root != bytes32(0), "snapshot root cannot be 0");
        require(nbVoters > 0, "nb voters being 0 means no one can vote");
        votes[address(dao)][proposalId].startingTime = block.timestamp;
        votes[address(dao)][proposalId].snapshotRoot = root;
        votes[address(dao)][proposalId].nbVoters = nbVoters;
    }

    function challengeWrongOrder(Registry dao, uint256 proposalId, uint256 index, VoteResultNode memory nodePrevious, VoteResultNode memory nodeCurrent) external {
        require(index > 0, "check between current and previous, index cannot be 0");
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;
        bytes32 snapshotRoot = vote.snapshotRoot;
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = keccak256(abi.encode(nodeCurrent.voter, nodeCurrent.weight, nodeCurrent.sig, nodeCurrent.nbYes, nodeCurrent.nbNo));
        bytes32 hashPrevious = keccak256(abi.encode(nodePrevious.voter, nodePrevious.weight, nodePrevious.sig, nodePrevious.nbYes, nodePrevious.nbNo));
        require(verify(resultRoot, hashCurrent, nodeCurrent.proof), "proof check for current invalid! ");
        require(verify(resultRoot, hashPrevious, nodePrevious.proof), "proof check for previous invalid!");

        bytes32 proposalHash = keccak256(abi.encode(snapshotRoot, address(dao), proposalId));
        if(hasVotedYes(nodeCurrent.voter, proposalHash, nodeCurrent.sig)) {
            if(nodePrevious.nbYes + 1 != nodeCurrent.nbYes) {
                votes[address(dao)][proposalId].isChallenged = true;
            } else if (nodePrevious.nbNo != nodeCurrent.nbNo) {
                votes[address(dao)][proposalId].isChallenged = true;
            }
        } else {
            if(nodePrevious.nbYes != nodeCurrent.nbYes) {
                votes[address(dao)][proposalId].isChallenged = true;
            } else if (nodePrevious.nbNo + 1 != nodeCurrent.nbNo) {
                votes[address(dao)][proposalId].isChallenged = true;
            }
        }
    }

    function getSignedHash(bytes32 snapshotRoot, address dao, uint256 proposalId) external pure returns (bytes32) {
        bytes32 proposalHash = keccak256(abi.encode(snapshotRoot, dao, proposalId));
        return keccak256(abi.encode(proposalHash, 1));
    }

    function getSignedAddress(bytes32 snapshotRoot, address dao, uint256 proposalId, bytes calldata sig) external pure returns (address) {
        bytes32 proposalHash = keccak256(abi.encode(snapshotRoot, dao, proposalId));
        return recover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encode(proposalHash, 1)))), sig);
    }

    function hasVotedYes(address voter, bytes32 proposalHash, bytes memory sig) internal pure returns(bool) {
        if(recover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encode(proposalHash, 1)))), sig) == voter) {
            return true;
        } else if (recover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encode(proposalHash, 2)))), sig) == voter) {
            return false;
        } else {
            revert("invalid signature or signed for neither yes nor no");
        }
    }

    /**
   * @dev Recover signer address from a message by using his signature
   * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
   * @param sig bytes signature, the signature is generated using web3.eth.sign()
   */
  function recover(bytes32 hash, bytes memory sig) public pure returns (address) {
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
    } else {
      return ecrecover(hash, v, r, s);
    }
  }

    function fixResult(Registry dao, uint256 proposalId, address voter, uint256 weight, uint256 nbYes, uint256 nbNo, bytes calldata voteSignature, bytes32[] memory proof) view external {
        Voting memory vote = votes[address(dao)][proposalId];
        bytes32 hash = keccak256(abi.encode(voter, weight, voteSignature, nbYes, nbNo));
        require(verify(vote.resultRoot, hash, proof), "proof check mismatch!");
        if(vote.nbYes != nbYes) {
            vote.nbYes = nbYes;
        }
        if(vote.nbNo != nbNo) {
            vote.nbNo = nbNo;
        }
    }

    function verify(
    bytes32 root,
    bytes32 leaf,
    bytes32[] memory proof
  )
    public
    pure
    returns (bool)
  {
    bytes32 computedHash = leaf;

    for (uint256 i = 0; i < proof.length; i++) {
      bytes32 proofElement = proof[i];

      if (computedHash < proofElement) {
        // Hash(current computed hash + current element of the proof)
        computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
      } else {
        // Hash(current element of the proof + current computed hash)
        computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
      }
    }

    // Check if the computed hash (root) is equal to the provided root
    return computedHash == root;
  }
}