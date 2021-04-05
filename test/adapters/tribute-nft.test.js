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
  advanceTime,
  getContract,
  sha3,
  GUILD,
  VotingContract,
  ETH_TOKEN,
  TributeNFTContract,
  accounts,
} = require("../../utils/DaoFactory.js");

const { createNFTDao, onboardNewMember } = require("../../utils/TestUtils.js");

describe("MolochV3 - TributeNFT Adapter", async () => {
  it("should be possible to submit a nft tribute proposal", async () => {
    const daoOwner = accounts[0];
    const nftOwner = accounts[1];
    const { dao, pixelNFT } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
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
      "0x1",
      pixelNFT.address,
      tokenId,
      10,
      { from: nftOwner, gasPrice: toBN("0") }
    );
  });

  it("should not be possible to submit a non nft tribute", async () => {
    const { dao } = await createNFTDao(accounts[0]);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
    );
    try {
      await tributeNFT.provideTribute(
        dao.address,
        "0x1",
        accounts[0],
        ETH_TOKEN,
        10,
        ETH_TOKEN,
        1
      );
      assert.fail("should be not be possible to submit a non nft tribute");
    } catch (e) {
      // ignore error: VM Exception while processing transaction: revert not supported operation
    }
  });

  it("should not possible to submit a nft tribute if applicant uses a reserved address", async () => {
    const { dao, pixelNFT } = await createNFTDao(accounts[0]);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
    );
    const nftOwner = accounts[1];
    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { owner, tokenId, uri, metadata } = pastEvents[1].returnValues;

    try {
      await tributeNFT.provideTributeNFT(
        dao.address,
        "0x1",
        pixelNFT.address,
        tokenId,
        10,
        { from: GUILD } // using GUILD address (reserved)
      );
    } catch (e) {
      assert.equal(e.reason, "applicant is reserved address");
    }
  });

  it("should not be possible to submit a nft tribute if the nft address is not allowed", async () => {
    const daoOwner = accounts[0];
    const nftOwner = accounts[1];
    const { dao, pixelNFT } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
    );

    await pixelNFT.mintPixel(nftOwner, 1, 1);
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    try {
      await tributeNFT.provideTributeNFT(
        dao.address,
        "0x1",
        ETH_TOKEN, // address not allowed
        tokenId,
        10,
        { from: nftOwner, gasPrice: toBN("0") }
      );
    } catch (e) {
      assert.equal(e.reason, "nft not allowed");
    }
  });

  it("should be possible to sponsor a nft tribute proposal", async () => {
    const daoOwner = accounts[0];
    const nftOwner = accounts[1];
    const proposalId = "0x1";
    const { dao, pixelNFT } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
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

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // The NFT should be transfered to the adapter contract
    const ownerAddress = await pixelNFT.ownerOf(tokenId);
    assert.equal(ownerAddress, tributeNFT.address);
  });

  it("should not be possible to sponsor a nft tribute proposal if it is called by a non member", async () => {
    const daoOwner = accounts[0];
    const nftOwner = accounts[1];
    const proposalId = "0x1";
    const { dao, pixelNFT } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
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

    try {
      await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
        from: nftOwner,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "it should not be possible to sponsor if the sender is not a DAO member"
      );
    } catch (e) {
      //ignore error (revert) because the tx was sent by a non member
    }
  });

  it("should be possible to cancel a nft tribute proposal", async () => {
    const daoOwner = accounts[0];
    const nftOwner = accounts[1];
    const proposalId = "0x1";
    const { dao, pixelNFT } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
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

    await tributeNFT.cancelProposal(dao.address, proposalId, {
      from: nftOwner,
      gasPrice: toBN("0"),
    });

    // The NFT should be transfered back to the original owner
    const ownerAddress = await pixelNFT.ownerOf(tokenId);
    assert.equal(ownerAddress, nftOwner);
  });

  it("should not be possible to cancel a nft tribute proposal if you are not the applicant", async () => {
    const daoOwner = accounts[0];
    const nftOwner = accounts[1];
    const proposalId = "0x1";
    const { dao, pixelNFT } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
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

    try {
      await tributeNFT.cancelProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to cancel a proposal if the sender is not the applicant"
      );
    } catch (e) {
      assert.equal(e.reason, "only the applicant can cancel a proposal");
    }
  });

  it("should not be possible to cancel a nft tribute proposal if it does not exist", async () => {
    const daoOwner = accounts[0];
    const proposalId = "0x1";
    const { dao } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
    );

    try {
      await tributeNFT.cancelProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to cancel a proposal that does not exist"
      );
    } catch (e) {
      assert.equal(e.reason, "proposal does not exist");
    }
  });

  it("should not be possible to cancel a nft tribute proposal if it was already sponsored", async () => {
    const daoOwner = accounts[0];
    const nftOwner = accounts[1];
    const proposalId = "0x1";
    const { dao, pixelNFT } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
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

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    try {
      await tributeNFT.cancelProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      });
      assert.fail("should not be possible to cancel an sponsored proposal");
    } catch (e) {
      assert.equal(e.reason, "proposal already sponsored");
    }
  });

  it("should be possible to process a nft tribute proposal", async () => {
    const daoOwner = accounts[0];
    const nftOwner = accounts[1];
    const proposalId = "0x1";
    const { dao, pixelNFT } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
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

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const voting = await getContract(dao, "voting", VotingContract);

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
    assert.equal(newOwnerAddr, nftExtAddr);
  });

  it("should not be possible to process a nft tribute proposal if it does not exist", async () => {
    const daoOwner = accounts[0];
    const proposalId = "0x1";
    const { dao, pixelNFT } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
    );
    try {
      await tributeNFT.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a proposal that does not exist"
      );
    } catch (e) {
      assert.equal(e.reason, "proposal does not exist");
    }
  });

  it("should return the nft tribute to the owner if the proposal did not pass", async () => {
    const daoOwner = accounts[0];
    const nftOwner = accounts[1];
    const proposalId = "0x1";
    const { dao, pixelNFT } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
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
    assert.equal(newOwnerAddr, tributeNFT.address);

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const voting = await getContract(dao, "voting", VotingContract);

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
    assert.equal(newOwnerAddr2, nftOwner);
  });

  it("should return the nft tribute if the proposal result is a tie", async () => {
    const daoOwner = accounts[0];
    const nftOwner = accounts[1];
    const daoMemberA = accounts[2];
    const proposalId = "0x1";
    const { dao, pixelNFT } = await createNFTDao(daoOwner);

    await onboardNewMember(dao, daoOwner, daoMemberA, "0x2");

    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
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
    assert.equal(newOwnerAddr, tributeNFT.address);

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const voting = await getContract(dao, "voting", VotingContract);

    // DAO member A votes NO
    await voting.submitVote(dao.address, proposalId, 2, {
      from: daoMemberA,
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
    // Make the asset was transfered from the Adapter Escrow contract to the original owner
    assert.equal(newOwnerAddr2, nftOwner);
  });

  it("should not be possible process a proposal that was not voted", async () => {
    const daoOwner = accounts[0];
    const nftOwner = accounts[1];
    const proposalId = "0x1";
    const { dao, pixelNFT } = await createNFTDao(daoOwner);
    const tributeNFT = await getContract(
      dao,
      "tribute-nft",
      TributeNFTContract
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
    assert.equal(newOwnerAddr, tributeNFT.address);

    await tributeNFT.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    try {
      await tributeNFT.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a proposal that was not voted"
      );
    } catch (e) {
      assert.equal(e.reason, "proposal has not been voted on");
    }
  });
});
