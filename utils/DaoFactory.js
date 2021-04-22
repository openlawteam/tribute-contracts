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
  web3,
  contract,
  accounts,
  provider,
} = require("@openzeppelin/test-environment");

const { expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const Web3Utils = require("web3-utils");
const sha3 = Web3Utils.sha3;
const toBN = Web3Utils.toBN;
const toWei = Web3Utils.toWei;
const fromUtf8 = Web3Utils.fromUtf8;
const hexToBytes = Web3Utils.hexToBytes;
const toAscii = Web3Utils.toAscii;
const fromAscii = Web3Utils.fromAscii;
const toUtf8 = Web3Utils.toUtf8;

const GUILD = "0x000000000000000000000000000000000000dead";
const TOTAL = "0x000000000000000000000000000000000000babe";
const ESCROW = "0x0000000000000000000000000000000000004bec";
const SHARES = "0x00000000000000000000000000000000000FF1CE";
const LOOT = "0x00000000000000000000000000000000B105F00D";
const ETH_TOKEN = "0x0000000000000000000000000000000000000000";
const DAI_TOKEN = "0x95b58a6bff3d14b7db2f5cb5f0ad413dc2940658";

const numberOfShares = toBN("1000000000000000");
const sharePrice = toBN(toWei("120", "finney"));
const remaining = sharePrice.sub(toBN("50000000000000"));
const maximumChunks = toBN("11");

function getContractFromTruffle(c) {
  return artifacts.require(c);
}

function getContractFromOpenZepplin(c) {
  return contract.fromArtifact(c.substring(c.lastIndexOf("/") + 1));
}

// Test Util Contracts
let OLTokenName = "./test/OLToken";
let TestToken1Name = "./test/TestToken1";
let TestToken2Name = "./test/TestToken2";
let TestFairShareCalcName = "./test/TestFairShareCalc";
let PixelNFTName = "./test/PixelNFT";

// DAO Contracts
let DaoFactoryName = "./core/DaoFactory";
let DaoRegistryName = "./core/DaoRegistry";
let NFTCollectionFactoryName = "./extensions/NFTCollectionFactory";
let BankFactoryName = "./extensions/bank/BankFactory";
let MulticallName = "./util/Multicall";

// Extensions
let NFTExtensionName = "./extensions/nft/NFTExtension";
let BankExtensionName = "./extensions/bank/BankExtension";

// Config Adapters
let DaoRegistryAdapterContractName = "./adapters/DaoRegistryAdapterContract";
let BankAdapterContractName = "./adapters/BankAdapterContract";
let NFTAdapterContractName = "./adapters/NFTAdapterContract";
let ConfigurationContractName = "./adapter/ConfigurationContract";
let ManagingContractName = "./adapter/ManagingContract";

// Voting Adapters
let VotingContractName = "./adapters/VotingContract";
let SnapshotProposalContractName = "./adapters/voting/SnapshotProposalContract";
let OffchainVotingContractName = "./adapters/voting/OffchainVotingContract";
let KickBadReporterAdapterName = "./adapters/voting/KickBadReporterAdapter";
let BatchVotingContractName = "./adapters/voting/BatchVotingContract";

// Withdraw Adapters
let RagequitContractName = "./adapters/RagequitContract";
let GuildKickContractName = "./adapters/GuildKickContract";
let DistributeContractName = "./adapters/DistributeContract";

// Funding/Onboarding Adapters
let FinancingContractName = "./adapter/FinancingContract";
let OnboardingContractName = "./adapters/OnboardingContract";
let CouponOnboardingContractName = "./adapters/CouponOnboardingContract";
let TributeContractName = "./adapters/TributeContract";
let TributeNFTContractName = "./adapters/TributeNFTContract";

const networks = [
  {
    name: "ganache",
    chainId: 1337,
  },
  {
    name: "rinkeby",
    chainId: 4,
  },
  {
    name: "rinkeby-fork",
    chainId: 4,
  },
  {
    name: "test",
    chainId: 1,
  },
  {
    name: "coverage",
    chainId: 1,
  },
];

const getNetworkDetails = (name) => {
  return networks.find((n) => n.name === name);
};

const deployDefaultDao = async (owner) => {
  return await deployDao(null, { owner });
};

const deployDefaultNFTDao = async (owner) => {
  const { dao, adapters, extensions, testContracts } = await deployDao(null, {
    owner,
    deployTestTokens: true,
    finalize: false,
  });

  await dao.finalizeDao({ from: owner });
  return {
    dao: dao,
    adapters: adapters,
    extensions: extensions,
    testContracts: testContracts,
  };
};

const deployDaoWithOffchainVoting = async (owner, newMember) => {
  const {
    dao,
    adapters,
    extensions,
    testContracts,
    votingHelpers,
  } = await deployDao(null, {
    owner,
    offchainVoting: true,
    deployTestTokens: true,
    finalize: false,
  });

  await dao.potentialNewMember(newMember, {
    from: owner,
  });
  await extensions.bank.addToBalance(newMember, SHARES, 1, {
    from: owner,
  });

  await dao.finalizeDao({ from: owner });

  adapters["voting"] = votingHelpers.offchainVoting;

  return {
    dao: dao,
    adapters: adapters,
    extensions: extensions,
    testContracts: testContracts,
    votingHelpers: votingHelpers,
  };
};

const deployDaoWithBatchVoting = async (owner, newMember) => {
  const { dao, adapters, extensions, votingHelpers } = await deployDao(null, {
    owner,
    deployTestTokens: false,
    batchVoting: true,
    finalize: false,
  });

  await dao.potentialNewMember(newMember, {
    from: owner,
  });

  await extensions.bank.addToBalance(newMember, SHARES, 1, {
    from: owner,
  });

  await dao.finalizeDao({ from: owner });

  adapters["voting"] = adapters.batchVoting;

  return {
    dao: dao,
    adapters: adapters,
    extensions: extensions,
    votingHelpers: votingHelpers,
  };
};

const deployDao = async (deployer, options) => {
  const owner = options.owner;
  const unitPrice = options.unitPrice || sharePrice;
  const nbShares = options.nbShares || numberOfShares;
  const votingPeriod = options.votingPeriod || 10;
  const gracePeriod = options.gracePeriod || 1;
  const tokenAddr = options.tokenAddr || ETH_TOKEN;
  const maxChunks = options.maximumChunks || maximumChunks;
  const isOffchainVoting = !!options.offchainVoting;
  const isBatchVoting = !!options.batchVoting;
  const chainId = options.chainId || 1;
  const deployTestTokens = !!options.deployTestTokens;
  const maxExternalTokens = options.maxExternalTokens || 100;
  const finalize = options.finalize === undefined || !!options.finalize;
  const couponCreatorAddress =
    options.couponCreatorAddress ||
    "0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8";
  const daoName = options.daoName || "test-dao";

  let daoRegistry;
  let bankFactory;
  let nftFactory;

  let DaoRegistry,
    BankExtension,
    BankFactory,
    NFTExtension,
    NFTCollectionFactory;

  if (deployer) {
    DaoRegistry = getContractFromTruffle(DaoRegistryName);
    BankExtension = getContractFromTruffle(BankExtensionName);
    BankFactory = getContractFromTruffle(BankFactoryName);
    NFTExtension = getContractFromTruffle(NFTExtensionName);
    NFTCollectionFactory = getContractFromTruffle(NFTCollectionFactoryName);

    await deployer.deploy(DaoRegistry);
    daoRegistry = await DaoRegistry.deployed();

    await deployer.deploy(BankExtension);
    const bankExt = await BankExtension.deployed();
    await deployer.deploy(BankFactory, bankExt.address);
    bankFactory = await BankFactory.deployed();

    await deployer.deploy(NFTExtension);
    const nftExt = await NFTExtension.deployed();
    await deployer.deploy(NFTCollectionFactory, nftExt.address);
    nftFactory = await NFTCollectionFactory.deployed();
  } else {
    DaoRegistry = getContractFromOpenZepplin(DaoRegistryName);
    BankExtension = getContractFromOpenZepplin(BankExtensionName);
    BankFactory = getContractFromOpenZepplin(BankFactoryName);
    NFTExtension = getContractFromOpenZepplin(NFTExtensionName);
    NFTCollectionFactory = getContractFromOpenZepplin(NFTCollectionFactoryName);
    daoRegistry = await DaoRegistry.new();

    const identityBank = await BankExtension.new();
    bankFactory = await BankFactory.new(identityBank.address);

    const nftExt = await NFTExtension.new();
    nftFactory = await NFTCollectionFactory.new(nftExt.address);
  }

  const { dao, daoFactory } = await cloneDao(
    deployer,
    daoRegistry,
    owner,
    daoName
  );

  await bankFactory.createBank(maxExternalTokens);
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await bankFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }

  const { bankAddress } = pastEvent.returnValues;
  const bankExtension = await BankExtension.at(bankAddress);
  const creator = await dao.getMemberAddress(1);
  await dao.addExtension(sha3("bank"), bankExtension.address, creator);

  await nftFactory.createNFTCollection();
  pastEvent = undefined;
  while (pastEvent === undefined) {
    let pastEvents = await nftFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }

  const { nftCollAddress } = pastEvent.returnValues;
  const nftExtension = await NFTExtension.at(nftCollAddress);
  await dao.addExtension(sha3("nft"), nftExtension.address, creator);

  const extensions = { bank: bankExtension, nft: nftExtension };

  const { adapters } = await addDefaultAdapters(
    deployer,
    dao,
    unitPrice,
    nbShares,
    votingPeriod,
    gracePeriod,
    tokenAddr,
    maxChunks,
    daoFactory,
    null,
    couponCreatorAddress
  );

  const votingAddress = await dao.getAdapterAddress(sha3("voting"));
  const votingHelpers = {
    snapshotProposalContract: null,
    handleBadReporterAdapter: null,
    offchainVoting: null,
    batchVoting: null,
  };

  if (isOffchainVoting) {
    const {
      offchainVoting,
      handleBadReporterAdapter,
      snapshotProposalContract,
    } = await configureOffchainVoting(
      owner,
      dao,
      daoFactory,
      chainId,
      votingAddress,
      bankAddress,
      votingPeriod,
      gracePeriod,
      deployer
    );
    votingHelpers.offchainVoting = offchainVoting;
    votingHelpers.handleBadReporterAdapter = handleBadReporterAdapter;
    votingHelpers.snapshotProposalContract = snapshotProposalContract;
  } else if (isBatchVoting) {
    const {
      batchVoting,
      snapshotProposalContract,
    } = await configureBatchVoting(
      owner,
      dao,
      daoFactory,
      chainId,
      votingPeriod,
      gracePeriod,
      deployer
    );
    votingHelpers.batchVoting = batchVoting;
    votingHelpers.snapshotProposalContract = snapshotProposalContract;
  }

  // deploy test token contracts (for testing convenience)
  const testContracts = {
    oltToken: null,
    testToken1: null,
    testToken2: null,
    multicall: null,
    pixelNFT: null,
  };

  if (deployTestTokens) {
    if (deployer) {
      let OLToken = getContractFromTruffle(OLTokenName);
      let TestToken1 = getContractFromTruffle(TestToken1Name);
      let TestToken2 = getContractFromTruffle(TestToken2Name);
      let Multicall = getContractFromTruffle(MulticallName);
      let PixelNFT = getContractFromTruffle(PixelNFTName);
      testContracts.oltToken = await deployer.deploy(
        OLToken,
        toBN("1000000000000000000000000")
      );
      testContracts.testToken1 = await deployer.deploy(TestToken1, 1000000);
      testContracts.testToken2 = await deployer.deploy(TestToken2, 1000000);
      testContracts.multicall = await deployer.deploy(Multicall);
      testContracts.pixelNFT = await deployer.deploy(PixelNFT, 100);
    } else {
      let OLToken = getContractFromOpenZepplin(OLTokenName);
      let TestToken1 = getContractFromOpenZepplin(TestToken1Name);
      let TestToken2 = getContractFromOpenZepplin(TestToken2Name);
      let Multicall = getContractFromOpenZepplin(MulticallName);
      let PixelNFT = getContractFromOpenZepplin(PixelNFTName);
      testContracts.oltToken = await OLToken.new(
        toBN("1000000000000000000000000")
      );
      testContracts.testToken1 = await TestToken1.new(1000000);
      testContracts.testToken2 = await TestToken2.new(1000000);
      testContracts.multicall = await Multicall.new();
      testContracts.pixelNFT = await PixelNFT.new(100);
    }
  }

  if (finalize) {
    await dao.finalizeDao({ from: owner });
  }

  return {
    dao: dao,
    adapters: adapters,
    extensions: extensions,
    testContracts: testContracts,
    votingHelpers: votingHelpers,
  };
};

