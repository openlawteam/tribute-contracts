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
  deployDefaultDao,
  proposalIdGenerator,
  takeChainSnapshot,
  revertChainSnapshot,
  accounts,
  sharePrice,
  remaining,
  SHARES,
  expectRevert,
} = require("../../utils/DaoFactory.js");

describe("Adapter - Voting", () => {
  const daoOwner = accounts[1];
  const proposalCounter = proposalIdGenerator().generator;

  const getProposalCounter = () => {
    return proposalCounter().next().value;
  };

  beforeAll(async () => {
    const { dao, adapters, extensions } = await deployDefaultDao(daoOwner);
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  it("should be possible to vote", async () => {
    const account2 = accounts[2];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();
    await onboarding.onboard(dao.address, proposalId, account2, SHARES, 0, {
      from: daoOwner,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    const vote = await voting.voteResult(dao.address, proposalId);
    expect(vote.toString()).toEqual("2"); // vote should be "pass = 2"
  });

  it("should not be possible to vote twice", async () => {
    const account2 = accounts[2];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();
    await onboarding.onboard(dao.address, proposalId, account2, SHARES, 0, {
      from: daoOwner,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await expectRevert(
      voting.submitVote(dao.address, proposalId, 2, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "member has already voted"
    );
  });

  it("should not be possible to vote with a non-member address", async () => {
    const account2 = accounts[2];
    const account3 = accounts[3];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();
    await onboarding.onboard(dao.address, proposalId, account2, SHARES, 0, {
      from: daoOwner,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await expectRevert(
      voting.submitVote(dao.address, proposalId, 1, {
        from: account3,
        gasPrice: toBN("0"),
      }),
      "onlyMember"
    );
  });

  it("should be possible to vote with a delegate non-member address", async () => {
    const account2 = accounts[2];
    const account3 = accounts[3];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const daoRegistryAdapter = this.adapters.daoRegistryAdapter;

    const proposalId = getProposalCounter();
    await onboarding.onboard(dao.address, proposalId, account2, SHARES, 0, {
      from: daoOwner,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await daoRegistryAdapter.updateDelegateKey(dao.address, account3, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 1, {
      from: account3,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    const vote = await voting.voteResult(dao.address, proposalId);
    expect(vote.toString()).toEqual("2"); // vote should be "pass = 2"
  });
});
