pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

abstract contract Module {
    // Core Modules
    bytes32 public constant BANK_MODULE = keccak256("bank");
    bytes32 public constant MEMBER_MODULE = keccak256("member");
    bytes32 public constant PROPOSAL_MODULE = keccak256("proposal");
    bytes32 public constant VOTING_MODULE = keccak256("voting");

    // Adapters
    bytes32 public constant ONBOARDING_MODULE = keccak256("onboarding");
    bytes32 public constant FINANCING_MODULE = keccak256("financing");
    bytes32 public constant MANAGING_MODULE = keccak256("managing");
    bytes32 public constant RAGEQUIT_MODULE = keccak256("ragequit");
}
