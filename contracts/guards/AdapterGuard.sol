pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";

/**
 * @dev Contract guard that helps restrict the adapter access to the DaoRegistry.
 *
 */
abstract contract AdapterGuard {
    /**
     * @dev Only registered adapters are allowed to execute the function call.
     */
    modifier onlyAdapter(DaoRegistry dao) {
        require(dao.state() == DaoRegistry.DaoState.CREATION || dao.isAdapter(msg.sender), "onlyAdapter");
        _;
    }
}
