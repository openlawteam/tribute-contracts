require("dotenv").config();

module.exports = {
  title: "TributeDAO Framework",
  tagline:
    "A new modular DAO framework inspired by the Moloch smart contracts.",
  url: "https://tributedao.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "openlawteam",
  projectName: "tribute-contracts",
  themeConfig: {
    algolia: {
      appId: process.env.ALGOLIA_APP_ID,
      apiKey: process.env.ALGOLIA_SEARCH_API_KEY,
      indexName: "docs_tribute_contracts",
      contextualSearch: true,
    },
    colorMode: {
      defaultMode: "light",
      disableSwitch: true,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "TRIBUTE",
      logo: {
        alt: "TributeDAO Framework Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "doc",
          docId: "intro/overview-and-benefits",
          position: "right",
          label: "Get Started",
        },
        {
          type: "doc",
          docId: "intro/design/core/introduction",
          position: "right",
          label: "Core",
        },
        {
          type: "doc",
          docId: "intro/design/extensions/introduction",
          position: "right",
          label: "Extensions",
        },
        {
          type: "doc",
          docId: "intro/design/adapters/introduction",
          position: "right",
          label: "Adapters",
        },
        {
          type: "doc",
          docId: "thanks",
          position: "right",
          label: "Thank You",
        },
        {
          href: "https://discord.gg/tEfP68xnTd",
          position: "right",
          className: "header-discord-link",
          "aria-label": "Tribute Discord",
        },
        {
          href:
            "https://github.com/search?q=org%3Aopenlawteam+tribute-ui+OR+tribute-contracts+in%3Aname&type=repositories",
          position: "right",
          className: "header-github-link",
          "aria-label": "Tribute GitHub",
        },
      ],
    },
    footer: {
      // style: "light",
      // logo: {
      //   alt: "TributeDAO Logo",
      //   src: "img/logo.svg",
      //   href: "https://tributedao.com",
      // },
      // links: [
      //   {
      //     title: "Docs",
      //     items: [
      //       {
      //         label: "Introduction",
      //         to: "/docs/intro/overview-and-benefits",
      //       },
      //       {
      //         label: "Tutorial",
      //         to: "/docs/tutorial/dao/installation",
      //       },
      //       {
      //         label: "Contracts",
      //         to: "/docs/contracts/core/dao-registry",
      //       },
      //       {
      //         label: "Subgraph",
      //         to: "/docs/subgraph/definition",
      //       },
      //     ],
      //   },
      //   {
      //     title: "Community",
      //     items: [
      //       {
      //         label: "Discord",
      //         href: "https://discord.gg/xXMA2DYqNf",
      //       },
      //       {
      //         label: "Twitter",
      //         href: "https://twitter.com/OpenLawOfficial",
      //       },
      //       {
      //         label: "Github",
      //         href:
      //           "https://github.com/search?q=org%3Aopenlawteam+tribute-ui+OR+tribute-contracts+in%3Aname&type=repositories",
      //       },
      //       {
      //         label: "Medium",
      //         href: "#",
      //       },
      //     ],
      //   },
      //   {
      //     title: "More",
      //     items: [
      //       {
      //         label: "TributeDAO",
      //         href: "https://tributedao.com",
      //       },
      //       {
      //         label: "TributeDAO UI",
      //         href: "https://github.com/openlawteam/tribute-ui",
      //       },
      //       {
      //         label: "TributeDAO Contracts",
      //         href: "https://github.com/openlawteam/tribute-contracts",
      //       },
      //       {
      //         label: "Code of Conduct",
      //         href:
      //           "https://github.com/openlawteam/tribute-contracts/blob/master/CODE_OF_CONDUCT.md",
      //       },
      //     ],
      //   },
      // ],
      copyright: `<p>&copy; TributeDAO Framework.</p>`,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl:
            "https://github.com/openlawteam/tribute-contracts/edit/docs/website/",
        },
        theme: {
          customCss: require.resolve("./src/scss/style.scss"),
        },
      },
    ],
  ],
  plugins: [
    [
      require.resolve("@edno/docusaurus2-graphql-doc-generator"),
      {
        schema: "http://127.0.0.1:8000/subgraphs/name/openlawteam/tribute",
        rootPath: "./docs",
        homepage: "./docs/subgraph/structure/Schema.md",
      },
    ],
    "docusaurus-plugin-sass",
  ],
};
