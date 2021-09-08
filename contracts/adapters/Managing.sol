pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IManaging.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";

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

contract ManagingContract is
    IManaging,
    DaoConstants,
    MemberGuard,
    AdapterGuard
{
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    /**
     * @notice Creates a proposal to replace, remove or add an adapter.
     * @dev If the adapterAddress is equal to 0x0, the adapterId is removed from the registry if available.
     * @dev If the adapterAddress is a reserved address, it reverts.
     * @dev keys and value must have the same length.
     * @dev proposalId can not be reused.
     * @param dao The dao address.
     * @param proposal proposal details
     * @param proposal proposal details
     * @param proposal proposal details
     * @param proposal proposal details
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        ProposalInput calldata proposal,
        bytes calldata data
    ) external override onlyMember(dao) reentrancyGuard(dao) {
        require(
            proposal.keys.length == proposal.values.length,
            "must be an equal number of config keys and values"
        );

        require(
            proposal.extensionAddresses.length == proposal.extensionAcl.length,
            "must be an equal number of extension addresses and acl"
        );

        require(proposal.flags < type(uint128).max, "proposal flags overflow");

        require(isNotReservedAddress(proposal.addr), "address is reserved");

        dao.submitProposal(proposalId);

        proposals[address(dao)][proposalId] = ProposalDetails(
            proposal.id,
            proposal.addr,
            proposal.updateType,
            proposal.flags,
            proposal.keys,
            proposal.values,
            proposal.extensionAddresses,
            proposal.extensionAcl
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));

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
                proposal.id,
                proposal.addr,
                proposal.flags,
                proposal.keys,
                proposal.values
            );
        } else if (proposal.updateType == UpdateType.EXTENSION) {
            if (dao.extensions(proposal.id) != address(0x0)) {
                dao.removeExtension(proposal.id);
            }

            if (proposal.addr != address(0x0)) {
                dao.addExtension(
                    proposal.id,
                    IExtension(proposal.addr),
                    address(dao)
                );
            }
        } else {
            revert("unknown update type");
        }

        for (uint256 i = 0; i < proposal.extensionAcl.length; i++) {
            dao.setAclToExtensionForAdapter(
                proposal.extensionAddresses[i],
                proposal.addr,
                proposal.extensionAcl[i]
            );
        }
    }
}
