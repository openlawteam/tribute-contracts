pragma solidity ^0.7.0;
// SPDX-License-Identifier: MIT

import '../ModuleRegistry.sol';
import '../Member.sol';

/**
 * @dev Contract module that helps restrict the adapter access to Guild Members only.
 *
 */
abstract contract AdapterGuard {

    bytes32 constant MEMBER_MODULE = keccak256("member");

    /**
     * @dev Only members of the Guild are allowed to execute the function call.
     */
    modifier onlyMembers(ModuleRegistry dao) {
        IMemberContract memberContract = IMemberContract(dao.getAddress(MEMBER_MODULE));
        require(memberContract.isActiveMember(dao, msg.sender), "only members can call this function");
        _;
    }
}
