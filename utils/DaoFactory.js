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

// Test Util Contracts
const OLToken = contract.fromArtifact("OLToken");
const TestToken1 = contract.fromArtifact("TestToken1");
const TestToken2 = contract.fromArtifact("TestToken2");
const TestFairShareCalc = contract.fromArtifact("TestFairShareCalc");
const PixelNFT = contract.fromArtifact("PixelNFT");

// DAO Contracts
const DaoFactory = contract.fromArtifact("DaoFactory");
const DaoRegistry = contract.fromArtifact("DaoRegistry");
const NFTCollectionFactory = contract.fromArtifact("NFTCollectionFactory");
const BankFactory = contract.fromArtifact("BankFactory");
const Multicall = contract.fromArtifact("Multicall");

// Extensions
const NFTExtension = contract.fromArtifact("NFTExtension");
const BankExtension = contract.fromArtifact("BankExtension");

// Config Adapters
const BankAdapterContract = contract.fromArtifact("BankAdapterContract");
const NFTAdapterContract = contract.fromArtifact("NFTAdapterContract");
const ConfigurationContract = contract.fromArtifact("ConfigurationContract");
const ManagingContract = contract.fromArtifact("ManagingContract");
const DaoRegistryAdapterContract = contract.fromArtifact(
  "DaoRegistryAdapterContract"
);

// Voting Adapters
const VotingContract = contract.fromArtifact("VotingContract");
const OffchainVotingContract = contract.fromArtifact("OffchainVotingContract");
const KickBadReporterAdapter = contract.fromArtifact("KickBadReporterAdapter");
const BatchVotingContract = contract.fromArtifact("BatchVotingContract");
const SnapshotProposalContract = contract.fromArtifact(
  "SnapshotProposalContract"
);

// Withdraw Adapters
const RagequitContract = contract.fromArtifact("RagequitContract");
const GuildKickContract = contract.fromArtifact("GuildKickContract");
const DistributeContract = contract.fromArtifact("DistributeContract");

// Funding/Onboarding Adapters
const FinancingContract = contract.fromArtifact("FinancingContract");
const OnboardingContract = contract.fromArtifact("OnboardingContract");
const TributeContract = contract.fromArtifact("TributeContract");
const TributeNFTContract = contract.fromArtifact("TributeNFTContract");
const CouponOnboardingContract = contract.fromArtifact(
  "CouponOnboardingContract"
);

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

  let daoRegistry;
  let bankFactory;
  let nftFactory;

  if (deployer) {
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
    daoRegistry = await DaoRegistry.new();

    const identityBank = await BankExtension.new();
    bankFactory = await BankFactory.new(identityBank.address);

    const nftExt = await NFTExtension.new();
    nftFactory = await NFTCollectionFactory.new(nftExt.address);
  }

  const { dao, daoFactory } = await cloneDao(deployer, daoRegistry, owner);

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
    daoFactory
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
      testContracts.oltToken = await deployer.deploy(
        OLToken,
        toBN("1000000000000000000000000")
      );
      testContracts.testToken1 = await deployer.deploy(TestToken1, 1000000);
      testContracts.testToken2 = await deployer.deploy(TestToken2, 1000000);
      testContracts.multicall = await deployer.deploy(Multicall);
      testContracts.pixelNFT = await deployer.deploy(PixelNFT, 100);
    } else {
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
};

const createIdentityDao = async (owner) => {
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
    nftAddr,
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
    "0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8",
    SHARES
  );

  await voting.configureDao(dao.address, votingPeriod, gracePeriod);
  await tribute.configureDao(dao.address, SHARES);
  await tribute.configureDao(dao.address, LOOT);
  await tributeNFT.configureDao(dao.address);
};

const cloneDao = async (deployer, identityDao, owner, name = "test-dao") => {
  // The owner of the DAO is always the 1st unlocked address if none is provided
  let txArgs = {
    from: owner ? owner : accounts[0],
  };

  let daoFactory;
  if (deployer) {
    await deployer.deploy(DaoFactory, identityDao.address, txArgs);
    daoFactory = await DaoFactory.deployed();
  } else {
    daoFactory = await DaoFactory.new(identityDao.address, txArgs);
  }

  await daoFactory.createDao(name, ETH_TOKEN, txArgs);
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
    snapshotProposalContract = await deployer.deploy(
      SnapshotProposalContract,
      chainId
    );
    batchVoting = await deployer.deploy(
      BatchVotingContract,
      snapshotProposalContract.address
    );
  } else {
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
  expect,
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
