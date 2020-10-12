pragma solidity ^0.7.0;

import "../../core/DaoRegistry.sol";

// SPDX-License-Identifier: MIT

interface IOnboarding {
    function onboard(
        DaoRegistry dao,
        uint256 tokenAmount
    ) external payable;

    function sponsorProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function processProposal(DaoRegistry dao, uint256 proposalId) external;
}
