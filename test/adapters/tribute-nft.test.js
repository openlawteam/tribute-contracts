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
  fromAscii,
  unitPrice,
  UNITS,
  GUILD,
} = require("../../utils/contract-util");

const {
  deployDefaultNFTDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  getAccounts,
  encodeProposalData,
  web3,
} = require("../../utils/hardhat-test-util");

const { onboardingNewMember, isMember } = require("../../utils/test-util");
const proposalCounter = proposalIdGenerator().generator;
const getProposalCounter = () => {
  return proposalCounter().next().value;
};

describe("Adapter - TributeNFT", () => {
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

  it("should be possible to submit and sponsor a erc721 nft tribute proposal", async () => {
    const nftOwner = accounts[2];
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await tributeNFT.submitProposal(
      dao.address,
      "0x1",
      nftOwner,
      pixelNFT.address,
      tokenId,
      10, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );
  });

  it("should not possible to submit a nft tribute if applicant uses a reserved address", async () => {
    const dao = this.dao;
    const tributeNFT = this.adapters.tributeNFT;
    const pixelNFT = this.testContracts.pixelNFT;

    const nftOwner = accounts[2];
    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await expect(
      tributeNFT.submitProposal(
        dao.address,
        "0x1",
        GUILD, // using GUILD address (reserved)
        pixelNFT.address,
        tokenId,
        10, // requested units
        [],
        { from: daoOwner }
      )
    ).to.be.revertedWith("applicant is reserved address");
  });

  it("should not be possible to submit and sponsor a nft tribute proposal if it is called by a non member", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await expect(
      tributeNFT.submitProposal(
        dao.address,
        proposalId,
        nftOwner,
        pixelNFT.address,
        tokenId,
        10, // requested units
        [],
        { from: nftOwner, gasPrice: toBN("0") }
      )
    ).to.be.revertedWith("revert");
  });

  it("should be possible to process a ERC721 tribute proposal send via safeTransferFrom", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const bank = this.extensions.bankExt;
    const nftExt = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;
    const voting = this.adapters.voting;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    const vote = 1; //YES
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner,
      tributeNFT.address,
      tokenId,
      encodeProposalData(dao, proposalId),
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("10");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(true);

    // Check if asset was transferred to the NFT Extension contract
    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    expect(newOwnerAddr).equal(nftExt.address);
  });

  it("should be possible to process a ERC721 tribute proposal send via transferFrom", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const bank = this.extensions.bankExt;
    const nftExt = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;
    const voting = this.adapters.voting;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    const vote = 1; //YES
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await pixelNFT.methods["transferFrom(address,address,uint256)"](
      nftOwner,
      tributeNFT.address,
      tokenId,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    // Since the NFT was transferred using `transferFrom` it won't trigger the onERC721Received callaback,
    // So we need to call the `processERC721Proposal`.
    await tributeNFT.processERC721Proposal(this.dao.address, proposalId);

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("10");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(true);

    // Check if asset was transferred to the NFT Extension contract
    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    expect(newOwnerAddr).equal(nftExt.address);
  });

  it("should return the NFT to the applicant if the ERC721 proposal sent via transferFrom did not pass", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const bank = this.extensions.bankExt;
    const nftExt = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;
    const voting = this.adapters.voting;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    const vote = 2; //NO
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await pixelNFT.methods["transferFrom(address,address,uint256)"](
      nftOwner,
      tributeNFT.address,
      tokenId,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    // Since the NFT was transferred using `transferFrom` it won't trigger the onERC721Received callaback,
    // So we need to call the `processERC721Proposal`.
    await tributeNFT.processERC721Proposal(this.dao.address, proposalId);

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("0");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(false);

    // Check if asset was transferred to the NFT Extension contract
    expect(await pixelNFT.ownerOf(tokenId)).equal(nftOwner);
  });

  it("should be possible to onboard a member using an existing NFT contract but with different tokenId", async () => {
    const nftOwner = accounts[2];
    const nftOwner2 = accounts[3];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const bank = this.extensions.bankExt;
    const nftExt = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;
    const voting = this.adapters.voting;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    const vote = 1; //YES
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner,
      tributeNFT.address,
      tokenId,
      encodeProposalData(dao, proposalId),
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("10");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(true);

    // Check if asset was transferred to the NFT Extension contract
    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    expect(newOwnerAddr).equal(nftExt.address);

    await pixelNFT.mintPixel(nftOwner2, 2, 2, { from: daoOwner });
    pastEvents = await pixelNFT.getPastEvents();
    const newTokenId = pastEvents[1].returnValues.tokenId;

    const newProposalId = getProposalCounter();
    await tributeNFT.submitProposal(
      dao.address,
      newProposalId,
      nftOwner2,
      pixelNFT.address,
      newTokenId,
      5, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    await voting.submitVote(dao.address, newProposalId, 1 /*YES*/, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner2,
      tributeNFT.address,
      newTokenId,
      encodeProposalData(dao, newProposalId),
      {
        from: nftOwner2,
        gasPrice: toBN("0"),
      }
    );

    // test balance after proposal is processed
    expect((await bank.balanceOf(nftOwner2, UNITS)).toString()).equal("5");

    // test active member status
    expect(await isMember(bank, nftOwner2)).equal(true);

    // Check if asset was transferred to the NFT Extension contract
    expect(await pixelNFT.ownerOf(newTokenId)).equal(nftExt.address);
  });

  it("should not be possible to process a nft tribute proposal if it does not exist", async () => {
    const proposalId = getProposalCounter();
    const nftOwner = accounts[2];
    const dao = this.dao;
    const tributeNFT = this.adapters.tributeNFT;
    const pixelNFT = this.testContracts.pixelNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await expect(
      pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
        nftOwner,
        tributeNFT.address,
        tokenId,
        encodeProposalData(dao, proposalId),
        {
          from: nftOwner,
          gasPrice: toBN("0"),
        }
      )
    ).to.be.revertedWith("proposal does not exist");
  });

  it("should not transfer the nft tribute from the owner if the proposal did not pass", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const bank = this.extensions.bankExt;
    const nftExt = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;
    const voting = this.adapters.voting;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    const vote = 2; //NO
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner,
      tributeNFT.address,
      tokenId,
      encodeProposalData(dao, proposalId),
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("0");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(false);

    // Check if the asset is still owned by the original owner
    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    expect(newOwnerAddr).equal(nftOwner);
  });

  it("should not transfer the nft tribute from the owner if the proposal result is a tie", async () => {
    const nftOwner = accounts[2];
    const newMemberA = accounts[3];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const bank = this.extensions.bankExt;
    const nftExt = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;
    const voting = this.adapters.voting;

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      this.adapters.onboarding,
      this.adapters.voting,
      newMemberA,
      daoOwner,
      unitPrice.mul(toBN(10)),
      UNITS,
      toBN("1")
    );

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    // DAO member A votes NO
    await voting.submitVote(dao.address, proposalId, 2, {
      from: newMemberA,
      gasPrice: toBN("0"),
    });
    await advanceTime(1);

    // DAO owner votes YES
    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner,
      tributeNFT.address,
      tokenId,
      encodeProposalData(dao, proposalId),
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("0");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(false);

    // Check if the asset is still owned by the original owner
    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    expect(newOwnerAddr).equal(nftOwner);
  });

  it("should not be possible to process a proposal that was not voted", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const bank = this.extensions.bankExt;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10,
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    await expect(
      pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
        nftOwner,
        tributeNFT.address,
        tokenId,
        encodeProposalData(dao, proposalId),
        {
          from: nftOwner,
          gasPrice: toBN("0"),
        }
      )
    ).to.be.revertedWith("proposal has not been voted on");

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("0");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(false);

    // Check if the asset is still owned by the original owner
    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    expect(newOwnerAddr).equal(nftOwner);
  });

  it("should not be possible to issue internal tokens and complete NFT transfer if the requested amount exceeds the bank internal token limit", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;
    const voting = this.adapters.voting;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    // Use an amount that will cause an overflow 2**89 > 2**88-1 for internal
    // tokens
    const requestAmount = toBN("2").pow(toBN("89")).toString();

    await tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      requestAmount, // requested units
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    const vote = 1; //YES
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await expect(
      pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
        nftOwner,
        tributeNFT.address,
        tokenId,
        encodeProposalData(dao, proposalId),
        {
          from: nftOwner,
          gasPrice: toBN("0"),
        }
      )
    ).to.be.revertedWith(
      "token amount exceeds the maximum limit for internal tokens"
    );
  });

  it("should be possible to onboard a member with erc1155 tribute", async () => {
    const nftOwner = accounts[2];
    const dao = this.dao;
    const erc1155Token = this.testContracts.erc1155TestToken;
    const tributeNFT = this.adapters.tributeNFT;
    const erc1155Ext = this.extensions.erc1155Ext;
    const bank = this.extensions.bankExt;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();

    await erc1155Token.mint(nftOwner, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const pastEvents = await erc1155Token.getPastEvents();

    const { id } = pastEvents[0].returnValues;

    await tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      id,
      10, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    const vote = 1; //YES
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await erc1155Token.safeTransferFrom(
      nftOwner,
      tributeNFT.address,
      id,
      3,
      encodeProposalData(dao, proposalId),
      { from: nftOwner }
    );

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("10");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(true);

    // Check if asset was transferred to the NFT Extension account
    const extBalance = await erc1155Token.balanceOf(erc1155Ext.address, id);
    expect(extBalance.toString()).equal("3");

    // Check if asset was transferred to from the owner account
    const ownerBalance = await erc1155Token.balanceOf(nftOwner, id);
    expect(ownerBalance.toString()).equal("7");
  });

  it("should not be possible to onboard a member with erc1155 batch tribute", async () => {
    const nftOwner = accounts[2];
    const dao = this.dao;
    const erc1155Token = this.testContracts.erc1155TestToken;
    const tributeNFT = this.adapters.tributeNFT;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();

    await erc1155Token.mint(nftOwner, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await erc1155Token.mint(nftOwner, 2, 10, "0x1", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      1,
      10, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    const vote = 1; //YES
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await expect(
      erc1155Token.safeBatchTransferFrom(
        nftOwner,
        tributeNFT.address,
        [1, 2],
        [1, 1],
        encodeProposalData(dao, proposalId),
        { from: nftOwner }
      )
    ).to.be.revertedWith("not supported");
  });

  it("should send back the erc1155 tokens if the proposal has failed", async () => {
    const nftOwner = accounts[2];
    const dao = this.dao;
    const erc1155Token = this.testContracts.erc1155TestToken;
    const tributeNFT = this.adapters.tributeNFT;
    const erc1155Ext = this.extensions.erc1155Ext;
    const bank = this.extensions.bankExt;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();

    await erc1155Token.mint(nftOwner, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const pastEvents = await erc1155Token.getPastEvents();

    const { id } = pastEvents[0].returnValues;

    await tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      erc1155Token.address,
      id,
      10, // requested units
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    const vote = 2; //NO
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await erc1155Token.safeTransferFrom(
      nftOwner,
      tributeNFT.address,
      id,
      3,
      encodeProposalData(dao, proposalId),
      { from: nftOwner }
    );

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("0");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(false);

    // Check if asset was transferred to the NFT Extension account
    const extBalance = await erc1155Token.balanceOf(erc1155Ext.address, id);
    expect(extBalance.toString()).equal("0");

    // Check if asset was transferred to from the owner account
    const ownerBalance = await erc1155Token.balanceOf(nftOwner, id);
    expect(ownerBalance.toString()).equal("10");
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.tributeNFT;
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
    const adapter = this.adapters.tributeNFT;
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

  it("should support onERC721Received and onERC1155Received interfaces", async () => {
    const adapter = this.adapters.tributeNFT;
    // supportsInterface
    expect(await adapter.supportsInterface("0x01ffc9a7")).to.be.true;
    // onERC1155Received
    expect(await adapter.supportsInterface("0xf23a6e61")).to.be.true;
    // onERC721Received
    expect(await adapter.supportsInterface("0x150b7a02")).to.be.true;
  });
});
