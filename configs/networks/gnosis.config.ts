import {
  contracts as defaultContracts,
  ContractConfig,
} from "../contracts.config";

const disabled: Array<string> = [
  // Utility & Test Contracts disabled by default
  "OLToken",
  "TestToken1",
  "TestToken2",
  "TestFairShareCalc",
  "PixelNFT",
  "ProxToken",
  "ERC20Minter",
  "MockDao",
  "Multicall",
  "WETH",
  "ProxTokenContract",
  "ERC20MinterContract",
  // Adapters, Extensions and Factories disabled by default
  "NFTCollectionFactory",
  "ERC1271ExtensionFactory",
  "ExecutorExtensionFactory",
  "ERC1155TokenCollectionFactory",
  "NFTExtension",
  "ERC1271Extension",
  "ExecutorExtension",
  "ERC1155TokenExtension",
  "ERC1155AdapterContract",
  "FinancingContract",
  "OnboardingContract",
  "TributeContract",
  "TributeNFTContract",
  "LendNFTContract",
];

export const contracts: Array<ContractConfig> = defaultContracts.map((c) => {
  if (disabled.find((e) => e === c.name)) {
    return { ...c, enabled: false };
  }
  return c;
});
