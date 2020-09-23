pragma solidity ^0.7.0;

import "../../core/Registry.sol";

// SPDX-License-Identifier: MIT

interface IOnboarding {
    function sponsorProposal(
        Registry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function processProposal(Registry dao, uint256 proposalId) external;

    function processOnboarding(
        Registry dao,
        address applicant,
        uint256 value
    ) external returns (uint256);
}
