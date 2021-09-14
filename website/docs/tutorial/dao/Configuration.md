---
id: configuration
title: Configuration
---

⚡️ **[TributeDAO Framework](https://github.com/openlawteam/tribute-contracts)** provides you a set of modular and extensible smart contracts to launch your DAO with minimal costs.

## Requirements

- **[Infura Ethereum API KEY](https://infura.io/product/ethereum)**: sign up for free, verify your email, create an ethereum project to get your API Key (also known as `Project Id`). We will use that to deploy the contracts to the Rinkeby network. Checkout this **[Infura Blog Post](https://blog.infura.io/getting-started-with-infura-28e41844cc89/)** for more info on that.
- **[The Graph API Access Token](https://thegraph.com/)**: sign up to https://thegraph.com with your Github account, access the **[dashboard](https://thegraph.com/explorer/dashboard)**, and copy the **Access Token**. We will use that to deploy the **[Tribute DAO Subgraph](/docs/subgraph/definition)** to thegraph.com. Then click on "Add Subgraph" and type: _Tribute DAO Tutorial_, give it any subtitle, and hit _Create subgraph_.
  :::caution
  Be sure you are adding a subgraph in the legacy version of The Graph! You should see `legacy-explorer` in the URL.
  :::

## Configuring the project

⚙️ Now that you have the tribute-contracts project prepared in your local environment, it is time to set up the DAO configs. The configs are a set of environment variables that will provide to the deployment script all the essential information to deploy the smart contracts to the correct network. In this tutorial we will be covering the deploying of the DAO using **[Rinkeby](https://rinkeby.etherscan.io/)** test network.

### Environment Variables

The first step is to create a `.env` file in the root of the project directory:

```bash
touch .env
```

Then set the following content to the `.env` file, and fill out each environment variable with the values as indicated in the comments below:

```bash
# The name of the DAO.
DAO_NAME=My First DAO

# The public ethereum address that belongs to the Owner of the DAO,
# in this case, it is your public ethereum address on Rinkeby network.
# Make sure you have some ETH, otherwise the deployment will fail.
DAO_OWNER_ADDR=0x...

#can set that to use the same address you have in the DAO_OWNER_ADDR
COUPON_CREATOR_ADDR=0x...

# The name of the ERC20 token of your DAO.
ERC20_TOKEN_NAME=My First DAO Token

# The symbol of your ERC20 Token that will be used to control the
# DAO units that each member holds.
ERC20_TOKEN_SYMBOL=FDAO

# Number of decimals to display the token units in MM. We usually
# set 0 because the DAO units are managed in WEI, and to be able
# to see that in the MM wallet you need to remove the precision.
ERC20_TOKEN_DECIMALS=0

# The Infura Key to connect to Rinkeby network. You can follow
# these steps to get your ProjectId/API Key from Infura:
# https://blog.infura.io/getting-started-with-infura-28e41844cc89/
INFURA_KEY=

# The 12 word "secret recovery phrase" for the ethereum address
# referenced in DAO_OWNER_ADDR above. This can be found in your wallet.
# It will be used to create the HD wallet and sign transactions on your behalf.
TRUFFLE_MNEMONIC=...

# The Graph API Access Token that will be used to deploy the Subgraph.
GRAPH_ACCESS_TOKEN=...
```

:::caution
The **DAO_OWNER_ADDR** env var needs to match the ethereum address derived from your **TRUFFLE_MNEMONIC**.
:::

⚡️ Alright! You have configured the project to deploy the contracts to **[Rinkeby](https://rinkeby.etherscan.io/)** test network. Let's move the next section to finally publish your DAO to the world 🌎!

## Problems?

Ask for help on **[Discord](https://discord.gg/xXMA2DYqNf)** or on **[GitHub Discussions](https://github.com/openlawteam/tribute-contracts/discussions/new)**.
