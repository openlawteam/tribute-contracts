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
  remaining, ETH_TOKEN, numberOfUnits, GUILD } = require("../../utils/ContractUtil.js");

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

describe("Extension - ERC20 UnitToken", () => {
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

  it("should be possible to create a dao with a unit-token extension pre-configured", async () => {
    const unitTokenExt = this.extensions.unitToken;
    expect(unitTokenExt).to.not.be.null;
  });

  it("should be possible to transfer units from one member to another", async () => {
    const dao = this.dao;
    const applicantA = accounts[2];
    const applicantB = accounts[3];
    
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const unitTokenExt = this.extensions.unitToken; 

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

    let applicantAUnits = await unitTokenExt.balanceOf(applicantA);
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

    let applicantBUnits = await unitTokenExt.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(numberOfUnits.mul(toBN("3")).toString());
    expect(await isMember(bank, applicantB)).equal(true);
  
    await unitTokenExt.transfer(applicantB, numberOfUnits.mul(toBN("1")), {from: applicantA});

    applicantAUnits = await unitTokenExt.balanceOf(applicantA);
    expect(applicantAUnits.toString()).equal(numberOfUnits.mul(toBN("2")).toString());

    applicantBUnits = await unitTokenExt.balanceOf(applicantB);
    expect(applicantBUnits.toString()).equal(numberOfUnits.mul(toBN("4")).toString());

    // let amount = await unitTokenExt.allowance(applicant, spender);
    // console.log(amount,"amount approved");
    // expect(amount).to.be.equal(toBN("1"));
    // unitTokenAdapter.transferFrom(dao.address, recipient, toBN("10"), {from: sender})
    //unitTokenExt.transfer(recipient, toBN("10"), {from: sender});
    // TODO check if the sender had the balance decresead
    //const senderTokenBalance = await unitTokenExt.balanceOf(sender); 
    // TODO check if the recipient had the balance increased
  });

  it("should be possible to pause the transfer", async () => {
    // transfer
  });

  it("should be possible to transfer units from a member to an external account", async () => {
    // transfer
  });

  // transferFrom
});
