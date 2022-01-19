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
    ganache: {
      url: "http://127.0.0.1:7545",
      network_id: "1337",
    },
    goerli: {
      url: process.env.ETH_NODE_URL,
      network_id: 5,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    rinkeby: {
      url: process.env.ETH_NODE_URL,
      network_id: 4,
      skipDryRun: true,
      networkCheckTimeout: 10000,
      deploymentPollingInterval: 10000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    ropsten: {
      url: process.env.ETH_NODE_URL,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
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
    harmonytest: {
      url: process.env.ETH_NODE_URL,
      network_id: 1666700000,
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
    polygontest: {
      url: process.env.ETH_NODE_URL,
      network_id: 80001,
      skipDryRun: true,
      gasPrice: 10000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    coverage: {
      url: "http://127.0.0.1:8555",
      network_id: "*",
      gas: 0xfffffffffff,
      gasPrice: 0x01,
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

  // Smart Contract Verification APIs
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY, // Obtain one at https://etherscan.io/myapikey
  },

  // Additional Plugins
  plugins: [
    "solidity-coverage",
    "truffle-plugin-verify",
    "truffle-contract-size",
  ],
};
