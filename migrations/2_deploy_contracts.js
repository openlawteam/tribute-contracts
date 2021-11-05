const log = console.log;
const fs = require("fs");
const path = require("path");

const {
  toBN,
  toWei,
  ETH_TOKEN,
  UNITS,
  maximumChunks,
  unitPrice,
  numberOfUnits,
  maxAmount,
} = require("../utils/contract-util");

const { deployDao, getNetworkDetails } = require("../utils/deployment-util");
const { deployConfigs } = require("../deploy-config");
require("dotenv").config();

module.exports = async (deployer, network, accounts) => {
  log(`Deployment started at: ${new Date().toISOString()}`);
  log(`Deploying tribute-contracts to ${network} network`);

  const { contracts } = require(`./configs/${network}.config`);
  const truffleImports = require("../utils/truffle-util")(contracts);
  const daoArtifacts = await getOrCreateDaoArtifacts(deployer, truffleImports);

  const deployFunction = truffleImports.deployFunctionFactory(
    deployer,
    daoArtifacts
  );

  const result = await deploy({
    network,
    deployFunction,
    truffleImports,
    accounts,
    contracts,
  });

  const { dao, factories, extensions, adapters, testContracts, utilContracts } =
    result;
  if (dao) {
    await dao.finalizeDao();
    log("************************************************");
    log(`DaoOwner: ${process.env.DAO_OWNER_ADDR}`);
    log(`DaoRegistry: ${dao.address}`);
    const addresses = {};
    Object.values(factories)
      .concat(Object.values(extensions))
      .concat(Object.values(adapters))
      .concat(Object.values(testContracts))
      .concat(Object.values(utilContracts))
      .forEach((c) => {
        log(`${c.configs.name}: ${c.address}`);
        addresses[c.configs.name] = c.address;
      });
    saveDeployedContracts(network, addresses);
  } else {
    log("************************************************");
    log("no migration for network " + network);
    log("************************************************");
  }
  log(`Deployment completed at: ${new Date().toISOString()}`);
};

const deployRinkebyDao = async (
  deployFunction,
  network,
  truffleImports,
  contractConfigs
) => {
  const envVars = checkEnvVariable(
    "DAO_NAME",
    "DAO_OWNER_ADDR",
    "ERC20_TOKEN_NAME",
    "ERC20_TOKEN_SYMBOL",
    "ERC20_TOKEN_DECIMALS"
  );

  return await deployDao({
    ...truffleImports,
    contractConfigs,
    deployFunction,
    maxAmount,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: envVars.ERC20_TOKEN_NAME,
    erc20TokenSymbol: envVars.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: envVars.ERC20_TOKEN_DECIMALS,
    erc20TokenAddress: UNITS,
    maxChunks: toBN("100000"),
    votingPeriod: envVars.VOTING_PERIOD_SECONDS
      ? parseInt(envVars.VOTING_PERIOD_SECONDS)
      : 600, // 600 secs = 10 mins,
    gracePeriod: envVars.GRACE_PERIOD_SECONDS
      ? parseInt(envVars.GRACE_PERIOD_SECONDS)
      : 600, // 600 secs = 10 mins
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,

    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: envVars.COUPON_CREATOR_ADDR
      ? envVars.COUPON_CREATOR_ADDR
      : envVars.DAO_OWNER_ADDR,
    daoName: envVars.DAO_NAME,
    owner: envVars.DAO_OWNER_ADDR,
    offchainAdmin: envVars.OFFCHAIN_ADMIN_ADDR
      ? envVars.OFFCHAIN_ADMIN_ADDR
      : "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
    deployTestTokens: true,
    supplyTestToken1: 1000000,
    supplyTestToken2: 1000000,
    supplyPixelNFT: 100,
    supplyOLToken: toBN("1000000000000000000000000"),
    erc1155TestTokenUri: "1155 test token",
  });
};

const deployMainnetDao = async (
  deployFunction,
  network,
  truffleImports,
  contractConfigs
) => {
  const envVars = checkEnvVariable(
    "DAO_NAME",
    "DAO_OWNER_ADDR",
    "ERC20_TOKEN_NAME",
    "ERC20_TOKEN_SYMBOL",
    "ERC20_TOKEN_DECIMALS",
    "COUPON_CREATOR_ADDR",
    "OFFCHAIN_ADMIN_ADDR",
    "VOTING_PERIOD_SECONDS",
    "GRACE_PERIOD_SECONDS"
  );

  return await deployDao({
    ...truffleImports,
    contractConfigs,
    deployFunction,
    maxAmount,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: envVars.ERC20_TOKEN_NAME,
    erc20TokenSymbol: envVars.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: envVars.ERC20_TOKEN_DECIMALS,
    erc20TokenAddress: UNITS,
    maxChunks: toBN("100000"),
    votingPeriod: parseInt(envVars.VOTING_PERIOD_SECONDS),
    gracePeriod: parseInt(envVars.GRACE_PERIOD_SECONDS),
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: envVars.COUPON_CREATOR_ADDR,
    daoName: envVars.DAO_NAME,
    owner: envVars.DAO_OWNER_ADDR,
    offchainAdmin: envVars.OFFCHAIN_ADMIN_ADDR,
  });
};

