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
  toBN,
  toWei,
  ERC1155,
  UNITS,
  fromAscii,
  GUILD,
  TOTAL,
  ESCROW,
} = require("../../utils/contract-util");
const { toNumber } = require("web3-utils");
const {
  deployDefaultNFTDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  getAccounts,
  encodeProposalData,
  web3,
  ERC1155TestToken,
  PixelNFT,
} = require("../../utils/hardhat-test-util");
const { lendERC721NFT, lendERC1155NFT } = require("../../utils/test-util");

const proposalCounter = proposalIdGenerator().generator;
const getProposalCounter = () => {
  return proposalCounter().next().value;
};

describe("Adapter - LendNFT", () => {
  let accounts, daoOwner;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];

    const { dao, adapters, extensions, testContracts } =
      await deployDefaultNFTDao({ owner: daoOwner });
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

  it("should be possible to lend an ERC1155 NFT", async () => {
    const erc1155Token = this.testContracts.erc1155TestToken;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const bank = this.extensions.bankExt;
    const proposalId = getProposalCounter();

    const tokenId = 10;
    // Mint the ERC1155 NFT
    await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });

    // Create a proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      tokenId,
      25000, // requested units
      10000, // lending period
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Submit a vote (YES)
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });

    await advanceTime(10000);

    // Send the ERC1155 NFT to the LendNFT adapter
    await erc1155Token.safeTransferFrom(
      nftOwner,
      lendNFT.address,
      tokenId,
      1,
      encodeProposalData(dao, proposalId),
      { from: nftOwner }
    );

    const erc1155ExtAddr = await dao.getExtensionAddress(ERC1155);
    const balanceOf = await erc1155Token.balanceOf(erc1155ExtAddr, tokenId);
    expect(balanceOf.toString()).equal("1");

    let unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(toNumber(unitBalance.toString())).to.be.closeTo(25000, 5);

    await advanceTime(100);

    // After 100 seconds, get the NFT back (terminating the lending process)
    await lendNFT.sendNFTBack(dao.address, proposalId, { from: nftOwner });

    // Check if the owner holds the NFT again
    const balance = await erc1155Token.balanceOf(nftOwner, tokenId);
    expect(balance.toString()).equal("1");

    await advanceTime(1000);

    // Checks if the units were removed from the nftOwner account in the bank
    unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(toNumber(unitBalance.toString())).to.be.closeTo(250, 5);
  });

  it("should be possible to lend an ERC721 NFT", async () => {
    const pixelNFT = this.testContracts.pixelNFT;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const nftExtension = this.extensions.erc721Ext;
    const bank = this.extensions.bankExt;
    const proposalId = getProposalCounter();

    // Mint the ERC721 NFT
    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });

    let pastEvents = await pixelNFT.getPastEvents();
    const { tokenId } = pastEvents[1].returnValues;

    // Create the Lend Proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10000, // requested units
      10000, // lending period (10 seconds)
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Vote Yes on the proposal
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });
    await advanceTime(10000);

    // Approve the NFT to move to the NFT extension
    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner,
      lendNFT.address,
      tokenId,
      encodeProposalData(dao, proposalId),
      {
        from: nftOwner,
      }
    );

    let unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(unitBalance.toString()).equal("10000");
    expect(await pixelNFT.ownerOf(tokenId)).equal(nftExtension.address);

    await advanceTime(100);

    // After 100 seconds, the owner terminates the lending process and gets the NFT back
    await lendNFT.sendNFTBack(dao.address, proposalId, { from: nftOwner });
    expect(await pixelNFT.ownerOf(tokenId)).equal(nftOwner);

    await advanceTime(10000);
    // Check if the units were removed from the nft owner account in the bank
    unitBalance = await bank.balanceOf(nftOwner, UNITS);
    expect(toNumber(unitBalance.toString())).to.be.closeTo(100, 5);
  });

  it("should not be possible to lend when the applicant is a reserved address", async () => {
    const erc1155Token = this.testContracts.erc1155TestToken;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const proposalId = getProposalCounter();

    const tokenId = 10;
    // Mint the ERC1155 NFT
    await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });

    // Create a proposal using the GUILD address as applicant
    await expect(
      lendNFT.submitProposal(
        dao.address,
        proposalId,
        GUILD,
        erc1155Token.address,
        tokenId,
        25000, // requested units
        10000, // lending period
        [],
        { from: daoOwner, gasPrice: toBN("0") }
      )
    ).to.be.revertedWith("applicant is reserved address");

    // Create a proposal using the TOTAL address as applicant
    await expect(
      lendNFT.submitProposal(
        dao.address,
        proposalId,
        TOTAL,
        erc1155Token.address,
        tokenId,
        25000, // requested units
        10000, // lending period
        [],
        { from: daoOwner, gasPrice: toBN("0") }
      )
    ).to.be.revertedWith("applicant is reserved address");

    // Create a proposal using the ESCROW address as applicant
    await expect(
      lendNFT.submitProposal(
        dao.address,
        proposalId,
        ESCROW,
        erc1155Token.address,
        tokenId,
        25000, // requested units
        10000, // lending period
        [],
        { from: daoOwner, gasPrice: toBN("0") }
      )
    ).to.be.revertedWith("applicant is reserved address");
  });

  it("should not be possible to reuse a lend proposal id", async () => {
    const erc1155Token = this.testContracts.erc1155TestToken;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const proposalId = getProposalCounter();

    const tokenId = 10;
    // Mint the ERC1155 NFT
    await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });

    // Create a proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      tokenId,
      25000, // requested units
      10000, // lending period
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Create another proposal using the same proposal id
    await expect(
      lendNFT.submitProposal(
        dao.address,
        proposalId,
        nftOwner,
        erc1155Token.address,
        tokenId,
        25000, // requested units
        10000, // lending period
        [],
        { from: daoOwner, gasPrice: toBN("0") }
      )
    ).to.be.revertedWith("proposalId must be unique");
  });

  it("should not be possible to batch lend ERC1155 NFTs", async () => {
    const erc1155Token = this.testContracts.erc1155TestToken;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const bank = this.extensions.bankExt;
    const proposalId = getProposalCounter();

    const tokenId = 1;
    // Mint 3 ERC1155 NFT
    await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });
    await erc1155Token.mint(nftOwner, 2, 1, [], { from: daoOwner });
    await erc1155Token.mint(nftOwner, 3, 1, [], { from: daoOwner });

    // Create a proposal only for the first token
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      tokenId,
      25000, // requested units
      10000, // lending period
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Submit a vote (YES)
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });

    await advanceTime(10000);

    // Attempt to send a batch transfer of the ERC1155 NFTs to the LendNFT adapter
    await expect(
      erc1155Token.safeBatchTransferFrom(
        nftOwner,
        lendNFT.address,
        [tokenId, 2, 3],
        [1, 1, 1],
        encodeProposalData(dao, proposalId),
        { from: nftOwner }
      )
    ).to.be.revertedWith("not supported");
  });

  it("should not be possible to process an ERC721 NFT lending proposal that does not exist", async () => {
    const pixelNFT = this.testContracts.pixelNFT;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const nftExtension = this.extensions.erc721Ext;
    const bank = this.extensions.bankExt;
    const proposalId = getProposalCounter();

    // Mint the ERC721 NFT
    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });

    let pastEvents = await pixelNFT.getPastEvents();
    const { tokenId } = pastEvents[1].returnValues;

    // Create the Lend Proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10000, // requested units
      10000, // lending period (10 seconds)
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Vote Yes on the proposal
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });
    await advanceTime(10000);

    // Approve the NFT to move to the NFT extension
    const wrongProposalId = getProposalCounter();
    await expect(
      pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
        nftOwner,
        lendNFT.address,
        tokenId,
        encodeProposalData(dao, wrongProposalId),
        {
          from: nftOwner,
        }
      )
    ).to.be.revertedWith("proposal does not exist");
  });

  it("should not be possible to process an ERC721 NFT lending proposal that was already processed", async () => {
    const pixelNFT = this.testContracts.pixelNFT;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();

    // Mint the ERC721 NFT
    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    const { tokenId } = pastEvents[1].returnValues;
    await pixelNFT.mintPixel(nftOwner, 2, 2, { from: daoOwner });
    await pixelNFT.mintPixel(nftOwner, 3, 3, { from: daoOwner });

    // Create the Lend Proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10000, // requested units
      10000, // lending period (10 seconds)
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Vote Yes on the proposal
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });
    await advanceTime(10000);

    // Process the proposal
    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner,
      lendNFT.address,
      tokenId,
      encodeProposalData(dao, proposalId),
      {
        from: nftOwner,
      }
    );

    // Approve the NFT to move to the NFT extension
    await expect(
      pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
        nftOwner,
        lendNFT.address,
        2,
        encodeProposalData(dao, proposalId),
        {
          from: nftOwner,
        }
      )
    ).to.be.revertedWith("proposal already processed");
  });

  it("should not be possible to process an ERC721 NFT lending proposal that has no votes", async () => {
    const pixelNFT = this.testContracts.pixelNFT;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const proposalId = getProposalCounter();

    // Mint the ERC721 NFT
    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();

    // Create the Lend Proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      1,
      10000, // requested units
      10000, // lending period (10 seconds)
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Process the proposal
    await expect(
      pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
        nftOwner,
        lendNFT.address,
        1,
        encodeProposalData(dao, proposalId),
        {
          from: nftOwner,
        }
      )
    ).to.be.revertedWith("proposal has no votes");
  });

  it("should not be possible to process an ERC1155 NFT lend proposal that does not exist", async () => {
    const erc1155Token = this.testContracts.erc1155TestToken;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();

    const tokenId = 10;
    // Mint the ERC1155 NFT
    await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });

    // Create a proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      tokenId,
      25000, // requested units
      10000, // lending period
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Submit a vote (YES)
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });

    await advanceTime(10000);

    // Send the ERC1155 NFT to the LendNFT adapter
    const wrongProposalId = getProposalCounter();
    await expect(
      erc1155Token.safeTransferFrom(
        nftOwner,
        lendNFT.address,
        tokenId,
        1,
        encodeProposalData(dao, wrongProposalId),
        { from: nftOwner }
      )
    ).to.be.revertedWith("proposal does not exist");
  });

  it("should not be possible to process an ERC1155 NFT lend proposal that was already processed", async () => {
    const erc1155Token = this.testContracts.erc1155TestToken;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();

    const tokenId = 10;
    // Mint the ERC1155 NFT
    await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });
    await erc1155Token.mint(nftOwner, 2, 1, [], { from: daoOwner });

    // Create a proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      tokenId,
      25000, // requested units
      10000, // lending period
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Submit a vote (YES)
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });

    await advanceTime(10000);

    // Process the proposal
    await erc1155Token.safeTransferFrom(
      nftOwner,
      lendNFT.address,
      tokenId,
      1,
      encodeProposalData(dao, proposalId),
      { from: nftOwner }
    );

    // Send the ERC1155 NFT to the LendNFT adapter
    await expect(
      erc1155Token.safeTransferFrom(
        nftOwner,
        lendNFT.address,
        2,
        1,
        encodeProposalData(dao, proposalId),
        { from: nftOwner }
      )
    ).to.be.revertedWith("proposal already processed");
  });

  it("should not be possible to process an ERC1155 NFT lend proposal that has no votes", async () => {
    const erc1155Token = this.testContracts.erc1155TestToken;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();

    const tokenId = 10;
    // Mint the ERC1155 NFT
    await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });

    // Create a proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      tokenId,
      25000, // requested units
      10000, // lending period
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Process the proposal
    await expect(
      erc1155Token.safeTransferFrom(
        nftOwner,
        lendNFT.address,
        tokenId,
        1,
        encodeProposalData(dao, proposalId),
        { from: nftOwner }
      )
    ).to.be.revertedWith("proposal has no votes");
  });

  it("should not be possible to lend the wrong ERC1155 NFT tokenId", async () => {
    const erc1155Token = this.testContracts.erc1155TestToken;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();

    const tokenId = 10; // Correct Token
    const wrongTokenId = 5;
    // Mint the ERC1155 NFT
    await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });
    await erc1155Token.mint(nftOwner, wrongTokenId, 1, [], { from: daoOwner });

    // Create a proposal using the correct Token Id
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      tokenId,
      25000, // requested units
      10000, // lending period
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Submit a vote (YES) on the proposal that contains the correct tokenId
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });

    await advanceTime(10000);

    // Transfer the wrong ERC1155 NFT tokenId to the LendNFT adapter
    await expect(
      erc1155Token.safeTransferFrom(
        nftOwner,
        lendNFT.address,
        wrongTokenId,
        1,
        encodeProposalData(dao, proposalId),
        { from: nftOwner }
      )
    ).to.be.revertedWith("wrong NFT");
  });

  it("should not be possible to lend the wrong ERC721 NFT tokenId", async () => {
    const pixelNFT = this.testContracts.pixelNFT;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();

    // Mint
    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    const { tokenId } = pastEvents[1].returnValues;

    // Mint a second token to attempt to move that to the adapter
    await pixelNFT.mintPixel(nftOwner, 2, 2, { from: daoOwner });
    pastEvents = await pixelNFT.getPastEvents();
    const { tokenId: wrongTokenId } = pastEvents[1].returnValues;

    // Create the Lend Proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId, // Using the correct tokenId in the proposal
      10000, // requested units
      10000, // lending period (10 seconds)
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Vote Yes on the proposal
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });
    await advanceTime(10000);

    // Approve the NFT to move the WRONG NFT to the NFT extension
    await expect(
      pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
        nftOwner,
        lendNFT.address,
        wrongTokenId, // transfer the wrong token id
        encodeProposalData(dao, proposalId),
        {
          from: nftOwner,
        }
      )
    ).to.be.revertedWith("wrong NFT");
  });

  it("should not be possible to lend the wrong ERC1155 NFT address", async () => {
    const erc1155Token = this.testContracts.erc1155TestToken;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();
    const wrongErc1155Token = await ERC1155TestToken.new("WrongToken");

    const tokenId = 10; // Correct Token
    // Mint 2 tokens, 1 per ERC1155 contract
    await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });
    await wrongErc1155Token.mint(nftOwner, tokenId, 1, [], {
      from: daoOwner,
    });

    // Create a proposal using the correct Token Id
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      tokenId,
      25000, // requested units
      10000, // lending period
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Submit a vote (YES) on the proposal that contains the correct tokenId
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });

    await advanceTime(10000);

    // Transfer the wrong ERC1155 NFT tokenId to the LendNFT adapter
    await expect(
      wrongErc1155Token.safeTransferFrom(
        nftOwner,
        lendNFT.address,
        tokenId,
        1,
        encodeProposalData(dao, proposalId),
        { from: nftOwner }
      )
    ).to.be.revertedWith("wrong NFT addr");
  });

  it("should not be possible to lend the wrong ERC721 NFT address", async () => {
    const pixelNFT = this.testContracts.pixelNFT;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();
    const wrongNFT = await PixelNFT.new(10);

    // Mint
    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    const { tokenId } = pastEvents[1].returnValues;

    // Mint a second token using a new contract to attempt to move that to the adapter
    await wrongNFT.mintPixel(nftOwner, 2, 2, { from: daoOwner });

    // Create the Lend Proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId, // Using the correct tokenId in the proposal
      10000, // requested units
      10000, // lending period (10 seconds)
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Vote Yes on the proposal
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });
    await advanceTime(10000);

    // Approve the NFT to move the correct tokenId, but using the wrong NFT contract to the NFT extension
    await expect(
      wrongNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
        nftOwner,
        lendNFT.address,
        tokenId, // transfer the correct token id
        encodeProposalData(dao, proposalId),
        {
          from: nftOwner,
        }
      )
    ).to.be.revertedWith("wrong NFT addr");
  });

  it("should not be possible to lend the ERC1155 NFT address if the vote did not pass", async () => {
    const erc1155Token = this.testContracts.erc1155TestToken;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();

    const tokenId = 10;
    // Mint
    await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });

    // Create a proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      tokenId,
      25000, // requested units
      10000, // lending period
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Submit a vote (NO) on the proposal
    await voting.submitVote(dao.address, proposalId, 2, { from: daoOwner });

    await advanceTime(10000);

    // Check if the owner holds the NFT
    let balance = await erc1155Token.balanceOf(nftOwner, tokenId);
    expect(balance.toString()).equal("1");

    // Transfer the ERC1155 NFT tokenId to the LendNFT adapter
    await erc1155Token.safeTransferFrom(
      nftOwner,
      lendNFT.address,
      tokenId,
      1,
      encodeProposalData(dao, proposalId),
      { from: nftOwner }
    );

    // Checks if the owner still holds the NFT after the transfer attempt
    balance = await erc1155Token.balanceOf(nftOwner, tokenId);
    expect(balance.toString()).equal("1");
  });

  it("should not be possible to withdraw an ERC1155 NFT if the sender is not the NFT original owner who lent the NFT", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const tokenId = 10;
    await lendERC1155NFT(
      this.dao,
      proposalId,
      tokenId,
      this.testContracts.erc1155TestToken,
      this.adapters.voting,
      this.adapters.lendNFT,
      this.extensions.bankExt,
      daoOwner,
      nftOwner
    );

    await advanceTime(100);

    // The attack attempts to collect the NFT that was lent
    const attacker = accounts[6];
    await expect(
      this.adapters.lendNFT.sendNFTBack(this.dao.address, proposalId, {
        from: attacker,
      })
    ).to.be.revertedWith("only the previous owner can withdraw the NFT");
  });

  it("should not be possible to withdraw an ERC1155 NFT if it was already collected by the original owner", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const tokenId = 10;
    await lendERC1155NFT(
      this.dao,
      proposalId,
      tokenId,
      this.testContracts.erc1155TestToken,
      this.adapters.voting,
      this.adapters.lendNFT,
      this.extensions.bankExt,
      daoOwner,
      nftOwner
    );

    await advanceTime(100);

    await this.adapters.lendNFT.sendNFTBack(this.dao.address, proposalId, {
      from: nftOwner,
    });

    // The attack attempts to collect the NFT that was lent
    const attacker = accounts[6];
    await expect(
      this.adapters.lendNFT.sendNFTBack(this.dao.address, proposalId, {
        from: attacker,
      })
    ).to.be.revertedWith("already sent back");
  });

  it("should not be possible to withdraw an ERC721 NFT if the sender is not the NFT original owner who lent the NFT", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();

    await lendERC721NFT(
      this.dao,
      proposalId,
      this.testContracts.pixelNFT,
      this.adapters.voting,
      this.adapters.lendNFT,
      this.extensions.erc721Ext,
      this.extensions.bankExt,
      daoOwner,
      nftOwner
    );

    await advanceTime(100);
    // The attack attempts to collect the NFT that was lent
    const attacker = accounts[6];
    await expect(
      this.adapters.lendNFT.sendNFTBack(this.dao.address, proposalId, {
        from: attacker,
      })
    ).to.be.revertedWith("only the previous owner can withdraw the NFT");
  });

  it("should not be possible to withdraw an ERC721 NFT if it was already collected by the original owner", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();

    await lendERC721NFT(
      this.dao,
      proposalId,
      this.testContracts.pixelNFT,
      this.adapters.voting,
      this.adapters.lendNFT,
      this.extensions.erc721Ext,
      this.extensions.bankExt,
      daoOwner,
      nftOwner
    );

    await advanceTime(100);

    await this.adapters.lendNFT.sendNFTBack(this.dao.address, proposalId, {
      from: nftOwner,
    });

    // The attack attempts to collect the NFT that was lent
    const attacker = accounts[6];
    await expect(
      this.adapters.lendNFT.sendNFTBack(this.dao.address, proposalId, {
        from: attacker,
      })
    ).to.be.revertedWith("already sent back");
  });

  it("should not be possible to lend the ERC721 NFT address if the vote did not pass", async () => {
    const pixelNFT = this.testContracts.pixelNFT;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const nftExtension = this.extensions.erc721Ext;
    const bank = this.extensions.bankExt;
    const proposalId = getProposalCounter();

    // Mint the ERC721 NFT
    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });

    let pastEvents = await pixelNFT.getPastEvents();
    const { tokenId } = pastEvents[1].returnValues;

    // Create the Lend Proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10000, // requested units
      10000, // lending period (10 seconds)
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Vote NO on the proposal
    await voting.submitVote(dao.address, proposalId, 2, { from: daoOwner });
    await advanceTime(10000);

    // Approve the NFT to move to the NFT extension
    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner,
      lendNFT.address,
      tokenId,
      encodeProposalData(dao, proposalId),
      {
        from: nftOwner,
      }
    );

    // The owner should be the same because the proposal did not pass
    expect(await pixelNFT.ownerOf(tokenId)).equal(nftOwner);
  });

  it("should not be possible to withdraw any NFT if the lending period did not start", async () => {
    const pixelNFT = this.testContracts.pixelNFT;
    const nftOwner = accounts[2];
    const lendNFT = this.adapters.lendNFT;
    const dao = this.dao;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();

    // Mint the ERC721 NFT
    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });

    let pastEvents = await pixelNFT.getPastEvents();
    const { tokenId } = pastEvents[1].returnValues;

    // Create the Lend Proposal
    await lendNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10000, // requested units
      10000, // lending period (10 seconds)
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // Vote Yes on the proposal
    await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });
    await advanceTime(10000);

    // Skip the NFT transfer and attempt to withdraw the NFT
    await expect(
      lendNFT.sendNFTBack(dao.address, proposalId, { from: nftOwner })
    ).to.be.revertedWith("lending not started");
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.lendNFT;
    await expect(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
      })
    ).to.be.revertedWith("revert");
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const adapter = this.adapters.lendNFT;
    await expect(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
        data: fromAscii("should go to fallback func"),
      })
    ).to.be.revertedWith("revert");
  });
});
