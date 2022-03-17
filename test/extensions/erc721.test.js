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
  toWei,
  toBN,
  fromAscii,
  GUILD,
  ZERO_ADDRESS,
  unitPrice,
  UNITS,
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
  encodeDaoInfo,
  onboardingNewMember,
  guildKickProposal,
} = require("../../utils/test-util");

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Extension - ERC721", () => {
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
      const { logs } = await this.factories.erc721ExtFactory.create(
        this.dao.address
      );
      const log = logs[0];
      expect(log.event).to.be.equal("NFTCollectionCreated");
      expect(log.args[0]).to.be.equal(this.dao.address);
      expect(log.args[1]).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should be possible to get an extension address by dao", async () => {
      await this.factories.erc721ExtFactory.create(this.dao.address);
      const extAddress =
        await this.factories.erc721ExtFactory.getExtensionAddress(
          this.dao.address
        );
      expect(extAddress).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should return zero address if there is no extension address by dao", async () => {
      const daoAddress = accounts[2];
      const extAddress =
        await this.factories.erc721ExtFactory.getExtensionAddress(daoAddress);
      expect(extAddress).to.be.equal(ZERO_ADDRESS);
    });

    it("should not be possible to create an extension using a zero address dao", async () => {
      await expect(this.factories.erc721ExtFactory.create(ZERO_ADDRESS)).to.be
        .reverted;
    });
  });

  it("should be possible to create a dao with a nft extension pre-configured", async () => {
    const nftExtension = this.extensions.erc721ExtFactory;
    expect(nftExtension).to.not.be.null;
  });

  it("should be possible check how many NFTs are in the collection", async () => {
    const nftExtension = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    const total = await nftExtension.nbNFTs(pixelNFT.address);
    expect(total.toString()).equal("0");
  });

  it("should be possible check how many NFTs are in the collection", async () => {
    const nftExtension = this.extensions.erc721Ext;
    const total = await nftExtension.nbNFTAddresses();
    expect(total.toString()).equal("0");
  });

  it("should be possible to collect a NFT that is send directly to the extension using safeTransferFrom", async () => {
    const nftOwner = accounts[2];
    const dao = this.dao;
    const pixelNFT = this.testContracts.pixelNFT;
    const nftExtension = this.extensions.erc721Ext;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    const firstOwner = await pixelNFT.ownerOf(tokenId);
    expect(firstOwner).equal(nftOwner);

    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner,
      nftExtension.address,
      tokenId,
      encodeDaoInfo(dao.address),
      {
        from: nftOwner,
      }
    );

    // Make sure it was collected in the NFT Extension
    const nftAddr = await nftExtension.getNFTAddress(0);
    expect(nftAddr).equal(pixelNFT.address);
    const nftId = await nftExtension.getNFT(nftAddr, 0);
    expect(nftId.toString()).equal(tokenId.toString());

    // The NFT belongs to the GUILD after it is collected via ERC721 Extension
    const newOwner = await nftExtension.getNFTOwner(nftAddr, tokenId);
    expect(newOwner.toLowerCase()).equal(GUILD);

    // The actual holder of the NFT is the ERC721 Extension
    const holder = await pixelNFT.ownerOf(tokenId);
    expect(holder).equal(nftExtension.address);
  });

  it("should be possible to collect a NFT that is send directly to the extension using transferFrom", async () => {
    const nftOwner = accounts[2];
    const pixelNFT = this.testContracts.pixelNFT;
    const nftExtension = this.extensions.erc721Ext;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    const firstOwner = await pixelNFT.ownerOf(tokenId);
    expect(firstOwner).equal(nftOwner);

    await pixelNFT.methods["transferFrom(address,address,uint256)"](
      nftOwner,
      nftExtension.address,
      tokenId,
      {
        from: nftOwner,
      }
    );

    // The NFT was sent via transferFrom, so we need to manually update the metadata
    await nftExtension.updateCollection(pixelNFT.address, tokenId);

    // Make sure it was collected in the NFT Extension
    const nftAddr = await nftExtension.getNFTAddress(0);
    expect(nftAddr).equal(pixelNFT.address);
    const nftId = await nftExtension.getNFT(nftAddr, 0);
    expect(nftId.toString()).equal(tokenId.toString());

    // The NFT belongs to the GUILD after it is collected via ERC721 Extension
    const newOwner = await nftExtension.getNFTOwner(nftAddr, tokenId);
    expect(newOwner.toLowerCase()).equal(GUILD);

    // The actual holder of the NFT is the ERC721 Extension
    const holder = await pixelNFT.ownerOf(tokenId);
    expect(holder).equal(nftExtension.address);
  });

  it("should be possible to execute an internalTransfer of the NFT to a new owner", async () => {
    const nftOwner = accounts[2];
    const anotherOwner = accounts[3];
    const pixelNFT = this.testContracts.pixelNFT;
    const nftExtension = this.extensions.erc721Ext;
    const erc721TestAdapter = this.adapters.erc721TestAdapter;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    const firstOwner = await pixelNFT.ownerOf(tokenId);
    expect(firstOwner).equal(nftOwner);

    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner,
      nftExtension.address,
      tokenId,
      encodeDaoInfo(this.dao.address),
      {
        from: nftOwner,
      }
    );

    // The NFT belongs to the GUILD after it is collected via ERC721 Extension
    let holder = await nftExtension.getNFTOwner(pixelNFT.address, tokenId);
    expect(holder.toLowerCase()).equal(GUILD);

    await erc721TestAdapter.internalTransfer(
      this.dao.address,
      anotherOwner,
      pixelNFT.address,
      tokenId
    );

    // The NFT belongs to the AnotherOwner address after the internal transfer
    expect(await nftExtension.getNFTOwner(pixelNFT.address, tokenId)).equal(
      anotherOwner
    );

    // The actual owner of the NFT is the ERC721 Extension
    expect(await pixelNFT.ownerOf(tokenId)).equal(nftExtension.address);
  });

  it("should be possible to withdraw an NFT if it belongs to the msg.sender", async () => {
    const nftOwner = accounts[2];
    const anotherOwner = accounts[3];
    const pixelNFT = this.testContracts.pixelNFT;
    const nftExtension = this.extensions.erc721Ext;
    const erc721TestAdapter = this.adapters.erc721TestAdapter;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    const firstOwner = await pixelNFT.ownerOf(tokenId);
    expect(firstOwner).equal(nftOwner);

    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      nftOwner,
      nftExtension.address,
      tokenId,
      encodeDaoInfo(this.dao.address),
      {
        from: nftOwner,
      }
    );

    // The NFT belongs to the GUILD after it is collected via ERC721 Extension
    let holder = await nftExtension.getNFTOwner(pixelNFT.address, tokenId);
    expect(holder.toLowerCase()).equal(GUILD);

    await erc721TestAdapter.internalTransfer(
      this.dao.address,
      anotherOwner,
      pixelNFT.address,
      tokenId
    );

    // The NFT belongs to the AnotherOwner address after the internal transfer
    expect(await nftExtension.getNFTOwner(pixelNFT.address, tokenId)).equal(
      anotherOwner
    );

    await erc721TestAdapter.withdraw(
      this.dao.address,
      pixelNFT.address,
      tokenId,
      { from: anotherOwner }
    );

    // After the withdraw the actual owner of the NFT is the AnotherOwner address
    expect(await pixelNFT.ownerOf(tokenId)).equal(anotherOwner);

    // And the NFT metadata is not available in the extension anymore
    await expect(nftExtension.getNFTAddress(0)).to.be.reverted;
    await expect(nftExtension.getNFT(pixelNFT.address, 0)).to.be.reverted;
    expect(
      await nftExtension.getNFTOwner(pixelNFT.address, tokenId)
    ).to.be.equal(ZERO_ADDRESS);
  });

  it("should be possible to collect an NFT if it was minted for the extension address", async () => {
    const pixelNFT = this.testContracts.pixelNFT;
    const nftExtension = this.extensions.erc721Ext;

    // Mint the NFT for the NFT Extension, but it won't set the metadata into the extension
    await pixelNFT.mintPixel(nftExtension.address, 1, 1, { from: daoOwner });

    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;
    expect(await pixelNFT.ownerOf(tokenId)).equal(nftExtension.address);

    // The ERC721 Extension doesn't know about the new NFT, so we need to call the collect function
    let holder = await nftExtension.getNFTOwner(pixelNFT.address, tokenId);
    expect(holder.toLowerCase()).equal(GUILD);
    const nftAddr = await nftExtension.getNFTAddress(0);
    expect(nftAddr).equal(pixelNFT.address);
    const nftId = await nftExtension.getNFT(nftAddr, 0);
    expect(nftId.toString()).equal(tokenId.toString());
  });

  it("should not be possible to execute an internalTransfer if the nftOwner is in jail", async () => {
    const jailedNftOwner = accounts[2];
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    const pixelNFT = this.testContracts.pixelNFT;
    const nftExtension = this.extensions.erc721Ext;
    const erc721TestAdapter = this.adapters.erc721TestAdapter;

    // Add an NFT directly into the ERC721 extension to test the internal transfer
    await pixelNFT.mintPixel(jailedNftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      jailedNftOwner,
      nftExtension.address,
      tokenId,
      encodeDaoInfo(this.dao.address),
      {
        from: jailedNftOwner,
      }
    );

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      jailedNftOwner,
      daoOwner,
      unitPrice,
      UNITS
    );

    // Move the NFT to the jailedNftOwner account before the Guild Kick starts
    await erc721TestAdapter.internalTransfer(
      this.dao.address,
      jailedNftOwner,
      pixelNFT.address,
      tokenId,
      { from: daoOwner }
    );

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

    // Jailed member attempts to move the NFT again, but now it should not be possible
    await expect(
      erc721TestAdapter.internalTransfer(
        this.dao.address,
        daoOwner,
        pixelNFT.address,
        tokenId,
        { from: jailedNftOwner }
      )
    ).to.be.revertedWith("member is jailed");
  });

  it("should be possible to withdraw the NFT even if the nftOwner is in jail", async () => {
    const jailedNftOwner = accounts[2];
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    const pixelNFT = this.testContracts.pixelNFT;
    const nftExtension = this.extensions.erc721Ext;
    const erc721TestAdapter = this.adapters.erc721TestAdapter;

    // Add an NFT directly into the ERC721 extension to test the internal transfer
    await pixelNFT.mintPixel(jailedNftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
      jailedNftOwner,
      nftExtension.address,
      tokenId,
      encodeDaoInfo(this.dao.address),
      {
        from: jailedNftOwner,
      }
    );

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      jailedNftOwner,
      daoOwner,
      unitPrice,
      UNITS
    );

    // Move the NFT to the jailedNftOwner account before the Guild Kick starts
    await erc721TestAdapter.internalTransfer(
      this.dao.address,
      jailedNftOwner,
      pixelNFT.address,
      tokenId,
      { from: daoOwner }
    );

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

    await erc721TestAdapter.withdraw(
      this.dao.address,
      pixelNFT.address,
      tokenId,
      { from: jailedNftOwner }
    );

    // After the withdraw the actual owner of the NFT is the jailedNftOwner address
    expect(await pixelNFT.ownerOf(tokenId)).equal(jailedNftOwner);

    // And the NFT metadata is not available in the extension anymore
    await expect(nftExtension.getNFTAddress(0)).to.be.reverted;
    await expect(nftExtension.getNFT(pixelNFT.address, 0)).to.be.reverted;
    expect(
      await nftExtension.getNFTOwner(pixelNFT.address, tokenId)
    ).to.be.equal(ZERO_ADDRESS);
  });

  it("should not be possible get an NFT in the collection if it is empty", async () => {
    const nftExtension = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    await expect(nftExtension.getNFT(pixelNFT.address, 0)).to.be.revertedWith(
      "revert"
    );
  });

  it("should not be possible to return a NFT without the RETURN permission", async () => {
    const nftExtension = this.extensions.erc721Ext;
    const pixelNFT = this.testContracts.pixelNFT;
    await expect(
      nftExtension.withdrawNFT(
        this.dao.address,
        accounts[1],
        pixelNFT.address,
        1
      )
    ).to.be.revertedWith("erc721::accessDenied");
  });

  it("should not be possible to initialize the extension if it was already initialized", async () => {
    const nftExtension = this.extensions.erc721Ext;
    await expect(
      nftExtension.initialize(this.dao.address, accounts[0])
    ).to.be.revertedWith("erc721::already initialized");
  });

  it("should not be possible to update the collection if the NFT is not owned by the extension", async () => {
    const nftOwner = accounts[2];
    const pixelNFT = this.testContracts.pixelNFT;
    const nftExtension = this.extensions.erc721Ext;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    const firstOwner = await pixelNFT.ownerOf(tokenId);
    expect(firstOwner).equal(nftOwner);

    await expect(
      nftExtension.updateCollection(pixelNFT.address, tokenId)
    ).to.be.revertedWith("update not allowed");
  });

  it("should not get the NFT information if it was sent using transferFrom but the updateCollection was not called", async () => {
    const nftOwner = accounts[2];
    const pixelNFT = this.testContracts.pixelNFT;
    const nftExtension = this.extensions.erc721Ext;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    const firstOwner = await pixelNFT.ownerOf(tokenId);
    expect(firstOwner).equal(nftOwner);

    await pixelNFT.methods["transferFrom(address,address,uint256)"](
      nftOwner,
      nftExtension.address,
      tokenId,
      {
        from: nftOwner,
      }
    );

    // The actual holder of the NFT is the ERC721 Extension
    expect(await pixelNFT.ownerOf(tokenId)).equal(nftExtension.address);

    // but the metadata is not up to date because the `updateCollection` was not called
    await expect(nftExtension.getNFTAddress(0)).to.be.reverted;
    await expect(nftExtension.getNFT(pixelNFT.address, 0)).to.be.reverted;
    expect(
      await nftExtension.getNFTOwner(pixelNFT.address, tokenId)
    ).to.be.equal(ZERO_ADDRESS);
  });

  it("should be possible to collect an NFT that was moved using transferFrom and the collect function was called", async () => {
    const nftOwner = accounts[2];
    const pixelNFT = this.testContracts.pixelNFT;
    const nftExtension = this.extensions.erc721Ext;
    const erc721TestAdapter = this.adapters.erc721TestAdapter;

    await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });
    let pastEvents = await pixelNFT.getPastEvents();
    let { tokenId } = pastEvents[1].returnValues;

    const firstOwner = await pixelNFT.ownerOf(tokenId);
    expect(firstOwner).equal(nftOwner);

    await pixelNFT.methods["transferFrom(address,address,uint256)"](
      nftOwner,
      nftExtension.address,
      tokenId,
      {
        from: nftOwner,
      }
    );

    await erc721TestAdapter.collect(
      this.dao.address,
      pixelNFT.address,
      tokenId
    );

    expect(await pixelNFT.ownerOf(tokenId)).equal(nftExtension.address);
    expect(await nftExtension.getNFTAddress(0)).to.be.equal(pixelNFT.address);
    expect(
      (await nftExtension.getNFT(pixelNFT.address, 0)).toString()
    ).to.be.equal(tokenId.toString());
    expect(
      (await nftExtension.getNFTOwner(pixelNFT.address, tokenId)).toLowerCase()
    ).to.be.equal(GUILD);
  });

  it("should not be possible to send ETH to the extension via receive function", async () => {
    const extension = this.extensions.erc721Ext;
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
    const extension = this.extensions.erc721Ext;
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