const prepareAdapters = async (deployer) => {
  let voting;
  let configuration;
  let ragequit;
  let managing;
  let financing;
  let onboarding;
  let guildkick;
  let daoRegistryAdapter;
  let bankAdapter;
  let nftAdapter;
  let couponOnboarding;
  let tribute;
  let distribute;
  let tributeNFT;

  if (deployer) {
    let VotingContract = getContractFromTruffle(VotingContractName);
    let ConfigurationContract = getContractFromTruffle(
      ConfigurationContractName
    );
    let RagequitContract = getContractFromTruffle(RagequitContractName);
    let ManagingContract = getContractFromTruffle(ManagingContractName);
    let FinancingContract = getContractFromTruffle(FinancingContractName);
    let OnboardingContract = getContractFromTruffle(OnboardingContractName);
    let GuildKickContract = getContractFromTruffle(GuildKickContractName);
    let DaoRegistryAdapterContract = getContractFromTruffle(
      DaoRegistryAdapterContractName
    );
    let BankAdapterContract = getContractFromTruffle(BankAdapterContractName);
    let NFTAdapterContract = getContractFromTruffle(NFTAdapterContractName);
    let CouponOnboardingContract = getContractFromTruffle(
      CouponOnboardingContractName
    );
    let TributeContract = getContractFromTruffle(TributeContractName);
    let DistributeContract = getContractFromTruffle(DistributeContractName);
    let TributeNFTContract = getContractFromTruffle(TributeNFTContractName);

    await deployer.deploy(VotingContract);
    await deployer.deploy(ConfigurationContract);
    await deployer.deploy(RagequitContract);
    await deployer.deploy(ManagingContract);
    await deployer.deploy(FinancingContract);
    await deployer.deploy(OnboardingContract);
    await deployer.deploy(GuildKickContract);
    await deployer.deploy(DaoRegistryAdapterContract);
    await deployer.deploy(BankAdapterContract);
    await deployer.deploy(NFTAdapterContract);
    await deployer.deploy(CouponOnboardingContract, 1);
    await deployer.deploy(TributeContract);
    await deployer.deploy(DistributeContract);
    await deployer.deploy(TributeNFTContract);

    voting = await VotingContract.deployed();
    configuration = await ConfigurationContract.deployed();
    ragequit = await RagequitContract.deployed();
    managing = await ManagingContract.deployed();
    financing = await FinancingContract.deployed();
    onboarding = await OnboardingContract.deployed();
    guildkick = await GuildKickContract.deployed();
    daoRegistryAdapter = await DaoRegistryAdapterContract.deployed();
    bankAdapter = await BankAdapterContract.deployed();
    nftAdapter = await NFTAdapterContract.deployed();
    couponOnboarding = await CouponOnboardingContract.deployed();
    tribute = await TributeContract.deployed();
    distribute = await DistributeContract.deployed();
    tributeNFT = await TributeNFTContract.deployed();
  } else {
    let VotingContract = getContractFromOpenZepplin(VotingContractName);
    let ConfigurationContract = getContractFromOpenZepplin(
      ConfigurationContractName
    );
    let RagequitContract = getContractFromOpenZepplin(RagequitContractName);
    let ManagingContract = getContractFromOpenZepplin(ManagingContractName);
    let FinancingContract = getContractFromOpenZepplin(FinancingContractName);
    let OnboardingContract = getContractFromOpenZepplin(OnboardingContractName);
    let GuildKickContract = getContractFromOpenZepplin(GuildKickContractName);
    let DaoRegistryAdapterContract = getContractFromOpenZepplin(
      DaoRegistryAdapterContractName
    );
    let BankAdapterContract = getContractFromOpenZepplin(
      BankAdapterContractName
    );
    let NFTAdapterContract = getContractFromOpenZepplin(NFTAdapterContractName);
    let CouponOnboardingContract = getContractFromOpenZepplin(
      CouponOnboardingContractName
    );
    let TributeContract = getContractFromOpenZepplin(TributeContractName);
    let DistributeContract = getContractFromOpenZepplin(DistributeContractName);
    let TributeNFTContract = getContractFromOpenZepplin(TributeNFTContractName);

    voting = await VotingContract.new();
    configuration = await ConfigurationContract.new();
    ragequit = await RagequitContract.new();
    managing = await ManagingContract.new();
    financing = await FinancingContract.new();
    onboarding = await OnboardingContract.new();
    guildkick = await GuildKickContract.new();
    daoRegistryAdapter = await DaoRegistryAdapterContract.new();
    bankAdapter = await BankAdapterContract.new();
    nftAdapter = await NFTAdapterContract.new();
    couponOnboarding = await CouponOnboardingContract.new(1);
    tribute = await TributeContract.new();
    distribute = await DistributeContract.new();
    tributeNFT = await TributeNFTContract.new();
  }

  return {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    daoRegistryAdapter,
    bankAdapter,
    nftAdapter,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT,
  };
};

