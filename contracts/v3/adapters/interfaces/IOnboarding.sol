pragma solidity ^0.7.0;

import "../../core/DaoRegistry.sol";

// SPDX-License-Identifier: MIT

interface IOnboarding {
    function submitMembershipProposal(
        DaoRegistry dao,
        address applicant,
        uint256 value,
        address token
    ) external returns (uint256);

    function sponsorProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function processProposal(DaoRegistry dao, uint256 proposalId) external;
}
