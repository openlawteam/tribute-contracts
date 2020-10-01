pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";

interface IVoting {
    function registerDao(DaoRegistry dao, uint256 votingPeriod, uint256 gracePeriod) external;

    function startNewVotingForProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external returns (uint256);

    function voteResult(DaoRegistry dao, uint256 proposalId)
        external
        returns (uint256 state);
}
