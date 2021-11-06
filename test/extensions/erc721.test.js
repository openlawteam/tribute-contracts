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
const { toWei, toBN, fromAscii, GUILD } = require("../../utils/contract-util");

const {
  takeChainSnapshot,
  revertChainSnapshot,
  deployDefaultNFTDao,
  accounts,
  expectRevert,
  expect,
  web3,
} = require("../../utils/oz-util");

describe("Extension - ERC721", () => {
  const daoOwner = accounts[0];

  before("deploy dao", async () => {
    const { dao, adapters, extensions, testContracts } =
      await deployDefaultNFTDao({ owner: daoOwner });
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
    const nftExtension = this.extensions.erc721Ext;
    expect(nftExtension).to.not.be.null;
  });

  it("should be possible check how many NFTs are in the collection", async () => {
    const nftExtension = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    const total = await nftExtension.nbNFTs(pixelNFT.address);
    expect(total.toString()).equal("0");
  });

  it("should not be possible get an NFT in the collection if it is empty", async () => {
    const nftExtension = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    await expectRevert(nftExtension.getNFT(pixelNFT.address, 0), "revert");
  });

  it("should not be possible to return a NFT without the RETURN permission", async () => {
    const nftExtension = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    await expectRevert(
      nftExtension.withdrawNFT(accounts[1], pixelNFT.address, 1),
      "erc721::accessDenied"
    );
  });

  it("should be possible check how many NFTs are in the collection", async () => {
    const nftExtension = this.extensions.erc721Ext;
    const total = await nftExtension.nbNFTAddresses();
    expect(total.toString()).equal("0");
  });

  it("should not be possible to initialize the extension if it was already initialized", async () => {
    const nftExtension = this.extensions.erc721Ext;
    await expectRevert(
      nftExtension.initialize(this.dao.address, accounts[0]),
      "erc721::already initialized"
    );
  });

  it("should be possible to collect a NFT that is allowed", async () => {
    const pixelNFT = this.testContracts.pixelNFT;

    const nftOwner = accounts[1];
    await pixelNFT.mintPixel(nftOwner, 1, 1);

    const pastEvents = await pixelNFT.getPastEvents();
    const { owner, tokenId, uri, metadata } = pastEvents[1].returnValues;

    expect(tokenId).equal("1");
    expect(uri).equal("https://www.openlaw.io/nfts/pix/1");
    expect(metadata).equal("pixel: 1,1");
    expect(owner).equal(nftOwner);

    const nftExtension = this.extensions.erc721Ext;
    await pixelNFT.approve(nftExtension.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    const nftAdapter = this.adapters.nftAdapter;
    await nftAdapter.collect(this.dao.address, pixelNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    // Make sure it was collected
    const nftAddr = await nftExtension.getNFTAddress(0);
    expect(nftAddr).equal(pixelNFT.address);
    const nftId = await nftExtension.getNFT(nftAddr, 0);
    expect(nftId.toString()).equal(tokenId.toString());
    const newOwner = await nftExtension.getNFTOwner(nftAddr, tokenId);
    expect(newOwner.toLowerCase()).equal(GUILD.toLowerCase());
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.nftAdapter;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
      }),
      "revert"
    );
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const adapter = this.adapters.nftAdapter;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
        data: fromAscii("should go to fallback func"),
      }),
      "revert"
    );
  });
});
