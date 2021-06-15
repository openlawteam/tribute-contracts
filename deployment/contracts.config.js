const contracts = [
  // Test Util Contracts
  {
    name: "OLToken",
    path: "../contracts/test/OLToken",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "TestToken1",
    path: "../contracts/test/TestToken1",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "TestToken2",
    path: "../contracts/test/TestToken2",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "TestFairShareCalc",
    path: "../contracts/test/TestFairShareCalc",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "PixelNFT",
    path: "../contracts/test/PixelNFT",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "ProxToken",
    path: "../contracts/test/ProxTokenContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "ERC20Minter",
    path: "../contracts/test/ERC20MinterContract",
    enabled: true,
    version: "1.0.0",
  },

  // DAO Factories Contracts
  {
    name: "DaoFactory",
    path: "../contracts/core/DaoFactory",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "DaoRegistry",
    path: "../contracts/core/DaoRegistry",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "NFTCollectionFactory",
    path: "../contracts/extensions/NFTCollectionFactory",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "BankFactory",
    path: "../contracts/extensions/bank/BankFactory",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "ERC20TokenExtensionFactory",
    path: "../contracts/extensions/token/erc20/ERC20TokenExtensionFactory",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "ExecutorExtensionFactory",
    path: "../contracts/extensions/executor/ExecutorExtensionFactory",
    enabled: true,
    version: "1.0.0",
  },

  // Extensions
  {
    name: "NFTExtension",
    path: "../contracts/extensions/nft/NFTExtension",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "BankExtension",
    path: "../contracts/extensions/bank/BankExtension",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "ERC20Extension",
    path: "../contracts/extensions/token/erc20/ERC20Extension",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "ExecutorExtension",
    path: "../contracts/extensions/executor/ExecutorExtension",
    enabled: true,
    version: "1.0.0",
  },

  // Config Adapters
  {
    name: "DaoRegistryAdapterContract",
    path: "../contracts/adapters/DaoRegistryAdapterContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "BankAdapterContract",
    path: "../contracts/adapters/BankAdapterContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "NFTAdapterContract",
    path: "../contracts/adapters/NFTAdapterContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "ConfigurationContract",
    path: "../contracts/adapters/ConfigurationContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "ManagingContract",
    path: "../contracts/adapters/ManagingContract",
    enabled: true,
    version: "1.0.0",
  },

  // Voting Adapters
  {
    name: "VotingContract",
    path: "../contracts/adapters/VotingContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "SnapshotProposalContract",
    path: "../contracts/adapters/voting/SnapshotProposalContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "OffchainVotingContract",
    path: "../contracts/adapters/voting/OffchainVotingContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "OffchainVotingHashContract",
    path: "../contracts/adapters/voting/OffchainVotingHashContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "KickBadReporterAdapter",
    path: "../contracts/adapters/voting/KickBadReporterAdapter",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "BatchVotingContract",
    path: "../contracts/adapters/voting/BatchVotingContract",
    enabled: true,
    version: "1.0.0",
  },

  // Withdraw / Kick Adapters
  {
    name: "RagequitContract",
    path: "../contracts/adapters/RagequitContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "GuildKickContract",
    path: "../contracts/adapters/GuildKickContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "DistributeContract",
    path: "../contracts/adapters/DistributeContract",
    enabled: true,
    version: "1.0.0",
  },

  // Funding/Onboarding Adapters
  {
    name: "FinancingContract",
    path: "../contracts/adapters/FinancingContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "OnboardingContract",
    path: "../contracts/adapters/OnboardingContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "CouponOnboardingContract",
    path: "../contracts/adapters/CouponOnboardingContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "TributeContract",
    path: "../contracts/adapters/TributeContract",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "TributeNFTContract",
    path: "../contracts/adapters/TributeNFTContract",
    enabled: true,
    version: "1.0.0",
  },

  // Utils
  {
    name: "DaoArtifacts",
    path: "../contracts/utils/DaoArtifacts",
    enabled: true,
    version: "1.0.0",
  },
  {
    name: "Multicall",
    path: "../contracts/utils/Multicall",
    enabled: true,
    version: "1.0.0",
  },
];

const isDeployable = (name) => {
  const c = contracts.find((c) => c.name === name);
  return c && c.enabled;
};

module.exports = contracts;
