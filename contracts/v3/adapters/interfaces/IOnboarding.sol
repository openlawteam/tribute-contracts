pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

interface IOnboarding {
    receive() external payable;
    function sponsorProposal(uint256 proposalId, bytes calldata data) external;    
    function processProposal(uint256 proposalId) external;
}