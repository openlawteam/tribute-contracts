## Overview

At the LAO, we realized that even though Moloch is very useful and powerful, it has a lot of features that we don't necessarily need. Also, there are a few features that are missing and are hard to change.

This is why we would like to introduce a more modular approach to Moloch architecture, which will give us:

- Simpler code, each part would do something more specific, this means easier to understand
- Adaptable, we will be able to adapt each part of the DAO to the needs of the ones using it without the need to audit the entire code bade every time
- Upgradable, it should be easier to upgrade parts once the need evolves. The best example we have in mind is voting, maybe the way of voting evolve with time and it is good to be able to upgrade that economic, we can imagine some modules being used by multiple DAOs without the need to be redeployed

This is the first draft of v3 architecture which opens rooms for discussion and design decisions.

Inspired by the hexagonal architecture pattern we believe that we can have additional layers of security and break the main contract into smaller contracts. With that, we create loosely coupled modules/contracts, easier to audit, and can be easily connected to the DAO.

The architecture is composed by 3 main types of components:

**Core Modules**
- Core modules keep track of the state changes of the DAO
- Each Core Module is defined via Interface, implemented, and registered into the DAO registry module when the DAO is created
- The core module named Registry keeps track of all registered core modules, so they can be verified during the call executions
- Only Adapters or other Core Modules are allowed to call a Core Module function
- Core modules do not communicate with External World directly, they need to go through an Adapter
- Each core module is a Smart Contract with the `onlyAdapter` and/or `onlyModule` modifiers applied to its functions, it shall not expose its functions in a public way (`external` or `public` modifier should not be added to core module functions, except for the read-only functions)

**Adapters**
- Public/External accessible functions called from External World
- Adapters do not keep track of the state of the DAO, they might use storage but the ideal is that any DAO relevant state change is propagated to the Core Modules 
- Adapters just execute Smart Contract logic that changes the state of the DAO by calling the Core Modules, they also can compose complex calls that interact with External World to pull/push additional data 
- Each Adapter is a very specialized Smart Contract designed to do one thing very well
- Adapters can have public access or access limited to members of the DAO (onlyMembers modifier)

**External World**
- RPC clients responsible for calling the Adapters public/external functions to interact with the DAO Core Modules

![moloch_v3_architecture](https://user-images.githubusercontent.com/708579/92758048-b8be9b80-f364-11ea-9c42-ac8b75cf26c4.png)

The main idea is to limit access to the contracts according to each layer. External World (e.g: RPC clients) can access core modules only via Adapters, never directly. Every adapter will contain all the necessary logic and data to provide to the Core modules during the calls, and Core Modules will keep track of the state changes in the DAO. An initial draft of this idea was implemented in the `Financing` Adapter which allows an individual to submit a request for financing/grant. The information always flows from External World to the Core Modules, never the other way around. If a Core Module needs external info, that should be provided via an Output Adapter instead of calling External World directly.


### Usage

#### Run Tests
This project uses truffle, to run the tests, simply run `truffle test`

## Contribute

Moloch exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## License

Moloch is released under the [MIT License](LICENSE).