const createIdentityDao = async (owner) => {
  let DaoRegistry = getContractFromOpenZepplin(DaoRegistryName);
  return await DaoRegistry.new({
    from: owner,
    gasPrice: toBN("0"),
  });
};

const addDefaultAdapters = async (
  deployer,
  dao,
  unitPrice = sharePrice,
  nbShares = numberOfShares,
  votingPeriod = 10,
  gracePeriod = 1,
  tokenAddr = ETH_TOKEN,
  maxChunks = maximumChunks,
  daoFactory,
  nftAddr,
  couponCreatorAddress
) => {
  const {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    daoRegistryAdapter,
    bankAdapter,
    nftAdapter,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT,
  } = await prepareAdapters(deployer);

  let BankExtension, NFTExtension;

  if (deployer) {
    BankExtension = getContractFromTruffle(BankExtensionName);
    NFTExtension = getContractFromTruffle(NFTExtensionName);
  } else {
    BankExtension = getContractFromOpenZepplin(BankExtensionName);
    NFTExtension = getContractFromOpenZepplin(NFTExtensionName);
  }

  const bankAddress = await dao.getExtensionAddress(sha3("bank"));
  const bankExtension = await BankExtension.at(bankAddress);

  const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
  const nftExtension = await NFTExtension.at(nftExtAddr);

  await configureDao({
    daoFactory,
    dao,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    daoRegistryAdapter,
    bankAdapter,
    nftAdapter,
    voting,
    configuration,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT,
    unitPrice,
    nbShares,
    votingPeriod,
    gracePeriod,
    tokenAddr,
    maxChunks,
    nftAddr,
    couponCreatorAddress,
    bankExtension,
    nftExtension,
  });

  return {
    dao,
    adapters: {
      voting,
      configuration,
      ragequit,
      guildkick,
      managing,
      financing,
      onboarding,
      daoRegistryAdapter,
      bankAdapter,
      nftAdapter,
      couponOnboarding,
      tribute,
      distribute,
      tributeNFT,
    },
  };
};

