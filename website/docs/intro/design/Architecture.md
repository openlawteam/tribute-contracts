---
id: architecture
title: Architecture
---

Inspired by the **[hexagonal architecture design pattern](<https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)>)** we believe that we can have additional layers of security, and break the main contract into smaller contracts. With that, we created loosely coupled modules/contracts, easier to audit, and can be easily connected to the DAO.

The main design goal is to limit access to the smart contracts according at layer boundaries. The External World (e.g. RPC clients) can access the core contracts only via **[Adapters](/docs/intro/design/adapters/introduction)**, never directly. Every adapter contains all the necessary logic and data to update/change the state of the DAO in the **[DAO Registry Contract](/docs/contracts/core/dao-registry)**. The **[DAO Registry Contract](/docs/contracts/core/dao-registry)** tracks all the state changes of the DAO, and an Adapter tracks only the state changes in its own context. **[Extensions](/docs/intro/design/extensions/introduction)** enhance the DAO capabilities and simplify the core contract code.

A key concept here is to ensure the information always flows from the External World to the Core Contracts, never the other way around. If a Core Contract needs external info, it must be provided by an Adapter and/or an Extension instead of calling External World directly. In addition to that, only Adapters and/or Extensions that have access rights can push/pull information to/from the **[DAO Registry Contract](/docs/contracts/core/dao-registry)**.

![tributedao_hexagon_architecture](/img/tribute-framework-architecture.png)
