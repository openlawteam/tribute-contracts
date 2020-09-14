pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

interface IManaging {
    function createModuleChangeRequest(address applicant, bytes32 moduleId, address moduleAddress) external returns (uint256);
    function sponsorProposal(uint256 proposalId, bytes calldata data) external;    
    function processProposal(uint256 proposalId) external;
}