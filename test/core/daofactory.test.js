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

const { toBN } = require("../../utils/contract-util");

const { cloneDao } = require("../../utils/deployment-util");

const {
  accounts,
  expect,
  DaoRegistry,
  DaoFactory,
  deployFunction,
} = require("../../utils/oz-util");

describe("Core - DaoFactory", () => {
  const owner = accounts[1];
  const anotherOwner = accounts[2];

  const createIdentityDao = () => {
    return DaoRegistry.new({
      from: owner,
      gasPrice: toBN("0"),
    });
  };

  it("should be possible create an identity dao and clone it", async () => {
    const identityDao = await createIdentityDao();

    const { daoName } = await cloneDao({
      identityDao,
      owner: anotherOwner,
      name: "cloned-dao",
      DaoRegistry,
      DaoFactory,
      deployFunction,
    });

    expect(daoName).equal("cloned-dao");
  });

  it("should be possible to get a DAO address by its name if it was created by the factory", async () => {
    const identityDao = await createIdentityDao();

    const { daoFactory, dao } = await cloneDao({
      identityDao,
      owner: anotherOwner,
      name: "new-dao",
      DaoRegistry,
      DaoFactory,
      deployFunction,
    });

    const retrievedAddress = await daoFactory.getDaoAddress("new-dao", {
      from: anotherOwner,
      gasPrice: toBN("0"),
    });
    expect(retrievedAddress).equal(dao.address);
  });

  it("should not be possible to get a DAO address of it was not created by the factory", async () => {
    const identityDao = await createIdentityDao();

    const { daoFactory } = await cloneDao({
      identityDao,
      owner: anotherOwner,
      name: "new-dao",
      DaoRegistry,
      DaoFactory,
      deployFunction,
    });

    let retrievedAddress = await daoFactory.getDaoAddress("random-dao", {
      from: anotherOwner,
      gasPrice: toBN("0"),
    });

    expect(retrievedAddress).equal(
      "0x0000000000000000000000000000000000000000"
    );
  });
});
