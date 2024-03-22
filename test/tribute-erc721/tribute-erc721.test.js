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
  sha3,
  toBN,
  toWei,
  fromAscii,
  GUILD,
  ZERO_ADDRESS,
  DAI_TOKEN,
  ETH_TOKEN,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  getAccounts,
  web3,
  Manager,
  FinancingContract,
  BankExtension,
  ERC1271Extension,
  NFTExtension,
} = require("../../utils/hardhat-test-util");

const {
  bankExtensionAclFlagsMap,
  daoAccessFlagsMap,
  entryDao,
  entryBank,
} = require("../../utils/access-control-util");

const { extensionsIdsMap } = require("../../utils/dao-ids-util");

const { SigUtilSigner } = require("../../utils/offchain-voting-util");

const chainId = 1337;

const signer = {
  address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
  privKey: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
};

const { ethers, upgrades } = require("hardhat");

const setNftConfigurations = async (
  manager,
  daoAddress,
  transferable,
  collectionSize,
  tokenName,
  tokenSymbol,
  tokenMediaPt1,
  tokenMediaPt2
) => {
  const nonce = (await manager.nonces(daoAddress)).toNumber() + 1;
  const proposal = {
    adapterOrExtensionId: sha3("manager"),
    adapterOrExtensionAddr: ZERO_ADDRESS,
    updateType: 3, // UpdateType 3 = configs
    flags: 0,
    keys: [],
    values: [],
    extensionAddresses: [],
    extensionAclFlags: [],
  };

  const configs = [
    {
      key: sha3("dao-collection.TokenName"),
      numericValue: ethers.utils.formatBytes32String(tokenName),
      addressValue: ZERO_ADDRESS,
      configType: 0,
    },
    {
      key: sha3("dao-collection.TokenSymbol"),
      numericValue: ethers.utils.formatBytes32String(tokenSymbol),
      addressValue: ZERO_ADDRESS,
      configType: 0,
    },
    {
      key: sha3("dao-collection.TokenMediaPt1"),
      numericValue: ethers.utils.formatBytes32String(tokenMediaPt1),
      addressValue: ZERO_ADDRESS,
      configType: 0,
    },
    {
      key: sha3("dao-collection.TokenMediaPt2"),
      numericValue: ethers.utils.formatBytes32String(tokenMediaPt2),
      addressValue: ZERO_ADDRESS,
      configType: 0,
    },
    {
      key: sha3("dao-collection.Transferable"),
      numericValue: transferable,
      addressValue: ZERO_ADDRESS,
      configType: 0, //NUMERIC
    },
    {
      key: sha3("dao-collection.CollectionSize"),
      numericValue: collectionSize,
      addressValue: ZERO_ADDRESS,
      configType: 0,
    },
    {
      key: sha3("dao-collection.signerAddress"),
      numericValue: 0,
      addressValue: signer.address,
      configType: 1,
    },
  ];

  const signature = generateManagerCouponSignature({
    daoAddress,
    managerAddress: manager.address,
    chainId,
    proposal,
    configs,
    nonce: nonce.toString(),
  });

  await manager.processSignedProposal(
    daoAddress,
    proposal,
    configs,
    nonce,
    signature
  );
};

const TOKEN_MEDIA = "QmdXQLJWkv27YFLxJ33piMBpxmL6236TdrsD1Lh8n33WXU";
const TOKEN_URI = `ipfs://${TOKEN_MEDIA}`;
const COLLECTION_NAME = "Test DAO NFT";
const COLLECTION_SYMBOL = "TDN";

const deployAndConfigureCollection = async (
  manager,
  daoAddress,
  transferable,
  collectionSize
) => {
  const TributeERC721 = await hre.ethers.getContractFactory("TributeERC721");
  const proxy = await upgrades.deployProxy(TributeERC721, [daoAddress]);
  await proxy.deployed();
  await setNftConfigurations(
    manager,
    daoAddress,
    transferable,
    collectionSize,
    COLLECTION_NAME,
    COLLECTION_SYMBOL,
    TOKEN_MEDIA.slice(0, 23),
    TOKEN_MEDIA.slice(23)
  );

  return { proxy };
};

