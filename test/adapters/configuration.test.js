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
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  accounts,
  expectRevert,
} = require("../../utils/DaoFactory.js");

describe("Adapter - Configuration", () => {
  const owner = accounts[1];
  const proposalCounter = proposalIdGenerator().generator;

  const getProposalCounter = () => {
    return proposalCounter().next().value;
  };

  beforeAll(async () => {
    const { dao, adapters, extensions } = await deployDefaultDao(owner);
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

  test("should be possible to set a single configuration parameter", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    let key = sha3("key");

    const proposalId = getProposalCounter();
    //Submit a new configuration proposal
    await configuration.submitConfigurationProposal(
      dao.address,
      proposalId,
      [key],
      [toBN("11")],
      { from: owner, gasPrice: toBN("0") }
    );

    let value = await dao.getConfiguration(key);
    expect(value.toString()).toEqual("0");

    //Sponsor the new proposal, vote and process it
    await configuration.sponsorProposal(dao.address, proposalId, [], {
      from: owner,
      gasPrice: toBN("0"),
    });

    value = await dao.getConfiguration(key);
    expect(value.toString()).toEqual("0");

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
    expect(value.toString()).toEqual("11");
  });

  test("should be possible to set multiple configuration parameters", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    let key1 = sha3("key1");
    let key2 = sha3("key2");

    //Submit a new configuration proposal
    await configuration.submitConfigurationProposal(
      dao.address,
      "0x1",
      [key1, key2],
      [toBN("10"), toBN("15")],
      { from: owner, gasPrice: toBN("0") }
    );

    let value1 = await dao.getConfiguration(key1);
    let value2 = await dao.getConfiguration(key2);
    expect(value1.toString()).toEqual("0");
    expect(value2.toString()).toEqual("0");

    //Sponsor the new proposal, vote and process it
    await configuration.sponsorProposal(dao.address, "0x1", [], {
      from: owner,
      gasPrice: toBN("0"),
    });

    value1 = await dao.getConfiguration(key1);
    value2 = await dao.getConfiguration(key2);
    expect(value1.toString()).toEqual("0");
    expect(value2.toString()).toEqual("0");

    await voting.submitVote(dao.address, "0x1", 1, {
      from: owner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, "0x1", {
      from: owner,
      gasPrice: toBN("0"),
    });

    value1 = await dao.getConfiguration(key1);
    value2 = await dao.getConfiguration(key2);
    expect(value1.toString()).toEqual("10");
    expect(value2.toString()).toEqual("15");
  });

  test("should not be possible to provide a different number of keys and values", async () => {
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    let key = sha3("key");

    await expectRevert(
      configuration.submitConfigurationProposal(dao.address, "0x1", [key], [], {
        from: owner,
        gasPrice: toBN("0"),
      }),
      "must be an toEqual number of config keys and values"
    );
  });
});
