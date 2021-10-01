/**
 * @type import('hardhat/config').HardhatUserConfig
 */

 require('hardhat-storage-layout');

module.exports = {
  solidity: {
    version:"0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        // Optimize for how many times you intend to run the code.
        // Lower values will optimize more for initial deployment cost, higher
        // values will optimize more for high-frequency usage.
        runs: 200,
      },
      outputSelection: {
        "*": {
            "*": ["storageLayout"],
        },
      },
    }
  }
};
