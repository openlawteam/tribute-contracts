pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";

interface IVoting {
    function startNewVotingForProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function voteResult(DaoRegistry dao, uint256 proposalId)
        external
        returns (uint256 state);
}
