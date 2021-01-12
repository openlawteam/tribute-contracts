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
  fromUtf8,
  advanceTime,
  createDao,
  VotingContract,
  ConfigurationContract,
} = require("../../utils/DaoFactory.js");

contract("LAOLAND - Configuration Adapter", async (accounts) => {
  it("should be possible to set a single configuration parameter", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao(myAccount);
    let key = sha3("key");

    //Submit a new configuration proposal
    let configurationContract = await dao.getAdapterAddress(
      sha3("configuration")
    );
    let configuration = await ConfigurationContract.at(configurationContract);
    await configuration.submitConfigurationProposal(
      dao.address,
      "0x0",
      [key],
      [toBN("10")],
      fromUtf8(""),
      { from: myAccount, gasPrice: toBN("0") }
    );

    let value = await dao.getConfiguration(key);
    assert.equal("0", value.toString());

    //Sponsor the new proposal, vote and process it
    await configuration.sponsorProposal(dao.address, "0x0", [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    let votingContract = await dao.getAdapterAddress(sha3("voting"));
    let voting = await VotingContract.at(votingContract);

    value = await dao.getConfiguration(key);
    assert.equal(value.toString(), toBN("0").toString());
    await voting.submitVote(dao.address, "0x0", 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, "0x0", {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    value = await dao.getConfiguration(key);
    assert.equal("10", value.toString());
  });

  it("should be possible to set multiple configuration parameters", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao(myAccount);
    let key1 = sha3("key1");
    let key2 = sha3("key2");

    //Submit a new configuration proposal
    let configurationContract = await dao.getAdapterAddress(
      sha3("configuration")
    );
    let configuration = await ConfigurationContract.at(configurationContract);
    await configuration.submitConfigurationProposal(
      dao.address,
      "0x0",
      [key1, key2],
      [toBN("10"), toBN("15")],
      fromUtf8(""),
      { from: myAccount, gasPrice: toBN("0") }
    );

    let value1 = await dao.getConfiguration(key1);
    let value2 = await dao.getConfiguration(key2);
    assert.equal("0", value1.toString());
    assert.equal("0", value2.toString());

    //Sponsor the new proposal, vote and process it
    await configuration.sponsorProposal(dao.address, "0x0", [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    let votingContract = await dao.getAdapterAddress(sha3("voting"));
    let voting = await VotingContract.at(votingContract);

    value1 = await dao.getConfiguration(key1);
    value2 = await dao.getConfiguration(key2);
    assert.equal("0", value1.toString());
    assert.equal("0", value2.toString());

    await voting.submitVote(dao.address, "0x0", 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, "0x0", {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    value1 = await dao.getConfiguration(key1);
    value2 = await dao.getConfiguration(key2);
    assert.equal("10", value1.toString());
    assert.equal("15", value2.toString());
  });

  it("should not be possible to provide a different number of keys and values", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao(myAccount);
    let key = sha3("key");

    //Submit a new configuration proposal
    let configurationContract = await dao.getAdapterAddress(
      sha3("configuration")
    );
    let configuration = await ConfigurationContract.at(configurationContract);
    try {
      await configuration.submitConfigurationProposal(
        dao.address,
        "0x0",
        [key],
        [],
        fromUtf8(""),
        { from: myAccount, gasPrice: toBN("0") }
      );
    } catch (err) {
      assert.equal(
        err.reason,
        "configuration must have the same number of keys and values"
      );
    }
  });
});
