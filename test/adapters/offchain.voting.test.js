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
const { utils, Contract } = require("ethers");
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
  buildVoteTree,
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
    expect(Number(submittedVote[0])).to.be.equal(blockNumber);
    expect(submittedVote[1]).to.be.equal(submitter.address);
    expect(submittedVote[2]).to.be.equal(resultHash);
    expect(submittedVote[3]).to.be.equal(lastVoteResult.nbYes);
    expect(submittedVote[4]).to.be.equal(lastVoteResult.nbNo);
    expect(Number(submittedVote[5])).to.be.greaterThan(proposalData.timestamp);
    expect(Number(submittedVote[6])).to.be.greaterThan(proposalData.timestamp);
    expect(submittedVote[7]).to.be.false;
    expect(submittedVote[8]).to.be.equal("0");
    expect(submittedVote[9]).to.be.false;
    expect(submittedVote[10]).to.be.equal("0");

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
    moveBlockTime = true
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
        "0xbe90f2a9a51a554ef37a3bc3f47a1fc8dc29279ff320fa45754f6df165cc692f7cf7ed059edded2c87e95320229420c8e359a498fd89e55a1086a4adf03f73901c"
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

      const challengeProposalId = soliditySha3(
        result.proposalId,
        result.resultTree.resultHash
      );

      // Challenge the vote result to indicate it has something wrong
      const call = voting.challengeMissingStep(dao.address, result.proposalId);
      await expectEvent(
        call,
        "ResultChallenged",
        dao.address,
        result.proposalId,
        result.resultTree.resultHash,
        challengeProposalId
      );

      // The vote result should be set to challenged
      const storedVote = await voting.getVote(dao.address, result.proposalId);
      expect(storedVote.isChallenged).to.be.true;

      // submitter should be in jail after challenging a missing step
      const notJailed = await dao.notJailed(submitter.address);
      expect(notJailed).to.be.false;

      // A challenge proposal must be created if the challenge call was successful
      const challengeProposal = await dao.proposals(challengeProposalId);
      expect(challengeProposal.flags.toString()).to.be.equal("1");
      expect(challengeProposal.adapterAddress).to.be.equal(voting.address);
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
  });
});
