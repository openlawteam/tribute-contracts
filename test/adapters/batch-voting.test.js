// Whole-script strict mode syntax
"use strict";

/**
MIT License

Copyright (c) 2021 Openlaw

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
  entryDao,
  deployDao,
  web3,
  accounts,
  SHARES,
  sharePrice,
  remaining,
  numberOfShares,
  ETH_TOKEN,
  SnapshotProposalContract,
  BatchVotingContract,
  expect,
} = require("../../utils/DaoFactory.js");

const {
  createVote,
  getMessageERC712Hash,
  prepareVoteProposalData,
  validateMessage,
  SigUtilSigner,
} = require("../../utils/offchain_voting.js");

describe("Adapter - BatchVoting", () => {
  let proposals = 1000000;
  let proposalCounter = proposals;

  const generateMembers = (amount) => {
    let accounts = [];
    for (let i = 0; i < amount; i++) {
      const account = web3.eth.accounts.create();
      accounts.push(account);
    }

    return accounts;
  };

  const members = generateMembers(5).sort((a, b) => {
    if (a.address.toLowerCase() < b.address.toLowerCase()) {
      return -1;
    }
    if (a.address.toLowerCase() > b.address.toLowerCase()) {
      return 1;
    }
    return 0;
  });

  const onboardMember = async (dao, voting, onboarding, index) => {
    const blockNumber = await web3.eth.getBlockNumber();
    const proposalId = web3.utils.numberToHex(proposalCounter++);

    const proposalPayload = {
      name: "some proposal",
      body: "this is my proposal",
      choices: ["yes", "no"],
      start: Math.floor(new Date().getTime() / 1000),
      end: Math.floor(new Date().getTime() / 1000) + 10000,
      snapshot: blockNumber.toString(),
    };

    const space = "molochv3";
    const chainId = 1;

    const proposalData = {
      type: "proposal",
      timestamp: Math.floor(new Date().getTime() / 1000),
      space,
      payload: proposalPayload,
    };

    //signer for myAccount (its private key)
    const signer = SigUtilSigner(members[0].privateKey);
    proposalData.sig = await signer(
      proposalData,
      dao.address,
      onboarding.address,
      chainId
    );

    const proposalHash = getMessageERC712Hash(
      proposalData,
      dao.address,
      onboarding.address,
      chainId
    ).toString("hex");

    await onboarding.onboard(
      dao.address,
      proposalId,
      members[1].address,
      SHARES,
      sharePrice.mul(toBN(3)).add(remaining),
      {
        value: sharePrice.mul(toBN("3")).add(remaining),
        gasPrice: toBN("0"),
      }
    );

    await onboarding.sponsorProposal(
      dao.address,
      proposalId,
      prepareVoteProposalData(proposalData)
    );

    const voteEntries = [];
    for (let i = 0; i < index; i++) {
      const voteSigner = SigUtilSigner(members[i].privateKey);
      const voteEntry = await createVote(
        proposalHash,
        members[i].address,
        true
      );
      const sig = voteSigner(
        voteEntry,
        dao.address,
        onboarding.address,
        chainId
      );

      const prepareVoteEntry = {
        vote: voteEntry,
        memberAddress: members[i].address,
        sig,
      };
      voteEntries.push(prepareVoteEntry);

      expect(
        validateMessage(
          voteEntry,
          members[i].address,
          dao.address,
          onboarding.address,
          chainId,
          sig
        )
      ).equal(true);
    }

    await advanceTime(10000);

    let tx = await voting.submitVoteResult(
      dao.address,
      proposalId,
      voteEntries
    );

    console.log(
      "gas used for (" +
        (proposalCounter - proposals) +
        ") votes:" +
        new Intl.NumberFormat().format(tx.receipt.gasUsed)
    );

    await advanceTime(10000);

    await onboarding.processProposal(dao.address, proposalId);
  };

  const createBatchVotingDao = async (
    senderAccount,
    unitPrice = sharePrice,
    nbShares = numberOfShares,
    votingPeriod = 10,
    gracePeriod = 1
  ) => {
    const newMembers = generateMembers(10);
    const { dao, adapters, extensions } = await deployDao(null, {
      owner: senderAccount,
      unitPrice: unitPrice,
      nbShares: nbShares,
      votingPeriod: votingPeriod,
      gracePeriod: gracePeriod,
      tokenAddr: ETH_TOKEN,
      maxExternalTokens: 100,
      finalize: false,
    });

    const bank = extensions.bank;

    // await dao.potentialNewMember(newMembers[0].address, {
    //   from: senderAccount,
    // });
    // await bank.addToBalance(newMembers[0].address, SHARES, 1, {
    //   from: senderAccount,
    // });

    const snapshotContract = await SnapshotProposalContract.new(1);
    const batchVoting = await BatchVotingContract.new(snapshotContract.address);

    await dao.replaceAdapter(
      sha3("voting"),
      batchVoting.address,
      entryDao("voting", dao, batchVoting, {}).flags,
      [],
      [],
      { from: senderAccount }
    );

    await batchVoting.configureDao(dao.address, votingPeriod, gracePeriod, {
      from: senderAccount,
      gasPrice: toBN("0"),
    });

    await dao.finalizeDao({ from: senderAccount, gasPrice: toBN("0") });

    adapters["voting"] = batchVoting;

    return { dao, adapters, extensions };
  };

  it("should be possible to propose a new voting by signing the proposal hash", async () => {
    const daoOwner = accounts[1];
    const { dao, adapters } = await createBatchVotingDao(daoOwner);

    const votingName = adapters.voting.getAdapterName();
    console.log("voting name:" + votingName);

    const onboarding = adapters.onboarding;
    for (var i = 0; i < members.length; i++) {
      await onboardMember(dao, voting, onboarding, i);
    }
  });
});
