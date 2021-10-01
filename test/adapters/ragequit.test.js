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
  toWei,
  fromUtf8,
  fromAscii,
  unitPrice,
  UNITS,
  GUILD,
  ETH_TOKEN,
  LOOT,
} = require("../../utils/ContractUtil.js");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  accounts,
  expectRevert,
  expect,
  OLToken,
  web3,
} = require("../../utils/OZTestUtil.js");

const { onboardingNewMember } = require("../../utils/TestUtils.js");

const proposalCounter = proposalIdGenerator().generator;
const owner = accounts[1];

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Ragequit", () => {
  before("deploy dao", async () => {
    const { dao, adapters, extensions } = await deployDefaultDao({ owner });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(this.snapshotId);
    this.snapshotId = await takeChainSnapshot();
  });

  it("should return an error if a non DAO member attempts to ragequit", async () => {
    const newMember = accounts[2];
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();
    await onboardingNewMember(
      proposalId,
      this.dao,
      onboarding,
      voting,
      newMember,
      owner,
      unitPrice,
      UNITS
    );

    //Check Guild Bank Balance
    const guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("1200000000000000000");

    //Check Member Units
    const units = await bank.balanceOf(newMember, UNITS);
    expect(units.toString()).equal("10000000000000000");

    //Ragequit
    const nonMember = accounts[4];
    await expectRevert(
      this.adapters.ragequit.ragequit(
        this.dao.address,
        toBN(units),
        toBN(0),
        [ETH_TOKEN],
        {
          from: nonMember,
          gasPrice: toBN("0"),
        }
      ),
      "insufficient units"
    );
  });

  it("should not be possible for a member to ragequit when the member does not have enough units", async () => {
    const newMember = accounts[2];
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();
    await onboardingNewMember(
      proposalId,
      this.dao,
      onboarding,
      voting,
      newMember,
      owner,
      unitPrice,
      UNITS
    );

    //Check Guild Bank Balance
    const guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("1200000000000000000");

    //Check Member Units
    const units = await bank.balanceOf(newMember, UNITS);
    expect(units.toString()).equal("10000000000000000");

    //Ragequit
    await expectRevert(
      this.adapters.ragequit.ragequit(
        this.dao.address,
        toBN("100000000000000001"),
        toBN(0),
        [ETH_TOKEN],
        {
          from: newMember,
          gasPrice: toBN("0"),
        }
      ),
      "insufficient units"
    );
  });

  it("should be possible for a member to ragequit when the member has not voted on any proposals yet", async () => {
    const newMember = accounts[2];
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();
    await onboardingNewMember(
      proposalId,
      this.dao,
      onboarding,
      voting,
      newMember,
      owner,
      unitPrice,
      UNITS
    );

    //Check Guild Bank Balance
    const guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("1200000000000000000");

    //Check New Member Units
    const units = await bank.balanceOf(newMember, UNITS);
    expect(units.toString()).equal("10000000000000000");

    //Ragequit - Burn all the new member units
    await this.adapters.ragequit.ragequit(
      this.dao.address,
      toBN(units),
      toBN(0),
      [ETH_TOKEN],
      {
        from: newMember,
        gasPrice: toBN("0"),
      }
    );

    //Check Guild Bank Balance
    const newGuildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(newGuildBalance.toString()).equal("120"); //must be close to 0
  });

  it("should be possible for a member to ragequit if the member voted YES on a proposal that is not processed", async () => {
    const newMember = accounts[2];
    const applicant = accounts[3];
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const financing = this.adapters.financing;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();
    await onboardingNewMember(
      proposalId,
      this.dao,
      onboarding,
      voting,
      newMember,
      owner,
      unitPrice,
      UNITS
    );

    //Check Guild Bank Balance
    const guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("1200000000000000000".toString());

    //Check New Member Units
    const units = await bank.balanceOf(newMember, UNITS);
    expect(units.toString()).equal("10000000000000000");
    const financingProposalId = getProposalCounter();

    //Create Financing Request
    const requestedAmount = toBN(50000);
    await financing.submitProposal(
      this.dao.address,
      financingProposalId,
      applicant,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8(""),
      { from: owner }
    );

    //New Member votes YES on the Financing proposal
    let vote = 1; //YES
    await voting.submitVote(this.dao.address, financingProposalId, vote, {
      from: newMember,
      gasPrice: toBN("0"),
    });

    //Ragequit - New member ragequits after YES vote
    await this.adapters.ragequit.ragequit(
      this.dao.address,
      toBN(units),
      toBN(0),
      [ETH_TOKEN],
      {
        from: newMember,
        gasPrice: toBN("0"),
      }
    );

    //Check Guild Bank Balance
    let newGuildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(newGuildBalance.toString()).equal("120"); //must be close to 0
  });

  it("should be possible for a member to ragequit if the member voted NO on a proposal that is not processed", async () => {
    const newMember = accounts[2];
    const applicant = accounts[3];
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const financing = this.adapters.financing;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();
    await onboardingNewMember(
      proposalId,
      this.dao,
      onboarding,
      voting,
      newMember,
      owner,
      unitPrice,
      UNITS
    );

    //Check Guild Bank Balance
    const guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("1200000000000000000");

    //Check New Member Units
    const units = await bank.balanceOf(newMember, UNITS);
    expect(units.toString()).equal("10000000000000000");

    const financingProposalId = getProposalCounter();
    //Create Financing Request
    const requestedAmount = toBN(50000);
    await financing.submitProposal(
      this.dao.address,
      financingProposalId,
      applicant,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8(""),
      { from: owner }
    );

    //New Member votes NO on the Financing proposal
    const vote = 2; //NO
    await voting.submitVote(this.dao.address, financingProposalId, vote, {
      from: newMember,
      gasPrice: toBN("0"),
    });

    //Ragequit - New member ragequits after YES vote
    await this.adapters.ragequit.ragequit(
      this.dao.address,
      toBN(units),
      toBN(0),
      [ETH_TOKEN],
      {
        from: newMember,
        gasPrice: toBN("0"),
      }
    );

    //Check Guild Bank Balance
    const newGuildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(toBN(newGuildBalance).toString()).equal("120"); //must be close to 0
  });

  it("should be possible for an Advisor to ragequit", async () => {
    const owner = accounts[1];
    const advisorAccount = accounts[2];
    const lootUnitPrice = 10;
    const chunkSize = 5;

    // Issue OpenLaw ERC20 Basic Token for tests
    // let tokenSupply = 1000000;
    const oltContract = await OLToken.new(1000000, { from: owner });

    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: owner,
      unitPrice: lootUnitPrice,
      nbUnits: chunkSize,
      tokenAddr: oltContract.address,
    });

    const bank = extensions.bank;

    // Transfer 1000 OLTs to the Advisor account
    await oltContract.transfer(advisorAccount, 1000, { from: owner });
    const advisorTokenBalance = await oltContract.balanceOf(advisorAccount);
    //"Advisor account must be contain 1000 OLT Tokens"
    expect(advisorTokenBalance.toString()).equal("1000");

    const onboarding = adapters.onboarding;
    const voting = adapters.voting;

    // Guild balance must be 0 if no Loot units are issued
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("0");

    // Total of OLT to be sent to the DAO in order to get the Loot units
    const tokenAmount = 10;

    // Pre-approve spender (DAO) to transfer applicant tokens
    await oltContract.approve(onboarding.address, tokenAmount, {
      from: advisorAccount,
      gasPrice: toBN(0),
    });

    // Send a request to join the DAO as an Advisor (non-voting power),
    // the tx passes the OLT ERC20 token, the amount and the nonVotingOnboarding adapter that handles the proposal
    const proposalId = getProposalCounter();
    await onboarding.submitProposal(
      dao.address,
      proposalId,
      advisorAccount,
      LOOT,
      tokenAmount,
      [],
      {
        from: owner,
        gasPrice: toBN("0"),
      }
    );

    // Vote on the new proposal to accept the new Advisor
    await voting.submitVote(dao.address, proposalId, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });

    // Process the new proposal
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, {
      from: advisorAccount,
      owner: tokenAmount,
      gasPrice: toBN("0"),
    });

    // Check the number of Loot (non-voting units) issued to the new Avisor
    const advisorAccountLoot = await bank.balanceOf(advisorAccount, LOOT);
    expect(advisorAccountLoot.toString()).equal("5");

    // Guild balance must change when Loot units are issued
    guildBalance = await bank.balanceOf(GUILD, oltContract.address);
    expect(guildBalance.toString()).equal("10");

    //Ragequit - Advisor ragequits
    await adapters.ragequit.ragequit(
      dao.address,
      toBN(0),
      toBN(advisorAccountLoot),
      [oltContract.address],
      {
        from: advisorAccount,
        gasPrice: toBN("0"),
      }
    );

    //Check Guild Bank Balance
    const newGuildBalance = await bank.balanceOf(GUILD, oltContract.address);
    expect(newGuildBalance.toString()).equal("2"); //must be close to zero
  });

  it("should not be possible to vote after the ragequit", async () => {
    const memberAddr = accounts[2];
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    let proposalId = getProposalCounter();
    await onboardingNewMember(
      proposalId,
      this.dao,
      onboarding,
      voting,
      memberAddr,
      owner,
      unitPrice,
      UNITS
    );

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("1200000000000000000");

    //Check New Member Units
    let units = await bank.balanceOf(memberAddr, UNITS);
    expect(units.toString()).equal("10000000000000000");

    //Ragequit - Burn all the new member units
    await this.adapters.ragequit.ragequit(
      this.dao.address,
      toBN(units),
      toBN(0),
      [ETH_TOKEN],
      {
        from: memberAddr,
        gasPrice: toBN("0"),
      }
    );

    //Member attempts to sponsor a proposal after the ragequit
    proposalId = getProposalCounter();
    await expectRevert(
      onboardingNewMember(
        proposalId,
        this.dao,
        onboarding,
        voting,
        memberAddr,
        memberAddr,
        unitPrice,
        UNITS
      ),
      "onlyMember"
    );

    await expectRevert(
      voting.submitVote(this.dao.address, proposalId, 1, {
        from: memberAddr,
        gasPrice: toBN("0"),
      }),
      "onlyMember"
    );
  });

  it("should not be possible to ragequit if the member have provided an invalid token", async () => {
    const bank = this.extensions.bank;

    // Check member units
    let units = await bank.balanceOf(owner, UNITS);
    expect(units.toString()).equal("1");

    //Ragequit - Attempts to ragequit using an invalid token to receive funds
    let invalidToken = accounts[7];
    await expectRevert(
      this.adapters.ragequit.ragequit(
        this.dao.address,
        toBN(units),
        toBN(0),
        [invalidToken],
        {
          from: owner,
          gasPrice: toBN("0"),
        }
      ),
      "token not allowed"
    );
  });

  it("should not be possible to ragequit if there are no tokens to receive the funds", async () => {
    const newMember = accounts[2];
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();
    await onboardingNewMember(
      proposalId,
      this.dao,
      onboarding,
      voting,
      newMember,
      owner,
      unitPrice,
      UNITS
    );

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("1200000000000000000");

    //Check New Member Units
    let units = await bank.balanceOf(newMember, UNITS);
    expect(units.toString()).equal("10000000000000000");

    await expectRevert(
      this.adapters.ragequit.ragequit(
        this.dao.address,
        toBN(units),
        toBN(0),
        [ETH_TOKEN, ETH_TOKEN], // token array with duplicates
        {
          from: newMember,
          gasPrice: toBN("0"),
        }
      ),
      "duplicate token"
    );
  });

  it("should not be possible to ragequit if there is a duplicate token", async () => {
    const memberA = accounts[2];
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();
    await onboardingNewMember(
      proposalId,
      this.dao,
      onboarding,
      voting,
      memberA,
      owner,
      unitPrice,
      UNITS
    );

    const memberAUnits = await bank.balanceOf(memberA, UNITS);
    expect(memberAUnits.toString()).equal("10000000000000000");

    await expectRevert(
      this.adapters.ragequit.ragequit(
        this.dao.address,
        toBN(memberAUnits),
        toBN(0),
        [], //empty token array
        {
          from: memberA,
          gasPrice: toBN("0"),
        }
      ),
      "missing tokens"
    );
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.ragequit;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: owner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
      }),
      "revert"
    );
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const adapter = this.adapters.ragequit;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: owner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
        data: fromAscii("should go to fallback func"),
      }),
      "revert"
    );
  });
});
