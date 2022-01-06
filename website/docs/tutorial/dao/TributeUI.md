---
id: interacting
title: Tribute UI
---

⚡️ **[TributeDAO Framework](https://github.com/openlawteam/tribute-contracts)** provides you a set of modular and extensible smart contracts to launch your DAO with minimal costs.

## Requirements

- **[Infura Ethereum API KEY](https://infura.io/product/ethereum)**, you can use the same key you created in the **[Configuration step](/docs/tutorial/dao/configuration#requirements)** of the tutorial.
- **[Docker Compose](https://docs.docker.com/compose/install/)** install Docker Compose (https://docs.docker.com/compose/install/). This will be used in this tutorial to launch the local instances of snapshot-hub, graph node, and ipfs services.
- **[MetaMask](https://metamask.io/download.html)** download and install MetaMask from https://metamask.io/download.html into your browser to access the DAO dApp.

:::warning
Make sure you are on the branch [release-v2.3.2](https://github.com/openlawteam/tribute-contracts/tree/release-v2.3.2) which is the version that contains the contracts integrated with [TributeUI](https://github.com/openlawteam/tribute-ui).
:::

## Configuring the dApp

In order to run the dApp we will be using `docker-compose`, which will help us to spin up all the services required by the dApp.

First, set the `tribute-ui` env vars in the `tribute-contracts/.env` file, just append the following content to the bottom of the file if you did not use the sample .env file from previous sections:

```bash
# tribute-contracts/.env

######################## Tribute UI env vars ########################

# Configure the UI to use the Rinkeby network for local development
REACT_APP_DEFAULT_CHAIN_NAME_LOCAL=RINKEBY

# It can be the same value you used for the Tribute DAO deployment.
REACT_APP_INFURA_PROJECT_ID_DEV=INFURA_API_KEY

# The address of the Multicall smart contract deployed to the Rinkeby network.
# Copy that from the tribute-contracts/build/contracts-rinkeby-YYYY-MM-DD-HH:mm:ss.json
REACT_APP_MULTICALL_CONTRACT_ADDRESS=0x...

# The address of the DaoRegistry smart contract deployed to the Rinkeby network.
# Copy that from the tribute-contracts/build/contracts-rinkeby-YYYY-MM-DD-HH:mm:ss.json
REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS=0x...

# Enable Rinkeby network for Tribute UI
REACT_APP_ENVIRONMENT=development

######################## Graph Node env vars ########################

# The Ethereum Network node URL used by the Graph Node to listen to events.
ethereum=rinkeby:https://rinkeby.infura.io/v3/INFURA_API_KEY
```

Open the file which contains the addresses of all deployed contracts:

- `tribute-contracts/build/contracts-rinkeby-YYYY-MM-DD-HH:mm:ss.json`

Copy the address of `DaoRegistry` contract and set it to `REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS` env var.

Next, copy the address of `Multicall` contract and set it to `REACT_APP_MULTICALL_CONTRACT_ADDRESS`.

## Start all the services

The contracts were deployed and the subgraph configurations were prepared, now it is time to start the services using docker-compose.

From the `tribute-contracts/docker` folder, run:

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

## Building and deploying the Subgraph

The dApp uses a Subgraph to index the data collected from the chain. The data is processed and stored in the graph node, so it can be easily queried.

Now that the services are up and running we can deploy the subgraph to our local graph node.

Clone the subgraph repo within the `tribute-contracts` folder:

- Repo: https://github.com/openlawteam/tribute-subgraph

Using node v16.x in the `tribute-contracts/tribute-subgraph` folder, checkout the subgraph version `v2.0.2`:

```bash
cd tribute-subgraph
```

```bash
git fetch origin release-v2.0.2
```

```bash
git checkout release-v2.0.2
```

Install the dependencies using node v16+:

```bash
npm install
```

Open the file `tribute-contracts/tribute-subgraph/subgraphs/Core/subgraph.yaml`, and set the `address` and `startBlock` attributes for the **DaoFactory** subgraph definition:

:::tip
Copy the _DaoFactory_ address and block number from the Rinkeby deployment logs at `tribute-contracts/logs/rinkeby-deploy_YYYY-MM-DD_HH:mm:ss.log` file. Search by **DaoFactory** and copy the **contract address** and **block number**, set these values to **address** and **startBlock** attributes respectively.
:::

```yaml
### tribute-subgraph/subgraphs/Core/subgraph.yaml
...
# ====================== DaoFactory ======================
- kind: ethereum/contract
    name: DaoFactory
    network: mainnet
    source:
    address: "0x..." # 1. Set the DaoFactory address
    abi: DaoFactory
    startBlock: xxx # 2. Set the block number in which the DaoFactory contract was deployed
```

Build and deploy the subgraph:

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
Connect to TributeUI using the same MetaMask account you used to deploy the DAO to Rinkeby, since that address is considered the owner of the DAO you will have access to all features, and will hold 1 unit token (1 share).
:::

Connected:

![Connected](/img/tutorial/dao-tutorial/connected.png)

Access the _Governance_ page and hit _new proposal_ to create a proposal for vote, e.g:

![Governance](/img/tutorial/dao-tutorial/governance.png)

👏 Yeah, it was a lengthy tutorial. Congrats you have a Tribute DAO running on Rinkeby. Well Done!

🎉 You have launched your DAO using Tribute DAO framework, and now you can interact with it using the Tribute UI dApp!

## Problems?

Ask for help on **[Discord](https://discord.gg/xXMA2DYqNf)** or on **[GitHub Discussions](https://github.com/openlawteam/tribute-contracts/discussions/new)**.
