const {
  toBN,
  toWei,
  ETH_TOKEN,
  maximumChunks,
  unitPrice,
  numberOfUnits,
} = require("../utils/ContractUtil.js");

const { deployDao, getNetworkDetails } = require("../utils/DeploymentUtil.js");

const truffleImports = require("../utils/TruffleUtil.js");

require("dotenv").config();

module.exports = async (deployer, network, accounts) => {
  console.log(`### Deployment start at: ${new Date().toISOString()}`);
  let res;
  const deployFunction = truffleImports.deployFunctionFactory(deployer);
  switch (network) {
    case "ganache":
      res = await deployGanacheDao(deployFunction, network, accounts);
      break;
    case "goerli": // Chain ID is retrieved automatically and ETH_NODE_URL specifies RPC endpoint, so Goerli and Rinkeby should be treated the same
    case "rinkeby":
      res = await deployRinkebyDao(deployFunction, network);
      break;
    case "test":
    case "coverage":
      res = await deployTestDao(deployFunction, network, accounts);
      break;
    case "mainnet":
      res = await deployMainnetDao(deployFunction, network);
      break;
    case "harmony":
      res = await deployHarmonyDao(deployFunction, network);
      break;
    case "harmonytest":
      res = await deployHarmonyTestDao(deployFunction, network);
      break;
    case "xdai":
      res = await deployXDaiDao(deployFunction,network);
      break;
    default:
      throw Error(`Unsupported network: ${network}`);
  }

  let { dao, extensions } = res;
  if (dao) {
    await dao.finalizeDao();
    console.log("************************");
    console.log(`DaoRegistry: ${dao.address}`);
    console.log(`BankExtension: ${extensions.bank.address}`);
    console.log(
      `NFTExtension: ${extensions.nft ? extensions.nft.address : ""}`
    );
    console.log(
      `ERC20Extension: ${
        extensions.erc20Ext ? extensions.erc20Ext.address : ""
      }`
    );
    console.log("************************");
  } else {
    console.log("************************");
    console.log("no migration for network " + network);
    console.log("************************");
  }
  console.log(`### Deployment completed at: ${new Date().toISOString()}`);
};

async function deployTestDao(deployFunction, network, accounts) {
  if (!process.env.DAO_NAME) throw Error("Missing env var: DAO_NAME");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: unitPrice,
    nbUnits: numberOfUnits,
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
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
    daoName: process.env.DAO_NAME,
    owner: accounts[0],
  });
}

async function deployRinkebyDao(deployFunction, network) {
  if (!process.env.DAO_NAME) throw Error("Missing env var: DAO_NAME");
  if (!process.env.DAO_OWNER_ADDR)
    throw Error("Missing env var: DAO_OWNER_ADDR");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");
  if (!process.env.COUPON_CREATOR_ADDR)
    throw Error("Missing env var: COUPON_CREATOR_ADDR");

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
    maxChunks: toBN("100000"),
    votingPeriod: process.env.VOTING_PERIOD_SECONDS
      ? parseInt(process.env.VOTING_PERIOD_SECONDS)
      : 600, // 600 secs = 10 mins
    gracePeriod: process.env.GRACE_PERIOD_SECONDS
      ? parseInt(process.env.GRACE_PERIOD_SECONDS)
      : 600, // 600 secs = 10 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR,
    daoName: process.env.DAO_NAME,
    owner: process.env.DAO_OWNER_ADDR,
    offchainAdmin: process.env.OFFCHAIN_ADMIN_ADDR
      ? process.env.OFFCHAIN_ADMIN_ADDR
      : "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
  });
}

async function deployGanacheDao(deployFunction, network, accounts) {
  if (!process.env.DAO_NAME) throw Error("Missing env var: DAO_NAME");
  if (!process.env.COUPON_CREATOR_ADDR)
    throw Error("Missing env var: COUPON_CREATOR_ADDR");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
    maxChunks: toBN("100000"),
    votingPeriod: process.env.VOTING_PERIOD_SECONDS
      ? parseInt(process.env.VOTING_PERIOD_SECONDS)
      : 120, // 120 secs = 2 mins
    gracePeriod: process.env.GRACE_PERIOD_SECONDS
      ? parseInt(process.env.GRACE_PERIOD_SECONDS)
      : 60, // 60 secs = 1 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR,
    daoName: process.env.DAO_NAME,
    owner: accounts[0],
    offchainAdmin: process.env.OFFCHAIN_ADMIN_ADDR
      ? process.env.OFFCHAIN_ADMIN_ADDR
      : "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
  });
}

