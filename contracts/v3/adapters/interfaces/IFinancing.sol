pragma solidity ^0.7.0;
import "../../core/Registry.sol";

// SPDX-License-Identifier: MIT

interface IFinancing {
    function createFinancingRequest(
        Registry dao,
        address applicant,
        address token,
        uint256 amount,
        bytes32 details
    ) external returns (uint256);

    function sponsorProposal(
        Registry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function processProposal(Registry dao, uint256 proposalId) external;
}
