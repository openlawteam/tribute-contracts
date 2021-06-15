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
  unitPrice,
  UNITS,
  GUILD,
  ETH_TOKEN,
} = require("../../utils/ContractUtil.js");

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
const { sha3 } = require("../../utils/DeploymentUtil.js");
const { onboardingNewMember, isMember } = require("../../utils/TestUtils.js");

describe("Adapter - TributeNFT", () => {
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

  it("should be possible to submit and sponsor a nft tribute proposal", async () => {
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
      10,
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

    await expectRevert(
      tributeNFT.submitProposal(
        dao.address,
        "0x1",
        GUILD, // using GUILD address (reserved)
        pixelNFT.address,
        tokenId,
        10,
        [],
        { from: daoOwner }
      ),
      "applicant is reserved address"
    );
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

    let revertedCall = tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10,
      [],
      { from: nftOwner, gasPrice: toBN("0") }
    );

    await expectRevert.unspecified(revertedCall);
  });

  it("should be possible to process a nft tribute proposal", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const bank = this.extensions.bank;
    const nftExt = this.extensions.nft;
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
      10,
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    const vote = 1; //YES
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    // Pre-approve spender (NFT extension) to transfer proposed NFT
    await pixelNFT.approve(nftExt.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.processProposal(dao.address, proposalId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("10");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(true);

    // Check if asset was transfered to the NFT Extension contract
    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    expect(newOwnerAddr).equal(nftExt.address);
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

  it("should not transfer the nft tribute from the owner if the proposal did not pass", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const bank = this.extensions.bank;
    const nftExt = this.extensions.nft;
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
      10,
      [],
      { from: daoOwner, gasPrice: toBN("0") }
    );

    const vote = 2; //NO
    await voting.submitVote(dao.address, proposalId, vote, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    // Pre-approve spender (NFT extension) to transfer proposed NFT
    await pixelNFT.approve(nftExt.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.processProposal(dao.address, proposalId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

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
    const bank = this.extensions.bank;
    const nftExt = this.extensions.nft;
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
      10,
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

    // Pre-approve spender (NFT extension) to transfer proposed NFT
    await pixelNFT.approve(nftExt.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await tributeNFT.processProposal(dao.address, proposalId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

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
    const bank = this.extensions.bank;
    const nftExt = this.extensions.nft;
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

    // Pre-approve spender (NFT extension) to transfer proposed NFT
    await pixelNFT.approve(nftExt.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await expectRevert(
      tributeNFT.processProposal(dao.address, proposalId, {
        from: nftOwner,
        gasPrice: toBN("0"),
      }),
      "proposal has not been voted on"
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

  it("should not be possible to issue internal tokens and complete NFT transfer if the requested amount exceeds the bank internal token limit", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = this.dao;
    const bank = this.extensions.bank;
    const nftExt = this.extensions.nft;
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
      requestAmount,
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

    // Pre-approve spender (NFT extension) to transfer proposed NFT
    await pixelNFT.approve(nftExt.address, tokenId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    await expectRevert(
      tributeNFT.processProposal(dao.address, proposalId, {
        from: nftOwner,
        gasPrice: toBN("0"),
      }),
      "token amount exceeds the maximum limit for internal tokens."
    );
  });
});
