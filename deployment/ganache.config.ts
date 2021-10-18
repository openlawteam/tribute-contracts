import {
  contracts as defaultContracts,
  ContractConfig,
} from "./contracts.config";

const disabled: Array<string> = [];

export const contracts: Array<ContractConfig> = defaultContracts.map((c) => {
  if (disabled.find((e) => e === c.name)) {
    return { ...c, enabled: false };
  }
  return c;
});
