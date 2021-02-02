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
        address applicant;
        bytes32 moduleId;
        address moduleAddress;
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

    function createModuleChangeRequest(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes32 moduleId,
        address moduleAddress,
        bytes32[] calldata keys,
        uint256[] calldata values,
        uint256 _flags
    ) external override onlyMember(dao) {
        require(
            keys.length == values.length,
            "must be an equal number of config keys and values"
        );
        require(moduleAddress != address(0x0), "invalid module address");
        require(_flags < type(uint128).max, "flags parameter overflow");
        uint128 flags = uint128(_flags);

        require(
            dao.isNotReservedAddress(moduleAddress),
            "module is using reserved address"
        );

        dao.submitProposal(proposalId);

        proposals[address(dao)][proposalId] = ProposalDetails(
            msg.sender,
            moduleId,
            moduleAddress,
            keys,
            values,
            flags
        );
    }

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
        _sponsorProposal(dao, proposalI, data, sponsoredBy, votingContract);
    }

    function _sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data,
        address sponsoredBy,
        IVoting votingContract
    ) internal {
        dao.sponsorProposal(proposalId, sponsoredBy);
        votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
    {
        ProposalDetails memory proposal = proposals[address(dao)][proposalId];

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal did not pass"
        );

        dao.processProposal(proposalId);
        if (dao.getAdapterAddress(proposal.moduleId) != address(0x0)) {
            dao.removeAdapter(proposal.moduleId);
        }

        bytes32[] memory keys = proposal.keys;
        uint256[] memory values = proposal.values;
        for (uint256 i = 0; i < keys.length; i++) {
            dao.setConfiguration(keys[i], values[i]);
        }

        dao.addAdapter(
            proposal.moduleId,
            proposal.moduleAddress,
            proposal.flags
        );
    }
}
