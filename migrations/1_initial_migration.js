const Migrations = artifacts.require("Migrations");
const Web3Utils = require('web3-utils');
const toBN = Web3Utils.toBN;
const toWei = Web3Utils.toWei;

const {
  deployDao,
  ETH_TOKEN
} = require("../utils/DaoFactory.js");

module.exports = async function(deployer, network) {
  const networks = ['ganache', 'rinkeby'];
  deployer.deploy(Migrations);

  if(networks.indexOf(network) > -1 ) {
    let dao = await deployDao(deployer, {
      unitPrice: toBN(toWei("100", "finney")),
      nbShares: toBN("100000"),
      tokenAddr: ETH_TOKEN,
      maximumChunks: toBN("100000"),
      votingPeriod: 60, //in seconds
      gracePeriod: 60 // in seconds
    });

    await dao.finalizeDao();

    console.log('************************');
    console.log('new DAO address:');
    console.log(dao.address);
    console.log('************************');
  }
};
