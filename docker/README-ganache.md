## Launching a Tribute DAO on Ganache

### 1. Clone tribute-contracts repository

Make sure you are using branch `release-v2.4.0`. This is the branch that contains the latest contracts.

- > cd tribute-contracts
- > git fetch origin release-v2.4.0
- > git checkout release-v2.4.0

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
WALLET_MNEMONIC=...

# You can set that to use the same address you have in the DAO_OWNER_ADDR
COUPON_CREATOR_ADDR=0x...
KYC_COUPON_CREATOR_ADDR=0x...
```

### 3. Installing the dependencies and deploying the contracts

With the environment variables ready, we can install the project dependencies and start the deployment process.

Using NodeJS v16.x, run:

- > npm run build

In another terminal window you can launch ganache:

- > npm run ganache

Finally deploy the contracts to ganache network:

- > npm run deploy ganache

### 4. Set the tribute-ui environment variables

After all contracts are deployed it is time to prepare the dApp, so it can interact with the DAO.

In the same `.env` file created under the `tribute-contracts` folder, add the following environment variables:

```

######################## Tribute UI env vars ########################

# Enable Ganache network for Tribute UI
REACT_APP_ENVIRONMENT=local

# Configure the UI to use the Ganache network for local development
REACT_APP_DEFAULT_CHAIN_NAME_LOCAL=GANACHE

# It can be the same value you used for the Tribute DAO deployment.
REACT_APP_INFURA_PROJECT_ID_DEV=set-your-infura-api-key-here

# The address of the Multicall smart contract deployed to the Rinkeby network.
# Copy that from the tribute-contracts/build/deployed/contracts-ganache-YYYY-MM-DD-HH:mm:ss.json
REACT_APP_MULTICALL_CONTRACT_ADDRESS=0x...

# The address of the DaoRegistry smart contract deployed to the Rinkeby network.
# Copy that from the tribute-contracts/build/deployed/contracts-ganache-YYYY-MM-DD-HH:mm:ss.json
REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS=0x...
```

Make sure you have set the correct addresses for `REACT_APP_MULTICALL_CONTRACT_ADDRESS` & `REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS`.

### 5. Launching your DAO

The contracts were deployed and the configurations were prepared, now it is time to spin up the DAO using docker-compose.

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
   ...
```

Done. Your DAO was launched! You can access it at http://localhost:3000

Make sure you add the ganache network to your MetaMask:

```
Network: Ganache
Port: 7545
ChainId: 1337
URL: http://localhost:7545
```
