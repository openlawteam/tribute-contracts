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
  sha3,
  toBN,
} = require("../../../utils/DaoFactory.js");

const { createNFTDao } = require("../../../utils/TestUtils.js");

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

  it("should be possible to create a dao and register a new NFT token to the collection", async () => {
    const { dao, pixelNFT } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    const isAllowed = await nftExtension.isNFTAllowed(pixelNFT.address);
    assert.equal(isAllowed, true);
  });

  it("should be possible check how many NFTs are in the collection", async () => {
    const { dao } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    const total = await nftExtension.nbNFTs();
    assert.equal(total, 0);
  });

  it("should be possible get an NFT in the collection using the index", async () => {
    const { dao } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    //TODO needs to contain at least 1 nft
    // const nftAddr = await nftExtension.getNFTByIndex(0);
    // assert.equal(nftAddr, "0x0");
  });

  it("should not be possible get an NFT in the collection if it is empty", async () => {
    const { dao } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);

    try {
      await nftExtension.getNFTByIndex(0);
      assert.fail(
        "should not be possible get an NFT in the collection if it is empty"
      );
    } catch (e) {
      //ignore the error:  Error: Returned error: VM Exception while processing transaction: revert
    }
  });

  it("should not be possible to register a new NFT without the REGISTER_NEW_NFT permission", async () => {
    const { dao } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    try {
      await nftExtension.registerPotentialNewNFT(ETH_TOKEN, {
        from: accounts[6],
      });
      assert.fail(
        "should not be possible to register a new NFT without the REGISTER_NEW_NFT permission"
      );
    } catch (e) {
      assert.equal(e.reason, "nft::accessDenied::notCreator");
    }
  });

  it("should not be possible to register a new NFT without the REGISTER_NEW_NFT permission", async () => {
    const { dao } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    try {
      await nftExtension.registerPotentialNewNFT(ETH_TOKEN, {
        from: accounts[6],
      });
      assert.fail(
        "should not be possible to register a new NFT without the REGISTER_NEW_NFT permission"
      );
    } catch (e) {
      assert.equal(e.reason, "nft::accessDenied::notCreator");
    }
  });

  it("should be possible to register a new NFT if you are the extension creator", async () => {
    const { dao } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    await nftExtension.registerPotentialNewNFT(ETH_TOKEN, {
      from: accounts[0],
    });

    assert.equal(await nftExtension.isNFTAllowed(ETH_TOKEN), true);
  });

  it("should not be possible to return a NFT without the RETURN permission", async () => {
    const { dao, pixelNFT } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    try {
      await nftExtension.returnNFT(accounts[1], pixelNFT.address, 1);
      assert.fail(
        "should not be possible to return a NFT without the RETURN permission"
      );
    } catch (e) {
      assert.equal(e.reason, "nft::accessDenied");
    }
  });

  it("should not be possible to transfer a NFT without the TRANSFER permission", async () => {
    const { dao, pixelNFT } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    try {
      await nftExtension.transferFrom(accounts[1], pixelNFT.address, 1);
      assert.fail(
        "should not be possible to transfer a NFT without the TRANSFER permission"
      );
    } catch (e) {
      assert.equal(e.reason, "nft::accessDenied");
    }
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

  it("should not be possible to collect a NFT that is not allowed", async () => {
    const { dao } = await createNFTDao(accounts[0]);

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const nftExtension = await NFTExtension.at(nftExtAddr);
    try {
      const fakeNFTAddr = accounts[2];
      await nftExtension.collect(accounts[1], fakeNFTAddr, 1);
      assert.fail(
        "should not be possible to collect a NFT that is not allowed"
      );
    } catch (e) {
      assert.equal(e.reason, "nft not allowed");
    }
  });

  it("should be possible to collect a NFT that is allowed", async () => {
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
    await pixelNFT.approve(nftExtAddr, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    const nftExtension = await NFTExtension.at(nftExtAddr);
    await nftExtension.collect(nftOwner, pixelNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    // Make sure it was collected
    const nftAddr = await nftExtension.getNFTByIndex(0);
    assert.equal(nftAddr, pixelNFT.address);
  });
});
