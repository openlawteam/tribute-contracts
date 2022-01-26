pragma solidity ^0.8.0;
function c_0x424e3525(bytes32 c__0x424e3525) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "../adapters/interfaces/IVoting.sol";

/**
MIT License

Copyright (c) 2020 Openlaw

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

contract DaoRegistryAdapterContract is MemberGuard, AdapterGuard {
function c_0x8917a35b(bytes32 c__0x8917a35b) public pure {}

    /**
     * @notice Allows the member/advisor to update their delegate key
     * @param dao The DAO address.
     * @param delegateKey the new delegate key.
     */
    function updateDelegateKey(DaoRegistry dao, address delegateKey)
        external
        reentrancyGuard(dao)
        onlyMember(dao)
    {c_0x8917a35b(0x806fd8993d7147b29c9de67c59eef0db1111293f8d5d3d70d6227e22d0b53ef1); /* function */ 

c_0x8917a35b(0x8fd9bae553bfc8f032450a07a60b62e6a208adb5bd58be2d76adc43fe60f2c11); /* line */ 
        c_0x8917a35b(0xc83465db5aebf10795d19367c94aba022e94e6322c768239dca7553796e44052); /* statement */ 
dao.updateDelegateKey(
            DaoHelper.msgSender(dao, msg.sender),
            delegateKey
        );
    }
}
