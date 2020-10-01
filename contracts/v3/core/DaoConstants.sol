pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

abstract contract DaoConstants {
    // Adapters
    bytes32 public constant VOTING = keccak256("voting");
    bytes32 public constant ONBOARDING = keccak256("onboarding");
    bytes32 public constant NONVOTING_ONBOARDING = keccak256(
        "nonvoting-onboarding"
    );
    bytes32 public constant FINANCING = keccak256("financing");
    bytes32 public constant MANAGING = keccak256("managing");
    bytes32 public constant RAGEQUIT = keccak256("ragequit");
}
