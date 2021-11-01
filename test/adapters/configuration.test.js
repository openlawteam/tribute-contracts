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
const { sha3, toBN, DAI_TOKEN, LOOT } = require("../../utils/ContractUtil.js");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  accounts,
  expectRevert,
  expect,
} = require("../../utils/OZTestUtil.js");

const owner = accounts[1];
const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Configuration", () => {
  before("deploy dao", async () => {
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

  it("should be possible to set a single integer configuration parameter", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    let key = sha3("key");

    const proposalId = getProposalCounter();
    //Submit a new configuration proposal
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [key],
      [toBN("11")],
      [],
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

  it("should be possible to set multiple integer configuration parameters", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    let key1 = sha3("allowUnitTransfersBetweenMembers");
    let key2 = sha3("allowExternalUnitTransfers");

    //Submit a new configuration proposal
    const proposalId = getProposalCounter();
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [key1, key2],
      [1, 2],
      [],
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
    expect(value1.toString()).equal("1");
    expect(value2.toString()).equal("2");
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
      [key],
      [],
      [DAI_TOKEN],
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    let value = await dao.getAddressConfiguration(key);
    expect(value.toString()).equal(
      "0x0000000000000000000000000000000000000000"
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

    value = await dao.getAddressConfiguration(key);
    expect(value.toString().toLowerCase()).equal(DAI_TOKEN);
  });

  it("should be possible to set multiple address configuration parameters", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    let key1 = sha3("token.dai");
    let key2 = sha3("token.loot");

    //Submit a new configuration proposal
    const proposalId = getProposalCounter();
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [key1, key2],
      [],
      [DAI_TOKEN, LOOT],
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    let value1 = await dao.getAddressConfiguration(key1);
    let value2 = await dao.getAddressConfiguration(key2);
    expect(value1.toString()).equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(value2.toString()).equal(
      "0x0000000000000000000000000000000000000000"
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

    value1 = await dao.getAddressConfiguration(key1);
    value2 = await dao.getAddressConfiguration(key2);
    expect(value1.toString().toLowerCase()).equal(DAI_TOKEN);
    expect(value2.toString().toLowerCase()).equal(LOOT);
  });

  it("should not be possible to provide a different number of keys and values", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;

    await expectRevert(
      configuration.submitProposal(
        dao.address,
        "0x1",
        [sha3("key")],
        [],
        [],
        [],
        {
          from: owner,
          gasPrice: toBN("0"),
        }
      ),
      "must be an equal number of keys and values/addresses"
    );

    await expectRevert(
      configuration.submitProposal(
        dao.address,
        "0x2",
        [],
        [toBN("1")],
        [],
        [],
        {
          from: owner,
          gasPrice: toBN("0"),
        }
      ),
      "missing keys"
    );
    await expectRevert(
      configuration.submitProposal(
        dao.address,
        "0x1",
        [sha3("key1"), sha3("key2")],
        [toBN("1")],
        [],
        [],
        {
          from: owner,
          gasPrice: toBN("0"),
        }
      ),
      "must be an equal number of keys and values/addresses"
    );

    await expectRevert(
      configuration.submitProposal(
        dao.address,
        "0x1",
        [sha3("key1")],
        [toBN("1"), toBN("2")],
        [],
        [],
        {
          from: owner,
          gasPrice: toBN("0"),
        }
      ),
      "must be an equal number of keys and values/addresses"
    );
  });

  it("should not be possible to provide a different number of keys and addresses", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;

    await expectRevert(
      configuration.submitProposal(
        dao.address,
        "0x1",
        [sha3("key")],
        [],
        [],
        [],
        {
          from: owner,
          gasPrice: toBN("0"),
        }
      ),
      "must be an equal number of keys and values/addresses"
    );

    await expectRevert(
      configuration.submitProposal(
        dao.address,
        "0x1",
        [],
        [],
        [DAI_TOKEN],
        [],
        {
          from: owner,
          gasPrice: toBN("0"),
        }
      ),
      "missing keys"
    );
    await expectRevert(
      configuration.submitProposal(
        dao.address,
        "0x1",
        [sha3("key1"), sha3("key2")],
        [],
        [DAI_TOKEN],
        [],
        {
          from: owner,
          gasPrice: toBN("0"),
        }
      ),
      "must be an equal number of keys and values/addresses"
    );

    await expectRevert(
      configuration.submitProposal(
        dao.address,
        "0x1",
        [sha3("key1")],
        [],
        [DAI_TOKEN, LOOT],
        [],
        {
          from: owner,
          gasPrice: toBN("0"),
        }
      ),
      "must be an equal number of keys and values/addresses"
    );
  });

  it("should be possible to configure only integers when values and addresses are provided in the same proposal", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    let key1 = sha3("config1");

    //Submit a new configuration proposal
    const proposalId = getProposalCounter();
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [key1],
      [toBN("1")], // set the value config
      [DAI_TOKEN], // but also set the address config
      [],
      { from: owner, gasPrice: toBN("0") }
    );

    let value1 = await dao.getConfiguration(key1);
    expect(value1.toString()).equal("0");
    let addr1 = await dao.getAddressConfiguration(key1);
    expect(addr1.toString()).equal(
      "0x0000000000000000000000000000000000000000"
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

    value1 = await dao.getConfiguration(key1);
    expect(value1.toString()).equal("1");
    addr1 = await dao.getAddressConfiguration(key1);
    // not configured
    expect(addr1.toString().toLowerCase()).equal(
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("should not be possible to configure addresses with zero value", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    let key1 = sha3("config1");

    //Submit a new configuration proposal
    const proposalId = getProposalCounter();
    await expectRevert(
      configuration.submitProposal(
        dao.address,
        proposalId,
        [key1],
        [],
        ["0x0000000000000000000000000000000000000000"], // using an invalid address
        [],
        { from: owner, gasPrice: toBN("0") }
      ),
      "address can not be zero"
    );
  });
});
