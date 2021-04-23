const {
  toBN,
  toWei,
  ETH_TOKEN,
  maximumChunks,
  sharePrice,
  numberOfShares,
} = require("../utils/DaoFactory.js");

const {
  deployDao,
  getNetworkDetails,
} = require("../utils/DeploymentUtil.js");

const truffleImports = require("../utils/TruffleUtil.js");

require("dotenv").config();

module.exports = async (deployer, network) => {
  let dao;
  const deployFunction  = truffleImports.deployFunctionFactory(deployer);
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
    unitPrice: sharePrice,
    nbShares: numberOfShares,
    tokenAddr: ETH_TOKEN,
    maxChunks: maximumChunks,
    votingPeriod: 10,
    gracePeriod: 1,
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress : '0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8'
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
    votingPeriod: 600,
    gracePeriod: 600,
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress : process.env.COUPON_CREATOR_ADDR
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
    votingPeriod: 120,
    gracePeriod: 60,
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress : process.env.COUPON_CREATOR_ADDR
  });
  return dao;
}
