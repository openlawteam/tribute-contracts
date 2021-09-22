---
id: interacting
title: Tribute UI
---

⚡️ **[TributeDAO Framework](https://github.com/openlawteam/tribute-contracts)** provides you a set of modular and extensible smart contracts to launch your DAO with minimal costs.

## Requirements

- **[Infura Ethereum API KEY](https://infura.io/product/ethereum)**, you can use the same key you created in the **[Configuration step](/docs/tutorial/dao/configuration#requirements)** of the tutorial.
- **[The Graph API Access Token](https://thegraph.com/legacy-explorer/dashboard)**, you need to use the Access Token created in the **[Configuration step](/docs/tutorial/dao/configuration#requirements)** of the tutorial.
- **[Snapshot Hub ERC712 Service](https://github.com/openlawteam/snapshot-hub/tree/erc-712)** to manage the offchain voting.
- **[Alchemy API Access Token](https://www.alchemy.com/)** you can sign up to https://www.alchemy.com, create an App called _Tribute DAO Tutorial_, select _Rinkeby_ as default network, and finsh the creation process to get the integration URL.
- **[Docker Compose](https://docs.docker.com/compose/install/)** install Docker Compose (https://docs.docker.com/compose/install/). This will be used in this tutorial to launch the snapshot-hub service.
- **[MetaMask](https://metamask.io/download.html)** download and install MetaMask from https://metamask.io/download.html into your browser to access the DAO dApp.

## Install the project

Use the command line tool to clone the Github repository and install all the project dependencies.

First, make sure you are in the root of _tribute-tutorial_ folder.

Then clone and access the _tribute-ui_ Github repo:

```bash
git clone https://github.com/openlawteam/tribute-ui.git && cd tribute-ui
```

## Configure the environment

After you cloned the Tribute UI repo, let's set up the environment variables in the root of _tribute-ui_ folder, and deploy the subgraph.

```bash
touch .env
```

Then add the following environment variables:

:::tip
You can find the **REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS** and **REACT_APP_MULTICALL_CONTRACT_ADDRESS** values in the tribute-contracts/logs/rinkeby-deploy.log.
:::

```bash
# It can be the same value you used for the Tribute DAO deployment.
REACT_APP_INFURA_PROJECT_ID_DEV=...

# The address of the DaoRegistry smart contract deployed to the Rinkeby network.
REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS=...

# The address of the Multicall smart contract deployed to the Rinkeby network.
REACT_APP_MULTICALL_CONTRACT_ADDRESS=...

# The url of snaphot-hub running locally in a container.
REACT_APP_SNAPSHOT_HUB_API_URL=http://localhost:8081

# The unique name registered in Snapshot Hub under which proposals, votes, etc. will be stored.
REACT_APP_SNAPSHOT_SPACE=tribute

# The url of the subgraph running locally in a container.
REACT_APP_GRAPH_API_URL=https://api.thegraph.com/subgraphs/name/<GITHUB_USERNAME>/tribute-dao-tutorial

# Make sure it is set to development mode
REACT_APP_ENVIRONMENT=development
```

:::caution
Please do not change the REACT_APP_SNAPSHOT_SPACE, keep it as is, so it will work with the snapshot-hub service.
:::

Open the Rinkeby deployment logs, scroll to the end of the file and you should see an output like this:

```bash
************************
DaoRegistry: 0x...
Multicall: 0x...
...
************************
```

These are the address of the contracts you have deployed to Rinkeby. Just copy the address of **DaoRegistry** and **Multicall**, set them to **REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS** and **REACT_APP_MULTICALL_CONTRACT_ADDRESS** respectivelly.

Then set your Github username to _<GITHUB_USERNAME>_ in **REACT_APP_GRAPH_API_URL**, that will indicate where your subgraph needs to be created.

## Deploy the Subgraph

:::caution
You need to checkout branch v1.1.0 of _tribute-contracts_ to make it work with the tribute-ui.
:::

Go to the `tribute-tutorial/tribute-contracts` directory and check out the the tag [v1.1.0](https://github.com/openlawteam/tribute-contracts/releases/tag/v1.1.0) which is the version that contains the subgraph that works with [TributeUI](https://github.com/openlawteam/tribute-ui):

```bash
cd ../tribute-contracts
```

Then checkout the correct branch _v1.1.0_, install the project dependencies:

```bash
git checkout tags/v1.1.0 -b branch-v1.1.0 && npm ci
```

Access the `subgraph` folder in `tribute-contracts`:

```bash
cd subgraph
```

Then open the config file: _subgraph/config/subgraph-config.json_, remove all the entries and add your subgraph config:

```json
[
  {
    "network": "rinkeby",
    "daoFactoryAddress": "0x...",
    "daoFactoryStartBlock": ...,
    "GITHUB_USERNAME": "<YOUR_GITHUB_USERNAME>",
    "SUBGRAPH_NAME": "tribute-dao-tutorial"
  }
]
```

In the rinkeby deployment logs at _tribute-contracts/logs/rinkeby-deploy.log_ search by **DaoFactory** and copy the **contract address** and **block number**, set the values to **daoFactoryAddress** and **daoFactoryStartBlock** respectively.

Finally, set your Github username to **GITHUB_USERNAME**, it must be the same Github account that you used to connect to thegraph.com.

:::caution
The **SUBGRAPH_NAME** should be lowercase and any spaces should be hyphenated, it needs to match the subgraph slug you picked when you created the subgraph in thegraph.com. If you're not sure, go to the [Subgraph Legacy Explorer](https://thegraph.com/legacy-explorer/dashboard), navigate to your subgraph, and look for "subgraph slug." or once you click on your subgraph, copy the slug from the browser URL. You should see something like: https://thegraph.com/legacy-explorer/subgraph/[your-github-user]/[slug].
:::

From the `tribute-tutorial/tribute-contracts/subgraph` folder, install the dependencies using Node v14.x:

```bash
npm ci
```

Create the **.env** file under the _subgraph_ folder:

```bash
touch .env
```

Add the subgraph API access token:

```bash
# The Graph API Access Token that will be used to deploy the Subgraph.
# Copy the Access Token from: https://thegraph.com/legacy-explorer/dashboard
GRAPH_ACCESS_TOKEN=
```

Start the Subgraph deployment:

```bash
npx ts-node subgraph-deployer.ts
```

At the end of the process you should see an output like this:

```bash
✔ Upload subgraph to IPFS

Build completed: ...

Deployed to https://thegraph.com/explorer/subgraph/<your-github-username>/tribute-dao-tutorial

Subgraph endpoints:
Queries (HTTP):     https://api.thegraph.com/subgraphs/name/<your-github-username>/tribute-dao-tutorial
Subscriptions (WS): wss://api.thegraph.com/subgraphs/name/<your-github-username>/tribute-dao-tutorial

👏 ### Done.
🎉 ### 1 Deployment(s) Successful!
```

## Launch the Snapshot Hub ERC712 service

Use the command line tool to clone the Github repository and launch the docker container.
This can be done in any directory, but to keep it consistent let's checkout the project from the _tribute-tutorial_ folder.

Clone and access the _snapshot-hub_ Github repo:

```bash
git clone https://github.com/openlawteam/snapshot-hub.git && cd snapshot-hub
```

Checkout the correct branch and create the _.env.local_ file:

```bash
git fetch origin erc-712 && git checkout erc-712 && touch .env.local
```

Copy the following content to the new _.env.local_ file:

```bash
# The port number to start the service.
PORT=8080
# The type of the ethereum network.
NETWORK=testnet
# The flag to indicate if the snapshot-hub should use IPFS to store data.
USE_IPFS=false
# The 64 digits private key of the hd wallet that will be used to sign messages.
# Feel free to generate a new random 64 digit hexadecimal number for this.
RELAYER_PK=0x..
# The allow list of domain that will be using the service.
ALLOWED_DOMAINS=http://localhost:3000
# The Alchemy API URL and access token to talk to Rinkeby ethereum network.
ALCHEMY_API_URL=https://eth-rinkeby.alchemyapi.io/v2/<ACCESS_TOKEN>
```

From the `snapshot-hub` root folder install the dependencies:

```bash
npm ci
```

Finally, start the snapshot-hub erc712 service:

```bash
docker-compose up
```

## Running the Tribute UI dApp

Alright, we are almost done. Now we will set up the Tribute UI dApp, so you can interact with your DAO that was deployed to Rinkeby.

You already deployed the Subgraph, and prepared the Snapshot Hub service, now let's start use the command line to start the dApp.

From the `tribute-ui` root folder, execute:

```bash
npm ci
```

Start the dApp:

```bash
npm start
```

## Interacting with the DAO

Open your browser and access http://localhost:3001.

You should see the Tribute UI onboarding page:

![Join Tribute DAO](/img/tutorial/dao-tutorial/join.png)

:::tip
Connect to TributeUI using the same MetaMask account you used to deploy the DAO to Rinkeby, since that address is considered the owner of the DAO you will have access to all features, and will hold 1 unit token.
:::

Connected:

![Connected](/img/tutorial/dao-tutorial/connected.png)

Access the _Governance_ page and hit _new proposal_ to create a proposal for vote, e.g:

![Governance](/img/tutorial/dao-tutorial/governance.png)

👏 Well Done!!!

🎉 You have launched your DAO using Tribute DAO Framework and now you can interact with it using the TributeUI dApp!

:::info
It was a lengthy tutorial, but we are constantly working to improve the deployment and configuration process.
:::

## Problems?

Ask for help on **[Discord](https://discord.gg/xXMA2DYqNf)** or on **[GitHub Discussions](https://github.com/openlawteam/tribute-contracts/discussions/new)**.
