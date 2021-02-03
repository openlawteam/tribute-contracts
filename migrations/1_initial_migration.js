const Migrations = artifacts.require("Migrations");
const Web3Utils = require('web3-utils');
const toBN = Web3Utils.toBN;
const toWei = Web3Utils.toWei;

const {
  deployDao,
  ETH_TOKEN,
  maximumChunks,
  sharePrice,
  numberOfShares
} = require("../utils/DaoFactory.js");

const networks = [
  {
    name:'ganache',
    chainId: 1337
}, 
{
  name:'rinkeby', chainId: 4
},
{
  name:'test', chainId: 1
},
{
  name:'coverage', chainId: 1
},
];

function getNetworkDetails(name) {
  return networks.find(n => n.name === name)
}

module.exports = async function(deployer, network) {

  deployer.deploy(Migrations);
  let dao;
  if(network === 'ganache' || network === 'rinkeby') {
    dao = await deployDao(deployer, {
      unitPrice: toBN(toWei("100", "finney")),
      nbShares: toBN("100000"),
      tokenAddr: ETH_TOKEN,
      maximumChunks: toBN("100000"),
      votingPeriod: 60, //in seconds
      gracePeriod: 60, // in seconds
      offchainVoting: true,
      chainId: getNetworkDetails(network).chainId
    });
  } else if (network === 'test' || network === 'coverage') {
    dao = await deployDao(deployer, {
      unitPrice: sharePrice,
      nbShares: numberOfShares,
      tokenAddr: ETH_TOKEN,
      maximumChunks: maximumChunks,
      votingPeriod: 10,
      gracePeriod: 1,
      offchainVoting: true,
      chainId: getNetworkDetails(network).chainId
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
