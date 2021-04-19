#!/usr/bin/env node
const { runCoverage } = require("@openzeppelin/test-environment");

const skipFiles = [
  // Skip config contracts
  "Migration",
  // Skip Test Contracts
  "OLToken",
  "PixelNFT",
  "TestFairShareCalc",
  "TestToken1",
  "TestToken2",
  // // Skip openzeppelin contracts
  // "utils/ERC20",
  // "utils/IERC20",
  // "ERC721",
  // "IERC721",
  // "IERC721Receiver",
  // "IERC721Enumerable",
  // "IERC721Metadata",
  // "Address",
  // "Context",
  // "Counters",
  // "Strings",
  // "ERC165",
  // "IERC165",
  // "EnumerableSet",
];

async function main() {
  await runCoverage(
    skipFiles,
    "npm run compile",
    "./node_modules/.bin/mocha --exit --timeout 20000 --recursive".split(" ")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
