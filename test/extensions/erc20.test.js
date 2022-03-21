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
  toBN,
  sha3,
  unitPrice,
  UNITS,
  ZERO_ADDRESS,
  numberOfUnits,
} = require("../../utils/contract-util");

const {
  takeChainSnapshot,
  revertChainSnapshot,
  deployDefaultDao,
  proposalIdGenerator,
  getAccounts,
  getSigners,
  txSigner,
  web3,
} = require("../../utils/hardhat-test-util");

const {
  isMember,
  onboardingNewMember,
  submitConfigProposal,
  submitNewMemberProposal,
} = require("../../utils/test-util");

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Extension - ERC20", () => {
  let accounts, daoOwner, signers;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    signers = await getSigners();
    daoOwner = accounts[0];

    const { dao, adapters, extensions, factories, testContracts } =
      await deployDefaultDao({ owner: daoOwner });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.testContracts = testContracts;
    this.factories = factories;
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  describe("Factory", async () => {
    it("should be possible to create an extension using the factory", async () => {
      const { logs } = await this.factories.erc20ExtFactory.create(
        this.dao.address,
        "Token A",
        this.testContracts.testToken1.address,
        "Test",
        0
      );
      const log = logs[0];
      expect(log.event).to.be.equal("ERC20TokenExtensionCreated");
      expect(log.args[0]).to.be.equal(this.dao.address);
      expect(log.args[1]).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should be possible to get an extension address by dao", async () => {
      await this.factories.erc20ExtFactory.create(
        this.dao.address,
        "Token A",
        this.testContracts.testToken1.address,
        "Test",
        0
      );
      const extAddress =
        await this.factories.erc20ExtFactory.getExtensionAddress(
          this.dao.address
        );
      expect(extAddress).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should return zero address if there is no extension address by dao", async () => {
      const daoAddress = accounts[2];
      const extAddress =
        await this.factories.erc20ExtFactory.getExtensionAddress(daoAddress);
      expect(extAddress).to.be.equal(ZERO_ADDRESS);
    });

    it("should not be possible to create an extension using a zero address dao", async () => {
      await expect(
        this.factories.erc20ExtFactory.create(
          ZERO_ADDRESS,
          "Token A",
          this.testContracts.testToken1.address,
          "Test",
          0
        )
      ).to.be.reverted;
    });
  });

  it("should be possible to create a dao with a erc20 extension pre-configured", async () => {
    const erc20Ext = this.extensions.erc20Ext;
    expect(erc20Ext).to.not.be.null;
  });

  it("should be possible to transfer units from one member to another when the transfer type is equals 0 (member transfer only)", async () => {
    const dao = this.dao;
    const applicantA = accounts[2];
    const applicantB = accounts[3];
    const configuration = this.adapters.configuration;
    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const erc20Ext = this.extensions.erc20Ext;

    //configure
    await submitConfigProposal(
      dao,
      getProposalCounter(),
      daoOwner,
      configuration,
      voting,
      [
        {
          key: sha3("erc20.transfer.type"),
          numericValue: 0,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ]
    );
    let transferType = await dao.getConfiguration(sha3("erc20.transfer.type"));
    expect(transferType.toString()).equal("0");

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantA,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );

    let applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantA)).equal(true);

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantB,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );

    let applicantBUnits = await erc20Ext.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantB)).equal(true);

    await txSigner(signers[2], erc20Ext).transfer(
      applicantB,
      numberOfUnits.mul(toBN("1"))
    );

    applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("2")).toString()
    );

    applicantBUnits = await erc20Ext.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("4")).toString()
    );
  });

  it("should not be possible to transfer units from an active member to a non active member using the transfer strategy with vesting", async () => {
    const dao = this.dao;
    const applicantA = accounts[2];
    const applicantB = accounts[3];
    const bank = this.extensions.bankExt;
    const erc20Ext = this.extensions.erc20Ext;
    const configuration = this.adapters.configuration;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const erc20TransferStrategy = this.adapters.erc20TransferStrategy;

    // configure transfer strategy (members only)
    await submitConfigProposal(
      dao,
      getProposalCounter(),
      daoOwner,
      configuration,
      voting,
      [
        {
          key: sha3("erc20.transfer.type"),
          numericValue: 0,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ]
    );

    let transferType = await dao.getConfiguration(sha3("erc20.transfer.type"));
    expect(transferType.toString()).equal("0");

    // Set the simple transfer strategy contract
    await submitConfigProposal(
      dao,
      getProposalCounter(),
      daoOwner,
      configuration,
      voting,
      [
        {
          key: sha3("erc20-transfer-strategy"),
          numericValue: 0,
          addressValue: erc20TransferStrategy.address,
          configType: 1, //Address
        },
      ]
    );

    let strategyContract = await dao.getAddressConfiguration(
      sha3("erc20-transfer-strategy")
    );
    expect(strategyContract).equal(erc20TransferStrategy.address);

    // Submit the proposal to register the new member, but do not process the proposal
    await submitNewMemberProposal(
      getProposalCounter(),
      daoOwner,
      onboarding,
      dao,
      applicantA,
      unitPrice,
      UNITS,
      toBN("3")
    );
    // is registered in the DAO
    expect(await dao.isMember(applicantA)).equal(true);
    // but it is not an active member because UNITS == 0
    expect(await isMember(bank, applicantA)).equal(false);

    // Onboard a second member and process the proposal to give the UNITs to the member
    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantB,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );

    expect(await isMember(bank, applicantB)).equal(true);

    // Member B attempts to transfer to Member A which is not active yet
    const memberB = signers[3];
    await expect(
      txSigner(memberB, erc20Ext).transfer(
        applicantA,
        numberOfUnits.mul(toBN("1"))
      )
    ).to.be.revertedWith("transfer not allowed");
  });

  it("should be possible to approve and transferFrom units from a member to another member when the transfer type is equals 0 (member transfer only)", async () => {
    const dao = this.dao;
    //onboard member A & B
    const applicantA = signers[2];
    const applicantB = signers[3];
    const configuration = this.adapters.configuration;
    //external address - not a member
    const externalAddressA = signers[4];
    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const erc20Ext = this.extensions.erc20Ext;

    //configure
    await submitConfigProposal(
      dao,
      getProposalCounter(),
      daoOwner,
      configuration,
      voting,
      [
        {
          key: sha3("erc20.transfer.type"),
          numericValue: 0,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ]
    );
    let transferType = await dao.getConfiguration(sha3("erc20.transfer.type"));
    expect(transferType.toString()).equal("0");

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantA.address,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check A's balance
    let applicantAUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantA.address)).equal(true);

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantB.address,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check B's balance
    let applicantBUnits = await erc20Ext.balanceOf(applicantB.address);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantB.address)).equal(true);

    //approve and check spender's allownance
    await txSigner(applicantA, erc20Ext).approve(
      externalAddressA.address,
      numberOfUnits.mul(toBN("1"))
    );
    let spenderAllowance = await erc20Ext.allowance(
      applicantA.address,
      externalAddressA.address
    );
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );

    //transferFrom Applicant A(member) to ApplicantB(member) by the spender(non-member externalAddressA)
    await txSigner(externalAddressA, erc20Ext).transferFrom(
      applicantA.address,
      applicantB.address,
      numberOfUnits.mul(toBN("1"))
    );

    //check new balances of A & B
    applicantAUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("2")).toString()
    );
    applicantBUnits = await erc20Ext.balanceOf(applicantB.address);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("4")).toString()
    );

    //check allowance of spender
    spenderAllowance = await erc20Ext.allowance(
      applicantA.address,
      externalAddressA.address
    );
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );
  });

  it("should not be possible to transfer units from a member to an external account when the transfer type is equals 0 (member transfer only)", async () => {
    // transferFrom to external
    // transfer to external
    const dao = this.dao;
    //onboard member A & B
    const applicantA = signers[2];
    //external address - not a member
    const externalAddressA = signers[4];
    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.onboarding;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;
    const erc20Ext = this.extensions.erc20Ext;

    await submitConfigProposal(
      dao,
      getProposalCounter(),
      daoOwner,
      configuration,
      voting,
      [
        {
          key: sha3("erc20.transfer.type"),
          numericValue: 0,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ]
    );
    let transferType = await dao.getConfiguration(sha3("erc20.transfer.type"));
    expect(transferType.toString()).equal("0");

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantA.address,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check A's balance
    let applicantAUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    //applicantA should be a member
    expect(await isMember(bank, applicantA.address)).equal(true);

    //externalAddress A should not be a member
    expect(await isMember(bank, externalAddressA.address)).equal(false);

    //check externalAddressA's balance
    let externalAddressAUnits = await erc20Ext.balanceOf(
      externalAddressA.address
    );
    expect(externalAddressAUnits.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );
    //attempt transfer to non-member External address A - should revert
    await expect(
      txSigner(applicantA, erc20Ext).transfer(
        externalAddressA.address,
        numberOfUnits.mul(toBN("1"))
      )
    ).to.be.revertedWith("transfer not allowed");

    //check balances of externalAddressA
    externalAddressAUnits = await erc20Ext.balanceOf(externalAddressA.address);
    expect(externalAddressAUnits.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );
  });

  it("should not be possible to approve a transferFrom units from a member to an external account when the transfer type is equals 0 (member transfer only)", async () => {
    // transfer to external
    const dao = this.dao;
    //onboard member A & B
    const applicantA = signers[2];
    const applicantB = signers[3];
    //external address - not a member
    const externalAddressA = signers[4];
    const externalAddressB = signers[5];
    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.onboarding;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;
    const erc20Ext = this.extensions.erc20Ext;

    await submitConfigProposal(
      dao,
      getProposalCounter(),
      daoOwner,
      configuration,
      voting,
      [
        {
          key: sha3("erc20.transfer.type"),
          numericValue: 0,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ]
    );
    let transferType = await dao.getConfiguration(sha3("erc20.transfer.type"));
    expect(transferType.toString()).equal("0");

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantA.address,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check A's balance
    let applicantAUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantA.address)).equal(true);

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantB.address,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check B's balance
    let applicantBUnits = await erc20Ext.balanceOf(applicantB.address);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantB.address)).equal(true);

    //approve and check spender's allowance
    await txSigner(applicantA, erc20Ext).approve(
      externalAddressA.address,
      numberOfUnits.mul(toBN("1"))
    );
    let spenderAllowance = await erc20Ext.allowance(
      applicantA.address,
      externalAddressA.address
    );
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );
    //externalAddressB should not be a member
    expect(await isMember(bank, externalAddressB.address)).equal(false);

    //transferFrom Applicant A(member) to externalAddressB(non-member) by the spender(non-member externalAddressA) should fail
    await expect(
      txSigner(externalAddressA, erc20Ext).transferFrom(
        applicantA.address,
        externalAddressB.address,
        numberOfUnits.mul(toBN("1"))
      )
    ).to.be.revertedWith("transfer not allowed");

    //check new balances of applicantA & externalAddressB
    applicantAUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    let externalAddressBUnits = await erc20Ext.balanceOf(
      externalAddressB.address
    );
    expect(externalAddressBUnits.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );

    //check allowance of spender - should remain the same, since it could not be spent
    spenderAllowance = await erc20Ext.allowance(
      applicantA.address,
      externalAddressA.address
    );
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );
  });

  it("should be possible to pause all transfers when the transfer type is equals 2 (paused all transfers)", async () => {
    const dao = this.dao;
    //onboard members A & B
    const applicantA = signers[2];
    const applicantB = signers[3];

    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.onboarding;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;
    const erc20Ext = this.extensions.erc20Ext;
    //configure to pause all transfers
    await submitConfigProposal(
      dao,
      getProposalCounter(),
      daoOwner,
      configuration,
      voting,
      [
        {
          key: sha3("erc20.transfer.type"),
          numericValue: 2,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ]
    );
    let transferType = await dao.getConfiguration(sha3("erc20.transfer.type"));
    expect(transferType.toString()).equal("2");
    //onboard A
    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantA.address,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check A's balance
    let applicantAUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantA.address)).equal(true);
    //onboard B
    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantB.address,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check B's balance
    let applicantBUnits = await erc20Ext.balanceOf(applicantB.address);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantB.address)).equal(true);

    //attempt transfer
    await expect(
      txSigner(applicantA, erc20Ext).transfer(
        applicantB.address,
        numberOfUnits.mul(toBN("1"))
      )
    ).to.be.revertedWith("transfer not allowed");

    //applicantA should still have the same number of Units
    applicantAUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    //applicantB should still have the same number of Units
    applicantBUnits = await erc20Ext.balanceOf(applicantB.address);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
  });

  it("should be possible to transfer units from a member to an external account when the transfer type is equals 1 (external transfer)", async () => {
    // transfer to external
    const dao = this.dao;
    //members A
    const applicantA = signers[2];
    //external address - not a member
    const externalAddressA = signers[4];

    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.onboarding;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;
    const erc20Ext = this.extensions.erc20Ext;
    //configure to pause all transfers
    await submitConfigProposal(
      dao,
      getProposalCounter(),
      daoOwner,
      configuration,
      voting,
      [
        {
          key: sha3("erc20.transfer.type"),
          numericValue: 1,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ]
    );
    let transferType = await dao.getConfiguration(sha3("erc20.transfer.type"));
    expect(transferType.toString()).equal("1");
    //onboard memberA
    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantA.address,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //member A units
    let applicantAUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantA.address)).equal(true);

    //externalAddressA
    expect(await isMember(bank, externalAddressA.address)).equal(false);

    let externalAddressAUnits = await erc20Ext.balanceOf(
      externalAddressA.address
    );
    expect(externalAddressAUnits.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );

    //transfer from memberA to externalAddressA
    await txSigner(applicantA, erc20Ext).transfer(
      externalAddressA.address,
      numberOfUnits.mul(toBN("1"))
    );
    //externalAddressA should have +1 unit
    externalAddressAUnits = await erc20Ext.balanceOf(externalAddressA.address);
    expect(externalAddressAUnits.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );
    //applicantA should have -1 unit
    applicantAUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("2")).toString()
    );
  });

  it("should be possible to approve and transferFrom units from a member to an external account when the transfer type is equals 1 (external transfer)", async () => {
    // transfer to external
    const dao = this.dao;
    //members A and B
    const applicantA = signers[2];
    const applicantB = signers[3];
    //external address - not a member
    const externalAddressA = signers[4];
    const externalAddressB = signers[5];

    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.onboarding;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;
    const erc20Ext = this.extensions.erc20Ext;
    //configure to pause all transfers
    await submitConfigProposal(
      dao,
      getProposalCounter(),
      daoOwner,
      configuration,
      voting,
      [
        {
          key: sha3("erc20.transfer.type"),
          numericValue: 1,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ]
    );
    let transferType = await dao.getConfiguration(sha3("erc20.transfer.type"));
    expect(transferType.toString()).equal("1");
    //onboard memberA
    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantA.address,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //member A units
    let applicantAUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantA.address)).equal(true);

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantB.address,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check B's balance
    let applicantBUnits = await erc20Ext.balanceOf(applicantB.address);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantB.address)).equal(true);

    //approve and check spender's allowance
    await txSigner(applicantA, erc20Ext).approve(
      externalAddressA.address,
      numberOfUnits.mul(toBN("1"))
    );
    let spenderAllowance = await erc20Ext.allowance(
      applicantA.address,
      externalAddressA.address
    );
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );
    //externalAddressB should not be a member
    expect(await isMember(bank, externalAddressB.address)).equal(false);
    //transferFrom the applicantA the amount spenderAllowance to externalAddressA
    await txSigner(externalAddressA, erc20Ext).transferFrom(
      applicantA.address,
      externalAddressB.address,
      numberOfUnits.mul(toBN("1"))
    );

    //check new balances of applicantA & externalAddressB
    applicantAUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("2")).toString()
    );
    let externalAddressBUnits = await erc20Ext.balanceOf(
      externalAddressB.address
    );
    expect(externalAddressBUnits.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );

    //check allowance of spender -
    spenderAllowance = await erc20Ext.allowance(
      applicantA.address,
      externalAddressA.address
    );
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );
    //externalAddressB is now a member after receiving unit
    expect(await isMember(bank, externalAddressB.address)).equal(true);
  });

  it("should be possible to read the historical balance of a token holder", async () => {
    const dao = this.dao;
    const applicantA = signers[2];
    const applicantB = signers[3];
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const erc20Ext = this.extensions.erc20Ext;

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantA.address,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );

    // save the block number to check the historical balance later on
    const blockNumber = await web3.eth.getBlockNumber();

    // check A's current balance
    const currentUnits = await erc20Ext.balanceOf(applicantA.address);
    expect(currentUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );

    // Onboard another member to create more blocks
    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      applicantB.address, //applicant B
      daoOwner,
      unitPrice,
      UNITS,
      toBN("5")
    );

    // Check the A's historical balance using the saved block number
    const historicalUnits = await erc20Ext.getPriorAmount(
      applicantA.address,
      blockNumber
    );
    expect(historicalUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
  });
});
