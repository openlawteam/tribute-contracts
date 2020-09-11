pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../Registry.sol';

interface IVoting {
    function startNewVotingForProposal(Registry dao, uint256 proposalId, bytes calldata data) external returns (uint256);
    function voteResult(Registry dao, uint256 proposalId) external returns (uint256 state);
    function registerDao(address dao, uint256 votingPeriod) external;
}