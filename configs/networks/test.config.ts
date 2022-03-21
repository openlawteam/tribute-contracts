import {
  contracts as defaultContracts,
  ContractConfig,
  ContractType,
} from "../contracts.config";
import { extensionsIdsMap } from "../../utils/dao-ids-util";

import {
  erc1155ExtensionAclFlagsMap,
  erc721ExtensionAclFlagsMap,
} from "../../utils/access-control-util";

const disabled: Array<string> = [];

const testContracts = [
  {
    id: "clone-factory-test",
    name: "CloneFactoryTest",
    alias: "cloneFactoryTest",
    path: "../../contracts/test/CloneFactoryTest",
    enabled: true,
    skipAutoDeploy: true,
    version: "1.0.0",
    type: ContractType.Factory,
    acls: {
      dao: [],
      extensions: {},
    },
    deploymentArgs: [],
  },
  {
    id: "erc1155-test",
    name: "ERC1155TestAdapterContract",
    alias: "erc1155TestAdapter",
    path: "../../contracts/test/ERC1155TestAdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        [extensionsIdsMap.ERC1155_EXT]: [
          erc1155ExtensionAclFlagsMap.INTERNAL_TRANSFER,
          erc1155ExtensionAclFlagsMap.WITHDRAW_NFT,
        ],
      },
    },
    deploymentArgs: [],
  },
  {
    id: "erc721-test",
    name: "ERC721TestAdapterContract",
    alias: "erc721TestAdapter",
    path: "../../contracts/test/ERC721TestAdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        [extensionsIdsMap.ERC721_EXT]: [
          erc721ExtensionAclFlagsMap.INTERNAL_TRANSFER,
          erc721ExtensionAclFlagsMap.WITHDRAW_NFT,
          erc721ExtensionAclFlagsMap.COLLECT_NFT,
        ],
      },
    },
    deploymentArgs: [],
  },
];

export const contracts: Array<ContractConfig> = defaultContracts
  .concat(testContracts)
  .map((c) => {
    if (disabled.find((e) => e === c.name)) {
      return { ...c, enabled: false };
    }
    return c;
  });
