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

// RINKEBY
const rinkebyContracts = {
  // BankAdapter: '0x9cDa4Bfe9Cdf5769425774Ae7bD9Cb21b5CbA2C7',
  BankFactory: "0x81Cf17e713b621531C0A2F58D92E93fB7Ce417d7",
  Configuration: "0xe7bAE38678bA931FA3B65F57D69fBE104dFb3953",
  CouponOnboarding: "0x0114646f214E04364ACbb747c08eD5188E682993",
  DaoFactory: "0x96dAE5f5B474E3184e6B4C643F5204bB180FEdb0",
  DaoRegistryAdapter: "0xeE8E97c87D19Aaf055860b3C5F013c3042a70696",
  // ERC20TokenExtensionFactory: "0x66924Ea22B498AF0723739a64653a2D1505efaDd",
  GuildKick: "0x799B9CB3b361a9C528ef268823f35DAaD57Dc187",
  KycOnboarding: "0x58aCc6ed1E53E217D0Ca6BbD8D2A953b15C71de5",
  Manager: "0x78A43376dC5795e5097906486aa10b841c2f49D9",
  Managing: "0x070461e9fc8B2FA737f66ddbb5CA22c3ab22D049",
  OffchainVoting: "0x219E388b07E1184b1fc5E6Fd59Af9a65bAbedC56",
  Ragequit: "0xd12AE3E3B2712cc9c3c59B7CC6B0CF6a667943bf",
  Voting: "0x92B78EdE3C0C53c07396eb28BD268CCBB6d0c327",
};

const { UNITS, sha3, toBN } = require("./ContractUtil");

const deployDao = async (options) => {
  let {
    deployFunction,
    owner,
    finalize,
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

  const bankFactory = await BankFactory.at(rinkebyContracts.BankFactory);
  //const bankIdentity = await BankExtension.new();
  //const bankFactory = await BankFactory.new(bankIdentity.address);

  // const erc20TokenExtFactory = await ERC20TokenExtensionFactory.at(
  //   rinkebyContracts.ERC20TokenExtensionFactory
  // );

  // const erc20Ext = await ERC20Extension.new();
  const erc20Ext = await deployFunction(ERC20Extension);
  // const erc20TokenExtFactory = await ERC20TokenExtensionFactory.new(
  //   erc20Ext.address
  // );
  const erc20TokenExtFactory = await deployFunction(
    ERC20TokenExtensionFactory,
    [erc20Ext.address]
  );

  console.log("clone dao ...");
  const { dao, daoFactory } = await cloneDao({
    ...options,
    name: options.daoName || "test-dao",
  });
  console.log("create bank");
  // Start the BankExtension deployment and configuration
  await bankFactory.createBank(options.maxExternalTokens);
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await bankFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { bankAddress } = pastEvent.returnValues;
  const bankExtension = await BankExtension.at(bankAddress);
  console.log("add bank to Dao");
  await dao.addExtension(sha3("bank"), bankExtension.address, owner, {
    from: owner,
  });

  console.log("create erc20 extension");
  // Start the Erc20TokenExtension deployment & configuration
  await erc20TokenExtFactory.create(UNITS, erc20TokenDecimals);

  pastEvent = undefined;
  while (pastEvent === undefined) {
    let pastEvents = await erc20TokenExtFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { erc20ExtTokenAddress } = pastEvent.returnValues;
  const erc20TokenExtension = await ERC20Extension.at(erc20ExtTokenAddress);
  console.log("add erc20 extension to dao");
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
    offchainVoting: null,
    batchVoting: null,
  };

  if (options.offchainVoting) {
    const { offchainVoting } = await configureOffchainVoting({
      ...options,
      dao,
      daoFactory,
      votingAddress,
      bankAddress,
    });
    votingHelpers.offchainVoting = offchainVoting;
  }

  // deploy test token contracts (for testing convenience)
  const testContracts = {
    oltToken: null,
    testToken1: null,
    testToken2: null,
    multicall: null,
    pixelNFT: null,
  };

  if (finalize) {
    console.log("finalize dao");
    await dao.finalizeDao({ from: owner });
  }

  return {
    dao: dao,
    adapters: adapters,
    extensions: extensions,
    testContracts: testContracts,
    votingHelpers: votingHelpers,
    factories: { daoFactory, bankFactory, erc20TokenExtFactory },
    wethAddress,
  };
};

const configureOffchainVoting = async ({
  dao,
  daoFactory,
  owner,
  bankAddress,
  votingPeriod,
  gracePeriod,
  OffchainVotingContract,
}) => {
  let offchainVoting = await OffchainVotingContract.at(
    rinkebyContracts.OffchainVoting
  );
  console.log("add offchain voting");
  await daoFactory.updateAdapter(
    dao.address,
    entryDao("voting", offchainVoting, {}),
    { from: owner }
  );

  console.log("configure bank / offchain voting");
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
  console.log("configure offchain voting");
  await offchainVoting.configureDao(
    dao.address,
    votingPeriod,
    gracePeriod,
    10,
    { from: owner }
  );

  return { offchainVoting };
};

const prepareAdapters = async ({
  deployFunction,
  VotingContract,
  ConfigurationContract,
  RagequitContract,
  ManagingContract,
  ManagerContract,
  KycOnboardingContract,
  GuildKickContract,
  DaoRegistryAdapterContract,
  BankAdapterContract,
  CouponOnboardingContract,
  wethAddress,
  chainId,
}) => {
  let voting,
    configuration,
    ragequit,
    managing,
    manager,
    kycOnboarding,
    guildkick,
    daoRegistryAdapter,
    bankAdapter,
    couponOnboarding;

  voting = await VotingContract.at(rinkebyContracts.Voting);
  configuration = await ConfigurationContract.at(
    rinkebyContracts.Configuration
  );
  ragequit = await RagequitContract.at(rinkebyContracts.Ragequit);
  managing = await ManagingContract.at(rinkebyContracts.Managing);
  manager = await ManagerContract.at(rinkebyContracts.Manager);
  kycOnboarding = await KycOnboardingContract.at(
    rinkebyContracts.KycOnboarding
  );
  guildkick = await GuildKickContract.at(rinkebyContracts.GuildKick);
  daoRegistryAdapter = await DaoRegistryAdapterContract.at(
    rinkebyContracts.DaoRegistryAdapter
  );
  // bankAdapter = await BankAdapterContract.at(rinkebyContracts.BankAdapter);
  bankAdapter = await deployFunction(BankAdapterContract);
  couponOnboarding = await CouponOnboardingContract.at(
    rinkebyContracts.CouponOnboarding
  );

  // voting = await VotingContract.new();
  // configuration = await ConfigurationContract.new();
  // ragequit = await RagequitContract.new();
  // managing = await ManagingContract.new();
  // manager = await ManagerContract.new();
  // kycOnboarding = await KycOnboardingContract.new(wethAddress);
  // guildkick = await GuildKickContract.new();
  // daoRegistryAdapter = await DaoRegistryAdapterContract.new();
  // bankAdapter = await BankAdapterContract.new();
  // couponOnboarding = await CouponOnboardingContract.new(chainId);

  return {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    manager,
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
    manager,
    //onboarding,
    kycOnboarding,
    daoRegistryAdapter,
    bankAdapter,
    couponOnboarding,
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
    manager,
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
      manager,
      kycOnboarding,
      daoRegistryAdapter,
      bankAdapter,
      couponOnboarding,
    },
  };
};

