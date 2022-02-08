#!/usr/bin/env node

import dotenv from "dotenv";
import util from "util";
import path from "path";
import fs from "fs";
import inquirer from "inquirer";
import { deployConfigs } from "../deploy-config";
import { error, log } from "../utils/log-util";
import { ContractConfig } from "../configs/contracts.config";

const cfg = dotenv.config();
const exec = util.promisify(require("child_process").exec);
const verifierCmd = "npm run truffle-verifier";
const isDebug = cfg.parsed?.DEBUG === "true";

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

const sleep = (msec: number) => {
  return new Promise((resolve) => setTimeout(resolve, msec));
};

const getDeployedContracts = async (network: string) => {
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
      choices: buildDir.filter((f) => f.indexOf(network) > 0),
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

const buildCommand = (contract: any) => {
  let cmd = `${verifierCmd} --`;
  cmd = isDebug ? `${cmd} --debug` : cmd;
  cmd = `${cmd} --network ${network}`;
  cmd = `${cmd} ${contract.contractName}@${contract.contractAddress}`;
  return cmd;
};

const verify = async (contract: any) => {
  if (!contract || !contract.contractName || !contract.contractAddress)
    return Promise.resolve({ stderr: "missing contract name and address" });

  try {
    log(`Contract: ${contract.contractName}@${contract.contractAddress}`);
    const cmd = buildCommand(contract);
    log(cmd);
    const { stderr, stdout } = await exec(cmd);
    if (stderr) {
      error(`${stderr}`);
      return Promise.reject({ stderr });
    }
    if (stdout) log(stdout);
  } catch (err) {
    error(err);
  }

  return Promise.resolve();
};

const main = async () => {
  const deployedContracts = await getDeployedContracts(network);

  const {
    contracts: contractConfigs,
  } = require(`../configs/networks/${network}.config`);

  const verifyContracts = contractConfigs
    .filter((c: ContractConfig) => !skipContracts.includes(c.name))
    .map((c: ContractConfig) => {
      return {
        contractAddress: deployedContracts[c.name],
        contractName: c.name,
      };
    });

  let count = 1;
  return await verifyContracts.reduce(
    (p: any, c: any) =>
      p.then(async () => {
        const r = await verify(c);
        log(`[${count++}/${verifyContracts.length}]`);
        await sleep(1500); // avoid rate-limit errors
        return r;
      }),
    Promise.resolve(0)
  );
};

main()
  .then(() => log("Verification process completed with success"))
  .catch((e) => {
    error(e);
    process.exit(1);
  });
