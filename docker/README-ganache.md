## Launching a Tribute DAO on Ganache

### 1. Clone tribute-contracts repository

Make sure you are using branch `release-v2.3.2`. This is the branch that contains the latest contracts.

- > cd tribute-contracts
- > git fetch origin release-v2.3.2
- > git checkout release-v2.3.2

### 2. Set the env vars

In the root of `tribute-contracts` folder create a .env file. This file will contain all the environment variables required by the deployment script. Most of these variables are configurations that are applied to the DAO contracts during the deployment. Please use the following template:

```
######################## Tribute Contracts env vars ########################

# Set the name of your DAO. Make sure the DAO name is unique.
DAO_NAME=My Tribute DAO xyz...

# The public ethereum address that belongs to the Owner of the DAO,
# in this case, it is your public ethereum address on Rinkeby network.
# Make sure you have some ETH, otherwise the deployment will fail.
# It needs to be the address of the first account you have in metamask accounts,
# otherwise it won't work.
DAO_OWNER_ADDR=0x...

# The name of the ERC20 token of your DAO.
ERC20_TOKEN_NAME=My First DAO Token

# The symbol of your ERC20 Token that will be used to control the
# DAO units that each member holds.
ERC20_TOKEN_SYMBOL=TDAO

# Number of decimals to display the token units in MM. We usually
# set 0 because the DAO units are managed in WEI, and to be able
# to see that in the MM wallet you need to remove the precision.
ERC20_TOKEN_DECIMALS=0

# The Ethereum Node URL to connect the Ethereum network. You can follow
# these steps to get your ProjectId/API Key from Infura:
# https://blog.infura.io/getting-started-with-infura-28e41844cc89/
# Or can use the default one from OpenLaw team, or set your own Infura/Alchemy API keys
ETH_NODE_URL=http://localhost:7545

# The 12 word "secret recovery phrase" for the ethereum address
# referenced in DAO_OWNER_ADDR above. This can be found in your wallet.
# It will be used to create the HD wallet and sign transactions on your behalf.
TRUFFLE_MNEMONIC=...

# You can set that to use the same address you have in the DAO_OWNER_ADDR
COUPON_CREATOR_ADDR=0x...
KYC_COUPON_CREATOR_ADDR=0x...

######################## Subgraph env vars ########################

# Set it to true if you want to deploy the subgraph to the TheGraph.com API.
# Usually we leave it disabled because we deploy to a local Graph Node
# created in docker/docker-compose.yml file.
REMOTE_GRAPH_NODE=false
```

### 3. Installing the dependencies and deploying the contracts

With the environment variables ready, we can install the project dependencies and start the deployment process.

Using NodeJS v16.x, run:

- > npm ci

In another terminal window you can launch ganache:

- > npm run ganache

Finally deploy the contracts to ganache network:

- > npm run deploy:ganache

### 4. Set the tribute-ui environment variables

After all contracts are deployed it is time to prepare the dApp, so it can interact with the DAO.

In the same `.env` file created under the `tribute-contracts` folder, add the following environment variables:

```

######################## Tribute UI env vars ########################

# Configure the UI to use the Ganache network for local development
REACT_APP_DEFAULT_CHAIN_NAME_LOCAL=GANACHE

# It can be the same value you used for the Tribute DAO deployment.
REACT_APP_INFURA_PROJECT_ID_DEV=INFURA_API_KEY

# The address of the Multicall smart contract deployed to the Rinkeby network.
# Copy that from the tribute-contracts/build/contracts-rinkeby-YYYY-MM-DD-HH:mm:ss.json
REACT_APP_MULTICALL_CONTRACT_ADDRESS=0x...

# The address of the DaoRegistry smart contract deployed to the Rinkeby network.
# Copy that from the tribute-contracts/build/contracts-rinkeby-YYYY-MM-DD-HH:mm:ss.json
REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS=0x...

# Enable Ganache network for Tribute UI
REACT_APP_ENVIRONMENT=local


######################## Graph Node env vars ########################

# The Ethereum Network node URL used by the Graph Node to listen to events.
ethereum=ganache:http://host.docker.internal:7545


```

Make sure you have set the correct addresses for `REACT_APP_MULTICALL_CONTRACT_ADDRESS` & `REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS`.

### 5. Building and deploying the Subgraph

The dApp uses a Subgraph to index the data collected from the chain. The data is processed and stored in the graph node, so it can be easily queried.

First, copy the **DaoFactory** `address` and `blockNumber` attributes from `tribute-contracts/logs/ganache-deploy_YYYY-MM-DD_HH:mm:ss.log`.

Clone the subgraph repo within `tribute-contracts` folder:

- Repo: https://github.com/openlawteam/tribute-subgraph

Open the file `tribute-contracts/tribute-subgraph/subgraphs/Core/subgraph.yaml`, and set the `address` and `startBlock` attributes for the **DaoFactory** subgraph:

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

### 6. Start all the services

The contracts were deployed and the subgraph configurations were prepared, now it is time to start the services using docker-compose.

From the `tribute-contracts/docker` folder, run:

- > docker-compose up

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
   trib-graph-node      | Sep 24 14:02:47.585 INFO Syncing 1 blocks from Ethereum., code: BlockIngestionStatus, blocks_needed: 1, blocks_behind: 1, latest_block_head: 13, current_block_head: 9349059, provider: ganache-rpc-0, component: BlockIngestor
   ...
```

### 7. Building and deploying the subgraph

Now that the services are up and running we can deploy the subgraph to our local graph node.

Using node v16.x in the `tribute-contracts/tribute-subgraph` folder, checkout the subgraph version `v2.0.2`:

- > cd tribute-subgraph
- > git fetch origin release-v2.0.2
- > git checkout release-v2.0.2

Install the subgraph project dependencies:

- > npm install

Build and deploy the subgraph:

- > npx ts-node subgraph-deployer.ts

Wait for the following output:

````
Deployed to http://localhost:8000/subgraphs/name/openlawteam/tribute/graphql

     Subgraph endpoints:
     Queries (HTTP):     http://localhost:8000/subgraphs/name/openlawteam/tribute
     Subscriptions (WS): http://localhost:8001/subgraphs/name/openlawteam/tribute

     👏 ### Done.
     🎉 ### 1 Deployment(s) Successful!
     ```

Done. Your DAO was launched! You can access it at http://localhost:3000

Make sure you add the ganache network to your MetaMask. Configs:

````

Network: Ganache
Port: 7545
ChainId: 1337
URL: http://localhost:7545

```

```
