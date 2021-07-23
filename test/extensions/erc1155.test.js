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

const { toBN, GUILD } = require("../../utils/ContractUtil.js");

const {
  takeChainSnapshot,
  revertChainSnapshot,
  deployDefaultNFTDao,
  accounts,
  expectRevert,
  expect,
} = require("../../utils/OZTestUtil.js");

describe("Extension - ERC1155", () => {
  const daoOwner = accounts[0];

  before("deploy dao", async () => {
    const {
      dao,
      adapters,
      extensions,
      testContracts,
    } = await deployDefaultNFTDao({ owner: daoOwner });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.testContracts = testContracts;
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  it("should be possible to create a dao with a nft extension pre-configured", async () => {
    const erc1155TokenExtension = this.extensions.ERC1155TokenExtension;
    expect(erc1155TokenExtension).to.not.be.null;
  });

  it("should be possible check how many NFTs are in the collection", async () => {
    const erc1155TokenExtension = this.extensions.ERC1155TokenExtension;
    const erc1155TestToken = this.testContracts.ERC1155TestToken;
    const total = await erc1155TokenExtension.nbNFTs(erc1155TestToken.address);
    expect(total.toString()).equal("0");
  });

  it("should not be possible get an NFT in the collection if it is empty", async () => {
    const erc1155TokenExtension = this.extensions.ERC1155TokenExtension;
    const erc1155TestToken = this.testContracts.ERC1155TestToken;
    await expectRevert(
      erc1155TokenExtension.getNFT(erc1155TestToken.address, 0),
      "index out of bounds"
    );
  });

  it("should not be possible to return a NFT without the RETURN permission", async () => {
    const erc1155TokenExtension = this.extensions.ERC1155TokenExtension;
    const erc1155TestToken = this.testContracts.ERC1155TestToken;
    await expectRevert(
      erc1155TokenExtension.withdrawNFT(
        accounts[1],
        erc1155TestToken.address,
        1
      ),
      "nft::accessDenied"
    );
  });

  it("should be possible check how many NFTs are in the collection", async () => {
    const erc1155TokenExtension = this.extensions.ERC1155TokenExtension;
    const total = await erc1155TokenExtension.nbNFTAddresses();
    expect(total.toString()).equal("0");
  });

  it("should not be possible to initialize the extension if it was already initialized", async () => {
    const erc1155TokenExtension = this.extensions.ERC1155TokenExtension;
    await expectRevert(
      erc1155TokenExtension.initialize(this.dao.address, accounts[0]),
      "already initialized"
    );
  });
});