const deployGanacheDao = async (
  deployFunction,
  network,
  accounts,
  truffleImports,
  contractConfigs
) => {
  const envVars = checkEnvVariable(
    "DAO_NAME",
    "ERC20_TOKEN_NAME",
    "ERC20_TOKEN_SYMBOL",
    "ERC20_TOKEN_DECIMALS"
  );

  return await deployDao({
    ...truffleImports,
    contractConfigs,
    deployFunction,
    maxAmount,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: envVars.ERC20_TOKEN_NAME,
    erc20TokenSymbol: envVars.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: envVars.ERC20_TOKEN_DECIMALS,
    erc20TokenAddress: UNITS,
    maxChunks: toBN("100000"),
    votingPeriod: envVars.VOTING_PERIOD_SECONDS
      ? parseInt(envVars.VOTING_PERIOD_SECONDS)
      : 120, // 120 secs = 2 mins
    gracePeriod: envVars.GRACE_PERIOD_SECONDS
      ? parseInt(envVars.GRACE_PERIOD_SECONDS)
      : 60, // 60 secs = 1 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: envVars.COUPON_CREATOR_ADDR
      ? envVars.COUPON_CREATOR_ADDR
      : accounts[0],
    daoName: envVars.DAO_NAME,
    owner: accounts[0],
    offchainAdmin: envVars.OFFCHAIN_ADMIN_ADDR
      ? envVars.OFFCHAIN_ADMIN_ADDR
      : "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
    deployTestTokens: true,
    supplyTestToken1: 1000000,
    supplyTestToken2: 1000000,
    supplyPixelNFT: 100,
    supplyOLToken: toBN("1000000000000000000000000"),
    erc1155TestTokenUri: "1155 test token",
  });
};

const deployTestDao = async (
  deployFunction,
  network,
  accounts,
  truffleImports,
  contractConfigs
) => {
  const envVars = checkEnvVariable(
    "DAO_NAME",
    "ERC20_TOKEN_NAME",
    "ERC20_TOKEN_SYMBOL",
    "ERC20_TOKEN_DECIMALS"
  );

  return await deployDao({
    ...truffleImports,
    contractConfigs,
    deployFunction,
    maxAmount,
    unitPrice: unitPrice,
    nbUnits: numberOfUnits,
    tokenAddr: ETH_TOKEN,
    erc20TokenName: envVars.ERC20_TOKEN_NAME,
    erc20TokenSymbol: envVars.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: envVars.ERC20_TOKEN_DECIMALS,
    erc20TokenAddress: UNITS,
    maxChunks: maximumChunks,
    votingPeriod: 10, // 10 secs
    gracePeriod: 1, // 1 sec
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: "0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8",
    offchainAdmin: "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
    daoName: envVars.DAO_NAME,
    owner: accounts[0],
  });
};

const deployHarmonyDao = async (
  deployFunction,
  network,
  truffleImports,
  contractConfigs
) => {
  const envVars = checkEnvVariable(
    "DAO_NAME",
    "DAO_OWNER_ADDR",
    "ERC20_TOKEN_NAME",
    "ERC20_TOKEN_SYMBOL",
    "ERC20_TOKEN_DECIMALS",
    "COUPON_CREATOR_ADDR",
    "OFFCHAIN_ADMIN_ADDR",
    "VOTING_PERIOD_SECONDS",
    "GRACE_PERIOD_SECONDS"
  );

  return await deployDao({
    ...truffleImports,
    contractConfigs,
    deployFunction,
    maxAmount,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: envVars.ERC20_TOKEN_NAME,
    erc20TokenSymbol: envVars.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: envVars.ERC20_TOKEN_DECIMALS,
    erc20TokenAddress: UNITS,
    maxChunks: toBN("100000"),
    votingPeriod: parseInt(envVars.VOTING_PERIOD_SECONDS),
    gracePeriod: parseInt(envVars.GRACE_PERIOD_SECONDS),
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: envVars.COUPON_CREATOR_ADDR,
    daoName: envVars.DAO_NAME,
    owner: envVars.DAO_OWNER_ADDR,
    offchainAdmin: envVars.OFFCHAIN_ADMIN_ADDR,
  });
};

