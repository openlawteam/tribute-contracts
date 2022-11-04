require("dotenv").config();
require("ts-node").register({
  files: true,
});
require("solidity-coverage");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-web3");
require("hardhat-contract-sizer");
require("@openzeppelin/hardhat-upgrades");
if (!process.env.TEST === "true") {
  require("hardhat-gas-reporter");
}
require("./tasks/deploy");
require("./tasks/tributeERC721Tasks");
require("./signers");

module.exports = {
  // Supported Networks
  networks: {
    // Test Networks
    hardhat: {
      network_id: 1337,
      chainId: 1337,
      accounts: {
        mnemonic:
          "myth like bonus scare over problem client lizard pioneer submit female collect",
      },
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      loggingEnabled: false,
      allowUnlimitedContractSize: false,
      initialBaseFeePerGas: 0,
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      accounts: {
        count: 10,
        mnemonic:
          process.env.WALLET_MNEMONIC ||
          "myth like bonus scare over problem client lizard pioneer submit female collect",
      },
    },
    goerli: {
      url: process.env.ETH_NODE_URL,
      network_id: 5,
      chainId: 5,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC || "",
        count: 10,
      },
      signerId: process.env.SIGNER || undefined,
    },
    harmonytest: {
      url: process.env.ETH_NODE_URL,
      network_id: 1666700000,
      chainId: 1666700000,
      skipDryRun: true,
      gas: 2100000,
      gasPrice: 10000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC || "",
        count: 10,
      },
      signerId: process.env.SIGNER || undefined,
    },
    polygontest: {
      url: process.env.ETH_NODE_URL,
      network_id: 80001,
      chainId: 80001,
      skipDryRun: true,
      gas: 2100000,
      gasPrice: 10000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC || "",
        count: 10,
      },
      signerId: process.env.SIGNER || undefined,
    },
    coverage: {
      url: "http://127.0.0.1:8555",
      network_id: 1,
      chainId: 1,
      gas: 0xfffffffffff,
      gasPrice: 10000000000,
      initialBaseFeePerGas: 0,
    },
    avalanchetest: {
      url: process.env.ETH_NODE_URL,
      network_id: 43113,
      chainId: 43113,
      skipDryRun: true,
      gas: 2100000,
      gasPrice: 25000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC || "",
        count: 10,
      },
      signerId: process.env.SIGNER || undefined,
    },

    // Main Networks
    mainnet: {
      url: process.env.ETH_NODE_URL,
      network_id: 1,
      chainId: 1,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC || "",
        count: 10,
      },
      signerId: process.env.SIGNER || undefined,
    },
    harmony: {
      url: process.env.ETH_NODE_URL,
      network_id: 1666600000,
      chainId: 1666600000,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC || "",
        count: 10,
      },
      signerId: process.env.SIGNER || undefined,
    },
    polygon: {
      url: process.env.ETH_NODE_URL,
      network_id: 137,
      chainId: 137,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC || "",
        count: 10,
      },
      signerId: process.env.SIGNER || undefined,
    },
    avalanche: {
      url: process.env.ETH_NODE_URL,
      network_id: 43114,
      chainId: 43114,
      skipDryRun: true,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC || "",
        count: 10,
      },
      signerId: process.env.SIGNER || undefined,
    },
  },

  // External Signers configs
  signers: {
    googleKms: {
      enabled: process.env.KMS_GCP_SIGNER_ENABLED || false,
      projectId: process.env.KMS_PROJECT_ID || undefined,
      locationId: process.env.KMS_LOCATION_ID || undefined,
      keyRingId: process.env.KMS_KEY_RING_ID || undefined,
      keyId: process.env.KMS_KEY_ID || undefined,
      keyVersion: process.env.KMS_KEY_VERSION || undefined,
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
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: !(process.env.SOLC_OPTIMIZER === "false"),
    strict: true,
  },
  gasReporter: {
    enabled: true,
  },
  paths: {
    tests: "./test",
    sources: "./contracts",
    cache: "./build/cache",
    artifacts: "./build/artifacts",
  },

  etherscan: {
    apiKey: {
      goerli: process.env.ETHERSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
    },
  },
};
