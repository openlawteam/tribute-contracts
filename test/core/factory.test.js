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
const DaoFactory = artifacts.require("./core/DaoFactory");
const DaoRegistry = artifacts.require("./core/DaoRegistry");
const FlagHelperLib = artifacts.require("./helpers/FlagHelper");

const { sha3, toBN, addDefaultAdapters } = require("../../utils/DaoFactory.js");

contract("DaoFactory", async (accounts) => {
  const owner = accounts[1];
  const anotherOwner = accounts[2];

  const createIdentityDAO = async (owner) => {
    let lib = await FlagHelperLib.new();
    await DaoRegistry.link("FlagHelper", lib.address);

    let identityDao = await DaoRegistry.new({
      from: owner,
      gasPrice: toBN("0"),
    });
    return identityDao;
  };

  const cloneDao = async (
    owner,
    identityAddr,
    name,
    keys = [],
    values = [],
    finalizeDao = false
  ) => {
    let daoFactory = await DaoFactory.new(identityAddr);
    await daoFactory.createDao(name, keys, values, finalizeDao, {
      from: owner,
      gasPrice: toBN("0"),
    });

    let pastEvents = await daoFactory.getPastEvents();
    let { _address, _name } = pastEvents[0].returnValues;
    return { daoFactory, daoAddress: _address, daoName: _name };
  };

  it("should be possible create an identity dao and clone it", async () => {
    let identityDao = await createIdentityDAO(owner);

    let { daoName } = await cloneDao(
      anotherOwner,
      identityDao.address,
      "cloned-dao"
    );

    assert.equal("cloned-dao", daoName);
  });

  it("should be possible to get a DAO address by its name if it was created by the factory", async () => {
    let identityDao = await createIdentityDAO(owner);

    let { daoFactory, daoName, daoAddress } = await cloneDao(
      anotherOwner,
      identityDao.address,
      "new-dao"
    );

    assert.equal(daoName, "new-dao");

    let retrievedAddress = await daoFactory.getDaoAddress("new-dao", {
      from: anotherOwner,
      gasPrice: toBN("0"),
    });
    assert.equal(daoAddress, retrievedAddress);
  });

  it("should not be possible to get a DAO address of it was not created by the factory", async () => {
    let identityDao = await createIdentityDAO(owner);

    let { daoFactory } = await cloneDao(
      anotherOwner,
      identityDao.address,
      "new-dao"
    );

    let retrievedAddress = await daoFactory.getDaoAddress("random-dao", {
      from: anotherOwner,
      gasPrice: toBN("0"),
    });

    assert.equal(
      "0x0000000000000000000000000000000000000000",
      retrievedAddress
    );
  });

  it("should be possible to clone a DAO with configurations parameters", async () => {
    let identityDao = await createIdentityDAO(owner);

    let key1 = sha3("key1");
    let key2 = sha3("key2");
    let keys = [key1, key2];
    let values = [toBN("10"), toBN("15")];
    let { daoAddress, daoName } = await cloneDao(
      anotherOwner,
      identityDao.address,
      "dao-with-configs",
      keys,
      values
    );

    assert.equal("dao-with-configs", daoName);

    let newDao = await DaoRegistry.at(daoAddress);

    let value1 = await newDao.getConfiguration(key1);
    assert.equal("10", value1.toString());
    let value2 = await newDao.getConfiguration(key2);
    assert.equal("15", value2.toString());
  });

  it("should be possible to configure a DAO after it has been cloned", async () => {
    let identityDao = await createIdentityDAO(owner);

    let { daoFactory, daoAddress, daoName } = await cloneDao(
      anotherOwner,
      identityDao.address,
      "dao-config"
    );

    assert.equal("dao-config", daoName);

    let key1 = sha3("key1");
    let key2 = sha3("key2");
    let keys = [key1, key2];
    let values = [toBN("123"), toBN("456")];
    await daoFactory.configureDao(daoAddress, keys, values, false, {
      from: owner,
      gasPrice: toBN("0"),
    });

    let newDao = await DaoRegistry.at(daoAddress);
    let value1 = await newDao.getConfiguration(key1);
    assert.equal("123", value1.toString());
    let value2 = await newDao.getConfiguration(key2);
    assert.equal("456", value2.toString());
  });

  it("should not be possible to provide a different number of keys and values", async () => {
    let identityDao = await createIdentityDAO(owner);

    let { daoFactory, daoAddress, daoName } = await cloneDao(
      anotherOwner,
      identityDao.address,
      "dao-config"
    );

    assert.equal("dao-config", daoName);

    try {
      await daoFactory.configureDao(
        daoAddress,
        [sha3("key1")], //keys length == 1
        [], //values length == 0
        false,
        {
          from: anotherOwner,
          gasPrice: toBN("0"),
        }
      );
      assert.fail(
        "should not be possible to provide a different number of keys and values"
      );
    } catch (err) {
      assert.equal("invalid keys and values", err.reason);
    }

    try {
      await daoFactory.configureDao(
        daoAddress,
        [], //keys length == 0
        [toBN("123")], //values length == 1
        false,
        {
          from: anotherOwner,
          gasPrice: toBN("0"),
        }
      );
      assert.fail(
        "should not be possible to provide a different number of keys and values"
      );
    } catch (err) {
      assert.equal("invalid keys and values", err.reason);
    }
  });
});
