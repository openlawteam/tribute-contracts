import {
  daoAccessFlagsMap,
  bankExtensionAclFlagsMap,
  erc721ExtensionAclFlagsMap,
  erc1155ExtensionAclFlagsMap,
  erc1271ExtensionAclFlagsMap,
  vestingExtensionAclFlagsMap,
  entryBank,
  entryERC20,
  entryERC721,
  entryERC1155,
  entryERC1271,
  entryExecutor,
  entryVesting,
  ACLBuilder,
  SelectedACLs,
} from "../utils/access-control-util";

import { extensionsIdsMap, adaptersIdsMap } from "../utils/dao-ids-util";

// Matches the DaoArtifacts.sol ArtifactType enum
enum ContractType {
  Core = 0,
  Factory = 1,
  Extension = 2,
  Adapter = 3,
  Util = 4,
  Test = 5,
}

export type ContractConfig = {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  version: string;
  type: ContractType;
  acls?: SelectedACLs;
  buildAclFlag?: ACLBuilder;
};

export const contracts: Array<ContractConfig> = [
  // Test Util Contracts
  {
    id: "ol-token",
    name: "OLToken",
    path: "../contracts/test/OLToken",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    id: "mock-dao",
    name: "MockDao",
    path: "../contracts/test/MockDao",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    id: "test-token-1",
    name: "TestToken1",
    path: "../contracts/test/TestToken1",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    id: "test-token-2",
    name: "TestToken2",
    path: "../contracts/test/TestToken2",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    id: "test-fairshare-calc",
    name: "TestFairShareCalc",
    path: "../contracts/test/TestFairShareCalc",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    id: "pixel-nft",
    name: "PixelNFT",
    path: "../contracts/test/PixelNFT",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    id: "prox-token",
    name: "ProxToken",
    path: "../contracts/test/ProxTokenContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    id: "erc20-minter",
    name: "ERC20Minter",
    path: "../contracts/test/ERC20MinterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    id: "erc1155-test-token",
    name: "ERC1155TestToken",
    path: "../contracts/test/ERC1155TestToken",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },

  // DAO Factories Contracts
  {
    id: "dao-factory",
    name: "DaoFactory",
    path: "../contracts/core/DaoFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    id: "dao-registry",
    name: "DaoRegistry",
    path: "../contracts/core/DaoRegistry",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Core,
  },
  {
    id: "nft-collection-factory",
    name: "NFTCollectionFactory",
    path: "../contracts/extensions/NFTCollectionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    id: "bank-factory",
    name: "BankFactory",
    path: "../contracts/extensions/bank/BankFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    id: "erc20-extension-factory",
    name: "ERC20TokenExtensionFactory",
    path: "../contracts/extensions/token/erc20/ERC20TokenExtensionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    id: "vesting-extension-factory",
    name: "InternalTokenVestingExtensionFactory",
    path:
      "../contracts/extensions/token/erc20/InternalTokenVestingExtensionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    id: "erc1271-extension-factory",
    name: "ERC1271ExtensionFactory",
    path: "../contracts/extensions/erc1271/ERC1271ExtensionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    id: "executor-extension-factory",
    name: "ExecutorExtensionFactory",
    path: "../contracts/extensions/executor/ExecutorExtensionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    id: "erc1155-extension-factory",
    name: "ERC1155TokenCollectionFactory",
    path: "../contracts/extensions/erc1155/ERC1155TokenCollectionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },

  // Extensions
  {
    id: extensionsIdsMap.ERC721_EXT,
    name: "NFTExtension",
    path: "../contracts/extensions/nft/NFTExtension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
    buildAclFlag: entryERC721,
    acls: {
      dao: [],
      extensions: {},
    },
  },
  {
    id: extensionsIdsMap.BANK_EXT,
    name: "BankExtension",
    path: "../contracts/extensions/bank/BankExtension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
    buildAclFlag: entryBank,
    acls: {
      dao: [],
      extensions: {},
    },
  },
  {
    id: extensionsIdsMap.ERC20_EXT,
    name: "ERC20Extension",
    path: "../contracts/extensions/token/erc20/ERC20Extension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
    buildAclFlag: entryERC20,

    acls: {
      dao: [daoAccessFlagsMap.NEW_MEMBER],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
      },
    },
  },
  {
    id: extensionsIdsMap.VESTING_EXT,
    name: "InternalTokenVestingExtension",
    path: "../contracts/extensions/token/erc20/InternalTokenVestingExtension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
    buildAclFlag: entryVesting,
    acls: {
      dao: [],
      extensions: {},
    },
  },
  {
    id: extensionsIdsMap.ERC1271_EXT,
    name: "ERC1271Extension",
    path: "../contracts/extensions/erc1271/ERC1271Extension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
    buildAclFlag: entryERC1271,
    acls: {
      dao: [],
      extensions: {},
    },
  },
  {
    id: extensionsIdsMap.EXECUTOR_EXT,
    name: "ExecutorExtension",
    path: "../contracts/extensions/executor/ExecutorExtension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
    buildAclFlag: entryExecutor,
    acls: {
      dao: [],
      extensions: {},
    },
  },
  {
    id: extensionsIdsMap.ERC1155_EXT,
    name: "ERC1155TokenExtension",
    path: "../contracts/extensions/erc1155/ERC1155TokenExtension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
    buildAclFlag: entryERC1155,
    acls: {
      dao: [],
      extensions: {},
    },
  },

  // Config Adapters
  {
    id: adaptersIdsMap.DAO_REGISTRY_ADAPTER,
    name: "DaoRegistryAdapterContract",
    path: "../contracts/adapters/DaoRegistryAdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.UPDATE_DELEGATE_KEY],
      extensions: {},
    },
  },
  {
    id: adaptersIdsMap.BANK_ADAPTER,
    name: "BankAdapterContract",
    path: "../contracts/adapters/BankAdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.WITHDRAW,
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.UPDATE_TOKEN,
        ],
      },
    },
  },
  {
    id: adaptersIdsMap.ERC721_ADAPTER,
    name: "NFTAdapterContract",
    path: "../contracts/adapters/NFTAdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        [extensionsIdsMap.ERC721_EXT]: [erc721ExtensionAclFlagsMap.COLLECT_NFT],
        [extensionsIdsMap.ERC1155_EXT]: [
          erc1155ExtensionAclFlagsMap.COLLECT_NFT,
        ],
      },
    },
  },
  {
    id: adaptersIdsMap.CONFIGURATION_ADAPTER,
    name: "ConfigurationContract",
    path: "../contracts/adapters/ConfigurationContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [
        daoAccessFlagsMap.SUBMIT_PROPOSAL,
        daoAccessFlagsMap.SET_CONFIGURATION,
      ],
      extensions: {},
    },
  },
  {
    id: adaptersIdsMap.ERC1155_ADAPTER,
    name: "ERC1155AdapterContract",
    path: "../contracts/adapters/ERC1155AdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        [extensionsIdsMap.ERC721_EXT]: [
          erc721ExtensionAclFlagsMap.COLLECT_NFT,
          erc721ExtensionAclFlagsMap.WITHDRAW_NFT,
          erc721ExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
        [extensionsIdsMap.ERC1155_EXT]: [
          erc1155ExtensionAclFlagsMap.COLLECT_NFT,
          erc1155ExtensionAclFlagsMap.WITHDRAW_NFT,
          erc1155ExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
      },
    },
  },
  {
    id: adaptersIdsMap.MANAGING_ADAPTER,
    name: "ManagingContract",
    path: "../contracts/adapters/ManagingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [
        daoAccessFlagsMap.SUBMIT_PROPOSAL,
        daoAccessFlagsMap.REPLACE_ADAPTER,
        daoAccessFlagsMap.ADD_EXTENSION,
        daoAccessFlagsMap.REMOVE_EXTENSION,
      ],
      extensions: {},
    },
  },

  // Signature Adapters
  {
    id: adaptersIdsMap.ERC1271_ADAPTER,
    name: "SignaturesContract",
    path: "../contracts/adapters/SignaturesContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL],
      extensions: {
        [extensionsIdsMap.ERC1271_EXT]: [erc1271ExtensionAclFlagsMap.SIGN],
      },
    },
  },

  // Voting Adapters
  {
    id: adaptersIdsMap.VOTING_ADAPTER,
    name: "VotingContract",
    path: "../contracts/adapters/VotingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {},
    },
  },
  {
    id: adaptersIdsMap.SNAPSHOT_PROPOSAL_ADAPTER,
    name: "SnapshotProposalContract",
    path: "../contracts/adapters/voting/SnapshotProposalContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {},
    },
  },
  {
    id: adaptersIdsMap.VOTING_ADAPTER,
    name: "OffchainVotingContract",
    path: "../contracts/adapters/voting/OffchainVotingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
      },
    },
  },
  {
    id: adaptersIdsMap.VOTING_HASH_ADAPTER,
    name: "OffchainVotingHashContract",
    path: "../contracts/adapters/voting/OffchainVotingHashContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {},
    },
  },
  {
    id: adaptersIdsMap.KICK_BAD_REPORTER_ADAPTER,
    name: "KickBadReporterAdapter",
    path: "../contracts/adapters/voting/KickBadReporterAdapter",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {},
    },
  },

  // Withdraw / Kick Adapters
  {
    id: adaptersIdsMap.RAGEQUIT_ADAPTER,
    name: "RagequitContract",
    path: "../contracts/adapters/RagequitContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
        ],
      },
    },
  },
  {
    id: adaptersIdsMap.GUILDKICK_ADAPTER,
    name: "GuildKickContract",
    path: "../contracts/adapters/GuildKickContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
          bankExtensionAclFlagsMap.REGISTER_NEW_TOKEN,
        ],
      },
    },
  },
  {
    id: adaptersIdsMap.DISTRIBUTE_ADAPTER,
    name: "DistributeContract",
    path: "../contracts/adapters/DistributeContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
      },
    },
  },

  // Funding/Onboarding Adapters
  {
    id: adaptersIdsMap.FINANCING_ADAPTER,
    name: "FinancingContract",
    path: "../contracts/adapters/FinancingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
        ],
      },
    },
  },
  {
    id: adaptersIdsMap.ONBOARDING_ADAPTER,
    name: "OnboardingContract",
    path: "../contracts/adapters/OnboardingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [
        daoAccessFlagsMap.SUBMIT_PROPOSAL,
        daoAccessFlagsMap.UPDATE_DELEGATE_KEY,
        daoAccessFlagsMap.NEW_MEMBER,
      ],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
      },
    },
  },
  {
    id: adaptersIdsMap.COUPON_ONBOARDING_ADAPTER,
    name: "CouponOnboardingContract",
    path: "../contracts/adapters/CouponOnboardingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.NEW_MEMBER],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
        ],
      },
    },
  },
  {
    id: adaptersIdsMap.TRIBUTE_ADAPTER,
    name: "TributeContract",
    path: "../contracts/adapters/TributeContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL, daoAccessFlagsMap.NEW_MEMBER],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
          bankExtensionAclFlagsMap.REGISTER_NEW_TOKEN,
        ],
      },
    },
  },
  {
    id: adaptersIdsMap.TRIBUTE_NFT_ADAPTER,
    name: "TributeNFTContract",
    path: "../contracts/adapters/TributeNFTContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL, daoAccessFlagsMap.NEW_MEMBER],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [bankExtensionAclFlagsMap.ADD_TO_BALANCE],
        [extensionsIdsMap.ERC721_EXT]: [erc721ExtensionAclFlagsMap.COLLECT_NFT],
      },
    },
  },
  {
    id: adaptersIdsMap.LEND_NFT_ADAPTER,
    name: "LendNFTContract",
    path: "../contracts/adapters/LendNFTContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL, daoAccessFlagsMap.NEW_MEMBER],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
        ],
        [extensionsIdsMap.ERC721_EXT]: [
          erc721ExtensionAclFlagsMap.COLLECT_NFT,
          erc721ExtensionAclFlagsMap.WITHDRAW_NFT,
        ],
        [extensionsIdsMap.ERC1155_EXT]: [
          erc1155ExtensionAclFlagsMap.COLLECT_NFT,
          erc1155ExtensionAclFlagsMap.WITHDRAW_NFT,
        ],
        [extensionsIdsMap.VESTING_EXT]: [
          vestingExtensionAclFlagsMap.NEW_VESTING,
          vestingExtensionAclFlagsMap.REMOVE_VESTING,
        ],
      },
    },
  },
  // ERC20 Util
  {
    id: adaptersIdsMap.ERC20_TRANSFER_STRATEGY_ADAPTER,
    name: "ERC20TransferStrategy",
    path: "../contracts/extensions/token/erc20/ERC20TransferStrategy",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
      },
    },
  },

  // Utils
  {
    id: "dao-artifacts",
    name: "DaoArtifacts",
    path: "../contracts/utils/DaoArtifacts",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Util,
  },
  {
    id: "multicall",
    name: "Multicall",
    path: "../contracts/utils/Multicall",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Util,
  },
];

export const getConfig = (name: string) => {
  return contracts.find((c) => c.name === name);
};

export const isDeployable = (name: string) => {
  const c = getConfig(name);
  return c && c.enabled;
};
