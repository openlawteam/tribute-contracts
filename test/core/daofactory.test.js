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
  toBN,
  accounts,
  createIdentityDao,
  cloneDao,
} = require("../../utils/DaoFactory.js");

describe("Core - DaoFactory", () => {
  const owner = accounts[1];
  const anotherOwner = accounts[2];

  test("should be possible create an identity dao and clone it", async () => {
    let identityDao = await createIdentityDao(owner);

    let { daoName } = await cloneDao(
      null,
      identityDao,
      anotherOwner,
      "cloned-dao"
    );

    expect(daoName).toEqual("cloned-dao");
  });

  test("should be possible to get a DAO address by its name if it was created by the factory", async () => {
    let identityDao = await createIdentityDao(owner);

    let { daoFactory, dao } = await cloneDao(
      null,
      identityDao,
      anotherOwner,
      "new-dao"
    );

    let retrievedAddress = await daoFactory.getDaoAddress("new-dao", {
      from: anotherOwner,
      gasPrice: toBN("0"),
    });
    expect(retrievedAddress).toEqual(dao.address);
  });

  test("should not be possible to get a DAO address of it was not created by the factory", async () => {
    let identityDao = await createIdentityDao(owner);

    let { daoFactory } = await cloneDao(
      null,
      identityDao,
      anotherOwner,
      "new-dao"
    );

    let retrievedAddress = await daoFactory.getDaoAddress("random-dao", {
      from: anotherOwner,
      gasPrice: toBN("0"),
    });

    expect(retrievedAddress).toEqual(
      "0x0000000000000000000000000000000000000000"
    );
  });
});
