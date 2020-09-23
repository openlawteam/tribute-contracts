pragma solidity ^0.7.0;
import "../../core/Registry.sol";

// SPDX-License-Identifier: MIT

interface IManaging {
    function createModuleChangeRequest(
        Registry dao,
        bytes32 moduleId,
        address moduleAddress
    ) external returns (uint256);

    function sponsorProposal(
        Registry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function processProposal(Registry dao, uint256 proposalId) external;
}
