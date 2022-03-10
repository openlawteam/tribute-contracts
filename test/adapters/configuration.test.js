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
const {
  sha3,
  toBN,
  fromAscii,
  toWei,
  DAI_TOKEN,
  LOOT,
  ZERO_ADDRESS,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  web3,
  getAccounts,
} = require("../../utils/hardhat-test-util");

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Configuration", () => {
  let accounts, owner;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    owner = accounts[0];
    const { dao, adapters, extensions } = await deployDefaultDao({ owner });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  it("should be possible to set a single numeric configuration parameter", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    let key = sha3("key");

    const proposalId = getProposalCounter();
    //Submit a new configuration proposal
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key,
          numericValue: 11,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ],
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    let value = await dao.getConfiguration(key);
    expect(value.toString()).equal("0");

    await voting.submitVote(dao.address, proposalId, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, proposalId, {
      from: owner,
      gasPrice: toBN("0"),
    });

    value = await dao.getConfiguration(key);
    expect(value.toString()).equal("11");
  });

  it("should be possible to set multiple numeric configuration parameters", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    const key1 = sha3("allowUnitTransfersBetweenMembers");
    const key2 = sha3("allowExternalUnitTransfers");

    //Submit a new configuration proposal
    const proposalId = getProposalCounter();
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key1,
          numericValue: 11,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
        {
          key: key2,
          numericValue: 12,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ],
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    let value1 = await dao.getConfiguration(key1);
    let value2 = await dao.getConfiguration(key2);
    expect(value1.toString()).equal("0");
    expect(value2.toString()).equal("0");

    await voting.submitVote(dao.address, proposalId, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, proposalId, {
      from: owner,
      gasPrice: toBN("0"),
    });

    value1 = await dao.getConfiguration(key1);
    value2 = await dao.getConfiguration(key2);
    expect(value1.toString()).equal("11");
    expect(value2.toString()).equal("12");
  });

  it("should be possible to set a single address configuration parameter", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    let key = sha3("token.dai");

    const proposalId = getProposalCounter();
    //Submit a new configuration proposal
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key,
          numericValue: 0,
          addressValue: DAI_TOKEN,
          configType: 1,
        },
      ],
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    let value = await dao.getAddressConfiguration(key);
    expect(value.toString()).equal(ZERO_ADDRESS);

    await voting.submitVote(dao.address, proposalId, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, proposalId, {
      from: owner,
      gasPrice: toBN("0"),
    });

    value = await dao.getAddressConfiguration(key);
    expect(value.toString().toLowerCase()).equal(DAI_TOKEN);
  });

  it("should be possible to set multiple address configuration parameters", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    const key1 = sha3("token.dai");
    const key2 = sha3("token.loot");

    //Submit a new configuration proposal
    const proposalId = getProposalCounter();
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key1,
          numericValue: 0,
          addressValue: DAI_TOKEN,
          configType: 1,
        },
        {
          key: key2,
          numericValue: 0,
          addressValue: LOOT,
          configType: 1,
        },
      ],
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    let value1 = await dao.getAddressConfiguration(key1);
    let value2 = await dao.getAddressConfiguration(key2);
    expect(value1.toString()).equal(ZERO_ADDRESS);
    expect(value2.toString()).equal(ZERO_ADDRESS);

    await voting.submitVote(dao.address, proposalId, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, proposalId, {
      from: owner,
      gasPrice: toBN("0"),
    });

    value1 = await dao.getAddressConfiguration(key1);
    value2 = await dao.getAddressConfiguration(key2);
    expect(value1.toString().toLowerCase()).equal(DAI_TOKEN);
    expect(value2.toString().toLowerCase()).equal(LOOT);
  });

  it("should not be possible to submit a proposal without configs", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;

    await expect(
      configuration.submitProposal(dao.address, "0x1", [], [], {
        from: owner,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("missing configs");
  });

  it("should be possible to configure numeric and address configs in the same proposal", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    const key1 = sha3("config.numeric");
    const key2 = sha3("config.address");

    //Submit a new configuration proposal
    const proposalId = getProposalCounter();
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key1,
          numericValue: 200,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
        {
          key: key2,
          numericValue: 0,
          addressValue: DAI_TOKEN,
          configType: 1,
        },
      ],
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    let value = await dao.getConfiguration(key1);
    expect(value.toString()).equal("0");
    let addr = await dao.getAddressConfiguration(key2);
    expect(addr.toString()).equal(ZERO_ADDRESS);

    await voting.submitVote(dao.address, proposalId, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, proposalId, {
      from: owner,
      gasPrice: toBN("0"),
    });

    value = await dao.getConfiguration(key1);
    expect(value.toString()).equal("200");
    addr = await dao.getAddressConfiguration(key2);
    expect(addr.toString().toLowerCase()).equal(DAI_TOKEN);
  });

  it("should be possible to set an addresses config to 0x0 to indicate it was removed", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();
    const key = sha3("config1");
    // Make sure the config does not exist
    let value1 = await dao.getAddressConfiguration(key);
    expect(value1.toString()).equal(ZERO_ADDRESS);

    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key,
          numericValue: 0,
          addressValue: DAI_TOKEN,
          configType: 1,
        },
      ],
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, proposalId, {
      from: owner,
      gasPrice: toBN("0"),
    });

    value1 = await dao.getAddressConfiguration(key);
    expect(value1.toString().toLowerCase()).equal(DAI_TOKEN);

    // Set to 0x0 to remove the config
    const proposalIdB = getProposalCounter();
    await configuration.submitProposal(
      dao.address,
      proposalIdB,
      [
        {
          key: key,
          numericValue: 0,
          addressValue: ZERO_ADDRESS,
          configType: 1,
        },
      ],
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    await voting.submitVote(dao.address, proposalIdB, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, proposalIdB, {
      from: owner,
      gasPrice: toBN("0"),
    });

    // Make sure the config was removed
    value1 = await dao.getAddressConfiguration(key);
    expect(value1.toString().toLowerCase()).equal(ZERO_ADDRESS);
  });

  it("should be possible to set an numeric config to 0 to indicate it was removed", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();
    const key = sha3("config1");
    let value1 = await dao.getConfiguration(key);
    expect(value1.toString()).equal("0");

    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key,
          numericValue: 123,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ],
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, proposalId, {
      from: owner,
      gasPrice: toBN("0"),
    });

    // Make sure the config was added
    value1 = await dao.getConfiguration(key);
    expect(value1.toString()).equal("123");

    // Remove the numeric config
    const proposalIdB = getProposalCounter();
    await configuration.submitProposal(
      dao.address,
      proposalIdB,
      [
        {
          key: key,
          numericValue: 0, //remove the config
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ],
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    await voting.submitVote(dao.address, proposalIdB, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, proposalIdB, {
      from: owner,
      gasPrice: toBN("0"),
    });

    value1 = await dao.getConfiguration(key);
    expect(value1.toString()).equal("0");
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.configuration;
    await expect(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: owner,
        gasPrice: toBN("0"),
        value: toWei("1"),
      })
    ).to.be.revertedWith("revert");
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const adapter = this.adapters.configuration;
    await expect(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: owner,
        gasPrice: toBN("0"),
        value: toWei("1"),
        data: fromAscii("should go to fallback func"),
      })
    ).to.be.revertedWith("revert");
  });

  it("should not be possible to vote on a configuration proposal if you are not an admin", async () => {
    const adapter = this.adapters.configuration;
    await expect(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: owner,
        gasPrice: toBN("0"),
        value: toWei("1"),
        data: fromAscii("should go to fallback func"),
      })
    ).to.be.revertedWith("revert");
  });
});