const configureDao = async ({
  daoFactory,
  dao,
  ragequit,
  guildkick,
  managing,
  financing,
  onboarding,
  daoRegistryAdapter,
  bankAdapter,
  bankExtension,
  nftExtension,
  nftAdapter,
  voting,
  configuration,
  couponOnboarding,
  tribute,
  distribute,
  tributeNFT,
  unitPrice,
  nbShares,
  votingPeriod,
  gracePeriod,
  tokenAddr,
  maxChunks,
  couponCreatorAddress,
}) => {
  await daoFactory.addAdapters(dao.address, [
    entryDao("voting", voting, {}),
    entryDao("configuration", configuration, {
      SUBMIT_PROPOSAL: true,
      SET_CONFIGURATION: true,
    }),
    entryDao("ragequit", ragequit, {}),
    entryDao("guildkick", guildkick, {
      SUBMIT_PROPOSAL: true,
    }),
    entryDao("managing", managing, {
      SUBMIT_PROPOSAL: true,
      REPLACE_ADAPTER: true,
    }),
    entryDao("financing", financing, {
      SUBMIT_PROPOSAL: true,
    }),
    entryDao("onboarding", onboarding, {
      SUBMIT_PROPOSAL: true,
      UPDATE_DELEGATE_KEY: true,
      NEW_MEMBER: true,
    }),
    entryDao("coupon-onboarding", couponOnboarding, {
      SUBMIT_PROPOSAL: false,
      ADD_TO_BALANCE: true,
      UPDATE_DELEGATE_KEY: false,
      NEW_MEMBER: true,
    }),
    entryDao("daoRegistry", daoRegistryAdapter, {
      UPDATE_DELEGATE_KEY: true,
    }),
    entryDao("nft", nftAdapter, {}),
    entryDao("bank", bankAdapter, {}),
    entryDao("tribute", tribute, {
      SUBMIT_PROPOSAL: true,
      NEW_MEMBER: true,
    }),
    entryDao("tribute-nft", tributeNFT, {
      SUBMIT_PROPOSAL: true,
      NEW_MEMBER: true,
    }),
    entryDao("distribute", distribute, {
      SUBMIT_PROPOSAL: true,
    }),
  ]);

  await daoFactory.configureExtension(dao.address, bankExtension.address, [
    entryBank(ragequit, {
      INTERNAL_TRANSFER: true,
      SUB_FROM_BALANCE: true,
      ADD_TO_BALANCE: true,
    }),
    entryBank(guildkick, {
      INTERNAL_TRANSFER: true,
      SUB_FROM_BALANCE: true,
      ADD_TO_BALANCE: true,
    }),
    entryBank(bankAdapter, {
      WITHDRAW: true,
      SUB_FROM_BALANCE: true,
      UPDATE_TOKEN: true,
    }),
    entryBank(onboarding, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
    }),
    entryBank(couponOnboarding, {
      ADD_TO_BALANCE: true,
    }),
    entryBank(financing, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
    }),
    entryBank(tribute, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
      REGISTER_NEW_TOKEN: true,
    }),
    entryBank(distribute, {
      INTERNAL_TRANSFER: true,
    }),
    entryBank(tributeNFT, {
      ADD_TO_BALANCE: true,
    }),
  ]);

  await daoFactory.configureExtension(dao.address, nftExtension.address, [
    entryNft(tributeNFT, {
      COLLECT_NFT: true,
    }),
    entryNft(nftAdapter, {
      COLLECT_NFT: true,
    }),
  ]);

  await onboarding.configureDao(
    dao.address,
    SHARES,
    unitPrice,
    nbShares,
    maxChunks,
    tokenAddr
  );

  await onboarding.configureDao(
    dao.address,
    LOOT,
    unitPrice,
    nbShares,
    maxChunks,
    tokenAddr
  );
  await couponOnboarding.configureDao(
    dao.address,
    couponCreatorAddress,
    SHARES
  );

  await voting.configureDao(dao.address, votingPeriod, gracePeriod);
  await tribute.configureDao(dao.address, SHARES);
  await tribute.configureDao(dao.address, LOOT);
  await tributeNFT.configureDao(dao.address);
};

