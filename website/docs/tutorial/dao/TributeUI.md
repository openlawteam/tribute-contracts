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

## Launching the DAO

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

![JoinTributeDAO](https://user-images.githubusercontent.com/708579/149008572-5e81128c-43df-4f15-adce-b5be560809a5.png)

:::tip
Connect to TributeUI using the same MetaMask account you used to deploy the DAO to Rinkeby, since that address is considered the owner of the DAO you will have access to all features, and will hold 1 unit token (1 share).
:::

Connected:

![Connected](https://user-images.githubusercontent.com/708579/149004770-37cca651-e86f-47a8-9764-515e5f4f4fea.png)

In order to add new members to the DAO open the _Onboarding_ page, and click on _onboard_ button to create a new onboarding proposal. Set the new member address and the amount in ETH that the member needs to contribute to join the DAO. Click on _Submit_, sponsor it, vote yes, and wait for the voting period to end.

![NewOnboardingProposal](https://user-images.githubusercontent.com/708579/149005966-6e640ea3-6d07-41b5-a470-0433f96657d9.png)

![VotingPeriod](https://user-images.githubusercontent.com/708579/149007310-ddef836a-f9c2-4586-bb2d-8f1490fb8a10.png)

Once the voting period is ended you can submit the vote result to the DAO. Then the grace period starts.

![GracePeriod](https://user-images.githubusercontent.com/708579/149004990-b5d4f46a-1769-4a36-8518-85ef8a894176.png)

![ViewProposalInGracePeriod](https://user-images.githubusercontent.com/708579/149005638-5332e487-e2e9-4f2c-97c7-15ad2418f61d.png)

The new member will be able to access the proposal page, and click on _Process_ button to join the DAO after the grace period is over.

You can also process the proposal using your member, but you will be paying for the new member contribution.

![ProcessProposal](https://user-images.githubusercontent.com/708579/149006462-d974e743-4263-4fde-95ce-226c97fe23bd.png)

The _Process Proposal_ routine will move the funds from the sender wallet to the bank, and issue the new DAO shares for the address that is specified in the Onboarding proposal.

If the proposal was successfully processed, you will see it in the _Passed_ section on the _Onboarding_ page.

![ProposalPassed](https://user-images.githubusercontent.com/708579/149008302-f6c9ce78-1193-4d53-824d-118fa60ae810.png)

The the address informed in the proposal is now a DAO member.

![NewMember](https://user-images.githubusercontent.com/708579/149008045-49ca04ce-32b7-4119-871a-6f1ee17117ea.png)

👏 Yeah, it was a lengthy tutorial, but you made it. Congrats and welcome to the Tribute DAO community!

## Problems?

Ask for help on **[Discord](https://discord.gg/xXMA2DYqNf)** or on **[GitHub Discussions](https://github.com/openlawteam/tribute-contracts/discussions/new)**.
