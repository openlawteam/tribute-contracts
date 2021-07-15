---
id: introduction
title: Extensions
---

Extensions are conceived to isolate the complexity of state changes from the **[DaoRegistry Contract](/docs/contracts/core/dao-registry)**, and to simplify the core logic.

Each extension is tied to a particular DAO address. You can not share the exact same extension between different DAOs, otherwise you would be sharing your DAO state, hence other DAOs would be able to modify it. When we launch a new DAO, we deploy a new instance of each extension, by using the Clone Factory pattern, and then we associate that new instance address to the new DAO. With this approach we ensure that the DAO and Extensions states are consistent, and not shared across different DAOs.

:::tip

Essentially an Extension is similar to an Adapter, but the main difference is that it can be used by several adapters, and by the **[DaoRegistry Contract](/docs/contracts/core/dao-registry)** - which end up enhancing the DAO capabilities and the state management without cluttering the DAO core contract.

:::

## Existing Extensions

We currently have some extensions in place that can help you to launch your DAO:

- **[Bank](/docs/contracts/extensions/bank-extension)**: adds the banking capabilities to the DAO, and keeps track of the DAO accounts and internal token balances.

- **[NFT](/docs/contracts/extensions/nft-extension)**: adds to the DAO the capability of managing and curating a collection of standard NFTs.

- **[ERC20](/docs/contracts/extensions/erc20-extension)**: adds to the DAO the capability of managing and transfer internal tokens between members and/or external accounts.

- **[Executor](/docs/contracts/extensions/executor-extension)**: adds to the DAO the capability of executing delegated calls to other contracts, including contracts that are not part of the DAO, using the EVM instruction `delegatecall`.

## Creating an Extension

You can also create custom extensions to enhance the DAO capabilities. Checkout the tutorial: **[How to create an Extensions](/docs/tutorial/extensions/creating-an-extension)**.
