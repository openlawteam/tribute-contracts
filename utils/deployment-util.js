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

const { UNITS, LOOT, sha3, toBN } = require("./contract-util");
const { entryDao, entryBank } = require("./access-control");

const embedConfigs = (contractInstance, name, configs) => {
  return {
    ...contractInstance,
    configs: configs.find((c) => c.name === name),
  };
};

const createFactories = async ({
  BankExtension,
  BankFactory,
  ERC1271Extension,
  ERC1271ExtensionFactory,
  NFTExtension,
  NFTCollectionFactory,
  ERC20Extension,
  ERC20TokenExtensionFactory,
  ExecutorExtension,
  ExecutorExtensionFactory,
  InternalTokenVestingExtensionFactory,
  InternalTokenVestingExtension,
  ERC1155TokenExtension,
  ERC1155TokenCollectionFactory,
  deployFunction,
}) => {
  const bankExtFactory = await deployFunction(BankFactory, [BankExtension]);

  const erc1271ExtFactory = await deployFunction(ERC1271ExtensionFactory, [
    ERC1271Extension,
  ]);

  const erc721ExtFactory = await deployFunction(NFTCollectionFactory, [
    NFTExtension,
  ]);

  const erc20ExtFactory = await deployFunction(ERC20TokenExtensionFactory, [
    ERC20Extension,
  ]);

  const executorExtFactory = await deployFunction(ExecutorExtensionFactory, [
    ExecutorExtension,
  ]);

  const erc1155ExtFactory = await deployFunction(
    ERC1155TokenCollectionFactory,
    [ERC1155TokenExtension]
  );

  const vestingExtFactory = await deployFunction(
    InternalTokenVestingExtensionFactory,
    [InternalTokenVestingExtension]
  );
  return {
    bankExtFactory,
    erc20ExtFactory,
    erc721ExtFactory,
    erc1271ExtFactory,
    executorExtFactory,
    erc1155ExtFactory,
    vestingExtFactory,
  };
};

const createExtensions = async ({ dao, factories, options }) => {
  const bankExtension = await createBankExtension(
    dao,
    options.owner,
    factories.bankExtFactory,
    options.BankExtension,
    options.maxExternalTokens,
    options.contractConfigs
  );

  const erc1271Extension = await createERC1271Extension(
    dao,
    options.owner,
    factories.erc1271ExtFactory,
    options.ERC1271Extension,
    options.contractConfigs
  );

  const nftExtension = await createNFTExtension(
    dao,
    options.owner,
    factories.erc721ExtFactory,
    options.NFTExtension,
    options.contractConfigs
  );

  const erc20TokenName = options.erc20TokenName
    ? options.erc20TokenName
    : "Unit Test Tokens";
  const erc20TokenSymbol = options.erc20TokenSymbol
    ? options.erc20TokenSymbol
    : "UTT";
  const erc20TokenDecimals = options.erc20TokenDecimals
    ? parseInt(options.erc20TokenDecimals) || 0
    : 0;

  const erc20TokenExtension = await createERC20Extension(
    dao,
    options.owner,
    factories.erc20ExtFactory,
    erc20TokenName,
    erc20TokenSymbol,
    erc20TokenDecimals,
    options.ERC20Extension,
    options.contractConfigs
  );

  const executorExtension = await createExecutorExtension(
    dao,
    options.owner,
    factories.executorExtFactory,
    options.ExecutorExtension,
    options.contractConfigs
  );

  const internalTokenVestingExtension = await createInternalTokenVestingExtension(
    dao,
    options.owner,
    factories.vestingExtFactory,
    options.InternalTokenVestingExtension,
    options.contractConfigs
  );

  const erc1155TokenExtension = await createERC1155Extension(
    dao,
    options.owner,
    factories.erc1155ExtFactory,
    options.ERC1155TokenExtension,
    options.contractConfigs
  );

  const extensions = {
    bankExt: bankExtension,
    erc20Ext: erc20TokenExtension,
    erc721Ext: nftExtension,
    erc1271Ext: erc1271Extension,
    erc1155Ext: erc1155TokenExtension,
    executorExt: executorExtension,
    vestingExt: internalTokenVestingExtension,
  };

  const missingConfigs = Object.keys(extensions).find(
    (e) => !extensions[e].configs
  );
  if (missingConfigs)
    throw new Error(
      `Missing extension configs for: [${missingConfigs}] extension(s)`
    );
  return extensions;
};

