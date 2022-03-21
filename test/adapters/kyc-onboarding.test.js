// Whole-script strict mode syntax
"use strict";

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
const { expect } = require("chai");
const {
  toBN,
  toWei,
  unitPrice,
  UNITS,
  GUILD,
  ETH_TOKEN,
  remaining,
  numberOfUnits,
} = require("../../utils/contract-util.js");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  getAccounts,
  OLToken,
  getBalance,
} = require("../../utils/hardhat-test-util.js");

const { checkBalance, isMember } = require("../../utils/test-util.js");

const {
  SigUtilSigner,
  getMessageERC712Hash,
} = require("../../utils/offchain-voting-util.js");

const signer = {
  address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
  privKey: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
};

describe("Adapter - KYC Onboarding", () => {
  let accounts, daoOwner;
  const chainId = 1337;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];

    const { dao, adapters, extensions, wethContract } = await deployDefaultDao({
      owner: daoOwner,
      kycSignerAddress: signer.address,
    });

    this.dao = dao;
    this.weth = wethContract;
    this.adapters = adapters;
    this.extensions = extensions;
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(this.snapshotId);
    this.snapshotId = await takeChainSnapshot();
  });

  it("should not be possible onboard when the token amount exceeds the external token limits", async () => {
    const applicant = accounts[2];

    // Issue OpenLaw ERC20 Basic Token for tests
    // Token supply higher than the limit for external tokens

    const nbOfERC20Units = 100000000;
    const erc20UnitPrice = toBN("10");

    const { dao, adapters } = await deployDefaultDao({
      owner: daoOwner,
      unitPrice: erc20UnitPrice,
      nbUnits: nbOfERC20Units,
      tokenAddr: ETH_TOKEN,
    });

    const onboarding = adapters.kycOnboarding;

    const initialTokenBalance = await getBalance(applicant);

    await expect(
      onboarding.onboardEth(dao.address, applicant, [], {
        from: daoOwner,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("revert");

    // In case of failures the funds must be in the applicant account
    const applicantTokenBalance = await getBalance(applicant);
    // "applicant account should contain 2**161 OLT Tokens when the onboard fails"
    expect(initialTokenBalance.toString()).equal(
      applicantTokenBalance.toString()
    );
  });

  it("should be possible to join a DAO with ERC-20 contribution", async () => {
    const applicant = accounts[2];
    const nonMemberAccount = accounts[3];
    const tokenSupply = toBN("10000000000000000000000");
    const oltContract = await OLToken.new(tokenSupply);

    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
      tokenAddr: oltContract.address,
      kycSignerAddress: signer.address,
    });

    const bank = extensions.bankExt;
    const onboarding = adapters.kycOnboarding;

    const signerUtil = SigUtilSigner(signer.privKey);

    const couponData = {
      type: "coupon-kyc",
      kycedMember: applicant,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      onboarding.address,
      chainId
    );

    let solHash = await onboarding.hashCouponMessage(dao.address, couponData);
    expect(jsHash).equal(solHash);

    const signature = signerUtil(
      couponData,
      dao.address,
      onboarding.address,
      chainId
    );

    await oltContract.transfer(applicant, toWei("1"));

    await oltContract.approve(onboarding.address, toWei("1"), {
      from: applicant,
    });

    await onboarding.onboard(
      dao.address,
      applicant,
      oltContract.address,
      toWei("1"),
      signature,
      {
        from: applicant,
        gasPrice: toBN("0"),
      }
    );

    // test return of remaining amount in excess of multiple of unitsPerChunk
    const myAccountBalance = await getBalance(applicant);
    // daoOwner did not receive remaining amount in excess of multiple of unitsPerChunk
    expect(myAccountBalance).to.be.at.least(toBN("9999999950000000000000"))

    const myAccountUnits = await bank.balanceOf(daoOwner, UNITS);
    const applicantUnits = await bank.balanceOf(applicant, UNITS);
    const nonMemberAccountUnits = await bank.balanceOf(nonMemberAccount, UNITS);
    expect(myAccountUnits.toString()).equal("1");
    expect(applicantUnits.toString()).equal(
      numberOfUnits.mul(toBN("8")).toString()
    );
    expect(nonMemberAccountUnits.toString()).equal("0");
    await checkBalance(bank, GUILD, ETH_TOKEN, 0);
    const fundTargetAddress = "0x823A19521A76f80EC49670BE32950900E8Cd0ED3";
    const balance = await oltContract.balanceOf(fundTargetAddress);

    expect(balance.toString()).equal(unitPrice.mul(toBN("8")).toString());
    // test active member status
    const applicantIsActiveMember = await isMember(bank, applicant);
    expect(applicantIsActiveMember).equal(true);
    const nonMemberAccountIsActiveMember = await isMember(
      bank,
      nonMemberAccount
    );
    expect(nonMemberAccountIsActiveMember).equal(false);
  });

  it("should be possible to join a DAO with ETH contribution", async () => {
    const applicant = accounts[2];
    const nonMemberAccount = accounts[3];

    const dao = this.dao;
    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.kycOnboarding;

    const myAccountInitialBalance = await getBalance(applicant);
    // remaining amount to test sending back to proposer
    const ethAmount = unitPrice.mul(toBN(3)).add(remaining);

    const signerUtil = SigUtilSigner(signer.privKey);

    const couponData = {
      type: "coupon-kyc",
      kycedMember: applicant,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      onboarding.address,
      chainId
    );
    let solHash = await onboarding.hashCouponMessage(dao.address, couponData);
    expect(jsHash).equal(solHash);

    const signature = signerUtil(
      couponData,
      dao.address,
      onboarding.address,
      chainId
    );

    await onboarding.onboardEth(dao.address, applicant, signature, {
      from: applicant,
      value: ethAmount,
      gasPrice: toBN("0"),
    });

    // test return of remaining amount in excess of multiple of unitsPerChunk
    const myAccountBalance = await getBalance(applicant);
    // daoOwner did not receive remaining amount in excess of multiple of unitsPerChunk
    expect(
      toBN(myAccountInitialBalance).sub(ethAmount).add(remaining).toString()
    ).equal(myAccountBalance.toString());

    const myAccountUnits = await bank.balanceOf(daoOwner, UNITS);
    const applicantUnits = await bank.balanceOf(applicant, UNITS);
    const nonMemberAccountUnits = await bank.balanceOf(nonMemberAccount, UNITS);
    expect(myAccountUnits.toString()).equal("1");
    expect(applicantUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(nonMemberAccountUnits.toString()).equal("0");
    await checkBalance(bank, GUILD, ETH_TOKEN, 0);
    const fundTargetAddress = "0x823A19521A76f80EC49670BE32950900E8Cd0ED3";
    const balance = await this.weth.balanceOf(fundTargetAddress);

    expect(balance.toString()).equal(unitPrice.mul(toBN("3")).toString());
    // test active member status
    const applicantIsActiveMember = await isMember(bank, applicant);
    expect(applicantIsActiveMember).equal(true);
    const nonMemberAccountIsActiveMember = await isMember(
      bank,
      nonMemberAccount
    );
    expect(nonMemberAccountIsActiveMember).equal(false);
  });

  it("should not be possible to join the same member after he delegates his membership to another address", async () => {
    const applicant = accounts[2];
    const delegateKey = accounts[3];

    const dao = this.dao;
    const onboarding = this.adapters.kycOnboarding;
    const daoRegistryAdapter = this.adapters.daoRegistryAdapter;

    const myAccountInitialBalance = await getBalance(applicant);
    // remaining amount to test sending back to proposer
    const ethAmount = unitPrice.mul(toBN(3)).add(remaining);

    const signerUtil = SigUtilSigner(signer.privKey);

    const couponData = {
      type: "coupon-kyc",
      kycedMember: applicant,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      onboarding.address,
      chainId
    );
    let solHash = await onboarding.hashCouponMessage(dao.address, couponData);
    expect(jsHash).equal(solHash);

    const signature = signerUtil(
      couponData,
      dao.address,
      onboarding.address,
      chainId
    );

    await onboarding.onboardEth(dao.address, applicant, signature, {
      from: applicant,
      value: ethAmount,
      gasPrice: toBN("0"),
    });

    // test return of remaining amount in excess of multiple of unitsPerChunk
    const myAccountBalance = await getBalance(applicant);
    // daoOwner did not receive remaining amount in excess of multiple of unitsPerChunk
    expect(
      toBN(myAccountInitialBalance).sub(ethAmount).add(remaining).toString()
    ).equal(myAccountBalance.toString());

    await daoRegistryAdapter.updateDelegateKey(dao.address, delegateKey, {
      from: applicant,
      gasPrice: toBN("0"),
    });

    await expect(
      onboarding.onboardEth(dao.address, applicant, signature, {
        from: delegateKey,
        value: ethAmount,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("already member");
  });

  it("should not be possible to have more than the maximum number of units", async () => {
    const applicant = accounts[2];
    const dao = this.dao;
    const onboarding = this.adapters.kycOnboarding;

    const signerUtil = SigUtilSigner(signer.privKey);

    const couponData = {
      type: "coupon-kyc",
      kycedMember: applicant,
    };

    const signature = signerUtil(
      couponData,
      dao.address,
      onboarding.address,
      chainId
    );

    await expect(
      onboarding.onboardEth(dao.address, applicant, signature, {
        from: daoOwner,
        value: unitPrice.mul(toBN(100)).add(remaining),
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("too much funds");
  });

  it("should not be possible to rejoin the DAO using a coupon that was already redeemed", async () => {
    const applicant = accounts[2];

    const dao = this.dao;
    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.kycOnboarding;
    const ragequit = this.adapters.ragequit;

    // remaining amount to test sending back to proposer
    const ethAmount = unitPrice.mul(toBN(3)).add(remaining);

    const signerUtil = SigUtilSigner(signer.privKey);

    const couponData = {
      type: "coupon-kyc",
      kycedMember: applicant,
    };

    let jsHash = getMessageERC712Hash(
      couponData,
      dao.address,
      onboarding.address,
      chainId
    );
    let solHash = await onboarding.hashCouponMessage(dao.address, couponData);
    expect(jsHash).equal(solHash);

    const signature = signerUtil(
      couponData,
      dao.address,
      onboarding.address,
      chainId
    );

    await onboarding.onboardEth(dao.address, applicant, signature, {
      from: applicant,
      value: ethAmount,
      gasPrice: toBN("0"),
    });

    // test active member status
    expect(await isMember(bank, applicant)).equal(true);

    // Ragequit - Burn all the member units and exit the DAO
    const memberUnits = await bank.balanceOf(applicant, UNITS);
    await ragequit.ragequit(dao.address, memberUnits, toBN(0), [ETH_TOKEN], {
      from: applicant,
      gasPrice: toBN("0"),
    });

    // test active member status
    expect(await isMember(bank, applicant)).equal(false);

    // Attempt to rejoin the DAO using the same KYC coupon
    await expect(
      onboarding.onboardEth(dao.address, applicant, signature, {
        from: applicant,
        value: ethAmount,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("already redeemed");
  });
});
