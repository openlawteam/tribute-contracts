---
id: deployment
title: Deployment
---

⚡️ **[TributeDAO Framework](https://github.com/openlawteam/tribute-contracts)** provides you a set of modular and extensible smart contracts to launch your DAO with minimal costs.

## Requirements

- ⚙️ All the environment variables must be set in the _.env_ file as indicated in the previous section.

- 💲 Make sure you have ETH in your account (2 ETH should be more than enough).

## Deploying your DAO

:::warning
Make sure you are on the branch [release-v1.0.6](https://github.com/openlawteam/tribute-contracts/releases/tag/v1.0.6) which is the version that contains the contracts integrated with [TributeUI](https://github.com/openlawteam/tribute-ui).
:::

### Command line

The deployment process is triggered by the script `deploy:*`, where the `*` indicates which network the contracts are going to be deployed.

Execute the following command from the root directory of `tribute-contracts` project to deploy all the contracts to Rinkeby:

```bash
npm run deploy:rinkeby
```

🍺 Sit back and have some drink while the deployment script is executed. It may take from 10 to 20 minutes to create all the smart contracts.

:::info
The deployment is slow mainly because we publish all the smart contracts at once, even the ones that are not in use by the DAO. We certainly don't do that for Mainnet deployments, but we are constantly working to improve the developer experience, and minimize the gas costs.
:::

At the end of the deployment process you should see the following output:

```bash
...
************************
DaoRegistry: 0x...
BankExtension: 0x...
NFTExtension: 0x...
ERC20Extension: 0x...
************************

- Saving migration to chain.
   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.51462506 ETH


Summary
=======
> Total deployments:   34
> Final cost:          0.51610942 ETH
```

⚡️ Awesome!! You have deployed your DAO to the **[Rinkeby](https://rinkeby.etherscan.io/)** test network, and now it is time to interact with it using our dApp called **[Tribute UI](https://github.com/openlawteam/tribute-ui)**. Checkout the next section to dive into that.

## Problems?

Ask for help on **[Discord](https://discord.gg/xXMA2DYqNf)** or on **[GitHub Discussions](https://github.com/openlawteam/tribute-contracts/discussions/new)**.
