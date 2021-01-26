const Migrations = artifacts.require("Migrations");
const Web3Utils = require('web3-utils');
const toBN = Web3Utils.toBN;
const toWei = Web3Utils.toWei;

const {
  deployDao,
  sha3,
  ETH_TOKEN,
  votingPeriod,
  maximumChunks,
  sharePrice,
  numberOfShares,
  gracePeriod,
  VotingContract,
  OffchainVotingContract,
  entryDao,
  DaoFactory
} = require("../utils/DaoFactory.js");

module.exports = async function(deployer, network) {
  const networks = ['ganache', 'rinkeby'];
  deployer.deploy(Migrations);
  let dao;
  if(network === 'ganache' || network === 'rinkeby') {
    dao = await deployDao(deployer, {
      unitPrice: toBN(toWei("100", "finney")),
      nbShares: toBN("100000"),
      tokenAddr: ETH_TOKEN,
      maximumChunks: toBN("100000"),
      votingPeriod: 60, //in seconds
      gracePeriod: 60 // in seconds
    });
  } else if (network === 'test') {
    dao = await deployDao(deployer, {
      unitPrice: sharePrice,
      nbShares: numberOfShares,
      tokenAddr: ETH_TOKEN,
      maximumChunks: maximumChunks,
      votingPeriod: 10,
      gracePeriod: 1,
      offchainVoting: true 
    });
  }
  if(dao) {
    await dao.finalizeDao();

    console.log('************************');
    console.log('new DAO address:');
    console.log(dao.address);
    console.log('************************');
  } else {
    console.log('************************');
    console.log('no migration for network ' + network);
    console.log('************************');
  }
};
