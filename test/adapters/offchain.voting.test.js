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
  SHARES,
  OnboardingContract,
  DaoRegistry,
  DaoFactory,
  FlagHelperLib,
  sharePrice,
  remaining,
  numberOfShares,
  entry,
  addDefaultAdapters,
} = require("../../utils/DaoFactory.js");
const {
  addVote,
  prepareVoteResult,
  toStepNode,
} = require("../../utils/offchain_voting.js");

const OffchainVotingContract = artifacts.require(
  "./adapters/OffchainVotingContract"
);

async function createOffchainVotingDao(
  senderAccount,
  unitPrice = sharePrice,
  nbShares = numberOfShares,
  votingPeriod = 10,
  gracePeriod = 1
) {
  let lib = await FlagHelperLib.new();
  const daoFactory = await DaoFactory.new();
  await DaoRegistry.link("FlagHelper", lib.address);
  let dao = await DaoRegistry.new({from: senderAccount, gasPrice: toBN("0")});
  await addDefaultAdapters(dao, unitPrice, nbShares, votingPeriod, gracePeriod);
  const votingAddress = await dao.getAdapterAddress(sha3("voting"));
  const offchainVoting = await OffchainVotingContract.new(votingAddress);
  await daoFactory.updateAdapter(
    dao.address,
    entry("voting", offchainVoting, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
      INTERNAL_TRANSFER: true,
    })
  );

  await offchainVoting.configureDao(dao.address, votingPeriod, gracePeriod, 10);
  await dao.finalizeDao();
  return {dao, voting: offchainVoting};
}

contract("LAOLAND - Offchain Voting Module", async (accounts) => {
  it("should be possible to vote offchain", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    let {dao, voting} = await createOffchainVotingDao(myAccount);

    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    await onboarding.onboard(
      dao.address,
      otherAccount,
      SHARES,
      sharePrice.mul(toBN(3)).add(remaining),
      {
        from: myAccount,
        value: sharePrice.mul(toBN("3")).add(remaining),
        gasPrice: toBN("0"),
      }
    );
    let blockNumber = await web3.eth.getBlockNumber();
    await onboarding.sponsorProposal(
      dao.address,
      0,
      web3.eth.abi.encodeParameter("uint256", blockNumber),
      {from: myAccount, gasPrice: toBN("0")}
    );

    const voteElements = await addVote(
      [],
      blockNumber,
      dao,
      0,
      myAccount,
      true
    );
    const {voteResultTree, votes} = prepareVoteResult(voteElements);
    const result = toStepNode(votes[0], voteResultTree);

    await voting.submitVoteResult(
      dao.address,
      0,
      voteResultTree.getHexRoot(),
      result,
      {from: myAccount, gasPrice: toBN("0")}
    );
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, 0, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
  });

  it("should be possible to invalidate the vote if the node is in the wrong order", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const otherAccount2 = accounts[3];

    let {dao, voting} = await createOffchainVotingDao(myAccount);

    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    await onboarding.onboard(
      dao.address,
      otherAccount,
      SHARES,
      sharePrice.mul(toBN(3)).add(remaining),
      {
        from: myAccount,
        value: sharePrice.mul(toBN(3)).add(remaining),
        gasPrice: toBN("0"),
      }
    );
    await onboarding.onboard(
      dao.address,
      otherAccount2,
      SHARES,
      sharePrice.mul(toBN(3)).add(remaining),
      {
        from: myAccount,
        value: sharePrice.mul(toBN(3)).add(remaining),
        gasPrice: toBN("0"),
      }
    );
    let blockNumber = await web3.eth.getBlockNumber();

    await onboarding.sponsorProposal(
      dao.address,
      0,
      web3.eth.abi.encodeParameter("uint256", blockNumber),
      {from: myAccount, gasPrice: toBN("0")}
    );
    await onboarding.sponsorProposal(
      dao.address,
      1,
      web3.eth.abi.encodeParameter("uint256", blockNumber),
      {from: myAccount, gasPrice: toBN("0")}
    );

    const voteElements = await addVote(
      [],
      blockNumber,
      dao,
      0,
      myAccount,
      true
    );
    const voteElements2 = await addVote(
      [],
      blockNumber,
      dao,
      1,
      myAccount,
      true
    );
    const r1 = prepareVoteResult(voteElements);
    const r2 = prepareVoteResult(voteElements2);

    const result1 = toStepNode(r1.votes[0], r1.voteResultTree);
    const result2 = toStepNode(r2.votes[0], r2.voteResultTree);

    await voting.submitVoteResult(
      dao.address,
      0,
      r1.voteResultTree.getHexRoot(),
      result1,
      {from: myAccount, gasPrice: toBN("0")}
    );
    await voting.submitVoteResult(
      dao.address,
      1,
      r2.voteResultTree.getHexRoot(),
      result2,
      {from: myAccount, gasPrice: toBN("0")}
    );
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, 0, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await onboarding.processProposal(dao.address, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    const someone = accounts[4];

    await onboarding.onboard(
      dao.address,
      someone,
      SHARES,
      sharePrice.mul(toBN(3)).add(remaining),
      {
        from: myAccount,
        value: sharePrice.mul(toBN(3)).add(remaining),
        gasPrice: toBN("0"),
      }
    );

    const proposalId = 2;
    blockNumber = await web3.eth.getBlockNumber();
    await onboarding.sponsorProposal(
      dao.address,
      proposalId,
      web3.eth.abi.encodeParameter("uint256", blockNumber),
      {from: myAccount, gasPrice: toBN("0")}
    );
    let ve = await addVote([], blockNumber, dao, proposalId, myAccount, true);
    ve = await addVote(ve, blockNumber, dao, proposalId, otherAccount, true);
    ve = await addVote(ve, blockNumber, dao, proposalId, otherAccount2, false);

    const r3 = prepareVoteResult(ve);
    const voteResultTree2 = r3.voteResultTree;
    const votes2 = r3.votes;
    const result3 = toStepNode(votes2[2], voteResultTree2);

    await voting.submitVoteResult(
      dao.address,
      proposalId,
      voteResultTree2.getHexRoot(),
      result3,
      {from: myAccount, gasPrice: toBN("0")}
    );

    const nodePrevious = toStepNode(votes2[0], voteResultTree2);
    const nodeCurrent = toStepNode(votes2[1], voteResultTree2);

    await voting.challengeWrongStep(
      dao.address,
      proposalId,
      nodePrevious,
      nodeCurrent
    );
  });
});
