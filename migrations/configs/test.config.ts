import {
  contracts as defaultContracts,
  ContractConfig,
  ContractType
} from "./contracts.config";
import { extensionsIdsMap } from "../../utils/dao-ids-util";

import {erc1155ExtensionAclFlagsMap} from "../../utils/access-control-util";

const disabled: Array<string> = [];

const testContracts = [{
  id: "erc1155-test",
  name: "ERC1155TestAdapter",
  alias: "erc1155TestAdapter",
  path: "../../contracts/test/ERC1155TestAdapterContract",
  enabled: true,
  version: "1.0.0",
  type: ContractType.Adapter,
  acls: {
    dao: [],
    extensions: {[extensionsIdsMap.ERC1155_EXT]: [
      erc1155ExtensionAclFlagsMap.INTERNAL_TRANSFER,
    ]},
  },
  deploymentArgs: [],
}];

export const contracts: Array<ContractConfig> = defaultContracts.concat(testContracts).map((c) => {
  if (disabled.find((e) => e === c.name)) {
    return { ...c, enabled: false };
  }
  return c;
});
