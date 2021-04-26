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
  sha3,
  sharePrice,
  remaining,
  SHARES,
} = require("../../utils/ContractUtil.js");

const {
  proposalIdGenerator,
  advanceTime,
  deployDaoWithOffchainVoting,
  accounts,
  expect,
  takeChainSnapshot,
  revertChainSnapshot,
  web3,
} = require("../../utils/OZTestUtil.js");

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

const daoOwner = accounts[0];
const newMember = members[0];
const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Offchain Voting", () => {
  before("deploy dao", async () => {
    const {
      dao,
      adapters,
      extensions,
      votingHelpers,
    } = await deployDaoWithOffchainVoting({
      owner: daoOwner,
      newMember: newMember.address,
    });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.votingHelpers = votingHelpers;
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(this.snapshotId);
    this.snapshotId = await takeChainSnapshot();
  });

  it("should type & hash be consistent for proposals between javascript and solidity", async () => {
    const dao = this.dao;

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
      space: "molochv3",
      payload: proposalPayload,
      sig: "0x00",
    };
    const chainId = 1;
    let { types, domain } = getDomainDefinition(
      proposalData,
      dao.address,
      daoOwner,
      chainId
    );
    const snapshotContract = this.votingHelpers.snapshotProposalContract;
    //Checking proposal type
    const solProposalMsg = await snapshotContract.PROPOSAL_MESSAGE_TYPE();
    const jsProposalMsg = TypedDataUtils.encodeType("Message", types);
    expect(jsProposalMsg).equal(solProposalMsg);

    //Checking payload
    const hashStructPayload =
      "0x" +
      TypedDataUtils.hashStruct(
        "MessagePayload",
        prepareProposalPayload(proposalPayload),
        types,
        true
      ).toString("hex");
    const solidityHashPayload = await snapshotContract.hashProposalPayload(
      proposalPayload
    );
    expect(solidityHashPayload).equal(hashStructPayload);

    //Checking entire payload
    const hashStruct =
      "0x" +
      TypedDataUtils.hashStruct(
        "Message",
        prepareProposalMessage(proposalData),
        types
      ).toString("hex");
    const solidityHash = await snapshotContract.hashProposalMessage(
      proposalData
    );
    expect(solidityHash).equal(hashStruct);

    //Checking domain
    const domainDef = await snapshotContract.EIP712_DOMAIN();
    const jsDomainDef = TypedDataUtils.encodeType("EIP712Domain", types);
    expect(domainDef).equal(jsDomainDef);

    //Checking domain separator
    const domainHash = await snapshotContract.DOMAIN_SEPARATOR(
      dao.address,
      daoOwner
    );
    const jsDomainHash =
      "0x" +
      TypedDataUtils.hashStruct("EIP712Domain", domain, types, true).toString(
        "hex"
      );
    expect(domainHash).equal(jsDomainHash);

    //Checking the actual ERC-712 hash
    const proposalHash = await snapshotContract.hashMessage(
      dao.address,
      daoOwner,
      proposalData
    );
    expect(
      getMessageERC712Hash(proposalData, dao.address, daoOwner, chainId)
    ).equal(proposalHash);
  });

  it("should type & hash be consistent for votes between javascript and solidity", async () => {
    const chainId = 1;
    const dao = this.dao;
    const snapshotContract = this.votingHelpers.snapshotProposalContract;

    const proposalHash = sha3("test");
    const voteEntry = await createVote(proposalHash, daoOwner, true);

    const { types } = getDomainDefinition(
      voteEntry,
      dao.address,
      daoOwner,
      chainId
    );

    //Checking proposal type
    const solProposalMsg = await snapshotContract.VOTE_MESSAGE_TYPE();
    const jsProposalMsg = TypedDataUtils.encodeType("Message", types);
    expect(jsProposalMsg).equal(solProposalMsg);

    //Checking entire payload
    const hashStruct =
      "0x" +
      TypedDataUtils.hashStruct("Message", voteEntry, types).toString("hex");
    const solidityHash = await snapshotContract.hashVoteInternal(voteEntry);
    expect(hashStruct).equal(solidityHash);
  });

  it("should be possible to propose a new voting by signing the proposal hash", async () => {
    const dao = this.dao;
    const voting = this.votingHelpers.offchainVoting;
    const onboarding = this.adapters.onboarding;
    const bank = this.extensions.bank;

    const blockNumber = await web3.eth.getBlockNumber();
    const proposalPayload = {
      name: "some proposal",
      body: "this is my proposal",
      choices: ["yes", "no"],
      start: Math.floor(new Date().getTime() / 1000),
      end: Math.floor(new Date().getTime() / 1000) + 10000,
      snapshot: blockNumber.toString(),
    };

    const space = "molochv3";

    const proposalData = {
      type: "proposal",
      timestamp: Math.floor(new Date().getTime() / 1000),
      space,
      payload: proposalPayload,
    };

    const chainId = 1;
    //signer for daoOwner (its private key)
    const signer = SigUtilSigner(newMember.privKey);
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

    const proposalId = getProposalCounter();
    await onboarding.onboard(
      dao.address,
      proposalId,
      members[1].address,
      SHARES,
      sharePrice.mul(toBN(3)).add(remaining),
      {
        from: daoOwner,
        value: sharePrice.mul(toBN("3")).add(remaining),
        gasPrice: toBN("0"),
      }
    );

    await onboarding.sponsorProposal(
      dao.address,
      proposalId,
      prepareVoteProposalData(proposalData, web3),
      { from: daoOwner }
    );

    const voteEntry = await createVote(proposalHash, newMember.address, true);
    voteEntry.sig = signer(voteEntry, dao.address, onboarding.address, chainId);
    expect(
      validateMessage(
        voteEntry,
        newMember.address,
        dao.address,
        onboarding.address,
        chainId,
        voteEntry.sig
      )
    ).equal(true);

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
      daoOwner,
      chainId
    );
    //Checking vote result hash
    const solVoteResultType = await voting.VOTE_RESULT_NODE_TYPE();
    const jsVoteResultType = TypedDataUtils.encodeType("Message", types);
    expect(jsVoteResultType).equal(solVoteResultType);

    const hashStruct =
      "0x" +
      TypedDataUtils.hashStruct("Message", result, types).toString("hex");
    const solidityHash = await voting.hashVotingResultNode(result);
    expect(hashStruct).equal(solidityHash);

    const solAddress = await dao.getPriorDelegateKey(
      newMember.address,
      blockNumber
    );
    expect(solAddress).equal(newMember.address);

    await advanceTime(10000);

    await voting.submitVoteResult(
      dao.address,
      proposalId,
      voteResultTree.getHexRoot(),
      result,
      { from: daoOwner, gasPrice: toBN("0") }
    );

    await advanceTime(10000);

    await onboarding.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    //TODO check result?
  });
});
