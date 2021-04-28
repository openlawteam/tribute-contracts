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
    struct ProposalDetails {
        bytes32 adapterId;
        address adapterAddress;
        bytes32[] keys;
        uint256[] values;
        uint128 flags;
    }

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
     * @param proposalId The guild kick proposal id.
     * @param proposal proposal details
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        ProposalInput memory proposal,
        bytes32[] memory keys,
        uint256[] memory values,
        bytes memory data
    ) external override onlyMember(dao) reentrancyGuard(dao) {
        require(
            keys.length == values.length,
            "must be an equal number of config keys and values"
        );

        require(proposal.flags < type(uint128).max, "flags parameter overflow");

        require(
            isNotReservedAddress(proposal.adapterAddress),
            "adapter address is reserved address"
        );

        dao.submitProposal(proposalId);

        proposals[address(dao)][proposalId] = ProposalDetails(
            proposal.adapterId,
            proposal.adapterAddress,
            keys,
            values,
            proposal.flags
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));

        dao.sponsorProposal(
            proposalId,
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            ),
            address(votingContract)
        );
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
        dao.replaceAdapter(
            proposal.adapterId,
            proposal.adapterAddress,
            proposal.flags,
            proposal.keys,
            proposal.values
        );
    }
}
