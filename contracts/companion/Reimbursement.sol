pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IReimbursement.sol";
import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/AdapterGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../helpers/DaoHelper.sol";
import "./GelatoRelay.sol";

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

contract ReimbursementContract is IReimbursement, AdapterGuard, GelatoRelay {
    using Address for address payable;
    using SafeERC20 for IERC20;

    struct ReimbursementData {
        uint256 ethUsed;
        uint256 rateLimitStart;
    }

    constructor(address payable _gelato) GelatoRelay(_gelato) {}

    mapping(address => ReimbursementData) private _data;

    bytes32 internal constant GasPriceLimit =
        keccak256("reimbursement.gasPriceLimit");
    bytes32 internal constant SpendLimitPeriod =
        keccak256("reimbursement.spendLimitPeriod");
    bytes32 internal constant SpendLimitEth =
        keccak256("reimbursement.spendLimitEth");
    bytes32 internal constant EthUsed = keccak256("reimbursement.ethUsed");
    bytes32 internal constant RateLimitStart =
        keccak256("reimbursement.rateLimitStart");

    /**
     * @param dao the dao to configure
     * @param gasPriceLimit the max gas price allowed for reimbursement. This is used to avoid someone draining the DAO by putting crazy gas price
     * @param spendLimitPeriod how many seconds constitute a period (a way to define a period as 1 day, 1 week, 1 hour etc ...)
     * @param spendLimitEth how much ETH is reimbursable during the payment period
     **/
    function configureDao(
        DaoRegistry dao,
        uint256 gasPriceLimit,
        uint256 spendLimitPeriod,
        uint256 spendLimitEth
    ) external onlyAdapter(dao) {
        require(gasPriceLimit > 0, "gasPriceLimit::invalid");
        require(spendLimitPeriod > 0, "spendLimitPeriod::invalid");
        require(spendLimitEth > 0, "spendLimitEth::invalid");

        dao.setConfiguration(GasPriceLimit, gasPriceLimit);
        dao.setConfiguration(SpendLimitPeriod, spendLimitPeriod);
        dao.setConfiguration(SpendLimitEth, spendLimitEth);
    }

    /**
     * @notice returns whether the current transaction should be reimbursed or not. It returns the spendLimitPeriod to avoid someone updating it during the execution.
     * @param dao the dao that should reimburse
     * @param gasLeft the maximum gas usable in this transaction
     */
    function shouldReimburse(DaoRegistry dao, uint256 gasLeft)
        external
        view
        override
        returns (bool, uint256)
    {
        //if it is a gelato call, do nothing as it will be handled somewhere else
        if (msg.sender == address(this)) {
            return (false, 0);
        }

        uint256 gasPriceLimit = dao.getConfiguration(GasPriceLimit);

        BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );

        if (gasPriceLimit < tx.gasprice) {
            return (false, 0);
        }

        if (bank.balanceOf(DaoHelper.GUILD, DaoHelper.ETH_TOKEN) < gasLeft) {
            return (false, 0);
        }

        uint256 spendLimitPeriod = dao.getConfiguration(SpendLimitPeriod);
        uint256 spendLimitEth = dao.getConfiguration(SpendLimitEth);

        uint256 payback = gasLeft * tx.gasprice;

        if (
            //slither-disable-next-line timestamp
            block.timestamp - _data[address(dao)].rateLimitStart <
            spendLimitPeriod
        ) {
            if (spendLimitEth < _data[address(dao)].ethUsed + payback) {
                return (false, 0);
            }
        } else {
            if (spendLimitEth < payback) {
                return (false, 0);
            }
        }

        return (true, spendLimitPeriod);
    }

    /**
     * @notice reimburse the transaction
     * @param dao the dao that needs to reimburse
     * @param caller who is the caller (the one who should be reimbursed)
     * @param gasUsage how much gas has been used
     * @param spendLimitPeriod the spend liimt period param read before executing the transaction
     */
    function reimburseTransaction(
        DaoRegistry dao,
        address payable caller,
        uint256 gasUsage,
        uint256 spendLimitPeriod
    ) external override onlyAdapter(dao) {
        BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
        uint256 payback = gasUsage * tx.gasprice;
        if (
            //slither-disable-next-line timestamp
            block.timestamp - _data[address(dao)].rateLimitStart <
            spendLimitPeriod
        ) {
            _data[address(dao)].ethUsed = _data[address(dao)].ethUsed + payback;
        } else {
            _data[address(dao)].rateLimitStart = block.timestamp;
            _data[address(dao)].ethUsed = payback;
        }
        // slither-disable-next-line unused-return
        try bank.supportsInterface(bank.withdrawTo.selector) returns (
            // slither-disable-next-line uninitialized-local,variable-scope
            bool supportsInterface
        ) {
            if (supportsInterface) {
                bank.withdrawTo(
                    DaoHelper.GUILD,
                    caller,
                    DaoHelper.ETH_TOKEN,
                    payback
                );
            } else {
                bank.internalTransfer(
                    DaoHelper.GUILD,
                    caller,
                    DaoHelper.ETH_TOKEN,
                    payback
                );
                bank.withdraw(caller, DaoHelper.ETH_TOKEN, payback);
            }
        } catch {
            //if supportsInterface reverts ( function does not exist, assume it does not have withdrawTo )
            bank.internalTransfer(
                DaoHelper.GUILD,
                caller,
                DaoHelper.ETH_TOKEN,
                payback
            );
            bank.withdraw(caller, DaoHelper.ETH_TOKEN, payback);
        }
    }
}
