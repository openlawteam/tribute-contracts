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
  numberOfUnits,
  GUILD,
} = require("../../utils/ContractUtil.js");

const {
  takeChainSnapshot,
  revertChainSnapshot,
  deployDefaultNFTDao,
  proposalIdGenerator,
  accounts,
  expectRevert,
  expect,
} = require("../../utils/OZTestUtil.js");

const {
  isMember,
  onboardingNewMember,
  // submitConfigProposal,
} = require("../../utils/TestUtils.js");

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Extension - ERC1155", () => {
  const daoOwner = accounts[0];

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
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  it("should be possible to create a dao with a nft extension pre-configured", async () => {
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    expect(erc1155TokenExtension).to.not.be.null;
  });

  it("should be possible check how many token ids are collected for a specific NFT address", async () => {
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    const total = await erc1155TokenExtension.nbNFTs(erc1155TestToken.address);
    expect(total.toString()).equal("0");
  });

  it("should be possible check how many NFTs are in the collection", async () => {
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const total = await erc1155TokenExtension.nbNFTAddresses();
    expect(total.toString()).equal("0");
  });

  it("should not be possible get an NFT in the collection if it is empty", async () => {
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    await expectRevert(
      erc1155TokenExtension.getNFT(erc1155TestToken.address, 0),
      "index out of bounds"
    );
  });

  it("should not be possible to withdraw a NFT without the WITHDRAW_NFT permission", async () => {
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    await expectRevert(
      erc1155TokenExtension.withdrawNFT(
        accounts[1],
        erc1155TestToken.address,
        1, //tokenId
        1 //amount
      ),
      "erc1155Ext::accessDenied"
    );
  });

  it("should not be possible to initialize the extension if it was already initialized", async () => {
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    await expectRevert(
      erc1155TokenExtension.initialize(this.dao.address, accounts[0]),
      "already initialized"
    );
  });

  it("should be possible to collect a NFT if that is allowed", async () => {
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    const erc1155TestTokenAddress = erc1155TestToken.address;

    const nftOwner = accounts[1];
    //create a test 1155 token
    await erc1155TestToken.mint(nftOwner, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const pastEvents = await erc1155TestToken.getPastEvents();

    const { id, value } = pastEvents[0].returnValues;
    expect(id).equal("1");
    expect(value).equal("10");

    //instances for Extension and Adapter
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155Adapter = this.adapters.erc1155Adapter;

    //set approval where Extension is the "operator" all of nftOwners
    await erc1155TestToken.setApprovalForAll(
      erc1155TokenExtension.address,
      true,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );
    //check if Extension address is approved
    const approved = await erc1155TestToken.isApprovedForAll(
      nftOwner,
      erc1155TokenExtension.address
    );
    expect(approved).equal(true);

    //collect 2 tokens of tokenId 1
    await erc1155Adapter.collect(
      this.dao.address,
      erc1155TestTokenAddress,
      id,
      2,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    // Make sure it was collected
    const nftAddr = await erc1155TokenExtension.getNFTAddress(0);
    expect(nftAddr).equal(erc1155TestToken.address);
    const nftId = await erc1155TokenExtension.getNFT(nftAddr, 0);
    expect(nftId.toString()).equal(id.toString());

    //check token balance of nftOwner after collection = -2
    const balanceOfnftOwner = await erc1155TestToken.balanceOf(nftOwner, 1);
    expect(balanceOfnftOwner.toString()).equal("8");

    //check token balance of the GUILD = +2
    const newGuildBlance = await erc1155TokenExtension.getNFTIdAmount(
      GUILD,
      erc1155TestToken.address,
      1
    );

    expect(newGuildBlance.toString()).equal("2");
  });
//TODO: may need to change this test based on the refactor of erc1155 Extension
  it("should be possible to withdraw an NFT token when you are the owner", async () => {
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    const erc1155TestTokenAddress = erc1155TestToken.address;

    const nftOwner = accounts[1];
    //create a test 1155 token
    await erc1155TestToken.mint(nftOwner, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const pastEvents = await erc1155TestToken.getPastEvents();

    const { id, value } = pastEvents[0].returnValues;
    expect(id).equal("1");
    expect(value).equal("10");

    //instances for Extension and Adapter
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155Adapter = this.adapters.erc1155Adapter;

    //set approval where Extension is the "operator" all of nftOwners
    await erc1155TestToken.setApprovalForAll(
      erc1155TokenExtension.address,
      true,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );
    //check if Extension address is approved
    const approved = await erc1155TestToken.isApprovedForAll(
      nftOwner,
      erc1155TokenExtension.address
    );
    expect(approved).equal(true);

    //collect 2 tokens of tokenId 1
    await erc1155Adapter.collect(
      this.dao.address,
      erc1155TestTokenAddress,
      id,
      2,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    // Make sure it was collected
    const nftAddr = await erc1155TokenExtension.getNFTAddress(0);
    expect(nftAddr).equal(erc1155TestToken.address);
    const nftId = await erc1155TokenExtension.getNFT(nftAddr, 0);
    expect(nftId.toString()).equal(id.toString());

    //check token balance of nftOwner after collection = -2
    const balanceOfnftOwner = await erc1155TestToken.balanceOf(nftOwner, 1);
    expect(balanceOfnftOwner.toString()).equal("8");

    //check token balance of the GUILD = +2
    const newGuildBlance = await erc1155TokenExtension.getNFTIdAmount(
      GUILD,
      erc1155TestToken.address,
      1
    );

    expect(newGuildBlance.toString()).equal("2");
    //
    await erc1155Adapter.withdrawNFT(
      this.dao.address,
      erc1155TestTokenAddress,
      id,
      1,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );
    //check balance after withdrawal of nftOwner: 8 + 1 = 9
    const ownerBalanceAfterWithdraw = await erc1155TestToken.balanceOf(
      nftOwner,
      1
    );
    expect(ownerBalanceAfterWithdraw.toString()).equal("9");

    //check balance of GUILD after withdraw: 2 -1 = 1
    const guildBalanceAfterWithdraw = await erc1155TokenExtension.getNFTIdAmount(
      GUILD,
      erc1155TestToken.address,
      1
    );

    expect(guildBalanceAfterWithdraw.toString()).equal("1");
  });
  //it should be possible to do an internal transfer of NFT to a member
  it("should be possible to do an internal transfer of an NFT from member to another member", async () => {
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    const erc1155TestTokenAddress = erc1155TestToken.address;

    const nftOwner = accounts[1];
    //create a test 1155 token
    await erc1155TestToken.mint(nftOwner, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const pastEvents = await erc1155TestToken.getPastEvents();

    const { id, value } = pastEvents[0].returnValues;
    expect(id).equal("1");
    expect(value).equal("10");

    //instances for Extension and Adapter
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155Adapter = this.adapters.erc1155Adapter;

    //set approval where Extension is the "operator" all of nftOwners
    await erc1155TestToken.setApprovalForAll(
      erc1155TokenExtension.address,
      true,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );
    //check if Extension address is approved
    const approved = await erc1155TestToken.isApprovedForAll(
      nftOwner,
      erc1155TokenExtension.address
    );
    expect(approved).equal(true);

    //Onboard members
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    //onboard applicant A
    const applicantA = accounts[2];
    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      applicantA,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check if Applicant A is a member
    expect(await isMember(bank, applicantA)).equal(true);

    //onboard nftOwner

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      nftOwner,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    //check if nftOwner is a member
    expect(await isMember(bank, nftOwner)).equal(true);

    //collect 2 tokens of tokenId 1
    await erc1155Adapter.collect(
      this.dao.address,
      erc1155TestTokenAddress,
      id,
      2,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    // Make sure it was collected
    const nftAddr = await erc1155TokenExtension.getNFTAddress(0);
    expect(nftAddr).equal(erc1155TestToken.address);
    const nftId = await erc1155TokenExtension.getNFT(nftAddr, 0);
    expect(nftId.toString()).equal(id.toString());

    //check token balance of nftOwner account after collection = -2
    const balanceOfnftOwner = await erc1155TestToken.balanceOf(nftOwner, 1);
    expect(balanceOfnftOwner.toString()).equal("8");

    //check token balance of nftOwner inside the nftTracker mapping in the Extension = +2
    const newGuildBlance = await erc1155TokenExtension.getNFTIdAmount(
      nftOwner,
      erc1155TestToken.address,
      1
    );

    expect(newGuildBlance.toString()).equal("2");

    //internal transfer from nftOwner to Applicant A of 1 tokenId
    await erc1155Adapter.internalTransfer(
      this.dao.address,
      nftOwner,
      applicantA,
      erc1155TestTokenAddress,
      id,
      1,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    //balance check of nftOwner inside the Extension after transfer 2-1 = 1
    const guildBalanceAfterInternalTransfer = await erc1155TokenExtension.getNFTIdAmount(
      nftOwner,
      erc1155TestToken.address,
      1
    );
    expect(guildBalanceAfterInternalTransfer.toString()).equal("1");

    //balance check of Applicant A after internal transfer 0 + 1 = 1
    const applicantABalance = await erc1155TokenExtension.getNFTIdAmount(
      applicantA,
      erc1155TestToken.address,
      1
    );
    expect(applicantABalance.toString()).equal("1");
  });

  it("should not be possible to do an internal transfer of the NFT to a non member", async () => {
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    const erc1155TestTokenAddress = erc1155TestToken.address;
    const bank = this.extensions.bank;
    const nftOwner = accounts[1];
    //create a test 1155 token
    await erc1155TestToken.mint(nftOwner, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const pastEvents = await erc1155TestToken.getPastEvents();

    const { id, value } = pastEvents[0].returnValues;
    expect(id).equal("1");
    expect(value).equal("10");

    //instances for Extension and Adapter
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155Adapter = this.adapters.erc1155Adapter;

    //set approval where Extension is the "operator" all of nftOwners
    await erc1155TestToken.setApprovalForAll(
      erc1155TokenExtension.address,
      true,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );
    //check if Extension address is approved
    const approved = await erc1155TestToken.isApprovedForAll(
      nftOwner,
      erc1155TokenExtension.address
    );
    expect(approved).equal(true);

    //collect 2 tokens of tokenId 1
    await erc1155Adapter.collect(
      this.dao.address,
      erc1155TestTokenAddress,
      id,
      2,
      {
        from: nftOwner,
        gasPrice: toBN("0"),
      }
    );

    // Make sure it was collected
    const nftAddr = await erc1155TokenExtension.getNFTAddress(0);
    expect(nftAddr).equal(erc1155TestToken.address);
    const nftId = await erc1155TokenExtension.getNFT(nftAddr, 0);
    expect(nftId.toString()).equal(id.toString());

    //check token balance of nftOwner after collection = -2
    const balanceOfnftOwner = await erc1155TestToken.balanceOf(nftOwner, 1);
    expect(balanceOfnftOwner.toString()).equal("8");

    //check token balance of the nftOwner inside the Extension = +2
    const newGuildBlance = await erc1155TokenExtension.getNFTIdAmount(
      nftOwner,
      erc1155TestToken.address,
      1
    );
    expect(newGuildBlance.toString()).equal("2");
    //create nonMember
    const nonMember = accounts[5];
    expect(await isMember(bank, nonMember)).equal(false);
    //internalTransfer should revert, because nonMember is not a member
    await expectRevert(
      erc1155Adapter.internalTransfer(
        this.dao.address,
        nftOwner,
        nonMember,
        erc1155TestToken.address,
        1, //tokenId
        1 //amount
      ),
      "toOwner is not a member -- Reason given: toOwner is not a member"
    );
    //nftOwner balance of the NFT Id inside the Extension should be the same 2 -0 = 2
    const guildBalanceAfterInternalTransfer = await erc1155TokenExtension.getNFTIdAmount(
      GUILD,
      erc1155TestToken.address,
      1
    );
    expect(guildBalanceAfterInternalTransfer.toString()).equal("2");

    //non-mmeber balanceof the NFT Id should = 0
    const nonMemberBalance = await erc1155TokenExtension.getNFTIdAmount(
      nonMember,
      erc1155TestToken.address,
      1
    );
    expect(nonMemberBalance.toString()).equal("0");
  });
  // should not be possible to transfer the NFT when you are not the owner
});
