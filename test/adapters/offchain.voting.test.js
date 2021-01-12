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
  createVote,
  getDomainDefinition,
  TypedDataUtils,
  getMessageERC712Hash,
  prepareProposalPayload,
  prepareVoteProposalData,
  prepareProposalMessage,
  prepareVoteResult,
  toStepNode,
  getVoteStepDomainDefinition,
  validateMessage,
  SigUtilSigner,
} = require("../../utils/offchain_voting.js");

const OffchainVotingContract = artifacts.require(
  "./adapters/OffchainVotingContract"
);

const members = [
  {
    address: "0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8",
    privKey: "c150429d49e8799f119434acd3f816f299a5c7e3891455ee12269cb47a5f987c",
  },
  {
    address: "0x9A60E6865b717f4DA53e0F3d53A30Ac3Dd2C743e",
    privKey: "14ecc272f178289e8b119769b4a86ff9ec54457a39a611b20d1c92102aa9bf1b",
  },
  {
    address: "0xc08964fd0cEBCAC1BF73D1457b10fFFD9Ed25d55",
    privKey: "7aa9805ef135bf9b4d67b68ceccdaee8cc937c0784d92b51cf49e6911fc5f787",
  },
];

async function createOffchainVotingDao(
  senderAccount,
  unitPrice = sharePrice,
  nbShares = numberOfShares,
  votingPeriod = 10,
  gracePeriod = 1
) {
  let lib = await FlagHelperLib.new();
  await DaoRegistry.link("FlagHelper", lib.address);
  let dao = await DaoRegistry.new({ from: senderAccount, gasPrice: toBN("0") });
  await dao.initialize(members[0].address, {
    from: senderAccount,
    gasPrice: toBN("0"),
  });
  const daoFactory = await DaoFactory.new(dao.address, {
    from: senderAccount,
    gasPrice: toBN("0"),
  });

  await addDefaultAdapters(dao, unitPrice, nbShares, votingPeriod, gracePeriod);
  const votingAddress = await dao.getAdapterAddress(sha3("voting"));
  const offchainVoting = await OffchainVotingContract.new(votingAddress, 1);
  await daoFactory.updateAdapter(
    dao.address,
    entry("voting", offchainVoting, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
      INTERNAL_TRANSFER: true,
    }),
    { from: senderAccount, gasPrice: toBN("0") }
  );

  await offchainVoting.configureDao(
    dao.address,
    votingPeriod,
    gracePeriod,
    10,
    { from: senderAccount, gasPrice: toBN("0") }
  );
  await dao.finalizeDao({ from: senderAccount, gasPrice: toBN("0") });

  return { dao, voting: offchainVoting };
}

contract("LAOLAND - Offchain Voting Module", async (accounts) => {
  it("should type & hash be consistent for proposals between javascript and solidity", async () => {
    const myAccount = accounts[1];
    let { dao, voting } = await createOffchainVotingDao(myAccount);

    let blockNumber = await web3.eth.getBlockNumber();
    const proposalPayload = {
      type: "proposal",
      name: "some proposal",
      body: "this is my proposal",
      choices: ["yes", "no"],
      start: Math.floor(new Date().getTime() / 1000),
      end: Math.floor(new Date().getTime() / 1000) + 10000,
      snapshot: blockNumber.toString(),
    };

    const proposalData = {
      type: "proposal",
      timestamp: Math.floor(new Date().getTime() / 1000),
      space: "laoland",
      payload: proposalPayload,
      sig: "0x00",
    };
    const chainId = 1;
    let { types, domain } = getDomainDefinition(
      proposalData,
      dao.address,
      myAccount,
      chainId
    );
    //Checking proposal type
    const solProposalMsg = await voting.PROPOSAL_MESSAGE_TYPE();
    const jsProposalMsg = TypedDataUtils.encodeType("Message", types);
    assert.equal(jsProposalMsg, solProposalMsg);

    //Checking payload
    const hashStructPayload =
      "0x" +
      TypedDataUtils.hashStruct(
        "MessagePayload",
        prepareProposalPayload(proposalPayload),
        types,
        true
      ).toString("hex");
    const solidityHashPayload = await voting.hashProposalPayload(
      proposalPayload
    );

    assert.equal(hashStructPayload, solidityHashPayload);
    //Checking entire payload
    const hashStruct =
      "0x" +
      TypedDataUtils.hashStruct(
        "Message",
        prepareProposalMessage(proposalData),
        types
      ).toString("hex");
    const solidityHash = await voting.hashProposalMessage(proposalData);
    assert.equal(hashStruct, solidityHash);

    //Checking domain
    const domainDef = await voting.EIP712_DOMAIN();
    const jsDomainDef = TypedDataUtils.encodeType("EIP712Domain", types);
    assert.equal(jsDomainDef, domainDef);

    //Checking domain separator
    const domainHash = await voting.DOMAIN_SEPARATOR(dao.address, myAccount);
    const jsDomainHash =
      "0x" +
      TypedDataUtils.hashStruct("EIP712Domain", domain, types, true).toString(
        "hex"
      );
    assert.equal(jsDomainHash, domainHash);

    //Checking the actual ERC-712 hash
    const proposalHash = await voting.hashMessage(
      dao.address,
      myAccount,
      proposalData
    );
    assert.equal(
      proposalHash,
      getMessageERC712Hash(proposalData, dao.address, myAccount, chainId)
    );
  });

  it("should type & hash be consistent for votes between javascript and solidity", async () => {
    const myAccount = accounts[1];
    let { dao, voting } = await createOffchainVotingDao(myAccount);
    const chainId = 1;

    const proposalHash = sha3("test");
    const voteEntry = await createVote(proposalHash, myAccount, true);

    let { types } = getDomainDefinition(
      voteEntry,
      dao.address,
      myAccount,
      chainId
    );
    //Checking proposal type
    const solProposalMsg = await voting.VOTE_MESSAGE_TYPE();
    const jsProposalMsg = TypedDataUtils.encodeType("Message", types);
    assert.equal(jsProposalMsg, solProposalMsg);

    //Checking entire payload
    const hashStruct =
      "0x" +
      TypedDataUtils.hashStruct("Message", voteEntry, types).toString("hex");
    const solidityHash = await voting.hashVoteInternal(voteEntry);
    assert.equal(hashStruct, solidityHash);
  });

  it("should be possible to propose a new voting by signing the proposal hash", async () => {
    const myAccount = accounts[1];
    let { dao, voting } = await createOffchainVotingDao(myAccount);

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
    const signer = SigUtilSigner(members[0].privKey);
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

    await onboarding.onboardAndSponsor(
      dao.address,
      "0x0",
      members[1].address,
      SHARES,
      sharePrice.mul(toBN(3)).add(remaining),
      prepareVoteProposalData(proposalData),
      {
        value: sharePrice.mul(toBN("3")).add(remaining),
        gasPrice: toBN("0"),
      }
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

    await voting.submitVoteResult(
      dao.address,
      "0x0",
      voteResultTree.getHexRoot(),
      result,
      { from: myAccount, gasPrice: toBN("0") }
    );
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, "0x0", {
      from: myAccount,
      gasPrice: toBN("0"),
    });
  });
});
