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

const { entryDao, entryBank } = require("./access-control-util");
const { adaptersIdsMap, extensionsIdsMap } = require("./dao-ids-util");
const {
  UNITS,
  LOOT,
  ZERO_ADDRESS,
  sha3,
  embedConfigs,
  encodePacked,
  getAddress,
  waitTx,
} = require("./contract-util.js");
const { debug, info, error } = require("./log-util");
const { ContractType } = require("../configs/contracts.config");

/**
 * Deploys a contract based on the contract name defined in the config parameter.
 * If the contract is not found in the options object the deployment reverts with an error.
 */
const deployContract = ({ config, options }) => {
  const contract = options[config.name];
  if (!contract)
    throw new Error(`Contract ${config.name} not found in environment options`);

  if (config.deploymentArgs && config.deploymentArgs.length > 0) {
    const args = config.deploymentArgs.map((argName) => {
      const arg = options[argName];
      if (arg !== null && arg !== undefined) return arg;
      throw new Error(
        `Missing deployment argument <${argName}> for ${config.name}`
      );
    });
    return options.deployFunction(contract, args);
  }
  return options.deployFunction(contract);
};

/**
 * Deploys all the contracts defined with Factory type.
 * The contracts must be enabled in the configs/networks/*.config.ts,
 * and should not be skipped in the auto deploy process.
 * The factory contract must be provided in the options object.
 * If the contract is not found in the options object the deployment reverts with an error.
 */
const createFactories = async ({ options }) => {
  const factories = {};
  const factoryList = Object.values(options.contractConfigs)
    .filter((config) => config.type === ContractType.Factory)
    .filter((config) => config.enabled)
    .filter((config) => !config.skipAutoDeploy);

  debug("deploying or reusing ", factoryList.length, " factories...");
  await factoryList.reduce((p, config) => {
    return p.then((_) => {
      const factoryContract = options[config.name];
      if (!factoryContract)
        throw new Error(`Missing factory contract ${config.name}`);

      const extensionConfig = options.contractConfigs.find(
        (c) => c.id === config.generatesExtensionId
      );
      if (!extensionConfig)
        throw new Error(
          `Missing extension config ${config.generatesExtensionId}`
        );

      const extensionContract = options[extensionConfig.name];
      if (!extensionContract)
        throw new Error(`Missing extension contract ${extensionConfig.name}`);

      return options
        .deployFunction(factoryContract, [extensionContract])
        .then((factory) => (factories[factory.configs.alias] = factory))
        .catch((err) => {
          error(`Failed factory deployment [${config.name}]. `, err);
          throw err;
        });
    });
  }, Promise.resolve());

  return factories;
};

/**
 * Deploys all the contracts defined with Extension type.
 * The contracts must be enabled in the configs/networks/*.config.ts,
 * and should not be skipped in the auto deploy process.
 * The extension contract must be provided in the options object.
 * If the contract is not found in the options object the deployment reverts with an error.
 * In order to deploy the extension it uses the factory contract of each extension,
 * so the factories must be deployed first.
 */
const createExtensions = async ({ dao, factories, options }) => {
  const extensions = {};
  debug("create extensions ...");
  const createExtension = async ({ dao, factory, options }) => {
    debug("create extension ", factory.configs.alias);
    const factoryConfigs = factory.configs;
    const extensionConfigs = options.contractConfigs.find(
      (c) => c.id === factoryConfigs.generatesExtensionId
    );
    if (!extensionConfigs)
      throw new Error(
        `Missing extension configuration <generatesExtensionId> for in ${factoryConfigs.name} configs`
      );

    let tx;
    if (
      factoryConfigs.deploymentArgs &&
      factoryConfigs.deploymentArgs.length > 0
    ) {
      const args = factoryConfigs.deploymentArgs.map((argName) => {
        const arg = options[argName];
        if (arg !== null && arg !== undefined) return arg;
        throw new Error(
          `Missing deployment argument <${argName}> in ${factoryConfigs.name}.create`
        );
      });
      tx = await factory.create(...args);
    } else {
      tx = await factory.create();
    }
    /**
     * The tx event is the safest way to read the new extension address.
     * Event at index 0 indicates the extension was created
     * Arg at index 1 represents the new extension address
     */
    let extensionAddress;
    if (tx.wait) {
      const res = await tx.wait();
      extensionAddress = res.events[0].args[1];
    } else {
      const { logs } = tx;
      extensionAddress = logs[0].args[1];
    }
    const extensionInterface = options[extensionConfigs.name];
    if (!extensionInterface)
      throw new Error(
        `Extension contract not found for ${extensionConfigs.name}`
      );

    const newExtension = embedConfigs(
      await options.attachFunction(extensionInterface, extensionAddress),
      extensionInterface.contractName,
      options.contractConfigs
    );

    if (!newExtension || !newExtension.configs)
      throw new Error(
        `Unable to embed extension configs for ${extensionConfigs.name}`
      );

    await waitTx(
      dao.addExtension(
        sha3(newExtension.configs.id),
        newExtension.address,
        options.owner
      )
    );

    info(`
    Extension enabled '${newExtension.configs.name}'
    -------------------------------------------------
     contract address: ${newExtension.address}
     creator address:  ${options.owner}`);

    return newExtension;
  };

  await Object.values(factories).reduce(
    (p, factory) =>
      p
        .then(() =>
          createExtension({
            dao,
            factory,
            options,
          })
        )
        .then((ext) => (extensions[ext.configs.alias] = ext))
        .catch((err) => {
          error(`Failed extension deployment ${factory.configs.name}. `, err);
          throw err;
        }),
    Promise.resolve()
  );
  return extensions;
};