const createAdapters = async ({
  deployFunction,
  VotingContract,
  ConfigurationContract,
  TributeContract,
  TributeNFTContract,
  LendNFTContract,
  ERC20TransferStrategy,
  DistributeContract,
  RagequitContract,
  ManagingContract,
  FinancingContract,
  OnboardingContract,
  GuildKickContract,
  DaoRegistryAdapterContract,
  BankAdapterContract,
  SignaturesContract,
  NFTAdapterContract,
  CouponOnboardingContract,
  ERC1155AdapterContract,
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
    signatures,
    nftAdapter,
    erc1155Adapter,
    couponOnboarding,
    tribute,
    distribute,
    lendNFT,
    erc20TransferStrategy,
    tributeNFT;

  voting = await deployFunction(VotingContract);
  configuration = await deployFunction(ConfigurationContract);
  ragequit = await deployFunction(RagequitContract);
  managing = await deployFunction(ManagingContract);
  financing = await deployFunction(FinancingContract);
  onboarding = await deployFunction(OnboardingContract);
  guildkick = await deployFunction(GuildKickContract);
  daoRegistryAdapter = await deployFunction(DaoRegistryAdapterContract);
  bankAdapter = await deployFunction(BankAdapterContract);
  signatures = await deployFunction(SignaturesContract);
  nftAdapter = await deployFunction(NFTAdapterContract);
  couponOnboarding = await deployFunction(CouponOnboardingContract, [1]);
  tribute = await deployFunction(TributeContract);
  distribute = await deployFunction(DistributeContract);
  tributeNFT = await deployFunction(TributeNFTContract);
  lendNFT = await deployFunction(LendNFTContract);
  erc20TransferStrategy = await deployFunction(ERC20TransferStrategy);
  erc1155Adapter = await deployFunction(ERC1155AdapterContract);

  const adapters = {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    daoRegistryAdapter,
    bankAdapter,
    signatures,
    nftAdapter,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT,
    lendNFT,
    erc20TransferStrategy,
    erc1155Adapter,
  };

  const missingConfigs = Object.keys(adapters).find(
    (a) => !adapters[a].configs
  );

  if (missingConfigs)
    throw new Error(
      `Missing adapter configs for: [${missingConfigs}] adapter(s)`
    );
  return adapters;
};

const addDefaultAdapters = async ({ dao, daoFactory, extensions, options }) => {
  const adapters = await createAdapters(options);

  await configureDao({
    owner: options.owner,
    dao,
    daoFactory,
    extensions,
    adapters,
    options,
  });

  return adapters;
};

const deployDao = async (options) => {
  const {
    deployFunction,
    owner,
    deployTestTokens,
    finalize,
    ERC1155TestToken,
    TestToken1,
    TestToken2,
    Multicall,
    PixelNFT,
    OLToken,
    ProxToken,
  } = options;

  const { dao, daoFactory } = await cloneDao({
    ...options,
    name: options.daoName || "test-dao",
  });

  const factories = await createFactories(options);
  const extensions = await createExtensions({ dao, factories, options });
  const adapters = await addDefaultAdapters({
    dao,
    daoFactory,
    extensions,
    options,
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
      extensions,
    });
    votingHelpers.offchainVoting = offchainVoting;
    votingHelpers.handleBadReporterAdapter = handleBadReporterAdapter;
    votingHelpers.snapshotProposalContract = snapshotProposalContract;
  }

  // deploy test token contracts (for testing convenience)
  const testContracts = {
    oltToken: null,
    testToken1: null,
    testToken2: null,
    multicall: null,
    pixelNFT: null,
    proxToken: null,
    erc1155TestToken: null,
  };

  if (deployTestTokens) {
    testContracts.testToken1 = await deployFunction(TestToken1, [1000000]);
    testContracts.testToken2 = await deployFunction(TestToken2, [1000000]);
    testContracts.multicall = await deployFunction(Multicall);
    testContracts.pixelNFT = await deployFunction(PixelNFT, [100]);
    testContracts.oltToken = await deployFunction(OLToken, [
      toBN("1000000000000000000000000"),
    ]);
    testContracts.proxToken = await deployFunction(ProxToken);
    testContracts.erc1155TestToken = await deployFunction(ERC1155TestToken, [
      "1155 test token",
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
    factories: { ...factories, daoFactory },
  };
};

const configureOffchainVoting = async ({
  dao,
  daoFactory,
  chainId,
  owner,
  offchainAdmin,
  votingAddress,
  votingPeriod,
  gracePeriod,
  SnapshotProposalContract,
  KickBadReporterAdapter,
  OffchainVotingContract,
  OffchainVotingHashContract,
  deployFunction,
  extensions,
}) => {
  const snapshotProposalContract = await deployFunction(
    SnapshotProposalContract,
    [chainId]
  );

  const offchainVotingHashContract = await deployFunction(
    OffchainVotingHashContract,
    [snapshotProposalContract.address]
  );

  const handleBadReporterAdapter = await deployFunction(KickBadReporterAdapter);
  const offchainVoting = await deployFunction(OffchainVotingContract, [
    votingAddress,
    offchainVotingHashContract.address,
    snapshotProposalContract.address,
    handleBadReporterAdapter.address,
    offchainAdmin,
  ]);

  await daoFactory.updateAdapter(dao.address, entryDao(offchainVoting), {
    from: owner,
  });

  await dao.setAclToExtensionForAdapter(
    extensions.bankExt.address,
    offchainVoting.address,
    entryBank(offchainVoting).flags,
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

const configureDao = async ({
  owner,
  dao,
  daoFactory,
  extensions,
  adapters,
  options,
}) => {
  const configureAdaptersWithDAOAccess = async () => {
    const adaptersWithAccess = Object.values(adapters)
      .filter((a) => a.configs.enabled)
      .filter((a) => a.configs.acls.dao)
      .reduce((withAccess, adapter) => {
        withAccess.push(entryDao(adapter));
        return withAccess;
      }, []);

    // If an extension needs access to other extension,
    // the extension needs to be added as an adapter to the DAO,
    // but without any ACL flag enabled.
    const contractsWithAccess = Object.values(extensions)
      .filter((e) => e.configs.enabled)
      .filter((e) => Object.keys(e.configs.acls.extensions).length > 0)
      .reduce((withAccess, extension) => {
        withAccess.push(entryDao(extension));
        return withAccess;
      }, adaptersWithAccess);

    await daoFactory.addAdapters(dao.address, contractsWithAccess, {
      from: owner,
    });
  };

  const configureAdaptersWithDAOParameters = async () => {
    if (adapters.onboarding) {
      await adapters.onboarding.configureDao(
        dao.address,
        UNITS,
        options.unitPrice,
        options.nbUnits,
        options.maxChunks,
        options.tokenAddr,
        {
          from: owner,
        }
      );

      await adapters.onboarding.configureDao(
        dao.address,
        LOOT,
        options.unitPrice,
        options.nbUnits,
        options.maxChunks,
        options.tokenAddr,
        {
          from: owner,
        }
      );
    }
    if (adapters.couponOnboarding)
      await adapters.couponOnboarding.configureDao(
        dao.address,
        options.couponCreatorAddress,
        extensions.erc20Ext.address,
        UNITS,
        options.maxAmount,
        {
          from: owner,
        }
      );

    if (adapters.voting)
      await adapters.voting.configureDao(
        dao.address,
        options.votingPeriod,
        options.gracePeriod,
        {
          from: owner,
        }
      );

    if (adapters.tribute) {
      await adapters.tribute.configureDao(dao.address, UNITS, {
        from: owner,
      });
      await adapters.tribute.configureDao(dao.address, LOOT, {
        from: owner,
      });
    }

    if (adapters.tributeNFT) {
      await adapters.tributeNFT.configureDao(dao.address, {
        from: owner,
      });
    }
  };

  const configureExtensionAccess = async (contracts, extension) => {
    const withAccess = Object.values(contracts).reduce(
      (accessRequired, contract) => {
        accessRequired.push(extension.configs.buildAclFlag(contract));
        return accessRequired;
      },
      []
    );

    if (withAccess.length > 0)
      await daoFactory.configureExtension(
        dao.address,
        extension.address,
        withAccess,
        { from: owner }
      );
  };

  /**
   * Configures all the adapters that need access to the DAO and each enabled extension
   */
  const configureAdapters = async () => {
    await configureAdaptersWithDAOAccess();
    await configureAdaptersWithDAOParameters();

    Object.values(extensions)
      .filter((targetExtension) => targetExtension.configs.enabled)
      .forEach((targetExtension) => {
        // Filters the enabled adapters that have access to the targetExtension
        const contracts = Object.values(adapters)
          .filter((a) => a.configs.enabled)
          .filter((a) =>
            // The adapters must have at least 1 ACL flag defined to access the targetExtension
            Object.keys(a.configs.acls.extensions).some(
              (extId) => extId === targetExtension.configs.id
            )
          );

        configureExtensionAccess(contracts, targetExtension);
      });
  };

  /**
   * Configures all the extensions that need access to
   * other enabled extensions
   */
  const configureExtensions = () => {
    Object.values(extensions)
      .filter((targetExtension) => targetExtension.configs.enabled)
      .forEach(async (targetExtension) => {
        // Filters the enabled extensions that have access to the targetExtension
        const contracts = Object.values(extensions)
          .filter((e) => e.configs.enabled)
          .filter((e) => e.configs.id !== targetExtension.configs.id)
          .filter((e) =>
            // The other extensions must have at least 1 ACL flag defined to access the targetExtension
            Object.keys(e.configs.acls.extensions).some(
              (extId) => extId === targetExtension.configs.id
            )
          );

        configureExtensionAccess(contracts, targetExtension);
      });
  };

  configureAdapters();
  configureExtensions();
};

const cloneDao = async ({
  owner,
  creator,
  deployFunction,
  DaoRegistry,
  DaoFactory,
  name,
}) => {
  let daoFactory = await deployFunction(DaoFactory, [DaoRegistry], owner);

  await daoFactory.createDao(name, creator ? creator : owner, { from: owner });

  let _address = await daoFactory.getDaoAddress(name);
  let newDao = await DaoRegistry.at(_address);
  return { dao: newDao, daoFactory, daoName: name };
};

const createBankExtension = async (
  dao,
  owner,
  bankFactory,
  BankExtension,
  maxExternalTokens,
  contractConfigs
) => {
  await bankFactory.createBank(maxExternalTokens);
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await bankFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { bankAddress } = pastEvent.returnValues;
  const bankExtension = await BankExtension.at(bankAddress);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("bank"), bankExtension.address, owner, {
    from: owner,
  });

  return embedConfigs(bankExtension, "BankExtension", contractConfigs);
};

const createERC1271Extension = async (
  dao,
  owner,
  erc1271Factory,
  ERC1271Extension,
  contractConfigs
) => {
  await erc1271Factory.create();
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await erc1271Factory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { erc1271Address } = pastEvent.returnValues;
  const erc1271Extension = await ERC1271Extension.at(erc1271Address);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("erc1271"), erc1271Extension.address, owner, {
    from: owner,
  });

  return embedConfigs(erc1271Extension, "ERC1271Extension", contractConfigs);
};

const createNFTExtension = async (
  dao,
  owner,
  nftFactory,
  NFTExtension,
  contractConfigs
) => {
  await nftFactory.createNFTCollection();
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await nftFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { nftCollAddress } = pastEvent.returnValues;
  const nftExtension = await NFTExtension.at(nftCollAddress);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("nft"), nftCollAddress, owner, {
    from: owner,
  });

  return embedConfigs(nftExtension, "NFTExtension", contractConfigs);
};

const createERC20Extension = async (
  dao,
  owner,
  erc20TokenExtFactory,
  erc20TokenName,
  erc20TokenSymbol,
  erc20TokenDecimals,
  ERC20Extension,
  contractConfigs
) => {
  await erc20TokenExtFactory.create(
    erc20TokenName,
    UNITS,
    erc20TokenSymbol,
    erc20TokenDecimals
  );
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await erc20TokenExtFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { erc20ExtTokenAddress } = pastEvent.returnValues;
  const erc20TokenExtension = await ERC20Extension.at(erc20ExtTokenAddress);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("erc20-ext"), erc20ExtTokenAddress, owner, {
    from: owner,
  });
  return embedConfigs(erc20TokenExtension, "ERC20Extension", contractConfigs);
};

