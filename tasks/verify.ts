#!/usr/bin/env node

import util from "util";
import path from "path";
//import { contracts } from "../utils/contract-util";
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
  // Already Verified
  "Multicall",
  "MockDao",
  "ERC1155TestToken"
];

const args = process.argv.slice(2);
if (!args || args.length === 0)
  throw Error("Missing one of the network names: [rinkeby, ropsten, mainnet]");

const network = args[0] || "rinkeby";
console.log(`Selected Network: ${network}`);

const verify = async (contract: any) => {
  if (!contract || !contract.contractName || !contract.contractAddress)
    return Promise.resolve({ stderr: "missing contract name and address" });

  console.log(`Contract: ${contract.contractName}@${contract.contractAddress}`);
  try {
    const { stderr, stdout } = await exec(
      `${verifyCMD} ${network} ${contract.contractName}@${contract.contractAddress}`
    );
  
    if (stderr) console.error(stderr);
    if (stdout) console.log(stdout);
  } catch (err) {
    console.error(`${err}`);
  }

  return Promise.resolve();
};

const matchAddress = (input: string, contractName: string, regex: string) => {
  let matches = new RegExp(regex, "g").exec(input);

  let output = {};
  if (matches) {
    output = {
      contractName: contractName,
      contractAddress: matches[1],
    };
  }
  return output;
};

async function main() {
  const deployLog = path.resolve(`logs/${network.toLowerCase()}-deploy.log`);
  console.log(`Reading deployed contracts from ${deployLog}`);

  const { stdout } = await exec(
    `cat ${deployLog} | grep -e "Deploying" -e "contract address:" -e "Cloned"`
  );
  const { contracts } = require(`../migrations/configs/${network}.config`);
  const verifyContracts = contracts.filter(
    (c: any) => !skipContracts.includes(c.name)
  ).map((contract:any) => {
    const contractPath = contract.path.split("/");
    const contractName = contractPath[contractPath.length - 1];
    return require(`../build/contracts/${contractName}.json`);
  });

  // Verify all the deployed addresses first (including the identity/proxy contracts)
  // When the identity/proxy contracts are verified, the verification gets propagated
  // to the cloned ones because they have the exact same code.
  return verifyContracts
    .map((contract:any) => matchAddress(
      stdout,
      contract.contractName,
      `Deploying\\s'${contract.contractName}'\n.+contract address:\\s+\(.+\)\n`
    )
    )
    .reduce((p:any, c:any) => p.then(() => verify(c)), Promise.resolve());
}

main()
  .then(() => console.log("Verification process completed with success"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
