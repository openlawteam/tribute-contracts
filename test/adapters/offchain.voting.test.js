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
const { expect } = require("chai");
const { utils } = require("ethers");
const {
  toBN,
  toWei,
  sha3,
  soliditySha3,
  fromAscii,
  unitPrice,
  remaining,
  UNITS,
  ZERO_ADDRESS,
} = require("../../utils/contract-util");
const { log } = require("../../utils/log-util");

const {
  proposalIdGenerator,
  advanceTime,
  deployDaoWithOffchainVoting,
  getAccounts,
  takeChainSnapshot,
  revertChainSnapshot,
  web3,
  OffchainVotingHashContract,
  OLToken,
  PixelNFT,
  getCurrentBlockNumber,
  getSigners,
  txSigner,
  expectEvent,
} = require("../../utils/hardhat-test-util");

const {
  createVote,
  getDomainDefinition,
  TypedDataUtils,
  prepareProposalPayload,
  prepareVoteProposalData,
  prepareProposalMessage,
  getVoteStepDomainDefinition,
  BadNodeError,
} = require("../../utils/offchain-voting-util");

const {
  vote,
  buildVoteTree,
  buildVoteTreeWithBadNodes,
  buildProposal,
  buildVotes,
  emptyVote,
  testMembers,
  VotingStrategies,
} = require("../../utils/test-util");

