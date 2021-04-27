const {
  toBN,
  toWei,
  ETH_TOKEN,
  maximumChunks,
  unitPrice,
  numberOfShares,
} = require("../utils/ContractUtil.js");

const { deployDao, getNetworkDetails } = require("../utils/DeploymentUtil.js");

const truffleImports = require("../utils/TruffleUtil.js");

require("dotenv").config();

module.exports = async (deployer, network) => {
  let dao;
  const deployFunction = truffleImports.deployFunctionFactory(deployer);
  if (network === "ganache") {
    dao = await deployGanacheDao(deployFunction, network);
  } else if (network === "rinkeby") {
    dao = await deployRinkebyDao(deployFunction, network);
  } else if (network === "test" || network === "coverage") {
    dao = await deployTestDao(deployFunction, network);
  }

  if (dao) {
    await dao.finalizeDao();

    console.log("************************");
    console.log("new DAO address:");
    console.log(dao.address);
    console.log("************************");
  } else {
    console.log("************************");
    console.log("no migration for network " + network);
    console.log("************************");
  }
};

async function deployTestDao(deployFunction, network) {
  let { dao } = await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: unitPrice,
    nbShares: numberOfShares,
    tokenAddr: ETH_TOKEN,
    maxChunks: maximumChunks,
    votingPeriod: 10, // 10 secs
    gracePeriod: 1, // 1 sec
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: "0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8",
    daoName: process.env.DAO_NAME,
  });
  return dao;
}

async function deployRinkebyDao(deployFunction, network) {
  let { dao } = await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbShares: toBN("100000"),
    tokenAddr: ETH_TOKEN,
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
  });
  return dao;
}

async function deployGanacheDao(deployFunction, network) {
  let { dao } = await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")),
    nbShares: toBN("100000"),
    tokenAddr: ETH_TOKEN,
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
  });
  return dao;
}
