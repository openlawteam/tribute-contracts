/**
import default from './website/.docusaurus/registry';
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

require("dotenv").config();
require("solidity-coverage");
require("ts-node").register({
  files: true,
});

const getHDWalletProvider = () => {
  const HDWalletProvider = require("@truffle/hdwallet-provider");

  if (!process.env.TRUFFLE_MNEMONIC)
    throw Error("Missing environment variable: TRUFFLE_MNEMONIC");

  if (!process.env.ETH_NODE_URL)
    throw Error("Missing environment variable: ETH_NODE_URL");

  return new HDWalletProvider({
    mnemonic: {
      phrase: process.env.TRUFFLE_MNEMONIC,
    },
    providerOrUrl: process.env.ETH_NODE_URL,
  });
};

const getOZDefenderProvider = () => {
  const { DefenderRelayProvider } = require("defender-relay-client/lib/web3");

  if (!process.env.DEFENDER_API_KEY)
    throw Error("Missing environment variable: DEFENDER_API_KEY");

  if (!process.env.DEFENDER_API_SECRET)
    throw Error("Missing environment variable: DEFENDER_API_SECRET");

  const provider = new DefenderRelayProvider(
    {
      apiKey: process.env.DEFENDER_API_KEY,
      apiSecret: process.env.DEFENDER_API_SECRET,
    },
    {
      speed: "fast",
    }
  );

  return provider;
};

const getNetworkProvider = () => {
  switch (process.env.RELAYER) {
    case "defender":
      return getOZDefenderProvider();
    default:
      return getHDWalletProvider();
  }
};

module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: "1337", // Any network (default: none)
    },
    goerli: {
      provider: getNetworkProvider,
      network_id: 5,
      skipDryRun: true,
    },
    rinkeby: {
      provider: getNetworkProvider,
      network_id: 4,
      skipDryRun: true,
      networkCheckTimeout: 10000,
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
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.10", // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: !(process.env.DISABLE_SOLC_OPTIMIZER === "true"),
          runs: 10000,
        },
        //  evmVersion: "byzantium"
      },
    },
  },
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY, // Obtain one at https://etherscan.io/myapikey
  },
  plugins: [
    "solidity-coverage",
    "truffle-plugin-verify",
    "truffle-contract-size",
  ],
};
