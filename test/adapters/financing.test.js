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
} = require("../../utils/ContractUtil.js");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  accounts,
  expect,
  expectRevert,
  web3,
} = require("../../utils/OZTestUtil.js");

const { checkBalance } = require("../../utils/TestUtils.js");

const remaining = unitPrice.sub(toBN("50000000000000"));
const daoOwner = accounts[1];
const applicant = accounts[2];
const newMember = accounts[3];
const expectedGuildBalance = toBN("1200000000000000000");
const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Financing", () => {
  before("deploy dao", async () => {
    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
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

  it("should be possible to create a financing proposal and get the funds when the proposal pass", async () => {
    const bank = this.extensions.bank;
    const voting = this.adapters.voting;
    const financing = this.adapters.financing;
    const onboarding = this.adapters.onboarding;
    const bankAdapter = this.adapters.bankAdapter;

    let proposalId = getProposalCounter();

    //Add funds to the Guild Bank after sponsoring a member to join the Guild
    await onboarding.submitProposal(
      this.dao.address,
      proposalId,
      newMember,
      UNITS,
      unitPrice.mul(toBN(10)).add(remaining),
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(this.dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    //should not be able to process before the voting period has ended
    await expectRevert(
      onboarding.processProposal(this.dao.address, proposalId, {
        from: daoOwner,
        value: unitPrice.mul(toBN(10)).add(remaining),
        gasPrice: toBN("0"),
      }),
      "proposal has not been voted on yet"
    );

    await advanceTime(10000);
    await onboarding.processProposal(this.dao.address, proposalId, {
      from: daoOwner,
      value: unitPrice.mul(toBN(10)).add(remaining),
      gasPrice: toBN("0"),
    });
    //Check Guild Bank Balance
    checkBalance(bank, GUILD, ETH_TOKEN, expectedGuildBalance);

    //Create Financing Request
    let requestedAmount = toBN(50000);
    proposalId = getProposalCounter();
    await financing.submitProposal(
      this.dao.address,
      proposalId,
      applicant,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8(""),
      { from: daoOwner, gasPrice: toBN("0") }
    );

    //Member votes on the Financing proposal
    await voting.submitVote(this.dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    //Check applicant balance before Financing proposal is processed
    checkBalance(bank, applicant, ETH_TOKEN, "0");

    //Process Financing proposal after voting
    await advanceTime(10000);
    await financing.processProposal(this.dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    //Check Guild Bank balance to make sure the transfer has happened
    checkBalance(
      bank,
      GUILD,
      ETH_TOKEN,
      expectedGuildBalance.sub(requestedAmount)
    );
    //Check the applicant token balance to make sure the funds are available in the bank for the applicant account
    checkBalance(bank, applicant, ETH_TOKEN, requestedAmount);

    const ethBalance = await web3.eth.getBalance(applicant);
    await bankAdapter.withdraw(this.dao.address, applicant, ETH_TOKEN, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    checkBalance(bank, applicant, ETH_TOKEN, 0);
    const ethBalance2 = await web3.eth.getBalance(applicant);
    expect(toBN(ethBalance).add(requestedAmount).toString()).equal(
      ethBalance2.toString()
    );
  });

  it("should not be possible to get the money if the proposal fails", async () => {
    const voting = this.adapters.voting;
    const financing = this.adapters.financing;
    const onboarding = this.adapters.onboarding;

    //Add funds to the Guild Bank after sponsoring a member to join the Guild
    let proposalId = getProposalCounter();
    await onboarding.submitProposal(
      this.dao.address,
      proposalId,
      newMember,
      UNITS,
      unitPrice.mul(toBN(10)).add(remaining),
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(this.dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await onboarding.processProposal(this.dao.address, proposalId, {
      from: daoOwner,
      value: unitPrice.mul(toBN(10)).add(remaining),
      gasPrice: toBN("0"),
    });

    //Create Financing Request
    let requestedAmount = toBN(50000);
    proposalId = "0x2";
    await financing.submitProposal(
      this.dao.address,
      proposalId,
      applicant,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8(""),
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    //Member votes on the Financing proposal
    await voting.submitVote(this.dao.address, proposalId, 2, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    //Process Financing proposal after voting
    await advanceTime(10000);
    await expectRevert(
      financing.processProposal(this.dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal needs to pass"
    );
  });

  it("should not be possible to submit a proposal with a token that is not allowed", async () => {
    const voting = this.adapters.voting;
    const financing = this.adapters.financing;
    const onboarding = this.adapters.onboarding;

    let proposalId = getProposalCounter();
    //Add funds to the Guild Bank after sponsoring a member to join the Guild
    await onboarding.submitProposal(
      this.dao.address,
      proposalId,
      newMember,
      UNITS,
      unitPrice.mul(toBN(10)).add(remaining),
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(this.dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await onboarding.processProposal(this.dao.address, proposalId, {
      from: daoOwner,
      value: unitPrice.mul(toBN(10)).add(remaining),
      gasPrice: toBN("0"),
    });

    proposalId = getProposalCounter();
    const invalidToken = "0x6941a80e1a034f57ed3b1d642fc58ddcb91e2596";
    //Create Financing Request with a token that is not allowed
    let requestedAmount = toBN(50000);
    await expectRevert(
      financing.submitProposal(
        this.dao.address,
        proposalId,
        applicant,
        invalidToken,
        requestedAmount,
        fromUtf8("")
      ),
      "token not allowed"
    );
  });

  it("should not be possible to submit a proposal to request funding with an amount.toEqual to zero", async () => {
    const voting = this.adapters.voting;
    const financing = this.adapters.financing;
    const onboarding = this.adapters.onboarding;

    let proposalId = getProposalCounter();
    //Add funds to the Guild Bank after sponsoring a member to join the Guild
    await onboarding.submitProposal(
      this.dao.address,
      proposalId,
      newMember,
      UNITS,
      unitPrice.mul(toBN(10)).add(remaining),
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(this.dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await onboarding.processProposal(this.dao.address, proposalId, {
      from: daoOwner,
      value: unitPrice.mul(toBN(10)).add(remaining),
      gasPrice: toBN("0"),
    });

    proposalId = getProposalCounter();
    // Create Financing Request with amount = 0
    let requestedAmount = toBN(0);
    await expectRevert(
      financing.submitProposal(
        this.dao.address,
        proposalId,
        applicant,
        ETH_TOKEN,
        requestedAmount,
        fromUtf8("")
      ),
      "invalid requested amount"
    );
  });

  it("should not be possible to request funding with an invalid proposal id", async () => {
    const financing = this.adapters.financing;

    let invalidProposalId = "0x0";
    await expectRevert(
      financing.submitProposal(
        this.dao.address,
        invalidProposalId,
        applicant,
        ETH_TOKEN,
        toBN(10),
        fromUtf8("")
      ),
      "invalid proposalId"
    );
  });

  it("should not be possible to reuse a proposalId", async () => {
    const financing = this.adapters.financing;
    const onboarding = this.adapters.onboarding;

    let proposalId = getProposalCounter();

    //Add funds to the Guild Bank after sponsoring a member to join the Guild
    await onboarding.submitProposal(
      this.dao.address,
      proposalId,
      newMember,
      UNITS,
      unitPrice.mul(toBN(10)).add(remaining),
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    let reusedProposalId = proposalId;
    await expectRevert(
      financing.submitProposal(
        this.dao.address,
        reusedProposalId,
        applicant,
        ETH_TOKEN,
        toBN(50000),
        fromUtf8("")
      ),
      "proposalId must be unique"
    );
  });

  it("should not be possible to process a proposal that does not exist", async () => {
    let proposalId = getProposalCounter();
    await expectRevert(
      this.adapters.financing.processProposal(this.dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "adapter not found"
    );
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.financing;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
      }),
      "revert"
    );
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const adapter = this.adapters.financing;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
        data: fromAscii("should go to fallback func"),
      }),
      "revert"
    );
  });
});
