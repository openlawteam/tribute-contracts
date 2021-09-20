---
id: installation
title: Installation
sidebar_position: 2
---

⚡️ **[TributeDAO Framework](https://github.com/openlawteam/tribute-contracts)** provides you a set of modular and extensible smart contracts to launch your DAO with minimal costs.

## Requirements

- **[Node.js](https://nodejs.org/en/download/)** version >= 12.12.0 or above (which can be checked by running `node -v`). You can use [nvm](https://github.com/nvm-sh/nvm) for managing multiple Node versions on a single machine installed
- **[Git](https://git-scm.com/downloads)** version 2.15.0 or above.
- **[Solc](https://docs.soliditylang.org/en/develop/installing-solidity.html)** version 0.8.0.

## Creating the project

The easiest way to start with TributeDAO Framework is to use the command line tool to clone the Github repository and install all the project dependencies.

We will use several projects to build and run the TributeDAO in your local environment, so please try to keep the following folder structure:

```
tribute-tutorial
│
└───tribute-contracts (branch v1.0.0)
│   │   .env
│   │   ...
|   |
│   └───subgraph (branch v1.1.0)
│       │   .env
│       │   ...
│
└───tribute-ui
│     │   .env
│     │   ...
│
└───snapshot-hub (branch erc-712)
    │   .env
    │   docker-compose.yml
    │   ...
```

Create and access the tutorial folder:

```bash
mkdir tribute-tutorial && cd tribute-tutorial
```

Clone and access the _tribute-contracts_ Github repo:

```bash
git clone https://github.com/openlawteam/tribute-contracts.git && cd tribute-contracts
```

:::caution
Make sure you checkout the tag [v1.0.0](https://github.com/openlawteam/tribute-contracts/releases/tag/v1.0.0) which is the version that contains the contracts that work with [TributeUI](https://github.com/openlawteam/tribute-ui).
:::

```bash
git checkout tags/v1.0.0 -b branch-v1.0.0
```

Install all the project dependencies and compile the smart contracts:

```bash
npm ci && npm run compile
```

The expected output from the compilation process should be:

```bash
...
> Compiling ...
> Artifacts written to ~/tribute-contracts/build/contracts
> Compiled successfully using:
   - solc: 0.8.0...
```

⚡️ That's is great! You have installed project dependencies, compiled all the smart contracts, and is prepared to configure the testnet deployment. Let's move to the next section!

## Problems?

Ask for help on **[Discord](https://discord.gg/xXMA2DYqNf)** or on **[GitHub Discussions](https://github.com/openlawteam/tribute-contracts/discussions/new)**.
