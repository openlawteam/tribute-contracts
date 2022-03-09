const {
  toBN,
  toWei,
  ETH_TOKEN,
  UNITS,
  ZERO_ADDRESS,
  maximumChunks,
  unitPrice,
  maxAmount,
  maxUnits,
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
    case "polygon":
      res = await deployPolygonDao(deployFunction, network);
      break;
    case "polygontest":
      res = await deployPolygonTestDao(deployFunction, network);
      break;
    default:
      throw Error(`Unsupported network: ${network}`);
  }

  const { adapters } = res;
  if (adapters) {
    console.log("************************");
    console.log("done");
    console.log("************************");
  } else {
    console.log("************************");
    console.log("no migration for network " + network);
    console.log("************************");
  }
  console.log(`### Deployment completed at: ${new Date().toISOString()}`);
};

const deployTestDao = async (deployFunction, network, accounts) => {
  const daoOwnerAddress = accounts[0];
  const { WETH } = truffleImports;
  const weth = await deployFunction(WETH);

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: unitPrice,
    nbUnits: numberOfUnits,
    tokenAddr: ETH_TOKEN,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    maxMembers: getOptionalEnvVar("MAX_MEMBERS", toBN(1000)),
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    maxChunks: maximumChunks,
    votingPeriod: 10, // 10 secs
    gracePeriod: 1, // 1 sec
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: daoOwnerAddress,
    offchainAdmin: daoOwnerAddress,
    kycCouponCreatorAddress: daoOwnerAddress,
    fundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: daoOwnerAddress,
    wethAddress: weth.address,
  });
};

const deployRinkebyDao = async (deployFunction, network) => {
  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: toBN("100000"),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    maxMembers: getOptionalEnvVar("MAX_MEMBERS", toBN(1000)),
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 600), // 600 secs = 10 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycCouponCreatorAddress: getOptionalEnvVar(
      "KYC_COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    fundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    wethAddress: "0xc778417e063141139fce010982780140aa0cd5ab",
  });
};

const deployGanacheDao = async (deployFunction, network, accounts) => {
  const daoOwnerAddress = accounts[0];

  const { WETH } = truffleImports;
  const weth = await deployFunction(WETH);

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    maxMembers: getOptionalEnvVar("MAX_MEMBERS", toBN(1000)),
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    maxChunks: toBN("100000"),
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 120), // 120 secs = 2 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 60), // 600 secs = 1 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      daoOwnerAddress
    ),
    kycCouponCreatorAddress: getOptionalEnvVar(
      "KYC_COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    fundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: daoOwnerAddress,
    offchainAdmin: getOptionalEnvVar("OFFCHAIN_ADMIN_ADDR", daoOwnerAddress),
    wethAddress: weth.address,
  });
};

const deployMainnetDao = async (deployFunction, network) => {
  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    maxMembers: getEnvVar("MAX_MEMBERS"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: toBN("100000"),
    votingPeriod: parseInt(getEnvVar("VOTING_PERIOD_SECONDS")),
    gracePeriod: parseInt(getEnvVar("GRACE_PERIOD_SECONDS")),
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: getEnvVar("COUPON_CREATOR_ADDR"),
    kycCouponCreatorAddress: getEnvVar("KYC_COUPON_CREATOR_ADDR"),
    fundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getEnvVar("OFFCHAIN_ADMIN_ADDR"),
    wethAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  });
};

const deployHarmonyDao = async (deployFunction, network) => {
  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    maxMembers: getEnvVar("MAX_MEMBERS"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: toBN("100000"),
    votingPeriod: parseInt(getEnvVar("VOTING_PERIOD_SECONDS")),
    gracePeriod: parseInt(getEnvVar("GRACE_PERIOD_SECONDS")),
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: getEnvVar("COUPON_CREATOR_ADDR"),
    kycCouponCreatorAddress: getEnvVar("KYC_COUPON_CREATOR_ADDR"),
    fundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getEnvVar("OFFCHAIN_ADMIN_ADDR"),
    wethAddress: getEnvVar("WETH_ADDRESS"),
  });
};

const deployHarmonyTestDao = async (deployFunction, network) => {
  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    maxMembers: getOptionalEnvVar("MAX_MEMBERS", toBN(1000)),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: toBN("100000"),
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 600), // 600 secs = 10 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: getEnvVar("COUPON_CREATOR_ADDR"),
    kycCouponCreatorAddress: getOptionalEnvVar(
      "KYC_COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    fundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getEnvVar("OFFCHAIN_ADMIN_ADDR"),
    wethAddress: getEnvVar("WETH_ADDRESS"),
  });
};

const deployPolygonDao = async (deployFunction, network) => {
  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    maxMembers: getEnvVar("MAX_MEMBERS"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: toBN("100000"),
    votingPeriod: parseInt(getEnvVar("VOTING_PERIOD_SECONDS")),
    gracePeriod: parseInt(getEnvVar("GRACE_PERIOD_SECONDS")),
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: getEnvVar("COUPON_CREATOR_ADDR"),
    kycCouponCreatorAddress: getEnvVar("KYC_COUPON_CREATOR_ADDR"),
    fundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
  });
};

const deployPolygonTestDao = async (deployFunction, network) => {
  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    maxMembers: getOptionalEnvVar("MAX_MEMBERS", toBN(1000)),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: toBN("100000"),
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 600), // 600 secs = 10 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: getEnvVar("COUPON_CREATOR_ADDR"),
    kycCouponCreatorAddress: getOptionalEnvVar(
      "KYC_COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    fundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
  });
};

const getEnvVar = (name) => {
  if (!process.env[name]) throw Error(`Missing env var: ${name}`);
  return process.env[name];
};

const getOptionalEnvVar = (name, defaultValue) => {
  const envVar = process.env[name];
  return envVar ? envVar : defaultValue;
};
