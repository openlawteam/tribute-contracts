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
const { toBN, unitPrice, UNITS, 
   ETH_TOKEN, numberOfUnits  } = require("../../utils/ContractUtil.js");

const {
  takeChainSnapshot,
  revertChainSnapshot,
  deployDefaultDao,
  proposalIdGenerator,
  advanceTime,
  accounts,
  expectRevert,
  expect,
  web3
} = require("../../utils/OZTestUtil.js");

const { checkBalance, isMember, onboardingNewMember } = require("../../utils/TestUtils.js");

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Extension - ERC20", () => {
  const daoOwner = accounts[0];

  before("deploy dao", async () => {
    const {
      dao,
      adapters,
      extensions,
      testContracts,
    } = await deployDefaultDao({ owner: daoOwner });
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

  it("should be possible to transfer units from one member to another", async () => {
    const dao = this.dao;
    const applicantA = accounts[2];
    const applicantB = accounts[3];
    
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const erc20Ext = this.extensions.erc20Ext; 

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
    expect(applicantAUnits.toString()).equal(numberOfUnits.mul(toBN("3")).toString());
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
    expect(applicantBUnits.toString()).equal(numberOfUnits.mul(toBN("3")).toString());
    expect(await isMember(bank, applicantB)).equal(true);
  
    await erc20Ext.transfer(applicantB, numberOfUnits.mul(toBN("1")), {from: applicantA});

    applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(numberOfUnits.mul(toBN("2")).toString());

    applicantBUnits = await erc20Ext.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(numberOfUnits.mul(toBN("4")).toString());

  });

  it("should be possible to approve and transferFrom units from a member to another member", async () => {
    const dao = this.dao;
    //onboarded member A & B
    const applicantA = accounts[2]; 
    const applicantB = accounts[3];
    //external address - not a member
    const externalAddressA = accounts[4]; 
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const erc20Ext = this.extensions.erc20Ext; 

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
    expect(applicantAUnits.toString()).equal(numberOfUnits.mul(toBN("3")).toString());
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
    expect(applicantBUnits.toString()).equal(numberOfUnits.mul(toBN("3")).toString());
    expect(await isMember(bank, applicantB)).equal(true);

    //approve and check spender's allownance
    await erc20Ext.approve(externalAddressA, numberOfUnits.mul(toBN("1")), {from: applicantA});
    let spenderAllowance = await erc20Ext.allowance(applicantA, externalAddressA);
    expect(spenderAllowance.toString()).equal(numberOfUnits.mul(toBN("1")).toString());

    //transferFrom Applicant A(member) to ApplicantB(member) by the spender(non-member externalAddressA)
    await erc20Ext.transferFrom(applicantA, applicantB, numberOfUnits.mul(toBN("1")), {from: externalAddressA});
    
    //check new balances of A & B
    applicantAUnits = await erc20Ext.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(numberOfUnits.mul(toBN("2")).toString());
    applicantBUnits = await erc20Ext.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(numberOfUnits.mul(toBN("4")).toString());
    
    //check allowance of spender
    spenderAllowance = await erc20Ext.allowance(applicantA, externalAddressA);
    expect(spenderAllowance.toString()).equal(numberOfUnits.mul(toBN("0")).toString());

  });

  it("should be possible to pause the transfer", async () => {
    // pause transfer
  });

  it("should be possible to transfer units from a member to an external account", async () => {
    // transfer to external 
  });

});