/**
 * Deploys all the contracts defined with Adapter type.
 * The contracts must be enabled in the configs/networks/*.config.ts,
 * and should not be skipped in the auto deploy process.
 * The adapter contract must be provided in the options object.
 * If the contract is not found in the options object the deployment reverts with an error.
 */
const createAdapters = async ({ options }) => {
  const adapters = {};
  const adapterList = Object.values(options.contractConfigs)
    .filter((config) => config.type === ContractType.Adapter)
    .filter((config) => config.enabled)
    .filter((config) => !config.skipAutoDeploy);

  debug("deploying or re-using ", adapterList.length, " adapters...");
  await adapterList.reduce(
    (p, config) =>
      p
        .then(() => deployContract({ config, options }))
        .then((adapter) => (adapters[adapter.configs.alias] = adapter))
        .catch((err) => {
          error(`Error while creating adapter ${config.name}. `, err);
          throw err;
        }),
    Promise.resolve()
  );

  return adapters;
};

/**
 * Deploys all the utility contracts defined with Util type.
 * The contracts must be enabled in the configs/networks/*.config.ts,
 * and should not be skipped in the auto deploy process.
 * The util contract must be provided in the options object.
 * If the contract is not found in the options object the deployment reverts with an error.
 */
const createUtilContracts = async ({ options }) => {
  const utilContracts = {};

  await Object.values(options.contractConfigs)
    .filter((config) => config.type === ContractType.Util)
    .filter((config) => config.enabled)
    .filter((config) => !config.skipAutoDeploy)
    .reduce(
      (p, config) =>
        p
          .then(() => deployContract({ config, options }))
          .then(
            (utilContract) =>
              (utilContracts[utilContract.configs.alias] = utilContract)
          )
          .catch((err) => {
            error(`Error while creating util contract ${config.name}. `, err);
            throw err;
          }),
      Promise.resolve()
    );
  return utilContracts;
};

/**
 * Deploys all the test contracts defined with Test type if flag `deployTestTokens`
 * is enabled in the options. The contracts must be enabled in the configs/networks/*.config.ts,
 * and should not be skipped in the auto deploy process.
 * The test contract must be provided in the options object.
 * If the contract is not found in the options object the deployment reverts with an error.
 */
const createTestContracts = async ({ options }) => {
  const testContracts = {};

  if (!options.deployTestTokens) return testContracts;

  await Object.values(options.contractConfigs)
    .filter((config) => config.type === ContractType.Test)
    .filter((config) => config.enabled)
    .filter((config) => !config.skipAutoDeploy)
    .reduce(
      (p, config) =>
        p
          .then(() => deployContract({ config, options }))
          .then(
            (testContract) =>
              (testContracts[testContract.configs.alias] = testContract)
          )
          .catch((err) => {
            error(`Error while creating test contract ${config.name}. `, err);
            throw err;
          }),
      Promise.resolve()
    );
  return testContracts;
};

/**
 * Creates the governance config roles in the DAO Registry based on the contract configs.governanceRoles.
 */
