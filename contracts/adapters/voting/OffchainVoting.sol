pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../core/DaoConstants.sol";
import "../interfaces/IVoting.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
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
    VotingContract private _fallbackVoting;

    struct VotingConfig {
        uint256 votingPeriod;
        uint256 gracePeriod;
        uint256 stakingAmount;
        uint256 fallbackThreshold;
    }

    struct Voting {
        uint256 blockNumber;
        address reporter;
        bytes32 resultRoot;
        uint256 nbVoters;
        uint256 nbYes;
        uint256 nbNo;
        uint256 startingTime;
        uint256 gracePeriodStartingTime;
        bool isChallenged;
        mapping(address => bool) fallbackVotes;
        uint256 fallbackVotesCount;
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

    mapping(address => mapping(uint256 => Voting)) public votes;
    mapping(address => VotingConfig) public votingConfigs;

    constructor(VotingContract _c) {
        _fallbackVoting = _c;
    }

    function configureDao(
        DaoRegistry dao,
        uint256 votingPeriod,
        uint256 gracePeriod,
        uint256 fallbackThreshold
    ) external onlyAdapter(dao) {
        votingConfigs[address(dao)].votingPeriod = votingPeriod;
        votingConfigs[address(dao)].gracePeriod = gracePeriod;
        votingConfigs[address(dao)].fallbackThreshold = fallbackThreshold;
    }

    function submitVoteResult(
        DaoRegistry dao,
        uint256 proposalId,
        bytes32 resultRoot,
        VoteResultNode memory result
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        require(vote.blockNumber > 0, "the vote has not started yet");
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
         */

        if (vote.resultRoot == bytes32(0) || vote.isChallenged) {
            require(
                _readyToSubmitResult(dao, vote, result.nbYes, result.nbNo),
                "the voting period need to end or the difference between yes and no need to be more than 50% of the votes"
            );
            _submitVoteResult(dao, vote, proposalId, result, resultRoot);
        } else {
            require(
                result.nbYes + result.nbNo > vote.nbYes + vote.nbNo,
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
        if (diff * 2 > dao.getPriorVotes(dao.TOTAL(), vote.blockNumber)) {
            return true;
        }

        uint256 votingPeriod = votingConfigs[address(dao)].votingPeriod;

        return vote.startingTime + votingPeriod > block.timestamp;
    }

    function _submitVoteResult(
        DaoRegistry dao,
        Voting storage vote,
        uint256 proposalId,
        VoteResultNode memory result,
        bytes32 resultRoot
    ) internal {
        bytes32 hashCurrent = _nodeHash(result);
        uint256 blockNumber = vote.blockNumber;
        address voter = result.voter;
        require(
            verify(resultRoot, hashCurrent, result.proof),
            "result node & result merkle root / proof mismatch"
        );

        bytes32 proposalHash = keccak256(
            abi.encode(blockNumber, address(dao), proposalId)
        );
        require(
            _hasVoted(voter, proposalHash, result.sig) != 0,
            "wrong vote signature!"
        );

        uint256 correctWeight = dao.getPriorVotes(voter, blockNumber);

        //Incorrect weight
        require(correctWeight == result.weight, "wrong weight!");

        _lockFunds(dao, msg.sender);
        vote.nbNo = result.nbNo;
        vote.nbYes = result.nbYes;
        vote.resultRoot = resultRoot;
        vote.reporter = msg.sender;
        vote.isChallenged = false;
        vote.gracePeriodStartingTime = block.timestamp;
    }

    function _lockFunds(DaoRegistry dao, address memberAddr) internal {
        uint256 lootToLock = votingConfigs[address(dao)].stakingAmount;
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
        uint256 lootToRelease = votingConfigs[address(dao)].stakingAmount;
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

    function startNewVotingForProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes memory data /*onlyAdapter(dao)*/
    ) external override onlyAdapter(dao) {
        // it is called from Registry
        require(
            data.length == 32,
            "vote data should represent the block number for snapshot"
        );

        uint256 blockNumber;

        assembly {
            blockNumber := mload(add(data, 32))
        }

        require(
            blockNumber < block.number,
            "snapshot block number should not be in the future"
        );
        require(blockNumber > 0, "block number cannot be 0");

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
    function voteResult(DaoRegistry dao, uint256 proposalId)
        external
        override
        view
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
            vote.startingTime + votingConfigs[address(dao)].votingPeriod
        ) {
            return 4;
        }

        if (
            block.timestamp <
            vote.gracePeriodStartingTime +
                votingConfigs[address(dao)].gracePeriod
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
        uint256 proposalId,
        VoteResultNode memory nodeCurrent
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;
        uint256 blockNumber = vote.blockNumber;
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = _nodeHash(nodeCurrent);
        require(
            verify(resultRoot, hashCurrent, nodeCurrent.proof),
            "proof check for current invalid for current node"
        );

        bytes32 proposalHash = keccak256(
            abi.encode(blockNumber, address(dao), proposalId)
        );
        //return 1 if yes, 2 if no and 0 if the vote is incorrect
        if (_hasVoted(nodeCurrent.voter, proposalHash, nodeCurrent.sig) == 0) {
            _challengeResult(dao, proposalId);
        }
    }

    function challengeWrongWeight(
        DaoRegistry dao,
        uint256 proposalId,
        VoteResultNode memory nodeCurrent
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;
        uint256 blockNumber = vote.blockNumber;
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = _nodeHash(nodeCurrent);
        require(
            verify(resultRoot, hashCurrent, nodeCurrent.proof),
            "proof check for current invalid for current node"
        );

        uint256 correctWeight = dao.getPriorVotes(
            nodeCurrent.voter,
            blockNumber
        );

        //Incorrect weight
        if (correctWeight != nodeCurrent.weight) {
            _challengeResult(dao, proposalId);
        }
    }

    function challengeDuplicate(
        DaoRegistry dao,
        uint256 proposalId,
        VoteResultNode memory node1,
        VoteResultNode memory node2
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = _nodeHash(node1);
        bytes32 hashPrevious = _nodeHash(node2);
        require(
            verify(resultRoot, hashCurrent, node1.proof),
            "proof check for current invalid for current node"
        );
        require(
            verify(resultRoot, hashPrevious, node2.proof),
            "proof check for previous invalid for previous node"
        );

        if (node1.voter == node2.voter) {
            _challengeResult(dao, proposalId);
        }
    }

    function challengeWrongStep(
        DaoRegistry dao,
        uint256 proposalId,
        VoteResultNode memory nodePrevious,
        VoteResultNode memory nodeCurrent
    ) external {
        Voting storage vote = votes[address(dao)][proposalId];
        bytes32 resultRoot = vote.resultRoot;
        uint256 blockNumber = vote.blockNumber;
        require(resultRoot != bytes32(0), "no result available yet!");
        bytes32 hashCurrent = _nodeHash(nodeCurrent);
        bytes32 hashPrevious = _nodeHash(nodePrevious);
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

        require(
            nodeCurrent.index == nodePrevious.index + 1,
            "those nodes are not consecutive"
        );

        //voters not in order
        if (nodeCurrent.voter > nodePrevious.voter) {
            _challengeResult(dao, proposalId);
        }

        _checkStep(dao, nodeCurrent, nodePrevious, proposalHash, proposalId);
    }

    function requestFallback(DaoRegistry dao, uint256 proposalId)
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

    function _nodeHash(VoteResultNode memory node)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    node.voter,
                    node.weight,
                    node.sig,
                    node.nbYes,
                    node.nbNo,
                    node.index
                )
            );
    }

    function _checkStep(
        DaoRegistry dao,
        VoteResultNode memory nodeCurrent,
        VoteResultNode memory nodePrevious,
        bytes32 proposalHash,
        uint256 proposalId
    ) internal {
        if (_hasVotedYes(nodeCurrent.voter, proposalHash, nodeCurrent.sig)) {
            if (nodePrevious.nbYes + 1 != nodeCurrent.nbYes) {
                _challengeResult(dao, proposalId);
            } else if (nodePrevious.nbNo != nodeCurrent.nbNo) {
                _challengeResult(dao, proposalId);
            }
        } else {
            if (nodePrevious.nbYes != nodeCurrent.nbYes) {
                _challengeResult(dao, proposalId);
            } else if (nodePrevious.nbNo + 1 != nodeCurrent.nbNo) {
                _challengeResult(dao, proposalId);
            }
        }
    }

    function _challengeResult(DaoRegistry dao, uint256 proposalId) internal {
        // burn locked loot
        dao.subtractFromBalance(
            votes[address(dao)][proposalId].reporter,
            LOCKED_LOOT,
            votingConfigs[address(dao)].stakingAmount
        );
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

    function _hasVotedYes(
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

    function _hasVoted(
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
