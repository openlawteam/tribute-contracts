pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './ModuleRegistry.sol';
import './Proposal.sol';
import './Voting.sol';
import './HelperMoloch.sol';

interface IMemberContract {
    function isActiveMember(ModuleRegistry dao, address member) external returns (bool);    
    function memberAddress(ModuleRegistry dao, address memberOrDelegateKey) external returns (address);
    function updateMember(ModuleRegistry dao, address applicant, uint256 sharesRequested, uint256 tributeOffered, address tributeToken) external;
}

contract MemberContracr is IMemberContract {

    struct Member {
        uint256 flags;
        address delegateKey;
        uint256 nbShares;
    }

    mapping(address => Member) members;

    function isActiveMember(ModuleRegistry dao, address member) override external returns (bool) {
        uint256 memberFlags = members[member].flags;
        //FIXME
        return true; //erFlags.exists() && !memberFlags.jailed() && members[member].nbShares > 0;
    }

    function memberAddress(ModuleRegistry dao, address memberOrDelegateKey) override  external returns (address) {

    }

    function updateMember(ModuleRegistry dao, address applicant, uint256 sharesRequested, uint256 tributeOffered, address tributeToken) override  external {

    }
}