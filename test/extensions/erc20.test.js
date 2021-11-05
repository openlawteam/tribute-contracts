// Whole-script strict mode syntax
"use strict";

const { sha3 } = require("web3-utils");
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
  accounts,
  expectRevert,
  expect,
} = require("../../utils/oz-util");

const {
  isMember,
  onboardingNewMember,
  submitConfigProposal,
} = require("../../utils/test-util");

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Extension - ERC20", () => {
  const daoOwner = accounts[0];

  before("deploy dao", async () => {
    const { dao, adapters, extensions, testContracts } = await deployDefaultDao(
      { owner: daoOwner }
    );
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.testContracts = testContracts;
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
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

    await erc20Ext.transfer(applicantB, numberOfUnits.mul(toBN("1")), {
      from: applicantA,
    });

    applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("2")).toString()
    );

    applicantBUnits = await erc20Ext.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("4")).toString()
    );
  });

  it("should be possible to approve and transferFrom units from a member to another member when the transfer type is equals 0 (member transfer only)", async () => {
    const dao = this.dao;
    //onboarded member A & B
    const applicantA = accounts[2];
    const applicantB = accounts[3];
    const configuration = this.adapters.configuration;
    //external address - not a member
    const externalAddressA = accounts[4];
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
    //check A's balance
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
    //check B's balance
    let applicantBUnits = await erc20Ext.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantB)).equal(true);

    //approve and check spender's allownance
    await erc20Ext.approve(externalAddressA, numberOfUnits.mul(toBN("1")), {
      from: applicantA,
    });
    let spenderAllowance = await erc20Ext.allowance(
      applicantA,
      externalAddressA
    );
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );

    //transferFrom Applicant A(member) to ApplicantB(member) by the spender(non-member externalAddressA)
    await erc20Ext.transferFrom(
      applicantA,
      applicantB,
      numberOfUnits.mul(toBN("1")),
      { from: externalAddressA }
    );

    //check new balances of A & B
    applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("2")).toString()
    );
    applicantBUnits = await erc20Ext.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("4")).toString()
    );

    //check allowance of spender
    spenderAllowance = await erc20Ext.allowance(applicantA, externalAddressA);
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );
  });

  it("should not be possible to transfer units from a member to an external account when the transfer type is equals 0 (member transfer only)", async () => {
    // transferFrom to external
    // transfer to external
    const dao = this.dao;
    //onboarded member A & B
    const applicantA = accounts[2];
    const applicantB = accounts[3];
    //external address - not a member
    const externalAddressA = accounts[4];
    const externalAddressB = accounts[5];
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
      applicantA,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check A's balance
    let applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    //applicantA should be a member
    expect(await isMember(bank, applicantA)).equal(true);

    //externalAddress A should not be a member
    expect(await isMember(bank, externalAddressA)).equal(false);

    //check externalAddressA's balance
    let externalAddressAUnits = await erc20Ext.balanceOf(externalAddressA);
    expect(externalAddressAUnits.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );
    //attempt transfer to non-member External address A - should revert
    await expectRevert(
      erc20Ext.transfer(externalAddressA, numberOfUnits.mul(toBN("1")), {
        from: applicantA,
      }),
      "transfer not allowed"
    );

    //check balances of externalAddressA
    externalAddressAUnits = await erc20Ext.balanceOf(externalAddressA);
    expect(externalAddressAUnits.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );
  });

  it("should not be possible to approve a transferFrom units from a member to an external account when the transfer type is equals 0 (member transfer only)", async () => {
    // transfer to external
    const dao = this.dao;
    //onboarded member A & B
    const applicantA = accounts[2];
    const applicantB = accounts[3];
    //external address - not a member
    const externalAddressA = accounts[4];
    const externalAddressB = accounts[5];
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
      applicantA,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check A's balance
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
    //check B's balance
    let applicantBUnits = await erc20Ext.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantB)).equal(true);

    //approve and check spender's allownance
    await erc20Ext.approve(externalAddressA, numberOfUnits.mul(toBN("1")), {
      from: applicantA,
    });
    let spenderAllowance = await erc20Ext.allowance(
      applicantA,
      externalAddressA
    );
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );
    //externallAddressB should not be a member
    expect(await isMember(bank, externalAddressB)).equal(false);

    //transferFrom Applicant A(member) to externalAddressB(non-member) by the spender(non-member externalAddressA) should fail
    await expectRevert(
      erc20Ext.transferFrom(
        applicantA,
        externalAddressB,
        numberOfUnits.mul(toBN("1")),
        { from: externalAddressA }
      ),
      "transfer not allowed"
    );

    //check new balances of applicantA & externalAddressB
    applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    let externalAddressBUnits = await erc20Ext.balanceOf(externalAddressB);
    expect(externalAddressBUnits.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );

    //check allowance of spender - should remain the same, since it could not be spent
    spenderAllowance = await erc20Ext.allowance(applicantA, externalAddressA);
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );
  });

  it("should be possible to pause all transfers when the transfer type is equals 2 (paused all transfers)", async () => {
    const dao = this.dao;
    //onboarded members A & B
    const applicantA = accounts[2];
    const applicantB = accounts[3];

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
      applicantA,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check A's balance
    let applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantA)).equal(true);
    //onboard B
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
    //check B's balance
    let applicantBUnits = await erc20Ext.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantB)).equal(true);

    //attempt transfer
    await expectRevert(
      erc20Ext.transfer(applicantB, numberOfUnits.mul(toBN("1")), {
        from: applicantA,
      }),
      "transfer not allowed"
    );

    //applicantA should still have the same number of Units
    applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    //applicantB should still have the same number of Units
    applicantBUnits = await erc20Ext.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
  });

  it("should be possible to transfer units from a member to an external account when the transfer type is equals 1 (external transfer)", async () => {
    // transfer to external
    const dao = this.dao;
    //members A
    const applicantA = accounts[2];
    //external address - not a member
    const externalAddressA = accounts[4];

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
      applicantA,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //member A units
    let applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantA)).equal(true);

    //externalAddressA
    expect(await isMember(bank, externalAddressA)).equal(false);

    let externalAddressAUnits = await erc20Ext.balanceOf(externalAddressA);
    expect(externalAddressAUnits.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );

    //transfer from memberA to externalAddressA
    await erc20Ext.transfer(externalAddressA, numberOfUnits.mul(toBN("1")), {
      from: applicantA,
    });
    //externalAddressA should have +1 unit
    externalAddressAUnits = await erc20Ext.balanceOf(externalAddressA);
    expect(externalAddressAUnits.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );
    //applicantA should have -1 unit
    applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("2")).toString()
    );
  });

  it("should be possible to approve and transferFrom units from a member to an external account when the transfer type is equals 1 (external transfer)", async () => {
    // transfer to external
    const dao = this.dao;
    //members A and B
    const applicantA = accounts[2];
    const applicantB = accounts[3];
    //external address - not a member
    const externalAddressA = accounts[4];
    const externalAddressB = accounts[5];

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
      applicantA,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //member A units
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
    //check B's balance
    let applicantBUnits = await erc20Ext.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(await isMember(bank, applicantB)).equal(true);

    //approve and check spender's allownance
    await erc20Ext.approve(externalAddressA, numberOfUnits.mul(toBN("1")), {
      from: applicantA,
    });
    let spenderAllowance = await erc20Ext.allowance(
      applicantA,
      externalAddressA
    );
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );
    //externallAddressB should not be a member
    expect(await isMember(bank, externalAddressB)).equal(false);
    //transferFrom the applicantA the amount spenderAllowance to externalAddressA
    await erc20Ext.transferFrom(
      applicantA,
      externalAddressB,
      numberOfUnits.mul(toBN("1")),
      { from: externalAddressA }
    );

    //check new balances of applicantA & externalAddressB
    applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(
      numberOfUnits.mul(toBN("2")).toString()
    );
    let externalAddressBUnits = await erc20Ext.balanceOf(externalAddressB);
    expect(externalAddressBUnits.toString()).equal(
      numberOfUnits.mul(toBN("1")).toString()
    );

    //check allowance of spender -
    spenderAllowance = await erc20Ext.allowance(applicantA, externalAddressA);
    expect(spenderAllowance.toString()).equal(
      numberOfUnits.mul(toBN("0")).toString()
    );
    //externalAddressB is now a member after receiving unit
    expect(await isMember(bank, externalAddressB)).equal(true);
  });
});
