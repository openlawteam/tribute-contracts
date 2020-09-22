pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../Registry.sol";

interface IProposal {
    function createProposal(Registry dao) external returns (uint256 proposalId);

    function sponsorProposal(
        Registry dao,
        uint256 proposalId,
        address sponsoringMember,
        bytes calldata votingData
    ) external;
}