const cloneDao = async (deployer, identityDao, owner, name = "test-dao") => {
  // The owner of the DAO is always the 1st unlocked address if none is provided
  let txArgs = owner ? { from: owner } : undefined;

  let daoFactory, DaoRegistry;
  if (deployer) {
    let DaoFactory = getContractFromTruffle(DaoFactoryName);
    DaoRegistry = getContractFromTruffle(DaoRegistryName);
    await deployer.deploy(DaoFactory, identityDao.address);
    daoFactory = await DaoFactory.deployed();
  } else {
    let DaoFactory = getContractFromOpenZepplin(DaoFactoryName);
    DaoRegistry = getContractFromOpenZepplin(DaoRegistryName);
    daoFactory = await DaoFactory.new(identityDao.address, txArgs);
  }
  if (txArgs) {
    await daoFactory.createDao(name, ETH_TOKEN, txArgs);
  } else {
    await daoFactory.createDao(name, ETH_TOKEN);
  }

  // checking the gas usaged to clone a contract
  let pastEvents = await daoFactory.getPastEvents();
  let { _address, _name } = pastEvents[0].returnValues;
  let newDao = await DaoRegistry.at(_address);
  return { dao: newDao, daoFactory, daoName: _name };
};

const advanceTime = async (time) => {
  await new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [time],
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    );
  });

  await new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    );
  });

  return true;
};

