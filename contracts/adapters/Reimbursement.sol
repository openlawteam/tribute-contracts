pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IManaging.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "../extensions/bank/Bank.sol";

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
        DaoRegistry dao = DaoRegistry(payable(address(uint160(_sliceUint(data, 4)))));
        require(dao.isAdapter(address(this)), "not an adapter of the DAO");

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        uint256 gasStart = gasleft();
        require(bank.balanceOf(GUILD, ETH_TOKEN) > gasStart * tx.gasprice, "not enough funds");
        //now we check that the call is permitted
        _checkIfCallIsPermitted(dao, adapter, msg.data);
        //do the actual call
        (bool success, bytes memory returnValue) = adapter.call{value:msg.value}(data);
        if (success == false) {
            uint256 size = returnValue.length;
            assembly {
                let ptr := mload(0x40)
                returndatacopy(ptr, 0, size)
                revert(ptr, size)
            }
        }
        uint256 gasSpent = gasStart - gasleft();
        uint256 payback = gasSpent * tx.gasprice * 11 / 10 ; //paying back 110%
        
        bank.internalTransfer(GUILD, msg.sender, ETH_TOKEN, payback);
        bank.withdraw(payable(msg.sender), ETH_TOKEN, payback);
        // payback for the gas

        return returnValue;
    }

    function _sliceUint(bytes memory bs, uint start)
    internal pure
    returns (uint256)
{
    require(bs.length >= start + 32, "slicing out of range");
    uint256 x;
    
    assembly {
        x := mload(add(bs, add(0x20, start)))
    }

    return x;
}

    function _checkIfCallIsPermitted(DaoRegistry dao, address payable adapter, bytes calldata) internal view {
        require(dao.isAdapter(adapter), "not an adapter of the DAO");
        //adding whitelisting
    }

    receive() external payable {
        revert("no value only transfer");
    }
}
