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
  createDao,
  sharePrice,
  numberOfShares,
  BankExtension,
  BankFactory,
  ETH_TOKEN,
} = require("../../../utils/DaoFactory.js");

contract("MolochV3 - Bank Extension", async (accounts) => {

  it("should be possible to create a dao with a bank extension pre-configured", async () => {
    const daoOwner = accounts[0];
    let dao = await createDao(daoOwner);

    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    assert.notEqual(bankAddress, null);
  });

  it("should be possible to get all the tokens registered in the bank", async () => {
    const daoOwner = accounts[0];
    let dao = await createDao(daoOwner);

    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);
    const tokens = await bank.getTokens();
    assert.equal(tokens.toString(), [ETH_TOKEN].toString());
  });

  it("should be possible to get a registered token using the token index", async () => {
    const daoOwner = accounts[0];
    let dao = await createDao(daoOwner);

    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);
    const token = await bank.getToken(0);
    assert.equal(token.toString(), ETH_TOKEN.toString());
  });

  it("should be possible to get the total amount of tokens registered in the bank", async () => {
    const daoOwner = accounts[0];
    let dao = await createDao(daoOwner);

    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);
    const totalTokens = await bank.nbTokens();
    assert.equal(totalTokens, 1);
  });

  it("should not be possible to create a bank that supports more than 200 external tokens", async () => {
    const maxExternalTokens = 201;
    try {
      const identityBank = await BankExtension.deployed();
      const bankFactory = await BankFactory.new(identityBank.address);
      await bankFactory.createBank(maxExternalTokens);
      assert.fail("should not be possible to create the bank extension");
    } catch (e) {
      assert.equal(e.reason, "max number of external tokens should be (0,200)");
    }
  });

  it("should not be possible to create a bank that supports 0 external tokens", async () => {
    const maxExternalTokens = 0;
    try {
      const identityBank = await BankExtension.deployed();
      const bankFactory = await BankFactory.new(identityBank.address);
      await bankFactory.createBank(maxExternalTokens);
      assert.fail("should not be possible to create the bank extension");
    } catch (e) {
      assert.equal(e.reason, "max number of external tokens should be (0,200)");
    }
  });

  it("should not be possible to set the max external tokens if bank is already initialized", async () => {
    const maxExternalTokens = 10;
    const daoOwner = accounts[0];
    const dao = await createDao(
      daoOwner,
      sharePrice,
      numberOfShares,
      10,
      1,
      ETH_TOKEN,
      true,
      maxExternalTokens
    );

    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);
    try {
      await bank.setMaxExternalTokens(10);
      assert.equal(
        "should not be possible to set the max external tokens if the bank is initialized"
      );
    } catch (e) {
      assert.equal(e.reason, "bank already initialized");
    }
  });
});
