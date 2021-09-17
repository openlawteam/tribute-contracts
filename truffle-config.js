/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

require("dotenv").config();
require("solidity-coverage");

const newHDProvider = (network) => {
  const HDWalletProvider = require("@truffle/hdwallet-provider");
  const infuraKey = process.env.INFURA_KEY;
  const alchemyKey = process.env.ALCHEMY_KEY;
  const mnemonic = process.env.TRUFFLE_MNEMONIC;

  let url;
  if (alchemyKey) {
    url = `wss://eth-${network}.ws.alchemyapi.io/v2/${alchemyKey}`;
  } else {
    url = `wss://${network}.infura.io/ws/v3/${infuraKey}`;
  }
  return new HDWalletProvider({
    mnemonic: {
      phrase: mnemonic,
    },
    providerOrUrl: url,
  });
};

module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: "1337", // Any network (default: none)
    },
    rinkeby: {
      provider: () => newHDProvider("rinkeby"),
      network_id: 4,
      skipDryRun: true,
      networkCheckTimeout: 10000,
      deploymentPollingInterval: 10000,
    },
    mainnet: {
      provider: () => newHDProvider("mainnet"),
      network_id: 1,
      skipDryRun: true,
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.0", // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: !(process.env.DISABLE_SOLC_OPTIMIZER == "true"),
          runs: 200,
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
