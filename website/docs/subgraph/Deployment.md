---
id: deployment
title: Deployment
---

The Graph have launched their decentralized product called Subgraph Studio, for publishing, and curating on the decentralized (mainnet) network. See [here](https://thegraph.com/docs/developer/deploy-subgraph-studio) for more information.

The subgraph-deployer.ts script has been updated to deploy to both testnet and mainnet networks.

:::info
You need to install Graph CLI version 0.21.0 or above with either npm or yarn.
:::

NPM Install:

```
npm install -g @graphprotocol/graph-cli
```

Yarn Install:

```
yarn global add @graphprotocol/graph-cli
```

Managing different network deployments for the contracts, is currently setup using a config file in `config/subgraph-config.json`, providing the network, start block, subgraph directory, github username, and contract address for the DaoFactory and optional adapters:

For example:

```json
[
  {
    "network": "rinkeby",
    "daoFactoryAddress": "0x10a14A1665DE72faeDb866Fc75c57036813E2Eb2",
    "daoFactoryStartBlock": 6204221,
    "couponOnboardingAddress": "0x20a14A1665DE72faeDb866Fc75c57036813E2Eb3",
    "couponOnboardingStartBlock": 7204228,
    "GITHUB_USERNAME": "openlawteam",
    "SUBGRAPH_NAME_OR_SLUG": "tribute-dev"
  },
  {
    "network": "mainnet",
    "daoFactoryAddress": "0xac665be1e44cc4eec388e34c3899c271fee847f4",
    "daoFactoryStartBlock": 8332211,
    "SUBGRAPH_NAME_OR_SLUG": "tribute-prod"
  }
]
```

In `.env` (create `.env` file if necessary):

```
# For testnet (rinkeby, ropsten, etc)
GRAPH_ACCESS_TOKEN=...

# For mainnet
GRAPH_DEPLOYMENT_KEY=...
```

Then from the `subgraph` directory, simply run the following command to deploy the subgraphs:

```
npx ts-node subgraph-deployer.ts
```

_IMPORTANT_: If deploying to mainnet the command line will prompt for an input for the `✔ Version Label (e.g. v0.0.1)`, enter the version and the deployment will resume.

See [here](https://thegraph.com/docs/deploy-a-subgraph#redeploying-a-subgraph) for more information
