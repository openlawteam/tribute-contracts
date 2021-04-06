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
  fromUtf8,
  accounts,
  ETH_TOKEN,
  DaoRegistry,
} = require("../../utils/DaoFactory.js");

describe("MolochV3 - Core - Registry", () => {
  it("should not be possible to add an adapter with invalid id", async () => {
    let adapterId = fromUtf8("");
    let adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await DaoRegistry.new();
    try {
      await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
      assert.fail("should not be possible to add the adapter");
    } catch (error) {
      assert.equal(error.reason, "adapterId must not be empty");
    }
  });

  it("should not be possible to remove an adapter when it is not registered [ @skip-on-coverage ]", async () => {
    let adapterId = fromUtf8("1");
    let registry = await DaoRegistry.new();
    try {
      await registry.replaceAdapter(adapterId, ETH_TOKEN, 0, [], []);
      assert.fail("should not be possible to remove the adapter");
    } catch (error) {
      assert.equal(error.reason, "adapterId not registered");
    }
  });

  it("should not be possible to add an adapter with invalid address [ @skip-on-coverage ]", async () => {
    let adapterId = fromUtf8("1");
    let adapterAddr = "";
    let registry = await DaoRegistry.new();
    try {
      await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
      assert.fail("should not be possible to add the adapter");
    } catch (error) {
      assert.equal(error.reason.indexOf("invalid address"), 0);
    }
  });

  it("should not be possible to add an adapter with empty address", async () => {
    let adapterId = fromUtf8("1");
    let adapterAddr = "0x0000000000000000000000000000000000000000";
    let registry = await DaoRegistry.new();
    try {
      await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
      assert.fail("should not be possible to add the adapter");
    } catch (error) {
      assert.equal(error.reason, "adapterAddress must not be empty");
    }
  });

  it("should not be possible to add an adapter when the id is already in use", async () => {
    let adapterId = fromUtf8("1");
    let adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await DaoRegistry.new();
    //Add a module with id 1
    await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);

    try {
      //Try to add another module using the same id 1
      await registry.replaceAdapter(
        adapterId,
        "0xd7bCe30D77DE56E3D21AEfe7ad144b3134438F5B",
        0,
        [],
        []
      );
      assert.fail("should not be possible to add the adapter");
    } catch (error) {
      assert.equal(error.reason, "adapterId already in use");
    }
  });

  it("should be possible to add an adapter with a valid id and address", async () => {
    let adapterId = fromUtf8("1");
    let adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await DaoRegistry.new();
    await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
    let address = await registry.getAdapterAddress(adapterId);
    assert.equal(address, adapterAddr);
  });

  it("should be possible to remove an adapter", async () => {
    let adapterId = fromUtf8("2");
    let adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await DaoRegistry.new();
    await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
    let address = await registry.getAdapterAddress(adapterId);
    assert.equal(address, adapterAddr);
    await registry.replaceAdapter(adapterId, ETH_TOKEN, 0, [], []);
    try {
      await registry.getAdapterAddress(adapterId);
      assert.fail("should not be possible to remove the adapter");
    } catch (error) {
      assert.equal(
        error.toString().indexOf("revert adapter not found") > -1,
        true
      );
    }
  });

  it("should not be possible to remove an adapter that is not registered", async () => {
    let adapterId = fromUtf8("1");
    let registry = await DaoRegistry.new();

    try {
      await registry.replaceAdapter(adapterId, ETH_TOKEN, 0, [], []);
      assert.fail("should not be possible to remove the adapter");
    } catch (error) {
      assert.equal(error.reason, "adapterId not registered");
    }
  });

  it("should not be possible to remove an adapter with an empty id", async () => {
    let adapterId = fromUtf8("");
    let registry = await DaoRegistry.new();

    try {
      await registry.replaceAdapter(adapterId, ETH_TOKEN, 0, [], []);
      assert.fail("should not be possible to remove the adapter");
    } catch (error) {
      assert.equal(error.reason, "adapterId must not be empty");
    }
  });
});
