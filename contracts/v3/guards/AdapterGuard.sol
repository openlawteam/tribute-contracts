pragma solidity ^0.7.0;
// SPDX-License-Identifier: MIT

import '../core/Registry.sol';
import '../core/Member.sol';

/**
 * @dev Contract module that helps restrict the adapter access to DAO Members only.
 *
 */
abstract contract AdapterGuard {

    bytes32 constant MEMBER_MODULE = keccak256("member");

    /**
     * @dev Only members of the Guild are allowed to execute the function call.
     */
    modifier onlyMembers(Registry dao) {
        IMemberContract memberContract = IMemberContract(dao.getAddress(MEMBER_MODULE));
        require(memberContract.isActiveMember(dao, msg.sender), "only DAO members are allowed to call this function");
        _;
    }
}
