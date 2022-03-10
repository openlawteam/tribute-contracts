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
  GUILD,
  unitPrice,
  remaining,
  LOOT,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  proposalIdGenerator,
  advanceTime,
  getAccounts,
  OLToken,
} = require("../../utils/hardhat-test-util");

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Non Voting Onboarding", () => {
  let accounts, daoOwner;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];
  });

  it("should be possible to join a DAO as a member without any voting power by requesting Loot while staking raw ETH", async () => {
    const advisorAccount = accounts[2];

    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
    });
    const bank = extensions.bankExt;
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;

    // Total of ETH to be sent to the DAO in order to get the Loot units
    let ethAmount = unitPrice.mul(toBN(3)).add(remaining);
    let proposalId = "0x1";
    // Request to join the DAO as an Advisor (non-voting power), Send a tx with RAW ETH only and specify the nonVotingOnboarding
    await onboarding.submitProposal(
      dao.address,
      proposalId,
      advisorAccount,
      LOOT,
      ethAmount,
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    // Vote on the new proposal to accept the new Advisor
    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Process the new proposal
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, {
      from: daoOwner,
      value: ethAmount,
      gasPrice: toBN("0"),
    });

    // Check the number of Loot (non-voting units) issued to the new Avisor
    const advisorAccountLoot = await bank.balanceOf(advisorAccount, LOOT);
    expect(advisorAccountLoot.toString()).equal("3000000000000000");

    // Guild balance must not change when Loot units are issued
    const guildBalance = await bank.balanceOf(
      GUILD,
      "0x0000000000000000000000000000000000000000"
    );
    expect(guildBalance.toString()).equal("360000000000000000");
  });

  it("should be possible to join a DAO as a member without any voting power by requesting Loot while staking ERC20 token", async () => {
    const advisorAccount = accounts[2];

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    const oltContract = await OLToken.new(tokenSupply);
    const lootUnitPrice = 10;
    const nbOfLootUnits = 100000000;

    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
      unitPrice: lootUnitPrice,
      nbUnits: nbOfLootUnits,
      tokenAddr: oltContract.address,
    });

    const bank = extensions.bankExt;
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;

    // Transfer 1000 OLTs to the Advisor account
    await oltContract.transfer(advisorAccount, 100);
    const advisorTokenBalance = await oltContract.balanceOf.call(
      advisorAccount
    );
    expect(advisorTokenBalance.toString()).equal("100");

    // Total of OLT to be sent to the DAO in order to get the Loot units
    const tokenAmount = 10;

    // Send a request to join the DAO as an Advisor (non-voting power),
    // the tx passes the OLT ERC20 token, the amount and the nonVotingOnboarding adapter that handles the proposal
    const proposalId = getProposalCounter();
    await expect(
      onboarding.submitProposal(
        dao.address,
        proposalId,
        advisorAccount,
        LOOT,
        tokenAmount,
        [],
        {
          from: advisorAccount,
          gasPrice: toBN("0"),
        }
      )
    ).to.be.revertedWith("revert");

    // Pre-approve spender (onboarding adapter) to transfer proposer tokens
    await oltContract.approve(onboarding.address, tokenAmount, {
      from: advisorAccount,
    });

    await onboarding.submitProposal(
      dao.address,
      proposalId,
      advisorAccount,
      LOOT,
      tokenAmount,
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    // Vote on the new proposal to accept the new Advisor
    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Process the new proposal
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, {
      from: advisorAccount,
      gasPrice: toBN("0"),
    });

    // Check the number of Loot (non-voting units) issued to the new Avisor
    const advisorAccountLoot = await bank.balanceOf(advisorAccount, LOOT);
    expect(advisorAccountLoot.toString()).equal("100000000");

    // Guild balance must not change when Loot units are issued
    const guildBalance = await bank.balanceOf(GUILD, oltContract.address);
    expect(guildBalance.toString()).equal("10");
  });
});
