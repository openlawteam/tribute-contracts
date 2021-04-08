# Tribute DAO Framework Subgraph

> Graph definition for the Tribute DAO Framework

### Multiple Ethereum Networks Setup

Managing different network deployments for the contracts, is currently setup using a config file in `config/subgraph-config.json`, providing the network, start block, subgraph directory, and contract addresses for the DaoFactory and BankFactory, for each subgraph:

For example:

```
[
  {
    "network": "rinkeby",
    "address": "0xac665be1e44cc4eec388e34c3899c271fee847f4",
    "startBlock": 6204221,
    "GITHUB_USERNAME": "openlawteam",
    "SUBGRAPH_NAME": "tribute-dev"
  },
  {
    "network": "mainnet",
    "address": "0x8276d5e4133eba2043a2a9fccc55284c1243f1d4",
    "startBlock": 6199962,
    "GITHUB_USERNAME": "openlawteam",
    "SUBGRAPH_NAME": "tribute-prod"
  }
]
```

In `.env` (create `.env` file if necessary):

```
GRAPH_ACCESS_TOKEN=...
```

Then from the root directory, simply run the following command to deploy the subgraphs:

```
npx ts-node subgraph-deployer.ts
```

See [here](https://thegraph.com/docs/deploy-a-subgraph#redeploying-a-subgraph) for more information

### Local Development Graph Setup

Check out the setup guide [here](https://github.com/openlawteam/molochv3-contracts/blob/master/docker/README.md)
