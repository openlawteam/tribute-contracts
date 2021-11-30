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
const { utils } = require("ethers");
const {
  toBN,
  toWei,
  sha3,
  fromAscii,
  unitPrice,
  remaining,
  UNITS,
  ZERO_ADDRESS,
} = require("../../utils/contract-util");

const {
  proposalIdGenerator,
  advanceTime,
  deployDaoWithOffchainVoting,
  accounts,
  expect,
  expectRevert,
  takeChainSnapshot,
  revertChainSnapshot,
  web3,
  OffchainVotingHashContract,
  OLToken,
} = require("../../utils/oz-util");

const {
  createVote,
  getDomainDefinition,
  TypedDataUtils,
  prepareProposalPayload,
  prepareVoteProposalData,
  prepareProposalMessage,
  prepareVoteResult,
  SigUtilSigner,
  getVoteStepDomainDefinition,
} = require("../../utils/offchain-voting-util");

const generateMembers = (amount) => {
  let newAccounts = [];
  for (let i = 0; i < amount; i++) {
    const account = web3.eth.accounts.create();
    newAccounts.push(account);
  }
  return newAccounts;
};

const members = generateMembers(10);
const findMember = (addr) => members.find((member) => member.address === addr);
const daoOwner = accounts[0];
const newMember = members[0];
const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

const onboardMember = async (dao, voting, onboarding, bank, index) => {
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
  proposalData.sig = await signer(
    proposalData,
    dao.address,
    onboarding.address,
    chainId
  );

  await onboarding.submitProposal(
    dao.address,
    proposalId,
    members[index].address,
    UNITS,
    unitPrice.mul(toBN(3)).add(remaining),
    prepareVoteProposalData(proposalData, web3),
    {
      from: daoOwner,
      gasPrice: toBN("0"),
    }
  );

  const voteEntries = [];
  const membersCount = await dao.getNbMembers();

  for (let i = 0; i < parseInt(membersCount.toString()) - 1; i++) {
    const memberAddress = await dao.getMemberAddress(i);
    const member = findMember(memberAddress);
    let voteEntry;
    if (member) {
      const voteSigner = SigUtilSigner(member.privateKey);
      const weight = await bank.balanceOf(member.address, UNITS);
      voteEntry = await createVote(proposalId, weight, true);

      voteEntry.sig = voteSigner(
        voteEntry,
        dao.address,
        onboarding.address,
        chainId
      );
    } else {
      voteEntry = await createVote(proposalId, 0, true);

      voteEntry.sig = "0x";
    }

    voteEntries.push(voteEntry);
  }

  await advanceTime(10000);

  const { voteResultTree, result } = await prepareVoteResult(
    voteEntries,
    dao,
    onboarding.address,
    chainId
  );

  const rootSig = signer(
    { root: voteResultTree.getHexRoot(), type: "result" },
    dao.address,
    onboarding.address,
    chainId
  );

  const lastResult = result[result.length - 1];

  let tx = await voting.submitVoteResult(
    dao.address,
    proposalId,
    voteResultTree.getHexRoot(),
    members[0].address,
    lastResult,
    rootSig
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

const updateConfiguration = async (
  dao,
  voting,
  configuration,
  bank,
  maintainer,
  configs
) => {
  const blockNumber = await web3.eth.getBlockNumber();
  const proposalId = getProposalCounter();

  const proposalPayload = {
    name: "new configuration proposal",
    body: "testing the governance token",
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
    submitter: maintainer.address,
  };

  //signer for myAccount (its private key)
  const signer = SigUtilSigner(maintainer.privateKey);
  proposalData.sig = await signer(
    proposalData,
    dao.address,
    configuration.address,
    chainId
  );
  const data = prepareVoteProposalData(proposalData, web3);
  await configuration.submitProposal(dao.address, proposalId, configs, data, {
    from: daoOwner,
  });

  const member = findMember(maintainer.address);
  const voteSigner = SigUtilSigner(member.privateKey);
  const weight = await bank.balanceOf(member.address, UNITS);
  const voteEntry = await createVote(proposalId, weight, true);
  voteEntry.sig = voteSigner(
    voteEntry,
    dao.address,
    configuration.address,
    chainId
  );
  const voteEntries = [];
  voteEntries.push(voteEntry);

  await advanceTime(10000);

  const { voteResultTree, result } = await prepareVoteResult(
    voteEntries,
    dao,
    configuration.address,
    chainId
  );

  const rootSig = signer(
    { root: voteResultTree.getHexRoot(), type: "result" },
    dao.address,
    configuration.address,
    chainId
  );

  const lastResult = result[result.length - 1];
  await voting.submitVoteResult(
    dao.address,
    proposalId,
    voteResultTree.getHexRoot(),
    maintainer.address,
    lastResult,
    rootSig
  );

  await advanceTime(10000);

  // The maintainer processes on the new proposal
  await configuration.processProposal(dao.address, proposalId);
};

describe("Adapter - Offchain Voting", () => {
  before("deploy dao", async () => {
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
      space: "tribute",
      payload: proposalPayload,
      submitter: members[0].address,
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
  });

  it("should type & hash be consistent for votes between javascript and solidity", async () => {
    const chainId = 1;
    const dao = this.dao;
    const offchainVoting = this.votingHelpers.offchainVoting;
    const snapshotContract = this.votingHelpers.snapshotProposalContract;

    const proposalHash = sha3("test");
    const voteEntry = await createVote(proposalHash, 1, true);

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

  it("should be possible to propose a new voting by signing the proposal hash", async () => {
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const bank = this.extensions.bankExt;

    for (var i = 1; i < members.length; i++) {
      await onboardMember(
        dao,
        this.votingHelpers.offchainVoting,
        onboarding,
        bank,
        i
      );
    }
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.voting;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
      }),
      "revert"
    );
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const adapter = this.adapters.voting;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
        data: fromAscii("should go to fallback func"),
      }),
      "revert"
    );
  });

  it("should be possible to update a DAO configuration if you are a member and a maintainer that holds an external governance token", async () => {
    const accountIndex = 5;
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
        numericValue: newConfigValue,
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
});
