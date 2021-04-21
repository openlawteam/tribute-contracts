const Migrations = artifacts.require("Migrations");

module.exports = async function (deployer, network) {
  await deployer.deploy(Migrations);
};
