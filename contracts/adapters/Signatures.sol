pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/ISignatures.sol";
import "../core/DaoRegistry.sol";
import "../extensions/erc1271/ERC1271.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";
import "../helpers/DaoHelper.sol";

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

contract SignaturesContract is ISignatures, AdapterGuard, Reimbursable {
    struct ProposalDetails {
        bytes32 permissionHash;
        bytes32 signatureHash;
        bytes4 magicValue;
    }

    // keeps track of all signature proposals handled by each dao
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /**
     * @notice Creates and sponsors a signature proposal.
     * @dev Only members of the DAO can sponsor a signature proposal.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     * @param permissionHash The hash of the data to be signed
     * @param signatureHash The hash of the signature to be marked as valid
     * @param magicValue The value to return when a signature is valid
     * @param data Additional details about the signature proposal.
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes32 permissionHash,
        bytes32 signatureHash,
        bytes4 magicValue,
        bytes memory data
    ) external override reimbursable(dao) {
        dao.submitProposal(proposalId);

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        proposal.permissionHash = permissionHash;
        proposal.signatureHash = signatureHash;
        proposal.magicValue = magicValue;

        IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
        address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );

        dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    /**
     * @notice Processing a signature proposal to mark the data as valid
     * @dev Only proposals that were not processed are accepted.
     * @dev Only proposals that were sponsored are accepted.
     * @dev Only proposals that passed can get processed
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reimbursable(dao)
    {
        ProposalDetails memory details = proposals[address(dao)][proposalId];

        IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
        require(address(votingContract) != address(0), "adapter not found");

        require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal needs to pass"
        );
        dao.processProposal(proposalId);
        ERC1271Extension erc1271 = ERC1271Extension(
            dao.getExtensionAddress(DaoHelper.ERC1271)
        );

        erc1271.sign(
            details.permissionHash,
            details.signatureHash,
            details.magicValue
        );
    }
}
