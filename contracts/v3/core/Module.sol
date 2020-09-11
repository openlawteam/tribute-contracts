pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

abstract contract Module {

    bytes32 constant BANK_MODULE = keccak256("bank");
    bytes32 constant MEMBER_MODULE = keccak256("member");
    bytes32 constant PROPOSAL_MODULE = keccak256("proposal");
    bytes32 constant VOTING_MODULE = keccak256("voting");
    bytes32 constant ONBOARDING_MODULE = keccak256("onboarding");
    bytes32 constant FINANCING_MODULE = keccak256("financing");
    bytes32 constant MANAGING_MODULE = keccak256("managing");
    
}