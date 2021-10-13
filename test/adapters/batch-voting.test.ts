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
import { sha3, toBN } from "web3-utils";
const {
  UNITS,
  unitPrice,
  remaining,
} = require("../../utils/ContractUtil.js");

const {
  accounts,
  web3,
  advanceTime,
  proposalIdGenerator,
  BatchVotingContract,
  expect,
  deployDaoWithBatchVoting,
  takeChainSnapshot,
  revertChainSnapshot,
} = require("../../utils/OZTestUtil.js");

const {
  createVote,
  getMessageERC712Hash,
  prepareVoteProposalData,
  validateMessage,
  SigUtilSigner,
} = require("../../utils/offchain_voting.js");

describe("Adapter - BatchVoting", () => {
  const generateMembers = (amount: number) => {
    let newAccounts = [];
    for (let i = 0; i < amount; i++) {
      const account = web3.eth.accounts.create();
      newAccounts.push(account);
    }
    return newAccounts;
  };

  const owner = accounts[1];
  const proposalCounter = proposalIdGenerator().generator;

  const getProposalCounter = () => {
    return proposalCounter().next().value;
  };

  let daoInstance: any;
  let extensionsInstance: { bank: any, erc1155Ext: any };
  let adaptersInstance: any;
  let snapshotId: any;
  let votingHelpersInstance: any;
  let members: any;

  before("deploy dao", async () => {
    members = generateMembers(5).sort((a, b) =>
      a.address.toLowerCase() < b.address.toLowerCase()
        ? -1
        : a.address.toLowerCase() > b.address.toLowerCase()
        ? 1
        : 0
    );
    const {
      dao,
      adapters,
      extensions,
      votingHelpers,
    } = await deployDaoWithBatchVoting({
      owner,
      newMember: members[0].address,
    });
    daoInstance = dao;
    extensionsInstance = extensions;
    adaptersInstance = adapters
    votingHelpersInstance = votingHelpers;
    snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(snapshotId);
    snapshotId = await takeChainSnapshot();
  });

  // @ts-ignore
  const onboardMember = async (dao, voting, onboarding, index) => {
    const blockNumber = await web3.eth.getBlockNumber();
    const proposalId = getProposalCounter();

    const proposalPayload = {
      name: "some proposal",
      body: "this is my proposal",
      choices: ["yes", "no"],
      start: Math.floor(new Date().getTime() / 1000),
      end: Math.floor(new Date().getTime() / 1000) + 10000,
      snapshot: blockNumber.toString(),
    };

    const space = "tribute";
    const chainId = 1;

    const proposalData = {
      type: "proposal",
      timestamp: Math.floor(new Date().getTime() / 1000),
      space,
      payload: proposalPayload,
      submitter: members[0].address,
    };

    //signer for myAccount (its private key)
    const signer = SigUtilSigner(members[0].privateKey);
    // @ts-ignore
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

    await onboarding.submitProposal(
      dao.address,
      proposalId,
      members[1].address,
      UNITS,
      unitPrice.mul(toBN(3)).add(remaining),
      prepareVoteProposalData(proposalData, web3),
      {
        gasPrice: toBN("0"),
      }
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
      `gas used for ( ${proposalId} ) votes: ` +
        new Intl.NumberFormat().format(tx.receipt.gasUsed)
    );

    await advanceTime(10000);

    await onboarding.processProposal(dao.address, proposalId, {
      value: unitPrice.mul(toBN("3")).add(remaining),
    });
  };

  it("should be possible to propose a new voting by signing the proposal hash", async () => {
    const dao = daoInstance;
    const onboarding = adaptersInstance.onboarding;

    const batchVotingAddr = await dao.getAdapterAddress(sha3("voting"));
    const voting = await BatchVotingContract.at(batchVotingAddr);
    const adapterName = await voting.getAdapterName();
    expect(adapterName).equal("BatchVotingContract");

    for (var i = 0; i < members.length; i++) {
      await onboardMember(dao, voting, onboarding, i);
    }
  });
});
