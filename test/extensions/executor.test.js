// Whole-script strict mode syntax
"use strict";

const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
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
const { sha3, toBN, toWei } = require("../../utils/contract-util");

const {
  deployDefaultDao,
  ERC20MinterContract,
  ProxTokenContract,
  accounts,
  web3,
  expect,
  expectRevert,
} = require("../../utils/hardhat-test-util");

const {
  executorExtensionAclFlagsMap,
  entryDao,
  entryExecutor,
} = require("../../utils/access-control-util");

const { extensionsIdsMap } = require("../../utils/dao-ids-util");

describe("Extension - Executor", () => {
  const daoOwner = accounts[0];

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

    const res = await erc20Minter.execute(
      dao.address,
      proxToken.address,
      toBN("10000"),
      { from: daoOwner }
    );
    // The adapter should call itself via proxy and mint the token
    expectEvent(res.receipt, "Minted", {
      owner: erc20Minter.address,
      amount: "10000",
    });

    // The token mint call should be triggered from the adapter, but the
    // sender is actually the proxy executor
    const pastEvents = await proxToken.getPastEvents();
    const event = pastEvents[1];
    const { owner, amount } = pastEvents[1].returnValues;
    expect(event.event).to.be.equal("MintedProxToken");
    expect(owner).to.be.equal(executorExt.address);
    expect(amount).to.be.equal("10000");
  });

  it("should not be possible to execute a delegate call without the ACL permission", async () => {
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

    await expectRevert(
      erc20Minter.execute(dao.address, proxToken.address, toBN("10000"), {
        from: daoOwner,
      }),
      "executorExt::accessDenied"
    );
  });

  it("should not be possible to send ETH to the extension without the ACL permission", async () => {
    const { dao, extensions } = await deployDefaultDao({
      owner: daoOwner,
      finalize: false,
    });

    const executorExt = extensions.executorExt;

    await dao.finalizeDao({ from: daoOwner });

    await expectRevert(
      web3.eth.sendTransaction({
        to: executorExt.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
      }),
      "executorExt::accessDenied"
    );
  });
});
