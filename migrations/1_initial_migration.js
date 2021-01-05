const Migrations = artifacts.require("Migrations");

const {
  deployDao
} = require("../utils/DaoFactory.js");

module.exports = async function(deployer) {
  deployer.deploy(Migrations);

  let dao = await deployDao(deployer);
  console.log('************************');
  console.log(dao.address);
  console.log('************************');

};
