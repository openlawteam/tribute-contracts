import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, ".env") });

import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import "@nomiclabs/hardhat-ganache";

// Ensure that we have all the environment variables we need.
let mnemonic: string;
if (!process.env.TRUFFLE_MNEMONIC) {
  throw new Error("Please set your TRUFFLE_MNEMONIC in a .env file");
} else {
  mnemonic = process.env.TRUFFLE_MNEMONIC;
}

function createLocalHostConfig() {
  const url: string = "http://localhost:7545";
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

const config = {
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
    tests: "./subgraph/subgraph-tests",
    cache: "./subgraph/subgraph-tests/cache",
    artifacts: "./subgraph/subgraph-tests/artifacts",
  },
};

export default config;
