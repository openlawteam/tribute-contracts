pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT
import "../../../core/DaoRegistry.sol";
import "../../../extensions/IExtension.sol";
import "../../../helpers/DaoHelper.sol";

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
contract InternalTokenVestingExtension is IExtension {
    enum AclFlag {
        NEW_VESTING,
        REMOVE_VESTING
    }

    bool public initialized;

    DaoRegistry private _dao;

    struct VestingSchedule {
        uint64 startDate;
        uint64 endDate;
        uint88 blockedAmount;
    }

    modifier hasExtensionAccess(DaoRegistry dao, AclFlag flag) {
        require(
            dao == _dao &&
                (DaoHelper.isInCreationModeAndHasAccess(dao) ||
                    !initialized ||
                    _dao.hasAdapterAccessToExtension(
                        msg.sender,
                        address(this),
                        uint8(flag)
                    )),
            "vestingExt::accessDenied"
        );

        _;
    }

    mapping(address => mapping(address => VestingSchedule)) public vesting;

    /// @notice Clonable contract must have an empty constructor
    constructor() {}

    /**
     * @notice Initializes the extension with the DAO that it belongs to.
     * @param dao The address of the DAO that owns the extension.
     */
    function initialize(DaoRegistry dao, address) external override {
        require(!initialized, "already initialized");
        initialized = true;
        _dao = dao;
    }

    /**
     * @notice Creates a new vesting schedule for a member based on the internal token, amount and end date.
     * @param member The member address to update the balance.
     * @param internalToken The internal DAO token in which the member will receive the funds.
     * @param amount The amount staked.
     * @param endDate The unix timestamp in which the vesting schedule ends.
     */
    function createNewVesting(
        DaoRegistry dao,
        address member,
        address internalToken,
        uint88 amount,
        uint64 endDate
    ) external hasExtensionAccess(dao, AclFlag.NEW_VESTING) {
        //slither-disable-next-line timestamp
        require(endDate > block.timestamp, "vestingExt::end date in the past");
        VestingSchedule storage schedule = vesting[member][internalToken];
        uint88 minBalance = getMinimumBalanceInternal(
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

    /**
     * @notice Updates a vesting schedule of a member based on the internal token, and amount.
     * @param member The member address to update the balance.
     * @param internalToken The internal DAO token in which the member will receive the funds.
     * @param amountToRemove The amount to be removed.
     */
    function removeVesting(
        DaoRegistry dao,
        address member,
        address internalToken,
        uint88 amountToRemove
    ) external hasExtensionAccess(dao, AclFlag.REMOVE_VESTING) {
        VestingSchedule storage schedule = vesting[member][internalToken];
        uint88 blockedAmount = getMinimumBalanceInternal(
            schedule.startDate,
            schedule.endDate,
            schedule.blockedAmount
        );

        schedule.startDate = uint64(block.timestamp);
        schedule.blockedAmount = blockedAmount - amountToRemove;
    }

    /**
     * @notice Returns the minimum balance of the vesting for a given member and internal token.
     * @param member The member address to update the balance.
     * @param internalToken The internal DAO token in which the member will receive the funds.
     */
    function getMinimumBalance(address member, address internalToken)
        external
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

    /**
     * @notice Returns the minimum balance of the vesting for a given start date, end date, and amount.
     * @param startDate The start date of the vesting to calculate the elapsed time.
     * @param endDate The end date of the vesting to calculate the vesting period.
     * @param amount The amount staked.
     */
    function getMinimumBalanceInternal(
        uint64 startDate,
        uint64 endDate,
        uint88 amount
    ) public view returns (uint88) {
        //slither-disable-next-line timestamp
        if (block.timestamp > endDate) {
            return 0;
        }

        uint88 period = endDate - startDate;
        //slither-disable-next-line timestamp
        uint88 elapsedTime = uint88(block.timestamp) - startDate;

        uint88 vestedAmount = (amount * elapsedTime) / period;

        return amount - vestedAmount;
    }
}
