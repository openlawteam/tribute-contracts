pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../guards/MemberGuard.sol";
import "./interfaces/IConfiguration.sol";
import "../adapters/interfaces/IVoting.sol";
import "../utils/SafeCast.sol";

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

contract ConfigurationContract is IConfiguration, DaoConstants, MemberGuard {
    using SafeCast for uint256;

    enum ConfigurationStatus {NOT_CREATED, IN_PROGRESS, DONE}

    struct Configuration {
        ConfigurationStatus status;
        bytes32[] keys;
        uint256[] values;
    }

    mapping(uint64 => Configuration) public configurations;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function submitConfigurationProposal(
        DaoRegistry dao,
        bytes32[] calldata keys,
        uint256[] calldata values,
        bytes calldata data
    ) external override onlyMember(dao) returns (uint64) {
        require(
            keys.length == values.length,
            "configuration must have the same number of keys and values"
        );

        Configuration memory configuration =
            Configuration(ConfigurationStatus.IN_PROGRESS, keys, values);

        uint64 proposalId = dao.submitProposal();
        configurations[proposalId] = configuration;

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
        dao.sponsorProposal(proposalId, msg.sender);

        return proposalId;
    }

    function sponsorProposal(
        DaoRegistry dao,
        uint256 _proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);

        dao.sponsorProposal(proposalId, msg.sender);
    }

    function processProposal(DaoRegistry dao, uint256 _proposalId)
        external
        override
        onlyMember(dao)
    {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        Configuration storage configuration = configurations[proposalId];

        // If status is empty or DONE we expect it to fail
        require(
            configuration.status == ConfigurationStatus.IN_PROGRESS,
            "reconfiguration already completed or does not exist"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal did not pass yet"
        );

        bytes32[] memory keys = configuration.keys;
        uint256[] memory values = configuration.values;
        for (uint256 i = 0; i < keys.length; i++) {
            dao.setConfiguration(keys[i], values[i]);
        }

        configuration.status = ConfigurationStatus.DONE;

        dao.processProposal(proposalId);
    }
}
