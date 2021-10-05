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
  toWei,
  ERC1155,
  UNITS,
  fromAscii,
} = require("../../utils/ContractUtil.js");

const {
  deployDefaultNFTDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  accounts,
  encodeProposalData,
  expectRevert,
  expect,
  web3,
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
    const erc1155Token = this.testContracts.erc1155TestToken;
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
    let tokenId2 = 10;
    await erc1155Token.mint(nftOwner, tokenId2, 1, [], { from: daoOwner });

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
      erc1155Token.address,
      tokenId2,
      10000,
      10000, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    //vote them in

    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });
    await voting.submitVote(dao.address, proposalId2, 1, { from: daoOwner });

    await advanceTime(10000);

    //approve each NFT to the NFT extension
    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner,
      lendNFT.address,
      tokenId,
      encodeProposalData(dao, proposalId),
      {
        from: nftOwner,
      }
    );

    //we see that we have 10K units
    let unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(unitBalance.toString()).equal("10000");

    let currentNftOwner = await pixelNFT.ownerOf(tokenId);
    expect(currentNftOwner).equal(nftExtension.address);

    await advanceTime(100);
    // after 100 seconds, we take the NFT back
    await expectRevert(
      lendNFT.sendNFTBack(dao.address, proposalId),
      "only the previous owner can withdraw the NFT"
    );
    await lendNFT.sendNFTBack(dao.address, proposalId, { from: nftOwner });

    unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(
      unitBalance.toString() == "100" || unitBalance.toString() == "101"
    ).equal(true);

    await advanceTime(10000);
    //process the second proposal
    await erc1155Token.safeTransferFrom(
      nftOwner,
      lendNFT.address,
      tokenId2,
      1,
      encodeProposalData(dao, proposalId2),
      { from: nftOwner }
    );

    const erc1155ExtAddr = await dao.getExtensionAddress(ERC1155);
    const balanceOf = await erc1155Token.balanceOf(erc1155ExtAddr, tokenId2);
    expect(balanceOf.toString()).equal("1");

    unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(
      unitBalance.toString() == "10100" || unitBalance.toString() == "10101"
    ).equal(true);

    await advanceTime(100);

    //after 100 seconds, get the second NFT back
    await lendNFT.sendNFTBack(dao.address, proposalId2, { from: nftOwner });
    unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(
      unitBalance.toString() === "200" || unitBalance.toString() === "201"
    ).equal(true);

    const balance = await erc1155Token.balanceOf(nftOwner, tokenId2);
    expect(balance.toString()).equal("1");
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.lendNFT;
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
    const adapter = this.adapters.lendNFT;
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
