pragma solidity ^0.8.0;
function c_0x40c025b9(bytes32 c__0x40c025b9) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/AdapterGuard.sol";
import "../adapters/interfaces/IVoting.sol";
import "../helpers/DaoHelper.sol";
import "./modifiers/Reimbursable.sol";

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

contract BankAdapterContract is AdapterGuard, Reimbursable {
function c_0x335bfa4c(bytes32 c__0x335bfa4c) public pure {}

    /**
     * @notice Allows the member/advisor of the DAO to withdraw the funds from their internal bank account.
     * @notice Only accounts that are not reserved can withdraw the funds.
     * @notice If theres is no available balance in the user's account, the transaction is reverted.
     * @param dao The DAO address.
     * @param account The account to receive the funds.
     * @param token The token address to receive the funds.
     */
    function withdraw(
        DaoRegistry dao,
        address payable account,
        address token
    ) external reimbursable(dao) {c_0x335bfa4c(0x094941f938f8f2dc3d90e3c8cf8580ceeeac835c59f61f52bf6b44bd476f18ef); /* function */ 

c_0x335bfa4c(0x56eed4d774a4e5688f269770fd01fbd2aa4b74ea45a0a04025c17e57fa9d9971); /* line */ 
        c_0x335bfa4c(0x6aeba145d423b599b156a43729b5cf454e7b9a7bd05e03d19cad31ea65a7107a); /* requirePre */ 
c_0x335bfa4c(0xe69cc53ebf690c65d8ee0b2770cf7496b294084b5256743fcd8bb05c4f6fea3d); /* statement */ 
require(
            DaoHelper.isNotReservedAddress(account),
            "withdraw::reserved address"
        );c_0x335bfa4c(0x201261e89a2f661c59b63f7f83922532568c292642ab50bdc797cd5626d553c7); /* requirePost */ 


        // We do not need to check if the token is supported by the bank,
        // because if it is not, the balance will always be zero.
c_0x335bfa4c(0xd5a4d9d48e9c85f17bd503d3f715b620141301399ef11575ec6776bc61c9fb97); /* line */ 
        c_0x335bfa4c(0xe15bcb6ff4651684c8de259b699bc75b2169735f82f82c41ee503a8b23bee9e1); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0x335bfa4c(0x6d2f10619f93fba34dec2d1427c20b8eca1d9c2bdef0450d2ffe4367f8707da5); /* line */ 
        c_0x335bfa4c(0xb405c56fb00babfd32ac410ad4fff189b12e67bd0c778c604de19899e2632593); /* statement */ 
uint256 balance = bank.balanceOf(account, token);
c_0x335bfa4c(0x24f8f74d834f9dc222d1eadfc53f3c845c29043360c150ac45e3a809d0da70d7); /* line */ 
        c_0x335bfa4c(0xff3c08da696f4f314c0b433e89e6d2f979efcba93160b6d444c85c6287cea117); /* requirePre */ 
c_0x335bfa4c(0x6b153f75d447e9644b47f6875c59e730dcec55202ac33649180767eceedfd8b0); /* statement */ 
require(balance > 0, "nothing to withdraw");c_0x335bfa4c(0x867bfe7db1c795c4da9555745311401e1033600ee716bb926026dd44d206f35b); /* requirePost */ 


c_0x335bfa4c(0xf2fe6d65383d4df98ce26707c5b351906aadc589e6350e81c9f3feea390201a3); /* line */ 
        c_0x335bfa4c(0xab3950a0ad288c833feb6dec28773964a852b72401807d9c26b684f4bff9553d); /* statement */ 
bank.withdraw(dao, account, token, balance);
    }

    /**
     * @notice Allows anyone to update the token balance in the bank extension
     * @notice If theres is no available balance in the user's account, the transaction is reverted.
     * @param dao The DAO address.
     * @param token The token address to update.
     */
    function updateToken(DaoRegistry dao, address token)
        external
        reentrancyGuard(dao)
    {c_0x335bfa4c(0xc5fc07a7fb0328b38319c2c76fd99870ceb7ddba74cb1ee4d7264157f70b4fe3); /* function */ 

        // We do not need to check if the token is supported by the bank,
        // because if it is not, the balance will always be zero.
c_0x335bfa4c(0x155790592d7ff21dd8350cc46a6bdf2f2fe3ff8cca00757d9ac095677fa5df38); /* line */ 
        c_0x335bfa4c(0x4d7f91b8f11c1ca18ee925b85dea2a2f3037ba23649d3b20904a61d442c7b16e); /* statement */ 
BankExtension(dao.getExtensionAddress(DaoHelper.BANK)).updateToken(
            dao,
            token
        );
    }

    /*
     * @notice Allows anyone to send eth to the bank extension
     * @param dao The DAO address.
     */
    function sendEth(DaoRegistry dao) external payable reimbursable(dao) {c_0x335bfa4c(0x7cf26b5fc39d7ba5653d2ec3c4973e978ec33ff4a8810a477980fae664e2ba5b); /* function */ 

c_0x335bfa4c(0xc100a42de83f22e0212e732da3c4b1abc1affdb34753dde32f586c13eb5817c1); /* line */ 
        c_0x335bfa4c(0xdbca7f5f0234ff7d7902d97047352a6093a1026b74b994696f1acdb317b7134c); /* requirePre */ 
c_0x335bfa4c(0x197b54c3450e1928cc183a0639e44ded9004b8f40979290bc54f60cb0fb055fc); /* statement */ 
require(msg.value > 0, "no eth sent!");c_0x335bfa4c(0xfabab227c24174af6a9500abef2a650bc1aa4a49b3cdf562d1b090dee248c905); /* requirePost */ 

c_0x335bfa4c(0xfc68bd5b30e90ff767543700c7fa6c5ae11cbe34758d964c44a3fb839c83e67d); /* line */ 
        c_0x335bfa4c(0x9f26400886bea3937d2c7708963f4d65102980e7dae4391fd7ad2e8acecbb16b); /* statement */ 
BankExtension(dao.getExtensionAddress(DaoHelper.BANK)).addToBalance{
            value: msg.value
        }(dao, DaoHelper.GUILD, DaoHelper.ETH_TOKEN, msg.value);
    }
}
