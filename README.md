[![codecov](https://codecov.io/gh/openlawteam/tribute-contracts/branch/master/graph/badge.svg?token=XZRL9RUYZE)](https://codecov.io/gh/openlawteam/tribute-contracts)

## Contents

- [Overview](#overview)
- [Usage](#Usage)
- [Contribute](#contribute)
- [Subgraph](https://github.com/openlawteam/tribute-contracts/tree/master/subgraph/README.md)

## Overview

TributeDAO is a new modular, low cost DAO framework. The framework aims to improve DAOs by fixing the:

- **Lack of modularity**: which has created challenges both in terms of extending, managing, and upgrading DAOs;
- **Rigid voting and governance mechanisms**: which limit the ability to experiment with additional forms of governance;
- **High costs**: especially for onchain voting;
- **Single token DAO structures**: which make it difficult to divide up economic and governance rights and create teams or sub-groups; and
- **Lack of NFT Support**: which makes it difficult for DAOs to be deployed for NFT projects.

The TributeDAO framework aims to address these issues, as part of our quest to make DAOs the dominant form of organization. As the growing number of participants in DAOs know, there is no “one size fits all” for managing any organization. DAOs need low cost and easy to develop components that can be assembled like lego blocks to fit the needs of the organization and its membership.

## Proposed Evolution of MolochDAO Framework

The TributeDAO framework is our team's tribute to the MolochDAO ecosysten. As many know, MolochDAO brought new life to DAOs. Through an elegant smart contract design, this smart contract framework brought DAOs back to life, helping us push beyond the fiery depths of “The DAO.”

Last year, we worked to evolve the initial MolochDAO smart contracts by assisting with the creation of Moloch v2, which enabled multiple token support, “guildkicks” to remove unwanted members, and “loot” to issue non-voting shares still entitled to financial distributions. These upgraded contracts were built with “venture” and similar investment transactions in mind, allowing for more effective swaps and control over tokenized assets and membership.

The TributeDAO framework hopes to provide teams looking to deploy DAOs with several enhancements and improvements, including:

- **Simpler code** - each module is responsible for only one function which reduces coupling and makes the system easier to understand.
- **Adaptability** - each part of the DAO can be adapted to the needs of a particular DAO without the need to audit the entire code base every time.
- **Upgradability** - modules can be easily upgraded as necessary. For example, as the voting process evolves over time the module responsible for managing the voting process can be upgraded without changing any other modules or the Core Contract. Modules can also be used by multiple DAOs without the need to be redeployed.

Inspired by the [hexagonal architecture design pattern](<https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)>) we believe that we can have additional layers of security, and break the main contract into smaller contracts. With that, we create loosely coupled modules/contracts, easier to audit, and can be easily connected to the DAO.

### Architecture

![laoland_hexagon_architecture](https://user-images.githubusercontent.com/708579/107689684-e7300200-6c87-11eb-89c0-7bfe7eddaaaf.png)

The main design goal is to limit access to the smart contracts according at layer boundaries. The External World (i.e. RPC clients) can access the core contracts only via Adapters, never directly. Every adapter contains all the necessary logic and data to update/change the state of the DAO in the DAORegistry Contract. The Core Contract tracks all the state changes of the DAO, and an Adapter tracks only the state changes in its own context. Extensions enhance the DAO capabilities and simplify the Core Contract code. The information always flows from the External World to the Core Contracts, never the other way around. If a Core Contract needs external info, it must be provided by an Adapter and/or an Extension instead of calling External World directly.

There are five main components in the Tribute architecture:

The core contracts serve as the spine for the Tribute DAO framework and act as a DAO registry, creating a digital version of "division of corporations." These contracts compose the DAO itself, and make it cheaper and easier to deploy a DAO. These contracts directly change the DAO state without the need of going through an adapter or extension (described further below). A core contract never pulls information directly from the external world. For that we use Adapters and Extensions, and the natural information flow is always from the external world to the core contracts.

The external world is essentially anything that interacts with the DAO. An example of that are RPC clients that are responsible for calling the Adapters public/external functions to pull/push data to the DAO Core Contracts and its Extensions.

#### Adapters

Adapters are well-defined, tested and extensible smart contracts that are created with a unique purpose. One Adapter is responsible for performing one or a set of tasks in a given context. With this approach we can develop adapters targeting specific use-cases, and update the DAO configurations to use these new adapters.

Once a DAO is created using the above core contracts, they can be extended and modified with adapters and extensions. Adapters and extensions make it easy to assemble a DAO like lego blocks, by adding to a DAO narrowly-defined, tested, and extensible smart contracts created for specific purposes. Adapters and extensions make DAOs more modular, upgradeable, and also enable us to work together to build robust DAO tooling. They can be added to a TributeDAO via a DAO vote.

Each adapter needs to be configured with the [Access Flags](#access-control-layer) in order to access the [Core Contracts](#core-contracts), and/or [Extensions](#extensions). Otherwise the Adapter will not able to pull/push information to/from the DAO.

Adapters implemented in the Tribute project:

- [Configuration](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Configuration.md): manages storing and retrieving per-DAO settings required by shared adapters.
- [Distribute](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Distribute.md): allows the members to distribute funds to one or all members of the DAO.
- [Financing](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Financing.md): allows individuals and/or organizations to request funds to finance their projects, and the members of the DAO have the power to vote and decide which projects should be funded.
- [GuildKick](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/GuildKick.md): gives the members the freedom to choose which individuals or organizations should really be part of the DAO.
- [Managing](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Managing.md): enhances the DAO capabilities by adding/updating the DAO Adapters through a voting process.
- [OffchainVoting](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/OffchainVoting.md): adds the offchain voting governance process to the DAO to support gasless voting.
- [Onboarding](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Onboarding.md): triggers the process of minting internal tokens in exchange of a specific token at a fixed price.
- [Ragequit](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Ragequit.md): gives the members the freedom to choose when it is the best time to exit the DAO for any given reason.
- [Tribute](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Tribute.md): allows potential and existing DAO members to contribute any amount of ERC-20 tokens to the DAO in exchange for any amount of DAO internal tokens.
- [TributeNFT](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/TributeNFT.md): allows potential DAO members to contribute a registered ERC-721 asset to the DAO in exchange for any amount of DAO units.
- [Voting](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Voting.md): adds the simple on chain voting governance process to the DAO.
- [Withdraw](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Withdraw.md): allows the members to withdraw their funds from the DAO bank.

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
- The adapter must follow the rules defined by the [Template Adapter](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Template.md).
- If you want to contribute and create an Adapter, please checkout this: [How to create an Adapter](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/HowToCreate.md).

#### Extensions

Extensions are conceived to isolate the complexity of state changes from the DAORegistry contract, and to simplify the core logic. Essentially an Extension is similar to an Adapter, but the main difference is that it is used by several adapters and by the DAORegistry - which end up enhancing the DAO capabilities and the state management without cluttering the DAO core contract.

- [Bank](https://github.com/openlawteam/tribute-contracts/blob/master/docs/extensions/Bank.md): adds the banking capabilities to the DAO, and keeps track of the DAO accounts and internal token balances.

- [NFT](https://github.com/openlawteam/tribute-contracts/blob/master/docs/extensions/NFT.md): adds to the DAO the capability of managing and curate a collection of standard NFTs.

- [ERC20](https://github.com/openlawteam/tribute-contracts/blob/master/docs/extensions/ERC20.md): adds to the DAO the capability of managing and transfer internal tokens between members and/or external accounts.

#### Core Contracts

A core contract is a contract that composes the DAO itself, and directly changes the DAO state without the need of going through an Adapter. Ideally a core contract shall never pull information directly from the external world. For that we use Adapters and Extensions, and the natural information flow is always from the external world to the core contracts.

- [DaoRegistry](https://github.com/openlawteam/tribute-contracts/blob/master/docs/core/DaoRegistry.md): tracks the state changes of the DAO, only adapters with proper [Access Flags](#access-control-layer) can alter the DAO state.
- CloneFactory: creates a clone of the DAO based on its address.
- [DaoFactory](https://github.com/openlawteam/tribute-contracts/blob/master/docs/core/DaoFactory.md): creates, initializes, and adds adapter configurations to the new DAO, and uses the CloneFactory to reduce the DAO creation transaction costs.
- DaoConstants: defines all the constants used by the DAO contracts, and implements some helper functions to manage the Access Flags.

#### Access Control Layer

The Access Control Layer (ACL) is implemented using Access Flags to indicate which permissions an adapter must have in order to access and modify the DAO state. The are 3 main categories of [Access Flags](https://github.com/openlawteam/tribute-contracts/blob/master/docs/core/DaoRegistry.md#access-flags):

- MemberFlag: `EXISTS`.
- ProposalFlag: `EXISTS`, `SPONSORED`, `PROCESSED`.
- AclFlag: `REPLACE_ADAPTER`, `SUBMIT_PROPOSAL`, `UPDATE_DELEGATE_KEY`, `SET_CONFIGURATION`, `ADD_EXTENSION`, `REMOVE_EXTENSION`, `NEW_MEMBER`.

The Access Flags of each adapter must be provided to the DAOFactory when the `daoFactory.addAdapters` function is called passing the new adapters. These flags will grant the access to the DAORegistry contract, and the same process must be done to grant the access of each Adapter to each Extension (function `daoFactory.configureExtension`).

The Access Flags are defined in the DAORegistry using the modifier `hasAccess`. For example, a function with the modifier `hasAccess(this, AclFlag.REPLACE_ADAPTER)` means the adapter calling this function needs to have the Access Flag `REPLACE_ADAPTER` enabled, otherwise the call will revert. In order to create an Adapter with the proper Access Flags one needs to first map out all the functions that the Adapter will be calling in the DAORegistry and Extensions, and provide these Access Flags using the DAO Factory as described above.

You can find more information about the purpose of each access flag at [DAO Registry - Access Flags](https://github.com/openlawteam/tribute-contracts/blob/master/docs/core/DaoRegistry.md#access-flags).

## Usage

### Environment Variables

Added the following environment variables to your local .env file:

- `DAO_NAME`: The name of the DAO.
- `DAO_OWNER_ADDR`: The DAO Owner ETH Address (0x...) in the target network.
- `ETH_NODE_URL`: The Ethereum Node URL to connect to the Ethereum blockchain, it can be http/ws.
- `TRUFFLE_MNEMONIC`: The truffle mnemonic string containing the 12 keywords.
- `ETHERSCAN_API_KEY`: The Ether Scan API Key to verify the contracts after the deployment.
- `DEBUG_CONTRACT_VERIFICATION`: Debug the Ether Scan contract verification calls (`true`|`false`).
- `COUPON_CREATOR_ADDR`: The public eth (0x...) address of the creator of the onboarding coupons.
- `ERC20_TOKEN_NAME`: The ERC20 Token Name used by the ERC20 Token Extension.
- `ERC20_TOKEN_SYMBOL`: Token Symbol used by the ERC20 Token Extension.
- `ERC20_TOKEN_DECIMALS`: The ERC20 Token Decimals to display in MetaMask.

Checkout the [sample .env file](https://github.com/openlawteam/tribute-contracts/.sample.env).

**Required env vars per deployment type**

- Ganache deployment: `DAO_NAME`, `ERC20_TOKEN_NAME`, `ERC20_TOKEN_SYMBOL`, `ERC20_TOKEN_DECIMALS`, `COUPON_CREATOR_ADDR`.

- Rinkeby deployment: `DAO_NAME`, `DAO_OWNER_ADDR`, `ERC20_TOKEN_NAME`, `ERC20_TOKEN_SYMBOL`, `ERC20_TOKEN_DECIMALS`, `COUPON_CREATOR_ADDR`, `ETH_NODE_URL`.

- Test deployment: `DAO_NAME`, `ERC20_TOKEN_NAME`, `ERC20_TOKEN_SYMBOL`, `ERC20_TOKEN_DECIMALS`.

### Run Tests

This project uses truffle. To run the tests, simply run:

> npm run test

### Code Format

To fix the Solidity code and documentation with the linter hints, simply run:

> npm run lint:fix

### Running with Ganache

...

> npm run ganache

### Deploying the contracts

> npm run deploy:ganache

or

> npm run deploy:rinkeby

### Verifying Contracts

To verify the contract using Etherscan you need to create an API key and update the .env file with your API key.
Then execute the following script:

> npm run verify rinkeby

## Contribute

Tribute exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## License

Tribute is released under the [MIT License](LICENSE).
