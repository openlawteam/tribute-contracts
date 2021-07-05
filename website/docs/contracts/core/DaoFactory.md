---
id: dao-factory
title: Factory
---

The DaoFactory uses the CloneFactory to let you create a cost effective DaoRegistry and initialize and configure it properly.
It also serves as a registry of created DAOs to help others find a DAO by name.

## Structs

### Adapter

Struct defined to handle the addition and configuration of new adapters using the functions **[addAdapters](#addadapters)**, **[updateAdapter](#updateadapter)**, and **[configureExtension](#configureextension)**.

## Storage

### public daos

Maps the DAO address to a given sha3(daoName).

### public addresses

Maps the sha3(daoName) of a DAO to an address.

### public identityAddress

The address of the identityDao **address ** that is being used to clone the DAO.

## Functions

### createDao

Creates and initializes a new DaoRegistry with the DAO creator and the transaction sender. Enters the new DaoRegistry in the DaoFactory state. The daoName must not be in use.

### getDaoAddress

Returns the DAO address based on its name.

### addAdapters

Adds adapters and sets their ACL for DaoRegistry functions. A new DAO is instantiated with only the Core Modules enabled, to reduce the call cost. This call must be made to add adapters. The message sender must be an active member of the DAO. The DAO must be in `CREATION` state.

### configureExtension

Configures extension to set the ACL for each adapter that needs to access the extension. The message sender must be an active member of the DAO. The DAO must be in `CREATION` state.

### updateAdapter

Removes an adapter with a given ID from a DAO, and adds a new one of the same ID. The message sender must be an active member of the DAO. The DAO must be in `CREATION` state.

## Events

### DAOCreated

- `event DAOCreated(address _address, string _name);`
