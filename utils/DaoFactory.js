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

const Web3Utils = require("web3-utils");

const sha3 = Web3Utils.sha3;
const toBN = Web3Utils.toBN;
const toWei = Web3Utils.toWei;
const fromUtf8 = Web3Utils.fromUtf8;
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

const OLToken = artifacts.require("./test/OLToken");
const TestToken1 = artifacts.require("./test/TestToken1");
const TestToken2 = artifacts.require("./test/TestToken2");
const TestFairShareCalc = artifacts.require("./test/TestFairShareCalc");
const PixelNFT = artifacts.require("./test/PixelNFT");
const Multicall = artifacts.require("./util/Multicall");

const DaoFactory = artifacts.require("./core/DaoFactory");
const DaoRegistry = artifacts.require("./core/DaoRegistry");

const NFTExtension = artifacts.require("./extensions/nft/NFTExtension");
const NFTCollectionFactory = artifacts.require(
  "./extensions/NFTCollectionFactory"
);
const BankExtension = artifacts.require("./extensions/bank/BankExtension");
const BankFactory = artifacts.require("./extensions/bank/BankFactory");

const VotingContract = artifacts.require("./adapters/VotingContract");
const DaoRegistryAdapterContract = artifacts.require("./adapters/DaoRegistryAdapterContract");
const BankAdapterContract = artifacts.require("./adapters/BankAdapterContract");
const NFTAdapterContract = artifacts.require("./adapters/NFTAdapterContract");
const ConfigurationContract = artifacts.require(
  "./adapter/ConfigurationContract"
);
const ManagingContract = artifacts.require("./adapter/ManagingContract");
const FinancingContract = artifacts.require("./adapter/FinancingContract");
const RagequitContract = artifacts.require("./adapters/RagequitContract");
const GuildKickContract = artifacts.require("./adapters/GuildKickContract");
const OnboardingContract = artifacts.require("./adapters/OnboardingContract");


const SnapshotProposalContract = artifacts.require("./adapters/voting/SnapshotProposalContract");
const OffchainVotingContract = artifacts.require("./adapters/voting/OffchainVotingContract");
const KickBadReporterAdapter = artifacts.require("./adapters/voting/KickBadReporterAdapter");

const BatchVotingContract = artifacts.require("./adapters/voting/BatchVotingContract");
const CouponOnboardingContract = artifacts.require("./adapters/CouponOnboardingContract");

const TributeContract = artifacts.require("./adapters/TributeContract");
const DistributeContract = artifacts.require("./adapters/DistributeContract");
const TributeNFTContract = artifacts.require("./adapters/TributeNFTContract");

async function prepareAdapters(deployer) {
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
}

