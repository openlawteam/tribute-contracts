pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

interface IFinancing {
    function createFinancingRequest(address daoAddress, address applicant, address token, uint256 amount, bytes32 details) external returns (uint256);
    function sponsorProposal(uint256 proposalId, bytes calldata data) external;    
    function processProposal(uint256 proposalId) external;
}