const entryNft = (contract, flags) => {
  const values = [
    flags.WITHDRAW_NFT,
    flags.COLLECT_NFT,
    flags.INTERNAL_TRANSFER,
  ];

  const acl = entry(values);

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: acl,
  };
};

const entryBank = (contract, flags) => {
  const values = [
    flags.ADD_TO_BALANCE,
    flags.SUB_FROM_BALANCE,
    flags.INTERNAL_TRANSFER,
    flags.WITHDRAW,
    flags.EXECUTE,
    flags.REGISTER_NEW_TOKEN,
    flags.REGISTER_NEW_INTERNAL_TOKEN,
  ];

  const acl = entry(values);

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: acl,
  };
};

const entryDao = (name, contract, flags) => {
  const values = [
    flags.REPLACE_ADAPTER,
    flags.SUBMIT_PROPOSAL,
    flags.UPDATE_DELEGATE_KEY,
    flags.SET_CONFIGURATION,
    flags.ADD_EXTENSION,
    flags.REMOVE_EXTENSION,
    flags.NEW_MEMBER,
  ];

  const acl = entry(values);

  return {
    id: sha3(name),
    addr: contract.address,
    flags: acl,
  };
};

const entry = (values) => {
  return values
    .map((v, idx) => (v === true ? 2 ** idx : 0))
    .reduce((a, b) => a + b);
};