// We are not using TributeERC721 contract anymore.
describe.skip("nft test", () => {
  let accounts, daoOwner, daoAddress;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];

    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
      managerSignerAddress: signer.address,
    });
    daoAddress = dao.address;
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(this.snapshotId);
    this.snapshotId = await takeChainSnapshot();
  });

  it("Configured with name and symbol in DAO", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );

    const name = await proxy.name();
    const symbol = await proxy.symbol();

    expect(name).to.equal(COLLECTION_NAME);
    expect(symbol).to.equal(COLLECTION_SYMBOL);
  });

  it("Can upgrade proxy", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );

    const originalImplementationAddr =
      await upgrades.erc1967.getImplementationAddress(proxy.address);

    const TributeERC721V2 = await hre.ethers.getContractFactory(
      "TributeERC721V2"
    );
    await upgrades.upgradeProxy(proxy.address, TributeERC721V2);

    const upgradedImplementationAddr =
      await upgrades.erc1967.getImplementationAddress(proxy.address);

    expect(originalImplementationAddr !== upgradedImplementationAddr).to.be
      .true;
  });

  it("Can mint an NFT with a valid signature", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];
    const signature = generateNFTCouponSignature({
      collectionAddress,
      owner,
      nonce,
      chainId,
      daoAddress,
    });

    await proxy.mint(owner, nonce, signature);

    expect((await proxy.balanceOf(owner)).toNumber()).to.equal(1);
  });

  it("Can mint an NFT with a valid signature after proxy has been upgraded", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];
    const signature = generateNFTCouponSignature({
      collectionAddress,
      owner,
      nonce,
      chainId,
      daoAddress,
    });

    const TributeERC721V2 = await hre.ethers.getContractFactory(
      "TributeERC721V2"
    );
    await upgrades.upgradeProxy(proxy.address, TributeERC721V2);
    await proxy.mint(owner, nonce, signature);

    expect((await proxy.balanceOf(owner)).toNumber()).to.equal(1);
  });

  it("Ownership persists upgrade", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];
    const signature = generateNFTCouponSignature({
      collectionAddress,
      owner,
      nonce,
      chainId,
      daoAddress,
    });
    await proxy.mint(owner, nonce, signature);

    const TributeERC721V2 = await hre.ethers.getContractFactory(
      "TributeERC721V2"
    );
    await upgrades.upgradeProxy(proxy.address, TributeERC721V2);

    expect((await proxy.balanceOf(owner)).toNumber()).to.equal(1);
  });

  it("Cannot mint with an invalid signature", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];
    const signature = generateNFTCouponSignature({
      collectionAddress,
      owner,
      nonce,
      chainId,
      daoAddress,
    });
    const sigForWrongCollection = generateNFTCouponSignature({
      collectionAddress: ZERO_ADDRESS,
      owner,
      nonce,
      chainId,
      daoAddress,
    });

    await expect(
      proxy.mint(owner, nonce, sigForWrongCollection)
    ).to.be.revertedWith("invalid sig"); // Incorrect collection address.
    await expect(proxy.mint(owner, 12, signature)).to.be.revertedWith(
      "invalid sig"
    ); // Nonce used in sig and tx differ.
    await expect(proxy.mint(ZERO_ADDRESS, nonce, signature)).to.be.revertedWith(
      "invalid sig"
    ); // Incorrect owner.
  });

  it("Cannot replay a mint", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];
    const signature = generateNFTCouponSignature({
      collectionAddress,
      owner,
      nonce,
      chainId,
      daoAddress,
    });
    await proxy.mint(owner, nonce, signature);

    await expect(proxy.mint(owner, nonce, signature)).to.be.revertedWith(
      "ERC721: token already minted"
    );
  });

  it("Cannot replay a mint after upgrade", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];
    const signature = generateNFTCouponSignature({
      collectionAddress,
      owner,
      nonce,
      chainId,
      daoAddress,
    });
    await proxy.mint(owner, nonce, signature);

    const TributeERC721V2 = await hre.ethers.getContractFactory(
      "TributeERC721V2"
    );
    await upgrades.upgradeProxy(proxy.address, TributeERC721V2);

    await expect(proxy.mint(owner, nonce, signature)).to.be.revertedWith(
      "ERC721: token already minted"
    );
  });

  it("Cannot mint if collection size is reached", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      1
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];
    const signature1 = generateNFTCouponSignature({
      collectionAddress,
      owner,
      nonce,
      chainId,
      daoAddress,
    });
    const signature2 = generateNFTCouponSignature({
      collectionAddress,
      owner,
      nonce: nonce + 1,
      chainId,
      daoAddress,
    });
    await proxy.mint(owner, nonce, signature1);

    await expect(proxy.mint(owner, nonce + 1, signature2)).to.be.revertedWith(
      "Collection fully minted"
    );
  });

  it("Can transfer token when transfer is enabled", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];
    const signature = generateNFTCouponSignature({
      collectionAddress,
      owner,
      nonce,
      chainId,
      daoAddress,
    });
    await proxy.mint(owner, nonce, signature);

    expect((await proxy.balanceOf(owner)).toNumber()).to.equal(1);
    await proxy["safeTransferFrom(address,address,uint256)"](
      owner,
      accounts[1],
      1
    );

    expect((await proxy.balanceOf(owner)).toNumber()).to.equal(0);
    expect((await proxy.balanceOf(accounts[1])).toNumber()).to.equal(1);

    await proxy
      .connect((await ethers.getSigners())[1])
      ["transferFrom(address,address,uint256)"](accounts[1], owner, 1);

    expect((await proxy.balanceOf(owner)).toNumber()).to.equal(1);
  });

  it("Cannot transfer token when transfer is disabled", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      0,
      100
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];
    const signature = generateNFTCouponSignature({
      collectionAddress,
      owner,
      nonce,
      chainId,
      daoAddress,
    });
    await proxy.mint(owner, nonce, signature);

    await expect(
      proxy["safeTransferFrom(address,address,uint256)"](owner, accounts[1], 1)
    ).to.be.revertedWith("Collection is not transferable");
    await expect(
      proxy["transferFrom(address,address,uint256)"](owner, accounts[1], 1)
    ).to.be.revertedWith("Collection is not transferable");
  });

  it("getPriorAmount", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];

    let blockNumber = (await hre.ethers.provider.getBlock("latest")).number;

    expect(
      (await proxy.getPriorAmount(owner, blockNumber - 1)).toNumber()
    ).to.equal(0);

    await proxy.mint(
      owner,
      nonce,
      generateNFTCouponSignature({
        collectionAddress,
        owner,
        nonce,
        chainId,
        daoAddress,
      })
    );
    await proxy.mint(
      owner,
      nonce + 1,
      generateNFTCouponSignature({
        collectionAddress,
        owner,
        nonce: nonce + 1,
        chainId,
        daoAddress,
      })
    );

    expect(
      (await proxy.getPriorAmount(owner, blockNumber + 1)).toNumber()
    ).to.equal(1);
    expect((await proxy.getPriorAmount(owner, 0)).toNumber()).to.equal(0);

    await proxy.mint(
      owner,
      nonce + 2,
      generateNFTCouponSignature({
        collectionAddress,
        owner,
        nonce: nonce + 2,
        chainId,
        daoAddress,
      })
    );

    expect(
      (await proxy.getPriorAmount(owner, blockNumber + 2)).toNumber()
    ).to.equal(2);
  });

  it("tokenURI returns baseURI for every token", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];
    await proxy.mint(
      owner,
      nonce,
      generateNFTCouponSignature({
        collectionAddress,
        owner,
        nonce,
        chainId,
        daoAddress,
      })
    );
    await proxy.mint(
      owner,
      nonce + 1,
      generateNFTCouponSignature({
        collectionAddress,
        owner,
        nonce: nonce + 1,
        chainId,
        daoAddress,
      })
    );
    const [uri1, uri2] = await Promise.all([
      proxy.tokenURI(1),
      proxy.tokenURI(2),
    ]);

    expect(uri1).to.equal(uri2);
  });

  it("tokenURI correctly resolves tokenMedia parts to ipfs cid", async () => {
    const { proxy } = await deployAndConfigureCollection(
      this.adapters.manager,
      daoAddress,
      1,
      100
    );
    const [collectionAddress, owner, nonce] = [proxy.address, accounts[0], 1];
    await proxy.mint(
      owner,
      nonce,
      generateNFTCouponSignature({
        collectionAddress,
        owner,
        nonce,
        chainId,
        daoAddress,
      })
    );

    const uri = await proxy.tokenURI(1);

    expect(uri).to.equal(TOKEN_URI);
  });
});

const generateManagerCouponSignature = ({
  daoAddress,
  managerAddress,
  proposal,
  configs,
  nonce,
  chainId,
}) => {
  const signerUtil = SigUtilSigner(signer.privKey);
  const messageData = {
    type: "manager",
    daoAddress,
    proposal,
    configs,
    nonce,
  };
  const signature = signerUtil(
    messageData,
    daoAddress,
    managerAddress,
    chainId
  );

  return signature;
};

const generateNFTCouponSignature = ({
  collectionAddress,
  owner,
  nonce,
  chainId,
  daoAddress,
}) => {
  const signerUtil = SigUtilSigner(signer.privKey);
  const messageData = {
    type: "coupon-nft",
    owner,
    nonce,
  };
  const signature = signerUtil(
    messageData,
    daoAddress,
    collectionAddress,
    chainId
  );

  return signature;
};
