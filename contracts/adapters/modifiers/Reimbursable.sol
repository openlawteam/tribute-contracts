pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";

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
    bytes32 internal constant GasPriceLimit =
        keccak256("reimbursement.gasPriceLimit");
    bytes32 internal constant SpendLimitPeriod =
        keccak256("reimbursement.spendlimitPeriod");
    bytes32 internal constant SpendLimitEth =
        keccak256("reimbursement.spendlimitEth");
    bytes32 internal constant EthUsed = keccak256("reimbursement.ethUsed");
    bytes32 internal constant RateLimitStart =
        keccak256("reimbursement.rateLimitStart");

    /**
     * @dev Only registered adapters are allowed to execute the function call.
     */
    modifier reimbursable(DaoRegistry dao) {
        uint256 gasStart = gasleft();
        require(dao.lockedAt() != block.number, "reentrancy guard");
        dao.lockSession();
        uint256 gasPriceLimit = dao.getConfiguration(GasPriceLimit);
        uint256 spendLimitPeriod = dao.getConfiguration(SpendLimitPeriod);
        uint256 spendLimitEth = dao.getConfiguration(SpendLimitEth);
        uint256 ethUsed = dao.getConfiguration(EthUsed);
        uint256 rateLimitStart = dao.getConfiguration(RateLimitStart);
        _;
        dao.unlockSession();
        bool shouldReimburse =
            dao.getConfiguration(GasPriceLimit) > tx.gasprice;

        BankExtension bank =
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK));

        shouldReimburse =
            shouldReimburse &&
            bank.balanceOf(DaoHelper.GUILD, DaoHelper.ETH_TOKEN) >
            gasStart * tx.gasprice;

        uint256 currentSpending = 0;

        uint256 gasSpent = gasStart - gasleft();
        uint256 payback = (gasSpent * tx.gasprice * 11) / 10; //paying back 110%

        if (block.timestamp - rateLimitStart < spendLimitPeriod) {
            currentSpending = ethUsed + payback;
        } else {
            currentSpending = payback;
            dao.setConfiguration(RateLimitStart, block.timestamp);
        }

        shouldReimburse = shouldReimburse && spendLimitEth > currentSpending;

        dao.setConfiguration(EthUsed, currentSpending);
        if (shouldReimburse) {
            bank.internalTransfer(
                DaoHelper.GUILD,
                msg.sender,
                DaoHelper.ETH_TOKEN,
                payback
            );

            bank.withdraw(payable(msg.sender), DaoHelper.ETH_TOKEN, payback);
        }
    }
}
