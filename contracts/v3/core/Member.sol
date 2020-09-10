pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './Registry.sol';
import './Proposal.sol';
import './Voting.sol';
import '../helpers/FlagHelper.sol';

interface IMemberContract {
    function isActiveMember(Registry dao, address member) external returns (bool);    
    function memberAddress(Registry dao, address memberOrDelegateKey) external returns (address);
    function updateMember(Registry dao, address applicant, uint256 shares) external;
    function nbShares(Registry dao, address member) external view returns (uint256);
}

contract MemberContract is IMemberContract {
    using FlagHelper for uint256;

    event UpdateMember(address dao, address member, uint256 shares);

    struct Member {
        uint256 flags;
        address delegateKey;
        uint256 nbShares;
    }

    mapping(address => mapping(address => Member)) members;
    mapping(address => mapping(address => address)) memberAddresses;

    function nbShares(Registry dao, address member) override external view returns (uint256) {
        return members[address(dao)][member].nbShares;
    }

    function isActiveMember(Registry dao, address member) override external view returns (bool) {
        uint256 memberFlags = members[address(dao)][member].flags;
        return memberFlags.exists() && !memberFlags.isJailed() && members[address(dao)][member].nbShares > 0;
    }

    function memberAddress(Registry dao, address memberOrDelegateKey) override  external view returns (address) {
        return memberAddresses[address(dao)][memberOrDelegateKey];
    }

    function updateMember(Registry dao, address applicant, uint256 shares) override  external {
        Member storage member = members[address(dao)][applicant];
        member.flags = 1;
        member.nbShares = shares;

        emit UpdateMember(address(dao), applicant, shares);
    }
}