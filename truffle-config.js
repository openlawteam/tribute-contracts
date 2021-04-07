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

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    ganache: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: "1337", // Any network (default: none)
    },
    rinkeby: {
      provider: function () {
        let infuraKey = process.env.INFURA_KEY;
        let HDWalletProvider = require("@truffle/hdwallet-provider");
        let mnemonic = process.env.TRUFFLE_MNEMONIC;
        let infuraUrl = "wss://rinkeby.infura.io/ws/v3/" + infuraKey;
        return new HDWalletProvider(mnemonic, infuraUrl);
      },
      network_id: 4,
      gasPrice: 10000000000,
      skipDryRun: true,
    },
    // Test network to run solidity coverage plugin.
    // Do not set the gas price because coverage distorts gas consumption. See https://github.com/sc-forks/solidity-coverage#usage-notes
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    enableTimeouts: false,
    useColors: true,
    // grep: "@skip-on-coverage", // Find everything with this tag
    // invert: true, // Run the grep's inverse set.
    // retries: 1,
    parallel: true,
    jobs: 2,
    reporter: "eth-gas-reporter",
    reporterOptions: {
      excludeContracts: [
        // Skip config contracts
        "Migration",
        // Skip Test Contracts
        "test/OLToken",
        "test/PixelNFT",
        "test/TestFairShareCalc",
        "test/TestToken1",
        "test/TestToken2",
        // Skip openzeppelin contracts
        "utils/ERC20",
        "utils/IERC20",
        "ERC721",
        "IERC721",
        "IERC721Receiver",
        "IERC721Enumerable",
        "IERC721Metadata",
        "Address",
        "Context",
        "Counters",
        "Strings",
        "ERC165",
        "IERC165",
        "EnumerableSet",
      ],
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

  // Test Coverage
  plugins: ["solidity-coverage"],
};
