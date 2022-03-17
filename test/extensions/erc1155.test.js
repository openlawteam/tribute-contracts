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
  fromAscii,
  toWei,
  unitPrice,
  UNITS,
  GUILD,
  ZERO_ADDRESS,
} = require("../../utils/contract-util");

const {
  takeChainSnapshot,
  revertChainSnapshot,
  deployDefaultNFTDao,
  proposalIdGenerator,
  getAccounts,
  web3,
} = require("../../utils/hardhat-test-util");

const {
  isMember,
  onboardingNewMember,
  encodeDaoInfo,
  guildKickProposal,
} = require("../../utils/test-util");

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Extension - ERC1155", () => {
  let accounts, daoOwner;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];

    const { dao, adapters, extensions, factories, testContracts } =
      await deployDefaultNFTDao({ owner: daoOwner });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.testContracts = testContracts;
    this.factories = factories;
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  describe("Factory", async () => {
    it("should be possible to create an extension using the factory", async () => {
      const { logs } = await this.factories.erc1155ExtFactory.create(
        this.dao.address
      );
      const log = logs[0];
      expect(log.event).to.be.equal("ERC1155CollectionCreated");
      expect(log.args[0]).to.be.equal(this.dao.address);
      expect(log.args[1]).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should be possible to get an extension address by dao", async () => {
      await this.factories.erc1155ExtFactory.create(this.dao.address);
      const extAddress =
        await this.factories.erc1155ExtFactory.getExtensionAddress(
          this.dao.address
        );
      expect(extAddress).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should return zero address if there is no extension address by dao", async () => {
      const daoAddress = accounts[2];
      const extAddress =
        await this.factories.erc1155ExtFactory.getExtensionAddress(daoAddress);
      expect(extAddress).to.be.equal(ZERO_ADDRESS);
    });

    it("should not be possible to create an extension using a zero address dao", async () => {
      await expect(this.factories.erc1155ExtFactory.create(ZERO_ADDRESS)).to.be
        .reverted;
    });
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
    await expect(
      erc1155TokenExtension.getNFT(erc1155TestToken.address, 0)
    ).to.be.revertedWith("revert");
  });

  it("should not be possible to withdraw a NFT without the WITHDRAW_NFT permission", async () => {
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    await expect(
      erc1155TokenExtension.withdrawNFT(
        this.dao.address,
        GUILD,
        accounts[1],
        erc1155TestToken.address,
        1, //tokenId
        1 //amount
      )
    ).to.be.revertedWith("erc1155Ext::accessDenied");
  });

  it("should not be possible to initialize the extension if it was already initialized", async () => {
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    await expect(
      erc1155TokenExtension.initialize(this.dao.address, accounts[0])
    ).to.be.revertedWith("already initialized");
  });

  it("should be possible to collect a NFT if that is sent directly to the extension", async () => {
    const nftOwner = accounts[2];
    const dao = this.dao;
    const erc1155Token = this.testContracts.erc1155TestToken;
    const erc1155Ext = this.extensions.erc1155Ext;

    await erc1155Token.mint(nftOwner, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    const pastEvents = await erc1155Token.getPastEvents();
    const { id: tokenId } = pastEvents[0].returnValues;

    const tokenBalance = await erc1155Token.balanceOf(nftOwner, tokenId);
    expect(tokenBalance.toString()).equal("10");

    const tokenValue = 3;
    await erc1155Token.safeTransferFrom(
      nftOwner,
      erc1155Ext.address,
      tokenId,
      tokenValue,
      encodeDaoInfo(dao.address),
      { from: nftOwner }
    );

    await erc1155Token.safeTransferFrom(
      nftOwner,
      erc1155Ext.address,
      tokenId,
      tokenValue,
      encodeDaoInfo(dao.address),
      { from: nftOwner }
    );

    // Make sure it was collected in the NFT Extension
    const nftAddr = await erc1155Ext.getNFTAddress(0);
    expect(nftAddr).equal(erc1155Token.address);
    const nftId = await erc1155Ext.getNFT(nftAddr, 0);
    expect(nftId.toString()).equal(tokenId.toString());

    // The NFT belongs to the GUILD after it is collected via ERC1155 Extension
    const newOwner = await erc1155Ext.getNFTOwner(nftAddr, tokenId, 0);
    expect(newOwner.toLowerCase()).equal(GUILD);

    // The actual holder of the NFT is the ERC1155 Extension
    const holderBalance = await erc1155Token.balanceOf(
      erc1155Ext.address,
      tokenId
    );
    expect(holderBalance.toString()).equal((tokenValue * 2).toString());
  });

  it("should be possible to batch collect NFTs if they are sent directly to the extension", async () => {
    const nftOwnerA = accounts[2];
    const nftOwnerB = accounts[3];

    const dao = this.dao;
    const erc1155Token = this.testContracts.erc1155TestToken;
    const erc1155Ext = this.extensions.erc1155Ext;

    await erc1155Token.mint(nftOwnerA, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await erc1155Token.mint(nftOwnerA, 2, 1, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await erc1155Token.setApprovalForAll(erc1155Ext.address, true, {
      from: nftOwnerA,
    });

    await erc1155Token.safeBatchTransferFrom(
      nftOwnerA,
      erc1155Ext.address,
      [1, 2], // token ids
      [5, 1], // amounts for each tokenId
      encodeDaoInfo(dao.address),
      { from: nftOwnerA }
    );

    await erc1155Token.mint(nftOwnerB, 3, 2, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await erc1155Token.mint(nftOwnerB, 4, 100, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await erc1155Token.setApprovalForAll(erc1155Ext.address, true, {
      from: nftOwnerB,
    });

    await erc1155Token.safeBatchTransferFrom(
      nftOwnerB,
      erc1155Ext.address,
      [3, 4], // token ids
      [2, 100], // amounts for each tokenId
      encodeDaoInfo(dao.address),
      { from: nftOwnerB }
    );
    const nftAddr = erc1155Token.address;

    // Make sure the token ids were collected by the NFT Extension
    expect((await erc1155Ext.getNFT(nftAddr, 0)).toString()).equal("1");
    expect((await erc1155Ext.getNFT(nftAddr, 1)).toString()).equal("2");
    expect((await erc1155Ext.getNFT(nftAddr, 2)).toString()).equal("3");
    expect((await erc1155Ext.getNFT(nftAddr, 3)).toString()).equal("4");

    // The are managed by the GUILD after it is collected via ERC1155 Extension,
    // but the extension should the we keep track of the original owners
    expect((await erc1155Ext.nbNFTOwners(nftAddr, 2)).toString()).equal("1");
    expect((await erc1155Ext.getNFTOwner(nftAddr, 1, 0)).toLowerCase()).equal(
      GUILD
    );
    expect((await erc1155Ext.getNFTOwner(nftAddr, 2, 0)).toLowerCase()).equal(
      GUILD
    );
    expect((await erc1155Ext.getNFTOwner(nftAddr, 3, 0)).toLowerCase()).equal(
      GUILD
    );
    expect((await erc1155Ext.getNFTOwner(nftAddr, 4, 0)).toLowerCase()).equal(
      GUILD
    );

    // Check if the amounts were properly stored
    expect(
      (await erc1155Ext.getNFTIdAmount(GUILD, nftAddr, 1)).toString()
    ).equal("5");
    expect(
      (await erc1155Ext.getNFTIdAmount(GUILD, nftAddr, 2)).toString()
    ).equal("1");
    expect(
      (await erc1155Ext.getNFTIdAmount(GUILD, nftAddr, 3)).toString()
    ).equal("2");
    expect(
      (await erc1155Ext.getNFTIdAmount(GUILD, nftAddr, 4)).toString()
    ).equal("100");
  });

  it("should be possible to get the total number of NFT owners", async () => {
    const nftOwner = accounts[2];
    const dao = this.dao;
    const erc1155Token = this.testContracts.erc1155TestToken;
    const erc1155Ext = this.extensions.erc1155Ext;

    await erc1155Token.mint(nftOwner, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    const pastEvents = await erc1155Token.getPastEvents();
    const { id: tokenId } = pastEvents[0].returnValues;

    const tokenValue = 3;
    await erc1155Token.safeTransferFrom(
      nftOwner,
      erc1155Ext.address,
      tokenId,
      tokenValue,
      encodeDaoInfo(dao.address),
      { from: nftOwner }
    );

    const nbOfOwners = await erc1155Ext.nbNFTOwners(
      erc1155Token.address,
      tokenId
    );
    expect(nbOfOwners.toString()).equal("1");
  });

  it("should return 0 as the total number of NFT owners when the NFT collection is empty", async () => {
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155Token = this.testContracts.erc1155TestToken;
    const nbOfOwners = await erc1155TokenExtension.nbNFTOwners(
      erc1155Token.address,
      1
    );
    expect(nbOfOwners.toString()).equal("0");
  });

  it("should not be possible to do an internal transfer of the NFT to a non member", async () => {
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    const bank = this.extensions.bankExt;
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

    await this.adapters.erc1155TestAdapter.internalTransfer(
      this.dao.address,
      erc1155TestToken.address,
      id, //tokenId
      2, //amount
      { from: nftOwner }
    );

    await erc1155Adapter.internalTransfer(
      this.dao.address,
      nonMember,
      erc1155TestToken.address,
      1, //tokenId
      1, //amount
      { from: nftOwner }
    );

    const nonMemberBalance = await erc1155TokenExtension.getNFTIdAmount(
      nonMember,
      erc1155TestToken.address,
      1
    );

    const nftOwnerBalance = await erc1155TokenExtension.getNFTIdAmount(
      nftOwner,
      erc1155TestToken.address,
      1
    );

    expect(nonMemberBalance.toString()).equal("1");
    expect(nftOwnerBalance.toString()).equal("1");
  });

  it("should not be possible to transfer the NFT when you are not the owner", async () => {
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    const bank = this.extensions.bankExt;
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

    // transfer from nft owner to the extension
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
    let balanceOfnftOwner = await erc1155TestToken.balanceOf(nftOwner, id);
    expect(balanceOfnftOwner.toString()).equal("8");

    //check token balance of the nftOwner inside the Extension = +2
    const nftOwnerGuildBalance = await erc1155TokenExtension.getNFTIdAmount(
      GUILD,
      erc1155TestToken.address,
      1
    );
    expect(nftOwnerGuildBalance.toString()).equal("2");
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

    const owner = await erc1155TokenExtension.getNFTOwner(
      erc1155TestToken.address,
      id,
      0
    );
    expect(owner.toLowerCase()).equal(GUILD);

    //internalTransfer should revert, because nonMember is not a member
    await expect(
      erc1155Adapter.internalTransfer(
        this.dao.address,
        nonMember,
        erc1155TestToken.address,
        id, //tokenId
        1, //amount
        { from: nftOwner }
      )
    ).to.be.revertedWith("erc1155Ext::invalid amount");
  });

  it("should be possible to withdraw the NFT from the extension contract to the new owner account", async () => {
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    const nftOwner = accounts[1];
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155TestAdapter = this.adapters.erc1155TestAdapter;

    //create a test 1155 token
    await erc1155TestToken.mint(nftOwner, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const pastEvents = await erc1155TestToken.getPastEvents();
    const { id } = pastEvents[0].returnValues;

    // transfer from nft owner to the extension
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
    let balanceOfNftOwner = await erc1155TestToken.balanceOf(nftOwner, id);
    expect(balanceOfNftOwner.toString()).equal("8");

    //check token balance of the nftOwner inside the Extension = +2
    let nftOwnerGuildBalance = await erc1155TokenExtension.getNFTIdAmount(
      GUILD,
      erc1155TestToken.address,
      1
    );
    expect(nftOwnerGuildBalance.toString()).equal("2");
    // If the NFT was properly saved, the guild must be the new owner of the NFT
    let newOwner = await erc1155TokenExtension.getNFTOwner(
      erc1155TestToken.address,
      1,
      0
    );
    expect(newOwner.toLowerCase()).equal(GUILD);

    await erc1155TestAdapter.withdraw(
      this.dao.address,
      erc1155TestToken.address,
      id, //tokenId
      2, //amount
      { from: nftOwner }
    );

    //check token balance of nftOwner after collection = +2
    balanceOfNftOwner = await erc1155TestToken.balanceOf(nftOwner, id);
    expect(balanceOfNftOwner.toString()).equal("10");

    //check token balance of the nftOwner inside the Extension = -2
    nftOwnerGuildBalance = await erc1155TokenExtension.getNFTIdAmount(
      GUILD,
      erc1155TestToken.address,
      1
    );
    expect(nftOwnerGuildBalance.toString()).equal("0");
    // The nft was moved to the new owner account, so the GUILD should not be the NFT owner anymore
    // The getNFTOwner must revert because there is no NFT asset for the GUILD owner at index 0
    await expect(
      erc1155TokenExtension.getNFTOwner(erc1155TestToken.address, 1, 0)
    ).to.be.reverted;
  });

  it("should not be possible to batch collect NFTs if there are more token ids than token amounts", async () => {
    const nftOwnerA = accounts[2];

    const dao = this.dao;
    const erc1155Token = this.testContracts.erc1155TestToken;
    const erc1155Ext = this.extensions.erc1155Ext;

    await erc1155Token.mint(nftOwnerA, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await erc1155Token.mint(nftOwnerA, 2, 1, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await erc1155Token.setApprovalForAll(erc1155Ext.address, true, {
      from: nftOwnerA,
    });

    await expect(
      erc1155Token.safeBatchTransferFrom(
        nftOwnerA,
        erc1155Ext.address,
        [1, 2], // token ids
        [5], // amounts for each tokenId
        encodeDaoInfo(dao.address),
        { from: nftOwnerA }
      )
    ).to.be.revertedWith("ERC1155: ids and amounts length mismatch");
  });

  it("should not be possible to batch collect NFTs if there are more token amounts than token ids", async () => {
    const nftOwnerA = accounts[2];

    const dao = this.dao;
    const erc1155Token = this.testContracts.erc1155TestToken;
    const erc1155Ext = this.extensions.erc1155Ext;

    await erc1155Token.mint(nftOwnerA, 1, 10, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await erc1155Token.mint(nftOwnerA, 2, 1, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await erc1155Token.setApprovalForAll(erc1155Ext.address, true, {
      from: nftOwnerA,
    });

    await expect(
      erc1155Token.safeBatchTransferFrom(
        nftOwnerA,
        erc1155Ext.address,
        [1], // token ids
        [5, 1], // amounts for each tokenId
        encodeDaoInfo(dao.address),
        { from: nftOwnerA }
      )
    ).to.be.revertedWith("ERC1155: ids and amounts length mismatch");
  });

  it("should not be possible to execute an internalTransfer if the nftOwner is in jail", async () => {
    const jailedNftOwner = accounts[2];
    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    const guildkickContract = this.adapters.guildkick;
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155Adapter = this.adapters.erc1155Adapter;

    //create a test 1155 token
    const tokenId = 1,
      tokenAmount = 10;
    await erc1155TestToken.mint(jailedNftOwner, tokenId, tokenAmount, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // transfer from nft owner to the extension to test out the internal transfer
    await erc1155TestToken.safeTransferFrom(
      jailedNftOwner,
      erc1155TokenExtension.address,
      tokenId,
      tokenAmount,
      [],
      {
        from: jailedNftOwner,
      }
    );

    // Onboard the nftOwner as a member
    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      jailedNftOwner,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    expect(await isMember(bank, jailedNftOwner)).equal(true);

    // Start a new kick proposal
    let memberToKick = jailedNftOwner;
    let kickProposalId = getProposalCounter();

    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      daoOwner,
      kickProposalId
    );

    // Jailed member attempts to execute an internalTransfer, it should revert
    await expect(
      erc1155Adapter.internalTransfer(
        this.dao.address,
        jailedNftOwner,
        erc1155TestToken.address,
        tokenId,
        tokenAmount,
        { from: jailedNftOwner }
      )
    ).to.be.revertedWith("member is jailed");
  });

  it("should be possible to withdraw the NFT even if the nftOwner is in jail", async () => {
    const jailedNftOwner = accounts[2];
    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    const guildkickContract = this.adapters.guildkick;
    const erc1155TokenExtension = this.extensions.erc1155Ext;
    const erc1155TestAdapter = this.adapters.erc1155TestAdapter;

    //create a test 1155 token
    const tokenId = 1,
      tokenAmount = 10;
    await erc1155TestToken.mint(jailedNftOwner, tokenId, tokenAmount, "0x0", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // transfer from nft owner to the extension to test out the internal transfer
    await erc1155TestToken.safeTransferFrom(
      jailedNftOwner,
      erc1155TokenExtension.address,
      tokenId,
      tokenAmount,
      [],
      {
        from: jailedNftOwner,
      }
    );

    // Onboard the nftOwner as a member
    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      jailedNftOwner,
      daoOwner,
      unitPrice,
      UNITS,
      toBN("3")
    );
    expect(await isMember(bank, jailedNftOwner)).equal(true);

    // Start a new kick proposal
    let memberToKick = jailedNftOwner;
    let kickProposalId = getProposalCounter();

    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      daoOwner,
      kickProposalId
    );

    await erc1155TestAdapter.withdraw(
      this.dao.address,
      erc1155TestToken.address,
      tokenId,
      tokenAmount,
      { from: jailedNftOwner }
    );

    const balanceOfNftOwner = await erc1155TestToken.balanceOf(
      jailedNftOwner,
      tokenId
    );
    expect(balanceOfNftOwner.toString()).equal(tokenAmount.toString());

    const balanceInExtension = await erc1155TokenExtension.getNFTIdAmount(
      jailedNftOwner,
      erc1155TestToken.address,
      1
    );
    expect(balanceInExtension.toString()).equal("0");
    // The nft was moved to the new owner account, so the GUILD should not be the NFT owner anymore
    // The getNFTOwner must revert because there is no NFT asset for the GUILD owner at index 0
    await expect(
      erc1155TokenExtension.getNFTOwner(erc1155TestToken.address, 1, 0)
    ).to.be.reverted;
  });

  it("should not be possible to send ETH to the extension via receive function", async () => {
    const extension = this.extensions.erc1155Ext;
    await expect(
      web3.eth.sendTransaction({
        to: extension.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
      })
    ).to.be.revertedWith("revert");
  });

  it("should not be possible to send ETH to the extension via fallback function", async () => {
    const extension = this.extensions.erc1155Ext;
    await expect(
      web3.eth.sendTransaction({
        to: extension.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
        data: fromAscii("should go to fallback func"),
      })
    ).to.be.revertedWith("revert");
  });
});
