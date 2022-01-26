pragma solidity ^0.8.0;
function c_0xe4d73a7a(bytes32 c__0xe4d73a7a) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../companion/interfaces/IReimbursement.sol";
import "./ReimbursableLib.sol";

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
abstract contract Reimbursable {
function c_0xcf050ef6(bytes32 c__0xcf050ef6) public pure {}

    struct ReimbursementData {
        uint256 gasStart; // how much gas is left before executing anything
        bool shouldReimburse; // should the transaction be reimbursed or not ?
        uint256 spendLimitPeriod; // how long (in seconds) is the spend limit period
        IReimbursement reimbursement; // which adapter address is used for reimbursement
    }

    /**
     * @dev Only registered adapters are allowed to execute the function call.
     */
    modifier reimbursable(DaoRegistry dao) {c_0xcf050ef6(0x380681d6e76cd30cdc27e30b15a016d37146d041100501a5ba5c69b348fb1134); /* function */ 

c_0xcf050ef6(0x80a014f73710cb9dfa1bbf0bb4a9608aea8dd2a0ed03023342b776e1989b3daf); /* line */ 
        c_0xcf050ef6(0x1e3fef2d64b7518cc087bc49bc2335bbc63134212956688c31d20edd850d13fd); /* statement */ 
ReimbursementData memory data = ReimbursableLib.beforeExecution(dao);
c_0xcf050ef6(0xcfdd5a9c0ef498fa0c7efed5f164e9bf38771f5b8e4975e9f6dbf81387b5270e); /* line */ 
        _;
c_0xcf050ef6(0x5c71be7ce79a9e619b747402ef4f323c0bbc7e51dde1a33c2f2c0dcbad4d3507); /* line */ 
        c_0xcf050ef6(0x0f187b3897f770e561dd027d9ac9dfe2b72f534545f1e393207736f6fa497505); /* statement */ 
ReimbursableLib.afterExecution(dao, data);
    }
}
