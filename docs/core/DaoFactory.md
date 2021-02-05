## DaoFactory description and scope

The DaoFactory is using CloneFactory to let you create a cost effective DaoRegistry and initialize it properly.
It also serves as a registry of created DAO to help others find it by name.

## Adapter workflow

An overview of the entire process executed by Adapter functions, the main interactions and routines covered/executed.

## Adapter state

The state consists of 2 mapping to get the sha3(name) of a dao given an address and the address given the sha3(name)

**mapping(address => bytes32) public daos**
**mapping(bytes32 => address) public addresses**

We also have the address of the identityDao **address public identityAddress** that is being used to clone the Dao.

## Functions description and assumptions / checks

### function createDao(string calldata daoName)

It clone the DaoFactory and initializes it with the sender.
It then registeres it in the registry in the factory.

It fails if the name is already taken

### function getDaoAddress(string calldata daoName) returns (address)

Returns the DAO address based on its name

    /**
     * @dev A new DAO is instantiated with only the Core Modules enabled, to reduce the call cost.
     *       Another call must be made to enable the default Adapters, see registerDefaultAdapters.
     * @param dao DaoRegistry to have adapters added to
     * @param adapters Adapter structs to be added to the dao
     */

### function addAdapters(DaoRegistry dao, Adapter[] calldata adapters)

Add adapters and set their ACL for DaoRegistry functions

### function configureExtension(DaoRegistry dao, address extension, Adapter[] calldata adapters)

Helper function to configure extensions.

It sets the ACL for each adapter that needs to access this extension

### function updateAdapter(DaoRegistry dao, Adapter calldata adapter) external {

remove and add the adapter again with the setup passed in the Adapter struct

## Events

### event DAOCreated(address \_address, string \_name);

Emitted when a new DAO has been created
