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
  advanceTime,
  createDao,
  getContract,
  GUILD,
  SHARES,
  sharePrice,
  remaining,
  numberOfShares,
  OnboardingContract,
  VotingContract,
  ETH_TOKEN,
} = require("../../utils/DaoFactory.js");
const { checkBalance } = require("../../utils/TestUtils.js");

contract("LAOLAND - Onboarding Adapter", async (accounts) => {
  it("should be possible to join a DAO", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const nonMemberAccount = accounts[3];

    let dao = await createDao(myAccount);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);

    await onboarding.onboard(dao.address, "0x0", otherAccount, SHARES, 0, {
      from: myAccount,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, "0x0", [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    voting.submitVote(dao.address, "0x0", 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    try {
      await onboarding.processProposal(dao.address, "0x0", {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal has not been voted on yet");
    }

    await advanceTime(10000);
    await onboarding.processProposal(dao.address, "0x0", {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    const myAccountShares = await dao.balanceOf(myAccount, SHARES);
    const otherAccountShares = await dao.balanceOf(otherAccount, SHARES);
    const nonMemberAccountShares = await dao.balanceOf(
      nonMemberAccount,
      SHARES
    );
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(
      otherAccountShares.toString(),
      numberOfShares.mul(toBN("3")).toString()
    );
    assert.equal(nonMemberAccountShares.toString(), "0");
    await checkBalance(dao, GUILD, ETH_TOKEN, sharePrice.mul(toBN("3")));
  });

  it("should be possible to cancel an onboarding proposal", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const dao = await createDao(myAccount);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);

    await onboarding.onboard(dao.address, "0x0", otherAccount, SHARES, 0, {
      from: myAccount,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });

    await onboarding.cancelProposal(dao.address, "0x0", {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    const isProcessed = await dao.getProposalFlag("0x0", toBN("2")); // 2 is processed flag index
    assert.equal(isProcessed, true);

    try {
      await onboarding.sponsorProposal(dao.address, "0x0", [], {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal already processed");
    }

    try {
      await onboarding.processProposal(dao.address, "0x0", {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal already processed");
    }

    const myAccountShares = await dao.balanceOf(myAccount, SHARES);
    const otherAccountShares = await dao.balanceOf(otherAccount, SHARES);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(
      otherAccountShares.toString(),
      numberOfShares.mul(toBN("0")).toString()
    );

    const guildBalance = await dao.balanceOf(
      GUILD,
      "0x0000000000000000000000000000000000000000"
    );
    assert.equal(guildBalance.toString(), sharePrice.mul(toBN("0")).toString());
  });

  it("should be possible to withdraw an onboarding proposal", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    let dao = await createDao(myAccount);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);

    await onboarding.onboard(dao.address, "0x0", otherAccount, SHARES, 0, {
      from: myAccount,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, "0x0", [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, "0x0", 2, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    const vote = await voting.voteResult(dao.address, "0x0");
    assert.equal(vote.toString(), "3"); // vote should be "not passed"

    await onboarding.processProposal(dao.address, "0x0", {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    const isProcessed = await dao.getProposalFlag("0x0", toBN("2")); // 2 is processed flag index
    assert.equal(isProcessed, true);

    const myAccountShares = await dao.balanceOf(myAccount, SHARES);
    const otherAccountShares = await dao.balanceOf(otherAccount, SHARES);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(
      otherAccountShares.toString(),
      numberOfShares.mul(toBN("0")).toString()
    );

    const guildBalance = await dao.balanceOf(
      GUILD,
      "0x0000000000000000000000000000000000000000"
    );
    assert.equal(guildBalance.toString(), sharePrice.mul(toBN("0")).toString());
  });

  it("should validate inputs", async () => {
    const myAccount = accounts[1];
    let dao = await createDao(myAccount);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);

    try {
      await onboarding.sponsorProposal(dao.address, "0x1", [], {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal does not exist");
    }
  });

  it("should not be possible to have more than the maximum number of shares", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const nonMemberAccount = accounts[3];

    let dao = await createDao(myAccount);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);

    try {
      await onboarding.onboard(dao.address, "0x0", otherAccount, SHARES, 0, {
        from: myAccount,
        value: sharePrice.mul(toBN(11)).add(remaining),
        gasPrice: toBN("0"),
      });
      assert.err("should not allow more than maxumum shared to be requested");
    } catch (err) {
      assert.equal(
        err.reason,
        "total shares for this member must be lower than the maximum"
      );
    }
  });

  it("should be possible to cancel an onboarding proposal", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const dao = await createDao(myAccount);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);

    await onboarding.onboard(dao.address, "0x0", otherAccount, SHARES, 0, {
      from: myAccount,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });

    await onboarding.cancelProposal(dao.address, "0x0", {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    const isProcessed = await dao.getProposalFlag("0x0", toBN("2")); // 2 is processed flag index
    assert.equal(isProcessed, true);

    try {
      await onboarding.sponsorProposal(dao.address, "0x0", [], {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal already processed");
    }

    try {
      await onboarding.processProposal(dao.address, "0x0", {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal already processed");
    }

    const myAccountShares = await dao.balanceOf(myAccount, SHARES);
    const otherAccountShares = await dao.balanceOf(otherAccount, SHARES);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), "0");

    const guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "0");
  });

  it("should be possible to withdraw an onboarding proposal", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    let dao = await createDao(myAccount);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);

    await onboarding.onboard(dao.address, "0x0", otherAccount, SHARES, 0, {
      from: myAccount,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, "0x0", [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, "0x0", 2, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    const vote = await voting.voteResult(dao.address, "0x0");
    assert.equal(vote.toString(), "3"); // vote should be "not passed"

    await onboarding.processProposal(dao.address, "0x0", {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    const isProcessed = await dao.getProposalFlag("0x0", toBN("2")); // 2 is processed flag index
    assert.equal(isProcessed, true);

    const myAccountShares = await dao.balanceOf(myAccount, SHARES);
    const otherAccountShares = await dao.balanceOf(otherAccount, SHARES);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), "0");

    const guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "0");

    const otherAccountBalance = await dao.balanceOf(otherAccount, ETH_TOKEN);

    assert.equal(otherAccountBalance.toString(), "0");

    let onboardingBalance = await web3.eth.getBalance(onboarding.address);
    assert.equal(onboardingBalance.toString(), "0");
  });

  it("should validate inputs", async () => {
    const myAccount = accounts[1];
    let dao = await createDao(myAccount);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);

    try {
      await onboarding.sponsorProposal(dao.address, "0x1", [], {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal does not exist");
    }
  });
});