const createGovernanceRoles = async ({ options, dao, adapters }) => {
  const readConfigValue = (configName, contractName) => {
    const configValue = options[configName];
    if (!configValue)
      throw new Error(
        `Error while creating governance role [${configName}] for ${contractName}`
      );
    return configValue;
  };

  await Object.values(options.contractConfigs)
    .filter((c) => c.enabled)
    .filter((c) => c.governanceRoles)
    .reduce((p, c) => {
      const roles = Object.keys(c.governanceRoles);
      return p.then(() =>
        roles.reduce(
          (q, role) =>
            q.then(async () => {
              const adapter = Object.values(adapters).find(
                (a) => a.configs.name === c.name
              );
              const configKey = sha3(
                encodePacked(
                  role.replace("$contractAddress", ""),
                  getAddress(adapter.address)
                )
              );
              const configValue = getAddress(
                readConfigValue(c.governanceRoles[role], c.name)
              );
              return await waitTx(
                dao.setAddressConfiguration(configKey, configValue)
              );
            }),
          Promise.resolve()
        )
      );
    }, Promise.resolve());

  if (options.defaultMemberGovernanceToken) {
    const configKey = sha3(encodePacked("governance.role.default"));
    await waitTx(
      dao.setAddressConfiguration(
        configKey,
        getAddress(options.defaultMemberGovernanceToken)
      )
    );
  }
};

const validateContractConfigs = (contractConfigs) => {
  if (!contractConfigs) throw Error(`Missing contract configs`);

  const found = new Map();
  Object.values(contractConfigs)
    .filter(
      (c) =>
        c.type === ContractType.Adapter &&
        c.id !== adaptersIdsMap.VOTING_ADAPTER
    )
    .forEach((c) => {
      const current = found.get(c.id);
      if (current) {
        throw Error(`Duplicate contract Id detected: ${c.id}`);
      }
      found.set(c.id, true);
    });
};

/**
 * Deploys all the contracts defined in the configs/contracts.config.ts.
 * The contracts must be enabled in the configs/networks/*.config.ts,
 * and should not be skipped in the auto deploy process.
 * Each one of the contracts must be provided in the options object.
 * If the contract is not found in the options object the deployment reverts with an error.
 * It also configures the DAO with the proper access, and configuration parameters for all
 * adapters and extensions.
 *
 * The Offchain voting is deployed only if it is required via options.offchainVoting parameter.
 *
 * All the deployed contracts will be returned in a map with the aliases defined in the
 * configs/networks/*.config.ts.
 */
const deployDao = async (options) => {
  validateContractConfigs(options.contractConfigs);

  const { dao, daoFactory } = await cloneDao({
    ...options,
    name: options.daoName || "test-dao",
  });

  options = {
    ...options,
    daoAddress: dao.address,
    unitTokenToMint: UNITS,
    lootTokenToMint: LOOT,
  };

  const factories = await createFactories({ options });
  const extensions = await createExtensions({ dao, factories, options });
  const adapters = await createAdapters({
    dao,
    daoFactory,
    extensions,
    options,
  });

  await createGovernanceRoles({ options, dao, adapters });

  await configureDao({
    owner: options.owner,
    dao,
    daoFactory,
    extensions,
    adapters,
    options,
  });

  const votingHelpers = await configureOffchainVoting({
    ...options,
    dao,
    daoFactory,
    extensions,
  });

  // If the offchain contract was created, set it to the adapters map using the alias
  if (votingHelpers.offchainVoting) {
    adapters[votingHelpers.offchainVoting.configs.alias] =
      votingHelpers.offchainVoting;
  }

  // deploy utility contracts
  const utilContracts = await createUtilContracts({ options });

  // deploy test token contracts for testing convenience
  const testContracts = await createTestContracts({ options });

  if (options.finalize) {
    await waitTx(dao.finalizeDao());
  }

  return {
    dao: dao,
    adapters: adapters,
    extensions: extensions,
    testContracts: testContracts,
    utilContracts: utilContracts,
    votingHelpers: votingHelpers,
    factories: { ...factories, daoFactory },
    owner: options.owner,
  };
};

/**
 * Creates an instance of the DAO based of the DaoFactory contract.
 * Returns the new DAO instance, and dao name.
 */
const cloneDao = async ({
  owner,
  creator,
  deployFunction,
  attachFunction,
  DaoRegistry,
  DaoFactory,
  name,
}) => {
  const daoFactory = await deployFunction(DaoFactory, [DaoRegistry]);
  await waitTx(daoFactory.createDao(name, creator ? creator : owner));
  const daoAddress = await daoFactory.getDaoAddress(name);
  if (daoAddress === ZERO_ADDRESS) throw Error("Invalid dao address");
  const daoInstance = await attachFunction(DaoRegistry, daoAddress);
  return { dao: daoInstance, daoFactory, daoName: name };
};

