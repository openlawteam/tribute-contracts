const { ethers, upgrades } = require("hardhat");

async function main() {
  const TributeERC721 = await ethers.getContractFactory(
    "TributeERC721"
  );
  const proxy = await upgrades.deployProxy(TributeERC721, ["first test", "ft"]);
  await proxy.deployed();
  const implementation = await upgrades.erc1967.getImplementationAddress(
    proxy.address
  );
  console.log("implementation: ", implementation);

  console.log("proxy at: ", proxy.address);
}

main();
