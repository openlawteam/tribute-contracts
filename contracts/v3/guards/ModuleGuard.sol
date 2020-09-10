pragma solidity ^0.7.0;
// SPDX-License-Identifier: MIT

import '../core/Registry.sol';
import '../core/Member.sol';

/**
 * @dev Contract module that helps restrict the module access to Core Modules only.
 *
 */
abstract contract ModuleGuard {

    bytes32 constant MEMBER_MODULE = keccak256("member");

    /**
     * @dev Only Core Module of the DAO are allowed to execute the function call.
     */
    modifier onlyModule(Registry dao) {
        require(dao.isModule(msg.sender), "only core modules are allowed to call this function");
        _;
    }
}