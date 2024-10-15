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

describe("Adapter - Coupon Update Delegate Key", () => {
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

  it("should be possible to update the delegate key with a valid coupon", async () => {
    const otherAccount = accounts[2];
    const account = accounts[0];
    const signerUtil = SigUtilSigner(signer.privKey);

    const dao = this.dao;

    let signerAddr = await dao.getAddressConfiguration(
      sha3("coupon-update-delegate-key.signerAddress")
    );
    expect(signerAddr).equal(signer.address);

    const couponUpdateDelegateKey = this.adapters.couponUpdateDelegateKey;

    const couponData = {
      type: "coupon-delegate-key",
      authorizedMember: account,
      newDelegateKey: otherAccount,
      nonce: 1,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      couponUpdateDelegateKey.address,
      chainId
    );
    let solHash = await couponUpdateDelegateKey.hashCouponMessage(
      dao.address,
      couponData
    );
    expect(jsHash).equal(solHash);

    var signature = signerUtil(
      couponData,
      dao.address,
      couponUpdateDelegateKey.address,
      chainId
    );

    const delegateKeyBefore = await dao.getCurrentDelegateKey(daoOwner);

    await couponUpdateDelegateKey.redeemCoupon(
      dao.address,
      account,
      otherAccount,
      1,
      signature
    );

    const delegateKeyAfter = await dao.getCurrentDelegateKey(daoOwner);

    expect(delegateKeyBefore).equal(daoOwner);
    expect(delegateKeyAfter).equal(otherAccount);
  });

  it("should not be possible to update the delegate key if not a member", async () => {
    const otherAccount = accounts[2];

    const signerUtil = SigUtilSigner(signer.privKey);

    const dao = this.dao;

    let signerAddr = await dao.getAddressConfiguration(
      sha3("coupon-update-delegate-key.signerAddress")
    );
    expect(signerAddr).equal(signer.address);

    const couponUpdateDelegateKey = this.adapters.couponUpdateDelegateKey;

    const couponData = {
      type: "coupon-delegate-key",
      authorizedMember: otherAccount,
      newDelegateKey: accounts[3],
      nonce: 1,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      couponUpdateDelegateKey.address,
      1
    );

    var signature = signerUtil(
      couponData,
      dao.address,
      couponUpdateDelegateKey.address,
      1
    );

    const isValid = await couponUpdateDelegateKey.isValidSignature(
      signer.address,
      jsHash,
      signature
    );

    expect(isValid).equal(true);

    await expect(
      couponUpdateDelegateKey.redeemCoupon(
        dao.address,
        otherAccount,
        accounts[3],
        1,
        signature
      )
    ).to.be.revertedWith("invalid sig");

    const delegateKeyAfter = await dao.getCurrentDelegateKey(otherAccount);

    expect(delegateKeyAfter).equal(otherAccount);
  });

  it("should not be possible to update the delegate key for a member that doesn't match the coupon value", async () => {
    const otherAccount = accounts[2];

    const signerUtil = SigUtilSigner(signer.privKey);

    const dao = this.dao;
    const bank = this.extensions.bankExt;

    let signerAddr = await dao.getAddressConfiguration(
      sha3("coupon-update-delegate-key.signerAddress")
    );
    expect(signerAddr).equal(signer.address);

    const couponUpdateDelegateKey = this.adapters.couponUpdateDelegateKey;

    const couponData = {
      type: "coupon-delegate-key",
      authorizedMember: daoOwner,
      newDelegateKey: accounts[3],
      nonce: 1,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      couponUpdateDelegateKey.address,
      1
    );

    var signature = signerUtil(
      couponData,
      dao.address,
      couponUpdateDelegateKey.address,
      1
    );

    const isValid = await couponUpdateDelegateKey.isValidSignature(
      signer.address,
      jsHash,
      signature
    );

    expect(isValid).equal(true);

    await expect(
      couponUpdateDelegateKey.redeemCoupon(
        dao.address,
        daoOwner,
        accounts[3],
        1,
        signature
      )
    ).to.be.revertedWith("invalid sig");
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

    const couponUpdateDelegateKey = this.adapters.couponUpdateDelegateKey;

    const couponData = {
      type: "coupon-delegate-key",
      authorizedMember: daoOwner,
      newDelegateKey: otherAccount,
      nonce: 1,
    };

    const couponData2 = {
      type: "coupon",
      authorizedMember: daoOwner,
      newDelegateKey: accounts[3],
      nonce: 1,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      couponUpdateDelegateKey.address,
      chainId
    );
    let solHash = await couponUpdateDelegateKey.hashCouponMessage(
      dao.address,
      couponData
    );
    expect(jsHash).equal(solHash);

    var signature = signerUtil(
      couponData,
      dao.address,
      couponUpdateDelegateKey.address,
      chainId
    );

    await couponUpdateDelegateKey.redeemCoupon(
      dao.address,
      daoOwner,
      otherAccount,
      1,
      signature
    );
    await expect(
      couponUpdateDelegateKey.redeemCoupon(
        dao.address,
        daoOwner,
        otherAccount,
        1,
        signature
      )
    ).to.be.revertedWith("coupon already redeemed");
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.couponUpdateDelegateKey;
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
    const adapter = this.adapters.couponUpdateDelegateKey;
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
