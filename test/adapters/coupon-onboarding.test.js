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
const {
  toBN,
  advanceTime,
  createDao,
  getContract,
  GUILD,
  SHARES,
  sharePrice,
  remaining,
  numberOfShares,
  CouponOnboardingContract,
  BankExtension,
  sha3,
  ETH_TOKEN,
} = require("../../utils/DaoFactory.js");
const { checkBalance } = require("../../utils/TestUtils.js");
const {
  SigUtilSigner,
  getMessageERC712Hash,
} = require("../../utils/offchain_voting.js");

const signer = {
  address: "0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8",
  privKey: "c150429d49e8799f119434acd3f816f299a5c7e3891455ee12269cb47a5f987c",
};

contract("LAOLAND - Coupon Onboarding Adapter", async (accounts) => {

  it("should be possible to join a DAO with a valid coupon", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];

    const signerUtil = SigUtilSigner(signer.privKey);

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    let signerAddr = await dao.getAddressConfiguration(
      sha3("coupon-onboarding.signerAddress")
    );
    assert.equal(signerAddr, signer.address);

    const couponOnboarding = await getContract(
      dao,
      "coupon-onboarding",
      CouponOnboardingContract
    );

    const couponData = {
      type: "coupon",
      authorizedMember: otherAccount,
      amount: 10,
      nonce: 1,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      couponOnboarding.address,
      1
    );
    let solHash = await couponOnboarding.hashCouponMessage(
      dao.address,
      couponData
    );
    assert.equal(jsHash, solHash);

    var signature = signerUtil(
      couponData,
      dao.address,
      couponOnboarding.address,
      1
    );

    const recAddr = await couponOnboarding.recover(jsHash, signature);

    assert.equal(recAddr, signer.address);

    assert.equal(await bank.balanceOf(otherAccount, SHARES), "0");

    await couponOnboarding.redeemCoupon(
      dao.address,
      otherAccount,
      10,
      1,
      signature
    );

    const myAccountShares = await bank.balanceOf(myAccount, SHARES);
    const otherAccountShares = await bank.balanceOf(otherAccount, SHARES);

    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), "10");

    await checkBalance(bank, GUILD, ETH_TOKEN, toBN("0"));
  });

  it("should not be possible to join a DAO with mismatched coupon values", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];

    const signerUtil = SigUtilSigner(signer.privKey);

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    let signerAddr = await dao.getAddressConfiguration(
      sha3("coupon-onboarding.signerAddress")
    );
    assert.equal(signerAddr, signer.address);

    const couponOnboarding = await getContract(
      dao,
      "coupon-onboarding",
      CouponOnboardingContract
    );

    const couponData = {
      type: "coupon",
      authorizedMember: otherAccount,
      amount: 10,
      nonce: 1,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      couponOnboarding.address,
      1
    );

    var signature = signerUtil(
      couponData,
      dao.address,
      couponOnboarding.address,
      1
    );

    const recAddr = await couponOnboarding.recover(jsHash, signature);

    assert.equal(recAddr, signer.address);

    assert.equal(await bank.balanceOf(otherAccount, SHARES), "0");

    await couponOnboarding.redeemCoupon(
      dao.address,
      otherAccount,
      10,
      1,
      signature
    );

    const myAccountShares = await bank.balanceOf(myAccount, SHARES);
    const otherAccountShares = await bank.balanceOf(otherAccount, SHARES);

    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), "10");

    await checkBalance(bank, GUILD, ETH_TOKEN, toBN("0"));
  });

  it("should not be possible to join a DAO with an invalid coupon", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];

    const signerUtil = SigUtilSigner(signer.privKey);

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    let signerAddr = await dao.getAddressConfiguration(
      sha3("coupon-onboarding.signerAddress")
    );
    assert.equal(signerAddr, signer.address);

    const couponOnboarding = await getContract(
      dao,
      "coupon-onboarding",
      CouponOnboardingContract
    );

    const couponData = {
      type: "coupon",
      authorizedMember: otherAccount,
      amount: 10,
      nonce: 1,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      couponOnboarding.address,
      1
    );

    var signature = signerUtil(
      couponData,
      dao.address,
      couponOnboarding.address,
      1
    );

    const recAddr = await couponOnboarding.recover(jsHash, signature);

    assert.equal(recAddr, signer.address);

    assert.equal(await bank.balanceOf(otherAccount, SHARES), "0");

    await couponOnboarding.redeemCoupon(
      dao.address,
      otherAccount,
      10,
      1,
      signature
    );

    const myAccountShares = await bank.balanceOf(myAccount, SHARES);
    const otherAccountShares = await bank.balanceOf(otherAccount, SHARES);

    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), "10");

    await checkBalance(bank, GUILD, ETH_TOKEN, toBN("0"));
  });
});
