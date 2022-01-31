require("dotenv").config();
require("ts-node").register({
  files: true,
});
require("solidity-coverage");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("./tasks/accounts");
require("./tasks/deploy");
require("./relayers");

module.exports = {
  // Supported Networks
  networks: {
    // Test Networks
    hardhat: {
      network_id: 1337,
      chainId: 1337,
      count: 10,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
      throwOnTransactionFailures: true,
      throwOnCallFailures: false,
      loggingEnabled: true,
      allowUnlimitedContractSize: false,
      gas: 0xfffffffffff,
      gasPrice: 10000000000,
      initialBaseFeePerGas: 0,
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1,
    },
    goerli: {
      url: process.env.ETH_NODE_URL,
      network_id: 5,
      chainId: 5,
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
      chainId: 4,
      skipDryRun: true,
      gas: 2100000,
      gasPrice: 4000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
      relayerId: process.env.RELAYER,
    },
    ropsten: {
      url: process.env.ETH_NODE_URL,
      network_id: 3,
      chainId: 3,
      gas: 2100000,
      gasPrice: 4000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    harmonytest: {
      url: process.env.ETH_NODE_URL,
      network_id: 1666700000,
      chainId: 1666700000,
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
      chainId: 80001,
      skipDryRun: true,
      gas: 2100000,
      gasPrice: 10000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    coverage: {
      url: "http://127.0.0.1:8555",
      network_id: 1,
      chainId: 1,
      gas: 0xfffffffffff,
      gasPrice: 10000000000,
      initialBaseFeePerGas: 0,
    },

    // Main Networks
    mainnet: {
      url: process.env.ETH_NODE_URL,
      network_id: 1,
      chainId: 1,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    harmony: {
      url: process.env.ETH_NODE_URL,
      network_id: 1666600000,
      chainId: 1666600000,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
    polygon: {
      url: process.env.ETH_NODE_URL,
      network_id: 137,
      chainId: 137,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC,
      },
    },
  },

  // Relayers or External Signers configs
  relayers: {
    defender: {
      enabled: false,
      apiKey: process.env.DEFENDER_API_KEY,
      apiSecret: process.env.DEFENDER_API_SECRET,
    },
    googleKms: {
      enabled: true,
      projectId: process.env.KMS_PROJECT_ID,
      locationId: process.env.KMS_LOCATION_ID,
      keyRingId: process.env.KMS_KEY_RING_ID,
      keyId: process.env.KMS_KEY_ID,
      keyVersion: process.env.KMS_KEY_VERSION,
    },
  },

  // Solc Settings
  solidity: {
    version: "0.8.9", // slither v0.8.2 does not support solc > 0.8.9
    settings: {
      optimizer: {
        enabled: !(process.env.SOLC_OPTIMIZER === "false"),
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
};
