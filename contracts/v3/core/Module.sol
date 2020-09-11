pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

abstract contract Module {

    //Replaceable Modules
    bytes32 constant BANK_MODULE = keccak256("bank");
    bytes32 constant MEMBER_MODULE = keccak256("member");
    bytes32 constant PROPOSAL_MODULE = keccak256("proposal");
    bytes32 constant VOTING_MODULE = keccak256("voting");
    bytes32 constant ONBOARDING_MODULE = keccak256("onboarding");
    bytes32 constant FINANCING_MODULE = keccak256("financing");

    //NonReplaceable Modules
    bytes32 constant MANAGING_MODULE = keccak256("managing");

    function isReplaceable(bytes32 moduleId) internal pure returns (bool) {
        return moduleId == BANK_MODULE || moduleId == MEMBER_MODULE || moduleId == PROPOSAL_MODULE 
        || moduleId == VOTING_MODULE || moduleId == ONBOARDING_MODULE || moduleId == FINANCING_MODULE;
    }
}