const addDefaultAdapters = async (
  dao,
  unitPrice = sharePrice,
  nbShares = numberOfShares,
  votingPeriod = 10,
  gracePeriod = 1,
  tokenAddr = ETH_TOKEN,
  maxChunks = maximumChunks,
  daoFactory,
  deployer,
  nftAddr
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
    nftAddr
  });

  return { dao };
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
  maxChunks
}) => {
  await daoFactory.addAdapters(dao.address, [
    entryDao("voting", voting, {}),
    entryDao("configuration", configuration, {
      SUBMIT_PROPOSAL: true,
      SET_CONFIGURATION: true,
    }),
    entryDao("ragequit", ragequit, {}),
    entryDao("guildkick", guildkick, {
      SUBMIT_PROPOSAL: true
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
      NEW_MEMBER: true,
    }),
    entryDao("coupon-onboarding", couponOnboarding, {
      SUBMIT_PROPOSAL: false,
      ADD_TO_BALANCE: true,
      UPDATE_DELEGATE_KEY: false,
      NEW_MEMBER: true,
    }),
    entryDao("daoRegistry", daoRegistryAdapter, {
      UPDATE_DELEGATE_KEY: true
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
      TRANSFER_NFT: true,
    }),
    entryDao("distribute", distribute, {
      SUBMIT_PROPOSAL: true
    }),
  ]);

  const bankAddress = await dao.getExtensionAddress(sha3("bank"));
  const bankExt = await BankExtension.at(bankAddress);
  await daoFactory.configureExtension(dao.address, bankExt.address, [
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

  const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
  const nftExt = await NFTExtension.at(nftExtAddr);
  await daoFactory.configureExtension(dao.address, nftExt.address, [
    entryBank(tributeNFT, {
      ADD_TO_BALANCE: true,
      REGISTER_NFT: true,
      TRANSFER_NFT: true,
    }),
    entryBank(nftAdapter, {
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
    "0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8",
    SHARES
  );

  await voting.configureDao(dao.address, votingPeriod, gracePeriod);
  await tribute.configureDao(dao.address, SHARES);
  await tribute.configureDao(dao.address, LOOT);
};

const deployDao = async (deployer, options) => {
  const unitPrice = options.unitPrice || sharePrice;
  const nbShares = options.nbShares || numberOfShares;
  const votingPeriod = options.votingPeriod || 10;
  const gracePeriod = options.gracePeriod || 1;
  const tokenAddr = options.tokenAddr || ETH_TOKEN;
  const maxChunks = options.maximumChunks || maximumChunks;
  const isOffchainVoting = !!options.offchainVoting;
  const chainId = options.chainId || 1;
  const deployTestTokens = !!options.deployTestTokens;
  const maxExternalTokens = options.maxExternalTokens || 100;

  await deployer.deploy(DaoRegistry);

  const { dao, daoFactory } = await cloneDaoDeployer(deployer);

  await deployer.deploy(BankExtension);
  const identityBank = await BankExtension.deployed();
  await deployer.deploy(BankFactory, identityBank.address);
  const bankFactory = await BankFactory.deployed();
  await bankFactory.createBank(maxExternalTokens);
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await bankFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }

  let { bankAddress } = pastEvent.returnValues;
  let bank = await BankExtension.at(bankAddress);
  let creator = await dao.getMemberAddress(1);
  dao.addExtension(sha3("bank"), bank.address, creator);

  await deployer.deploy(NFTExtension);
  const identityNFTExt = await NFTExtension.deployed();
  await deployer.deploy(NFTCollectionFactory, identityNFTExt.address);
  const nftCollFactory = await NFTCollectionFactory.deployed();
  await nftCollFactory.createNFTCollection();
  pastEvent = undefined;
  while (pastEvent === undefined) {
    let pastEvents = await nftCollFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }

  let { nftCollAddress } = pastEvent.returnValues;
  let nftExtension = await NFTExtension.at(nftCollAddress);
  dao.addExtension(sha3("nft"), nftExtension.address, creator);

  await addDefaultAdapters(
    dao,
    unitPrice,
    nbShares,
    votingPeriod,
    gracePeriod,
    tokenAddr,
    maxChunks,
    daoFactory,
    deployer
  );

  const votingAddress = await dao.getAdapterAddress(sha3("voting"));
  if (isOffchainVoting) {
    await deployer.deploy(SnapshotProposalContract, chainId);
    await deployer.deploy(KickBadReporterAdapter);

    const snapshotProposalContract = await SnapshotProposalContract.deployed();
    const handleBadReporterAdapter = await KickBadReporterAdapter.deployed();
    const offchainVoting = await deployer.deploy(OffchainVotingContract, votingAddress, snapshotProposalContract.address, handleBadReporterAdapter.address);

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

    await offchainVoting.configureDao(
      dao.address,
      votingPeriod,
      gracePeriod,
      10
    );
  }

  // deploy test token contracts (for testing convenience)
  if (deployTestTokens) {
    await deployer.deploy(OLToken, toBN("1000000000000000000000000"));
    await deployer.deploy(TestToken1, 1000000);
    await deployer.deploy(TestToken2, 1000000);
    await deployer.deploy(Multicall);
    await deployer.deploy(PixelNFT, 100);
  }

  return dao;
};

let counter = 0;

const createDao = async (
  senderAccount,
  unitPrice = sharePrice,
  nbShares = numberOfShares,
  votingPeriod = 10,
  gracePeriod = 1,
  tokenAddr = ETH_TOKEN,
  finalize = true,
  maxExternalTokens = 100,
  maxChunks = maximumChunks
) => {
  const daoFactory = await DaoFactory.deployed();
  const daoName = "test-dao-" + counter++;
  await daoFactory.createDao(daoName, senderAccount);

  // checking the gas usaged to clone a contract
  const daoAddress = await daoFactory.getDaoAddress(daoName);
  let dao = await DaoRegistry.at(daoAddress);

  // Create and add the Bank Extension to the DAO
  const bankFactory = await BankFactory.deployed();
  await bankFactory.createBank(maxExternalTokens);
  let pastEvents = await bankFactory.getPastEvents();
  let { bankAddress } = pastEvents[0].returnValues;
  let bank = await BankExtension.at(bankAddress);
  dao.addExtension(sha3("bank"), bank.address, senderAccount);

  // Create and add the NFT Collection Extension to the DAO
  const nftFactory = await NFTCollectionFactory.deployed();
  await nftFactory.createNFTCollection();
  pastEvents = await nftFactory.getPastEvents();
  let { nftCollAddress } = pastEvents[0].returnValues;
  let nftExt = await NFTExtension.at(nftCollAddress);
  dao.addExtension(sha3("nft"), nftExt.address, senderAccount);

  // Create and set up the DAO Adapters
  const voting = await VotingContract.deployed();
  const configuration = await ConfigurationContract.deployed();
  const ragequit = await RagequitContract.deployed();
  const managing = await ManagingContract.deployed();
  const financing = await FinancingContract.deployed();
  const onboarding = await OnboardingContract.deployed();
  const guildkick = await GuildKickContract.deployed();
  const daoRegistryAdapter = await DaoRegistryAdapterContract.deployed();
  const bankAdapter = await BankAdapterContract.deployed();
  const nftAdapter = await NFTAdapterContract.deployed();
  const couponOnboarding = await CouponOnboardingContract.deployed();
  const tribute = await TributeContract.deployed();
  const distribute = await DistributeContract.deployed();
  const tributeNFT = await TributeNFTContract.deployed();

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
    maxChunks
  });

  if (finalize) {
    await dao.finalizeDao();
  }

  return dao;
};

const cloneDao = async (identityAddress, senderAccount) => {
  // newDao: uses clone factory to clone the contract deployed at the identityAddress
  let daoFactory = await DaoFactory.new(identityAddress);
  await daoFactory.createDao("test-dao", senderAccount);
  // checking the gas usaged to clone a contract
  let pastEvents = await daoFactory.getPastEvents();
  let { _address } = pastEvents[0].returnValues;

  let dao = await DaoRegistry.at(_address);

  return { dao, daoFactory };
};

const cloneDaoDeployer = async (deployer) => {
  // newDao: uses clone factory to clone the contract deployed at the identityAddress
  const dao = await DaoRegistry.deployed();
  await deployer.deploy(DaoFactory, dao.address);
  let daoFactory = await DaoFactory.deployed();

  await daoFactory.createDao("test-dao", ETH_TOKEN);
  // checking the gas usaged to clone a contract
  let pastEvents = await daoFactory.getPastEvents();
  let { _address } = pastEvents[0].returnValues;
  let newDao = await DaoRegistry.at(_address);
  return { dao: newDao, daoFactory };
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
    flags.COLLECT_NFT,
    flags.TRANSFER_NFT,
    flags.RETURN_NFT,
    flags.REGISTER_NFT,
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
    .map((v, idx) => (v !== undefined ? 2 ** idx : 0))
    .reduce((a, b) => a + b);
};

const getContract = async (dao, id, contractFactory) => {
  const address = await dao.getAdapterAddress(sha3(id));
  return await contractFactory.at(address);
};

module.exports = {
  prepareAdapters,
  advanceTime,
  createDao,
  deployDao,
  addDefaultAdapters,
  getContract,
  entry,
  entryBank,
  entryDao,
  sha3,
  toBN,
  toWei,
  fromUtf8,
  toAscii,
  fromAscii,
  toUtf8,
  maximumChunks,
  GUILD,
  TOTAL,
  ESCROW,
  DAI_TOKEN,
  SHARES,
  LOOT,
  numberOfShares,
  sharePrice,
  remaining,
  ETH_TOKEN,
  OLToken,
  TestToken1,
  TestToken2,
  TestFairShareCalc,
  Multicall,
  PixelNFT,
  DaoFactory,
  DaoRegistry,
  BankFactory,
  VotingContract,
  ManagingContract,
  FinancingContract,
  RagequitContract,
  GuildKickContract,
  OnboardingContract,
  DaoRegistryAdapterContract,
  BankAdapterContract,
  NFTAdapterContract,
  ConfigurationContract,
  OffchainVotingContract,
  KickBadReporterAdapter,
  SnapshotProposalContract,
  BatchVotingContract,
  TributeContract,
  DistributeContract,
  TributeNFTContract,
  OnboardingContract,
  CouponOnboardingContract,
  BankExtension,
  NFTExtension,
};
