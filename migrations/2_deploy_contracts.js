const {
  toBN,
  toWei,
  ETH_TOKEN,
  maximumChunks,
  unitPrice,
  numberOfUnits,
  maxAmount,
} = require("../utils/ContractUtil.js");

const { deployDao, getNetworkDetails } = require("../utils/DeploymentUtil.js");

require("dotenv").config();

module.exports = async (deployer, network, accounts) => {
  console.log(`Deployment started at: ${new Date().toISOString()}`);
  console.log(`Deploying tribute-contracts to ${network} network`);

  const { contracts } = require(`../deployment/${network}.config`);
  const truffleImports = require("../utils/TruffleUtil.js")(contracts);
  const daoArtifacts = await getOrCreateDaoArtifacts(deployer, truffleImports);

  const deployFunction = truffleImports.deployFunctionFactory(
    deployer,
    daoArtifacts
  );

  const result = await deploy(
    network,
    deployFunction,
    truffleImports,
    accounts
  );

  const { dao, extensions, testContracts } = result;
  if (dao) {
    await dao.finalizeDao();
    console.log("************************");
    console.log(`DaoRegistry: ${dao.address}`);
    console.log(
      `Multicall: ${
        testContracts.multicall ? testContracts.multicall.address : ""
      }`
    );
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
  console.log(`Deployment completed at: ${new Date().toISOString()}`);
};

const deployRinkebyDao = async (deployFunction, network, truffleImports) => {
  if (!process.env.DAO_NAME) throw Error("Missing env var: DAO_NAME");
  if (!process.env.DAO_OWNER_ADDR)
    throw Error("Missing env var: DAO_OWNER_ADDR");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");

  return await deployDao({
    ...truffleImports,
    deployFunction,
    maxAmount,
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
    maxChunks: toBN("100000"),
    votingPeriod: process.env.VOTING_PERIOD_SECONDS
      ? parseInt(process.env.VOTING_PERIOD_SECONDS)
      : 600, // 600 secs = 10 mins,
    gracePeriod: process.env.GRACE_PERIOD_SECONDS
      ? parseInt(process.env.GRACE_PERIOD_SECONDS)
      : 600, // 600 secs = 10 mins
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR
      ? process.env.COUPON_CREATOR_ADDR
      : process.env.DAO_OWNER_ADDR,
    daoName: process.env.DAO_NAME,
    owner: process.env.DAO_OWNER_ADDR,
    offchainAdmin: process.env.OFFCHAIN_ADMIN_ADDR
      ? process.env.OFFCHAIN_ADMIN_ADDR
      : "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
  });
};

const deployMainnetDao = async (deployFunction, network, truffleImports) => {
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
};

const deployGanacheDao = async (
  deployFunction,
  network,
  accounts,
  truffleImports
) => {
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
    unitPrice: toBN(toWei("100", "finney")),
    nbUnits: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
    maxChunks: toBN("100000"),
    votingPeriod: 120, // 120 secs = 2 mins
    gracePeriod: 60, // 60 secs = 1 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR
      ? process.env.COUPON_CREATOR_ADDR
      : accounts[0],
    daoName: process.env.DAO_NAME,
    owner: accounts[0],
    offchainAdmin: "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
  });
};

const deployTestDao = async (
  deployFunction,
  network,
  accounts,
  truffleImports
) => {
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
};

const deploy = async (network, deployFunction, truffleImports, accounts) => {
  let res;
  switch (network) {
    case "mainnet":
      res = await deployMainnetDao(deployFunction, network, truffleImports);
      break;
    case "rinkeby":
      res = await deployRinkebyDao(deployFunction, network, truffleImports);
      break;
    case "test":
    case "coverage":
      res = await deployTestDao(
        deployFunction,
        network,
        accounts,
        truffleImports
      );
      break;
    case "ganache":
      res = await deployGanacheDao(
        deployFunction,
        network,
        accounts,
        truffleImports
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
