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
