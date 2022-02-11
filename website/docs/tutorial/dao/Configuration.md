---
id: configuration
title: Configuration
---

⚡️ **[TributeDAO Framework](https://github.com/openlawteam/tribute-contracts)** provides you a set of modular and extensible smart contracts to launch your DAO with minimal costs.

## Requirements

- **[Tribute Contracts](https://github.com/openlawteam/tribute-contracts/tree/release-v2.3.5)** version [release-v2.3.5](https://github.com/openlawteam/tribute-contracts/tree/release-v2.3.5).
- **[Infura Ethereum API KEY](https://infura.io/product/ethereum)**: sign up for free, verify your email, create an ethereum project to get your API Key (also known as `Project Id`). We will use that to deploy the contracts to the Rinkeby network. Checkout this **[Infura Blog Post](https://blog.infura.io/getting-started-with-infura-28e41844cc89/)** for more info on that.

:::warning
Make sure you are on the branch [release-v2.3.5](https://github.com/openlawteam/tribute-contracts/tree/release-v2.3.5) which is the version that contains the contracts integrated with [TributeUI](https://github.com/openlawteam/tribute-ui).
:::

## Configuring the project

⚙️ Now that you have the `tribute-contracts` project prepared in your local environment, it is time to set up the DAO configs.

In the root of `tribute-contracts` folder we will create a `.env` file. This file will contain all the environment variables required by the deployment script. Most of these variables are configurations that are applied to the DAO contracts during the deployment.

In this section we will be covering the configurations to deploy a Tribute DAO to **[Rinkeby](https://rinkeby.etherscan.io/)** test network.

### Environment Variables

The first step is to create a `.env` file in the root of the _tribute-contracts_ directory:

```bash
touch .env
```

_[Here is a sample .env file](https://github.com/openlawteam/tribute-contracts/blob/master/.sample.env)_ which you can use to set the environment variables.

Please use the following template, and fill out each environment variable with the proper values as indicated in the comments below:

:::caution
The **DAO_OWNER_ADDR** env var needs to match the first ethereum address derived from your **TRUFFLE_MNEMONIC**. With a seed phrase you can create multiple addresses, but in this case we need the address of the first account of the wallet to be used as DAO owner.
:::

```bash
# tribute-contracts/.env

######################## Tribute Contracts env vars ########################

# Set the name of your DAO. Make sure the DAO name is unique.
DAO_NAME=My Tribute DAO xyz...

# The public ethereum address that belongs to the Owner of the DAO,
# in this case, it is your public ethereum address on Rinkeby network.
# Make sure you have some ETH, otherwise the deployment will fail.
# It needs to be the address of the first account you have in metamask accounts,
# otherwise it won't work.
DAO_OWNER_ADDR=0x...

# The contract which contains the previously deployed adapters and extensions,
# so you don't have to deploy it again.
# You don't need to change this address if you are deploying to Rinkeby.
# For any other network, you can disable this environment variable.
# Rinkeby: 0xFc1EFB0e026396BdCf3Fa6bfB34Ff9f07158b7dA - contracts v2.3.3
DAO_ARTIFACTS_CONTRACT_ADDR=0xFc1EFB0e026396BdCf3Fa6bfB34Ff9f07158b7dA
DAO_ARTIFACTS_OWNER_ADDR=0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0

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
ETH_NODE_URL=ws://rinkeby.openlaw.io:8546
#ETH_NODE_URL=wss://eth-rinkeby.ws.alchemyapi.io/v2/your-api-key
#ETH_NODE_URL=wss://rinkeby.infura.io/ws/v3/your-api-key

# The 12 word "secret recovery phrase" for the ethereum address
# referenced in DAO_OWNER_ADDR above. This can be found in your wallet.
# It will be used to create the HD wallet and sign transactions on your behalf.
TRUFFLE_MNEMONIC=...

# You can set that to use the same address you have in the DAO_OWNER_ADDR
COUPON_CREATOR_ADDR=0x...
KYC_COUPON_CREATOR_ADDR=0x...
```

⚡️ Alright! You have configured the project to deploy the contracts to **[Rinkeby](https://rinkeby.etherscan.io/)** test network. Let's move the next section to finally publish your DAO to the world 🌎!

## Problems?

Ask for help on **[Discord](https://discord.gg/xXMA2DYqNf)** or on **[GitHub Discussions](https://github.com/openlawteam/tribute-contracts/discussions/new)**.
