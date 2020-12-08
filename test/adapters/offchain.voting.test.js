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
  SigUtilSigner
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
  await DaoRegistry.link("FlagHelper", lib.address);
  let dao = await DaoRegistry.new({from: senderAccount, gasPrice: toBN("0")});
  await dao.initialize(senderAccount, {
    from: senderAccount,
    gasPrice: toBN("0"),
  });
  const daoFactory = await DaoFactory.new(dao.address, {from: senderAccount, gasPrice: toBN("0")});

  await addDefaultAdapters(dao, unitPrice, nbShares, votingPeriod, gracePeriod);
  const votingAddress = await dao.getAdapterAddress(sha3("voting"));
  const offchainVoting = await OffchainVotingContract.new(votingAddress, 1);
  await daoFactory.updateAdapter(
    dao.address,
    entry("voting", offchainVoting, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
      INTERNAL_TRANSFER: true,
    }), {from: senderAccount, gasPrice: toBN("0")}
  );

  await offchainVoting.configureDao(dao.address, votingPeriod, gracePeriod, 10, {from: senderAccount, gasPrice: toBN("0")});
  await dao.finalizeDao({from: senderAccount, gasPrice: toBN("0")});
  return {dao, voting: offchainVoting};
}

contract("LAOLAND - Offchain Voting Module", async (accounts) => {
  it("should type & hash be consistent for proposals between javascript and solidity", async () => {
    const myAccount = accounts[1];
    let {dao, voting} = await createOffchainVotingDao(myAccount);
    
    let blockNumber = await web3.eth.getBlockNumber();
    const proposalPayload = {
      type: 'proposal',
      name: 'some proposal',
      body: 'this is my proposal',
      choices: ['yes', 'no'],
      start: Math.floor(new Date().getTime() / 1000),
      end: Math.floor(new Date().getTime() / 1000) + 10000 ,
      snapshot: blockNumber.toString()
    };

    const proposalData = {
      type: 'proposal',
      timestamp: Math.floor(new Date().getTime() / 1000),
      space: "laoland",
      payload : proposalPayload,
      sig: '0x00'
    };
    const chainId = 1;
    let {types, domain} = getDomainDefinition(proposalData, dao.address, myAccount, chainId);
    //Checking proposal type
    const solProposalMsg = await voting.PROPOSAL_MESSAGE_TYPE();
    const jsProposalMsg = TypedDataUtils.encodeType('Message', types);
    assert.equal(jsProposalMsg, solProposalMsg);

    //Checking payload
    const hashStructPayload = '0x' + TypedDataUtils.hashStruct('MessagePayload', prepareProposalPayload(proposalPayload), types, true).toString('hex');
    const solidityHashPayload = await voting.hashProposalPayload(proposalPayload);

    assert.equal(hashStructPayload, solidityHashPayload);
    //Checking entire payload
    const hashStruct = '0x' + TypedDataUtils.hashStruct("Message", prepareProposalMessage(proposalData), types).toString('hex');
    const solidityHash = await voting.hashProposalMessage(proposalData);
    assert.equal(hashStruct, solidityHash);
    
    //Checking domain
    const domainDef = await voting.EIP712_DOMAIN();
    const jsDomainDef = TypedDataUtils.encodeType('EIP712Domain', types);
    assert.equal(jsDomainDef, domainDef);

    //Checking domain separator
    const domainHash = await voting.DOMAIN_SEPARATOR(dao.address, myAccount);
    const jsDomainHash = '0x' + TypedDataUtils.hashStruct('EIP712Domain', domain, types, true).toString('hex');
    assert.equal(jsDomainHash, domainHash);

    //Checking the actual ERC-712 hash
    const proposalHash = await voting.hashMessage(dao.address, myAccount, proposalData);
    assert.equal(proposalHash, getMessageERC712Hash(proposalData, dao.address, myAccount, chainId));    
  });

  it("should type & hash be consistent for votes between javascript and solidity", async () => {
    const myAccount = accounts[1];
    let {dao, voting} = await createOffchainVotingDao(myAccount);
    const chainId = 1;

    const proposalHash = sha3("test");
    const voteEntry = await createVote(proposalHash, myAccount, true);

    let {types} = getDomainDefinition(voteEntry, dao.address, myAccount, chainId);
    //Checking proposal type
    const solProposalMsg = await voting.VOTE_MESSAGE_TYPE();
    const jsProposalMsg = TypedDataUtils.encodeType('Message', types);
    assert.equal(jsProposalMsg, solProposalMsg);

    //Checking entire payload
    const hashStruct = '0x' + TypedDataUtils.hashStruct("Message", voteEntry, types).toString('hex');
    const solidityHash = await voting.hashVoteInternal(voteEntry);
    assert.equal(hashStruct, solidityHash);
  });

  it("should be possible to propose a new voting by signing the proposal hash", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    let {dao, voting} = await createOffchainVotingDao(myAccount);
    
    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    let blockNumber = await web3.eth.getBlockNumber();
    const proposalPayload = {
      name: 'some proposal',
      body: 'this is my proposal',
      choices: ['yes', 'no'],
      start: Math.floor(new Date().getTime() / 1000),
      end: Math.floor(new Date().getTime() / 1000) + 10000,
      snapshot: blockNumber.toString()
    };

    const space = 'laoland';

    const proposalData = {
      type: 'proposal',
      timestamp: Math.floor(new Date().getTime() / 1000),
      space,
      payload : proposalPayload
    };
    
    const chainId = 1;
    //signer for myAccount (its private key)
    const signer = SigUtilSigner("6c6eda7e56a1d132f09eb4e63e4d846b0a00f8e2c5465635172380ad1a67b77e");
    //const signer = Web3JsSigner(web3, myAccount);
    proposalData.sig =  await signer(proposalData, dao.address, onboarding.address, chainId);
    
    const data = prepareVoteProposalData(proposalData);
    
    await onboarding.onboardAndSponsor(dao.address,
      otherAccount,
      SHARES,
      sharePrice.mul(toBN(3)).add(remaining),
      data,
      {
        from: otherAccount,
        value: sharePrice.mul(toBN("3")).add(remaining),
        gasPrice: toBN("0"),
      })
    //TODO: actually do the voting
    const proposalHash = getMessageERC712Hash(proposalData, dao.address, myAccount, chainId).toString('hex');

    const voteEntry = await createVote(
      proposalHash,
      myAccount,
      true
    );
    
    voteEntry.sig = signer(voteEntry, dao.address, onboarding.address, chainId);
    const {voteResultTree, votes} = await prepareVoteResult([voteEntry], dao, onboarding.address, chainId, proposalPayload.snapshot);
    const result = toStepNode(votes[0], dao.address, onboarding.address, chainId, voteResultTree);

    const {types} = getVoteStepDomainDefinition(dao.address, myAccount, chainId);
    //Checking vote result hash
    const solVoteResultType = await voting.VOTE_RESULT_NODE_TYPE();
    const jsVoteResultType = TypedDataUtils.encodeType("Message", types);
    assert.equal(solVoteResultType, jsVoteResultType);

    const hashStruct = '0x' + TypedDataUtils.hashStruct("Message", result, types).toString('hex');
    const solidityHash = await voting.hashVotingResultNode(result);
    assert.equal(hashStruct, solidityHash);

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
  /*
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
    
    await onboarding.sponsorProposal(
      dao.address,
      0,
      prepareVoteProposalData({
        blockNumber,
      }),
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
  });*/
});
