const Web3 = require('web3-utils');
const Registry = artifacts.require('./v3/core/Registry');
const FlagHelperLib = artifacts.require('./v3/helpers/FlagHelper');
Registry.link

contract('Registry', async () => {
  
  let lib = await FlagHelperLib.new();
  await Registry.link("FlagHelper", lib.address);

  it("should not be possible to add a module with invalid id", async () => {
    let moduleId = Web3.fromUtf8("");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await Registry.new();
    try {
      await registry.addModule(moduleId, moduleAddress);
    } catch (error) {
      assert.equal(error.reason, "module id must not be empty");
    }
  });

  it("should not be possible to remove a module when it not registered", async () => {
    let moduleId = Web3.fromUtf8("1");
    let registry = await Registry.new();
    try {
      await registry.removeModule(moduleId);
    } catch (error) {
      assert.equal(error.reason, "module not registered");
    }
  });

  it("should not be possible to add a module with invalid address", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "";
    let registry = await Registry.new();
    try {
      await registry.addModule(moduleId, moduleAddress);
    } catch (error) {
      assert.equal(error.reason, "invalid address");
    }
  });

  it("should not be possible to add a module with empty address", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "0x0000000000000000000000000000000000000000";
    let registry = await Registry.new();
    try {
      await registry.addModule(moduleId, moduleAddress);
    } catch (error) {
      assert.equal(error.reason, "module address must not be empty");
    }
  });

  it("should not be possible to add a module when the id is already in use", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await Registry.new();
    //Add a module with id 1
    await registry.addModule(moduleId, moduleAddress);

    try {
      //Try to add another module using the same id 1
      await registry.addModule(moduleId, "0xd7bCe30D77DE56E3D21AEfe7ad144b3134438F5B");
    } catch (error) {
      assert.equal(error.reason, "module id already in use");
    }
  });

  it("should be possible to add a module with a valid id and address", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await Registry.new();
    await registry.addModule(moduleId, moduleAddress);
    let address = await registry.getAddress(moduleId);
    assert.equal(address, moduleAddress);
  });

  it("should be possible to remove a module", async () => {
    let moduleId = Web3.fromUtf8("2");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let registry = await Registry.new();
    await registry.addModule(moduleId, moduleAddress);
    let address = await registry.getAddress(moduleId);
    assert.equal(address, moduleAddress);
    await registry.removeModule(moduleId);
    address = await registry.getAddress(moduleId);
    assert.equal(address, "0x0000000000000000000000000000000000000000");
  });

  it("should not be possible to remove a module that is not registered", async () => {
    let moduleId = Web3.fromUtf8("1");
    let registry = await Registry.new();

    try {
      await registry.removeModule(moduleId);
    } catch (error) {
      assert.equal(error.reason, "module not registered");
    }
  });

  it("should not be possible to remove a module with an empty id", async () => {
    let moduleId = Web3.fromUtf8("");
    let registry = await Registry.new();

    try {
      await registry.removeModule(moduleId);
    } catch (error) {
      assert.equal(error.reason, "module id must not be empty");
    }
  });

  it("should be possible to update delegate key", async () => {
    const myAccount = accounts[1];
    const delegateKey = accounts[2];
    let dao = await createDao({}, myAccount);

    const onboardingAddr = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddr);

    const myAccountActive1 = await dao.isActiveMember(myAccount);
    const delegateKeyActive1 = await dao.isActiveMember(delegateKey);

    assert.true(myAccountActive1);
    assert.false(delegateKeyActive1);

    await onboarding.updateDelegateKey(dao.address, delegateKey, { from: myAccount, gasPrice: toBN("0") });

    const myAccountActive2 = await dao.isActiveMember(myAccount);
    const delegateKeyActive2 = await dao.isActiveMember(delegateKey);

    assert.false(myAccountActive2);
    assert.true(delegateKeyActive2);
  });
});