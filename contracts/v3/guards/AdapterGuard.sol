pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";

/**
 * @dev Contract module that helps restrict the module access to Core Modules only.
 *
 */
abstract contract AdapterGuard {
    /**
     * @dev Only Core Module of the DAO are allowed to execute the function call.
     */
    modifier onlyAdapter(DaoRegistry dao) {
        require(dao.isAdapter(msg.sender), "onlyAdapter");
        _;
    }
}
