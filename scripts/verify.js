#!/usr/bin/env node

const util = require("util");
const path = require("path");
const { contracts } = require("../utils/ContractUtil");
const exec = util.promisify(require("child_process").exec);
const debugMode = process.env.DEBUG_CONTRACT_VERIFICATION || false;
const verifyCMD = `./node_modules/.bin/truffle run verify ${
  debugMode ? "--debug --network" : "--network"
}`;

const skipContracts = [
  "NFTExtension",
  // Test Contracts
  "OLToken",
  "TestToken1",
  "TestToken2",
  "TestFairShareCalc",
  "PixelNFT",
  // Already Verified
  "Multicall",
];

const args = process.argv.slice(2);
if (!args || args.length === 0)
  throw Error("Missing one of the network names: [rinkeby, ropsten, mainnet]");

const network = args[0] || "rinkeby";
console.log(`Selected Network: ${network}`);

const verify = async (contract) => {
  if (!contract || !contract.contractName || !contract.contractAddress)
    return Promise.resolve({ stderr: "missing contract name and address" });

  console.log(`Contract: ${contract.contractName}@${contract.contractAddress}`);

  const { stderr, stdout } = await exec(
    `${verifyCMD} ${network} ${contract.contractName}@${contract.contractAddress}`
  );

  if (stderr) console.error(stderr);
  if (stdout) console.log(stdout);

  return Promise.resolve();
};

const matchAddress = (input, contractName, regex) => {
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

const main = async () => {
  const deployLog = path.resolve(`logs/${network.toLowerCase()}-deploy.log`);
  console.log(`Reading deployed contracts from ${deployLog}`);

  const { stdout } = await exec(
    `cat ${deployLog} | grep -e "Deploying" -e "contract address:" -e "Cloned"`
  );
  const verifyContracts = Object.keys(contracts).filter(
    (c) => !skipContracts.includes(c)
  );

  // Verify all the deployed addresses first (including the identity/proxy contracts)
  // When the identity/proxy contracts are verified, the verification gets propagated
  // to the cloned ones because they have the exact same code.
  return verifyContracts
    .map((contractName) =>
      matchAddress(
        stdout,
        contractName,
        `Deploying\\s'${contractName}'\n.+contract address:\\s+\(.+\)\n`
      )
    )
    .reduce((p, c) => p.then(() => verify(c)), Promise.resolve());
};

main()
  .then(() => console.log("Verification process completed with success"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