const configureDao = async ({
  owner,
  erc20TokenName,
  erc20TokenSymbol,
  daoFactory,
  dao,
  ragequit,
  guildkick,
  managing,
  manager,
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
  maxUnits,
  maxMembers,
  nbUnits,
  votingPeriod,
  gracePeriod,
  couponCreatorAddress,
  fundTargetAddress,
  managerSignerAddress,
  kycPaymentToken,
}) => {
  console.log("add adapters!");
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
      entryDao("manager", manager, {
        SUBMIT_PROPOSAL: true,
        REPLACE_ADAPTER: true,
        ADD_EXTENSION: true,
        REMOVE_EXTENSION: true,
        SET_CONFIGURATION: true,
      }),
      entryDao("kyc-onboarding", kycOnboarding, {
        NEW_MEMBER: true,
      }),
      entryDao("coupon-onboarding", couponOnboarding, {
        ADD_TO_BALANCE: true,
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

  console.log("configure manager");
  await manager.configureDao(dao.address, managerSignerAddress, {
    from: owner,
  });

  console.log("configure bank");
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

  console.log("configure erc20");

  await daoFactory.configureExtension(
    dao.address,
    erc20TokenExtension.address,
    [],
    { from: owner }
  );

  await bankAdapter.configureDao(
    dao.address,
    erc20TokenName,
    erc20TokenSymbol,
    { from: owner }
  );

  console.log("configure kycOnboarding");

  await kycOnboarding.configureDao(
    dao.address,
    couponCreatorAddress,
    unitPrice,
    nbUnits,
    maxChunks,
    maxUnits,
    maxMembers,
    0, // canTopUp default false
    fundTargetAddress,
    kycPaymentToken,
    UNITS,
    {
      from: owner,
    }
  );
  console.log("configure coupon onboarding");
  await couponOnboarding.configureDao(
    dao.address,
    couponCreatorAddress,
    UNITS,
    {
      from: owner,
    }
  );

  console.log("configure voting");

  await voting.configureDao(dao.address, votingPeriod, gracePeriod, {
    from: owner,
  });
};

const cloneDao = async ({ owner, creator, DaoRegistry, DaoFactory, name }) => {
  let daoFactory = await DaoFactory.at(rinkebyContracts.DaoFactory);
  //let daoRegistry = await DaoRegistry.new();
  //let daoFactory = await DaoFactory.new(daoRegistry.address, { from: owner });

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
    name: "mainnet",
    chainId: 1,
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
