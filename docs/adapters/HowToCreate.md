# How to create an Adapter

- [Introduction](#introduction)
- [Defining the Interface](#defining-the-interface)
- [Pick the right Adapter type](#pick-the-right-adapter-type)
- [Identifying the Modifiers](#identifying-the-modifiers)
- [Map out the proper Access Flags](#map-out-the-proper-access-flags)
- [Set up the DAO custom configurations](#set-up-the-dao-custom-configurations)
- [Be careful with the Storage](#be-careful-with-the-storage)
- [Conventions & Implementation](#conventions-&-implementation)
- [Testing the new Adapter](#testing-the-new-adapter)
- [Adding documentation](#adding-documentation)

### Introduction

Adapters are well defined, tested and extensible smart contracts that are created with a unique purpose. One Adapter is responsible for performing one or a set of tasks in a given context. With this approach we can develop adapters targeting specific use-cases, and update the DAO configurations to use these new adapters.

When a new adapter is created, one needs to submit a Managing proposal to add the new adapter to the DAO. Once the proposal passes, the new adapter is added and becomes available for use.

Each adapter needs to be configured with the [Access Flags](#access-control-layer) in order to access the [Core Contracts](#core-contracts), and/or [Extensions](#extensions). Otherwise the Adapter will not able to pull/push information to/from the DAO.

### Defining the Interface

The adapter must implement one or more of the available interfaces at `contracts/adapters/interfaces`. If none of the interfaces satisfies the use-case of your adapter, feel free to suggest a new interface.

### Pick the right Adapter type

There are two main types of adapters that serve for different purposes:

- Proposal: the type of adapter that writes/reads to/from the DAO state based on a proposal.
- Generic: the type of adapter that writes/reads to/from the DAO state without any proposal data.

### Identifying the Modifiers

We have adapters that are accessible only to members/advisors of the DAO (e.g: `Ragequit.sol`), and adapters that are open to any individual or organization, e.g: `Financing.sol`.

While creating your adapter try to map out which sort of users you want to grant access to, remember that the Adapter are the only way we have to alter the DAO state.

TODO: add the link to the Guards.sol docs that Michael has created.

### Map out the proper Access Flags

Another important point is to identify which sort of permissions your adapter needs in order to write/read data to/from the DAO. If your adapter requires an Extension, you will also need to provide the correct Access Flags to access that extension.

TODO: add link to the Extensions, Access Flags and Access Control Layer.

### Set up the DAO custom configurations

Some adapters might need additional configurations to make decisions on the fly, these configurations can and should be set per DAO, in order to do that you need to identify what sort of parameters that you want to keep customizable and set up them through the `Configuration.sol` Adapter.

TODO: add link to the Configuration docs.

### Be careful with the Storage

The key advantage of the adapter is to make them very small and suitable to a very specific use-case, with that in mind try to not use the storage that much. We prefer efficient and cheap adapters that can be easily deployable and maintable. The less state and operations it does, the better it is.

### Conventions & Implementation

- Your adapter should not accept any funds. So it is a good practice to always revert the receive call.

```solidity
receive() external payable {
  revert("fallback revert");
}

```

### Testing the new Adapter

- DAO Constants
- DAO Factory.js

### Adding documentation

Each adapter must provide its own documentation describing what is the use-case it solves, what are the functions and interactions it contains. There is a template that you can use to create the docs for your new adapter, check out the [Template.md](#)

TODO: add link to Template.md
