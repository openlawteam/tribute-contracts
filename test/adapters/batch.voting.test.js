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
  SHARES,
  OnboardingContract,
  sharePrice,
  remaining,
  numberOfShares,
  entryDao,
  createDao,
  ETH_TOKEN,
} = require("../../utils/DaoFactory.js");
const {
  createVote,
  TypedDataUtils,
  getMessageERC712Hash,
  prepareVoteProposalData,
  prepareVoteResult,
  toStepNode,
  getVoteStepDomainDefinition,
  validateMessage,
  SigUtilSigner,
} = require("../../utils/offchain_voting.js");

const BatchVotingContract = artifacts.require(
  "./adapters/BatchVotingContract"
);



const members = generateMembers(10);

function generateMembers(amount) {
  let accounts = [];
  for(let i = 0; i < amount; i++) {
    const account = web3.eth.accounts.create();
    accounts.push(account);
  }

  return accounts;
  
}

async function createBatchVotingDao(
  senderAccount,
  unitPrice = sharePrice,
  nbShares = numberOfShares,
  votingPeriod = 10,
  gracePeriod = 1
) {
  generateMembers(10);
  let dao = await createDao(
    senderAccount,
    unitPrice,
    nbShares,
    votingPeriod,
    gracePeriod,
    ETH_TOKEN,
    false,
    members[0].address
  );

  await dao.potentialNewMember(members[0].address);

  const votingAddress = await dao.getAdapterAddress(sha3("voting"));
  const batchVoting = await BatchVotingContract.new(votingAddress, 1);
  await dao.removeAdapter(sha3("voting"));
  await dao.addAdapter(
    sha3("voting"),
    batchVoting.address,
    entryDao("voting", dao, batchVoting, {}).flags
  );

  await batchVoting.configureDao(
    dao.address,
    votingPeriod,
    gracePeriod,
    { from: senderAccount, gasPrice: toBN("0") }
  );
  await dao.finalizeDao({ from: senderAccount, gasPrice: toBN("0") });

  return { dao, voting: batchVoting };
}

contract("LAOLAND - Batch Voting Module", async (accounts) => {

  it("should be possible to propose a new voting by signing the proposal hash", async () => {
    const myAccount = accounts[1];
    let { dao, voting } = await createBatchVotingDao(myAccount);

    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    let blockNumber = await web3.eth.getBlockNumber();
    const proposalPayload = {
      name: "some proposal",
      body: "this is my proposal",
      choices: ["yes", "no"],
      start: Math.floor(new Date().getTime() / 1000),
      end: Math.floor(new Date().getTime() / 1000) + 10000,
      snapshot: blockNumber.toString(),
    };

    const space = "laoland";

    const proposalData = {
      type: "proposal",
      timestamp: Math.floor(new Date().getTime() / 1000),
      space,
      payload: proposalPayload,
    };

    const chainId = 1;
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
      "0x1",
      members[1].address,
      SHARES,
      sharePrice.mul(toBN(3)).add(remaining),
      {
        from: myAccount,
        value: sharePrice.mul(toBN("3")).add(remaining),
        gasPrice: toBN("0"),
      }
    );

    console.log(proposalData);

    await onboarding.sponsorProposal(
      dao.address,
      "0x1",
      prepareVoteProposalData(proposalData)
    );

    const voteEntry = await createVote(proposalHash, members[0].address, true);

    voteEntry.sig = signer(voteEntry, dao.address, onboarding.address, chainId);
    assert.equal(
      true,
      validateMessage(
        voteEntry,
        members[0].address,
        dao.address,
        onboarding.address,
        chainId,
        voteEntry.sig
      )
    );

    const { voteResultTree, votes } = await prepareVoteResult(
      [voteEntry],
      dao,
      bank,
      onboarding.address,
      chainId,
      proposalPayload.snapshot
    );
    const result = toStepNode(
      votes[0],
      dao.address,
      onboarding.address,
      chainId,
      voteResultTree
    );

    result.rootSig = signer(
      { root: voteResultTree.getHexRoot(), type: "result" },
      dao.address,
      onboarding.address,
      chainId
    );

    const { types } = getVoteStepDomainDefinition(
      dao.address,
      myAccount,
      chainId
    );
    //Checking vote result hash
    const solVoteResultType = await voting.VOTE_RESULT_NODE_TYPE();
    const jsVoteResultType = TypedDataUtils.encodeType("Message", types);
    assert.equal(solVoteResultType, jsVoteResultType);

    const hashStruct =
      "0x" +
      TypedDataUtils.hashStruct("Message", result, types).toString("hex");
    const solidityHash = await voting.hashVotingResultNode(result);
    assert.equal(hashStruct, solidityHash);

    const solAddress = await dao.getPriorDelegateKey(
      members[0].address,
      blockNumber
    );
    assert.equal(solAddress, members[0].address);

    await advanceTime(10000);

    await voting.submitVoteResult(
      dao.address,
      "0x1",
      voteResultTree.getHexRoot(),
      result,
      { from: myAccount, gasPrice: toBN("0") }
    );

    await advanceTime(10000);

    await onboarding.processProposal(dao.address, "0x1", {
      from: myAccount,
      gasPrice: toBN("0"),
    });
  });
});