const proposalCounter = proposalIdGenerator().generator;
function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Offchain Voting", () => {
  let accounts, daoOwner, signers;
  const chainId = 1337;
  const members = testMembers;
  const newMember = members[0];
  const invalidStepSignature =
    "0xbe90f2a9a51a554ef37a3bc3f47a1fc8dc29279ff320fa45754f6df165cc692f7cf7ed059edded2c87e95320229420c8e359a498fd89e55a1086a4adf03f73901c";

  before("deploy dao", async () => {
    accounts = await getAccounts();
    signers = await getSigners();
    daoOwner = accounts[0];

    const { dao, adapters, extensions, votingHelpers } =
      await deployDaoWithOffchainVoting({
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

  const onboardMember = async (
    dao,
    bank,
    submitter = members[0],
    newMember,
    printGasUsage = false
  ) => {
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting; //offchain voting
    const blockNumber = await getCurrentBlockNumber();
    const proposalId = getProposalCounter();
    const actionId = onboarding.address;
    const { proposalData } = await buildProposal(
      dao,
      actionId,
      submitter,
      blockNumber,
      chainId
    );

    await onboarding.submitProposal(
      dao.address,
      proposalId,
      newMember.address,
      UNITS,
      unitPrice.mul(toBN(3)).add(remaining),
      prepareVoteProposalData(proposalData, web3),
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    const { rootSig, lastVoteResult, resultHash } = await buildVoteTree(
      dao,
      bank,
      proposalId,
      submitter,
      blockNumber,
      chainId,
      actionId,
      VotingStrategies.AllVotesYes
    );

    const tx = await voting.submitVoteResult(
      dao.address,
      proposalId,
      resultHash,
      submitter.address,
      lastVoteResult,
      rootSig
    );

    const submittedVote = await voting.getVote(dao.address, proposalId);
    expect(Number(submittedVote.snapshot)).to.be.equal(blockNumber);
    expect(submittedVote.reporter).to.be.equal(submitter.address);
    expect(submittedVote.resultRoot).to.be.equal(resultHash);
    expect(submittedVote.nbYes).to.be.equal(lastVoteResult.nbYes);
    expect(submittedVote.nbNo).to.be.equal(lastVoteResult.nbNo);
    expect(Number(submittedVote.startingTime)).to.be.greaterThan(
      proposalData.timestamp
    );
    expect(Number(submittedVote.gracePeriodStartingTime)).to.be.greaterThan(
      proposalData.timestamp
    );
    expect(submittedVote.isChallenged).to.be.false;
    expect(submittedVote.stepRequested).to.be.equal("0");
    expect(submittedVote.forceFailed).to.be.false;
    expect(submittedVote.fallbackVotesCount).to.be.equal("0");

    if (printGasUsage) {
      log(
        `gas used for ( ${proposalId} ) votes: ` +
          new Intl.NumberFormat().format(tx.receipt.gasUsed)
      );
    }

    await advanceTime(10000);

    await onboarding.processProposal(dao.address, proposalId, {
      value: unitPrice.mul(toBN("3")).add(remaining),
    });
  };

  const updateConfiguration = async (
    dao,
    voting,
    configuration,
    bank,
    submitter,
    configs,
    voteStrategy = VotingStrategies.AllVotesYes,
    processProposal = true
  ) => {
    const blockNumber = await getCurrentBlockNumber();
    const proposalId = getProposalCounter();
    const actionId = configuration.address;

    const { proposalData } = await buildProposal(
      dao,
      actionId,
      submitter,
      blockNumber,
      chainId
    );
    const data = prepareVoteProposalData(proposalData, web3);
    await configuration.submitProposal(dao.address, proposalId, configs, data, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const { membersCount, rootSig, lastVoteResult, voteResultTree } =
      await buildVoteTree(
        dao,
        bank,
        proposalId,
        submitter,
        blockNumber,
        chainId,
        actionId,
        voteStrategy,
        null,
        true
      );

    if (processProposal) {
      await voting.submitVoteResult(
        dao.address,
        proposalId,
        voteResultTree.getHexRoot(),
        submitter.address,
        lastVoteResult,
        rootSig
      );

      await advanceTime(10000);

      // The maintainer processes on the new proposal
      await configuration.processProposal(dao.address, proposalId);
    }

    return {
      proposalId,
      voteResultTree,
      blockNumber,
      membersCount,
      lastResult: lastVoteResult,
      submitter: submitter.address,
      rootSig,
    };
  };

  const submitValidVoteResult = async (
    dao,
    bank,
    configuration,
    voting,
    submitter,
    moveBlockTime = true,
    submitVoteResult = true
  ) => {
    const proposalId = getProposalCounter();
    const actionId = configuration.address;

    let blockNumber = await getCurrentBlockNumber();
    const { proposalData } = await buildProposal(
      dao,
      actionId,
      submitter,
      blockNumber,
      chainId
    );

    const configs = [
      {
        key: sha3("config1"),
        numericValue: "10",
        addressValue: ZERO_ADDRESS,
        configType: 0,
      },
    ];
    const data = prepareVoteProposalData(proposalData, web3);
    await configuration.submitProposal(dao.address, proposalId, configs, data, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Only the submitter votes Yes, and attempts to submit the vote result
    const votes = await buildVotes(
      dao,
      bank,
      proposalId,
      submitter,
      blockNumber,
      chainId,
      actionId,
      VotingStrategies.AllVotesYes
    );
    const resultTree = await buildVoteTree(
      dao,
      bank,
      proposalId,
      submitter,
      blockNumber,
      chainId,
      actionId,
      VotingStrategies.AllVotesYes,
      votes,
      moveBlockTime
    );
    await advanceTime(10); // ends the voting period
    // Submit a valid result
    if (submitVoteResult)
      await voting.submitVoteResult(
        dao.address,
        proposalId,
        resultTree.resultHash,
        submitter.address,
        resultTree.lastVoteResult,
        resultTree.rootSig
      );

    return { proposalId, resultTree };
  };

  const expectChallengeProposal = async (
    dao,
    voting,
    proposalId,
    voteResultTree,
    submitter,
    challengeCall
  ) => {
    const challengeProposalId = soliditySha3(
      proposalId,
      voteResultTree.getHexRoot()
    );

    await expectEvent(
      challengeCall,
      "ResultChallenged",
      dao.address,
      proposalId,
      voteResultTree.getHexRoot(),
      challengeProposalId
    );

    // The vote result should be set to challenged
    const storedVote = await voting.getVote(dao.address, proposalId);
    expect(storedVote.isChallenged).to.be.true;

    // submitter should be in jail after challenging a missing step
    const notJailed = await dao.notJailed(submitter.address);
    expect(notJailed).to.be.false;

    // A challenge proposal must be created if the challenge call was successful
    const challengeProposal = await dao.proposals(challengeProposalId);
    expect(challengeProposal.flags.toString()).to.be.equal("1");
    expect(challengeProposal.adapterAddress).to.be.equal(voting.address);
  };

  describe("General", async () => {
    it("should not be possible to fail a proposal if the sender is not the owner", async () => {
      const voting = this.adapters.voting;
      const proposalId = getProposalCounter();
      await expect(
        txSigner(signers[2], voting).adminFailProposal(
          this.dao.address,
          proposalId
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should not be possible to fail a proposal that did not start", async () => {
      const voting = this.adapters.voting;
      const proposalId = getProposalCounter();
      await expect(
        voting.adminFailProposal(this.dao.address, proposalId)
      ).to.be.revertedWith("proposal has not started yet");
    });

    it("should be possible to get the adapter name", async () => {
      const voting = this.adapters.voting;
      expect(await voting.getAdapterName()).to.be.equal(
        "OffchainVotingContract"
      );
    });

    it("should return an empty challenge details if there is no proposal challenged", async () => {
      const voting = this.adapters.voting;
      const proposalId = getProposalCounter();
      const challengeDetails = await voting.getChallengeDetails(
        this.dao.address,
        proposalId
      );
      expect(challengeDetails[0].toString()).to.be.equal("0");
      expect(challengeDetails[1]).to.be.equal(ZERO_ADDRESS);
    });

    it("should return the proposal submitter address", async () => {
      const voting = this.adapters.voting;
      const onboarding = this.adapters.onboarding;
      const submitter = members[0];
      const blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        this.dao,
        onboarding.address,
        submitter,
        blockNumber,
        chainId
      );

      const senderAddress = await voting.getSenderAddress(
        this.dao.address,
        onboarding.address,
        prepareVoteProposalData(proposalData, web3),
        daoOwner
      );
      expect(senderAddress).to.be.equal(submitter.address);
    });

    it("should return 0 if the vote has not started", async () => {
      const voting = this.adapters.voting;
      const proposalId = getProposalCounter();
      const voteResult = await voting.voteResult(this.dao.address, proposalId);
      expect(voteResult.toString()).to.be.equal("0");
      //todo: 1: tie, 2: pass, 3: not pass, 4: in progress
    });

    it("should be possible to onboard a new member by submitting a vote result and processing the proposal", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const submitter = members[0];
      for (var i = 1; i < members.length; i++) {
        await onboardMember(dao, bank, submitter, members[i], true);
      }
    });

    it("should type & hash be consistent for proposals between javascript and solidity", async () => {
      const dao = this.dao;
      const blockNumber = await getCurrentBlockNumber();

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
        space: "tribute",
        payload: proposalPayload,
        submitter: members[0].address,
        sig: "0x00",
      };

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
    });

    it("should type & hash be consistent for votes between javascript and solidity", async () => {
      const dao = this.dao;
      const offchainVoting = this.votingHelpers.offchainVoting;
      const snapshotContract = this.votingHelpers.snapshotProposalContract;

      const proposalHash = sha3("test");
      const voteEntry = await createVote(proposalHash, 1, 1);

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

      const nodeDef = getVoteStepDomainDefinition(
        dao.address,
        dao.address,
        chainId
      );

      const ovHashAddr = await offchainVoting.ovHash();
      const ovHash = await OffchainVotingHashContract.at(ovHashAddr);

      const solNodeDef = await ovHash.VOTE_RESULT_NODE_TYPE();
      const jsNodeMsg = TypedDataUtils.encodeType("Message", nodeDef.types);

      expect(solNodeDef).equal(jsNodeMsg);
    });

    it("should not be possible to send ETH to the adapter via receive function", async () => {
      const adapter = this.adapters.voting;
      await expect(
        web3.eth.sendTransaction({
          to: adapter.address,
          from: daoOwner,
          gasPrice: toBN("0"),
          value: toWei("1"),
        })
      ).to.be.revertedWith("revert");
    });

    it("should not be possible to send ETH to the adapter via fallback function", async () => {
      const adapter = this.adapters.voting;
      await expect(
        web3.eth.sendTransaction({
          to: adapter.address,
          from: daoOwner,
          gasPrice: toBN("0"),
          value: toWei("1"),
          data: fromAscii("should go to fallback func"),
        })
      ).to.be.revertedWith("revert");
    });

    it("should be possible forcefully fail a proposal", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        true
      );

      let storedVote = await voting.getVote(dao.address, result.proposalId);
      expect(storedVote.forceFailed).to.be.false;

      await voting.adminFailProposal(dao.address, result.proposalId);

      storedVote = await voting.getVote(dao.address, result.proposalId);
      expect(storedVote.forceFailed).to.be.true;
    });

    it("should not be possible forcefully fail a proposal that does not exist", async () => {
      const dao = this.dao;
      const voting = this.adapters.voting;
      const proposalId = getProposalCounter();

      await expect(
        voting.adminFailProposal(dao.address, proposalId)
      ).to.be.revertedWith("proposal has not started yet");
    });

    it("should not be possible forcefully fail a proposal if the caller is not the owner", async () => {
      const dao = this.dao;
      const voting = this.adapters.voting;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        true
      );

      await expect(
        txSigner(signers[2], voting).adminFailProposal(
          dao.address,
          result.proposalId
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Submit Vote Result", async () => {
    it("should be possible to submit a valid vote result", async () => {
      const daoOwnerSubmitter = members[0];

      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      let blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      // Only the submitter votes Yes, and attempts to submit the vote result
      const votes = await buildVotes(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.AllVotesYes
      );
      const { lastVoteResult, rootSig, resultHash } = await buildVoteTree(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.AllVotesYes,
        votes
      );
      // Submit a valid result
      const { logs } = await voting.submitVoteResult(
        dao.address,
        proposalId,
        resultHash,
        daoOwnerSubmitter.address,
        lastVoteResult,
        rootSig
      );
      const e = logs[0];
      // Check the event data
      expect(e.event).to.be.equal("VoteResultSubmitted");
      expect(e.args[0]).to.be.equal(dao.address);
      expect(e.args[1]).to.be.equal(proposalId);
      expect(e.args[2].toString()).to.be.equal(lastVoteResult.nbNo);
      expect(e.args[3].toString()).to.be.equal(lastVoteResult.nbYes);
      expect(e.args[4]).to.be.equal(resultHash);
      expect(e.args[5]).to.be.equal(daoOwnerSubmitter.address);
      const voteResultStatus = await voting.voteResult(dao.address, proposalId);
      expect(voteResultStatus.toString()).to.be.equal("5"); // Grace Period

      // Check the stored vote data
      const storedVote = await voting.getVote(dao.address, proposalId);
      expect(storedVote.snapshot).to.be.equal(blockNumber.toString());
      expect(storedVote.reporter).to.be.equal(daoOwnerSubmitter.address);
      expect(storedVote.resultRoot).to.be.equal(resultHash);
      expect(storedVote.nbYes).to.be.equal(lastVoteResult.nbYes);
      expect(storedVote.nbNo).to.be.equal(lastVoteResult.nbNo);
      expect(parseInt(storedVote.startingTime)).to.be.greaterThanOrEqual(
        proposalData.timestamp
      );
      expect(parseInt(storedVote.gracePeriodStartingTime)).to.be.greaterThan(
        parseInt(storedVote.startingTime)
      );
      expect(storedVote.isChallenged).to.be.false;
      expect(storedVote.stepRequested).to.be.equal("0");
      expect(storedVote.forceFailed).to.be.false;
      expect(storedVote.fallbackVotesCount).to.be.equal("0");
    });

    it("should not be possible for a non member to submit a proposal", async () => {
      const nonMember = members[1];
      const onboarding = this.adapters.onboarding;
      const proposalId = getProposalCounter();
      const actionId = onboarding.address;
      const blockNumber = await getCurrentBlockNumber();

      const { proposalData } = await buildProposal(
        this.dao,
        actionId,
        nonMember,
        blockNumber,
        chainId
      );

      await advanceTime(1000);

      await expect(
        onboarding.submitProposal(
          this.dao.address,
          proposalId,
          newMember.address,
          UNITS,
          unitPrice.mul(toBN(3)).add(remaining),
          prepareVoteProposalData(proposalData, web3),
          {
            from: daoOwner,
            gasPrice: toBN("0"),
          }
        )
      ).to.be.revertedWith("onlyMember");
    });
    it("should not be possible to submit a vote result if the voting period did not start", async () => {
      const daoOwnerSubmitter = members[0];
      const newMember = members[1];

      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      const blockNumber = await getCurrentBlockNumber();

      await advanceTime(10000);

      const { lastVoteResult, resultHash, rootSig } = await buildVoteTree(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId
      );

      // try to submit a vote result before the proposal was actually submitted to the DAO
      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          newMember.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("vote not started");
    });

    it("should not be possible to submit a vote result if the voting period did not ended", async () => {
      const daoOwnerSubmitter = members[0];

      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      let blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      // Only the submitter votes Yes, and attempts to submit the vote result
      const votes = await buildVotes(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.SingleYesVote
      );
      const { lastVoteResult, rootSig, resultHash } = await buildVoteTree(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.SingleYesVote,
        votes,
        false // do not advance time
      );

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          daoOwnerSubmitter.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("not ready for vote result");
    });

    it("should not be possible to submit a vote result if the grace period is over", async () => {
      const daoOwnerSubmitter = members[0];

      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      let blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      // Only the submitter votes Yes, and attempts to submit the vote result
      const votes = await buildVotes(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.AllVotesYes
      );
      const { lastVoteResult, rootSig, resultHash } = await buildVoteTree(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.AllVotesYes,
        votes,
        true // do not advance time
      );
      // Submit a valid result during the voting period to start the grace period
      await voting.submitVoteResult(
        dao.address,
        proposalId,
        resultHash,
        daoOwnerSubmitter.address,
        lastVoteResult,
        rootSig
      );

      // Attempt to submit another result during the grace period
      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          daoOwnerSubmitter.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("grace period finished");
    });

    it("should not be possible to submit a vote result if the submitter is not an active member", async () => {
      const daoOwnerSubmitter = members[0];
      const newMember = members[1];

      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      const blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      await advanceTime(10000);

      const { lastVoteResult, rootSig, resultHash } = await buildVoteTree(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId
      );

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          newMember.address, //not active member
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("not active member");
    });

    it("should not be possible to submit a vote result if the number of votes is greater than the number of dao members", async () => {
      const daoOwnerSubmitter = members[0];

      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      const newMember = members[2];

      await onboardMember(dao, bank, daoOwnerSubmitter, newMember);

      await advanceTime(1000);

      let blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      await advanceTime(15000);

      // Only the submitter votes Yes, and attempts to submit the vote result
      let votes = await buildVotes(
        dao,
        bank,
        proposalId,
        newMember,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.SingleYesVote
      );
      // Add an empty to vote to mess with the voting tree
      votes.push(await emptyVote(proposalId));
      const { lastVoteResult, rootSig, resultHash, membersCount } =
        await buildVoteTree(
          dao,
          bank,
          proposalId,
          newMember,
          blockNumber,
          chainId,
          actionId,
          VotingStrategies.SingleYesVote,
          votes
        );

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          newMember.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("bad node");

      const getBadNodeErrorResponse = await voting.getBadNodeError(
        dao.address,
        proposalId,
        // `bool submitNewVote`
        true,
        resultHash,
        blockNumber,
        // `gracePeriodStartingTime` should be `0` as `submitNewVote` is `true`
        0,
        membersCount,
        lastVoteResult
      );

      const errorCode = getBadNodeErrorResponse.toString();
      expect(BadNodeError[parseInt(errorCode)]).equal("INDEX_OUT_OF_BOUND");
    });

    it("should not be possible to submit a vote result if the number of votes is lower than the number of dao members", async () => {
      const daoOwnerSubmitter = members[0];

      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      const newMember = members[2];

      await onboardMember(dao, bank, daoOwnerSubmitter, newMember);

      await advanceTime(1000);

      let blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      await advanceTime(15000);

      // Only the submitter votes Yes, and attempts to submit the vote result
      let votes = await buildVotes(
        dao,
        bank,
        proposalId,
        newMember,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.SingleYesVote
      );
      // TODO remove a vote to mess with the voting tree
      votes.push(await emptyVote(proposalId));
      const { lastVoteResult, rootSig, resultHash, membersCount } =
        await buildVoteTree(
          dao,
          bank,
          proposalId,
          newMember,
          blockNumber,
          chainId,
          actionId,
          VotingStrategies.SingleYesVote,
          votes
        );

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          newMember.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("bad node");

      const getBadNodeErrorResponse = await voting.getBadNodeError(
        dao.address,
        proposalId,
        // `bool submitNewVote`
        true,
        resultHash,
        blockNumber,
        // `gracePeriodStartingTime` should be `0` as `submitNewVote` is `true`
        0,
        membersCount,
        lastVoteResult
      );

      const errorCode = getBadNodeErrorResponse.toString();
      expect(BadNodeError[parseInt(errorCode)]).equal("INDEX_OUT_OF_BOUND");
    });

    it("should not be possible to submit a vote result with a tampered voting weight", async () => {
      const daoOwnerSubmitter = members[0];
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      const blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      const { lastVoteResult, rootSig, resultHash } = await buildVoteTree(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.AllVotesYes
      );

      // Changing the voting result to invalidate the node signature
      lastVoteResult.nbYes = "1000";

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          daoOwnerSubmitter.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("invalid node proof");
    });

    it("should not be possible to submit a vote result with an index equal to the members count", async () => {
      const daoOwnerSubmitter = members[0];
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      const blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      // Only the submitter votes Yes, and attempts to submit the vote result
      const votes = await buildVotes(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.AllVotesYes
      );
      // Add a fake empty vote to generate a voting tree with the latest index equals to the member count
      votes.push(await emptyVote(proposalId));

      const { lastVoteResult, rootSig, resultHash, membersCount } =
        await buildVoteTree(
          dao,
          bank,
          proposalId,
          daoOwnerSubmitter,
          blockNumber,
          chainId,
          actionId,
          VotingStrategies.AllVotesYes,
          votes
        );

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          daoOwnerSubmitter.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("bad node");

      const getBadNodeErrorResponse = await voting.getBadNodeError(
        dao.address,
        proposalId,
        // `bool submitNewVote`
        true,
        resultHash,
        blockNumber,
        // `gracePeriodStartingTime` should be `0` as `submitNewVote` is `true`
        0,
        membersCount,
        lastVoteResult
      );

      const errorCode = getBadNodeErrorResponse.toString();
      expect(BadNodeError[parseInt(errorCode)]).equal("INDEX_OUT_OF_BOUND");
    });

    it("should not be possible to submit a vote result with an index greater than the members count", async () => {
      const daoOwnerSubmitter = members[0];
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      const blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      // Only the submitter votes Yes, and attempts to submit the vote result
      const votes = await buildVotes(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.AllVotesYes
      );
      // Add some fake empty votes to generate a voting tree with the latest index greater than the members count
      votes.push(await emptyVote(proposalId));
      votes.push(await emptyVote(proposalId));
      votes.push(await emptyVote(proposalId));
      votes.push(await emptyVote(proposalId));

      const { lastVoteResult, rootSig, resultHash, membersCount } =
        await buildVoteTree(
          dao,
          bank,
          proposalId,
          daoOwnerSubmitter,
          blockNumber,
          chainId,
          actionId,
          VotingStrategies.AllVotesYes,
          votes
        );

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          daoOwnerSubmitter.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("bad node");

      const getBadNodeErrorResponse = await voting.getBadNodeError(
        dao.address,
        proposalId,
        // `bool submitNewVote`
        true,
        resultHash,
        blockNumber,
        // `gracePeriodStartingTime` should be `0` as `submitNewVote` is `true`
        0,
        membersCount,
        lastVoteResult
      );

      const errorCode = getBadNodeErrorResponse.toString();
      expect(BadNodeError[parseInt(errorCode)]).equal("INDEX_OUT_OF_BOUND");
    });

    it("should not be possible to submit a vote result with an invalid vote choice", async () => {
      const daoOwnerSubmitter = members[0];
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      const blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      // Only the submitter votes Yes, and attempts to submit the vote result
      const votes = await buildVotes(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.AllVotesYes,
        null,
        100 //invalid vote choice
      );

      const { lastVoteResult, rootSig, resultHash, membersCount } =
        await buildVoteTree(
          dao,
          bank,
          proposalId,
          daoOwnerSubmitter,
          blockNumber,
          chainId,
          actionId,
          VotingStrategies.AllVotesYes,
          votes
        );

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          daoOwnerSubmitter.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("bad node");

      const getBadNodeErrorResponse = await voting.getBadNodeError(
        dao.address,
        proposalId,
        // `bool submitNewVote`
        true,
        resultHash,
        blockNumber,
        // `gracePeriodStartingTime` should be `0` as `submitNewVote` is `true`
        0,
        membersCount,
        lastVoteResult
      );

      const errorCode = getBadNodeErrorResponse.toString();
      expect(BadNodeError[parseInt(errorCode)]).equal("INVALID_CHOICE");
    });

    it("should not be possible to submit a vote result with the wrong proposal id", async () => {
      const daoOwnerSubmitter = members[0];
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      const blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      const wrongProposalId = await getProposalCounter();
      const votes = await buildVotes(
        dao,
        bank,
        wrongProposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.AllVotesYes
      );

      const { lastVoteResult, rootSig, resultHash, membersCount } =
        await buildVoteTree(
          dao,
          bank,
          wrongProposalId,
          daoOwnerSubmitter,
          blockNumber,
          chainId,
          actionId,
          VotingStrategies.AllVotesYes,
          votes
        );

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId, // submits the correct one, but the vote uses the wrong one
          resultHash,
          daoOwnerSubmitter.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("bad node");

      const getBadNodeErrorResponse = await voting.getBadNodeError(
        dao.address,
        proposalId,
        // `bool submitNewVote`
        true,
        resultHash,
        blockNumber,
        // `gracePeriodStartingTime` should be `0` as `submitNewVote` is `true`
        0,
        membersCount,
        lastVoteResult
      );

      const errorCode = getBadNodeErrorResponse.toString();
      expect(BadNodeError[parseInt(errorCode)]).equal("WRONG_PROPOSAL_ID");
    });

    it("should not be possible to submit a vote result with a bad signature", async () => {
      const daoOwnerSubmitter = members[0];
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      const blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      const votes = await buildVotes(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.AllVotesYes,
        null, // votingWeight
        null, // voteChoice
        // invalid signature
        invalidStepSignature
      );

      const { lastVoteResult, rootSig, resultHash, membersCount } =
        await buildVoteTree(
          dao,
          bank,
          proposalId,
          daoOwnerSubmitter,
          blockNumber,
          chainId,
          actionId,
          VotingStrategies.AllVotesYes,
          votes
        );

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId, // submits the correct one, but the vote uses the wrong one
          resultHash,
          daoOwnerSubmitter.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("bad node");

      const getBadNodeErrorResponse = await voting.getBadNodeError(
        dao.address,
        proposalId,
        // `bool submitNewVote`
        true,
        resultHash,
        blockNumber,
        // `gracePeriodStartingTime` should be `0` as `submitNewVote` is `true`
        0,
        membersCount,
        lastVoteResult
      );

      const errorCode = getBadNodeErrorResponse.toString();
      expect(BadNodeError[parseInt(errorCode)]).equal("BAD_SIGNATURE");
    });

    it("should not be possible to submit a vote result with an invalid result signature", async () => {
      const daoOwnerSubmitter = members[0];
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      const blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      const { lastVoteResult, rootSig, resultHash } = await buildVoteTree(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.AllVotesYes
      );

      // Changing the voting result signature to break the signature verification
      const tamperedSignature = rootSig + "0";

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          daoOwnerSubmitter.address,
          lastVoteResult,
          tamperedSignature
        )
      ).to.be.revertedWith("invalid result signature");
    });

    it("should not be possible to submit a vote result if no body voted", async () => {
      const daoOwnerSubmitter = members[0];
      const newMember = members[1];

      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const configuration = this.adapters.configuration;
      const proposalId = getProposalCounter();
      const actionId = configuration.address;
      const voting = this.adapters.voting;

      await onboardMember(dao, bank, daoOwnerSubmitter, newMember);
      await advanceTime(1000);

      const blockNumber = await getCurrentBlockNumber();
      const { proposalData } = await buildProposal(
        dao,
        actionId,
        daoOwnerSubmitter,
        blockNumber,
        chainId
      );

      const configs = [
        {
          key: sha3("config1"),
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];
      const data = prepareVoteProposalData(proposalData, web3);
      await configuration.submitProposal(
        dao.address,
        proposalId,
        configs,
        data,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      );

      await advanceTime(15000);

      const { lastVoteResult, rootSig, resultHash } = await buildVoteTree(
        dao,
        bank,
        proposalId,
        daoOwnerSubmitter,
        blockNumber,
        chainId,
        actionId,
        VotingStrategies.NoBodyVotes
      );

      await expect(
        voting.submitVoteResult(
          dao.address,
          proposalId,
          resultHash,
          daoOwnerSubmitter.address,
          lastVoteResult,
          rootSig
        )
      ).to.be.revertedWith("result weight too low");
    });
  });

  describe("Request Vote Step", async () => {
    it("should be possible to request a vote valid vote step during the grace period", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      let storedVote = await voting.getVote(dao.address, result.proposalId);
      let initialGracePeriod = parseInt(storedVote.gracePeriodStartingTime);

      expect(storedVote.stepRequested).to.be.equal("0");
      expect(storedVote.isChallenged).to.be.false;

      // Request the first step (index 1)
      await voting.requestStep(dao.address, result.proposalId, 1);

      storedVote = await voting.getVote(dao.address, result.proposalId);

      let secondGracePeriod = parseInt(storedVote.gracePeriodStartingTime);
      expect(secondGracePeriod).to.be.greaterThan(initialGracePeriod);
      expect(storedVote.stepRequested).to.be.equal("1");
      expect(storedVote.isChallenged).to.be.false;
    });

    it("should not be possible to request a step with index 0", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );
      await expect(
        voting.requestStep(dao.address, result.proposalId, 0)
      ).to.be.revertedWith("index out of bound");
    });

    it("should not be possible to request a step with an index greater than the number of DAO members", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );
      const index = parseInt(result.resultTree.membersCount);
      await expect(
        voting.requestStep(dao.address, result.proposalId, index)
      ).to.be.revertedWith("index out of bound");
    });

    it("should not be possible to request the a step if another step was already requested", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );
      await voting.requestStep(dao.address, result.proposalId, 1);
      await expect(
        voting.requestStep(dao.address, result.proposalId, 2)
      ).to.be.revertedWith("other step already requested");
    });

    it("should not be possible for a non member to request a vote step", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );
      await expect(
        txSigner(signers[5], voting).requestStep(
          dao.address,
          result.proposalId,
          1
        )
      ).to.be.revertedWith("onlyMember");
    });

    it("should not be possible to request a vote step that was already requested", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );
      await voting.requestStep(dao.address, result.proposalId, 1);
      await expect(
        voting.requestStep(dao.address, result.proposalId, 1)
      ).to.be.revertedWith("step already requested");
    });

    it("should not be possible to request a vote step after the grace period is over", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter
      );
      await advanceTime(10); // ends the grace period
      await expect(
        voting.requestStep(dao.address, result.proposalId, 1)
      ).to.be.revertedWith("should be in grace period");
    });
  });

  describe("Provide Vote Step", async () => {
    it("should be possible to provide a valid vote step", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      // Request the first step (index 1)
      await voting.requestStep(dao.address, result.proposalId, 1);
      let storedVote = await voting.getVote(dao.address, result.proposalId);
      expect(storedVote.stepRequested).to.be.equal("1");

      const initialGracePeriod = parseInt(storedVote.gracePeriodStartingTime);

      const voteResults = result.resultTree.votesResults;

      const voteStep1 = voteResults[0];

      // Provide/reveal the vote step one that was requested
      await voting.provideStep(dao.address, configuration.address, voteStep1);

      // After the valid vote step was provided, the grace period should be restarted
      // and the stepRequested should be set to 0, because it was revealed
      storedVote = await voting.getVote(dao.address, result.proposalId);
      const newGracePeriod = parseInt(storedVote.gracePeriodStartingTime);
      expect(newGracePeriod).to.be.greaterThan(initialGracePeriod);
      expect(storedVote.stepRequested).to.be.equal("0");
      expect(storedVote.isChallenged).to.be.false;
    });

    it("should not be possible to provide a vote step with index zero", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      // Request the first step (index 1)
      await voting.requestStep(dao.address, result.proposalId, 1);
      let storedVote = await voting.getVote(dao.address, result.proposalId);
      expect(storedVote.stepRequested).to.be.equal("1");

      const voteResults = result.resultTree.votesResults;
      const voteStep1 = voteResults[0];

      // Invalid index, because it must start from 1
      voteStep1.index = 0;

      await expect(
        voting.provideStep(dao.address, configuration.address, voteStep1)
      ).to.be.revertedWith("wrong step provided");
    });

    it("should not be possible to provide a vote step if it was not requested", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      let storedVote = await voting.getVote(dao.address, result.proposalId);
      // There is no step requested
      expect(storedVote.stepRequested).to.be.equal("0");

      const voteResults = result.resultTree.votesResults;
      const voteStep1 = voteResults[0];

      await expect(
        voting.provideStep(dao.address, configuration.address, voteStep1)
      ).to.be.revertedWith("wrong step provided");
    });

    it("should not be possible to provide a vote step with an invalid proof", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      await voting.requestStep(dao.address, result.proposalId, 1);
      let storedVote = await voting.getVote(dao.address, result.proposalId);
      expect(storedVote.stepRequested).to.be.equal("1");

      const voteResults = result.resultTree.votesResults;
      const voteStep1 = voteResults[0];
      // Set an invalid proof to mimic the behavior of a invalid step
      voteStep1.proof[0] =
        "0x1d2c3a91bdb8c7ccbd7cf5ea1df6c9408f9678deef9bfc27639e8ea9429a3572";

      await expect(
        voting.provideStep(dao.address, configuration.address, voteStep1)
      ).to.be.revertedWith("invalid step proof");
    });
  });

  describe("Challenge Missing Vote Step", async () => {
    it("should be possible to challenge a missing step", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      // Request the first step (index 1)
      await voting.requestStep(dao.address, result.proposalId, 1);

      await advanceTime(10); //ends the grace period

      // Challenge the vote result to indicate it has something wrong
      const call = voting.challengeMissingStep(dao.address, result.proposalId);

      await expectChallengeProposal(
        dao,
        voting,
        result.proposalId,
        result.resultTree.voteResultTree,
        submitter,
        call
      );
    });

    it("should not be possible to challenge a missing step if the step was not requested", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      // Challenge the vote result to indicate it has something wrong
      await expect(
        voting.challengeMissingStep(dao.address, result.proposalId)
      ).to.be.revertedWith("no step request");
    });

    it("should not be possible to challenge a missing step during the grace period", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      // Request the first step (index 1)
      await voting.requestStep(dao.address, result.proposalId, 1);

      // do not advance time, otherwise it will end the grace period

      // Challenge the vote result during the grace period
      await expect(
        voting.challengeMissingStep(dao.address, result.proposalId)
      ).to.be.revertedWith("wait for the grace period");
    });
  });

  describe("Challenge Bad First Step", async () => {
    it("should be possible to challenge a bad first step", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];
      const proposalId = getProposalCounter();
      const actionId = configuration.address;

      await onboardMember(dao, bank, submitter, members[1]);
      await onboardMember(dao, bank, submitter, members[2]);
      await onboardMember(dao, bank, submitter, members[3]);

      const blockNumber = await getCurrentBlockNumber();
      const { voteResultTree, lastVoteResult, rootSig, resultSteps } =
        await buildVoteTreeWithBadNodes(
          daoOwner,
          dao,
          bank,
          configuration,
          proposalId,
          blockNumber,
          submitter,
          chainId,
          actionId,
          "20000",
          VotingStrategies.AllVotesYes,
          true //move block time
        );

      // Submit a valid result
      await voting.submitVoteResult(
        dao.address,
        proposalId,
        voteResultTree.getHexRoot(),
        submitter.address,
        lastVoteResult,
        rootSig
      );

      // Read the bad step 1
      const badVoteStep1 = resultSteps[0];

      const call = voting.challengeBadFirstStep(
        dao.address,
        proposalId,
        badVoteStep1
      );

      await expectChallengeProposal(
        dao,
        voting,
        proposalId,
        voteResultTree,
        submitter,
        call
      );
    });

    it("should not be possible to challenge a step that is not the first one", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      const voteResults = result.resultTree.votesResults;

      for (let i = 1; i < voteResults.length; i++) {
        await expect(
          voting.challengeBadFirstStep(
            dao.address,
            result.proposalId,
            voteResults[i]
          )
        ).to.be.revertedWith("only first step");
      }
    });

    it("should not be possible to challenge a step that does not have a vote result", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false,
        false // do not submit the vote result, but return the result tree
      );

      const voteResults = result.resultTree.votesResults;
      const voteStep1 = voteResults[0];
      await expect(
        voting.challengeBadFirstStep(dao.address, result.proposalId, voteStep1)
      ).to.be.revertedWith("vote result not found");
    });

    it("should not be possible to challenge a step that has an invalid proof", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      const voteResults = result.resultTree.votesResults;
      const voteStep1 = voteResults[0];
      // Set an invalid proof to mimic the behavior of a invalid step
      voteStep1.proof[0] =
        "0x1d2c3a91bdb8c7ccbd7cf5ea1df6c9408f9678deef9bfc27639e8ea9429a3572";

      await expect(
        voting.challengeBadFirstStep(dao.address, result.proposalId, voteStep1)
      ).to.be.revertedWith("invalid step proof");
    });

    it("should revert if there is nothing to be challenged when the first step is correct", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      const voteResults = result.resultTree.votesResults;
      const voteStep1 = voteResults[0];

      await expect(
        voting.challengeBadFirstStep(dao.address, result.proposalId, voteStep1)
      ).to.be.revertedWith("nothing to challenge");
    });
  });

  describe("Challenge Bad Node", async () => {
    it("should be possible to challenge a bad node that was revealed in the provideStep function", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];
      const proposalId = getProposalCounter();
      const actionId = configuration.address;

      const blockNumber = await getCurrentBlockNumber();
      const { voteResultTree, lastVoteResult, rootSig, resultSteps } =
        await buildVoteTreeWithBadNodes(
          daoOwner,
          dao,
          bank,
          configuration,
          proposalId,
          blockNumber,
          submitter,
          chainId,
          actionId,
          "20000",
          VotingStrategies.AllVotesYes,
          true //move block time
        );

      // Submit a valid result
      await voting.submitVoteResult(
        dao.address,
        proposalId,
        voteResultTree.getHexRoot(),
        submitter.address,
        lastVoteResult,
        rootSig
      );

      const badVoteStep2 = resultSteps[1];
      badVoteStep2.sig = invalidStepSignature;

      const call = voting.challengeBadNode(
        dao.address,
        proposalId,
        badVoteStep2
      );

      await expectChallengeProposal(
        dao,
        voting,
        proposalId,
        voteResultTree,
        submitter,
        call
      );
    });

    it("should not challenge a node that is valid", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        true
      );

      const voteResults = result.resultTree.votesResults;

      const voteStep2 = voteResults[1];

      await expect(
        voting.challengeBadNode(dao.address, result.proposalId, voteStep2)
      ).to.be.revertedWith("nothing to challenge");
    });
  });

  describe("Challenge Bad Step", async () => {
    it("should be possible to challenge a bad step", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];
      const proposalId = getProposalCounter();
      const actionId = configuration.address;

      await onboardMember(dao, bank, submitter, members[1]);
      await onboardMember(dao, bank, submitter, members[2]);
      await onboardMember(dao, bank, submitter, members[3]);

      const blockNumber = await getCurrentBlockNumber();
      const { voteResultTree, lastVoteResult, rootSig, resultSteps } =
        await buildVoteTreeWithBadNodes(
          daoOwner,
          dao,
          bank,
          configuration,
          proposalId,
          blockNumber,
          submitter,
          chainId,
          actionId,
          "2000",
          VotingStrategies.AllVotesYes,
          true //move block time
        );

      // Submit a valid result
      await voting.submitVoteResult(
        dao.address,
        proposalId,
        voteResultTree.getHexRoot(),
        submitter.address,
        lastVoteResult,
        rootSig
      );

      const badVotePrevious = resultSteps[3];
      const badVoteCurrent = resultSteps[4];

      await advanceTime(10); // ends the grace period

      const call = voting.challengeBadStep(
        dao.address,
        proposalId,
        badVotePrevious,
        badVoteCurrent
      );

      await expectChallengeProposal(
        dao,
        voting,
        proposalId,
        voteResultTree,
        submitter,
        call
      );
    });

    it("should not be possible to challenge a bad step if there is no vote result", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];
      const proposalId = getProposalCounter();
      const actionId = configuration.address;

      await onboardMember(dao, bank, submitter, members[1]);
      await onboardMember(dao, bank, submitter, members[2]);

      const blockNumber = await getCurrentBlockNumber();
      const { resultSteps } = await buildVoteTreeWithBadNodes(
        daoOwner,
        dao,
        bank,
        configuration,
        proposalId,
        blockNumber,
        submitter,
        chainId,
        actionId,
        "2000",
        VotingStrategies.AllVotesYes,
        true //move block time
      );

      // Do not submit the vote result
      const badVotePrevious = resultSteps[2];
      const badVoteCurrent = resultSteps[3];

      await advanceTime(10); // ends the grace period

      await expect(
        voting.challengeBadStep(
          dao.address,
          proposalId,
          badVotePrevious,
          badVoteCurrent
        )
      ).to.be.revertedWith("missing vote result");
    });

    it("should not be possible to challenge a bad step if node indexes are invalid", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];
      const proposalId = getProposalCounter();
      const actionId = configuration.address;

      await onboardMember(dao, bank, submitter, members[1]);
      await onboardMember(dao, bank, submitter, members[2]);

      const blockNumber = await getCurrentBlockNumber();
      const { voteResultTree, lastVoteResult, rootSig, resultSteps } =
        await buildVoteTreeWithBadNodes(
          daoOwner,
          dao,
          bank,
          configuration,
          proposalId,
          blockNumber,
          submitter,
          chainId,
          actionId,
          "2000",
          VotingStrategies.AllVotesYes,
          true //move block time
        );

      // Submit a valid result
      await voting.submitVoteResult(
        dao.address,
        proposalId,
        voteResultTree.getHexRoot(),
        submitter.address,
        lastVoteResult,
        rootSig
      );

      await advanceTime(10); // ends the grace period

      const badVotePrevious = resultSteps[3];
      badVotePrevious.index = 0;
      const badVoteCurrent = resultSteps[4];

      await expect(
        voting.challengeBadStep(
          dao.address,
          proposalId,
          badVotePrevious,
          badVoteCurrent
        )
      ).to.be.revertedWith("invalid step index");

      badVotePrevious.index = 4;
      badVoteCurrent.index = 0;

      await expect(
        voting.challengeBadStep(
          dao.address,
          proposalId,
          badVotePrevious,
          badVoteCurrent
        )
      ).to.be.revertedWith("invalid step index");
    });

    it("should not be possible to challenge a bad step if nodes are not consecutive", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];
      const proposalId = getProposalCounter();
      const actionId = configuration.address;

      await onboardMember(dao, bank, submitter, members[1]);
      await onboardMember(dao, bank, submitter, members[2]);

      const blockNumber = await getCurrentBlockNumber();
      const { voteResultTree, lastVoteResult, rootSig, resultSteps } =
        await buildVoteTreeWithBadNodes(
          daoOwner,
          dao,
          bank,
          configuration,
          proposalId,
          blockNumber,
          submitter,
          chainId,
          actionId,
          "2000",
          VotingStrategies.AllVotesYes,
          true //move block time
        );

      // Submit a valid result
      await voting.submitVoteResult(
        dao.address,
        proposalId,
        voteResultTree.getHexRoot(),
        submitter.address,
        lastVoteResult,
        rootSig
      );

      await advanceTime(10); // ends the grace period

      await expect(
        voting.challengeBadStep(
          dao.address,
          proposalId,
          resultSteps[0],
          resultSteps[3]
        )
      ).to.be.revertedWith("not consecutive steps");

      await expect(
        voting.challengeBadStep(
          dao.address,
          proposalId,
          resultSteps[3],
          resultSteps[2]
        )
      ).to.be.revertedWith("not consecutive steps");

      await expect(
        voting.challengeBadStep(
          dao.address,
          proposalId,
          resultSteps[2],
          resultSteps[2]
        )
      ).to.be.revertedWith("not consecutive steps");
    });

    it("should not be possible to challenge a bad step nodes are invalid", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];
      const proposalId = getProposalCounter();
      const actionId = configuration.address;

      await onboardMember(dao, bank, submitter, members[1]);
      await onboardMember(dao, bank, submitter, members[2]);

      const blockNumber = await getCurrentBlockNumber();
      const { voteResultTree, lastVoteResult, rootSig, resultSteps } =
        await buildVoteTreeWithBadNodes(
          daoOwner,
          dao,
          bank,
          configuration,
          proposalId,
          blockNumber,
          submitter,
          chainId,
          actionId,
          "2000",
          VotingStrategies.AllVotesYes,
          true //move block time
        );

      // Submit a valid result
      await voting.submitVoteResult(
        dao.address,
        proposalId,
        voteResultTree.getHexRoot(),
        submitter.address,
        lastVoteResult,
        rootSig
      );

      await advanceTime(10); // ends the grace period

      const badVotePrevious = resultSteps[3];
      let validChoice = badVotePrevious.choice;
      badVotePrevious.choice = validChoice === 1 ? 0 : 1;
      const badVoteCurrent = resultSteps[4];

      await expect(
        voting.challengeBadStep(
          dao.address,
          proposalId,
          badVotePrevious,
          badVoteCurrent
        )
      ).to.be.revertedWith("invalid step proof");

      badVotePrevious.choice = validChoice;
      validChoice = badVoteCurrent.choice;
      badVoteCurrent.choice = validChoice === 1 ? 0 : 1;

      await expect(
        voting.challengeBadStep(
          dao.address,
          proposalId,
          badVotePrevious,
          badVoteCurrent
        )
      ).to.be.revertedWith("invalid step proof");
    });

    it("should revert if the steps are correct", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      await onboardMember(dao, bank, submitter, members[1]);
      await onboardMember(dao, bank, submitter, members[2]);

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        false
      );

      const voteResults = result.resultTree.votesResults;

      await expect(
        voting.challengeBadStep(
          dao.address,
          result.proposalId,
          voteResults[0],
          voteResults[1]
        )
      ).to.be.revertedWith("nothing to challenge");
    });
  });

  describe("Fallback Voting Strategy", () => {
    it("should be possible to start a new voting using the fallback voting strategy", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const votingHelpers = this.votingHelpers;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        true
      );

      let submittedVote = await voting.getVote(dao.address, result.proposalId);
      expect(submittedVote.fallbackVotesCount).to.be.equal("0");
      let snapshot = Number(submittedVote.snapshot);
      let startingTime = Number(submittedVote.startingTime);
      let gracePeriodStartingTime = Number(
        submittedVote.gracePeriodStartingTime
      );

      await advanceTime(5);

      await voting.requestFallback(dao.address, result.proposalId);

      submittedVote = await voting.getVote(dao.address, result.proposalId);
      expect(submittedVote.fallbackVotesCount).to.be.equal("1");
      expect(Number(submittedVote.snapshot)).to.be.greaterThanOrEqual(snapshot);
      expect(Number(submittedVote.startingTime)).to.be.greaterThanOrEqual(
        startingTime
      );
      expect(
        Number(submittedVote.gracePeriodStartingTime)
      ).to.be.greaterThanOrEqual(gracePeriodStartingTime);

      const fallbackVote = await votingHelpers.fallbackVoting.votes(
        dao.address,
        result.proposalId
      );
      expect(Number(fallbackVote.startingTime)).to.be.greaterThanOrEqual(
        Number(submittedVote.startingTime)
      );
      expect(Number(fallbackVote.blockNumber)).to.be.greaterThanOrEqual(
        Number(submittedVote.snapshot)
      );
    });

    it("should not be possible to use the fallback voting strategy if the current voting is not in progress", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        true
      );

      let submittedVote = await voting.getVote(dao.address, result.proposalId);
      expect(submittedVote.fallbackVotesCount).to.be.equal("0");

      await advanceTime(10); // ends the grace period

      await expect(
        voting.requestFallback(dao.address, result.proposalId)
      ).to.be.revertedWith("voting ended");
    });

    it("should not be possible to request the fallback voting strategy more than once for the same member", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        true
      );

      await advanceTime(5);

      await voting.requestFallback(dao.address, result.proposalId);

      await expect(
        voting.requestFallback(dao.address, result.proposalId)
      ).to.be.revertedWith("fallback vote duplicate");
    });

    // FIXME send a tx from a new member account for the same proposal
    it.skip("should not start a new voting fallback if it was already activated for the same proposal", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      await onboardMember(dao, bank, submitter, {
        address: signers[2].address,
      });

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        true
      );

      await advanceTime(5);

      let submittedVote = await voting.getVote(dao.address, result.proposalId);
      expect(submittedVote.fallbackVotesCount).to.be.equal("0");

      // DAO owner requested the fallback voting
      await voting.requestFallback(dao.address, result.proposalId);
      submittedVote = await voting.getVote(dao.address, result.proposalId);
      expect(submittedVote.fallbackVotesCount).to.be.equal("1");

      // DAO member requests the fallback voting as well
      await txSigner(signers[2], voting).requestFallback(
        dao.address,
        result.proposalId
      );
      submittedVote = await voting.getVote(dao.address, result.proposalId);
      expect(submittedVote.fallbackVotesCount).to.be.equal("1");
    });

    it("should not be possible for a non member to start the fallback voting strategy", async () => {
      const dao = this.dao;
      const bank = this.extensions.bankExt;
      const voting = this.adapters.voting;
      const configuration = this.adapters.configuration;
      const submitter = members[0];

      const result = await submitValidVoteResult(
        dao,
        bank,
        configuration,
        voting,
        submitter,
        true
      );

      await advanceTime(5);

      // non member requests the fallback voting
      await expect(
        txSigner(signers[2], voting).requestFallback(
          dao.address,
          result.proposalId
        )
      ).to.be.revertedWith("onlyMember");
    });
  });

  describe("Governance Token", async () => {
    it("should be possible to update a DAO configuration if you are a member and a maintainer that holds an external governance token", async () => {
      const accountIndex = 0;
      const maintainer = members[accountIndex];
      // Issue OpenLaw ERC20 Basic Token for tests, only DAO maintainer will hold this token
      const tokenSupply = toBN(100000);
      const oltContract = await OLToken.new(tokenSupply);

      // Transfer OLTs to the maintainer account
      await oltContract.transfer(maintainer.address, toBN(1));
      const maintainerBalance = await oltContract.balanceOf.call(
        maintainer.address
      );
      expect(maintainerBalance.toString()).equal("1");

      const { dao, adapters, extensions } = await deployDaoWithOffchainVoting({
        owner: daoOwner,
        newMember: maintainer.address,
        maintainerTokenAddress: oltContract.address,
      });
      const bank = extensions.bankExt;
      const voting = adapters.voting; //This is the offchain voting adapter
      const configuration = adapters.configuration;
      const configKey = sha3(
        web3.utils.encodePacked(
          "governance.role.",
          utils.getAddress(configuration.address)
        )
      );

      // Make sure the governance token configuration was created
      const governanceToken = await dao.getAddressConfiguration(configKey);
      expect(governanceToken).equal(oltContract.address);

      const newConfigKey = sha3("new-config-a");
      const newConfigValue = toBN("10");
      const configs = [
        {
          key: newConfigKey,
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];

      await updateConfiguration(
        dao,
        voting,
        configuration,
        bank,
        maintainer,
        configs
      );

      const updatedConfigValue = await dao.getConfiguration(newConfigKey);
      expect(updatedConfigValue.toString()).equal(newConfigValue.toString());
    });

    it("should be possible to update a DAO configuration if you are a member and a maintainer that holds an internal governance token", async () => {
      const accountIndex = 0;
      const maintainer = members[accountIndex];

      const { dao, adapters, extensions } = await deployDaoWithOffchainVoting({
        owner: daoOwner,
        newMember: maintainer.address,
        // if the member holds any UNITS he is a maintainer
        maintainerTokenAddress: UNITS,
      });
      const bank = extensions.bankExt;
      const voting = adapters.voting; //This is the offchain voting adapter
      const configuration = adapters.configuration;
      const configKey = sha3(
        web3.utils.encodePacked(
          "governance.role.",
          utils.getAddress(configuration.address)
        )
      );

      // Make sure the governance token configuration was created
      const governanceToken = await dao.getAddressConfiguration(configKey);
      expect(governanceToken).equal(utils.getAddress(UNITS));

      const newConfigKey = sha3("new-config-a");
      const newConfigValue = toBN("10");
      const configs = [
        {
          key: newConfigKey,
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];

      await updateConfiguration(
        dao,
        voting,
        configuration,
        bank,
        maintainer,
        configs
      );

      const updatedConfigValue = await dao.getConfiguration(newConfigKey);
      expect(updatedConfigValue.toString()).equal(newConfigValue.toString());
    });
    it("should be possible to update a DAO configuration if you are a member and a maintainer that holds an internal default governance token", async () => {
      const accountIndex = 0;
      const maintainer = members[accountIndex];

      const { dao, adapters, extensions } = await deployDaoWithOffchainVoting({
        owner: daoOwner,
        newMember: maintainer.address,
        // if the member holds any UNITS that represents the default governance token,
        // the member is considered a maintainer.
        defaultMemberGovernanceToken: UNITS,
      });
      const bank = extensions.bankExt;
      const voting = adapters.voting; //This is the offchain voting adapter
      const configuration = adapters.configuration;
      const configKey = sha3(
        web3.utils.encodePacked("governance.role.default")
      );

      // Make sure the governance token configuration was created
      const governanceToken = await dao.getAddressConfiguration(configKey);
      expect(governanceToken).equal(utils.getAddress(UNITS));

      const newConfigKey = sha3("new-config-a");
      const newConfigValue = toBN("10");
      const configs = [
        {
          key: newConfigKey,
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];

      await updateConfiguration(
        dao,
        voting,
        configuration,
        bank,
        maintainer,
        configs
      );

      const updatedConfigValue = await dao.getConfiguration(newConfigKey);
      expect(updatedConfigValue.toString()).equal(newConfigValue.toString());
    });

    it("should be possible to update a DAO configuration if you are a member and a maintainer that holds an external default governance token", async () => {
      const accountIndex = 0;
      const maintainer = members[accountIndex];

      // Issue OpenLaw ERC20 Basic Token for tests, only DAO maintainer will hold this token
      const tokenSupply = toBN(100000);
      const oltContract = await OLToken.new(tokenSupply);

      // Transfer OLTs to the maintainer account
      await oltContract.transfer(maintainer.address, toBN(1));
      const maintainerBalance = await oltContract.balanceOf.call(
        maintainer.address
      );
      expect(maintainerBalance.toString()).equal("1");

      const { dao, adapters, extensions } = await deployDaoWithOffchainVoting({
        owner: daoOwner,
        newMember: maintainer.address,
        // if the member holds any OLTs that represents the default governance token,
        // the member is considered a maintainer.
        defaultMemberGovernanceToken: oltContract.address,
      });
      const bank = extensions.bankExt;
      const voting = adapters.voting; //This is the offchain voting adapter
      const configuration = adapters.configuration;
      const configKey = sha3(
        web3.utils.encodePacked("governance.role.default")
      );

      // Make sure the governance token configuration was created
      const governanceToken = await dao.getAddressConfiguration(configKey);
      expect(governanceToken).equal(oltContract.address);

      const newConfigKey = sha3("new-config-a");
      const newConfigValue = toBN("10");
      const configs = [
        {
          key: newConfigKey,
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];

      await updateConfiguration(
        dao,
        voting,
        configuration,
        bank,
        maintainer,
        configs
      );

      const updatedConfigValue = await dao.getConfiguration(newConfigKey);
      expect(updatedConfigValue.toString()).equal(newConfigValue.toString());
    });

    it("should not be possible to update a DAO configuration if you are a maintainer but not a member", async () => {
      const accountIndex = 5; //not a member
      const maintainer = members[accountIndex];
      // Issue OpenLaw ERC20 Basic Token for tests, only DAO maintainer will hold this token
      const tokenSupply = toBN(100000);
      const oltContract = await OLToken.new(tokenSupply);

      // Transfer OLTs to the maintainer account
      await oltContract.transfer(maintainer.address, toBN(1));
      const maintainerBalance = await oltContract.balanceOf.call(
        maintainer.address
      );
      expect(maintainerBalance.toString()).equal("1");

      const { dao, adapters, extensions } = await deployDaoWithOffchainVoting({
        owner: daoOwner,
        newMember: members[0].address,
        maintainerTokenAddress: oltContract.address,
      });
      const bank = extensions.bankExt;
      const voting = adapters.voting; //This is the offchain voting adapter
      const configuration = adapters.configuration;
      const configKey = sha3(
        web3.utils.encodePacked(
          "governance.role.",
          utils.getAddress(configuration.address)
        )
      );

      // Make sure the governance token configuration was created
      const governanceToken = await dao.getAddressConfiguration(configKey);
      expect(governanceToken).equal(oltContract.address);

      const newConfigKey = sha3("new-config-a");
      const configs = [
        {
          key: newConfigKey,
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];

      await expect(
        updateConfiguration(
          dao,
          voting,
          configuration,
          bank,
          maintainer,
          configs
        )
      ).to.be.revertedWith("onlyMember");
    });

    it("should not be possible to update a DAO configuration if you are a member but not a maintainer", async () => {
      const accountIndex = 0; // new member
      const newUser = members[accountIndex];
      // Issue OpenLaw ERC20 Basic Token for tests, only DAO maintainer will hold this token
      const tokenSupply = toBN(100000);
      const oltContract = await OLToken.new(tokenSupply);

      const { dao, adapters, extensions } = await deployDaoWithOffchainVoting({
        owner: daoOwner,
        // New members is added, but does not hold OLTs
        newMember: newUser.address,
        // only holders of the OLT tokens are considered
        // maintainers
        maintainerTokenAddress: oltContract.address,
      });
      const bank = extensions.bankExt;
      const voting = adapters.voting; //This is the offchain voting adapter
      const configuration = adapters.configuration;
      const configKey = sha3(
        web3.utils.encodePacked(
          "governance.role.",
          utils.getAddress(configuration.address)
        )
      );

      // Make sure the governance token configuration was created
      const governanceToken = await dao.getAddressConfiguration(configKey);
      expect(governanceToken).equal(oltContract.address);

      const newConfigKey = sha3("new-config-a");
      const configs = [
        {
          key: newConfigKey,
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];

      // The new member attempts to vote on the new proposal,
      // but since he is not a maintainer (does not hold OLT tokens)
      // the voting weight is zero, so the proposal should not pass
      const data = await updateConfiguration(
        dao,
        voting,
        configuration,
        bank,
        newUser,
        configs,
        VotingStrategies.AllVotesYes,
        false // skip the process proposal call
      );

      await expect(
        voting.submitVoteResult(
          dao.address,
          data.proposalId,
          data.voteResultTree.getHexRoot(),
          data.submitter,
          data.lastResult,
          data.rootSig
        )
      ).to.be.revertedWith("bad node");

      // Validate the vote result node by calling the contract
      const getBadNodeErrorResponse = await voting.getBadNodeError(
        dao.address,
        data.proposalId,
        // `bool submitNewVote`
        true,
        data.voteResultTree.getHexRoot(),
        data.blockNumber,
        // `gracePeriodStartingTime` should be `0` as `submitNewVote` is `true`
        0,
        data.membersCount,
        data.lastResult
      );

      const errorCode = getBadNodeErrorResponse.toString();
      expect(BadNodeError[parseInt(errorCode)]).equal("VOTE_NOT_ALLOWED");
    });

    it("should not be possible to update a DAO configuration if you are a member & maintainer that holds an external token which not implements getPriorAmount function", async () => {
      const accountIndex = 0; // new member
      const newUser = members[accountIndex];
      // Mint a PixelNFT to use it as an External Governance Token which does not implements
      // the getPriorAmount function. Only a DAO maintainer will hold this token.
      const externalGovToken = await PixelNFT.new(10);
      await externalGovToken.mintPixel(newUser.address, 1, 1, {
        from: daoOwner,
      });

      const { dao, adapters, extensions } = await deployDaoWithOffchainVoting({
        owner: daoOwner,
        // New members is added, but does not hold OLTs
        newMember: newUser.address,
        // only holders of the OLT tokens are considered
        // maintainers
        maintainerTokenAddress: externalGovToken.address,
      });

      const bank = extensions.bankExt;
      const voting = adapters.voting; //This is the offchain voting adapter
      const configuration = adapters.configuration;
      const configKey = sha3(
        web3.utils.encodePacked(
          "governance.role.",
          utils.getAddress(configuration.address)
        )
      );

      // Make sure the governance token configuration was created
      const governanceToken = await dao.getAddressConfiguration(configKey);
      expect(governanceToken).equal(externalGovToken.address);

      const newConfigKey = sha3("new-config-a");
      const configs = [
        {
          key: newConfigKey,
          numericValue: "10",
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ];

      // The new member attempts to vote on the new proposal,
      // but since he is not a maintainer (does not hold OLT tokens)
      // the voting weight is zero, so the proposal should not pass
      const data = await updateConfiguration(
        dao,
        voting,
        configuration,
        bank,
        newUser, // the index of the member that will vote
        configs,
        VotingStrategies.AllVotesYes,
        false // skip the process proposal call
      );

      await expect(
        voting.submitVoteResult(
          dao.address,
          data.proposalId,
          data.voteResultTree.getHexRoot(),
          data.submitter,
          data.lastResult,
          data.rootSig
        )
      ).to.be.revertedWith("getPriorAmount not implemented");
    });
  });

  describe("Delegate", async () => {
    it("should be possible to vote and submit a vote result using a delegate account", async () => {
      //TODO create a proposal, vote, and submit the result using a delegated address - PASS
    });

    it("should be possible to start the fallback voting strategy with a delegate account", async () => {
      //TODO
    });
  });

  describe("Bad Reporter Kick", async () => {
    it("should be possible to kick a bad reporter", async () => {
      //TODO submit a vote result, challenge a bad step, vote to kick the challengedReporter
      // check if bad reporter was kicked and funds were released
    });
  });
});
