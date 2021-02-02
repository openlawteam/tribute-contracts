[![codecov](https://codecov.io/gh/openlawteam/laoland/branch/master/graph/badge.svg?token=XZRL9RUYZE)](https://codecov.io/gh/openlawteam/laoland/)

## Overview

At the LAO, we realized that even though Moloch is very useful and powerful, it has a lot of features that we don't necessarily need. Also, there are a few features that are missing and are hard to change.

This is why we would like to introduce a more modular approach to Moloch architecture, which will give us:

- Simpler code, each part would do something more specific, this means easier to understand.
- Adaptable, we will be able to adapt each part of the DAO to the needs of the ones using it without the need to audit the entire code base every time.
- Upgradable, it should be easier to upgrade parts once the need evolves. The best example we have in mind is voting, maybe the way of voting evolve with time and it is good to be able to upgrade that economic. We can imagine some modules being used by multiple DAOs without the need to be redeployed.

Inspired by the hexagonal architecture pattern we believe that we can have additional layers of security, and break the main contract into smaller contracts. With that, we create loosely coupled modules/contracts, easier to audit, and can be easily connected to the DAO.

The architecture is composed by 4 main types of components:

**External World**

The external world is essentially anything that interacts with the DAO. An example of that are RPC clients that are responsible for calling the Adapters public/external functions to pull/push data to the DAO Core Contracts and its Extensions.

**Adapters**

Adapters are well defined, tested and extensible smart contracts that are created with a unique purpose. One Adapter is responsible for performing one or a set of tasks in a given context. With this approach we can developer adapters targeting specific use-cases and update the DAO configurations to use these new adapters.

When a new adapter is created, one needs to submit a Managing proposal to add the new adapter to the DAO. Once the proposal pass, the new adapter is added, and becomes available for use.

Adapters implemented in the LAOLand project:

- [Configuration](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Configuration.md): manages storing and retrieving per-DAO settings required by shared adapters.
- [Financing](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Financing.md):
- [GuildKick](https://github.com/openlawteam/laoland/blob/master/docs/adapters/GuildKick.md):
- [Managing](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Managing.md):
- [OffchainVoting](https://github.com/openlawteam/laoland/blob/master/docs/adapters/OffchainVoting.md):
- [Onboarding](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Onboarding.md):
- [Ragequit](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Ragequit.md):
- [Voting](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Voting.md):
- [Withdraw](https://github.com/openlawteam/laoland/blob/master/docs/adapters/Withdraw.md):

Conventions:

- Adapters do not keep track of the state of the DAO, they might use storage to control its own state, but the ideal is that any DAO relevant state change is propagated to the DAORegistry Core Contract.
- Adapters just execute Smart Contract logic that changes the state of the DAO by calling the DAORegistry, they also can compose complex calls that interact with External World to pull/push additional information.
- Each Adapter is a very specialized Smart Contract designed to do one thing very well.
- Adapters can have public access or access limited to members of the DAO (`onlyMember` modifier).
- The adapter must follow the rules defined by the [Template Adapter](#) TODO

**Extensions**
In order to isolate complex state changes from the DAO contract code to simplify the logic, we created the concept of Extensions. As things evolve we can implement different flavors of extensions, at the moment we have only the Bank Extension available:

- Bank: enhances the DAO state with banking capabilities, keeps track of the DAO and members accounts and internal balances.

- Only Adapters are allowed to call functions from the Registry Module.
- The Registry does not communicate with External World directly, it needs to go through an Adapter to pull or push information.
- The Registry uses the `onlyAdapter` modifier to functions that change the state of the Registry/DAO, in the future we may want to grant different access types based on the Adapter type. It may expose some **read-only** public functions (`external` or `public`) to facilitate queries.

**Core Contracts**

A core contract is a contract that composes the DAO itself, and directly changes the DAO state without the need to go through an Adapter.
Ideally a core contract should never pull information from the external world

- DaoRegistry:
  - tracks the state changes of the DAO.
- CloneFactory:
  - creates a clone of the DAO based on its address.
- DaoFactory:
  - creates, initializes, and add adapters configurations to a new DAO. The DAO is created using CloneFactory to reduce the transaction costs.
- DaoConstants:
  - defines all the constants used by the DAO contracts, and implements some helper functions to manage the access flags.

![laoland_hexagon_architecture](https://user-images.githubusercontent.com/708579/106510703-096a9880-64ae-11eb-8e48-3745e36a7b80.png)

The main idea is to limit access to the contracts according to each layer. External World (e.g: RPC clients) can access the core module only and via Adapter, never directly. Every adapter will contain all the necessary logic and data to provide to the Core module during the calls, and Core Module will keep track of the state changes in the DAO. An initial draft of this idea was implemented in the `Financing` Adapter which allows an individual to submit a request for financing/grant. The information always flows from the External World to the Core Module, never the other way around. If a Core Module needs external info, that should be provided via an Adapter instead of calling External World directly.

### Usage

#### Run Tests

This project uses truffle, to run the tests, simply run:

> npm run test

#### Code Coverage

To check the code coverage report, simply run:

> npm run coverage

| Coverage Graph per Contract                                                                    |
| ---------------------------------------------------------------------------------------------- |
| [![graph](https://codecov.io/gh/openlawteam/laoland/branch/master/graphs/tree.svg)](undefined) |

#### Code Format

To fix the Solidity code with the linter hints, simply run:

> npm run lint:fix

## Contribute

Laoland exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## License

Laoland is released under the [MIT License](LICENSE).
