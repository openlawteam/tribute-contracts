pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/AdapterGuard.sol";
import "./interfaces/IConfiguration.sol";
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

contract BankAdapterContract is DaoConstants, AdapterGuard {
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable {
        revert("fallback revert");
    }

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
    ) external reentrancyGuard(dao) {
        require(isNotReservedAddress(account), "withdraw::reserved address");

        // We do not need to check if the token is supported by the bank,
        // because if it is not, the balance will always be zero.
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        uint256 balance = bank.balanceOf(account, token);
        require(balance > 0, "nothing to withdraw");

        bank.withdraw(account, token, balance);
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
    {
        // We do not need to check if the token is supported by the bank,
        // because if it is not, the balance will always be zero.
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(bank.dao() == dao, "wrong dao");
        bank.updateToken(token);
    }
}
