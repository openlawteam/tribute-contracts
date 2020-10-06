pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";

/**
 * @dev Contract guard that helps restrict the access to DAO functions.
 *
 */
abstract contract DaoGuard {
    /**
     * @dev Only DAO registry is allowed to execute the function call.
     */
    modifier onlyDao(DaoRegistry dao) {
        require(address(dao) == msg.sender, "onlyDAO");
        _;
    }
}