const takeChainSnapshot = async () => {
  return await new Promise((resolve, reject) =>
    provider.send(
      {
        jsonrpc: "2.0",
        method: "evm_snapshot",
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        let snapshotId = result.result; // {"id":X,"jsonrpc":"2.0","result":"0x..."}
        return resolve(snapshotId);
      }
    )
  );
};

const revertChainSnapshot = async (snapshotId) => {
  return await new Promise((resolve, reject) =>
    provider.send(
      {
        jsonrpc: "2.0",
        method: "evm_revert",
        params: [snapshotId],
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    )
  ).catch((e) => console.error(e));
};

const proposalIdGenerator = () => {
  var idCounter = 0;
  return {
    *generator() {
      idCounter++;
      return `0x${idCounter}`;
    },
  };
};

const configureOffchainVoting = async (
  owner,
  dao,
  daoFactory,
  chainId,
  votingAddress,
  bankAddress,
  votingPeriod,
  gracePeriod,
  deployer
) => {
  let snapshotProposalContract;
  let handleBadReporterAdapter;
  let offchainVoting;
  if (deployer) {
    let SnapshotProposalContract = getContractFromTruffle(
      SnapshotProposalContractName
    );
    let KickBadReporterAdapter = getContractFromTruffle(
      KickBadReporterAdapterName
    );
    let OffchainVotingContract = getContractFromTruffle(
      OffchainVotingContractName
    );
    snapshotProposalContract = await deployer.deploy(
      SnapshotProposalContract,
      chainId
    );
    handleBadReporterAdapter = await deployer.deploy(KickBadReporterAdapter);
    offchainVoting = await deployer.deploy(
      OffchainVotingContract,
      votingAddress,
      snapshotProposalContract.address,
      handleBadReporterAdapter.address
    );
  } else {
    let SnapshotProposalContract = getContractFromOpenZepplin(
      SnapshotProposalContractName
    );
    let KickBadReporterAdapter = getContractFromOpenZepplin(
      KickBadReporterAdapterName
    );
    let OffchainVotingContract = getContractFromOpenZepplin(
      OffchainVotingContractName
    );
    snapshotProposalContract = await SnapshotProposalContract.new(chainId);
    handleBadReporterAdapter = await KickBadReporterAdapter.new();
    offchainVoting = await OffchainVotingContract.new(
      votingAddress,
      snapshotProposalContract.address,
      handleBadReporterAdapter.address
    );
  }

  await daoFactory.updateAdapter(
    dao.address,
    entryDao("voting", offchainVoting, {})
  );

  await dao.setAclToExtensionForAdapter(
    bankAddress,
    offchainVoting.address,
    entryBank(offchainVoting, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
      INTERNAL_TRANSFER: true,
    }).flags
  );
  await offchainVoting.configureDao(dao.address, votingPeriod, gracePeriod, 10);

  return { offchainVoting, snapshotProposalContract, handleBadReporterAdapter };
};

