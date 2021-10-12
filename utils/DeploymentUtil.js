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

const { UNITS, LOOT, sha3, toBN } = require("./ContractUtil");

const waitForEvent = async (contract, event) => {
  console.log('Wait for event', event);
  return new Promise((resolve, reject) => {
    let timmer = setTimeout(() => {
        contract.on(event, (...args) => {
          resolve(args);
          clearTimeout(timmer);
        })
    }, 0);
  });
};



const deployDao = async (options) => {
  const {
    deployFunction,
    owner,
    deployTestTokens,
    finalize,
    DaoRegistry,
    BankExtension,
    BankFactory,
    NFTExtension,
    NFTCollectionFactory,
    ERC20Extension,
    ERC20TokenExtensionFactory,
    TestToken1,
    TestToken2,
    Multicall,
    PixelNFT,
    OLToken,
  } = options;

  const erc20TokenName = options.erc20TokenName
    ? options.erc20TokenName
    : "Unit Test Tokens";
  const erc20TokenSymbol = options.erc20TokenSymbol
    ? options.erc20TokenSymbol
    : "UTT";
  const erc20TokenDecimals = options.erc20TokenDecimals
    ? parseInt(options.erc20TokenDecimals) || 0
    : 0;

  const identityDao = await deployFunction("DaoRegistry", DaoRegistry);

  const identityBank = await deployFunction("BankExtension", BankExtension);
  const bankFactory = await deployFunction("BankFactory", BankFactory, [identityBank.address]);

  const identityNft = await deployFunction("NFTExtension", NFTExtension);
  const nftFactory = await deployFunction("NFTCollectionFactory", NFTCollectionFactory, [
    identityNft.address,
  ]);

  const identityERC20Ext = await deployFunction("ERC20Extension", ERC20Extension);
  const erc20TokenExtFactory = await deployFunction(
    "ERC20TokenExtensionFactory",
    ERC20TokenExtensionFactory,
    [identityERC20Ext.address]
  );

  const { dao, daoFactory } = await cloneDao({
    ...options,
    identityDao,
    name: options.daoName || "test-dao",
  });
   // Start the BankExtension deployment and configuration
   await bankFactory.createBank(options.maxExternalTokens);
   const [ bankAddress ] = await waitForEvent(bankFactory,bankFactory.filters.BankCreated());
   const bankExtension = await (await BankExtension).attach(bankAddress);
   await dao.addExtension(sha3("bank"), bankExtension.address, owner);
 
   // Start the NFTExtension deployment and configuration
   await nftFactory.createNFTCollection();
   const [ addressNft ] = await waitForEvent(nftFactory,nftFactory.filters.NFTCollectionCreated());
   const nftExtension = await (await NFTExtension).attach(addressNft);
   await dao.addExtension(sha3("nft"), addressNft, owner);
 
   // Start the Erc20TokenExtension deployment & configuration
   await erc20TokenExtFactory.create(
     erc20TokenName,
     UNITS,
     erc20TokenSymbol,
     erc20TokenDecimals
   );
   const [ addressERCToken ] = await waitForEvent(erc20TokenExtFactory,erc20TokenExtFactory.filters.ERC20TokenExtensionCreated());
   const erc20TokenExtension = await (await ERC20Extension).attach(addressERCToken);
   await dao.addExtension(sha3("erc20-ext"), erc20TokenExtension.address, owner);

  const extensions = {
    bank: bankExtension,
    nft: nftExtension,
    erc20Ext: erc20TokenExtension,
  };

  const { adapters } = await addDefaultAdapters({
    dao,
    options,
    daoFactory,
  });

  const votingAddress = await dao.getAdapterAddress(sha3("voting"));
  const votingHelpers = {
    snapshotProposalContract: null,
    handleBadReporterAdapter: null,
    offchainVoting: null,
    batchVoting: null,
  };

  if (options.offchainVoting) {
    const {
      offchainVoting,
      handleBadReporterAdapter,
      snapshotProposalContract,
    } = await configureOffchainVoting({
      ...options,
      dao,
      daoFactory,
      votingAddress,
      bankAddress,
    });
    votingHelpers.offchainVoting = offchainVoting;
    votingHelpers.handleBadReporterAdapter = handleBadReporterAdapter;
    votingHelpers.snapshotProposalContract = snapshotProposalContract;
  } else if (options.batchVoting) {
    const {
      batchVoting,
      snapshotProposalContract,
    } = await configureBatchVoting({
      ...options,
      dao,
      daoFactory,
    });

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
    testContracts.testToken1 = await deployFunction("TestToken1", TestToken1, [1000000]);
    testContracts.testToken2 = await deployFunction("TestToken2", TestToken2, [1000000]);
    testContracts.multicall = await deployFunction("Multicall", Multicall);
    testContracts.pixelNFT = await deployFunction("PixelNFT", PixelNFT, [100]);
    testContracts.oltToken = await deployFunction("OLToken", OLToken, [
      toBN("1000000000000000000000000").toString()
    ]);
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
    factories: { daoFactory, bankFactory, nftFactory, erc20TokenExtFactory },
  };
};

