## Overview

At the LAO, we realized that even though Moloch is very useful and powerful, it has a lot of features that we don't necessarily need. Also, there are a few features that are missing and are hard to change.

This is why we would like to introduce a more modular approach to Moloch architecture, which will give us:

- Simpler code, each part would do something more specific, this means easier to understand
- Adaptable, we will be able to adapt each part of the DAO to the needs of the ones using it without the need to audit the entire code bade every time
- Upgradable, it should be easier to upgrade parts once the need evolves. The best example we have in mind is voting, maybe the way of voting evolve with time and it is good to be able to upgrade that economic, we can imagine some modules being used by multiple DAOs without the need to be redeployed

This is the first draft of v3 architecture which opens rooms for discussion and design decisions.

Inspired by the hexagonal architecture pattern we believe that we can have additional layers of security and break the main contract into smaller contracts. With that, we create loosely coupled modules/contracts, easier to audit, and can be easily connected to the DAO.

![moloch_v3_architecture](https://user-images.githubusercontent.com/708579/92732605-0fb87680-f34d-11ea-810a-7c269e4e9784.png)

The main idea is to limit access to the contracts according to each layer. External World (e.g: RPC clients) can access core modules only via Adapters, never directly. Every adapter will contain all the necessary logic and data to provide to the Core modules during the calls, and Core Modules will keep track of the state changes in the DAO. An initial draft of this idea was implemented in the `Financing` Adapter which allows an individual to submit a request for financing/grant. The information always flows from External World to the Core Modules, never the other way around. If a Core Module needs external info, that should be provided via an Output Adapter instead of calling External World directly.


### Usage

#### Run Tests
This project uses truffle, to run the tests, simply run `truffle test`

## Contribute

Moloch exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## License

Moloch is released under the [MIT License](LICENSE).