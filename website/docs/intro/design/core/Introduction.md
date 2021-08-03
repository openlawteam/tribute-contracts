---
id: introduction
title: Core
---

The core contracts serve as the spine for the TributeDAO framework and act as a DAO registry, creating a digital version of "division of corporations." These contracts compose the DAO itself, and make it cheaper and easier to deploy a DAO. These contracts directly change the DAO state through the interactions with different adapters and/or extensions.

:::important

A core contract never pulls information directly from the external world. For that we use Adapters and Extensions, and the natural information flow is always from the external world to the core contracts.

:::

There are three core contracts as part of the TributeDAO framework, including a:

- **[DaoRegistry](/docs/contracts/core/dao-registry)**: tracks the state changes of the DAO, only adapters with proper \*\*[Access Flags](#access-control-layer) can alter the DAO state.
- **CloneFactory**: creates a clone of the DAO based on its address.
- **[DaoFactory](/docs/contracts/core/dao-factory)**: creates, initializes, and adds adapter configurations to the new DAO, and uses the CloneFactory to reduce the DAO creation transaction costs.
- **DaoConstants**: defines all the constants used by the DAO contracts, and implements some helper functions to manage the Access Flags.

In order to keep the **[DaoRegistry Contract](/docs/contracts/core/dao-registry)** code relatively small, and also easy to extend we have designed the Extension Contracts. The extensions add additional capabilities/features to the DAO without changing its core contracts.
