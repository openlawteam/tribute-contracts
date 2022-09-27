import { task } from "hardhat/config";
import util from "util";
const { log } = require("../utils/log-util");
const exec = util.promisify(require("child_process").exec);

task(
  "deployTributeERC721",
  "Task that deploys a TributeERC721 proxy collection and implementation (will reuse existing implementation)"
)
  .addPositionalParam("daoAddress")
  .setAction(async (taskArgs, hre) => {
    const { daoAddress } = taskArgs;
    const { network } = hre.hardhatArguments;

    log(`Deployment started at ${new Date().toISOString()}`);
    log(
      `Deploying TributeERC721 for daoAddress ${daoAddress} to ${network} network`
    );

    const TributeERC721 = await ethers.getContractFactory("TributeERC721");

    // Deploying the proxy and implementation. Implementation can be reused.
    const proxy = await hre.upgrades.deployProxy(TributeERC721, [daoAddress]);
    await proxy.deployed();
    log(`Proxy deployed: ${proxy.address}`);
    const implementation = await upgrades.erc1967.getImplementationAddress(
      proxy.address
    );
    log(`Implementation deployed: ${implementation}\n`);

    // Verifying the proxy and implementation.
    log(
      `Verifying the proxy and implementation: npx hardhat verify --network ${network} ${proxy.address}`
    );
    const { stderr, stdout } = await exec(
      `npx hardhat verify --network ${network} ${proxy.address}`
    );
    stdout ? log(`Contracts verified: `) : log(stderr);
    const etherscanNetwork = network === "mainnet" ? "" : network + ".";
    log(
      `-- Proxy (go to etherscan and complete proxy verification): https://${etherscanNetwork}etherscan.io/address/${proxy.address}}`
    );
    log(
      `-- Implementation: https://${etherscanNetwork}etherscan.io/address/${implementation}}`
    );
    log(`Deployment and verification completed at ${new Date().toISOString()}`);
    log(
      `*** Use the Manager to set collection size, transferability, and the coupon signing address so minting can begin. ***`
    );
  });

task(
  "upgradeTributeERC721",
  "Task to upgrade a TributeERC721 proxy's implementation"
)
  .addPositionalParam("proxyAddress")
  .setAction(async (taskArgs, hre) => {
    const { proxyAddress } = taskArgs;
    const { network } = hre.hardhatArguments;

    log(`Upgrade started at ${new Date().toISOString()}`);
    log(`Upgrading TributeERC721 at ${proxyAddress} on ${network} network`);

    const oldImplementation = await upgrades.erc1967.getImplementationAddress(
      proxyAddress
    );

    // Upgrading proxy. If new implementation already deployed, it will be reused.
    const TributeERC721V2 = await ethers.getContractFactory("TributeERC721");
    const res = await upgrades.upgradeProxy(proxyAddress, TributeERC721V2);
    await res.deployTransaction.wait(2); // Need to wait before fetching new implementation address.
    log(`Proxy implementation upgraded:`);

    const newImplementation = await upgrades.erc1967.getImplementationAddress(
      proxyAddress
    );

    log(`-- Old implementation address: ${oldImplementation}`);
    log(`-- New implementation address: ${newImplementation}`);

    // Verifying the proxy and implementation.
    log(
      `Verifying the proxy and implementation: npx hardhat verify --network ${network} ${proxyAddress}`
    );
    const { stderr, stdout } = await exec(
      `npx hardhat verify --network ${network} ${proxyAddress}`
    );
    stdout ? log(`Contracts verified: `) : log(stderr);
    const etherscanNetwork = network === "mainnet" ? "" : network + ".";
    log(
      `-- Proxy: https://${etherscanNetwork}etherscan.io/address/${proxyAddress}}`
    );
    log(
      `-- Implementation: https://${etherscanNetwork}etherscan.io/address/${newImplementation}}`
    );
    log(`Upgrade and verification completed at ${new Date().toISOString()}`);
  });
