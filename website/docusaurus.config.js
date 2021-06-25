module.exports = {
  title: "TributeDAO Framework Docs",
  tagline:
    "A new modular DAO framework inspired by the Moloch smart contracts.",
  url: "https://github.com/openlawteam/tribute-contracts",
  baseUrl: "/tribute-contracts/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "openlawteam",
  projectName: "tribute-contracts",
  themeConfig: {
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
          position: "left",
          label: "Getting Started",
        },
        {
          type: "doc",
          docId: "intro/design/core/introduction",
          position: "left",
          label: "Core",
        },
        {
          type: "doc",
          docId: "intro/design/extensions/introduction",
          position: "left",
          label: "Extensions",
        },
        {
          type: "doc",
          docId: "intro/design/adapters/introduction",
          position: "left",
          label: "Adapters",
        },
        {
          type: "doc",
          docId: "thanks",
          position: "left",
          label: "Thank You",
        },
        {
          href: "https://github.com/openlawteam/tribute-contracts",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        // {
        //   title: "Docs",
        //   items: [
        //     {
        //       label: "Tutorial",
        //       to: "docs/getting-started/introduction",
        //     },
        //   ],
        // },
        {
          title: "Community",
          items: [
            {
              label: "Discord",
              href: "https://discord.gg/xXMA2DYqNf",
            },
            {
              label: "Twitter",
              href: "https://twitter.com/OpenLawOfficial",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "TributeDAO UI",
              href: "https://github.com/openlawteam/tribute-ui",
            },
            {
              label: "TributeDAO Contracts",
              href: "https://github.com/openlawteam/tribute-contracts",
            },
          ],
        },
      ],
      copyright: `TributeDAO Framework Docs. Built with Docusaurus.`,
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
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
