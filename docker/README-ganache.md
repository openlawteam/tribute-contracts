### Launching a DAO

1. Checkout tribute-contracts branch `release-v1.0.6`

   - > git fetch origin release-v1.0.6
   - > git checkout release-v1.0.6

2. Set the env vars in the root of `tribute-contracts` project

   ```
   ###### Tribute Contracts env vars ######

   # Set the name of your DAO.
   DAO_NAME=My First DAO

   # The public ethereum address that belongs to the Owner of the DAO,
   # in this case, it is your public ethereum address on Rinkeby network.
   # Make sure you have some ETH, otherwise the deployment will fail.
   DAO_OWNER_ADDR=0x...

   # You can set that to use the same address you have in the DAO_OWNER_ADDR
   COUPON_CREATOR_ADDR=0x...
   KYC_COUPON_CREATOR_ADDR=0x...

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

   ###### Subgraph env vars ######

   # Set it to true if you want to deploy the subgraph to the TheGraph.com API.
   # Usually we leave it disabled because we deploy to a local Graph Node
   # created in docker/docker-compose.yml file.
   REMOTE_GRAPH_NODE=false
   ```

3. Using nodejs v16.x install the libs, start ganache-cli, and deploy the contracts to ganache

   - > npm ci
   - > npm run ganache
   - > npm run deploy:ganache

4. Set the tribute-ui env vars in the same `tribute-contracts/.env` file:

   ```
   ###### Docker Compose env vars ######

   # It can be the same value you used for the Tribute DAO deployment.
   REACT_APP_INFURA_PROJECT_ID_DEV=INFURA_API_KEY

   # The address of the Multicall smart contract deployed to the Rinkeby network.
   # Copy that from the tribute-contracts/logs/[network]-deploy.log
   REACT_APP_MULTICALL_CONTRACT_ADDRESS=0x...

   # The address of the DaoRegistry smart contract deployed to the Rinkeby network.
   # Copy that from the tribute-contracts/logs/[network]-deploy.log
   REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS=0x...

   # The Ethereum Network node URL used by the Graph Node to listen to events.
   ethereum=ganache:http://host.docker.internal:7545

   # Enable Ganache network for Tribute UI
   REACT_APP_ENVIRONMENT=local
   REACT_APP_DEFAULT_CHAIN_NAME_LOCAL=GANACHE
   ```

5. Set the subgraph configs in the `subgraph-config.json` file

   ```
   ### tribute-contracts/subgraph/config/subgraph-config.json
   [
     {
       "network": "ganache",
       "daoFactoryAddress": "0x...", # Copy the DaoFactory contracts address from the deployment logs.
       "daoFactoryStartBlock": blockNumber, # Copy the DaoFactory blockNumber from the deployment logs.
       "GITHUB_USERNAME": "openlawteam", # do not change it
       "SUBGRAPH_NAME": "tribute"  # do not change it
     }
   ]
   ```

6. Start all the services in the tribute-contracts/docker folder

   - > docker-compose up
   - Wait for the following output:
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

7. Using node v16.x deploy the subgraph

   - > cd subgraph
   - > npm install
   - > npx ts-node subgraph-deployer.ts
   - Wait for the following output:

     ```
     Deployed to http://localhost:8000/subgraphs/name/openlawteam/tribute/graphql

     Subgraph endpoints:
     Queries (HTTP):     http://localhost:8000/subgraphs/name/openlawteam/tribute
     Subscriptions (WS): http://localhost:8001/subgraphs/name/openlawteam/tribute

     👏 ### Done.
     🎉 ### 1 Deployment(s) Successful!
     ```

   - Access your rinkeby DAO at http://localhost:3000
   - Make sure you add the ganache network to your MetaMask
     - Network: Ganache
     - Port: 7545
     - ChainId: 1337
     - URL: http://localhost:7545
