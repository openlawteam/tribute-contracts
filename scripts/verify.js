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
  if (!contract)
    return Promise.resolve({ stderr: "missing contract name and address" });

  const { stderr, stdout } = await exec(
    `${verifyCMD} ${network} ${contract.contractName}@${contract.contractAddress}`
  );

  if (stderr) console.error(stderr);
  if (stdout) console.log(stdout);

  return { stderr, stdout };
};

const main = async () => {
  const deployLog = path.resolve(`${network.toLowerCase()}-deploy.log`);
  console.log(`Reading deployed contracts from ${deployLog}`);

  const { stdout } = await exec(
    `cat ${deployLog} | grep -e Deploying -e "contract address:"`
  );

  return Object.keys(contracts)
    .filter((c) => !skipContracts.includes(c))
    .map(
      (contractName) =>
        new RegExp(
          `Deploying\\s'\(${contractName}\)'\n.+contract address:\\s+(.+)\n`,
          "g"
        )
    )
    .map((regex) => {
      let res = regex.exec(stdout);
      if (res && res.length == 3)
        return { contractName: res[1], contractAddress: res[2] };
      return null;
    })
    .reduce((p, c) => p.then(() => verify(c)), Promise.resolve());
};

main()
  .then(() => console.log("Verification process completed with success"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