async function deployMainnetDao(deployFunction, network) {
  if (!process.env.DAO_NAME) throw Error("Missing env var: DAO_NAME");
  if (!process.env.DAO_OWNER_ADDR)
    throw Error("Missing env var: DAO_OWNER_ADDR");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");
  if (!process.env.COUPON_CREATOR_ADDR)
    throw Error("Missing env var: COUPON_CREATOR_ADDR");
  if (!process.env.OFFCHAIN_ADMIN_ADDR)
    throw Error("Missing env var: OFFCHAIN_ADMIN_ADDR");
  if (!process.env.VOTING_PERIOD_SECONDS)
    throw Error("Missing env var: VOTING_PERIOD_SECONDS");
  if (!process.env.GRACE_PERIOD_SECONDS)
    throw Error("Missing env var: GRACE_PERIOD_SECONDS");

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
    maxChunks: toBN("100000"),
    votingPeriod: parseInt(process.env.VOTING_PERIOD_SECONDS),
    gracePeriod: parseInt(process.env.GRACE_PERIOD_SECONDS),
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR,
    daoName: process.env.DAO_NAME,
    owner: process.env.DAO_OWNER_ADDR,
    offchainAdmin: process.env.OFFCHAIN_ADMIN_ADDR,
  });
}

async function deployHarmonyDao(deployFunction, network) {
  if (!process.env.DAO_NAME) throw Error("Missing env var: DAO_NAME");
  if (!process.env.DAO_OWNER_ADDR)
    throw Error("Missing env var: DAO_OWNER_ADDR");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");
  if (!process.env.COUPON_CREATOR_ADDR)
    throw Error("Missing env var: COUPON_CREATOR_ADDR");
  if (!process.env.OFFCHAIN_ADMIN_ADDR)
    throw Error("Missing env var: OFFCHAIN_ADMIN_ADDR");
  if (!process.env.VOTING_PERIOD_SECONDS)
    throw Error("Missing env var: VOTING_PERIOD_SECONDS");
  if (!process.env.GRACE_PERIOD_SECONDS)
    throw Error("Missing env var: GRACE_PERIOD_SECONDS");

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
    maxChunks: toBN("100000"),
    votingPeriod: parseInt(process.env.VOTING_PERIOD_SECONDS),
    gracePeriod: parseInt(process.env.GRACE_PERIOD_SECONDS),
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR,
    daoName: process.env.DAO_NAME,
    owner: process.env.DAO_OWNER_ADDR,
    offchainAdmin: process.env.OFFCHAIN_ADMIN_ADDR,
  });
}

async function deployHarmonyTestDao(deployFunction, network) {
  if (!process.env.DAO_NAME) throw Error("Missing env var: DAO_NAME");
  if (!process.env.DAO_OWNER_ADDR)
    throw Error("Missing env var: DAO_OWNER_ADDR");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");
  if (!process.env.COUPON_CREATOR_ADDR)
    throw Error("Missing env var: COUPON_CREATOR_ADDR");

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
    maxChunks: toBN("100000"),
    votingPeriod: process.env.VOTING_PERIOD_SECONDS
      ? parseInt(process.env.VOTING_PERIOD_SECONDS)
      : 600, // 600 secs = 10 mins
    gracePeriod: process.env.GRACE_PERIOD_SECONDS
      ? parseInt(process.env.GRACE_PERIOD_SECONDS)
      : 600, // 600 secs = 10 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR,
    daoName: process.env.DAO_NAME,
    owner: process.env.DAO_OWNER_ADDR,
    offchainAdmin: process.env.OFFCHAIN_ADMIN_ADDR
      ? process.env.OFFCHAIN_ADMIN_ADDR
      : "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
  });
}

async function deployXDaiDao(deployFunction, network) {
  if (!process.env.DAO_NAME) throw Error("Missing env var: DAO_NAME");
  if (!process.env.DAO_OWNER_ADDR)
    throw Error("Missing env var: DAO_OWNER_ADDR");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");
  if (!process.env.COUPON_CREATOR_ADDR)
    throw Error("Missing env var: COUPON_CREATOR_ADDR");

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
    maxChunks: toBN("100000"),
    votingPeriod: process.env.VOTING_PERIOD_SECONDS
      ? parseInt(process.env.VOTING_PERIOD_SECONDS)
      : 600, // 600 secs = 10 mins
    gracePeriod: process.env.GRACE_PERIOD_SECONDS
      ? parseInt(process.env.GRACE_PERIOD_SECONDS)
      : 600, // 600 secs = 10 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR,
    daoName: process.env.DAO_NAME,
    owner: process.env.DAO_OWNER_ADDR,
    offchainAdmin: process.env.OFFCHAIN_ADMIN_ADDR
      ? process.env.OFFCHAIN_ADMIN_ADDR
      : "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
  });
}
