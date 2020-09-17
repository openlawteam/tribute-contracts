pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../Registry.sol';
import '../Module.sol';
import '../interfaces/IMember.sol';
import '../interfaces/IBank.sol';
import '../../utils/SafeMath.sol';
import '../../helpers/FlagHelper.sol';
import '../../guards/ModuleGuard.sol';
import '../../guards/ReentrancyGuard.sol';

contract MemberContract is IMember, Module, ModuleGuard, ReentrancyGuard {
    using FlagHelper for uint256;
    using SafeMath for uint256;

    event UpdateMember(address dao, address member, uint256 shares);

    struct Member {
        uint256 flags;
        address delegateKey;
        uint256 nbShares;
    }

    uint256 public totalShares = 1; // Maximum number of shares 2**256 - 1

    mapping(address => mapping(address => Member)) members;
    mapping(address => mapping(address => address)) memberAddresses;

    function isActiveMember(Registry dao, address member) override external view onlyModule(dao) returns (bool) {
        uint256 memberFlags = members[address(dao)][member].flags;
        return memberFlags.exists() && !memberFlags.isJailed() && members[address(dao)][member].nbShares > 0;
    }

    function memberAddress(Registry dao, address memberOrDelegateKey) override external view onlyModule(dao) returns (address) {
        return memberAddresses[address(dao)][memberOrDelegateKey];
    }

    function updateMember(Registry dao, address memberAddr, uint256 shares) override external onlyModule(dao) {
        Member storage member = members[address(dao)][memberAddr];
        member.flags = 1;
        member.nbShares = shares;
        
        totalShares = totalShares.add(shares);

        emit UpdateMember(address(dao), memberAddr, shares);
    }

    function burnShares(Registry dao, address memberAddr, uint256 sharesToBurn) override external onlyModule(dao) {
        require(_enoughSharesToBurn(dao, memberAddr, sharesToBurn), "insufficient shares");
        
        Member storage member = members[address(dao)][memberAddr];
        member.nbShares = member.nbShares.sub(sharesToBurn);
        totalShares = totalShares.sub(sharesToBurn);

        emit UpdateMember(address(dao), memberAddr, member.nbShares);
    }

    /**
     * Public read-only functions 
     */
    function nbShares(Registry dao, address member) override external view returns (uint256) {
        return members[address(dao)][member].nbShares;
    }

    function getTotalShares() override external view returns(uint256) {
        return totalShares;
    }

    /**
     * Internal Utility Functions
     */

    function _enoughSharesToBurn(Registry dao, address memberAddr, uint256 sharesToBurn) internal view returns (bool) {
        return sharesToBurn > 0 && members[address(dao)][memberAddr].nbShares >= sharesToBurn;
    }

}