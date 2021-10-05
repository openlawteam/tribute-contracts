pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IManaging.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/AdapterGuard.sol";
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

contract ManagingContract is IManaging, AdapterGuard {
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /**
     * @notice Creates a proposal to replace, remove or add an adapter.
     * @dev If the adapterAddress is equal to 0x0, the adapterId is removed from the registry if available.
     * @dev If the adapterAddress is a reserved address, it reverts.
     * @dev keys and value must have the same length.
     * @dev proposalId can not be reused.
     * @param dao The dao address.
     * @param proposalId Tproposal details
     * @param proposal The proposal details
     * @param data Additional data to pass to the voting contract and identify the submitter
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        ProposalDetails calldata proposal,
        bytes calldata data
    ) external override reentrancyGuard(dao) {
        require(
            proposal.keys.length == proposal.values.length,
            "must be an equal number of config keys and values"
        );

        require(
            proposal.extensionAddresses.length ==
                proposal.extensionAclFlags.length,
            "must be an equal number of extension addresses and acl"
        );

        require(proposal.flags < type(uint128).max, "proposal flags overflow");

        require(
            DaoHelper.isNotReservedAddress(proposal.adapterOrExtensionAddr),
            "address is reserved"
        );

        dao.submitProposal(proposalId);

        proposals[address(dao)][proposalId] = proposal;

        IVoting votingContract =
            IVoting(dao.getAdapterAddress(DaoHelper.VOTING));

        address senderAddress =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );

        dao.sponsorProposal(proposalId, senderAddress, address(votingContract));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    /**
     * @notice Processes a proposal that was sponsored.
     * @dev Only members can process a proposal.
     * @dev Only if the voting pass the proposal is processed.
     * @dev Reverts when the adapter address is already in use and it is an adapter addition.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     */
    // slither-disable-next-line reentrancy-benign
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reentrancyGuard(dao)
    {
        ProposalDetails memory proposal = proposals[address(dao)][proposalId];

        IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
        require(address(votingContract) != address(0), "adapter not found");

        require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal did not pass"
        );

        dao.processProposal(proposalId);
        if (proposal.updateType == UpdateType.ADAPTER) {
            dao.replaceAdapter(
                proposal.adapterOrExtensionId,
                proposal.adapterOrExtensionAddr,
                proposal.flags,
                proposal.keys,
                proposal.values
            );
        } else if (proposal.updateType == UpdateType.EXTENSION) {
            if (dao.extensions(proposal.adapterOrExtensionId) != address(0x0)) {
                dao.removeExtension(proposal.adapterOrExtensionId);
            }

            if (proposal.adapterOrExtensionAddr != address(0x0)) {
                dao.addExtension(
                    proposal.adapterOrExtensionId,
                    IExtension(proposal.adapterOrExtensionAddr),
                    dao.getMemberAddress(0)
                );
            }
        } else {
            revert("unknown update type");
        }

        for (uint128 i = 0; i < proposal.extensionAclFlags.length; i++) {
            //slither-disable-next-line calls-loop
            dao.setAclToExtensionForAdapter(
                proposal.extensionAddresses[i],
                proposal.adapterOrExtensionAddr,
                proposal.extensionAclFlags[i]
            );
        }
    }
}