const createExecutorExtension = async (
  dao,
  owner,
  executorExtensionFactory,
  ExecutorExtension,
  contractConfigs
) => {
  await executorExtensionFactory.create();
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await executorExtensionFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { executorAddress } = pastEvent.returnValues;
  const executorExtension = await ExecutorExtension.at(executorAddress);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("executor-ext"), executorAddress, owner, {
    from: owner,
  });
  return embedConfigs(executorExtension, "ExecutorExtension", contractConfigs);
};

const createInternalTokenVestingExtension = async (
  dao,
  owner,
  factory,
  contract,
  contractConfigs
) => {
  await factory.create();
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await factory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { addr } = pastEvent.returnValues;
  const vestingExtension = await contract.at(addr);

  // Adds the new extension to the DAO
  await dao.addExtension(
    sha3("internal-token-vesting-ext"),
    vestingExtension.address,
    owner,
    {
      from: owner,
    }
  );
  return embedConfigs(
    vestingExtension,
    "InternalTokenVestingExtension",
    contractConfigs
  );
};

const createERC1155Extension = async (
  dao,
  owner,
  erc1155TokenExtFactory,
  ERC1155TokenExtension,
  contractConfigs
) => {
  await erc1155TokenExtFactory.createERC1155Collection();
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await erc1155TokenExtFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { nftCollAddress } = pastEvent.returnValues;
  const erc1155TokenExtension = await ERC1155TokenExtension.at(nftCollAddress);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("erc1155-ext"), nftCollAddress, owner, {
    from: owner,
  });
  return embedConfigs(
    erc1155TokenExtension,
    "ERC1155TokenExtension",
    contractConfigs
  );
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
  {
    name: "mainnet",
    chainId: 1,
  },
];

const getNetworkDetails = (name) => {
  return networks.find((n) => n.name === name);
};

module.exports = {
  deployDao,
  cloneDao,
  prepareAdapters: createAdapters,
  addDefaultAdapters,
  getNetworkDetails,
};
