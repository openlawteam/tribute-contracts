require("@nomiclabs/hardhat-waffle");

require("./tasks/accounts");
require("./tasks/deploy");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545", // Localhost (default: none)
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/6d106b8213de41e9921e1198c69a5cc4",
      gasPrice: 4000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC
      }
    },
    ropsten: {
      url: "https://ropsten.infura.io/v3/6d106b8213de41e9921e1198c69a5cc4",
      gasPrice: 4000000000,
      accounts: {
        mnemonic: process.env.WALLET_MNEMONIC
      }
    }
  },

  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
};
