---
id: introduction
title: Adapters
---

Once a DAO is created using the core contracts, and extensions, it can be extended and modified with different adapters. Adapters make it easy to assemble a DAO like lego blocks, by adding to a DAO narrowly-defined, tested, and extensible smart contracts created for specific purposes. Adapters and extensions make DAOs more modular, upgradeable, and also enable us to work together to build robust DAO tooling. They can be added to a TributeDAO via a DAO vote process, or during the DAO deployment phase.

:::info

Adapters just execute smart contract logic that changes the state of the DAO by calling the **[DAORegistry Core Contract](/docs/contracts/core/dao-registry)**. They also can compose complex calls that interact with External World, other Adapters or even Extensions.

:::

An adapter can be defined as type `Proposal` or `Generic`:

- `Proposal`: updates the DAO state based on a proposal, and the proposal needs to pass, otherwise the DAO state changes are not applied, e.g: [GuildKick.sol](/docs/contracts/adapters/exiting/guild-kick-adapter).
- `Generic`: updates the DAO state without a proposal process, e.g: **[BankAdapter.sol](/docs/contracts/adapters/utils/bank-adapter)**.

:::caution

An Adapter does not keep track of the state of the DAO. It might use its own storage to control state additional state changes, but ideally any DAO state change must be propagated to the **[DAORegistry Core Contract](/docs/contracts/core/dao-registry)**.

:::

## Existing Adapters

TributeDAO Framework provides several types of Adapters that can be used in your DAO. Most of these adapters make it **[feature compatible with Moloch v2](/docs/intro/comparison/moloch)**.

The range of potential adapters will expand over time and likely will include:

- "Streams" to manage a DAO's treasury in a more agile way;
- Alternative voting structures to layer to improve DAO governance, including quadratic voting, one-member-one-vote voting;
- Swaps of one token for another;
- Streaming payments;
- DAO-to-DAO voting;
- Creating a liquidity pool for a DAO's native asset;
- Staking or depositing assets into existing DeFi projects (like Aave, Compound, or Lido).

:::tip

In order to access the DAO core and/or Extensions contracts, the Adapters need special access rights. The access is controlled by different Access Flags during the DAO creation time, or through a proposal process using the **[Managing Adapter](/docs/contracts/adapters/configuration/managing-adapter)**. Checkout the **[Access Control Layer](/docs/intro/design/access-control)** to understand how the ACL works.
:::

### Configuration

Adapters that allow the members, individuals, and the DAO owner to perform any sort of configuration in the DAO. Usually the configurations are parameters that can be used by other Adapters, Extensions, and Core Contract. Examples:

- **[Configuration](/docs/contracts/adapters/configuration/configuration-adapter)**: manages storing and retrieving per-DAO settings required by shared adapters.
- **[Managing](/docs/contracts/adapters/configuration/managing-adapter)**: enhances the DAO capabilities by adding/updating the DAO Adapters through a voting process.

### Distribution

Adapters that allow members to distribute/withdraw funds from the DAO Bank. Examples:

- **[Distribute](/docs/contracts/adapters/distribution/distribute-adapter)**: allows the members to distribute funds to one or all members of the DAO.

### Exiting

Adapters that allow members to exit the DAO individually or collectively kick a bad actor. Examples:

- **[GuildKick](/docs/contracts/adapters/exiting/guild-kick-adapter)**: gives the members the freedom to choose which individuals or organizations should really be part of the DAO.
- **[Ragequit](/docs/contracts/adapters/exiting/rage-quit-adapter)**: gives the members the freedom to choose when it is the best time to exit the DAO for any given reason.

### Funding

Adapters that allow any individuals/members to request funds from the DAO Bank to fund external projects through a proposal process. Examples:

- **[Financing](/docs/contracts/adapters/funding/financing-adapter)**: allows individuals and/or organizations to request funds to finance their projects, and the members of the DAO have the power to vote and decide which projects should be funded.

### Onboarding

Adapters that allow new individuals to join the DAO by providing some sort of tribute. Examples:

- **[ETH/ERC20 Onboarding](/docs/contracts/adapters/onboarding/onboarding-adapter)**: triggers the process of minting internal tokens in exchange of a specific token at a fixed price.
- **[Coupon Onboarding](/docs/contracts/adapters/onboarding/coupon-onboarding-adapter)**: triggers the process of minting internal tokens in exchange of a specific token at a fixed price.
- **[Tribute](/docs/contracts/adapters/onboarding/tribute-adapter)**: allows potential and existing DAO members to contribute any amount of ERC-20 tokens to the DAO in exchange for any amount of DAO internal tokens.
- **[TributeNFT](/docs/contracts/adapters/onboarding/tribute-nft-adapter)**: allows potential DAO members to contribute a registered ERC-721 asset to the DAO in exchange for any amount of DAO units.

### Voting

Adapters that allow different types governance systems within the DAO. Examples:

- **[Batch Voting](/docs/contracts/adapters/voting/batch-voting-adapter)**: adds the simple batching on chain voting governance process to the DAO.
- **[Basic Voting](/docs/contracts/adapters/voting/basic-voting-adapter)**: adds the no quorum, simple majority on chain voting governance process to the DAO.
- **[Offchain Voting](/docs/contracts/adapters/voting/offchain-voting-adapter)**: adds the offchain voting governance process to the DAO to support gasless voting.

### Utils

Adapters that are actually helpers to access the DAO Registry, and/or Extensions. Examples:

- **[Bank](/docs/contracts/adapters/utils/bank-adapter)**: allows the members to withdraw their funds from the DAO bank, and update the token balances.
- **[NFT](/docs/contracts/adapters/utils/nft-adapter)**: allows the individuals to send their NFTs to the DAO NFT Extension.
- **[DAO Registry](/docs/contracts/adapters/utils/dao-registry-adapter)**: allows the members to update their delegated keys in the DAO Registry contract.

## Creating an Adapter

Creating an adapter is straight forward and should save developers engineering time. Checkout the tutorial: **[How to create an Adapter](/docs/tutorial/adapters/creating-an-adapter)**.
