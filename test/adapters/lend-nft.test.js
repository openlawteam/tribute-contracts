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
const { toBN, NFT, UNITS } = require("../../utils/ContractUtil.js");

const {
  deployDefaultNFTDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  accounts,
  expectRevert,
  expect,
} = require("../../utils/OZTestUtil.js");

describe("Adapter - LendNFT", () => {
  const proposalCounter = proposalIdGenerator().generator;
  const daoOwner = accounts[1];

  const getProposalCounter = () => {
    return proposalCounter().next().value;
  };

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
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(this.snapshotId);
    this.snapshotId = await takeChainSnapshot();
  });

  it("should be able to lend an NFT", async () => {
    const pixelNFT = this.testContracts.pixelNFT;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const nftExtension = this.extensions.nft;
    const bank = this.extensions.bank;
    const proposalId = getProposalCounter();
    const proposalId2 = getProposalCounter();

    //mint 2 NFTs
    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });

    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.mintPixel(nftOwner, 2, 2, { from: daoOwner });

    let pastEvents2 = await pixelNFT.getPastEvents();
    let result = pastEvents2[1].returnValues;
    let tokenId2 = result.tokenId;
    //create 2 proposals, one for each NFT
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10000,
      10000, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    await lendNFT.submitProposal(
      dao.address,
      proposalId2,
      nftOwner,
      pixelNFT.address,
      tokenId2,
      10000,
      10000, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    //approve each NFT to the NFT extension

    await pixelNFT.approve(nftExtension.address, tokenId, { from: nftOwner });
    await pixelNFT.approve(nftExtension.address, tokenId2, { from: nftOwner });

    //vote them in

    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });
    await voting.submitVote(dao.address, proposalId2, 1, { from: daoOwner });

    await advanceTime(10000);

    //process the first proposal
    await lendNFT.processProposal(dao.address, proposalId, { from: daoOwner });

    //we see that we have 10K units
    let unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(unitBalance.toString()).equal("10000");

    await advanceTime(100);
    // after 100 seconds, we take the NFT back
    await expectRevert(
      lendNFT.sendNFTBack(dao.address, proposalId),
      "only the previous owner can withdraw the NFT"
    );
    await lendNFT.sendNFTBack(dao.address, proposalId, { from: nftOwner });

    unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(unitBalance.toString()).equal("100");

    await advanceTime(10000);
    //process the second proposal
    await lendNFT.processProposal(dao.address, proposalId2, { from: daoOwner });

    unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(unitBalance.toString()).equal("10100");

    await advanceTime(100);

    //after 100 seconds, get the second NFT back
    await lendNFT.sendNFTBack(dao.address, proposalId2, { from: nftOwner });
    unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(unitBalance.toString()).equal("200");
  });
});
