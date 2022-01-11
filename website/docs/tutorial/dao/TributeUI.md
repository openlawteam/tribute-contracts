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
Make sure you are on the branch [release-v2.3.3](https://github.com/openlawteam/tribute-contracts/tree/release-v2.3.3) which is the version that contains the contracts integrated with [TributeUI](https://github.com/openlawteam/tribute-ui).
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
  ...
```

## Interacting with the DAO

🎉 You have launched your DAO using Tribute DAO framework, and now you can interact with it using the Tribute UI dApp!

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

In order to add new members to the DAO open the Onboarding page: http://localhost:3000/onboarding,
create a new onboarding proposal for the new member account, sponsor it, vote yes, and submit the vote result to the DAO. Once that is done, the new member can access the proposal page and click on Process Proposal to join the DAO.

👏 Yeah, it was a lengthy tutorial, but you made it. Congrats and welcome to the Tribute DAO community!

## Problems?

Ask for help on **[Discord](https://discord.gg/xXMA2DYqNf)** or on **[GitHub Discussions](https://github.com/openlawteam/tribute-contracts/discussions/new)**.
