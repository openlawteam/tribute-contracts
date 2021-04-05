module.exports = {
  norpc: false,
  compileCommand: "truffle compile",
  testCommand:
    "export ETHEREUM_RPC_PORT=8555 && truffle test --network coverage",
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
