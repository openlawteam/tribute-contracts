---
id: local-development
title: Development
---

> The Graph preconfigured Docker image for running a Graph Node.

In .env (create .env file if there isn't one already created), add your wallet seed phrase (for the hardhat contract compilation), and add the network name `ganache`.

## Terminal 1

Start ganache with in one terminal window:

```bash
ganache-cli --host 0.0.0.0 \
  --port 7545 \
  --networkId 1337 \
  --blockTime 10 \
  --mnemonic "twelve words including quotes"
```

:::info
Note that -h 0.0.0.0 is necessary for Ganache to be accessible from within Docker and from other machines. By default, Ganache only binds to 127.0.0.1, which can only be accessed from the host machine that Ganache runs on. [The Graph].
:::

[the graph]: https://thegraph.com/docs/quick-start#1.-set-up-ganache-cli

## Terminal 2

In the new terminal window run:

```bash
npm run deploy:ganache
```

and copy the **DaoFactory** contract address and block number into the respective `address` and `startBlock`.

:::caution
Make sure the block number starts from 1 previous block, for example, if the block number is 19 add 18 as the **startBlock** for the **DaoFactory** source in each subgraph YAML `tribute-subgraph/subgraphs/<SUBGRAPH CONTRACT DIRNAME>/subgraph.yaml`
:::

Then execute:

```bash
cd tribute-subgraph/docker/
docker-compose up
```

This will start IPFS, Postgres and Graph Node in Docker and create persistent
data directories for IPFS and Postgres in `./data/ipfs` and `./data/postgres`. You
can access these via:

- Graph Node:
  - GraphiQL: `http://localhost:8000/`
  - HTTP: `http://localhost:8000/subgraphs/name/<subgraph-name>`
  - WebSockets: `ws://localhost:8001/subgraphs/name/<subgraph-name>`
  - Admin: `http://localhost:8020/`
- IPFS:
  - `127.0.0.1:5001` or `/ip4/127.0.0.1/tcp/5001`
- Postgres:
  - `postgresql://graph-node:let-me-in@localhost:5432/graph-node`

## Terminal 3

Once this is up and running, you can create and deploy your subgraphs to the running Graph Node. To do this, from the project root tribute-subgraph directory, `npm run deploy-subgraph`.