const configureBatchVoting = async (
  owner,
  dao,
  daoFactory,
  chainId,
  votingPeriod,
  gracePeriod,
  deployer
) => {
  let snapshotProposalContract, batchVoting;
  if (deployer) {
    let SnapshotProposalContract = getContractFromTruffle(
      SnapshotProposalContractName
    );
    let BatchVotingContract = getContractFromTruffle(BatchVotingContractName);
    snapshotProposalContract = await deployer.deploy(
      SnapshotProposalContract,
      chainId
    );
    batchVoting = await deployer.deploy(
      BatchVotingContract,
      snapshotProposalContract.address
    );
  } else {
    let SnapshotProposalContract = getContractFromOpenZepplin(
      SnapshotProposalContractName
    );
    let BatchVotingContract = getContractFromOpenZepplin(
      BatchVotingContractName
    );
    snapshotProposalContract = await SnapshotProposalContract.new(chainId);
    batchVoting = await BatchVotingContract.new(
      snapshotProposalContract.address
    );
  }

  await daoFactory.updateAdapter(
    dao.address,
    entryDao("voting", batchVoting, {}),
    { from: owner }
  );

  await batchVoting.configureDao(dao.address, votingPeriod, gracePeriod, {
    from: owner,
  });

  return { batchVoting, snapshotProposalContract };
};

module.exports = {
  deployDao,
  deployDefaultDao,
  deployDefaultNFTDao,
  deployDaoWithBatchVoting,
  deployDaoWithOffchainVoting,
  createIdentityDao,
  cloneDao,
  prepareAdapters,
  addDefaultAdapters,
  entry,
  entryBank,
  entryDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  getNetworkDetails,
  advanceTime,
  sha3,
  toBN,
  toWei,
  hexToBytes,
  fromUtf8,
  toAscii,
  fromAscii,
  toUtf8,
  web3,
  networks,
  maximumChunks,
  provider,
  contract,
  accounts,
  expect,
  expectRevert,
  numberOfShares,
  sharePrice,
  remaining,
  GUILD,
  TOTAL,
  ESCROW,
  DAI_TOKEN,
  SHARES,
  LOOT,
  ETH_TOKEN,
  OLToken: getContractFromOpenZepplin(OLTokenName),
  TestToken1: getContractFromOpenZepplin(TestToken1Name),
  TestToken2: getContractFromOpenZepplin(TestToken2Name),
  TestFairShareCalc: getContractFromOpenZepplin(TestFairShareCalcName),
  Multicall: getContractFromOpenZepplin(MulticallName),
  PixelNFT: getContractFromOpenZepplin(PixelNFTName),
  DaoFactory: getContractFromOpenZepplin(DaoFactoryName),
  DaoRegistry: getContractFromOpenZepplin(DaoRegistryName),
  BankFactory: getContractFromOpenZepplin(BankFactoryName),
  VotingContract: getContractFromOpenZepplin(VotingContractName),
  ManagingContract: getContractFromOpenZepplin(ManagingContractName),
  FinancingContract: getContractFromOpenZepplin(FinancingContractName),
  RagequitContract: getContractFromOpenZepplin(RagequitContractName),
  GuildKickContract: getContractFromOpenZepplin(GuildKickContractName),
  OnboardingContract: getContractFromOpenZepplin(OnboardingContractName),
  DaoRegistryAdapterContract: getContractFromOpenZepplin(
    DaoRegistryAdapterContractName
  ),
  BankAdapterContract: getContractFromOpenZepplin(BankAdapterContractName),
  NFTAdapterContract: getContractFromOpenZepplin(NFTAdapterContractName),
  ConfigurationContract: getContractFromOpenZepplin(ConfigurationContractName),
  OffchainVotingContract: getContractFromOpenZepplin(
    OffchainVotingContractName
  ),
  KickBadReporterAdapter: getContractFromOpenZepplin(
    KickBadReporterAdapterName
  ),
  SnapshotProposalContract: getContractFromOpenZepplin(
    SnapshotProposalContractName
  ),
  BatchVotingContract: getContractFromOpenZepplin(BatchVotingContractName),
  TributeContract: getContractFromOpenZepplin(TributeContractName),
  DistributeContract: getContractFromOpenZepplin(DistributeContractName),
  TributeNFTContract: getContractFromOpenZepplin(TributeNFTContractName),
  CouponOnboardingContract: getContractFromOpenZepplin(
    CouponOnboardingContractName
  ),
  BankExtension: getContractFromOpenZepplin(BankExtensionName),
  NFTExtension: getContractFromOpenZepplin(NFTExtensionName),
};
