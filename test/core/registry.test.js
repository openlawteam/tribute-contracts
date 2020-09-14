const Web3 = require('web3-utils');
const ModuleRegistry = artifacts.require('./v3/core/Registry');

contract('Registry', async () => {

  it("should not be possible to create a dao with an invalid module id", async () => {
    let moduleId = Web3.fromUtf8("");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let contract = await ModuleRegistry.new();
    try {
      await contract.addModule(moduleId, moduleAddress);
    } catch (err) {
      assert.equal(err.reason, "module id must not be empty");
    }
  });

  it("should not be possible to remove a module from dao if the module was not registered", async () => {
    let moduleId = Web3.fromUtf8("1");
    let contract = await ModuleRegistry.new();
    try {
      await contract.removeModule(moduleId);
    } catch (err) {
      assert.equal(err.reason, "module id not registered");
    }
  });

  it("should not be possible to create a dao with an invalid module address", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "";
    let contract = await ModuleRegistry.new();
    try {
      await contract.addModule(moduleId, moduleAddress);
    } catch (err) {
      assert.equal(err.reason, "invalid address");
    }
  });

  it("should not be possible to create a dao with an empty module address", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "0x0000000000000000000000000000000000000000";
    let contract = await ModuleRegistry.new();
    try {
      await contract.addModule(moduleId, moduleAddress);
    } catch (err) {
      assert.equal(err.reason, "module address must not be empty");
    }
  });

  it("should be possible to create a dao and register at least one module to it", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let contract = await ModuleRegistry.new();
    await contract.addModule(moduleId, moduleAddress);
    let address = await contract.getAddress(moduleId);
    assert.equal(address, moduleAddress);
  });

  it("should be possible to remove a module from the dao", async () => {
    let moduleId = Web3.fromUtf8("2");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let contract = await ModuleRegistry.new();
    await contract.addModule(moduleId, moduleAddress);
    let address = await contract.getAddress(moduleId);
    assert.equal(address, moduleAddress);
    await contract.removeModule(moduleId);
    address = await contract.getAddress(moduleId);
    assert.equal(address, "0x0000000000000000000000000000000000000000");
  });
});