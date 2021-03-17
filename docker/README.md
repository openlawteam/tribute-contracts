# Graph Node Docker Image

Preconfigured Docker image for running a Graph Node.

## Usage

Start ganache with `ganache-cli --host 0.0.0.0 --port 7545 --networkId 1337 --blockTime 10 --mnemonic "twelve words including quotes"` in one terminal window.

> Note that -h 0.0.0.0 is necessary for Ganache to be accessible from within Docker and from other machines. By default, Ganache only binds to 127.0.0.1, which can only be accessed from the host machine that Ganache runs on. [The Graph]

[the graph]: https://thegraph.com/docs/quick-start#1.-set-up-ganache-cli

In a new terminal window, `truffle deploy --network=ganache` and copy the `DaoFactory` and `BankFactory` contract addresses and block numbers into the respective `address` and `startBlock` (important: make sure the block number starts from 1 previous block, for example, if the block number is 19 add 18 as the `startBlock`) for each source in `/subgraph.yaml`.

Then, `cd docker/` and `docker-compose up`.

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

Once this is up and running, you can create and deploy your subgraph to the running Graph Node. To do this, in another terminal window `cd ..` to return to the root `/molochv3-contracts` directory, `truffle compile` to build the contracts, if they aren't already built. Then `graph codegen` to run the code generation, then `yarn create-local` and lastly to deploy the local subgraph `yarn deploy-local`.
