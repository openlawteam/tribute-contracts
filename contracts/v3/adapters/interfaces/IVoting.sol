pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../../core/Registry.sol';

interface IVoting {
    function registerDao(Registry dao, uint256 votingPeriod) external;
    function startNewVotingForProposal(Registry dao, uint256 proposalId, bytes calldata data) external returns (uint256);
    function voteResult(Registry dao, uint256 proposalId) external returns (uint256 state);
}