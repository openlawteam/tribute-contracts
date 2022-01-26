require("dotenv").config();
require("solidity-coverage");
require("ts-node").register({
  files: true,
});
require("@nomiclabs/hardhat-waffle");
require("./tasks/accounts");
require("./tasks/deploy");

module.exports = {
  // Supported Networks
  networks: {
    // Test Networks
    hardhat: {
      network_id: "1337",
      count: 10,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
      throwOnTransactionFailures: true,
      throwOnCallFailures: false,
      loggingEnabled: true,
      allowUnlimitedContractSize: false,
    },
    ganache: {
      url: "http://127.0.0.1:7545",
    },
    goerli: {
      url: process.env.ETH_NODE_URL,
      network_id: 5,
      skipDryRun: true,
      gas: 2100000,
      gasPrice: 4000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    rinkeby: {
      url: process.env.ETH_NODE_URL,
      network_id: 4,
      skipDryRun: true,
      gas: 2100000,
      gasPrice: 4000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    ropsten: {
      url: process.env.ETH_NODE_URL,
      network_id: 3,
      gas: 2100000,
      gasPrice: 4000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    harmonytest: {
      url: process.env.ETH_NODE_URL,
      network_id: 1666700000,
      skipDryRun: true,
      gas: 2100000,
      gasPrice: 10000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    polygontest: {
      url: process.env.ETH_NODE_URL,
      network_id: 80001,
      skipDryRun: true,
      gas: 2100000,
      gasPrice: 10000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    coverage: {
      url: "http://127.0.0.1:8555",
      network_id: "*",
      gas: 0xfffffffffff,
      gasPrice: 10000000000,
    },

    // Main Networks
    mainnet: {
      url: process.env.ETH_NODE_URL,
      network_id: 1,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    harmony: {
      url: process.env.ETH_NODE_URL,
      network_id: 1666600000,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    polygon: {
      url: process.env.ETH_NODE_URL,
      network_id: 137,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
  },

  // Solc Settings
  solidity: {
    version: "0.8.9", // slither v0.8.2 does not support solc > 0.8.9
    settings: {
      optimizer: {
        enabled: !(process.env.DISABLE_SOLC_OPTIMIZER === "true"),
        runs: 200,
      },
    },
  },

  // Project Settings
  paths: {
    tests: "./test",
    sources: "./contracts",
    cache: "./build/cache",
    artifacts: "./build/artifacts",
  },

  // Smart Contract Verification APIs
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY, // Obtain one at https://etherscan.io/myapikey
  },

  // Additional Plugins
  plugins: ["truffle-plugin-verify", "truffle-contract-size"],
};

if (process.env.COVERAGE === "true") {
  require("solidity-coverage");
  module.exports.networks.hardhat.initialBaseFeePerGas = 0;
}
