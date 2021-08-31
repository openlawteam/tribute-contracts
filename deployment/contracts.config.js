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
    name: "ERC1155TokenExtensionFactory",
    path: "../contracts/extensions/erc1155/ERC1155TokenExtensionFactory",
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
  },
  {
    name: "BankAdapterContract",
    path: "../contracts/adapters/BankAdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "NFTAdapterContract",
    path: "../contracts/adapters/NFTAdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "ConfigurationContract",
    path: "../contracts/adapters/ConfigurationContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "ManagingContract",
    path: "../contracts/adapters/ManagingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "ERC1155AdapterContract",
    path: "../contracts/adapters/ERC1155AdapterContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },

  // Signature Adapters
  {
    name: "SignaturesContract",
    path: "../contracts/adapters/SignaturesContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },

  // Voting Adapters
  {
    name: "VotingContract",
    path: "../contracts/adapters/VotingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "SnapshotProposalContract",
    path: "../contracts/adapters/voting/SnapshotProposalContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "OffchainVotingContract",
    path: "../contracts/adapters/voting/OffchainVotingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "OffchainVotingHashContract",
    path: "../contracts/adapters/voting/OffchainVotingHashContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "KickBadReporterAdapter",
    path: "../contracts/adapters/voting/KickBadReporterAdapter",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "BatchVotingContract",
    path: "../contracts/adapters/voting/BatchVotingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },

  // Withdraw / Kick Adapters
  {
    name: "RagequitContract",
    path: "../contracts/adapters/RagequitContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "GuildKickContract",
    path: "../contracts/adapters/GuildKickContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "DistributeContract",
    path: "../contracts/adapters/DistributeContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },

  // Funding/Onboarding Adapters
  {
    name: "FinancingContract",
    path: "../contracts/adapters/FinancingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "OnboardingContract",
    path: "../contracts/adapters/OnboardingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "CouponOnboardingContract",
    path: "../contracts/adapters/CouponOnboardingContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "TributeContract",
    path: "../contracts/adapters/TributeContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
  },
  {
    name: "TributeNFTContract",
    path: "../contracts/adapters/TributeNFTContract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
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
