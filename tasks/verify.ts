#!/usr/bin/env node

import util from "util";
import path from "path";
import fs from "fs";
import inquirer from "inquirer";
import { deployConfigs } from "../deploy-config";
import { error, log } from "../utils/log-util";
import { ContractConfig } from "../configs/contracts.config";

const exec = util.promisify(require("child_process").exec);
const debugMode = process.env.DEBUG_CONTRACT_VERIFICATION || false;
const verifyCMD = `./node_modules/.bin/truffle run verify ${
  debugMode ? "--debug --network" : "--network"
}`;

const skipContracts = [
  // Test Contracts
  "OLToken",
  "TestToken1",
  "TestToken2",
  "TestFairShareCalc",
  "PixelNFT",
  "ProxToken",
  "ERC20Minter",
  "MockDao",
  "ERC1155TestToken",
  "Multicall",
];

const args = process.argv.slice(2);
if (!args || args.length === 0)
  throw Error("Missing one of the network names: [rinkeby, ropsten, mainnet]");

const network = args[0] || "rinkeby";
log(`Selected Network: ${network}`);

const getDeployedContracts = async () => {
  const buildDir = fs.readdirSync(
    path.resolve(deployConfigs.deployedContractsDir)
  );
  if (!buildDir || buildDir.length === 0) {
    error(
      `No deployed contracts found in ${deployConfigs.deployedContractsDir}`
    );
    process.exit(1);
  }

  const { fileName } = await inquirer.prompt([
    {
      type: "list",
      name: "fileName",
      message: "Please select one of the deployment files to be verified",
      choices: buildDir,
    },
  ]);
  const deployFile = `${deployConfigs.deployedContractsDir}/${fileName}`;
  log(`Reading deployed contracts from: ${deployFile}`);
  const deployedContracts = JSON.parse(
    fs.readFileSync(path.resolve(deployFile), "utf8")
  );
  log({ deployedContracts });
  return deployedContracts;
};

const verify = async (contract: any) => {
  if (!contract || !contract.contractName || !contract.contractAddress)
    return Promise.resolve({ stderr: "missing contract name and address" });

  log(`Contract: ${contract.contractName}@${contract.contractAddress}`);
  try {
    const { stderr, stdout } = await exec(
      `${verifyCMD} ${network} ${contract.contractName}@${contract.contractAddress}`
    );

    if (stderr) console.error(stderr);
    if (stdout) console.log(stdout);
  } catch (err) {
    error(`${err}`);
  }

  return Promise.resolve();
};

const main = async () => {
  const deployedContracts = await getDeployedContracts();

  const {
    contracts: contractConfigs,
  } = require(`../configs/networks/${network}.config`);

  // Verify all the deployed addresses first (including the identity/proxy contracts)
  // When the identity/proxy contracts are verified, the verification gets propagated
  // to the cloned ones because they have the exact same code.
  return await contractConfigs
    .filter((c: ContractConfig) => !skipContracts.includes(c.name))
    .map((c: ContractConfig) => {
      return {
        contractAddress: deployedContracts[c.name],
        contractName: c.name,
      };
    })
    .reduce((p: any, c: any) => p.then(() => verify(c)), Promise.resolve());
};

main()
  .then(() => log("Verification process completed with success"))
  .catch((e) => {
    error(e);
    process.exit(1);
  });
