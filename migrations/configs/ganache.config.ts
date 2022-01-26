import {
  contracts as defaultContracts,
  ContractConfig,
} from "./contracts.config";

const disabled: Array<string> = [
  // Utility & Test Contracts disabled by default
  "OLToken",
  "TestFairShareCalc",
  "PixelNFT",
  "ProxToken",
  "ERC20Minter",
  "MockDao",
];

export const contracts: Array<ContractConfig> = defaultContracts.map((c) => {
  if (disabled.find((e) => e === c.name)) {
    return { ...c, enabled: false };
  }
  return c;
});
