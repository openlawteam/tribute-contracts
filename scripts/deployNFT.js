const { ethers, upgrades } = require("hardhat");

async function main() {
  const TributeERC721 = await ethers.getContractFactory("UpgradeableERC721Testing");
  const proxy = await upgrades.deployProxy(TributeERC721, ['first test', 'ft']);
  await proxy.deployed();

  console.log('proxy at: ', proxy.address);
}

main();