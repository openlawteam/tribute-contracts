const contracts = require("./contracts.config");

const disabled = [
  "OLToken",
  "TestToken1",
  "TestToken2",
  "TestFairShareCalc",
  "PixelNFT",
  "ProxToken",
  "ERC20Minter",
];

const mainnetContracts = contracts.map((c) => {
  if (disabled.find((e) => e === c.name)) {
    return { ...c, enabled: false };
  }
  return c;
});

module.exports = { contracts: mainnetContracts };
