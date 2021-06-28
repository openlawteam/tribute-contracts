---
id: deployment
title: Deployment
---

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
    "SUBGRAPH_NAME": "tribute-dev"
  },
  {
    "network": "mainnet",
    "daoFactoryAddress": "0xac665be1e44cc4eec388e34c3899c271fee847f4",
    "daoFactoryStartBlock": 8332211,
    "GITHUB_USERNAME": "openlawteam",
    "SUBGRAPH_NAME": "tribute-prod"
  }
]
```

In `.env` (create `.env` file if necessary):

```
GRAPH_ACCESS_TOKEN=...
```

Then from the `subgraph` directory, simply run the following command to deploy the subgraphs:

```
npx ts-node subgraph-deployer.ts
```

See [here](https://thegraph.com/docs/deploy-a-subgraph#redeploying-a-subgraph) for more information
