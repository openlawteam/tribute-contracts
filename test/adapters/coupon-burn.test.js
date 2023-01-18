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
const {
  sha3,
  toBN,
  toWei,
  fromAscii,
  UNITS,
  GUILD,
  ETH_TOKEN,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  getAccounts,
  web3,
} = require("../../utils/hardhat-test-util");

const { checkBalance } = require("../../utils/test-util");

const {
  SigUtilSigner,
  getMessageERC712Hash,
} = require("../../utils/offchain-voting-util");

const signer = {
  address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
  privKey: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
};

describe("Adapter - Coupon Burn", () => {
  let accounts, daoOwner;
  const chainId = 1337;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];

    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
      couponCreatorAddress: signer.address,
    });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(this.snapshotId);
    this.snapshotId = await takeChainSnapshot();
  });

  it("should be possible to burn units with a valid coupon", async () => {
    const otherAccount = accounts[2];
    const signerUtil = SigUtilSigner(signer.privKey);

    const dao = this.dao;
    const bank = this.extensions.bankExt;

    let signerAddr = await dao.getAddressConfiguration(
      sha3("coupon-onboarding.signerAddress")
    );
    expect(signerAddr).equal(signer.address);

    const couponBurn = this.adapters.couponBurn;

    const couponData = {
      type: "coupon",
      authorizedMember: otherAccount,
      amount: 10,
      nonce: 1,
    };

    const couponData2 = {
      type: "coupon",
      authorizedMember: otherAccount,
      amount: 15,
      nonce: 1,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      couponBurn.address,
      chainId
    );
    let solHash = await couponBurn.hashCouponMessage(dao.address, couponData);
    expect(jsHash).equal(solHash);

    var signature = signerUtil(
      couponData,
      dao.address,
      couponBurn.address,
      chainId
    );

    var signatureOnboarding = signerUtil(
      couponData2,
      dao.address,
      this.adapters.couponOnboarding.address,
      chainId
    );

    let balance = await bank.balanceOf(otherAccount, UNITS);
    expect(balance.toString()).equal("0");

    await this.adapters.couponOnboarding.redeemCoupon(
      dao.address,
      otherAccount,
      15,
      1,
      signatureOnboarding
    );

    balance = await bank.balanceOf(otherAccount, UNITS);
    expect(balance.toString()).equal("15");

    await couponBurn.redeemCoupon(dao.address, otherAccount, 10, 1, signature);

    const daoOwnerUnits = await bank.balanceOf(daoOwner, UNITS);
    const otherAccountUnits = await bank.balanceOf(otherAccount, UNITS);

    expect(daoOwnerUnits.toString()).equal("1");
    expect(otherAccountUnits.toString()).equal("5");
  });

  it("should not be possible to burn units with an amount different than the coupon value", async () => {
    const otherAccount = accounts[2];

    const signerUtil = SigUtilSigner(signer.privKey);

    const dao = this.dao;
    const bank = this.extensions.bankExt;

    let signerAddr = await dao.getAddressConfiguration(
      sha3("coupon-burn.signerAddress")
    );
    expect(signerAddr).equal(signer.address);

    const couponBurn = this.adapters.couponBurn;

    const couponData = {
      type: "coupon",
      authorizedMember: otherAccount,
      amount: 10,
      nonce: 1,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      couponBurn.address,
      1
    );

    var signature = signerUtil(couponData, dao.address, couponBurn.address, 1);

    const isValid = await couponBurn.isValidSignature(
      signer.address,
      jsHash,
      signature
    );

    expect(isValid).equal(true);

    let balance = await bank.balanceOf(otherAccount, UNITS);
    expect(balance.toString()).equal("0");

    await expect(
      couponBurn.redeemCoupon(dao.address, otherAccount, 100, 1, signature)
    ).to.be.revertedWith("invalid sig");

    const daoOwnerUnits = await bank.balanceOf(daoOwner, UNITS);
    const otherAccountUnits = await bank.balanceOf(otherAccount, UNITS);

    expect(daoOwnerUnits.toString()).equal("1");
    expect(otherAccountUnits.toString()).equal("0");

    await checkBalance(bank, GUILD, ETH_TOKEN, toBN("0"));
  });

  it("should not be possible to burn units for a member that doesn't match the coupon value", async () => {
    const otherAccount = accounts[2];

    const signerUtil = SigUtilSigner(signer.privKey);

    const dao = this.dao;
    const bank = this.extensions.bankExt;

    let signerAddr = await dao.getAddressConfiguration(
      sha3("coupon-burn.signerAddress")
    );
    expect(signerAddr).equal(signer.address);

    const couponBurn = this.adapters.couponBurn;

    const couponData = {
      type: "coupon",
      authorizedMember: otherAccount,
      amount: 10,
      nonce: 1,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      couponBurn.address,
      1
    );

    var signature = signerUtil(couponData, dao.address, couponBurn.address, 1);

    const isValid = await couponBurn.isValidSignature(
      signer.address,
      jsHash,
      signature
    );

    expect(isValid).equal(true);
    let balance = await bank.balanceOf(otherAccount, UNITS);
    expect(balance.toString()).equal("0");

    await expect(
      couponBurn.redeemCoupon(dao.address, daoOwner, 10, 1, signature)
    ).to.be.revertedWith("invalid sig");

    const daoOwnerUnits = await bank.balanceOf(daoOwner, UNITS);
    const otherAccountUnits = await bank.balanceOf(otherAccount, UNITS);

    expect(daoOwnerUnits.toString()).equal("1");
    expect(otherAccountUnits.toString()).equal("0");

    await checkBalance(bank, GUILD, ETH_TOKEN, toBN("0"));
  });

  it("should not be possible to replay coupon", async () => {
    const otherAccount = accounts[2];
    const signerUtil = SigUtilSigner(signer.privKey);

    const dao = this.dao;
    const bank = this.extensions.bankExt;

    let signerAddr = await dao.getAddressConfiguration(
      sha3("coupon-onboarding.signerAddress")
    );
    expect(signerAddr).equal(signer.address);

    const couponBurn = this.adapters.couponBurn;

    const couponData = {
      type: "coupon",
      authorizedMember: otherAccount,
      amount: 5,
      nonce: 1,
    };

    const couponData2 = {
      type: "coupon",
      authorizedMember: otherAccount,
      amount: 15,
      nonce: 1,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      couponBurn.address,
      chainId
    );
    let solHash = await couponBurn.hashCouponMessage(dao.address, couponData);
    expect(jsHash).equal(solHash);

    var signature = signerUtil(
      couponData,
      dao.address,
      couponBurn.address,
      chainId
    );

    var signatureOnboarding = signerUtil(
      couponData2,
      dao.address,
      this.adapters.couponOnboarding.address,
      chainId
    );

    let balance = await bank.balanceOf(otherAccount, UNITS);
    expect(balance.toString()).equal("0");

    await this.adapters.couponOnboarding.redeemCoupon(
      dao.address,
      otherAccount,
      15,
      1,
      signatureOnboarding
    );

    balance = await bank.balanceOf(otherAccount, UNITS);
    expect(balance.toString()).equal("15");

    await couponBurn.redeemCoupon(dao.address, otherAccount, 5, 1, signature);

    const daoOwnerUnits = await bank.balanceOf(daoOwner, UNITS);
    const otherAccountUnits = await bank.balanceOf(otherAccount, UNITS);

    expect(daoOwnerUnits.toString()).equal("1");
    expect(otherAccountUnits.toString()).equal("10");

    await expect(
      couponBurn.redeemCoupon(dao.address, daoOwner, 10, 1, signature)
    ).to.be.revertedWith("coupon already redeemed");
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.couponBurn;
    await expect(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
      })
    ).to.be.revertedWith("revert");
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const adapter = this.adapters.couponBurn;
    await expect(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
        data: fromAscii("should go to fallback func"),
      })
    ).to.be.revertedWith("revert");
  });
});
