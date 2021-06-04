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
const { ETH_TOKEN, sha3 } = require("../../utils/ContractUtil.js");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  accounts,
  expectRevert,
  expect,
  BankFactory,
} = require("../../utils/OZTestUtil.js");

describe("Extension - Executor", () => {
  const daoOwner = accounts[0];

  before("deploy dao", async () => {
    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
    });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  it("should be possible to create a dao with an executor extension pre-configured", async () => {
    const dao = this.dao;
    const executorAddress = await dao.getExtensionAddress(sha3("executor-ext"));
    expect(executorAddress).to.not.be.null;
  });
});
