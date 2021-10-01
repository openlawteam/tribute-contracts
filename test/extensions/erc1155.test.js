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
  fromAscii,
  toWei,
  unitPrice,
  UNITS,
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
  web3,
} = require("../../utils/OZTestUtil.js");

const { isMember, onboardingNewMember } = require("../../utils/TestUtils.js");

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
        GUILD,
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

    //set approval where Extension is the "operator" all of nftOwners
    await erc1155TestToken.safeTransferFrom(
      nftOwner,
      erc1155TokenExtension.address,
      1,
      2,
      [],
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

    //check token balance of the owner = +2 within the extension
    const newGuildBlance = await erc1155TokenExtension.getNFTIdAmount(
      GUILD,
      erc1155TestToken.address,
      1
    );

    expect(newGuildBlance.toString()).equal("2");
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
    await erc1155TestToken.safeTransferFrom(
      nftOwner,
      erc1155TokenExtension.address,
      id,
      2,
      [],
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
    const nftOwnerGuildBlance = await erc1155TokenExtension.getNFTIdAmount(
      GUILD,
      erc1155TestToken.address,
      1
    );
    expect(nftOwnerGuildBlance.toString()).equal("2");
    //create nonMember
    const nonMember = accounts[5];
    expect(await isMember(bank, nonMember)).equal(false);
    //Onboard members
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
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
    //internalTransfer should revert, because nonMember is not a member
    await expectRevert(
      erc1155Adapter.internalTransfer(
        this.dao.address,
        nonMember,
        erc1155TestToken.address,
        1, //tokenId
        1, //amount
        { from: nftOwner }
      ),
      "erc1155Ext::toOwner is not a member -- Reason given: erc1155Ext::toOwner is not a member"
    );
  });

  it(" should not be possible to transfer the NFT when you are not the owner", async () => {
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

    await erc1155TestToken.safeTransferFrom(
      nftOwner,
      erc1155TokenExtension.address,
      id,
      2,
      [],
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
    const nftOwnerGuildBlance = await erc1155TokenExtension.getNFTIdAmount(
      GUILD,
      erc1155TestToken.address,
      1
    );
    expect(nftOwnerGuildBlance.toString()).equal("2");
    //create nonMember
    const nonMember = accounts[5];
    expect(await isMember(bank, nonMember)).equal(false);
    //Onboard members
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
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

    //internalTransfer should revert, because nonMember is not a member
    await expectRevert(
      erc1155Adapter.internalTransfer(
        this.dao.address,
        nftOwner,
        erc1155TestToken.address,
        1, //tokenId
        1, //amount
        { from: nonMember }
      ),
      "erc1155Ext::fromOwner is not a member -- Reason given: erc1155Ext::fromOwner is not a member"
    );
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.erc1155Adapter;
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
    const adapter = this.adapters.erc1155Adapter;
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