const configureOffchainVoting = async ({
  dao,
  daoFactory,
  chainId,
  owner,
  offchainAdmin,
  votingAddress,
  bankAddress,
  votingPeriod,
  gracePeriod,
  SnapshotProposalContract,
  KickBadReporterAdapter,
  OffchainVotingContract,
  deployFunction,
}) => {
  let snapshotProposalContract = await deployFunction(
    "SnapshotProposalContract",
    SnapshotProposalContract,
    [chainId]
  );
  let handleBadReporterAdapter = await deployFunction(
    "KickBadReporterAdapter",
    KickBadReporterAdapter);
  
  let offchainVoting = await deployFunction(
    "OffchainVotingContract",
    OffchainVotingContract, [
    votingAddress,
    snapshotProposalContract.address,
    handleBadReporterAdapter.address,
    offchainAdmin
  ]);

  await daoFactory.updateAdapter(
    dao.address,
    entryDao("voting", offchainVoting, {})
  );

  const [hash, address] = await waitForEvent(dao, dao.filters.AdapterAdded());

  await dao.setAclToExtensionForAdapter(
    bankAddress,
    address,
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

  return { offchainVoting, snapshotProposalContract, handleBadReporterAdapter };
};

const configureBatchVoting = async ({
  owner,
  dao,
  daoFactory,
  chainId,
  votingPeriod,
  gracePeriod,
  SnapshotProposalContract,
  BatchVotingContract,
  deployFunction,
}) => {
  let snapshotProposalContract, batchVoting;

  snapshotProposalContract = await deployFunction(
    "SnapshotProposalContract",
    SnapshotProposalContract,
    [chainId]
    );
  batchVoting = await deployFunction(
    "BatchVotingContract",
    BatchVotingContract,
    [snapshotProposalContract.address]
    );

  await daoFactory.updateAdapter(
    dao.address,
    entryDao("voting", batchVoting, {})
  );

  await batchVoting.configureDao(dao.address, votingPeriod, gracePeriod);

  return { batchVoting, snapshotProposalContract };
};

const prepareAdapters = async ({
  deployFunction,
  VotingContract,
  ConfigurationContract,
  TributeContract,
  TributeNFTContract,
  DistributeContract,
  RagequitContract,
  ManagingContract,
  FinancingContract,
  OnboardingContract,
  GuildKickContract,
  DaoRegistryAdapterContract,
  BankAdapterContract,
  NFTAdapterContract,
  CouponOnboardingContract,
}) => {
  let voting,
    configuration,
    ragequit,
    managing,
    financing,
    onboarding,
    guildkick,
    daoRegistryAdapter,
    bankAdapter,
    nftAdapter,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT;

  voting = await deployFunction("VotingContract", VotingContract);
  configuration = await deployFunction("ConfigurationContract", ConfigurationContract);
  ragequit = await deployFunction("RagequitContract", RagequitContract);
  managing = await deployFunction("ManagingContract", ManagingContract);
  financing = await deployFunction("FinancingContract", FinancingContract);
  onboarding = await deployFunction("OnboardingContract", OnboardingContract);
  guildkick = await deployFunction("GuildKickContract", GuildKickContract);
  daoRegistryAdapter = await deployFunction("DaoRegistryAdapterContract", DaoRegistryAdapterContract);
  bankAdapter = await deployFunction("BankAdapterContract", BankAdapterContract);
  nftAdapter = await deployFunction("NFTAdapterContract", NFTAdapterContract);
  couponOnboarding = await deployFunction("CouponOnboardingContract", CouponOnboardingContract, [1]);
  tribute = await deployFunction("TributeContract", TributeContract);
  distribute = await deployFunction("DistributeContract", DistributeContract);
  tributeNFT = await deployFunction("TributeNFTContract", TributeNFTContract);

  return {
    voting: await voting,
    configuration: await configuration,
    ragequit: await ragequit,
    guildkick: await guildkick,
    managing: await managing,
    financing: await financing,
    onboarding: await onboarding,
    daoRegistryAdapter: await daoRegistryAdapter,
    bankAdapter: await bankAdapter,
    nftAdapter: await nftAdapter,
    couponOnboarding: await couponOnboarding,
    tribute: await tribute,
    distribute: await distribute,
    tributeNFT: await tributeNFT,
  };
};

const createIdentityDao = async (options) => {
  let { DaoRegistry } = options;

  return await DaoRegistry.new({
    from: options.owner,
    gasPrice: toBN("0"),
  });
};

const addDefaultAdapters = async ({ dao, options, daoFactory, nftAddr }) => {
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
  } = await prepareAdapters(options);

  let { BankExtension, NFTExtension, ERC20Extension } = options;

  const bankAddress = await dao.getExtensionAddress(sha3("bank"));
  const bankExtension = await (await BankExtension).attach(bankAddress);

  const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
  const nftExtension = await (await NFTExtension).attach(nftExtAddr);

  const unitTokenExtAddr = await dao.getExtensionAddress(sha3("erc20-ext"));
  const erc20TokenExtension = await (await ERC20Extension).attach(unitTokenExtAddr);

  await configureDao({
    owner: options.owner,
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
    nftAddr,
    bankExtension,
    nftExtension,
    erc20TokenExtension,
    ...options,
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
  owner,
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
  nftAdapter,
  nftExtension,
  erc20TokenExtension,
  voting,
  configuration,
  couponOnboarding,
  tribute,
  distribute,
  tributeNFT,
  unitPrice,
  maxChunks,
  nbUnits,
  tokenAddr,
  votingPeriod,
  gracePeriod,
  couponCreatorAddress,
}) => {
  await daoFactory.addAdapters(
    dao.address,
    [
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
      // Adapters to access the extensions directly
      entryDao("nft", nftAdapter, {}),
      entryDao("bank", bankAdapter, {}),
      // Declare the erc20 token extension as an adapter to be able to call the bank extension
      entryDao("erc20-ext", erc20TokenExtension, {
        NEW_MEMBER: true,
      })
    ]
  );

  await daoFactory.configureExtension(
    dao.address,
    bankExtension.address,
    [
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
        REGISTER_NEW_TOKEN: true,
      }),
      entryBank(distribute, {
        INTERNAL_TRANSFER: true,
      }),
      entryBank(tributeNFT, {
        ADD_TO_BALANCE: true,
      }),
      // Let the unit-token extension to execute internal transfers in the bank as an adapter
      entryBank(erc20TokenExtension, {
        INTERNAL_TRANSFER: true,
      })
    ]
  );

  await daoFactory.configureExtension(
    dao.address,
    nftExtension.address,
    [
      entryNft(tributeNFT, {
        COLLECT_NFT: true,
      }),
      entryNft(nftAdapter, {
        COLLECT_NFT: true,
      }),
    ]
  );

  await daoFactory.configureExtension(
    dao.address,
    erc20TokenExtension.address,
    []
  );

  await onboarding.configureDao(
    dao.address,
    UNITS,
    unitPrice,
    nbUnits,
    maxChunks,
    tokenAddr
  );

  await onboarding.configureDao(
    dao.address,
    LOOT,
    unitPrice,
    nbUnits,
    maxChunks,
    tokenAddr
  );

  await couponOnboarding.configureDao(
    dao.address,
    couponCreatorAddress,
    UNITS
  );

  await voting.configureDao(dao.address, votingPeriod, gracePeriod);
  await tribute.configureDao(dao.address, UNITS);
  await tribute.configureDao(dao.address, LOOT);
  await tributeNFT.configureDao(dao.address);
};

const cloneDao = async ({
  identityDao,
  owner,
  creator,
  deployFunction,
  DaoRegistry,
  DaoFactory,
  name,
}) => {
  let daoFactory = await deployFunction(
    "DaoFactory",
    DaoFactory,
    [identityDao.address],
    owner
  );

  await daoFactory.createDao(name, creator ? creator : owner);
  
  const [address] = await waitForEvent(daoFactory, daoFactory.filters.DAOCreated());

  let newDao = await (await DaoRegistry).attach(address);
  return { dao: newDao, daoFactory, daoName: name };
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
    name: "ropsten",
    chainId: 3,
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

module.exports = {
  deployDao,
  createIdentityDao,
  cloneDao,
  prepareAdapters,
  addDefaultAdapters,
  entry,
  entryBank,
  entryDao,
  getNetworkDetails,
};
