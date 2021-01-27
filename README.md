
[![codecov](https://codecov.io/gh/openlawteam/laoland/branch/master/graph/badge.svg?token=XZRL9RUYZE)](https://codecov.io/gh/openlawteam/laoland/)

# Bonding Curve Adapter Sandbox

Effectively pricing entry into a DAO is important to protect the value of the membership and collected assets. In Moloch DAO, social consensus determines how shares are priced in each member proposal (to join or otherwise increase shares), and members rationally only accept attached tribute that matches their expectations and risk appetite. However, this entails a degree of attention in the voting queue -- as a more automated alternative, an adapter contract can set a predictable “curve” price to mint membership shares determined by the assets held or total DAO shares minted.
 
## Overview

At the LAO, we realized that even though Moloch is very useful and powerful, it has a lot of features that we don't necessarily need. Also, there are a few features that are missing and are hard to change.

This is why we would like to introduce a more modular approach to Moloch architecture, which will give us:

- Simpler code, each part would do something more specific, this means easier to understand
- Adaptable, we will be able to adapt each part of the DAO to the needs of the ones using it without the need to audit the entire code bade every time
- Upgradable, it should be easier to upgrade parts once the need evolves. The best example we have in mind is voting, maybe the way of voting evolve with time and it is good to be able to upgrade that economic, we can imagine some modules being used by multiple DAOs without the need to be redeployed

Inspired by the hexagonal architecture pattern we believe that we can have additional layers of security and break the main contract into smaller contracts. With that, we create loosely coupled modules/contracts, easier to audit, and can be easily connected to the DAO.

The architecture is composed by 3 main types of components:

**Core Module**
- The Core module (Registry) keeps track of the state changes of the DAO.
- The Registry tracks all the registered Adapters, Proposals, and Bank Accounts of the DAO.
- Only Adapters are allowed to call functions from the Registry Module.
- The Registry does not communicate with External World directly, it needs to go through an Adapter to pull or push information.
- The Registry uses the `onlyAdapter` modifier to functions that change the state of the Registry/DAO, in the future we may want to grant different access types based on the Adapter type. It may expose some **read-only** public functions (`external` or `public`) to facilitate queries.

**Adapters**
- Public/External accessible functions called from External World.
- Adapters do not keep track of the state of the DAO, they might use storage but the ideal is that any DAO relevant state change is propagated to the Registry Core Module.
- Adapters just execute Smart Contract logic that changes the state of the DAO by calling the Registry Core Module, they also can compose complex calls that interact with External World to pull/push additional information.
- Each Adapter is a very specialized Smart Contract designed to do one thing very well.
- Adapters can have public access or access limited to members of the DAO (`onlyMember` modifier).

**External World**
- RPC clients responsible for calling the Adapters public/external functions to interact with the DAO Core Module.

![laoland_architecture](https://user-images.githubusercontent.com/708579/94478554-cddf5b00-01a9-11eb-9e80-cc3c55dea492.png)

The main idea is to limit access to the contracts according to each layer. External World (e.g: RPC clients) can access the core module only and via Adapter, never directly. Every adapter will contain all the necessary logic and data to provide to the Core module during the calls, and Core Module will keep track of the state changes in the DAO. An initial draft of this idea was implemented in the `Financing` Adapter which allows an individual to submit a request for financing/grant. The information always flows from the External World to the Core Module, never the other way around. If a Core Module needs external info, that should be provided via an Adapter instead of calling External World directly.


### Usage

#### Run Tests
This project uses truffle, to run the tests, simply run:
> npm run test

#### Code Coverage
To check the code coverage report, simply run:
> npm run coverage

|Coverage Graph per Contract|
|----------------------|
|[![graph](https://codecov.io/gh/openlawteam/laoland/branch/master/graphs/tree.svg)](undefined)|


#### Code Format
To fix the Solidity code with the linter hints, simply run:
> npm run lint:fix

## Contribute

Laoland exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## License

Laoland is released under the [MIT License](LICENSE).
