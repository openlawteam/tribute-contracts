import {
  contracts as defaultContracts,
  ContractConfig,
} from "./contracts.config";

const disabled: Array<String> = [
  // Utility & Test Contracts disabled by default
  "OLToken",
  "TestToken1",
  "TestToken2",
  "TestFairShareCalc",
  "PixelNFT",
  "ProxToken",
  "ERC20Minter",
  "MockDao",
  // Adapters disabled for Muse0 DAO Deployment
  "RagequitContract",
  "FinancingContract",
  "OnboardingContract",
  "TributeContract",
  "DistributeContract",
];

export const contracts: Array<ContractConfig> = defaultContracts.map((c) => {
  if (disabled.find((e) => e === c.name)) {
    return { ...c, enabled: false };
  }
  return c;
});
