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
const { toBN, ZERO_ADDRESS } = require("../../utils/contract-util");

const {
  getAccounts,
  DaoRegistry,
  CloneFactoryTest,
} = require("../../utils/hardhat-test-util");

describe("Core - CloneFactory", () => {
  let accounts, owner, anotherOwner;

  before("setup", async () => {
    accounts = await getAccounts();
    owner = accounts[0];
    anotherOwner = accounts[2];
  });

  it("should be possible create a clone", async () => {
    const dao = await DaoRegistry.new();
    const factory = await CloneFactoryTest.new(dao.address);
    const { logs } = await factory.create();
    const log = logs[0];
    expect(log.event).to.be.equal("Created");
    expect(log.args[0]).to.not.be.equal(ZERO_ADDRESS);
    expect(log.args[0]).to.be.match(/^0x[a-fA-F0-9]{40}$/);
  });
});
