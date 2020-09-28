pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";

/**
 * @dev Contract module that helps restrict the adapter access to DAO Members only.
 *
 */
abstract contract MemberGuard {
    /**
     * @dev Only members of the DAO are allowed to execute the function call.
     */
    modifier onlyMember(DaoRegistry dao) {
        require(dao.isActiveMember(msg.sender), "onlyMember");
        _;
    }
}
