pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

abstract contract Module {
    // Adapters
    bytes32 public constant VOTING_MODULE = keccak256("voting");
    bytes32 public constant ONBOARDING_MODULE = keccak256("onboarding");
    bytes32 public constant FINANCING_MODULE = keccak256("financing");
    bytes32 public constant MANAGING_MODULE = keccak256("managing");
    bytes32 public constant RAGEQUIT_MODULE = keccak256("ragequit");
}
