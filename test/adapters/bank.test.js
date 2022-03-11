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
  toWei,
  fromUtf8,
  fromAscii,
  unitPrice,
  UNITS,
  GUILD,
  ETH_TOKEN,
  TOTAL,
  ESCROW,
  DAI_TOKEN,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  web3,
  getBalance,
  getAccounts,
} = require("../../utils/hardhat-test-util");

const { checkBalance } = require("../../utils/test-util");

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Bank", () => {
  const remaining = unitPrice.sub(toBN("50000000000000"));
  const expectedGuildBalance = toBN("1200000000000000000");
  let accounts, daoOwner, applicant, newMember;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];
    applicant = accounts[2];
    newMember = accounts[3];

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

  it("should be possible to withdraw funds from the bank", async () => {
    const bank = this.extensions.bankExt;
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
    await expect(
      onboarding.processProposal(this.dao.address, proposalId, {
        from: daoOwner,
        value: unitPrice.mul(toBN(10)).add(remaining),
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("proposal has not been voted on yet");

    await advanceTime(10000);
    await onboarding.processProposal(this.dao.address, proposalId, {
      from: daoOwner,
      value: unitPrice.mul(toBN(10)).add(remaining),
      gasPrice: toBN("0"),
    });
    //Check Guild Bank Balance
    await checkBalance(bank, GUILD, ETH_TOKEN, expectedGuildBalance);

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
    await checkBalance(bank, applicant, ETH_TOKEN, "0");

    //Process Financing proposal after voting
    await advanceTime(10000);
    await financing.processProposal(this.dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    //Check Guild Bank balance to make sure the transfer has happened
    await checkBalance(
      bank,
      GUILD,
      ETH_TOKEN,
      expectedGuildBalance.sub(requestedAmount)
    );
    //Check the applicant token balance to make sure the funds are available in the bank for the applicant account
    await checkBalance(bank, applicant, ETH_TOKEN, requestedAmount);

    const ethBalance = await getBalance(applicant);

    // Withdraw the funds from the bank
    await bankAdapter.withdraw(this.dao.address, ETH_TOKEN, {
      from: applicant,
      gasPrice: toBN("0"),
    });

    await checkBalance(bank, applicant, ETH_TOKEN, 0);
    const ethBalance2 = await getBalance(applicant);
    expect(ethBalance.add(requestedAmount).toString()).equal(
      ethBalance2.toString()
    );
  });

  it("should possible to send eth to the dao bank", async () => {
    const bank = this.extensions.bankExt;
    const bankAdapter = this.adapters.bankAdapter;

    await checkBalance(bank, GUILD, ETH_TOKEN, "0");

    await bankAdapter.sendEth(this.dao.address, { value: toWei("5") });

    await checkBalance(bank, GUILD, ETH_TOKEN, toWei("5"));
  });

  it("should possible to update the token balance in the dao bank", async () => {
    const bank = this.extensions.bankExt;
    const bankAdapter = this.adapters.bankAdapter;

    await checkBalance(bank, GUILD, ETH_TOKEN, "0");

    await bankAdapter.sendEth(this.dao.address, { value: toWei("5") });

    await bankAdapter.updateToken(this.dao.address, ETH_TOKEN);

    await checkBalance(bank, GUILD, ETH_TOKEN, toWei("5"));
  });

  it("should not possible to call sendEth without any eth", async () => {
    await expect(
      this.adapters.bankAdapter.sendEth(this.dao.address, {
        value: toWei("0"),
      })
    ).to.be.revertedWith("no eth sent");
  });

  it("should not be possible to withdraw funds from the bank if the sender has no funds to withdraw", async () => {
    const bankAdapter = this.adapters.bankAdapter;
    const accountWithNoFunds = accounts[7];

    await expect(
      bankAdapter.withdraw(this.dao.address, ETH_TOKEN, {
        from: accountWithNoFunds,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("nothing to withdraw");
  });

  it("should not be possible to withdraw funds using a token that is not registered in the DAO", async () => {
    const bankAdapter = this.adapters.bankAdapter;

    await expect(
      bankAdapter.withdraw(this.dao.address, DAI_TOKEN, {
        from: daoOwner,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("nothing to withdraw");
  });

  // Hardhat tests can't be executed using accounts that we don't own, so this calls won't pass
  it.skip("should not be possible to withdraw funds using a reserved address as sender", async () => {
    const bankAdapter = this.adapters.bankAdapter;

    await expect(
      bankAdapter.withdraw(this.dao.address, ETH_TOKEN, {
        from: GUILD,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("withdraw::reserved address");
    await expect(
      bankAdapter.withdraw(this.dao.address, ETH_TOKEN, {
        from: TOTAL,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("withdraw::reserved address");
    await expect(
      bankAdapter.withdraw(this.dao.address, ETH_TOKEN, {
        from: ESCROW,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("withdraw::reserved address");
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.bankAdapter;
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
    const adapter = this.adapters.bankAdapter;
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
