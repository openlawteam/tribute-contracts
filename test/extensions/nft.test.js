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
  createDao,
  sharePrice,
  numberOfShares,
  ETH_TOKEN,
  NFTExtension,
  getContract,
  sha3,
  toBN,
  NFTAdapterContract,
  GUILD,
} = require("../../utils/DaoFactory.js");

const { createNFTDao } = require("../../utils/TestUtils.js");

contract("MolochV3 - NFT Extension", async (accounts) => {
  it("", () => {
    //dummy test
  });

  it("should be possible to create a dao with a nft extension pre-configured", async () => {
    const daoOwner = accounts[0];
    const dao = await createDao(
      daoOwner,
      sharePrice,
      numberOfShares,
      10,
      1,
      ETH_TOKEN,
      true,
      100
    );

    const nftExtension = await dao.getExtensionAddress(sha3("nft"));
    assert.notEqual(nftExtension, null);
  });

  it("should be possible check how many NFTs are in the collection", async () => {
    const { dao } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    const total = await nftExtension.nbNFTAddresses();
    assert.equal(total, 0);
  });

  it("should not be possible to initialize the extension if it was already initialized", async () => {
    const { dao } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    try {
      await nftExtension.initialize(dao.address, accounts[0]);
      assert.fail(
        "should not be possible to initialize the extension if it was already initialized"
      );
    } catch (e) {
      assert.equal(e.reason, "already initialized");
    }
  });

  it("should be possible to collect a NFT", async () => {
    const daoOwner = accounts[0];
    const { dao, pixelNFT } = await createNFTDao(daoOwner);

    const nftOwner = accounts[1];
    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { owner, tokenId, uri, metadata } = pastEvents[1].returnValues;
    assert.equal(tokenId, 1);
    assert.equal(uri, "https://www.openlaw.io/nfts/pix/1");
    assert.equal(metadata, "pixel: 1,1");
    assert.equal(owner, nftOwner);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    await pixelNFT.approve(nftExtAddr, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    const nft = await getContract(dao, "nft", NFTAdapterContract);
    await nft.collect(dao.address, pixelNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    // Make sure it was collected
    const nftAddr = await nftExtension.getNFTAddress(0);
    const nftId = await nftExtension.getNFT(nftAddr, 0);
    assert.equal(nftAddr, pixelNFT.address);
    assert.equal(nftId, tokenId);

    // Check internal owner of record
    const newOwner = await nftExtension.getNFTOwner(nftAddr, tokenId);
    assert.equal(newOwner.toLowerCase(), GUILD.toLowerCase());
  });
});
