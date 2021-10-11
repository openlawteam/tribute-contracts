const {
  daoAccessFlagsMap,
  bankExtensionAclFlagsMap,
  erc721ExtensionAclFlagsMap,
  erc1155ExtensionAclFlagsMap,
  erc1271ExtensionAclFlagsMap,
  vestingExtensionAclFlagsMap,
} = require("../utils/aclFlags");

// Matches the DaoArtifacts.sol ArtifactType enum
const ContractType = {
  Core: 0,
  Factory: 1,
  Extension: 2,
  Adapter: 3,
  Util: 4,
  Test: 5,
};

const contracts = [
  // Test Util Contracts
  {
    name: "OLToken",
    path: "../contracts/test/OLToken",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    name: "MockDao",
    path: "../contracts/test/MockDao",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    name: "TestToken1",
    path: "../contracts/test/TestToken1",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    name: "TestToken2",
    path: "../contracts/test/TestToken2",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    name: "TestFairShareCalc",
    path: "../contracts/test/TestFairShareCalc",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    name: "PixelNFT",
    path: "../contracts/test/PixelNFT",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    name: "ProxToken",
    path: "../contracts/test/ProxTokenContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    name: "ERC20Minter",
    path: "../contracts/test/ERC20MinterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },
  {
    name: "ERC1155TestToken",
    path: "../contracts/test/ERC1155TestToken",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Test,
  },

  // DAO Factories Contracts
  {
    name: "DaoFactory",
    path: "../contracts/core/DaoFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    name: "DaoRegistry",
    path: "../contracts/core/DaoRegistry",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Core,
  },
  {
    name: "NFTCollectionFactory",
    path: "../contracts/extensions/NFTCollectionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    name: "BankFactory",
    path: "../contracts/extensions/bank/BankFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    name: "ERC20TokenExtensionFactory",
    path: "../contracts/extensions/token/erc20/ERC20TokenExtensionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    name: "InternalTokenVestingExtensionFactory",
    path:
      "../contracts/extensions/token/erc20/InternalTokenVestingExtensionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    name: "ERC1271ExtensionFactory",
    path: "../contracts/extensions/erc1271/ERC1271ExtensionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    name: "ExecutorExtensionFactory",
    path: "../contracts/extensions/executor/ExecutorExtensionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },
  {
    name: "ERC1155TokenCollectionFactory",
    path: "../contracts/extensions/erc1155/ERC1155TokenCollectionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
  },

  // Extensions
  {
    name: "NFTExtension",
    path: "../contracts/extensions/nft/NFTExtension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
  },
  {
    name: "BankExtension",
    path: "../contracts/extensions/bank/BankExtension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
  },
  {
    name: "ERC20Extension",
    path: "../contracts/extensions/token/erc20/ERC20Extension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
    acls: {
      dao: [daoAccessFlagsMap.NEW_MEMBER],
      extensions: {
        bank: [bankExtensionAclFlagsMap.INTERNAL_TRANSFER],
      },
    },
  },
  {
    name: "InternalTokenVestingExtension",
    path: "../contracts/extensions/token/erc20/InternalTokenVestingExtension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
  },
  {
    name: "ERC1271Extension",
    path: "../contracts/extensions/erc1271/ERC1271Extension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
  },
  {
    name: "ExecutorExtension",
    path: "../contracts/extensions/executor/ExecutorExtension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
  },
  {
    name: "ERC1155TokenExtension",
    path: "../contracts/extensions/erc1155/ERC1155TokenExtension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
  },

  // Config Adapters
  {
    name: "DaoRegistryAdapterContract",
    path: "../contracts/adapters/DaoRegistryAdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.UPDATE_DELEGATE_KEY],
      extensions: {
        bank: [],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "BankAdapterContract",
    path: "../contracts/adapters/BankAdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        bank: [
          bankExtensionAclFlagsMap.WITHDRAW,
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.UPDATE_TOKEN,
        ],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "NFTAdapterContract",
    path: "../contracts/adapters/NFTAdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        bank: [],
        erc20: [],
        erc721: [erc721ExtensionAclFlagsMap.COLLECT_NFT],
        erc1155: [erc1155ExtensionAclFlagsMap.COLLECT_NFT],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
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
      extensions: {
        bank: [],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "ERC1155AdapterContract",
    path: "../contracts/adapters/ERC1155AdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        bank: [],
        erc20: [],
        erc721: [
          erc721ExtensionAclFlagsMap.COLLECT_NFT,
          erc721ExtensionAclFlagsMap.WITHDRAW_NFT,
          erc721ExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
        erc1155: [
          erc1155ExtensionAclFlagsMap.COLLECT_NFT,
          erc1155ExtensionAclFlagsMap.WITHDRAW_NFT,
          erc1155ExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
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
      extensions: {
        bank: [],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },

  // Signature Adapters
  {
    name: "SignaturesContract",
    path: "../contracts/adapters/SignaturesContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL],
      extensions: {
        bank: [],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [erc1271ExtensionAclFlagsMap.SIGN],
        vesting: [],
        executor: [],
      },
    },
  },

  // Voting Adapters
  {
    name: "VotingContract",
    path: "../contracts/adapters/VotingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        bank: [],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "SnapshotProposalContract",
    path: "../contracts/adapters/voting/SnapshotProposalContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        bank: [],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "OffchainVotingContract",
    path: "../contracts/adapters/voting/OffchainVotingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        bank: [
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "OffchainVotingHashContract",
    path: "../contracts/adapters/voting/OffchainVotingHashContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        bank: [],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "KickBadReporterAdapter",
    path: "../contracts/adapters/voting/KickBadReporterAdapter",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        bank: [],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },

  // Withdraw / Kick Adapters
  {
    name: "RagequitContract",
    path: "../contracts/adapters/RagequitContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        bank: [
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
        ],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "GuildKickContract",
    path: "../contracts/adapters/GuildKickContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL],
      extensions: {
        bank: [
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
          bankExtensionAclFlagsMap.REGISTER_NEW_TOKEN,
        ],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "DistributeContract",
    path: "../contracts/adapters/DistributeContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL],
      extensions: {
        bank: [bankExtensionAclFlagsMap.INTERNAL_TRANSFER],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },

  // Funding/Onboarding Adapters
  {
    name: "FinancingContract",
    path: "../contracts/adapters/FinancingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL],
      extensions: {
        bank: [
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
        ],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
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
        bank: [
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "CouponOnboardingContract",
    path: "../contracts/adapters/CouponOnboardingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.NEW_MEMBER],
      extensions: {
        bank: [
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
        ],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "TributeContract",
    path: "../contracts/adapters/TributeContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL, daoAccessFlagsMap.NEW_MEMBER],
      extensions: {
        bank: [
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
          bankExtensionAclFlagsMap.REGISTER_NEW_TOKEN,
        ],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "TributeNFTContract",
    path: "../contracts/adapters/TributeNFTContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL, daoAccessFlagsMap.NEW_MEMBER],
      extensions: {
        bank: [bankExtensionAclFlagsMap.ADD_TO_BALANCE],
        erc20: [],
        erc721: [erc721ExtensionAclFlagsMap.COLLECT_NFT],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },
  {
    name: "LendNFTContract",
    path: "../contracts/adapters/LendNFTContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [daoAccessFlagsMap.SUBMIT_PROPOSAL, daoAccessFlagsMap.NEW_MEMBER],
      extensions: {
        bank: [
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
        ],
        erc20: [],
        erc721: [
          erc721ExtensionAclFlagsMap.COLLECT_NFT,
          erc721ExtensionAclFlagsMap.WITHDRAW_NFT,
        ],
        erc1155: [
          erc1155ExtensionAclFlagsMap.COLLECT_NFT,
          erc1155ExtensionAclFlagsMap.WITHDRAW_NFT,
        ],
        erc1271: [],
        vesting: [
          vestingExtensionAclFlagsMap.NEW_VESTING,
          vestingExtensionAclFlagsMap.REMOVE_VESTING,
        ],
        executor: [],
      },
    },
  },
  // ERC20 Util
  {
    name: "ERC20TransferStrategy",
    path: "../contracts/extensions/token/erc20/ERC20TransferStrategy",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      dao: [],
      extensions: {
        bank: [bankExtensionAclFlagsMap.INTERNAL_TRANSFER],
        erc20: [],
        erc721: [],
        erc1155: [],
        erc1271: [],
        vesting: [],
        executor: [],
      },
    },
  },

  // Utils
  {
    name: "DaoArtifacts",
    path: "../contracts/utils/DaoArtifacts",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Util,
  },
  {
    name: "Multicall",
    path: "../contracts/utils/Multicall",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Util,
  },
];

const getConfig = (name) => {
  return contracts.find((c) => c.name === name);
};

const isDeployable = (name) => {
  const c = getConfig(name);
  return c && c.enabled;
};

module.exports = { contracts, getConfig, isDeployable, ContractType };
