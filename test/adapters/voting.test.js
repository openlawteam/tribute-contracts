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
  createDao,
  getContract,
  SHARES,
  sharePrice,
  remaining,
  OnboardingContract,
  VotingContract,
} = require("../../utils/DaoFactory.js");

contract("LAOLAND - Voting Adapter", async (accounts) => {
  it("should be possible to vote", async () => {
    const account1 = accounts[1];
    const account2 = accounts[2];

    let dao = await createDao(account1);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);

    await onboarding.onboard(dao.address, "0x0", account2, SHARES, 0, {
      from: account1,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, "0x0", [], {
      from: account1,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, "0x0", 1, {
      from: account1,
      gasPrice: toBN("0"),
    });
  });

  it("should not be possible to vote twice", async () => {
    const account1 = accounts[1];
    const account2 = accounts[2];

    let dao = await createDao(account1);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);

    await onboarding.onboard(dao.address, "0x0", account2, SHARES, 0, {
      from: account1,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, "0x0", [], {
      from: account1,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, "0x0", 1, {
      from: account1,
      gasPrice: toBN("0"),
    });

    try {
      await voting.submitVote(dao.address, "0x0", 1, {
        from: account1,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "member has already voted");
    }
  });

  it("should not be possible to vote with a non-member address", async () => {
    const account1 = accounts[1];
    const account2 = accounts[2];
    const account3 = accounts[3];

    let dao = await createDao(account1);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);

    await onboarding.onboard(dao.address, "0x0", account2, SHARES, 0, {
      from: account1,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, "0x0", [], {
      from: account1,
      gasPrice: toBN("0"),
    });

    try {
      await voting.submitVote(dao.address, "0x0", 1, {
        from: account3,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "onlyMember");
    }
  });

  it("should be possible to vote with a delegate non-member address", async () => {
    const account1 = accounts[1];
    const account2 = accounts[2];
    const account3 = accounts[3];

    let dao = await createDao(account1);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);

    await onboarding.onboard(dao.address, "0x0", account2, SHARES, 0, {
      from: account1,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, "0x0", [], {
      from: account1,
      gasPrice: toBN("0"),
    });

    await onboarding.updateDelegateKey(dao.address, account3, {
      from: account1,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, "0x0", 1, {
      from: account3,
      gasPrice: toBN("0"),
    });
  });
});
