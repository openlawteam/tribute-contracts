pragma solidity ^0.7.0;
import "../../core/DaoRegistry.sol";

// SPDX-License-Identifier: MIT

interface IFinancing {
    function createFinancingRequest(
        DaoRegistry dao,
        address applicant,
        address token,
        uint256 amount,
        bytes32 details
    ) external returns (uint256);

    function sponsorProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function processProposal(DaoRegistry dao, uint256 proposalId) external;
}
