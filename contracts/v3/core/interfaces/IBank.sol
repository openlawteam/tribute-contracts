pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../Registry.sol';

interface IBank {
    function addToGuild(address tokenAddress, uint256 amount) external;
    function addToEscrow(address tokenAddress, uint256 amount) external;
    function balanceOf(address tokenAddress, address account) external returns (uint256);
    function isReservedAddress(address applicant) external returns (bool);
    function transferFromGuild(address applicant, address tokenAddress, uint256 amount) external;
    function getChunkSize() external returns (uint256);
    function getSharesPerChunk() external returns (uint256);
    function burnShares(address member, uint256 sharesToBurn) external;
}