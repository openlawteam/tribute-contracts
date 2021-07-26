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

  it("should be possible to collect a NFT that is allowed", async () => {
    const erc1155TestToken = this.testContracts.ERC1155TestToken;

    const nftOwner = accounts[1];

    await erc1155TestToken.mint(nftOwner, 1, 10, "0x0");

    const pastEvents = await erc1155TestToken.getPastEvents();

    const { operator, from, to, tokenId, amount } = pastEvents[1].returnValues;

    expect(tokenId).equal("1");
    expect(amount).equal("10");
    // expect(owner).equal(nftOwner);

    const erc1155TokenExtension = this.extensions.ERC1155TokenExtension;
    //set approval where Extension is the "operator" all of nftOwners
    await erc1155TestToken.setApprovalForAll(
      erc1155TokenExtension.address,
      true,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    const erc1155Adapter = this.adapters.erc1155Adapter;
    //collect 2 tokens of tokenId
    await erc1155Adapter.collect(
      this.dao.address,
      erc1155TestToken.address,
      tokenId,
      2,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    // Make sure it was collected
    const nftAddr = await erc1155TokenExtension.getNFTAddress(0);
    expect(nftAddr).equal(erc1155TestToken.address);
    const nftId = await erc1155TokenExtension.getNFT(nftAddr, 0);
    expect(nftId.toString()).equal(tokenId.toString());
    //check token balance of nftOwner after collection = -2
    const balanceOfnftOwner = erc1155TokenExtension.balanceOf(nftOwner, 1);
    expect(balanceOfnftOwner.toString()).equal("8");
    //check token balance of the GUILD = +2 
    const newGuildBlance = erc1155TokenExtension.balanceOf(GUILD, 8);
    expect(newGuildBlance.toString()).equal("2");

    const newOwner = await erc1155TokenExtension.getNFTOwner(nftAddr, tokenId);
    expect(newOwner.toLowerCase()).equal(GUILD.toLowerCase());
    //Felipe -  test the withdrawal?
  });
});
