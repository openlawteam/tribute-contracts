pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/Bank.sol";
import "../../core/DaoConstants.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../interfaces/IVoting.sol";
import "./Voting.sol";
import "./SnapshotProposalContract.sol";

/**
MIT License

Copyright (c) 2021 Openlaw

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

contract BatchVotingContract is
    IVoting,
    DaoConstants,
    MemberGuard,
    AdapterGuard
{
    struct Voting {
        uint256 snapshot;
        uint256 nbYes;
        uint256 nbNo;
        address actionId;
        bytes32 proposalHash;
        uint256 startingTime;
        uint256 gracePeriodStartingTime;
    }

    struct VotingResult {
        uint256 nbYes;
        uint256 nbNo;
    }

    struct VoteEntry {
        SnapshotProposalContract.VoteMessage vote;
        address memberAddress;
        bytes sig;
    }

    event NewVotResult(
        address dao,
        address actionId,
        uint256 nbYes,
        uint256 nbNo
    );

    string public constant ADAPTER_NAME = "BatchVotingContract";

    SnapshotProposalContract private _snapshotContract;

    bytes32 constant _VOTING_PERIOD = keccak256("batchvoting.votingPeriod");
    bytes32 constant _GRACE_PERIOD = keccak256("batchvoting.gracePeriod");

    mapping(address => mapping(bytes32 => Voting)) public votingSessions;

    constructor(SnapshotProposalContract _spc) {
        _snapshotContract = _spc;
    }

    function configureDao(
        DaoRegistry dao,
        uint256 votingPeriod,
        uint256 gracePeriod
    ) external onlyAdapter(dao) {
        dao.setConfiguration(_VOTING_PERIOD, votingPeriod);
        dao.setConfiguration(_GRACE_PERIOD, gracePeriod);
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
        VoteEntry[] memory votes
    ) external {
        Voting storage vote = votingSessions[address(dao)][proposalId];
        require(vote.snapshot > 0, "vote:not started");

        (uint256 nbYes, uint256 nbNo) = processVotes(dao, proposalId, votes);
        //if the new result has more weight than the previous one
        if (nbYes + nbNo > vote.nbYes + vote.nbNo) {
            if (
                vote.gracePeriodStartingTime == 0 ||
                ((nbYes > nbNo) != (vote.nbYes > nbNo))
            ) {
                vote.gracePeriodStartingTime = block.timestamp;
            }

            vote.nbYes = nbYes;
            vote.nbNo = nbNo;

            emit NewVotResult(address(dao), vote.actionId, nbYes, nbNo);
        }
    }

    function getAdapterName() external pure override returns (string memory) {
        return ADAPTER_NAME;
    }

    function processVotes(
        DaoRegistry dao,
        bytes32 proposalId,
        VoteEntry[] memory entries
    ) public view returns (uint256 nbYes, uint256 nbNo) {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        Voting storage voteState = votingSessions[address(dao)][proposalId];
        uint256 snapshot = voteState.snapshot;
        address actionId = voteState.actionId;

        for (uint256 i = 0; i < entries.length; i++) {
            VoteEntry memory entry = entries[i];

            uint256 weight = validateVote(dao, bank, actionId, snapshot, entry);

            if (entry.vote.payload.choice == 1) {
                nbYes += weight;
            } else {
                nbNo += weight;
            }
        }
    }

    function validateVote(
        DaoRegistry dao,
        BankExtension bank,
        address actionId,
        uint256 snapshot,
        VoteEntry memory entry
    ) public view returns (uint256) {
        bytes32 hashVote =
            _snapshotContract.hashVote(dao, actionId, entry.vote);

        address addr = recover(hashVote, entry.sig);

        address delegateKey =
            dao.getPriorDelegateKey(entry.memberAddress, snapshot);

        require(addr == delegateKey, "signing key mismatch");

        require(
            !dao.getMemberFlag(
                entry.memberAddress,
                DaoRegistry.MemberFlag.JAILED
            ),
            "member is jailed"
        );

        return bank.getPriorAmount(entry.memberAddress, SHARES, snapshot);
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
            blockNumber < block.number,
            "snapshot block number should not be in the future"
        );
        require(blockNumber > 0, "block number cannot be 0");

        votingSessions[address(dao)][proposalId].actionId = msg.sender;
        votingSessions[address(dao)][proposalId].startingTime = block.timestamp;
        votingSessions[address(dao)][proposalId].snapshot = blockNumber;
        votingSessions[address(dao)][proposalId].proposalHash = proposalHash;
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
        Voting storage vote = votingSessions[address(dao)][proposalId];
        if (vote.startingTime == 0) {
            return VotingState.NOT_STARTED;
        }

        if (
            block.timestamp <
            vote.startingTime + dao.getConfiguration(_VOTING_PERIOD)
        ) {
            return VotingState.IN_PROGRESS;
        }

        if (
            block.timestamp <
            vote.gracePeriodStartingTime + dao.getConfiguration(_GRACE_PERIOD)
        ) {
            return VotingState.IN_PROGRESS;
        }

        if (vote.nbYes > vote.nbNo) {
            return VotingState.PASS;
        }
        if (vote.nbYes < vote.nbNo) {
            return VotingState.NOT_PASS;
        }

        return VotingState.TIE;
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
