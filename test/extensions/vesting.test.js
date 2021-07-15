// Whole-script strict mode syntax
"use strict";

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

const { UNITS, toBN } = require("../../utils/ContractUtil.js");

const {
  InternalTokenVestingExtension,
  MockDao,
  takeChainSnapshot,
  revertChainSnapshot,
  deployFunction,
  advanceTime,
  accounts,
  expect,
} = require("../../utils/OZTestUtil.js");

describe("Extension - Vesting", () => {
  before("deploy dao", async () => {
    this.vestingExtension = await deployFunction(InternalTokenVestingExtension);
    this.dao = await deployFunction(MockDao);
    await this.vestingExtension.initialize(this.dao.address, this.dao.address);
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(this.snapshotId);
    this.snapshotId = await takeChainSnapshot();
  });

  it("should be able to create vesting and the blocked amount should change with time", async () => {
    const vesting = this.vestingExtension;
    const now = new Date();

    const numberOfDaysToAdd = 6;
    now.setDate(now.getDate() + numberOfDaysToAdd);
    let minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("0");

    await vesting.createNewVesting(
      accounts[0],
      UNITS,
      1000,
      Math.floor(now.getTime() / 1000)
    );

    const v = await vesting.vesting(accounts[0], UNITS);
    const diff = v.endDate.sub(v.startDate);

    minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("1000");

    const halfWay = diff.div(toBN("2"));

    await advanceTime(halfWay.toNumber());

    minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("500");

    await advanceTime(diff.toNumber());

    minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("0");
  });

  it("should be able to add multiple vestings", async () => {
    const vesting = this.vestingExtension;
    const now = new Date();

    const numberOfDaysToAdd = 6;
    now.setDate(now.getDate() + numberOfDaysToAdd);
    let minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("0");

    await vesting.createNewVesting(
      accounts[0],
      UNITS,
      100,
      Math.floor(now.getTime() / 1000)
    );

    let v = await vesting.vesting(accounts[0], UNITS);
    let diff = v.endDate.sub(v.startDate);

    minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("100");

    let halfWay = diff.div(toBN("2"));

    await advanceTime(halfWay.toNumber());

    now.setDate(now.getDate() + numberOfDaysToAdd);

    await vesting.createNewVesting(
      accounts[0],
      UNITS,
      100,
      Math.floor(now.getTime() / 1000)
    );

    v = await vesting.vesting(accounts[0], UNITS);
    diff = v.endDate.sub(v.startDate);
    halfWay = diff.div(toBN("2"));

    minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("150");

    await advanceTime(halfWay.toNumber());

    minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("75");

    await advanceTime(diff.toNumber());

    minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("0");
  });

  it("should be possible to remove vesting", async () => {
    const vesting = this.vestingExtension;
    const now = new Date();

    const numberOfDaysToAdd = 6;
    now.setDate(now.getDate() + numberOfDaysToAdd);
    let minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("0");

    await vesting.createNewVesting(
      accounts[0],
      UNITS,
      100,
      Math.floor(now.getTime() / 1000)
    );

    let v = await vesting.vesting(accounts[0], UNITS);
    let diff = v.endDate.sub(v.startDate);

    minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("100");

    let halfWay = diff.div(toBN("2"));

    await advanceTime(halfWay.toNumber());

    now.setDate(now.getDate() + numberOfDaysToAdd);

    await vesting.createNewVesting(
      accounts[0],
      UNITS,
      100,
      Math.floor(now.getTime() / 1000)
    );

    v = await vesting.vesting(accounts[0], UNITS);
    diff = v.endDate.sub(v.startDate);
    halfWay = diff.div(toBN("2"));

    minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    const minBalanceStr = minBalance.toString();
    //to manage rounding error
    expect(minBalanceStr === "150" || minBalanceStr === "151").equal(true);

    await advanceTime(halfWay.toNumber());

    minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("75");

    await vesting.removeVesting(accounts[0], UNITS, 50);

    minBalance = await vesting.getMinimumBalance(accounts[0], UNITS);
    expect(minBalance.toString()).equal("50");
  });
});
