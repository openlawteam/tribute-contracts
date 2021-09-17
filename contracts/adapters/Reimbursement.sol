pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IManaging.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";

/**
MIT License

Copyright (c) 2021 Openlaw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

contract ReimbursementContract is MemberGuard, AdapterGuard
{

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    function callFromHere (address payable adapter, bytes memory data) external payable returns (bytes memory) {
        bytes32 temp;
        // Get 32 bytes from data
        assembly {
            mload(add(data, 4));
            temp := mload(add(data, 32))
        }

        require(uint256(temp) <= type(uint160).max, "data overflow to convert to address");

        DaoRegistry dao = DaoRegistry(payable(address(uint160(uint256(temp)))));
        require(dao.isAdapter(address(this)), "not an adapter of the DAO");

        //now we check that the call is permitted
        _checkIfCallIsPermitted(dao, adapter, msg.data);
        //do the actual call
        (bool success, bytes memory returnValue) = adapter.call{value:msg.value}(data);
        require(success, "call failed");
        uint256 gasStart = gasleft();
        uint256 gasSpent = gasStart - gasleft();
        // payback for the gas

        return returnValue;
    }

    function _checkIfCallIsPermitted(DaoRegistry dao, address payable adapter, bytes calldata data) internal {
        require(dao.isAdapter(adapter), "not an adapter of the DAO");
        //adding whitelisting
    }

    receive() external payable {
        revert("no value only transfer");
    }
}
