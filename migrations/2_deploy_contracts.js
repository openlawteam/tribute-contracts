const {
  toBN,
  toWei,
  deployDao,
  getNetworkDetails,
  ETH_TOKEN,
  maximumChunks,
  sharePrice,
  numberOfShares,
} = require("../utils/DaoFactory.js");

require("dotenv").config();

module.exports = async (deployer, network) => {
  let dao;
  if (network === "ganache") {
    dao = await deployGanacheDao(deployer, network);
  } else if (network === "rinkeby") {
    dao = await deployRinkebyDao(deployer, network);
  } else if (network === "test" || network === "coverage") {
    dao = await deployTestDao(deployer, network);
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

async function deployTestDao(deployer, network) {
  let { dao } = await deployDao(deployer, {
    unitPrice: sharePrice,
    nbShares: numberOfShares,
    tokenAddr: ETH_TOKEN,
    maximumChunks: maximumChunks,
    votingPeriod: 10,
    gracePeriod: 1,
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    couponCreatorAddress : '0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8'
  });
  return dao;
}

async function deployRinkebyDao(deployer, network) {
  let { dao } = await deployDao(deployer, {
    unitPrice: toBN(toWei("100", "finney")),
    nbShares: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    maximumChunks: toBN("100000"),
    votingPeriod: 600,
    gracePeriod: 600,
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    couponCreatorAddress : process.env.COUPON_CREATOR_ADDR
  });
  return dao;
}

async function deployGanacheDao(deployer, network) {
  let { dao } = await deployDao(deployer, {
    unitPrice: toBN(toWei("100", "finney")),
    nbShares: toBN("100000"),
    tokenAddr: ETH_TOKEN,
    maximumChunks: toBN("100000"),
    votingPeriod: 120,
    gracePeriod: 60,
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
  });
  return dao;
}
