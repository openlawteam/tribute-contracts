require("dotenv").config();
require("truffle-plugin-verify");
require("ts-node").register({
  files: true,
});

const getNetworkProvider = () => {
  const HDWalletProvider = require("@truffle/hdwallet-provider");

  if (!process.env.WALLET_MNEMONIC)
    throw Error("Missing environment variable: WALLET_MNEMONIC");

  if (!process.env.ETH_NODE_URL)
    throw Error("Missing environment variable: ETH_NODE_URL");

  return new HDWalletProvider({
    mnemonic: {
      phrase: process.env.WALLET_MNEMONIC,
    },
    providerOrUrl: process.env.ETH_NODE_URL,
  });
};

module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: "1337", // Any network (default: none)
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    goerli: {
      provider: getNetworkProvider,
      network_id: 5,
      skipDryRun: true,
    },
    rinkeby: {
      provider: getNetworkProvider,
      network_id: 4,
      chainId: 4,
      skipDryRun: true,
    },
    mainnet: {
      provider: getNetworkProvider,
      network_id: 1,
      skipDryRun: true,
    },
    harmony: {
      provider: getNetworkProvider,
      network_id: 1666600000,
      skipDryRun: true,
    },
    harmonytest: {
      provider: getNetworkProvider,
      network_id: 1666700000,
      skipDryRun: true,
    },
    polygon: {
      provider: getNetworkProvider,
      network_id: 137,
      skipDryRun: true,
    },
    polygontest: {
      provider: getNetworkProvider,
      network_id: 80001,
      skipDryRun: true,
      gasPrice: 10000000000,
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.9", // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: !(process.env.SOLC_OPTIMIZER === "false"),
          runs: 200,
        },
        //  evmVersion: "byzantium"
      },
    },
  },
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY, // Obtain one at https://etherscan.io/myapikey
  },
  plugins: ["truffle-plugin-verify"],
};
