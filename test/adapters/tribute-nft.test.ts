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
import { toBN } from "web3-utils";
const {
  unitPrice,
  UNITS,
  GUILD,
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
  web3,
} = require("../../utils/OZTestUtil.js");

const { onboardingNewMember, isMember } = require("../../utils/TestUtils.js");

// @ts-ignore
const processProposal = (dao, proposalId) =>
  web3.eth.abi.encodeParameter(
    {
      ProcessProposal: {
        dao: "address",
        proposalId: "bytes32",
      },
    },
    {
      dao: dao.address,
      proposalId,
    }
  );

describe("Adapter - TributeNFT", () => {
  const proposalCounter = proposalIdGenerator().generator;
  const daoOwner = accounts[0];

  const getProposalCounter = () => {
    return proposalCounter().next().value;
  };

  let daoInstance: any;
  let extensionsInstance: { bank: any, nft: any, erc1155Ext: any };
  let adaptersInstance: any;
  let snapshotId: any;
  let testContractsInstance: any;

  before("deploy dao", async () => {
    const {
      dao,
      adapters,
      extensions,
      testContracts,
    } = await deployDefaultNFTDao({ owner: daoOwner });
    daoInstance = dao;
    extensionsInstance = extensions;
    adaptersInstance = adapters
    snapshotId = await takeChainSnapshot();
    testContractsInstance = testContracts;
  });

  beforeEach(async () => {
    await revertChainSnapshot(snapshotId);
    snapshotId = await takeChainSnapshot();
  });

  it("should be possible to submit and sponsor a erc721 nft tribute proposal", async () => {
    const nftOwner = accounts[2];
    const dao = daoInstance;
    const pixelNFT = testContractsInstance.pixelNFT;
    const tributeNFT = adaptersInstance.tributeNFT;

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
    const dao = daoInstance;
    const tributeNFT = adaptersInstance.tributeNFT;
    const pixelNFT = testContractsInstance.pixelNFT;

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
        10, // requested units
        [],
        { from: daoOwner }
      ),
      "applicant is reserved address"
    );
  });

  it("should not be possible to submit and sponsor a nft tribute proposal if it is called by a non member", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = daoInstance;
    const pixelNFT = testContractsInstance.pixelNFT;
    const tributeNFT = adaptersInstance.tributeNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    let revertedCall = tributeNFT.submitProposal(
      dao.address,
      proposalId,
      nftOwner,
      pixelNFT.address,
      tokenId,
      10, // requested units
      [],
      { from: nftOwner, gasPrice: toBN("0") }
    );

    await expectRevert.unspecified(revertedCall);
  });

  it("should be possible to process a nft tribute proposal", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = daoInstance;
    const bank = extensionsInstance.bank;
    const nftExt = extensionsInstance.nft;
    const pixelNFT = testContractsInstance.pixelNFT;
    const tributeNFT = adaptersInstance.tributeNFT;
    const voting = adaptersInstance.voting;

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
      processProposal(dao, proposalId),
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

    // Check if asset was transfered to the NFT Extension contract
    const newOwnerAddr = await pixelNFT.ownerOf(tokenId);
    expect(newOwnerAddr).equal(nftExt.address);
  });

  it("should not be possible to process a nft tribute proposal if it does not exist", async () => {
    const proposalId = getProposalCounter();
    const nftOwner = accounts[2];
    const dao = daoInstance;
    const tributeNFT = adaptersInstance.tributeNFT;
    const pixelNFT = testContractsInstance.pixelNFT;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await expectRevert(
      pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
        nftOwner,
        tributeNFT.address,
        tokenId,
        processProposal(dao, proposalId),
        {
          from: nftOwner,
          gasPrice: toBN("0"),
        }
      ),
      "proposal does not exist"
    );
  });

  it("should not transfer the nft tribute from the owner if the proposal did not pass", async () => {
    const nftOwner = accounts[2];
    const proposalId = getProposalCounter();
    const dao = daoInstance;
    const bank = extensionsInstance.bank;
    const nftExt = extensionsInstance.nft;
    const pixelNFT = testContractsInstance.pixelNFT;
    const tributeNFT = adaptersInstance.tributeNFT;
    const voting = adaptersInstance.voting;

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
      processProposal(dao, proposalId),
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
    const dao = daoInstance;
    const bank = extensionsInstance.bank;
    const nftExt = extensionsInstance.nft;
    const pixelNFT = testContractsInstance.pixelNFT;
    const tributeNFT = adaptersInstance.tributeNFT;
    const voting = adaptersInstance.voting;

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      adaptersInstance.onboarding,
      adaptersInstance.voting,
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
      processProposal(dao, proposalId),
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
    const dao = daoInstance;
    const bank = extensionsInstance.bank;
    const nftExt = extensionsInstance.nft;
    const pixelNFT = testContractsInstance.pixelNFT;
    const tributeNFT = adaptersInstance.tributeNFT;

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

    await expectRevert(
      pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
        nftOwner,
        tributeNFT.address,
        tokenId,
        processProposal(dao, proposalId),
        {
          from: nftOwner,
          gasPrice: toBN("0"),
        }
      ),
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
    const dao = daoInstance;
    const nftExt = extensionsInstance.nft;
    const pixelNFT = testContractsInstance.pixelNFT;
    const tributeNFT = adaptersInstance.tributeNFT;
    const voting = adaptersInstance.voting;

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

    await expectRevert(
      pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
        nftOwner,
        tributeNFT.address,
        tokenId,
        processProposal(dao, proposalId),
        {
          from: nftOwner,
          gasPrice: toBN("0"),
        }
      ),
      "token amount exceeds the maximum limit for internal tokens"
    );
  });

  it("should be possible to onboard a member with erc1155 tribute", async () => {
    const nftOwner = accounts[2];
    const dao = daoInstance;
    const erc1155Token = testContractsInstance.erc1155TestToken;
    const tributeNFT = adaptersInstance.tributeNFT;
    const erc1155Ext = extensionsInstance.erc1155Ext;
    const bank = extensionsInstance.bank;
    const voting = adaptersInstance.voting;
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
      processProposal(dao, proposalId),
      { from: nftOwner }
    );

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("10");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(true);

    // Check if asset was transfered to the NFT Extension account
    const extBalance = await erc1155Token.balanceOf(erc1155Ext.address, id);
    expect(extBalance.toString()).equal("3");

    // Check if asset was transfered to from the owner account
    const ownerBalance = await erc1155Token.balanceOf(nftOwner, id);
    expect(ownerBalance.toString()).equal("7");
  });

  it("should send back the erc1155 tokens if the proposal has failed", async () => {
    const nftOwner = accounts[2];
    const dao = daoInstance;
    const erc1155Token = testContractsInstance.erc1155TestToken;
    const tributeNFT = adaptersInstance.tributeNFT;
    const erc1155Ext = extensionsInstance.erc1155Ext;
    const bank = extensionsInstance.bank;
    const voting = adaptersInstance.voting;
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
      processProposal(dao, proposalId),
      { from: nftOwner }
    );

    // test balance after proposal is processed
    const applicantUnits = await bank.balanceOf(nftOwner, UNITS);
    expect(applicantUnits.toString()).equal("0");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, nftOwner);
    expect(applicantIsActiveMember).equal(false);

    // Check if asset was transfered to the NFT Extension account
    const extBalance = await erc1155Token.balanceOf(erc1155Ext.address, id);
    expect(extBalance.toString()).equal("0");

    // Check if asset was transfered to from the owner account
    const ownerBalance = await erc1155Token.balanceOf(nftOwner, id);
    expect(ownerBalance.toString()).equal("10");
  });
});
