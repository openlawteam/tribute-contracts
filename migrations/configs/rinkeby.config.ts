import { adaptersIdsMap } from "../../utils/dao-ids-util";
import { contracts as defaultContracts } from "./contracts.config";
import { getNetworkDetails } from "../../utils/deployment-util";

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
];

export const contracts = defaultContracts
  .map((c) => {
    if (disabled.find((e) => e === c.name)) {
      return { ...c, enabled: false };
    }
    return c;
  })
  .map((c) => {
    if (adaptersIdsMap.COUPON_MANAGER_ADAPTER === c.id) {
      const chainDetails = getNetworkDetails("rinkeby");
      return {
        ...c,
        deploymentArgs: {
          chainId: chainDetails?.chainId,
        },
      };
    }
    return c;
  });
