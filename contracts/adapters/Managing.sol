pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IManaging.sol";
import "../core/DaoRegistry.sol";
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

contract ManagingContract is IManaging, AdapterGuard, Reimbursable {
    // DAO => (ProposalID => ProposalDetails)
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;
    // DAO => (ProposalId => Configuration[])
    mapping(address => mapping(bytes32 => Configuration[]))
        public configurations;

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
        Configuration[] memory configs,
        bytes calldata data
    ) external override reimbursable(dao) {
        require(
            proposal.keys.length == proposal.values.length,
            "must be an equal number of config keys and values"
        );

        require(
            proposal.extensionAddresses.length ==
                proposal.extensionAclFlags.length,
            "must be an equal number of extension addresses and acl"
        );

        require(
            DaoHelper.isNotReservedAddress(proposal.adapterOrExtensionAddr),
            "address is reserved"
        );

        dao.submitProposal(proposalId);

        proposals[address(dao)][proposalId] = proposal;

        Configuration[] storage newConfigs = configurations[address(dao)][
            proposalId
        ];
        for (uint256 i = 0; i < configs.length; i++) {
            Configuration memory config = configs[i];
            newConfigs.push(
                Configuration({
                    key: config.key,
                    configType: config.configType,
                    numericValue: config.numericValue,
                    addressValue: config.addressValue
                })
            );
        }

        IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
        address senderAddress = votingContract.getSenderAddress(
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
     * @dev Reverts when the extension address is already in use and it is an extension addition.
     * @param dao The dao address.
     * @param proposalId The proposal id.
     */
    // slither-disable-next-line reentrancy-benign
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reimbursable(dao)
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
            _replaceExtension(dao, proposal);
        } else {
            revert("unknown update type");
        }
        _grantExtensionAccess(dao, proposal);
        _saveDaoConfigurations(dao, proposalId);
    }

    /**
     * @notice If the extension is already registered, it removes the extension from the DAO Registry.
     * @notice If the adapterOrExtensionAddr is provided, the new address is added as a new extension to the DAO Registry.
     */
    function _replaceExtension(DaoRegistry dao, ProposalDetails memory proposal)
        internal
    {
        if (dao.extensions(proposal.adapterOrExtensionId) != address(0x0)) {
            dao.removeExtension(proposal.adapterOrExtensionId);
        }

        if (proposal.adapterOrExtensionAddr != address(0x0)) {
            dao.addExtension(
                proposal.adapterOrExtensionId,
                IExtension(proposal.adapterOrExtensionAddr),
                // The creator of the extension must be set as the DAO owner,
                // which is stored at index 0 in the members storage.
                dao.getMemberAddress(0)
            );
        }
    }

    /**
     * @notice Saves to the DAO Registry the ACL Flag that grants the access to the given `extensionAddresses`
     */
    function _grantExtensionAccess(
        DaoRegistry dao,
        ProposalDetails memory proposal
    ) internal {
        for (uint256 i = 0; i < proposal.extensionAclFlags.length; i++) {
            // It is fine to execute the external call inside the loop
            // because it is calling the correct function in the dao contract
            // it won't be calling a fallback that always revert.
            // slither-disable-next-line calls-loop
            dao.setAclToExtensionForAdapter(
                // It needs to be registered as extension
                proposal.extensionAddresses[i],
                // It needs to be registered as adapter
                proposal.adapterOrExtensionAddr,
                // Indicate which access level will be granted
                proposal.extensionAclFlags[i]
            );
        }
    }

    /**
     * @notice Saves the numeric/address configurations to the DAO registry
     */
    function _saveDaoConfigurations(DaoRegistry dao, bytes32 proposalId)
        internal
    {
        Configuration[] memory configs = configurations[address(dao)][
            proposalId
        ];

        for (uint256 i = 0; i < configs.length; i++) {
            Configuration memory config = configs[i];
            if (ConfigType.NUMERIC == config.configType) {
                // It is fine to execute the external call inside the loop
                // because it is calling the correct function in the dao contract
                // it won't be calling a fallback that always revert.
                // slither-disable-next-line calls-loop
                dao.setConfiguration(config.key, config.numericValue);
            } else if (ConfigType.ADDRESS == config.configType) {
                // It is fine to execute the external call inside the loop
                // because it is calling the correct function in the dao contract
                // it won't be calling a fallback that always revert.
                // slither-disable-next-line calls-loop
                dao.setAddressConfiguration(config.key, config.addressValue);
            }
        }
    }
}
