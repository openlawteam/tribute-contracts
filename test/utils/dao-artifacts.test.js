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
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const { sha3 } = require("../../utils/ContractUtil.js");
const { toBN } = require("web3-utils");
const { accounts, expect, DaoArtifacts } = require("../../utils/OZTestUtil.js");
const { ContractType } = require("../../deployment/contracts.config");

describe("Utils - DaoArtifacts", () => {
  it("should be possible to create a dao artifacts contract", async () => {
    const daoArtifacts = await DaoArtifacts.new();
    expect(daoArtifacts.address).to.not.be.null;
    expect(daoArtifacts.address).to.not.be.equal(
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("should be possible add a new adapter to the dao artifacts storage", async () => {
    const daoArtifacts = await DaoArtifacts.new();
    const owner = accounts[2];
    const adapterAddress = accounts[9];
    const res = await daoArtifacts.addArtifact(
      sha3("adapter1"),
      sha3("v1.0.0"),
      adapterAddress,
      ContractType.Adapter,
      { from: owner }
    );
    expectEvent(res, "NewArtifact", {
      _id: sha3("adapter1"),
      _owner: owner,
      _version: sha3("v1.0.0"),
      _address: adapterAddress,
      _type: toBN("3"),
    });
  });

  it("should be possible get the adapter address from the dao artifacts storage", async () => {
    const daoArtifacts = await DaoArtifacts.new();
    const owner = accounts[2];
    const adapterAddress = accounts[9];

    await daoArtifacts.addArtifact(
      sha3("adapter1"),
      sha3("v1.0.0"),
      adapterAddress,
      ContractType.Adapter,
      { from: owner }
    );

    const address = await daoArtifacts.getArtifactAddress(
      sha3("adapter1"),
      owner,
      sha3("v1.0.0"),
      ContractType.Adapter
    );
    expect(address).to.be.equal(adapterAddress);
  });

  it("should be possible add a new extension factory to the dao artifacts storage", async () => {
    const daoArtifacts = await DaoArtifacts.new();
    const owner = accounts[2];
    const extensionAddress = accounts[9];
    const res = await daoArtifacts.addArtifact(
      sha3("extFactory1"),
      sha3("v1.0.0"),
      extensionAddress,
      ContractType.Extension,
      { from: owner }
    );
    expectEvent(res, "NewArtifact", {
      _id: sha3("extFactory1"),
      _owner: owner,
      _version: sha3("v1.0.0"),
      _address: extensionAddress,
      _type: toBN("2"),
    });
  });

  it("should be possible get the extension factory address from the dao artifacts storage", async () => {
    const daoArtifacts = await DaoArtifacts.new();
    const owner = accounts[2];
    const extensionAddress = accounts[9];
    await daoArtifacts.addArtifact(
      sha3("extFactory2"),
      sha3("v1.0.0"),
      extensionAddress,
      ContractType.Extension,
      { from: owner }
    );

    const address = await daoArtifacts.getArtifactAddress(
      sha3("extFactory2"),
      owner,
      sha3("v1.0.0"),
      ContractType.Extension
    );
    expect(address).to.be.equal(extensionAddress);
  });
});