/**
 * Configures an instance of the DAO to work with the provided factories, extension, and adapters.
 * It ensures that every extension and adapter has the correct ACL Flags enabled to be able to communicate
 * with the DAO instance.
 * Adapters can communicate with the DAO registry, with different extensions or even other adapters.
 * Extensions can communicate with the DAO registry, other extensions and adapters.
 */
const configureDao = async ({
  dao,
  daoFactory,
  extensions,
  adapters,
  options,
}) => {
  debug("configure new dao ...");
  const configureAdaptersWithDAOAccess = async () => {
    debug("configure adapters with access");

    // If an adapter needs access to the DAO registry or to any enabled Extension,
    // it needs to be added to the DAO with the correct ACL flags.
    const adaptersWithAccess = Object.values(adapters)
      .filter((a) => a.configs.enabled)
      .filter((a) => !a.configs.skipAutoDeploy)
      .filter((a) => a.configs.acls.dao);

    await adaptersWithAccess.reduce((p, a) => {
      info(`
        Adapter configured '${a.configs.name}'
        -------------------------------------------------
         contract address: ${a.address}
         contract acls: ${JSON.stringify(a.configs.acls)}`);

      return p.then(
        async () =>
          await waitTx(
            daoFactory.addAdapters(dao.address, [
              entryDao(a.configs.id, a.address, a.configs.acls),
            ])
          )
      );
    }, Promise.resolve());

    // If an extension needs access to other extension,
    // that extension needs to be added to the DAO as an adapter contract,
    // but without any ACL flag enabled.
    const extensionsWithAccess = Object.values(extensions)
      .filter((e) => e.configs.enabled)
      .filter((a) => !a.configs.skipAutoDeploy)
      .filter((e) => Object.keys(e.configs.acls.extensions).length > 0);

    await extensionsWithAccess.reduce((p, e) => {
      info(`
        Extension configured '${e.configs.name}'
        -------------------------------------------------
         contract address: ${e.address}
         contract acls: ${JSON.stringify(e.configs.acls)}`);

      return p.then(
        async () =>
          await waitTx(
            daoFactory.addAdapters(dao.address, [
              entryDao(e.configs.id, e.address, e.configs.acls),
            ])
          )
      );
    }, Promise.resolve());
  };

  const configureAdaptersWithDAOParameters = async () => {
    debug("configure adapters ...");
    const readConfigValue = (configName, contractName) => {
      // 1st check for configs that are using extension addresses
      if (Object.values(extensionsIdsMap).includes(configName)) {
        const extension = Object.values(extensions).find(
          (e) => e.configs.id === configName
        );
        if (!extension || !extension.address)
          throw new Error(
            `Error while configuring dao parameter [${configName}] for ${contractName}. Extension not found.`
          );
        return extension.address;
      }
      // 2nd lookup for configs in the options object
      const configValue = options[configName];
      if (!configValue)
        throw new Error(
          `Error while configuring dao parameter [${configName}] for ${contractName}. Config not found.`
        );
      return configValue;
    };

    const adapterList = Object.values(adapters)
      .filter((a) => a.configs.enabled)
      .filter((a) => !a.configs.skipAutoDeploy)
      .filter((a) => a.configs.daoConfigs && a.configs.daoConfigs.length > 0);

    await adapterList.reduce(async (p, adapter) => {
      const contractConfigs = adapter.configs;
      return await p.then(() =>
        contractConfigs.daoConfigs.reduce(
          (q, configEntry) =>
            q.then(async () => {
              const configValues = configEntry.map((configName) =>
                readConfigValue(configName, contractConfigs.name)
              );
              const p = adapter.configureDao(...configValues).catch((err) => {
                error(
                  `Error while configuring dao with contract ${contractConfigs.name}. `,
                  err
                );
                throw err;
              });
              return await waitTx(p);
            }),
          Promise.resolve()
        )
      );
    }, Promise.resolve());
  };

  const configureExtensionAccess = async (contracts, extension) => {
    debug("configure extension access for ", extension.configs.alias);
    const withAccess = Object.values(contracts).reduce((accessRequired, c) => {
      const configs = c.configs;
      accessRequired.push(
        extension.configs.buildAclFlag(c.address, configs.acls)
      );
      return accessRequired;
    }, []);

    if (withAccess.length > 0)
      await waitTx(
        daoFactory.configureExtension(
          dao.address,
          extension.address,
          withAccess
        )
      );
  };

  /**
   * Configures all the adapters that need access to the DAO and each enabled extension
   */
  const configureAdapters = async () => {
    debug("configure adapters ...");
    await configureAdaptersWithDAOAccess();
    await configureAdaptersWithDAOParameters();
    const extensionsList = Object.values(extensions)
      .filter((targetExtension) => targetExtension.configs.enabled)
      .filter((targetExtension) => !targetExtension.configs.skipAutoDeploy);

    await extensionsList.reduce((p, targetExtension) => {
      // Filters the enabled adapters that have access to the targetExtension
      const contracts = Object.values(adapters)
        .filter((a) => a.configs.enabled)
        .filter((a) => !a.configs.skipAutoDeploy)
        .filter((a) =>
          // The adapters must have at least 1 ACL flag defined to access the targetExtension
          Object.keys(a.configs.acls.extensions).some(
            (extId) => extId === targetExtension.configs.id
          )
        );

      return p
        .then(() => configureExtensionAccess(contracts, targetExtension))
        .catch((err) => {
          error(
            `Error while configuring adapters access to extension ${targetExtension.configs.name}. `,
            err
          );
          throw err;
        });
    }, Promise.resolve());
  };

  /**
   * Configures all the extensions that need access to
   * other enabled extensions
   */
  const configureExtensions = async () => {
    debug("configure extensions ...");
    const extensionsList = Object.values(extensions).filter(
      (targetExtension) => targetExtension.configs.enabled
    );

    await extensionsList.reduce((p, targetExtension) => {
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

      return p
        .then(() => configureExtensionAccess(contracts, targetExtension))
        .catch((err) => {
          error(
            `Error while configuring extensions access to extension ${targetExtension.configs.name}. `
          );
          throw err;
        });
    }, Promise.resolve());
  };

  await configureAdapters();
  await configureExtensions();
};

