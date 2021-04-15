module.exports = {
  norpc: true,
  testCommand: "npm test",
  compileCommand: "npm run compile",
  providerOptions: {
    default_balance_ether: "10000000000000000000000000",
  },
  skipFiles: [
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
};
