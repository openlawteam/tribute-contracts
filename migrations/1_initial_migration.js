const Migrations = artifacts.require("Migrations");

const {
  deployDao
} = require("../utils/DaoFactory.js");

module.exports = async function(deployer, network) {

  deployer.deploy(Migrations);

  if(network === 'ganache') {
    console.log(network);
    let dao = await deployDao(deployer);
    console.log('************************');
    console.log(dao.address);
    console.log('************************');
  }
};
