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
const { expect } = require("chai");

const { UNITS, toBN, ZERO_ADDRESS } = require("../../utils/contract-util");

const { toNumber } = require("web3-utils");

const {
  takeChainSnapshot,
  revertChainSnapshot,
  deployDefaultDao,
  advanceTime,
  getAccounts,
} = require("../../utils/hardhat-test-util");

describe("Extension - Vesting", () => {
  let accounts, daoOwner;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];
    const { dao, adapters, extensions, factories, testContracts } =
      await deployDefaultDao({
        owner: daoOwner,
        finalize: false,
      });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.testContracts = testContracts;
    this.factories = factories;

    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  describe("Factory", async () => {
    it("should be possible to create an extension using the factory", async () => {
      const { logs } = await this.factories.vestingExtFactory.create(
        this.dao.address
      );
      const log = logs[0];
      expect(log.event).to.be.equal("InternalTokenVestingExtensionCreated");
      expect(log.args[0]).to.be.equal(this.dao.address);
      expect(log.args[1]).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should be possible to get an extension address by dao", async () => {
      await this.factories.vestingExtFactory.create(this.dao.address);
      const extAddress =
        await this.factories.vestingExtFactory.getExtensionAddress(
          this.dao.address
        );
      expect(extAddress).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should return zero address if there is no extension address by dao", async () => {
      const daoAddress = accounts[2];
      const extAddress =
        await this.factories.vestingExtFactory.getExtensionAddress(daoAddress);
      expect(extAddress).to.be.equal(ZERO_ADDRESS);
    });

    it("should not be possible to create an extension using a zero address dao", async () => {
      await expect(this.factories.vestingExtFactory.create(ZERO_ADDRESS)).to.be
        .reverted;
    });
  });

  it("should be able to create vesting and the blocked amount should change with time", async () => {
    const vesting = this.extensions.vestingExt;
    const now = new Date();

    const numberOfDaysToAdd = 6;
    now.setDate(now.getDate() + numberOfDaysToAdd);
    let minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(minBalance.toString()).equal("0");

    await vesting.createNewVesting(
      this.dao.address,
      daoOwner,
      UNITS,
      1000,
      Math.floor(now.getTime() / 1000),
      { from: daoOwner }
    );

    const v = await vesting.vesting(daoOwner, UNITS);
    const diff = toBN(v.endDate.toString()).sub(toBN(v.startDate.toString()));

    minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(minBalance.toString()).equal("1000");

    const halfWay = diff.div(toBN("2"));

    await advanceTime(halfWay.toNumber());

    minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(toBN(minBalance.toString())).to.be.closeTo(toBN("500"), 5);

    await advanceTime(diff.toNumber());

    minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(minBalance.toString()).equal("0");
  });

  it("should be able to add multiple vestings", async () => {
    const vesting = this.extensions.vestingExt;
    const now = new Date();

    const numberOfDaysToAdd = 6;
    now.setDate(now.getDate() + numberOfDaysToAdd);
    let minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(minBalance.toString()).equal("0");

    await vesting.createNewVesting(
      this.dao.address,
      daoOwner,
      UNITS,
      100,
      Math.floor(now.getTime() / 1000),
      { from: daoOwner }
    );

    let v = await vesting.vesting(daoOwner, UNITS);
    let diff = toBN(v.endDate.toString()).sub(toBN(v.startDate.toString()));

    minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(minBalance.toString()).equal("100");

    let halfWay = diff.div(toBN("2"));

    await advanceTime(halfWay.toNumber());

    now.setDate(now.getDate() + numberOfDaysToAdd);

    await vesting.createNewVesting(
      this.dao.address,
      daoOwner,
      UNITS,
      100,
      Math.floor(now.getTime() / 1000),
      { from: daoOwner }
    );

    v = await vesting.vesting(daoOwner, UNITS);
    diff = toBN(v.endDate.toString()).sub(toBN(v.startDate.toString()));
    halfWay = diff.div(toBN("2"));

    minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(toBN(minBalance.toString())).to.be.closeTo(toBN("150"), 5);

    await advanceTime(halfWay.toNumber());

    minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(toBN(minBalance.toString())).to.be.closeTo(toBN("75"), 5);

    await advanceTime(diff.toNumber());

    minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(minBalance.toString()).equal("0");
  });

  it("should be possible to remove vesting", async () => {
    const vesting = this.extensions.vestingExt;
    const now = new Date();

    const numberOfDaysToAdd = 6;
    now.setDate(now.getDate() + numberOfDaysToAdd);
    let minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(minBalance.toString()).equal("0");

    await vesting.createNewVesting(
      this.dao.address,
      daoOwner,
      UNITS,
      100,
      Math.floor(now.getTime() / 1000),
      { from: daoOwner }
    );

    let v = await vesting.vesting(daoOwner, UNITS);
    let diff = toBN(v.endDate.toString()).sub(toBN(v.startDate.toString()));

    minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(minBalance.toString()).equal("100");

    let halfWay = diff.div(toBN("2"));

    await advanceTime(halfWay.toNumber());

    now.setDate(now.getDate() + numberOfDaysToAdd);

    await vesting.createNewVesting(
      this.dao.address,
      daoOwner,
      UNITS,
      100,
      Math.floor(now.getTime() / 1000),
      { from: daoOwner }
    );

    v = await vesting.vesting(daoOwner, UNITS);
    diff = toBN(v.endDate.toString()).sub(toBN(v.startDate.toString()));
    halfWay = diff.div(toBN("2"));

    minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    const minBalanceStr = minBalance.toString();

    expect(toNumber(minBalanceStr)).to.be.closeTo(150, 1);

    await advanceTime(halfWay.toNumber());

    minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(toNumber(minBalance.toString())).to.be.closeTo(75, 1);

    await vesting.removeVesting(this.dao.address, daoOwner, UNITS, 50, {
      from: daoOwner,
    });

    minBalance = await vesting.getMinimumBalance(daoOwner, UNITS);
    expect(toNumber(minBalance.toString())).to.be.closeTo(25, 1);
  });

  it("should not be possible to create a new vesting without the ACL permission", async () => {
    // Finalize the DAO to be able to check the extension permissions
    await this.dao.finalizeDao({ from: daoOwner });
    const vesting = this.extensions.vestingExt;
    const now = new Date();
    await expect(
      vesting.createNewVesting(
        this.dao.address,
        daoOwner,
        UNITS,
        100,
        Math.floor(now.getTime() / 1000),
        { from: daoOwner }
      )
    ).to.be.revertedWith("vestingExt::accessDenied");
  });

  it("should not be possible to removeVesting a vesting schedule the without ACL permission", async () => {
    // Finalize the DAO to be able to check the extension permissions
    await this.dao.finalizeDao({ from: daoOwner });
    const vesting = this.extensions.vestingExt;
    await expect(
      vesting.removeVesting(this.dao.address, daoOwner, UNITS, 100, {
        from: daoOwner,
      })
    ).to.be.revertedWith("vestingExt::accessDenied");
  });
});
