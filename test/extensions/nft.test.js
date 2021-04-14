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
  deployDefaultNFTDao,
  takeChainSnapshot,
  revertChainSnapshot,
  accounts,
  ETH_TOKEN,
  expectRevert,
} = require("../../utils/DaoFactory.js");

describe("Extension - NFT", () => {
  const daoOwner = accounts[0];

  beforeAll(async () => {
    const {
      dao,
      adapters,
      extensions,
      testContracts,
    } = await deployDefaultNFTDao(daoOwner);
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
    const nftExtension = this.extensions.nft;
    expect(nftExtension).not.toBeNull();
  });

  it("should be possible to create a dao and register a new NFT token to the collection", async () => {
    const nftExtension = this.extensions.nft;
    const pixelNFT = this.testContracts.pixelNFT;
    const isAllowed = await nftExtension.isNFTAllowed(pixelNFT.address);
    expect(isAllowed).toEqual(true);
  });

  it("should be possible check how many NFTs are in the collection", async () => {
    const nftExtension = this.extensions.nft;
    const total = await nftExtension.nbNFTs();
    expect(total.toString()).toEqual("0");
  });

  it("should be possible get an NFT in the collection using the index", async () => {
    const nftExtension = this.extensions.nft;
    // const nftAddr = await nftExtension.getNFTByIndex(0);
    // expect(nftAddr).toEqual("0x0");
  });

  it("should not be possible get an NFT in the collection if it is empty", async () => {
    const nftExtension = this.extensions.nft;
    await expectRevert.unspecified(nftExtension.getNFTByIndex(0));
  });

  it("should not be possible to register a new NFT without the REGISTER_NEW_NFT permission", async () => {
    const nftExtension = this.extensions.nft;
    await expectRevert(
      nftExtension.registerPotentialNewNFT(ETH_TOKEN, {
        from: accounts[6],
      }),
      "nft::accessDenied::notCreator"
    );
  });

  it("should not be possible to register a new NFT without the REGISTER_NEW_NFT permission", async () => {
    const nftExtension = this.extensions.nft;
    await expectRevert(
      nftExtension.registerPotentialNewNFT(ETH_TOKEN, {
        from: accounts[6],
      }),
      "nft::accessDenied::notCreator"
    );
  });

  it("should be possible to register a new NFT if you are the extension creator", async () => {
    const nftExtension = this.extensions.nft;
    await nftExtension.registerPotentialNewNFT(ETH_TOKEN, {
      from: daoOwner,
    });
    const isAllowed = await nftExtension.isNFTAllowed(ETH_TOKEN);
    expect(isAllowed).toEqual(true);
  });

  it("should not be possible to return a NFT without the RETURN permission", async () => {
    const nftExtension = this.extensions.nft;
    const pixelNFT = this.testContracts.pixelNFT;
    await expectRevert(
      nftExtension.returnNFT(accounts[1], pixelNFT.address, 1),
      "nft::accessDenied"
    );
  });

  it("should not be possible to transfer a NFT without the TRANSFER permission", async () => {
    const nftExtension = this.extensions.nft;
    const pixelNFT = this.testContracts.pixelNFT;
    await expectRevert(
      nftExtension.transferFrom(accounts[1], pixelNFT.address, 1),
      "nft::accessDenied"
    );
  });

  it("should not be possible to initialize the extension if it was already initialized", async () => {
    const nftExtension = this.extensions.nft;
    await expectRevert(
      nftExtension.initialize(this.dao.address, accounts[0]),
      "already initialized"
    );
  });

  it("should not be possible to collect a NFT that is not allowed", async () => {
    const nftAdapter = this.adapters.nftAdapter;
    const fakeNFTAddr = accounts[2];
    await expectRevert(
      nftAdapter.collect(this.dao.address, accounts[1], fakeNFTAddr, 1),
      "nft not allowed"
    );
  });

  it("should be possible to collect a NFT that is allowed", async () => {
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;

    const nftOwner = accounts[1];
    await pixelNFT.mintPixel(nftOwner, 1, 1);

    const pastEvents = await pixelNFT.getPastEvents();
    const { owner, tokenId, uri, metadata } = pastEvents[1].returnValues;

    expect(tokenId).toEqual("1");
    expect(uri).toEqual("https://www.openlaw.io/nfts/pix/1");
    expect(metadata).toEqual("pixel: 1,1");
    expect(owner).toEqual(nftOwner);

    const nftExtension = this.extensions.nft;
    await pixelNFT.approve(nftExtension.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    const nftAdapter = this.adapters.nftAdapter;
    await nftAdapter.collect(dao.address, nftOwner, pixelNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    // Make sure it was collected
    const nftAddr = await nftExtension.getNFTByIndex(0);
    expect(nftAddr).toEqual(pixelNFT.address);
  });
});
