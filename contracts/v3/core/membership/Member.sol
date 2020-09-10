pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../Registry.sol';
import '../interfaces/IMember.sol';
import '../../helpers/FlagHelper.sol';
import '../../guards/ModuleGuard.sol';

contract MemberContract is IMember, ModuleGuard {
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

    function memberAddress(Registry dao, address memberOrDelegateKey) override external view returns (address) {
        return memberAddresses[address(dao)][memberOrDelegateKey];
    }

    function updateMember(Registry dao, address applicant, uint256 shares) override external onlyModule(dao) {
        Member storage member = members[address(dao)][applicant];
        member.flags = 1;
        member.nbShares = shares;

        emit UpdateMember(address(dao), applicant, shares);
    }
}