const deployHarmonyTestDao = async (
  deployFunction,
  network,
  truffleImports,
  contractConfigs
) => {
  const envVars = checkEnvVariable(
    "DAO_NAME",
    "DAO_OWNER_ADDR",
    "ERC20_TOKEN_NAME",
    "ERC20_TOKEN_SYMBOL",
    "ERC20_TOKEN_DECIMALS",
    "COUPON_CREATOR_ADDR"
  );

  return await deployDao({
    ...truffleImports,
    contractConfigs,
    deployFunction,
    maxAmount,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: envVars.ERC20_TOKEN_NAME,
    erc20TokenSymbol: envVars.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: envVars.ERC20_TOKEN_DECIMALS,
    erc20TokenAddress: UNITS,
    erc1155TestTokenUri: "1155 test token",
    maxChunks: toBN("100000"),
    votingPeriod: envVars.VOTING_PERIOD_SECONDS
      ? parseInt(envVars.VOTING_PERIOD_SECONDS)
      : 600, // 600 secs = 10 mins
    gracePeriod: envVars.GRACE_PERIOD_SECONDS
      ? parseInt(envVars.GRACE_PERIOD_SECONDS)
      : 600, // 600 secs = 10 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: envVars.COUPON_CREATOR_ADDR,
    daoName: envVars.DAO_NAME,
    owner: envVars.DAO_OWNER_ADDR,
    offchainAdmin: envVars.OFFCHAIN_ADMIN_ADDR
      ? envVars.OFFCHAIN_ADMIN_ADDR
      : "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
  });
};

const deploy = async ({
  network,
  deployFunction,
  truffleImports,
  accounts,
  contracts,
}) => {
  let res;
  switch (network) {
    case "mainnet":
      res = await deployMainnetDao(
        deployFunction,
        network,
        truffleImports,
        contracts
      );
      break;
    // Chain ID is retrieved automatically and ETH_NODE_URL specifies RPC endpoint,
    // so Goerli and Rinkeby should be treated the same
    case "goerli":
    case "rinkeby":
      res = await deployRinkebyDao(
        deployFunction,
        network,
        truffleImports,
        contracts
      );
      break;
    case "test":
    case "coverage":
      res = await deployTestDao(
        deployFunction,
        network,
        accounts,
        truffleImports,
        contracts
      );
      break;
    case "ganache":
      res = await deployGanacheDao(
        deployFunction,
        network,
        accounts,
        truffleImports,
        contracts
      );
      break;
    case "harmony":
      res = await deployHarmonyDao(
        deployFunction,
        network,
        truffleImports,
        contracts
      );
      break;
    case "harmonytest":
      res = await deployHarmonyTestDao(
        deployFunction,
        network,
        truffleImports,
        contracts
      );
      break;
    default:
      throw new Error(`Unsupported operation ${network}`);
  }
  return res;
};

const getOrCreateDaoArtifacts = async (deployer, truffleImports) => {
  const DaoArtifacts = truffleImports.DaoArtifacts;
  let daoArtifacts;
  if (process.env.DAO_ARTIFACTS_CONTRACT_ADDR) {
    console.log(`Attach to existing DaoArtifacts contract`);
    daoArtifacts = await DaoArtifacts.at(
      process.env.DAO_ARTIFACTS_CONTRACT_ADDR
    );
  } else {
    console.log(`Creating new DaoArtifacts contract`);
    await deployer.deploy(DaoArtifacts);
    daoArtifacts = await DaoArtifacts.deployed();
  }
  console.log(`DaoArtifacts: ${daoArtifacts.address}`);
  return daoArtifacts;
};

const checkEnvVariable = (...names) => {
  let envVariables = {};
  Array.from(names).forEach((name) => {
    if (!process.env[name]) throw Error(`Missing env var: ${name}`);
    envVariables[name] = process.env[name];
  });
  return envVariables;
};
const saveDeployedContracts = (network, addresses) => {
  const now = new Date().toISOString();
  const dir = path.resolve(deployConfigs.deployedContractsDir);
  const file = `${dir}/contracts-${network}-${now}.json`;
  fs.writeFileSync(`${file}`, JSON.stringify(addresses), "utf8");
  log("************************************************");
  log(`\nDeployed contracts: ${file}\n`);
};
