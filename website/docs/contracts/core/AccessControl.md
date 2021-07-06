---
id: access-control
title: Access Control
---

#### Access Control Layer

The Access Control Layer (ACL) is implemented using Access Flags to indicate which permissions an adapter must have in order to access and modify the DAO state. The are 3 main categories of [Access Flags](https://github.com/openlawteam/tribute-contracts/blob/master/docs/core/DaoRegistry.md#access-flags):

- MemberFlag: `EXISTS`.
- ProposalFlag: `EXISTS`, `SPONSORED`, `PROCESSED`.
- AclFlag: `REPLACE_ADAPTER`, `SUBMIT_PROPOSAL`, `UPDATE_DELEGATE_KEY`, `SET_CONFIGURATION`, `ADD_EXTENSION`, `REMOVE_EXTENSION`, `NEW_MEMBER`.

The Access Flags of each adapter must be provided to the DAOFactory when the `daoFactory.addAdapters` function is called passing the new adapters. These flags will grant the access to the DAORegistry contract, and the same process must be done to grant the access of each Adapter to each Extension (function `daoFactory.configureExtension`).

The Access Flags are defined in the DAORegistry using the modifier `hasAccess`. For example, a function with the modifier `hasAccess(this, AclFlag.REPLACE_ADAPTER)` means the adapter calling this function needs to have the Access Flag `REPLACE_ADAPTER` enabled, otherwise the call will revert. In order to create an Adapter with the proper Access Flags one needs to first map out all the functions that the Adapter will be calling in the DAORegistry and Extensions, and provide these Access Flags using the DAO Factory as described above.

You can find more information about the purpose of each access flag at [DAO Registry - Access Flags](https://github.com/openlawteam/tribute-contracts/blob/master/docs/core/DaoRegistry.md#access-flags).
