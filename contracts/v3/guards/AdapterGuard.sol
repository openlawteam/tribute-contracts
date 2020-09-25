pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../core/Registry.sol";
import "../core/Module.sol";

/**
 * @dev Contract module that helps restrict the adapter access to DAO Members only.
 *
 */
abstract contract AdapterGuard is Module {
    /**
     * @dev Only members of the Guild are allowed to execute the function call.
     */
    modifier onlyMember(Registry dao) {
        require(dao.isActiveMember(msg.sender), "restricted to DAO members");
        _;
    }
}
