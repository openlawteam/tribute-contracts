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
  toWei,
  toBN,
  fromAscii,
  fromUtf8,
  ETH_TOKEN,
} = require("../../utils/contract-util");

const {
  DaoRegistry,
  web3,
  getAccounts,
} = require("../../utils/hardhat-test-util");

describe("Core - Registry", () => {
  let accounts, owner;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    owner = accounts[0];
  });

  it("should not be possible to add a module with invalid id", async () => {
    let moduleId = fromUtf8("");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await DaoRegistry.new();
    await expect(
      registry.replaceAdapter(moduleId, moduleAddress, 0, [], [])
    ).to.be.revertedWith("adapterId must not be empty");
  });

  it("should not be possible to add an adapter with invalid id", async () => {
    let adapterId = fromUtf8("");
    let adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await DaoRegistry.new();
    await expect(
      registry.replaceAdapter(adapterId, adapterAddr, 0, [], [])
    ).to.be.revertedWith("adapterId must not be empty");
  });

  it("should be possible to replace an adapter when the id is already in use", async () => {
    let adapterId = fromUtf8("1");
    let adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let newAdapterAddr = "0xd7bCe30D77DE56E3D21AEfe7ad144b3134438F5B";
    let registry = await DaoRegistry.new();
    //Add a module with id 1
    await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
    await registry.replaceAdapter(adapterId, newAdapterAddr, 0, [], []);
    let address = await registry.getAdapterAddress(adapterId);
    expect(address).equal(newAdapterAddr);
  });

  it("should be possible to add an adapter with a valid id and address", async () => {
    let adapterId = fromUtf8("1");
    let adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await DaoRegistry.new();
    await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
    let address = await registry.getAdapterAddress(adapterId);
    expect(address).equal(adapterAddr);
  });

  it("should be possible to remove an adapter", async () => {
    let adapterId = fromUtf8("2");
    let adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await DaoRegistry.new();
    await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
    let address = await registry.getAdapterAddress(adapterId);
    expect(address).equal(adapterAddr);
    await registry.replaceAdapter(adapterId, ETH_TOKEN, 0, [], []);
    await expect(registry.getAdapterAddress(adapterId)).to.be.revertedWith(
      "adapter not found"
    );
  });

  it("should not be possible to remove an adapter with an empty id", async () => {
    let adapterId = fromUtf8("");
    let registry = await DaoRegistry.new();
    await expect(
      registry.replaceAdapter(adapterId, ETH_TOKEN, 0, [], [])
    ).to.be.revertedWith("adapterId must not be empty");
  });

  it("should not be possible for a zero address to be considered a member", async () => {
    let registry = await DaoRegistry.new();
    let isMember = await registry.isMember(
      "0x0000000000000000000000000000000000000000"
    );
    expect(isMember).equal(false);
  });

  it("should not be possible to send ETH to the DaoRegistry via receive function", async () => {
    let registry = await DaoRegistry.new();
    await expect(
      web3.eth.sendTransaction({
        to: registry.address,
        from: accounts[0],
        gasPrice: toBN("0"),
        value: toWei("1"),
      })
    ).to.be.revertedWith("revert");
  });

  it("should not be possible to send ETH to the DaoRegistry via fallback function", async () => {
    let registry = await DaoRegistry.new();
    await expect(
      web3.eth.sendTransaction({
        to: registry.address,
        from: accounts[0],
        gasPrice: toBN("0"),
        value: toWei("1"),
        data: fromAscii("should go to fallback func"),
      })
    ).to.be.revertedWith("revert");
  });
});