/**
 * If the flag `flag options.offchainVoting` is enabled, it deploys and configures all the
 * contracts required to enable the Offchain voting adapter.
 */
const configureOffchainVoting = async ({
  dao,
  daoFactory,
  offchainVoting,
  offchainAdmin,
  votingPeriod,
  gracePeriod,
  SnapshotProposalContract,
  KickBadReporterAdapter,
  OffchainVotingContract,
  OffchainVotingHashContract,
  OffchainVotingHelperContract,
  deployFunction,
  extensions,
}) => {
  debug("configuring offchain voting...");
  const votingHelpers = {
    snapshotProposalContract: null,
    handleBadReporterAdapter: null,
    offchainVoting: null,
  };

  // Offchain voting is disabled
  if (!offchainVoting) return votingHelpers;
  const currentVotingAdapterAddress = await dao.getAdapterAddress(
    sha3(adaptersIdsMap.VOTING_ADAPTER)
  );

  const snapshotProposalContract = await deployFunction(
    SnapshotProposalContract
  );

  const offchainVotingHashContract = await deployFunction(
    OffchainVotingHashContract,
    [snapshotProposalContract.address]
  );

  const offchainVotingHelper = await deployFunction(
    OffchainVotingHelperContract,
    [offchainVotingHashContract.address]
  );

  const handleBadReporterAdapter = await deployFunction(KickBadReporterAdapter);
  const offchainVotingContract = await deployFunction(OffchainVotingContract, [
    currentVotingAdapterAddress,
    offchainVotingHashContract.address,
    offchainVotingHelper.address,
    snapshotProposalContract.address,
    handleBadReporterAdapter.address,
    offchainAdmin,
  ]);

  await waitTx(
    daoFactory.updateAdapter(
      dao.address,
      entryDao(
        offchainVotingContract.configs.id,
        offchainVotingContract.address,
        offchainVotingContract.configs.acls
      )
    )
  );

  await waitTx(
    dao.setAclToExtensionForAdapter(
      extensions.bankExt.address,
      offchainVotingContract.address,
      entryBank(
        offchainVotingContract.address,
        offchainVotingContract.configs.acls
      ).flags
    )
  );

  await waitTx(
    offchainVotingContract.configureDao(
      dao.address,
      votingPeriod,
      gracePeriod,
      10
    )
  );

  votingHelpers.offchainVoting = offchainVotingContract;
  votingHelpers.handleBadReporterAdapter = handleBadReporterAdapter;
  votingHelpers.snapshotProposalContract = snapshotProposalContract;

  return votingHelpers;
};

module.exports = {
  createFactories,
  createExtensions,
  createAdapters,
  deployDao,
  cloneDao,
};
