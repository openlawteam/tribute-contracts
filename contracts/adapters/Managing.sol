pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IManaging.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";

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

contract ManagingContract is IManaging, DaoConstants, MemberGuard {
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
     * @param adapterId The adapter id to replace, remove or add.
     * @param adapterAddress The adapter address to add or replace. Use 0x0 if you want to remove the adapter.
     * @param keys The configuration keys for the adapter.
     * @param values The values to set for the adapter configuration.
     * @param _flags The ACL for the new adapter, up to 2**128-1.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes32 adapterId,
        address adapterAddress,
        bytes32[] calldata keys,
        uint256[] calldata values,
        uint256 _flags
    ) external override onlyMember(dao) {
        require(
            keys.length == values.length,
            "must be an equal number of config keys and values"
        );

        require(_flags < type(uint128).max, "flags parameter overflow");
        uint128 flags = uint128(_flags);

        require(
            dao.isNotReservedAddress(adapterAddress),
            "adapter address is reserved address"
        );

        dao.submitProposal(proposalId);

        proposals[address(dao)][proposalId] = ProposalDetails(
            adapterId,
            adapterAddress,
            keys,
            values,
            flags
        );
    }

    /**
     * @notice Sponsor a proposal if the proposal id exists.
     * @dev Only members are allowed to sponsor proposals.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param data Additional data that can be used for offchain voting validation.
     */
    function sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes calldata data
    ) external override {
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        address sponsoredBy =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );
        _sponsorProposal(dao, proposalId, data, sponsoredBy, votingContract);
    }

    function _sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data,
        address sponsoredBy,
        IVoting votingContract
    ) internal {
        dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
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
