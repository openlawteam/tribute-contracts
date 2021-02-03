[![codecov](https://codecov.io/gh/openlawteam/laoland/branch/master/graph/badge.svg?token=XZRL9RUYZE)](https://codecov.io/gh/openlawteam/laoland/)

## Overview

At the LAO, we realized that even though Moloch is very useful and powerful, it has a lot of features that we don't necessarily need. Also, there are a few features that are missing and are hard to change.

This is why we would like to introduce a more modular approach to Moloch architecture, which will give us:

- Simpler code - each part would do something more specific, this means easier to understand.
- Adaptability - we will be able to adapt each part of the DAO to the needs of the ones using it without the need to audit the entire code base every time.
- Upgradability - it should be easier to upgrade parts once the need evolves. The best example we have in mind is voting. Maybe the way of voting evolves with time and it is good to be able to upgrade that economic. We can imagine some modules being used by multiple DAOs without the need to be redeployed.

Inspired by the hexagonal architecture pattern we believe that we can have additional layers of security, and break the main contract into smaller contracts. With that, we create loosely coupled modules/contracts, easier to audit, and can be easily connected to the DAO.

### Architecture

![laoland_hexagon_architecture](https://user-images.githubusercontent.com/708579/106510703-096a9880-64ae-11eb-8e48-3745e36a7b80.png)

The main idea is to limit the access to the contracts according to each layer. External World (e.g: RPC clients) can access the core contracts only via Adapters, never directly. Every adapter contains all the necessary logic and data to update/change the state of the DAO in the DAORegistry Contract. A Core Contract tracks all the state changes of the DAO, and an Adapter tracks only the state changes in its own context. Extensions enhance the DAO capabilities, and simplify the Core Contract code. The information always flows from the External World to the Core Contracts, never the other way around. If a Core Contract needs external info, it must be provided by an Adapter and/or an Extension instead of calling External World directly.

The are five main components in the Laoland architecture:

#### External World

The external world is essentially anything that interacts with the DAO. An example of that are RPC clients that are responsible for calling the Adapters public/external functions to pull/push data to the DAO Core Contracts and its Extensions.

#### Adapters

Adapters are well defined, tested and extensible smart contracts that are created with a unique purpose. One Adapter is responsible for performing one or a set of tasks in a given context. With this approach we can develop adapters targeting specific use-cases, and update the DAO configurations to use these new adapters.

When a new adapter is created, one needs to submit a Managing proposal to add the new adapter to the DAO. Once the proposal passes, the new adapter is added and becomes available for use.

Each adapter needs to be configured with the [Access Flags](#access-control-layer) in order to access the [Core Contracts](#core-contracts), and/or [Extensions](#extensions). Otherwise the Adapter will not able to pull/push information to/from the DAO.

Adapters implemented in the Laoland project:

- [Configuration](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Configuration.md): manages storing and retrieving per-DAO settings required by shared adapters.
- [Financing](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Financing.md): allows individuals and/or organizations to request funds to finance their projects, and the members of the DAO have the power to vote and decide which projects should be funded.
- [GuildKick](https://github.com/openlawteam/laoland/blob/master/docs/adapters/GuildKick.md): gives the members the freedom to choose which individuals or organizations should really be part of the DAO.
- [Managing](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Managing.md): enhances the DAO capabilities by adding/updating the DAO Adapters through a voting process.
- [OffchainVoting](https://github.com/openlawteam/laoland/blob/master/docs/adapters/OffchainVoting.md): adds the offchain voting governance process to the DAO.
- [Onboarding](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Onboarding.md): triggers the process of minting internal tokens in exchange of a specific token at a fixed price.
- [Ragequit](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Ragequit.md): gives the members the freedom to choose when it is the best time to exit the DAO for any given reason.
- [Voting](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Voting.md): adds the simple on chain voting governance process to the DAO.
- [Withdraw](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Withdraw.md): allows the members to withdraw their funds from the DAO bank.

Considerations:

- Adapters do not keep track of the state of the DAO. They might use storage to control its own state, but ideally any DAO state change must be propagated to the DAORegistry Core Contract.
- Adapters just execute smart contract logic that changes the state of the DAO by calling the DAORegistry. They also can compose complex calls that interact with External World, other Adapters or even Extensions, to pull/push additional information.
- The adapter must follow the rules defined by the [Template Adapter](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Template.md).
- If you want to contribute and create an Adapter, please checkout this: [How to create an Adapter](https://github.com/openlawteam/laoland/blob/master/docs/adapters/HowToCreate.md).

#### Extensions

Extensions are conceived to isolate the complexity of state changes from the DAORegistry contract, and to simplify the core logic. Essentially an Extension is similar to an Adapter, but the main difference is that it is used by several adapters and by the DAORegistry - which end up enhancing the DAO capabilities and the state management without cluttering the DAO core contract.

- [Bank](https://github.com/openlawteam/laoland/blob/master/docs/extensions/Bank.md): adds the banking capabilities to the DAO, and keeps track of the DAO accounts and internal token balances.

#### Core Contracts

A core contract is a contract that composes the DAO itself, and directly changes the DAO state without the need of going through an Adapter. Ideally a core contract shall never pull information directly from the external world. For that we use Adapters and Extensions, and the natural information flow is always from the external world to the core contracts.

- [DaoRegistry](https://github.com/openlawteam/laoland/blob/master/docs/core/DaoRegistry.md): tracks the state changes of the DAO, only adapters with proper [Access Flags](#access-control-layer) can alter the DAO state.
- CloneFactory: creates a clone of the DAO based on its address.
- DaoFactory: creates, initializes, and adds adapter configurations to the new DAO, and uses the CloneFactory to reduce the DAO creation transaction costs.
- DaoConstants: defines all the constants used by the DAO contracts, and implements some helper functions to manage the Access Flags.

#### Access Control Layer

The Access Control Layer (ACL) is implemented using Access Flags to indicate which permissions an adapter must have in order to access and modify the DAO state. The are 3 main categories of Access Flags:

- MemberFlag: `EXISTS`, `JAILED`.
- ProposalFlag: `EXISTS`, `SPONSORED`, `PROCESSED`.
- AclFlag: `ADD_ADAPTER`, `REMOVE_ADAPTER`, `JAIL_MEMBER`, `UNJAIL_MEMBER`, `SUBMIT_PROPOSAL`, `SPONSOR_PROPOSAL`, `PROCESS_PROPOSAL`, `UPDATE_DELEGATE_KEY`, `SET_CONFIGURATION`, `ADD_EXTENSION`, `REMOVE_EXTENSION`, `NEW_MEMBER`.

The Access Flags of each adapter must be provided to the DAOFactory when the `daoFactory.addAdapters` function is called passing the new adapters. These flags will grant the access to the DAORegistry contract, and the same process must be done to grant the access of each Adapter to each Extension (function `daoFactory.configureExtension`).

The Access Flags are defined in the DAORegistry using the modifier `hasAccess`. For example, a function with the modifier `hasAccess(this, AclFlag.JAIL_MEMBER)` means the adapter calling this function needs to have the Access Flag `JAIL_MEMBER` enabled, otherwise the call will revert. In order to create an Adapter with the proper Access Flags one needs to first map out all the functions that the Adapter will be calling in the DAORegistry and Extensions, and provide these Access Flags using the DAO Factory as described above.

## Usage

### Run Tests

This project uses truffle. To run the tests, simply run:

> npm run test

### Code Format

To fix the Solidity code with the linter hints, simply run:

> npm run lint:fix

## Contribute

Laoland exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## License

Laoland is released under the [MIT License](LICENSE).
