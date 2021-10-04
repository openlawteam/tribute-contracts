/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

const subgraphSchemaSideBar = require("./docs/schema/sidebar-schema");

const allCoreContracts = {
  type: "category",
  label: "Core",
  collapsed: false,
  items: ["contracts/core/dao-registry", "contracts/core/dao-factory"],
};

const allExtensions = {
  type: "category",
  label: "Extension",
  collapsed: true,
  items: [
    "contracts/extensions/bank-extension",
    "contracts/extensions/erc20-extension",
    "contracts/extensions/nft-extension",
    "contracts/extensions/executor-extension",
    "contracts/extensions/erc1271-extension",
    "contracts/extensions/erc1155-extension",
  ],
};

const allAdapters = {
  type: "category",
  label: "Adapter",
  collapsed: true,
  items: [
    {
      Configuration: [
        "contracts/adapters/configuration/configuration-adapter",
        "contracts/adapters/configuration/managing-adapter",
      ],
    },
    {
      Distribution: ["contracts/adapters/distribution/distribute-adapter"],
    },
    {
      Funding: ["contracts/adapters/funding/financing-adapter"],
    },
    {
      Kick: [
        "contracts/adapters/exiting/guild-kick-adapter",
        "contracts/adapters/exiting/rage-quit-adapter",
      ],
    },
    {
      Onboarding: [
        "contracts/adapters/onboarding/coupon-onboarding-adapter",
        "contracts/adapters/onboarding/onboarding-adapter",
        "contracts/adapters/onboarding/tribute-adapter",
        "contracts/adapters/onboarding/tribute-nft-adapter",
      ],
    },
    {
      Voting: [
        "contracts/adapters/voting/basic-voting-adapter",
        "contracts/adapters/voting/offchain-voting-adapter",
      ],
    },
    {
      Utils: [
        "contracts/adapters/utils/bank-adapter",
        "contracts/adapters/utils/nft-adapter",
        "contracts/adapters/utils/dao-registry-adapter",
        "contracts/adapters/utils/signature-adapter",
      ],
    },
  ],
};

const allGuardContracts = {
  type: "category",
  label: "Guard",
  collapsed: true,
  items: [],
};

/**
 * Subgraph Section
 */

const subgraphSetup = {
  type: "category",
  label: "Installation",
  collapsed: false,
  items: ["subgraph/setup/local-development"],
};

const subgraphStructure = {
  type: "category",
  label: "Structure",
  collapsed: false,
  items: ["subgraph/structure/manifest", subgraphSchemaSideBar],
};

module.exports = {
  docs: [
    {
      type: "category",
      label: "Introduction",
      collapsed: false,
      items: [
        "intro/overview-and-benefits",
        {
          type: "category",
          label: "Comparison",
          collapsed: true,
          items: ["intro/comparison/moloch"],
        },
        {
          type: "category",
          label: "Design Principles",
          collapsed: true,
          items: [
            "intro/design/architecture",
            "intro/design/core/introduction",
            "intro/design/extensions/introduction",
            "intro/design/adapters/introduction",
            "intro/design/access-control",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Tutorials",
      collapsed: true,
      items: [
        {
          type: "category",
          label: "Launching your DAO",
          collapsed: true,
          items: [
            "tutorial/dao/installation",
            "tutorial/dao/configuration",
            "tutorial/dao/deployment",
            "tutorial/dao/interacting",
          ],
        },
        "tutorial/adapters/creating-an-adapter",
        "tutorial/extensions/creating-an-extension",
      ],
    },
    {
      type: "category",
      label: "Contracts",
      collapsed: true,
      items: [allCoreContracts, allExtensions, allAdapters, allGuardContracts],
    },
    "tutorial/dao/interacting",
    {
      type: "category",
      label: "Subgraph",
      collapsed: true,
      items: [
        "subgraph/definition",
        subgraphSetup,
        // subgraphStructure,
        "subgraph/deployment",
      ],
    },
  ],
};
