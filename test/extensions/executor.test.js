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
  sha3,
  toBN,
  toWei,
  ZERO_ADDRESS,
} = require("../../utils/contract-util");

const {
  revertChainSnapshot,
  takeChainSnapshot,
  deployDefaultDao,
  ERC20MinterContract,
  ProxTokenContract,
  getAccounts,
  expectEvent,
  web3,
  ExecutorExtension,
} = require("../../utils/hardhat-test-util");

const {
  executorExtensionAclFlagsMap,
  entryDao,
  entryExecutor,
} = require("../../utils/access-control-util");

const { extensionsIdsMap } = require("../../utils/dao-ids-util");

describe("Extension - Executor", () => {
  let accounts, daoOwner, creator;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];
    creator = accounts[1];

    const { dao, extensions, factories } = await deployDefaultDao({
      owner: daoOwner,
    });
    this.dao = dao;
    this.extensions = extensions;
    this.factories = factories;
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  describe("Factory", async () => {
    it("should be possible to create an extension using the factory", async () => {
      const { logs } = await this.factories.executorExtFactory.create(
        this.dao.address
      );
      const log = logs[0];
      expect(log.event).to.be.equal("ExecutorCreated");
      expect(log.args[0]).to.be.equal(this.dao.address);
      expect(log.args[1]).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should be possible to get an extension address by dao", async () => {
      await this.factories.executorExtFactory.create(this.dao.address);
      const extAddress =
        await this.factories.executorExtFactory.getExtensionAddress(
          this.dao.address
        );
      expect(extAddress).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should return zero address if there is no extension address by dao", async () => {
      const daoAddress = accounts[2];
      const extAddress =
        await this.factories.executorExtFactory.getExtensionAddress(daoAddress);
      expect(extAddress).to.be.equal(ZERO_ADDRESS);
    });

    it("should not be possible to create an extension using a zero address dao", async () => {
      await expect(this.factories.executorExtFactory.create(ZERO_ADDRESS)).to.be
        .reverted;
    });
  });

  describe("Access Control", async () => {
    it("should not be possible to call initialize more than once", async () => {
      const extension = this.extensions.executorExt;
      await expect(
        extension.initialize(this.dao.address, daoOwner)
      ).to.be.revertedWith("already initialized");
    });

    it("should be possible to call initialize with a non member", async () => {
      const extension = await ExecutorExtension.new();
      await extension.initialize(this.dao.address, creator);
      expect(await extension.initialized()).to.be.true;
    });

    it("should not be possible to execute a delegate call without the EXECUTE permission", async () => {
      const { dao, factories, extensions } = await deployDefaultDao({
        owner: daoOwner,
        finalize: false,
      });

      const erc20Minter = await ERC20MinterContract.new();
      const executorExt = extensions.executorExt;

      await factories.daoFactory.addAdapters(
        dao.address,
        [
          entryDao("erc20Minter", erc20Minter.address, {
            dao: [],
            extensions: {},
          }),
        ],
        { from: daoOwner }
      );

      await factories.daoFactory.configureExtension(
        dao.address,
        executorExt.address,
        [
          entryExecutor(erc20Minter.address, {
            dao: [], // no access granted
            extensions: {}, // no access granted
          }),
        ],
        { from: daoOwner }
      );

      await dao.finalizeDao({ from: daoOwner });

      const minterAddress = await dao.getAdapterAddress(sha3("erc20Minter"));
      expect(minterAddress).to.not.be.null;

      const proxToken = await ProxTokenContract.new();
      expect(proxToken).to.not.be.null;

      await expect(
        erc20Minter.execute(dao.address, proxToken.address, toBN("10000"), {
          from: daoOwner,
        })
      ).to.be.revertedWith("accessDenied");
    });
  });

  it("should be possible to create a dao with an executor extension pre-configured", async () => {
    const { dao } = await deployDefaultDao({
      owner: daoOwner,
    });
    const executorAddress = await dao.getExtensionAddress(sha3("executor-ext"));
    expect(executorAddress).to.not.be.null;
  });

  it("should be possible to mint tokens using a delegated call via executor extension", async () => {
    const { dao, factories, extensions } = await deployDefaultDao({
      owner: daoOwner,
      finalize: false,
    });

    const erc20Minter = await ERC20MinterContract.new();
    const executorExt = extensions.executorExt;

    await factories.daoFactory.addAdapters(
      dao.address,
      [
        entryDao("erc20Minter", erc20Minter.address, {
          dao: [],
          extensions: {},
        }),
      ],
      { from: daoOwner }
    );

    await factories.daoFactory.configureExtension(
      dao.address,
      executorExt.address,
      [
        entryExecutor(erc20Minter.address, {
          extensions: {
            [extensionsIdsMap.EXECUTOR_EXT]: [
              executorExtensionAclFlagsMap.EXECUTE,
            ],
          },
        }),
      ],
      { from: daoOwner }
    );

    await dao.finalizeDao({ from: daoOwner });

    const minterAddress = await dao.getAdapterAddress(sha3("erc20Minter"));
    expect(minterAddress).to.not.be.null;

    const proxToken = await ProxTokenContract.new();
    expect(proxToken).to.not.be.null;
    const call = erc20Minter.execute(
      dao.address,
      proxToken.address,
      toBN("10000"),
      {
        from: daoOwner,
      }
    );
    // The adapter should call itself via proxy and mint the token
    await expectEvent(
      call,
      "Minted",
      erc20Minter.address,
      proxToken.address,
      "10000"
    );
    // The token mint call should be triggered from the adapter, but the
    // sender is actually the proxy executor contract
    const events = await proxToken.getPastEvents();
    const mintEvent = events[1];
    expect(mintEvent.event).to.be.equal("MintedProxToken");
    expect(mintEvent.args[0]).to.be.equal(executorExt.address);
    expect(mintEvent.args[1].toString()).to.be.equal("10000");
  });

  it("should not be possible to send ETH to the extension without the ACL permission", async () => {
    const { dao, extensions } = await deployDefaultDao({
      owner: daoOwner,
      finalize: false,
    });

    const executorExt = extensions.executorExt;

    await dao.finalizeDao({ from: daoOwner });

    await expect(
      web3.eth.sendTransaction({
        to: executorExt.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
      })
    ).to.be.revertedWith("executorExt::accessDenied");
  });
});
