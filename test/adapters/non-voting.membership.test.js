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
  sha3,
  toBN,
  advanceTime,
  createDao,
  GUILD,
  LOOT,
  sharePrice,
  remaining,
  OLTokenContract,
  OnboardingContract,
  VotingContract,
  ETH_TOKEN,
} = require("../../utils/DaoFactory.js");

contract("LAOLAND - Non Voting Onboarding Adapter", async (accounts) => {
  it("should be possible to join a DAO as a member without any voting power by requesting Loot while staking raw ETH", async () => {
    const myAccount = accounts[1];
    const advisorAccount = accounts[2];

    let dao = await createDao(myAccount);

    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    // Total of ETH to be sent to the DAO in order to get the Loot shares
    let ethAmount = sharePrice.mul(toBN(3)).add(remaining);
    let proposalId = "0x0";
    // Request to join the DAO as an Advisor (non-voting power), Send a tx with RAW ETH only and specify the nonVotingOnboarding
    await onboarding.onboard(dao.address, proposalId, advisorAccount, LOOT, 0, {
      from: myAccount,
      value: ethAmount,
      gasPrice: toBN("0"),
    });

    // Sponsor the new proposal to allow the Advisor to join the DAO
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Vote on the new proposal to accept the new Advisor
    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Process the new proposal
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Check the number of Loot (non-voting shares) issued to the new Avisor
    const advisorAccountLoot = await dao.balanceOf(advisorAccount, LOOT);
    assert.equal(advisorAccountLoot.toString(), "3000000000000000");

    // Guild balance must not change when Loot shares are issued
    const guildBalance = await dao.balanceOf(
      GUILD,
      "0x0000000000000000000000000000000000000000"
    );
    assert.equal(guildBalance.toString(), "360000000000000000");
  });

  it("should be possible to join a DAO as a member without any voting power by requesting Loot while staking ERC20 token", async () => {
    const myAccount = accounts[1];
    const advisorAccount = accounts[2];

    // Issue OpenLaw ERC20 Basic Token for tests
    let tokenSupply = 1000000;
    let oltContract = await OLTokenContract.new(tokenSupply);

    let lootSharePrice = 10;
    let nbOfLootShares = 100000000;

    let dao = await createDao(
      myAccount,
      lootSharePrice,
      nbOfLootShares,
      10,
      1,
      oltContract.address
    );

    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    // Transfer 1000 OLTs to the Advisor account
    await oltContract.approve(advisorAccount, 100);
    await oltContract.transfer(advisorAccount, 100);
    let advisorTokenBalance = await oltContract.balanceOf.call(advisorAccount);
    assert.equal(
      "100",
      advisorTokenBalance.toString(),
      "Advisor account must be initialized with 100 OLT Tokens"
    );

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    // Total of OLT to be sent to the DAO in order to get the Loot shares
    let tokenAmount = 10;

    // Pre-approve spender (DAO) to transfer applicant tokens
    await oltContract.approve(dao.address, tokenAmount, {
      from: advisorAccount,
    });

    // Send a request to join the DAO as an Advisor (non-voting power),
    // the tx passes the OLT ERC20 token, the amount and the nonVotingOnboarding adapter that handles the proposal
    try {
      await onboarding.onboard(
        dao.address,
        "0x0",
        advisorAccount,
        LOOT,
        tokenAmount,
        {
          from: advisorAccount,
          gasPrice: toBN("0"),
        }
      );
      assert.equal(true, false, "should have failed!");
    } catch (err) {
      assert.equal(err.message.indexOf("ERC20 transfer not allowed") > 0, true);
    }

    await oltContract.approve(onboarding.address, tokenAmount, {
      from: advisorAccount,
    });

    await onboarding.onboard(
      dao.address,
      "0x0",
      advisorAccount,
      LOOT,
      tokenAmount,
      {
        from: advisorAccount,
        gasPrice: toBN("0"),
      }
    );

    // Sponsor the new proposal to allow the Advisor to join the DAO
    await onboarding.sponsorProposal(dao.address, "0x0", [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Vote on the new proposal to accept the new Advisor
    await voting.submitVote(dao.address, "0x0", 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Process the new proposal
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, "0x0", {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Check the number of Loot (non-voting shares) issued to the new Avisor
    const advisorAccountLoot = await dao.balanceOf(advisorAccount, LOOT);
    assert.equal(advisorAccountLoot.toString(), "100000000");

    // Guild balance must not change when Loot shares are issued
    const guildBalance = await dao.balanceOf(GUILD, oltContract.address);
    assert.equal(guildBalance.toString(), "10");
  });
});
