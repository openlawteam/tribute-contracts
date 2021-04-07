const {
  toBN,
  toWei,
  deployDao,
  ETH_TOKEN,
  maximumChunks,
  sharePrice,
  numberOfShares,
  getNetworkDetails,
} = require("../utils/DaoFactory.js");

module.exports = async (deployer, network) => {
  let dao;
  if (network === "ganache") {
    dao = await deployDao(deployer, {
      unitPrice: toBN(toWei("100", "finney")),
      nbShares: toBN("100000"),
      tokenAddr: ETH_TOKEN,
      maximumChunks: toBN("100000"),
      votingPeriod: 120, // 120 secs (2 mins)
      gracePeriod: 60, // 60 secs (1 min)
      offchainVoting: true,
      chainId: getNetworkDetails(network).chainId,
      deployTestTokens: true,
    });
  } else if (network === "rinkeby") {
    dao = await deployDao(deployer, {
      unitPrice: toBN(toWei("100", "finney")),
      nbShares: toBN("100000"),
      tokenAddr: ETH_TOKEN,
      maximumChunks: toBN("100000"),
      votingPeriod: 600, // 600 secs (10 mins)
      gracePeriod: 600, // 600 secs (10 mins)
      offchainVoting: true,
      chainId: getNetworkDetails(network).chainId,
      deployTestTokens: true,
    });
  } else if (network === "test" || network === "coverage") {
    dao = await deployDao(deployer, {
      unitPrice: sharePrice,
      nbShares: numberOfShares,
      tokenAddr: ETH_TOKEN,
      maximumChunks: maximumChunks,
      votingPeriod: 10, // 10 secs
      gracePeriod: 1, // 1 sec
      offchainVoting: true,
      chainId: getNetworkDetails(network).chainId,
      deployTestTokens: false,
    });
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
