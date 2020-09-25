pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

// SPDX-License-Identifier: MIT

import "../../core/Registry.sol";
import "../../core/Module.sol";
import "../../core/interfaces/IProposal.sol";
import "../../core/interfaces/IMember.sol";
import "../interfaces/IVoting.sol";
import "../../guards/AdapterGuard.sol";
import "../../guards/ModuleGuard.sol";
import "../../helpers/FlagHelper.sol";

contract OffchainVotingContract is IVoting, Module, AdapterGuard, ModuleGuard {
    using FlagHelper for uint256;

    struct VotingConfig {
        uint256 flags;
        uint256 votingPeriod;
        uint256 votingCount;
    }
    struct Voting {
        uint256 blockNumber;
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
        uint256 index;
        bytes32[] proof;
    }

    mapping(address => mapping(uint256 => Voting)) private votes;
    mapping(address => VotingConfig) private votingConfigs;

    function registerDao(Registry dao, uint256 votingPeriod)
        external
        override
        onlyModule(dao)
    {
        votingConfigs[address(dao)].flags = 1; // mark as exists
        votingConfigs[address(dao)].votingPeriod = votingPeriod;
    }

    function submitVoteResult(
        Registry dao,
        uint256 proposalId,
        uint256 nbYes,
        uint256 nbNo,
        bytes32 resultRoot
    ) external onlyMember(dao) {
        //TODO: check vote status
        //TODO: if vote result already exists, check that the new one should be able to override
        votes[address(dao)][proposalId].nbNo = nbNo;
        votes[address(dao)][proposalId].nbYes = nbYes;
        votes[address(dao)][proposalId].resultRoot = resultRoot;
    }

    function startNewVotingForProposal(
        Registry dao,
        uint256 proposalId,
        bytes memory data
    ) external override onlyModule(dao) returns (uint256) {
        require(
            data.length == 32,
            "vote data should represent the block number for snapshot"
        );

        uint256 blockNumber;

        assembly {
            blockNumber := mload(add(data, 32))
        }
        
        votes[address(dao)][proposalId].startingTime = block.timestamp;
        votes[address(dao)][proposalId].blockNumber = blockNumber;
    }

    /**
    possible results here:
    0: has not started
    1: tie
    2: pass
    3: not pass
    4: in progress
     */
    function voteResult(Registry dao, uint256 proposalId)
        external
        override
        view
        returns (uint256 state)
    {
        Voting storage vote = votes[address(dao)][proposalId];
        if (vote.startingTime == 0) {
            return 0;
        }

        if (vote.nbYes * 2 > vote.nbVoters) {
            return 2;
        }

        if (vote.nbNo * 2 > vote.nbVoters) {
            return 2;
        }

        if (
            block.timestamp <
            vote.startingTime + votingConfigs[address(dao)].votingPeriod
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
        Registry dao,
        uint256 proposalId,
        VoteResultNode memory nodeCurrent
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;
        uint256 blockNumber = vote.blockNumber;
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = nodeHash(nodeCurrent);
        require(
            verify(resultRoot, hashCurrent, nodeCurrent.proof),
            "proof check for current invalid for current node"
        );

        bytes32 proposalHash = keccak256(
            abi.encode(blockNumber, address(dao), proposalId)
        );
        //return 1 if yes, 2 if no and 0 if the vote is incorrect
        if(hasVoted(nodeCurrent.voter, proposalHash, nodeCurrent.sig) == 0) {
            challengeResult(dao, proposalId);
        }
    }

    function challengeDuplicate(
        Registry dao,
        uint256 proposalId,
        VoteResultNode memory node1,
        VoteResultNode memory node2
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = nodeHash(node1);
        bytes32 hashPrevious = nodeHash(node2);
        require(
            verify(resultRoot, hashCurrent, node1.proof),
            "proof check for current invalid for current node"
        );
        require(
            verify(resultRoot, hashPrevious, node2.proof),
            "proof check for previous invalid for previous node"
        );
        
        if(node1.voter == node2.voter) {
            challengeResult(dao, proposalId);
        }
    }

    function challengeWrongStep(
        Registry dao,
        uint256 proposalId,
        VoteResultNode memory nodePrevious,
        VoteResultNode memory nodeCurrent
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;
        uint256 blockNumber = vote.blockNumber;
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = nodeHash(nodeCurrent);
        bytes32 hashPrevious = nodeHash(nodePrevious);
        require(
            verify(resultRoot, hashCurrent, nodeCurrent.proof),
            "proof check for current invalid for current node"
        );
        require(
            verify(resultRoot, hashPrevious, nodePrevious.proof),
            "proof check for previous invalid for previous node"
        );

        bytes32 proposalHash = keccak256(
            abi.encode(blockNumber, address(dao), proposalId)
        );
        if(nodeCurrent.index != nodePrevious.index + 1) {
            challengeResult(dao, proposalId);
        }

        if(nodeCurrent.voter > nodePrevious.voter) {
            challengeResult(dao, proposalId);
        }
        
        checkStep(dao, nodeCurrent, nodePrevious, proposalHash, proposalId);
    }

    function nodeHash(VoteResultNode memory node) internal pure returns (bytes32) {
        return keccak256(abi.encode(node.voter, node.weight, node.sig, node.nbYes , node.nbNo, node.index));
    }

    function checkStep(Registry dao, VoteResultNode memory nodeCurrent, VoteResultNode memory nodePrevious, bytes32 proposalHash, uint256 proposalId) internal {
        if (hasVotedYes(nodeCurrent.voter, proposalHash, nodeCurrent.sig)) {
            if (nodePrevious.nbYes + 1 != nodeCurrent.nbYes) {
                challengeResult(dao, proposalId);
            } else if (nodePrevious.nbNo != nodeCurrent.nbNo) {
                challengeResult(dao, proposalId);
            }
        } else {
            if (nodePrevious.nbYes != nodeCurrent.nbYes) {
                challengeResult(dao, proposalId);
            } else if (nodePrevious.nbNo + 1 != nodeCurrent.nbNo) {
                challengeResult(dao, proposalId);
            }
        }
    }

    function challengeResult(Registry dao, uint256 proposalId) internal {
        votes[address(dao)][proposalId].isChallenged = true;
    }

    function getSignedHash(
        bytes32 snapshotRoot,
        address dao,
        uint256 proposalId
    ) external pure returns (bytes32) {
        bytes32 proposalHash = keccak256(
            abi.encode(snapshotRoot, dao, proposalId)
        );
        return keccak256(abi.encode(proposalHash, 1));
    }

    function getSignedAddress(
        bytes32 snapshotRoot,
        address dao,
        uint256 proposalId,
        bytes calldata sig
    ) external pure returns (address) {
        bytes32 proposalHash = keccak256(
            abi.encode(snapshotRoot, dao, proposalId)
        );
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

    function hasVotedYes(
        address voter,
        bytes32 proposalHash,
        bytes memory sig
    ) internal pure returns (bool) {
        if (
            recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        keccak256(abi.encode(proposalHash, 1))
                    )
                ),
                sig
            ) == voter
        ) {
            return true;
        } else if (
            recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        keccak256(abi.encode(proposalHash, 2))
                    )
                ),
                sig
            ) == voter
        ) {
            return false;
        } else {
            revert("invalid signature or signed for neither yes nor no");
        }
    }

    function hasVoted(
        address voter,
        bytes32 proposalHash,
        bytes memory sig
    ) internal pure returns (uint256) {
        if (
            recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        keccak256(abi.encode(proposalHash, 1))
                    )
                ),
                sig
            ) == voter
        ) {
            return 1;
        } else if (
            recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        keccak256(abi.encode(proposalHash, 2))
                    )
                ),
                sig
            ) == voter
        ) {
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
