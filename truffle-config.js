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

module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: "1337", // Any network (default: none)
    },
    rinkeby: {
      provider: function () {
        let infuraKey = process.env.INFURA_KEY;
        let HDWalletProvider = require("@truffle/hdwallet-provider");
        let mnemonic = process.env.TRUFFLE_MNEMONIC;
        let infuraUrl = "wss://rinkeby.infura.io/ws/v3/" + infuraKey;
        //let infuraUrl = "http://127.0.0.1:8545";
        return new HDWalletProvider(mnemonic, infuraUrl);
      },
      network_id: 4,
      gasPrice: 12000000000,
      skipDryRun: true,
    },
    mainnet: {
      provider: function () {
        let infuraKey = process.env.INFURA_KEY;
        let HDWalletProvider = require("@truffle/hdwallet-provider");
        let mnemonic = process.env.TRUFFLE_MNEMONIC;
        let infuraUrl = "wss://mainnet.infura.io/ws/v3/" + infuraKey;
        //let infuraUrl = "ws://mainnet.openlaw.io:8546";
        //let infuraUrl = "http://127.0.0.1:8545";
        return new HDWalletProvider(mnemonic, infuraUrl);
      },
      network_id: 1,
      gasPrice: 100000000000,
      skipDryRun: true,
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
      version: "0.8.0", // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 10000,
        },
        //  evmVersion: "byzantium"
      },
    },
  },
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY, // Obtain one at https://etherscan.io/myapikey
  },
  plugins: ["solidity-coverage", "truffle-plugin-verify"],
};
