<div align="center">
    <img src="https://demo.tributedao.com/favicon.ico" height="70" alt="Tribute DAO Framework Logo">
    <h1>Tribute DAO Framework</h1>
    <strong>A modular, low cost and extensible set of contracts to build your DAO on Ethereum</strong>
</div>
<br>
<div align="center">
    <a href="https://github.com/openlawteam/tribute-contracts/actions/workflows/test.yml">
        <img src="https://github.com/openlawteam/tribute-contracts/actions/workflows/test.yml/badge.svg" alt="Tests">
    </a>
    <a href="https://github.com/openlawteam/tribute-contracts/actions/workflows/slither.yml">
        <img src="https://github.com/openlawteam/tribute-contracts/actions/workflows/slither.yml/badge.svg" alt="Slither">
    </a>
    <a href="https://codecov.io/gh/openlawteam/tribute-contracts">
        <img src="https://codecov.io/gh/openlawteam/tribute-contracts/branch/master/graph/badge.svg" alt="Coverage" >
    </a>
    <a href="https://www.npmjs.com/package/tribute-contracts">
        <img src="https://img.shields.io/npm/v/tribute-contracts.svg?logo=npm" alt="Slither">
    </a>
    <a href="https://discord.gg/tEfP68xnTd">
        <img src="https://img.shields.io/discord/854328535929192498.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2" alt="Discord">
    </a>
    <a href="https://twitter.com/TributeLabsXYZ">
        <img src="https://img.shields.io/twitter/follow/SnapshotLabs?label=TributeLabsXYZ&style=flat&logo=twitter&color=1DA1F2" alt="Twitter">
    </a>
</div>

<div align="center">
    <br>
    <a href="https://tributelabs.xyz"><b>TributeLabs.xyz »</b></a>
    <br><br>
    <a href="https://tributedao.com"><b>Docs</b></a>
    •
    <a href="https://demo.tributedao.com"><b>Demo</b></a>
</div>

## Contents

