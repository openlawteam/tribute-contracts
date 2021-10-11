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

const deployDao = async (options) => {
  let {
    deployFunction,
    owner,
    finalize,
    DaoRegistry,
    BankExtension,
    BankFactory,
    ERC20Extension,
    ERC20TokenExtensionFactory,
    WETH,
    wethAddress,
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

  if (!wethAddress) {
    const weth = await deployFunction(WETH);
    wethAddress = weth.address;
    options.wethAddress = wethAddress;
  }
  const identityDao = await deployFunction(DaoRegistry);

  const identityBank = await deployFunction(BankExtension);
  const bankFactory = await deployFunction(BankFactory, [identityBank.address]);

  const identityERC20Ext = await deployFunction(ERC20Extension);
  const erc20TokenExtFactory = await deployFunction(
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
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await bankFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { bankAddress } = pastEvent.returnValues;
  const bankExtension = await BankExtension.at(bankAddress);
  await dao.addExtension(sha3("bank"), bankExtension.address, owner, {
    from: owner,
  });

  // Start the Erc20TokenExtension deployment & configuration
  await erc20TokenExtFactory.create(
    erc20TokenName,
    UNITS,
    erc20TokenSymbol,
    erc20TokenDecimals
  );
  pastEvent = undefined;
  while (pastEvent === undefined) {
    let pastEvents = await erc20TokenExtFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { erc20ExtTokenAddress } = pastEvent.returnValues;
  const erc20TokenExtension = await ERC20Extension.at(erc20ExtTokenAddress);
  await dao.addExtension(sha3("erc20-ext"), erc20ExtTokenAddress, owner, {
    from: owner,
  });

  const extensions = {
    bank: bankExtension,
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

  /*
  if (deployTestTokens) {
    testContracts.testToken1 = await deployFunction(TestToken1, [1000000]);
    testContracts.testToken2 = await deployFunction(TestToken2, [1000000]);
    testContracts.multicall = await deployFunction(Multicall);
    testContracts.pixelNFT = await deployFunction(PixelNFT, [100]);
    testContracts.oltToken = await deployFunction(OLToken, [
      toBN("1000000000000000000000000"),
    ]);
  }
  */

  if (finalize) {
    await dao.finalizeDao({ from: owner });
  }

  return {
    dao: dao,
    adapters: adapters,
    extensions: extensions,
    testContracts: testContracts,
    votingHelpers: votingHelpers,
    factories: { daoFactory, bankFactory, erc20TokenExtFactory },
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
    SnapshotProposalContract,
    [chainId]
  );
  let handleBadReporterAdapter = await deployFunction(KickBadReporterAdapter);
  let offchainVoting = await deployFunction(OffchainVotingContract, [
    votingAddress,
    snapshotProposalContract.address,
    handleBadReporterAdapter.address,
    offchainAdmin,
  ]);

  await daoFactory.updateAdapter(
    dao.address,
    entryDao("voting", offchainVoting, {}),
    { from: owner }
  );

  await dao.setAclToExtensionForAdapter(
    bankAddress,
    offchainVoting.address,
    entryBank(offchainVoting, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
      INTERNAL_TRANSFER: true,
    }).flags,
    { from: owner }
  );
  await offchainVoting.configureDao(
    dao.address,
    votingPeriod,
    gracePeriod,
    10,
    { from: owner }
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

  snapshotProposalContract = await deployFunction(SnapshotProposalContract, [
    chainId,
  ]);
  batchVoting = await deployFunction(BatchVotingContract, [
    snapshotProposalContract.address,
  ]);

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

const prepareAdapters = async ({
  deployFunction,
  VotingContract,
  ConfigurationContract,
  RagequitContract,
  ManagingContract,
  KycOnboardingContract,
  GuildKickContract,
  DaoRegistryAdapterContract,
  BankAdapterContract,
  CouponOnboardingContract,
  wethAddress,
}) => {
  let voting,
    configuration,
    ragequit,
    managing,
    kycOnboarding,
    guildkick,
    daoRegistryAdapter,
    couponOnboarding,
    bankAdapter;

  voting = await deployFunction(VotingContract);
  configuration = await deployFunction(ConfigurationContract);
  ragequit = await deployFunction(RagequitContract);
  managing = await deployFunction(ManagingContract);
  kycOnboarding = await deployFunction(KycOnboardingContract, [1, wethAddress]);
  guildkick = await deployFunction(GuildKickContract);
  daoRegistryAdapter = await deployFunction(DaoRegistryAdapterContract);
  bankAdapter = await deployFunction(BankAdapterContract);
  couponOnboarding = await deployFunction(CouponOnboardingContract, [1]);

  return {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    kycOnboarding,
    daoRegistryAdapter,
    bankAdapter,
    couponOnboarding,
  };
};

const createIdentityDao = async (options) => {
  let { DaoRegistry } = options;

  return await DaoRegistry.new({
    from: options.owner,
    gasPrice: toBN("0"),
  });
};

const addDefaultAdapters = async ({ dao, options, daoFactory }) => {
  const {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    //onboarding,
    kycOnboarding,
    daoRegistryAdapter,
    bankAdapter,
    //nftAdapter,
    couponOnboarding,
    //tribute,
    //distribute,
    //tributeNFT,
  } = await prepareAdapters(options);

  let { BankExtension, ERC20Extension } = options;

  const bankAddress = await dao.getExtensionAddress(sha3("bank"));
  const bankExtension = await BankExtension.at(bankAddress);

  const unitTokenExtAddr = await dao.getExtensionAddress(sha3("erc20-ext"));
  const erc20TokenExtension = await ERC20Extension.at(unitTokenExtAddr);

  await configureDao({
    owner: options.owner,
    daoFactory,
    dao,
    ragequit,
    guildkick,
    managing,
    kycOnboarding,
    daoRegistryAdapter,
    bankAdapter,
    voting,
    configuration,
    couponOnboarding,
    bankExtension,
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
      kycOnboarding,
      daoRegistryAdapter,
      bankAdapter,
      couponOnboarding,
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
  kycOnboarding,
  daoRegistryAdapter,
  bankAdapter,
  bankExtension,
  erc20TokenExtension,
  voting,
  configuration,
  couponOnboarding,
  unitPrice,
  maxChunks,
  nbUnits,
  votingPeriod,
  gracePeriod,
  couponCreatorAddress,
  fundTargetAddress,
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
        ADD_EXTENSION: true,
        REMOVE_EXTENSION: true,
      }),
      entryDao("kyc-onboarding", kycOnboarding, {
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
      entryDao("bank", bankAdapter, {}),
      // Declare the erc20 token extension as an adapter to be able to call the bank extension
      entryDao("erc20-ext", erc20TokenExtension, {
        NEW_MEMBER: true,
      }),
    ],
    { from: owner }
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
      entryBank(kycOnboarding, {
        ADD_TO_BALANCE: true,
      }),
      entryBank(couponOnboarding, {
        ADD_TO_BALANCE: true,
      }),
      // Let the unit-token extension to execute internal transfers in the bank as an adapter
      entryBank(erc20TokenExtension, {
        INTERNAL_TRANSFER: true,
      }),
    ],
    { from: owner }
  );

  await daoFactory.configureExtension(
    dao.address,
    erc20TokenExtension.address,
    [],
    { from: owner }
  );

  await kycOnboarding.configureDao(
    dao.address,
    couponCreatorAddress,
    unitPrice,
    nbUnits,
    maxChunks,
    100,
    fundTargetAddress,
    {
      from: owner,
    }
  );

  await couponOnboarding.configureDao(
    dao.address,
    couponCreatorAddress,
    UNITS,
    {
      from: owner,
    }
  );

  await voting.configureDao(dao.address, votingPeriod, gracePeriod, {
    from: owner,
  });
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
    DaoFactory,
    [identityDao.address],
    owner
  );

  await daoFactory.createDao(name, creator ? creator : owner, { from: owner });

  // checking the gas usaged to clone a contract
  let address = await daoFactory.getDaoAddress(name);

  let newDao = await DaoRegistry.at(address);
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
