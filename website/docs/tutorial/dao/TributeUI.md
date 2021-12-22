---
id: interacting
title: Tribute UI
---

⚡️ **[TributeDAO Framework](https://github.com/openlawteam/tribute-contracts)** provides you a set of modular and extensible smart contracts to launch your DAO with minimal costs.

## Requirements

- **[Infura Ethereum API KEY](https://infura.io/product/ethereum)**, you can use the same key you created in the **[Configuration step](/docs/tutorial/dao/configuration#requirements)** of the tutorial.
- **[Docker Compose](https://docs.docker.com/compose/install/)** install Docker Compose (https://docs.docker.com/compose/install/). This will be used in this tutorial to launch the local instances of snapshot-hub, graph node, and ipfs services.
- **[MetaMask](https://metamask.io/download.html)** download and install MetaMask from https://metamask.io/download.html into your browser to access the DAO dApp.

## Configuring the dApp

:::warning
Make sure you are on the branch [release-v1.0.6](https://github.com/openlawteam/tribute-contracts/releases/tag/v1.0.6) which is the version that contains the contracts integrated with [TributeUI](https://github.com/openlawteam/tribute-ui).
:::

In order to run the dApp we will be using `docker-compose`, which will help us to spin up all the services required by the dApp.

First, set the `tribute-ui` env vars in the `tribute-contracts/.env` file, just append it to the bottom of the file:

```bash
######
# Paste it after the DAO env vars declared in the previous sections, these env vars are used by the services launched with Docker Compose.
######

# Configure the UI to use the Rinkeby network for local development
REACT_APP_DEFAULT_CHAIN_NAME_LOCAL=RINKEBY

# It can be the same value you used for the Tribute DAO deployment.
# Replace "your-api-key" with your Infura key
REACT_APP_INFURA_PROJECT_ID_DEV=your-api-key

# The address of the Multicall smart contract deployed to the Rinkeby network.
# Copy that from the tribute-contracts/logs/[network]-deploy.log
REACT_APP_MULTICALL_CONTRACT_ADDRESS=0x...

# The address of the DaoRegistry smart contract deployed to the Rinkeby network.
# Copy that from the tribute-contracts/logs/[network]-deploy.log
REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS=0x...

# The Ethereum Network node URL used by the Graph Node to listen to events.
# Replace "your-api-key" with your Infura key
ethereum=rinkeby:https://rinkeby.infura.io/v3/your-api-key
```

Open the file:

> tribute-contracts/logs/rinkeby-deploy.log

Scroll to the end of the file, and find an output like this:

```bash
************************
DaoRegistry: 0x...
Multicall: 0x...
...
************************
```

These are the addresses of the contracts you have deployed to Rinkeby network. Just copy the address of **DaoRegistry** and **Multicall**, set them to **REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS** and **REACT_APP_MULTICALL_CONTRACT_ADDRESS** respectively.

## Configuring the Subgraph

Open the file:

> tribute-contracts/subgraph/config/subgraph-config.json

You should see something like this:

```bash
### tribute-contracts/subgraph/config/subgraph-config.json
[
  {
    "network": "rinkeby",
    "daoFactoryAddress": "0x...", # Copy the DaoFactory contracts address from the deployment logs.
    "daoFactoryStartBlock": blockNumber, # Copy the DaoFactory blockNumber from the deployment logs.
    "GITHUB_USERNAME": "openlawteam", # do not change it
    "SUBGRAPH_NAME": "tribute"  # do not change it
  }
]
```

In the Rinkeby deployment logs at _tribute-contracts/logs/rinkeby-deploy.log_ search by **DaoFactory** and copy the **contract address** and **block number**, set the values to **daoFactoryAddress** and **daoFactoryStartBlock** respectively.

## Starting the services

Using docker-compose let's start all the services in the `tribute-contracts/docker ` folder:

```bash
docker-compose up
```

This command will launch the several services that are integrated with Tribute DAO, and are essential to interact with the contracts in the Ethereum Network.

Wait for the following output:

```
  trib-ui              | Compiled successfully!
  trib-ui              |
  trib-ui              | You can now view tribute-ui in the browser.
  trib-ui              |
  trib-ui              |   Local:            http://localhost:3000
  trib-ui              |   On Your Network:  http://a.b.c.d:3000
  trib-ui              |
  trib-ui              | Note that the development build is not optimized.
  trib-ui              | To create a production build, use npm run build.
  trib-ui              |
  trib-graph-node      | Sep 24 14:02:47.585 INFO Syncing 1 blocks from Ethereum., code: BlockIngestionStatus, blocks_needed: 1, blocks_behind: 1, latest_block_head: 9349060, current_block_head: 9349059, provider: rinkeby-rpc-0, component: BlockIngestor
  ...
```

## Deploying the Subgraph

The dApp uses the subgraph to index and query the chain data, we already have it configured, but we still need to deploy it to our local graph node that we started with docker-compose.

In another terminal window access the subgraph folder `tribute-contracts/subgraph`:

```bash
cd subgraph
```

Install the dependencies using node v16+:

```bash
npm install
```

Deploy the subgraph:

```bash
npx ts-node subgraph-deployer.ts
```

Wait for the following output:

```bash
Deployed to http://localhost:8000/subgraphs/name/openlawteam/tribute/graphql

Subgraph endpoints:
Queries (HTTP):     http://localhost:8000/subgraphs/name/openlawteam/tribute
Subscriptions (WS): http://localhost:8001/subgraphs/name/openlawteam/tribute

👏 ### Done.
🎉 ### 1 Deployment(s) Successful!
```

## Interacting with the DAO

Open your browser and access [http://localhost:3000](http://localhost:3000).

You should see the Tribute UI onboarding page:

![Join Tribute DAO](/img/tutorial/dao-tutorial/join.png)

:::tip
Connect to TributeUI using the same MetaMask account you used to deploy the DAO to Rinkeby, since that address is considered the owner of the DAO you will have access to all features, and will hold 1 unit token.
:::

Connected:

![Connected](/img/tutorial/dao-tutorial/connected.png)

Access the _Governance_ page and hit _new proposal_ to create a proposal for vote, e.g:

![Governance](/img/tutorial/dao-tutorial/governance.png)

👏 Yeah, it was a lengthy tutorial, Well Done!!!

🎉 You have launched your DAO using Tribute DAO framework, and now you can interact with it using the Tribute UI dApp!

## Problems?

Ask for help on **[Discord](https://discord.gg/xXMA2DYqNf)** or on **[GitHub Discussions](https://github.com/openlawteam/tribute-contracts/discussions/new)**.
