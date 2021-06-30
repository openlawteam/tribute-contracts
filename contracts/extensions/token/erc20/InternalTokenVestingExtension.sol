pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT
import "../../../core/DaoConstants.sol";
import "../../../core/DaoRegistry.sol";
import "../../../extensions/IExtension.sol";

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

/**
 *
 * The ERC20Extension is a contract to give erc20 functionality
 * to the internal token units held by DAO members inside the DAO itself.
 */
contract InternalTokenVestingExtension is DaoConstants, IExtension {
    enum AclFlag {NEW_VESTING, REMOVE_VESTING}

    bool private _initialized;

    DaoRegistry private _dao;

    struct VestingSchedule {
        uint64 startDate;
        uint64 endDate;
        uint88 blockedAmount;
    }

    modifier hasExtensionAccess(AclFlag flag) {
        _dao.hasAdapterAccessToExtension(
            msg.sender,
            address(this),
            uint8(flag)
        );

        _;
    }

    mapping(address => mapping(address => VestingSchedule)) public vesting;

    function initialize(DaoRegistry dao, address) external override {
        require(!_initialized, "init");
        _dao = dao;
        _initialized = true;
    }

    function createNewVesting(
        address member,
        address internalToken,
        uint88 amount,
        uint64 endDate
    ) public hasExtensionAccess(AclFlag.NEW_VESTING) {
        require(endDate > block.timestamp, "end date in the past!");
        VestingSchedule storage schedule = vesting[member][internalToken];
        uint88 minBalance =
            getMinimumBalanceInternal(
                schedule.startDate,
                schedule.endDate,
                schedule.blockedAmount
            );

        schedule.startDate = uint64(block.timestamp);
        //get max value between endDate and previous one
        if (endDate > schedule.endDate) {
            schedule.endDate = endDate;
        }

        schedule.blockedAmount = minBalance + amount;
    }

    function removeVesting(
        address member,
        address internalToken,
        uint88 amountToRemove
    ) public hasExtensionAccess(AclFlag.REMOVE_VESTING) {
        vesting[member][internalToken].blockedAmount -= amountToRemove;
    }

    function getMinimumBalance(address member, address internalToken)
        public
        view
        returns (uint88)
    {
        VestingSchedule storage schedule = vesting[member][internalToken];
        return
            getMinimumBalanceInternal(
                schedule.startDate,
                schedule.endDate,
                schedule.blockedAmount
            );
    }

    function getMinimumBalanceInternal(
        uint64 startDate,
        uint64 endDate,
        uint88 amount
    ) public view returns (uint88) {
        if (block.timestamp > endDate) {
            return 0;
        }

        uint88 period = endDate - startDate;
        uint88 elapsedTime = uint88(block.timestamp) - startDate;

        uint88 vestedAmount = (amount * elapsedTime) / period;

        return amount - vestedAmount;
    }
}
