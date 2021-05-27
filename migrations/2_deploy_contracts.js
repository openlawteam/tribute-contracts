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
  let res;
  const deployFunction = truffleImports.deployFunctionFactory(deployer);
  if (network === "ganache") {
    res = await deployGanacheDao(deployFunction, network, accounts);
  } else if (network === "rinkeby") {
    res = await deployRinkebyDao(deployFunction, network);
  } else if (network === "test" || network === "coverage") {
    res = await deployTestDao(deployFunction, network, accounts);
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
    votingPeriod: 600, // 600 secs = 10 mins
    gracePeriod: 600, // 600 secs = 10 mins
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR,
    daoName: process.env.DAO_NAME,
    owner: process.env.DAO_OWNER_ADDR,
    offchainAdmin: "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
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
    votingPeriod: 120, // 120 secs = 2 mins
    gracePeriod: 60, // 60 secs = 1 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR,
    daoName: process.env.DAO_NAME,
    owner: accounts[0],
    offchainAdmin: "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
  });
}