- [Overview](#overview)
- [Proposal](#proposed-evolution-of-molochdao-framework)
- [Architecture](#tribute-dao-architecture)
- [Quickstart](#quickstart)
- [Release](#release)
- [Contribute](#contribute)
- [Community](#community)
- [Thank You](#thank-you)
- [License](#license)

## Overview

TributeDAO is a new modular, low cost DAO framework. The framework aims to improve DAOs by fixing the:

- **Lack of modularity**: which has created challenges both in terms of extending, managing, and upgrading DAOs;
- **Rigid voting and governance mechanisms**: which limit the ability to experiment with additional forms of governance;
- **High costs**: especially for onchain voting;
- **Single token DAO structures**: which make it difficult to divide up economic and governance rights and create teams or sub-groups; and
- **Lack of NFT Support**: which makes it difficult for DAOs to be deployed for NFT projects.

The TributeDAO framework aims to address these issues, as part of our quest to make DAOs the dominant form of organization. As the growing number of participants in DAOs know, there is no “one size fits all” for managing any organization. DAOs need low cost and easy to develop components that can be assembled like lego blocks to fit the needs of the organization and its membership.

## Proposed Evolution of MolochDAO Framework

The TributeDAO framework is our team's tribute to the MolochDAO ecosystem. As many know, MolochDAO brought new life to DAOs. Through an elegant smart contract design, this smart contract framework brought DAOs back to life, helping us push beyond the fiery depths of “The DAO.”

Last year, we worked to evolve the initial MolochDAO smart contracts by assisting with the creation of Moloch v2, which enabled multiple token support, “guildkicks” to remove unwanted members, and “loot” to issue non-voting shares still entitled to financial distributions. These upgraded contracts were built with “venture” and similar investment transactions in mind, allowing for more effective swaps and control over tokenized assets and membership.

The TributeDAO framework hopes to provide teams looking to deploy DAOs with several enhancements and improvements, including:

- **Simpler code** - each module is responsible for only one function which reduces coupling and makes the system easier to understand.
- **Adaptability** - each part of the DAO can be adapted to the needs of a particular DAO without the need to audit the entire code base every time.
- **Upgradability** - modules can be easily upgraded as necessary. For example, as the voting process evolves over time the module responsible for managing the voting process can be upgraded without changing any other modules or the Core Contract. Modules can also be used by multiple DAOs without the need to be redeployed.

Inspired by the [hexagonal architecture design pattern](<https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)>) we believe that we can have additional layers of security, and break the main contract into smaller contracts. With that, we create loosely coupled modules/contracts, easier to audit, and can be easily connected to the DAO.

## Tribute DAO Architecture

![laoland_hexagon_architecture](https://user-images.githubusercontent.com/708579/107689684-e7300200-6c87-11eb-89c0-7bfe7eddaaaf.png)

The main design goal is to limit access to the smart contracts according at layer boundaries. The External World (i.e. RPC clients) can access the core contracts only via Adapters, never directly. Every adapter contains all the necessary logic and data to update/change the state of the DAO in the DAORegistry Contract. The Core Contract tracks all the state changes of the DAO, and an Adapter tracks only the state changes in its own context. Extensions enhance the DAO capabilities and simplify the Core Contract code. The information always flows from the External World to the Core Contracts, never the other way around. If a Core Contract needs external info, it must be provided by an Adapter and/or an Extension instead of calling External World directly.

There are five main components in the Tribute architecture outlined further below.

### Core Contracts

The core contracts serve as the spine for the Tribute DAO framework and act as a DAO registry, creating a digital version of "division of corporations." These contracts compose the DAO itself, and make it cheaper and easier to deploy a DAO. These contracts directly change the DAO state without the need of going through an adapter or extension (described further below). A core contract never pulls information directly from the external world. For that we use Adapters and Extensions, and the natural information flow is always from the external world to the core contracts.

There are three core contracts as part of the Tribute DAO framework, including a:

- [DaoRegistry](https://tributedao.com/docs/contracts/core/dao-registry): tracks the state changes of the DAO, only adapters with proper [Access Flags](#access-control-layer) can alter the DAO state.
- CloneFactory: creates a clone of the DAO based on its address.
- [DaoFactory](https://tributedao.com/docs/contracts/core/dao-factory): creates, initializes, and adds adapter configurations to the new DAO, and uses the CloneFactory to reduce the DAO creation transaction costs.

### Adapters and Extensions

Once a DAO is created using the above core contracts, they can be extended and modified with adapters and extensions. Adapters and extensions make it easy to assemble a DAO like lego blocks, by adding to a DAO narrowly-defined, tested, and extensible smart contracts created for specific purposes. Adapters and extensions make DAOs more modular, upgradeable, and also enable us to work together to build robust DAO tooling. They can be added to a TributeDAO via a DAO vote.

#### Adapters

There are currently 12 adapters implemented in the Tribute DAO framework and these adapters make the Tribute DAO framework feature compatible with Moloch v2:

- [Configuration](https://tributedao.com/docs/contracts/adapters/configuration/configuration-adapter): manages storing and retrieving per-DAO settings required by shared adapters.
- [Distribute](https://tributedao.com/docs/contracts/adapters/distribution/distribute-adapter): allows the members to distribute funds to one or all members of the DAO.
- [Financing](https://tributedao.com/docs/contracts/adapters/funding/financing-adapter): allows individuals and/or organizations to request funds to finance their projects, and the members of the DAO have the power to vote and decide which projects should be funded.
- [GuildKick](https://tributedao.com/docs/contracts/adapters/exiting/guild-kick-adapter): gives the members the freedom to choose which individuals or organizations should really be part of the DAO.
- [Managing](https://tributedao.com/docs/contracts/adapters/configuration/managing-adapter): enhances the DAO capabilities by adding/updating the DAO Adapters through a voting process.
- [OffchainVoting](https://tributedao.com/docs/contracts/adapters/voting/offchain-voting-adapter): adds the offchain voting governance process to the DAO to support gasless voting.
- [Onboarding](https://tributedao.com/docs/contracts/adapters/onboarding/onboarding-adapter): triggers the process of minting internal tokens in exchange of a specific token at a fixed price.
- [Ragequit](https://tributedao.com/docs/contracts/adapters/exiting/rage-quit-adapter): gives the members the freedom to choose when it is the best time to exit the DAO for any given reason.
- [Tribute](https://tributedao.com/docs/contracts/adapters/onboarding/tribute-adapter): allows potential and existing DAO members to contribute any amount of ERC-20 tokens to the DAO in exchange for any amount of DAO internal tokens.
- [TributeNFT](https://tributedao.com/docs/contracts/adapters/onboarding/tribute-nft-adapter): allows potential DAO members to contribute a registered ERC-721 asset to the DAO in exchange for any amount of DAO units.
- [Voting](https://tributedao.com/docs/contracts/adapters/voting/basic-voting-adapter): adds the simple on chain voting governance process to the DAO.
- [Withdraw](https://tributedao.com/docs/contracts/adapters/utils/bank-adapter#withdraw): allows the members to withdraw their funds from the DAO bank.

The range of potential adapters will expand over time and likely will include:

- "Streams" to manage a DAO's treasury in a more agile way
- Alternative voting structures to layer to improve DAO governance, including quadratic voting, one-member-one-vote voting
- Swaps of one token for another
- Streaming payments
- NFT-based onboarding
- DAO-to-DAO voting
- Creating a liquidity pool for a DAO's native asset
- Staking or depositing assets into existing DeFi projects (like Aave, Compound, or Lido)

Creating an adapter is straight forward and should save developers engineering time. Each adapter needs to be configured with the [Access Flags](#access-control-layer) in order to access the [Core Contracts](#core-contracts), and/or [Extensions](#extensions). Otherwise the Adapter will not able to pull/push information to/from the DAO.

Please note:

- Adapters do not keep track of the state of the DAO. An adapter might use storage to control its own state, but ideally any DAO state change must be propagated to the DAORegistry Core Contract.
- Adapters just execute smart contract logic that changes the state of the DAO by calling the DAORegistry. They also can compose complex calls that interact with External World, other Adapters or even Extensions, to pull/push additional information.
- The adapter must follow the rules defined by the [Template Adapter](https://tributedao.com/docs/tutorial/adapters/adapter-template).
- If you want to contribute and create an Adapter, please checkout this: [How to create an Adapter](https://tributedao.com/docs/tutorial/adapters/creating-an-adapter).

### Extensions

Extensions are conceived to isolate the complexity of state changes from the DAORegistry contract, and to simplify the core logic. Essentially an Extension is similar to an Adapter, but the main difference is that it is used by several adapters and by the DAORegistry - which end up enhancing the DAO capabilities and the state management without cluttering the DAO core contract.

- [Bank](https://tributedao.com/docs/contracts/extensions/bank-extension): adds the banking capabilities to the DAO, and keeps track of the DAO accounts and internal token balances.

- [NFT](https://tributedao.com/docs/contracts/extensions/nft-extension): adds to the DAO the capability of managing and curating a collection of standard NFTs.

- [ERC20](https://tributedao.com/docs/contracts/extensions/erc20-extension): adds to the DAO the capability of managing and transfer internal tokens between members and/or external accounts.

- [Executor](https://tributedao.com/docs/contracts/extensions/executor-extension): adds to the DAO the capability of executing delegated calls to other contracts, including contracts that are not part of the DAO, using the EVM instruction `delegatecall`.

#### Access Control Layer

The Access Control Layer (ACL) is implemented using Access Flags to indicate which permissions an adapter must have in order to access and modify the DAO state. The are 3 main categories of [Access Flags](https://tributedao.com/docs/intro/design/access-control):

- MemberFlag: `EXISTS`.
- ProposalFlag: `EXISTS`, `SPONSORED`, `PROCESSED`.
- AclFlag: `REPLACE_ADAPTER`, `SUBMIT_PROPOSAL`, `UPDATE_DELEGATE_KEY`, `SET_CONFIGURATION`, `ADD_EXTENSION`, `REMOVE_EXTENSION`, `NEW_MEMBER`.

The Access Flags of each adapter must be provided to the DAOFactory when the `daoFactory.addAdapters` function is called passing the new adapters. These flags will grant the access to the DAORegistry contract, and the same process must be done to grant the access of each Adapter to each Extension (function `daoFactory.configureExtension`).

The Access Flags are defined in the DAORegistry using the modifier `hasAccess`. For example, a function with the modifier `hasAccess(this, AclFlag.REPLACE_ADAPTER)` means the adapter calling this function needs to have the Access Flag `REPLACE_ADAPTER` enabled, otherwise the call will revert. In order to create an Adapter with the proper Access Flags one needs to first map out all the functions that the Adapter will be calling in the DAORegistry and Extensions, and provide these Access Flags using the DAO Factory as described above.

You can find more information about the purpose of each access flag at [DAO Registry - Access Flags](https://tributedao.com/docs/contracts/core/dao-registry#access-flags).

## Quickstart

### Install all dependencies

```sh
npm ci
```

### Creating a .env file at the root

```sh
cp .sample.env .env
```

### Compile contracts

```sh
npm run compile
```

### Deploy contracts

Deploy contracts to networks such as rinkeby, goerli, harmonytest, polygontest, ganache, mainnet, harmony or polygon.

```sh
npm run deploy rinkeby
```

OR

```sh
npm run deploy goerli
```

OR

```sh
npm run deploy harmonytest
```

OR

```sh
npm run deploy polygontest
```

OR

```sh
npm run deploy mainnet
```

OR

```sh
npm run deploy harmony
```

OR

```sh
npm run deploy polygon
```

For more information about the deployment, see the in logs [logs/contracts](logs/contracts)

### Verify contracts

```sh
npm run verify rinkeby
```

OR

```sh
npm run verify mainnet
```

### DApp setup

In the same `.env` file created under the `tribute-contracts` folder, set the following environment variables:

```
######################## Tribute UI env vars ########################

# Configure the UI to use the Rinkeby network for local development
REACT_APP_DEFAULT_CHAIN_NAME_LOCAL=RINKEBY

# It can be the same value you used for the Tribute DAO deployment.
REACT_APP_INFURA_PROJECT_ID_DEV=YOUR_INFURA_API_KEY

# The address of the Multicall smart contract deployed to the Rinkeby network.
# Copy that from the tribute-contracts/build/contracts-rinkeby-YYYY-MM-DD-HH:mm:ss.json
REACT_APP_MULTICALL_CONTRACT_ADDRESS=0x...

# The address of the DaoRegistry smart contract deployed to the Rinkeby network.
# Copy that from the tribute-contracts/build/contracts-rinkeby-YYYY-MM-DD-HH:mm:ss.json
REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS=0x...

# Enable Rinkeby network for Tribute UI
REACT_APP_ENVIRONMENT=development
```

Make sure you have set the correct addresses for `REACT_APP_MULTICALL_CONTRACT_ADDRESS` & `REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS`.

### DAO Launch

From the `tribute-contracts/docker` folder, run:

- > docker-compose up

### Linter

List the problems found in project files

```sh
npm run lint
```

Fix the lint issues

```sh
npm run lint:fix
```

### Slither

```sh
npm run slither
```

### Tests

```sh
npm test
```

### Environment variables

Contracts:

- `DAO_NAME`: The name of the DAO.
- `DAO_OWNER_ADDR`: The DAO Owner ETH Address (0x...) in the target network.
- `ETH_NODE_URL`: The Ethereum Node URL to connect to the Ethereum blockchain, it can be http/ws.
- `WALLET_MNEMONIC`: The wallet mnemonic string containing the 12 secret keywords.
- `ETHERSCAN_API_KEY`: The Ether Scan API Key to verify the contracts after the deployment.
- `DEBUG`: Debug the Ether Scan contract verification calls (`true`|`false`).
- `COUPON_CREATOR_ADDR`: The public eth (0x...) address of the creator of the onboarding coupons.
- `ERC20_TOKEN_NAME`: The ERC20 Token Name used by the ERC20 Token Extension.
- `ERC20_TOKEN_SYMBOL`: Token Symbol used by the ERC20 Token Extension.
- `ERC20_TOKEN_DECIMALS`: The ERC20 Token Decimals to display in MetaMask.
- `OFFCHAIN_ADMIN_ADDR`: The address of the admin account that manages the offchain voting adapter.
- `VOTING_PERIOD_SECONDS`: The maximum amount of time in seconds that members are allowed vote on proposals.
- `GRACE_PERIOD_SECONDS`: The minimum time in seconds after the voting period has ended, that the members need to wait before processing a proposal.
- `DAO_ARTIFACTS_OWNER_ADDR`: The owner address of the artifacts deployed. Leave it empty to if you want to use the `DAO_OWNER_ADDR` as the artifacts owner.
- `DAO_ARTIFACTS_CONTRACT_ADDR`: The `DaoArtifacts` contract address that will be used in the deployment script to fetch Adapters and Factories during the deployment to save gas costs.

Snapshot-hub:

- `PORT`: The Snapshot hub Server port
- `ENV`: To indicate in which environment it is being executed: local, dev, or prod
- `USE_IPFS`: To indicated the pinning service on IPFS should be enabled/disabled (if enabled cause delay in the responses)
- `RELAYER_PK`: The PK of the account that will be used to sign the messages.
- `NETWORK`: The network name that will be used by the relayer (use testnet for: rinkeby or ropsten), and mainnet for the main eth network
- `JAWSDB_URL`: The postgres url: postgres://user:pwd@host:5432/db-name
- `ALLOWED_DOMAINS`: The list of domains that should be allowed to send requests to the API
- `ALCHEMY_API_URL`: The relayer API (alternative to Infura)

Tribute-UI:

- `REACT_APP_DEFAULT_CHAIN_NAME_LOCAL`: The network which the dApp needs to connect to.
- `REACT_APP_INFURA_PROJECT_ID_DEV`: Your infura key.
- `REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS`: The address of the `DaoRegistry` smart contract deployed, copy that from `build/deployed/contracts-network-YYYY-MM-DD-HH:mm:ss.json`
- `REACT_APP_MULTICALL_CONTRACT_ADDRESS`: The address of the `Multicall` smart contract deployed, copy that from `build/deployed/contracts-network-YYYY-MM-DD-HH:mm:ss.json`.
- `REACT_APP_ENVIRONMENT`: The environment which the app will be executed. Set it to `development` env.

## Release

1. Checkout `master` and pull the latest
2. Locally run `npm run release`
3. Choose a new semver version number
4. **In the background the following will happen**:
   1. the `package.json` version will be bumped
   2. a new Git tag is created
   3. package version bump and tag pushed to `master`
   4. GitHub Release page will open, set the release name, edit the changelog if needed, and publish
   5. `publish.yaml` will execute (due to the new release tag) to publish the new package version to the NPM registry.
5. Done!

## Contribute

Tribute exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## Community

Join us on [Discord](https://discord.gg/xXMA2DYqNf).

## Thank You

**THANK YOU** to **all** coders, designers, auditors, and any individual who have contributed with ideas, resources, and energy to this and previous versions of this project. [Thank you all](https://tributedao.com/docs/thanks).

## License

Tribute is released under the [MIT License](LICENSE).
