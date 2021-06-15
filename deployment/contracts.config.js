const contracts = [
  // Test Util Contracts
  { name: "OLToken", path: "../contracts/test/OLToken", enabled: true },
  { name: "TestToken1", path: "../contracts/test/TestToken1", enabled: true },
  { name: "TestToken2", path: "../contracts/test/TestToken2", enabled: true },
  {
    name: "TestFairShareCalc",
    path: "../contracts/test/TestFairShareCalc",
    enabled: true,
  },
  { name: "PixelNFT", path: "../contracts/test/PixelNFT", enabled: true },
  {
    name: "ProxToken",
    path: "../contracts/test/ProxTokenContract",
    enabled: true,
  },
  {
    name: "ERC20Minter",
    path: "../contracts/test/ERC20MinterContract",
    enabled: true,
  },

  // DAO Factories Contracts
  { name: "DaoFactory", path: "../contracts/core/DaoFactory", enabled: true },
  { name: "DaoRegistry", path: "../contracts/core/DaoRegistry", enabled: true },
  {
    name: "NFTCollectionFactory",
    path: "../contracts/extensions/NFTCollectionFactory",
    enabled: true,
  },
  {
    name: "BankFactory",
    path: "../contracts/extensions/bank/BankFactory",
    enabled: true,
  },
  {
    name: "ERC20TokenExtensionFactory",
    path: "../contracts/extensions/token/erc20/ERC20TokenExtensionFactory",
    enabled: true,
  },
  {
    name: "ExecutorExtensionFactory",
    path: "../contracts/extensions/executor/ExecutorExtensionFactory",
    enabled: true,
  },

  // Extensions
  {
    name: "NFTExtension",
    path: "../contracts/extensions/nft/NFTExtension",
    enabled: true,
  },
  {
    name: "BankExtension",
    path: "../contracts/extensions/bank/BankExtension",
    enabled: true,
  },
  {
    name: "ERC20Extension",
    path: "../contracts/extensions/token/erc20/ERC20Extension",
    enabled: true,
  },
  {
    name: "ExecutorExtension",
    path: "../contracts/extensions/executor/ExecutorExtension",
    enabled: true,
  },

  // Config Adapters
  {
    name: "DaoRegistryAdapterContract",
    path: "../contracts/adapters/DaoRegistryAdapterContract",
    enabled: true,
  },
  {
    name: "BankAdapterContract",
    path: "../contracts/adapters/BankAdapterContract",
    enabled: true,
  },
  {
    name: "NFTAdapterContract",
    path: "../contracts/adapters/NFTAdapterContract",
    enabled: true,
  },
  {
    name: "ConfigurationContract",
    path: "../contracts/adapters/ConfigurationContract",
    enabled: true,
  },
  {
    name: "ManagingContract",
    path: "../contracts/adapters/ManagingContract",
    enabled: true,
  },

  // Voting Adapters
  {
    name: "VotingContract",
    path: "../contracts/adapters/VotingContract",
    enabled: true,
  },
  {
    name: "SnapshotProposalContract",
    path: "../contracts/adapters/SnapshotProposalContract",
    enabled: true,
  },
  {
    name: "OffchainVotingContract",
    path: "../contracts/adapters/OffchainVotingContract",
    enabled: true,
  },
  {
    name: "KickBadReporterAdapter",
    path: "../contracts/adapters/KickBadReporterAdapter",
    enabled: true,
  },
  {
    name: "BatchVotingContract",
    path: "../contracts/adapters/BatchVotingContract",
    enabled: true,
  },

  // Withdraw Adapters
  {
    name: "RagequitContract",
    path: "../contracts/adapters/RagequitContract",
    enabled: true,
  },
  {
    name: "GuildKickContract",
    path: "../contracts/adapters/GuildKickContract",
    enabled: true,
  },
  {
    name: "DistributeContract",
    path: "../contracts/adapters/DistributeContract",
    enabled: true,
  },

  // Funding/Onboarding Adapters
  {
    name: "FinancingContract",
    path: "../contracts/adapters/FinancingContract",
    enabled: true,
  },
  {
    name: "OnboardingContract",
    path: "../contracts/adapters/OnboardingContract",
    enabled: true,
  },
  {
    name: "CouponOnboardingContract",
    path: "../contracts/adapters/CouponOnboardingContract",
    enabled: true,
  },
  {
    name: "TributeContract",
    path: "../contracts/adapters/TributeContract",
    enabled: true,
  },
  {
    name: "TributeNFTContract",
    path: "../contracts/adapters/TributeNFTContract",
    enabled: true,
  },

  // Utils
  {
    name: "DaoArtifacts",
    path: "../contracts/utils/DaoArtifacts",
    enabled: true,
  },
  { name: "Multicall", path: "../contracts/utils/Multicall", enabled: true },
];

const isDeployable = (name) => {
  const c = contracts.find((c) => c.name === name);
  return c && c.enabled;
};

module.exports = contracts;
