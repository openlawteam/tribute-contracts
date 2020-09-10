pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../Registry.sol';

interface IBank {
    function addToGuild(Registry dao, address tokenAddress, uint256 amount) external;
    function addToEscrow(Registry dao, address tokenAddress, uint256 amount) external;
    function balanceOf(Registry dao, address tokenAddress, address account) external returns (uint256);
    function transferFromGuild(Registry dao, address applicant, address tokenAddress, uint256 amount) external;
    function isReservedAddress(address applicant) external returns (bool);
}