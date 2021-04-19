require("dotenv").config();
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-solhint");
require("solidity-coverage");

// Ensure that we have all the environment variables we need.
let mnemonic;
if (!process.env.TRUFFLE_MNEMONIC) {
  throw new Error("Please set your TRUFFLE_MNEMONIC in a .env file");
} else {
  mnemonic = process.env.TRUFFLE_MNEMONIC;
}

function createLocalHostConfig() {
  const url = "http://localhost:7545";
  return {
    accounts: {
      count: 10,
      initialIndex: 0,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    url,
  };
}

module.exports = {
  defaultNetwork: "localhost",
  networks: {
    localhost: createLocalHostConfig(),
  },
  solidity: {
    version: "0.8.0",
    settings: {
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // https://hardhat.org/config/#path-configuration
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 20000,
  },
};
