pragma solidity ^0.7.0;

import "../../core/DaoRegistry.sol";

// SPDX-License-Identifier: MIT

interface IManaging {
    function createModuleChangeRequest(
        DaoRegistry dao,
        bytes32 moduleId,
        address moduleAddress
    ) external returns (uint256);

    function sponsorProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function processProposal(DaoRegistry dao, uint256 proposalId) external;
}
