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
  sha3,
  advanceTime,
  deployDefaultNFTDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  accounts,
  sharePrice,
  GUILD,
  ETH_TOKEN,
  SHARES,
  expectRevert,
} = require("../../utils/DaoFactory.js");

const { onboardingNewMember } = require("../../utils/TestUtils.js");

describe("Adapter - TributeNFT", () => {
  const proposalCounter = proposalIdGenerator().generator;
  const daoOwner = accounts[1];

  const getProposalCounter = () => {
    return proposalCounter().next().value;
  };

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

  it("should be possible to submit a nft tribute proposal", async () => {
    const nftOwner = accounts[1];
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.approve(tributeNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.provideTributeNFT(
      dao.address,
      "0x1",
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );
  });

  it("should not be possible to submit a non nft tribute", async () => {
    const dao = this.dao;
    const tributeNFT = this.adapters.tributeNFT;

    await expectRevert.unspecified(
      tributeNFT.provideTribute(
        dao.address,
        "0x1",
        accounts[0],
        ETH_TOKEN,
        10,
        ETH_TOKEN,
        1
      )
    );
  });

  it("should not possible to submit a nft tribute if applicant uses a reserved address", async () => {
    const dao = this.dao;
    const tributeNFT = this.adapters.tributeNFT;
    const pixelNFT = this.testContracts.pixelNFT;

    const nftOwner = accounts[1];
    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await expectRevert(
      tributeNFT.provideTributeNFT(
        dao.address,
        "0x1",
        pixelNFT.address,
        tokenId,
        10,
        { from: GUILD } // using GUILD address (reserved)
      ),
      "applicant is reserved address"
    );
  });

  it("should be possible to sponsor a nft tribute proposal", async () => {
    const nftOwner = accounts[1];
    const proposalId = getProposalCounter();

    const dao = this.dao;
    const tributeNFT = this.adapters.tributeNFT;
    const pixelNFT = this.testContracts.pixelNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.approve(tributeNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.provideTributeNFT(
      dao.address,
      proposalId,
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // The NFT should be transfered to the adapter contract
    const ownerAddress = await pixelNFT.ownerOf(tokenId);
    expect(ownerAddress).toEqual(tributeNFT.address);
  });

  it("should not be possible to sponsor a nft tribute proposal if it is called by a non member", async () => {
    const nftOwner = accounts[1];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.approve(tributeNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.provideTributeNFT(
      dao.address,
      proposalId,
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );

    await expectRevert.unspecified(
      tributeNFT.sponsorProposal(dao.address, proposalId, [], {
        from: accounts[5], // non member attempts to sponsor a proposal
        gasPrice: toBN("0"),
      })
    );
  });

  it("should be possible to cancel a nft tribute proposal", async () => {
    const nftOwner = accounts[1];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.approve(tributeNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.provideTributeNFT(
      dao.address,
      proposalId,
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );

    await tributeNFT.cancelProposal(dao.address, proposalId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    // The NFT should be transfered back to the original owner
    const ownerAddress = await pixelNFT.ownerOf(tokenId);
    expect(ownerAddress).toEqual(nftOwner);
  });

  it("should not be possible to cancel a nft tribute proposal if you are not a member", async () => {
    const nftOwner = accounts[1];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.approve(tributeNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.provideTributeNFT(
      dao.address,
      proposalId,
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );

    await expectRevert(
      tributeNFT.cancelProposal(dao.address, proposalId, {
        from: accounts[5], // a non member attempts to cancel the proposal
        gasPrice: toBN("0"),
      }),
      "only the applicant can cancel a proposal"
    );
  });

  it("should be possible to cancel a nft tribute proposal if you are a member", async () => {
    const nftOwner = accounts[1];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.approve(tributeNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.provideTributeNFT(
      dao.address,
      proposalId,
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );

    let newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    // While the proposal is not process / canceled the escrow contract is the owner
    expect(newOwnerAddr).toEqual(tributeNFT.address);

    await tributeNFT.cancelProposal(dao.address, proposalId, {
      from: daoOwner, // a member of the dao cancels a proposal
      gasPrice: toBN("0"),
    });

    newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    // After the proposal is canceled it must be returned back to the original owner
    expect(newOwnerAddr).toEqual(nftOwner);
  });

  it("should not be possible to cancel a nft tribute proposal if it does not exist", async () => {
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const tributeNFT = this.adapters.tributeNFT;

    await expectRevert(
      tributeNFT.cancelProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal does not exist"
    );
  });

  it("should not be possible to cancel a nft tribute proposal if it was already sponsored", async () => {
    const nftOwner = accounts[1];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.approve(tributeNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.provideTributeNFT(
      dao.address,
      proposalId,
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await expectRevert(
      tributeNFT.cancelProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal already sponsored"
    );
  });

  it("should be possible to process a nft tribute proposal", async () => {
    const nftOwner = accounts[1];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;
    const voting = this.adapters.voting;

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.approve(tributeNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.provideTributeNFT(
      dao.address,
      proposalId,
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const vote = 1; //YES
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await tributeNFT.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    // Make the asset was transfered from the Adapter Escrow contract to the NFT Extension contract
    expect(newOwnerAddr).toEqual(nftExtAddr);
  });

  it("should not be possible to process a nft tribute proposal if it does not exist", async () => {
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const tributeNFT = this.adapters.tributeNFT;

    await expectRevert(
      tributeNFT.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal does not exist"
    );
  });

  it("should return the nft tribute to the owner if the proposal did not pass", async () => {
    const nftOwner = accounts[1];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;
    const voting = this.adapters.voting;

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.approve(tributeNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.provideTributeNFT(
      dao.address,
      proposalId,
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );

    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    expect(newOwnerAddr).toEqual(tributeNFT.address);

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const vote = 2; //NO
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await tributeNFT.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const newOwnerAddr2 = await pixelNFT.ownerOf(tokenId);
    // Make the asset was transfered from the Adapter Escrow contract to the original owner
    expect(newOwnerAddr2).toEqual(nftOwner);
  });

  it("should return the nft tribute if the proposal result is a tie", async () => {
    const nftOwner = accounts[1];
    const newMemberA = accounts[2];
    const proposalId = getProposalCounter();
    const dao = this.dao;
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
      sharePrice.mul(toBN(10)),
      SHARES,
      toBN("1")
    );

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.approve(tributeNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.provideTributeNFT(
      dao.address,
      proposalId,
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );

    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    expect(newOwnerAddr).toEqual(tributeNFT.address);

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

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

    await tributeNFT.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const newOwnerAddr2 = await pixelNFT.ownerOf(tokenId);
    // Make sure the asset was transfered from the Adapter Escrow to the original owner beacuse it was a tie
    expect(newOwnerAddr2).toEqual(nftOwner);
  });

  it("should not be possible process a proposal that was not voted", async () => {
    const nftOwner = accounts[1];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const tributeNFT = this.adapters.tributeNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.approve(tributeNFT.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.provideTributeNFT(
      dao.address,
      proposalId,
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );

    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    expect(newOwnerAddr).toEqual(tributeNFT.address);

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await expectRevert(
      tributeNFT.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal has not been voted on"
    );
  });
});
