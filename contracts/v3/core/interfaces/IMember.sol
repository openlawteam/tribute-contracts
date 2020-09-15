pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../Registry.sol';

interface IMember {
    function isActiveMember(Registry dao, address member) external returns (bool);    
    function memberAddress(Registry dao, address memberOrDelegateKey) external returns (address);
    function updateMember(Registry dao, address applicant, uint256 shares) external;
    function nbShares(Registry dao, address member) external view returns (uint256);
    function hasEnoughShares(Registry dao, address memberAddr, uint256 sharesToBurn) external view returns(bool);
}