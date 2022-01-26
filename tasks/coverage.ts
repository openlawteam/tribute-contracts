#!/usr/bin/env node
const { runCoverage } = require("@openzeppelin/test-environment");

const skipFiles = [
  "Migrations.sol",
  "adapters/interfaces/IConfiguration.sol",
  "adapters/interfaces/IDistribute.sol",
  "adapters/interfaces/IFinancing.sol",
  "adapters/interfaces/IGuildKick.sol",
  "adapters/interfaces/IManaging.sol",
  "adapters/interfaces/IOnboarding.sol",
  "adapters/interfaces/IRagequit.sol",
  "adapters/interfaces/ISignatures.sol",
  "adapters/interfaces/IVoting.sol",
  "extensions/IExtension.sol",
  "helpers/WETH.sol",
  "test/MockDao.sol",
  "test/ERC1155TestToken.sol",
  "test/ERC20Minter.sol",
  "test/OLToken.sol",
  "test/PixelNFT.sol",
  "test/ProxToken.sol",
  "test/TestFairShareCalc.sol",
  "test/TestToken1.sol",
  "test/TestToken2.sol",
  "test/ERC1155TestAdapter.sol",
  "utils/Multicall.sol",
  "companion/interfaces/IReimbursement.sol",
  "companion/GelatoBytes.sol",
  "companion/Gelatofied.sol",
  "companion/GelatoRelay.sol",
];

const main = async () => {
  await runCoverage(
    skipFiles,
    "SOLC_OPTIMIZER=false npm run compile",
    "./node_modules/.bin/mocha --timeout 2000000 --recursive --exit".split(" ")
  );
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
