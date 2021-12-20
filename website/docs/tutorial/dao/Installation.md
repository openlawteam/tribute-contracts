---
id: installation
title: Installation
sidebar_position: 2
---

⚡️ **[TributeDAO Framework](https://github.com/openlawteam/tribute-contracts)** provides you a set of modular and extensible smart contracts to launch your DAO with minimal costs.

## Requirements

- **[Node.js](https://nodejs.org/en/download/)** version >= 16.0.0 or above (which can be checked by running `node -v`). You can use [nvm](https://github.com/nvm-sh/nvm) for managing multiple Node versions on a single machine.
- **[Git](https://git-scm.com/downloads)** version 2.15.0 or above.
- **[Solc](https://docs.soliditylang.org/en/develop/installing-solidity.html)** version 0.8.0.

## Creating the project

:::warning
Make sure you are on the branch [release-v1.0.6](https://github.com/openlawteam/tribute-contracts/releases/tag/v1.0.6) which is the version that contains the contracts integrated with [TributeUI](https://github.com/openlawteam/tribute-ui).
:::

The easiest way to start with TributeDAO Framework is to use the command line tool to clone the Github repository, and install all the project dependencies.

Clone and access the _tribute-contracts_ Github repo:

```bash
git clone https://github.com/openlawteam/tribute-contracts.git && cd tribute-contracts
```

Fetch and checkout the branch `release-v1.0.6`:

> git fetch origin release-v1.0.6

> git checkout release-v1.0.6

Install all the project dependencies and deploy the smart contracts:

```bash
npm ci && npm run compile
```

⚡️ That's is great! You have installed project dependencies, compiled all the smart contracts, and is prepared to configure the testnet deployment. Let's move to the next section!

## Problems?

Ask for help on **[Discord](https://discord.gg/xXMA2DYqNf)** or on **[GitHub Discussions](https://github.com/openlawteam/tribute-contracts/discussions/new)**.
