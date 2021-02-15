## AdapterGuard.sol

`onlyAdapter(DaoRegistry dao)` a modifier to ensure that only adapters registered to the DAO can execute the function call.

`hasAccess(DaoRegistry dao, FlagHelper.Flag flag)` a modifier to monitor the state of whether an adapter in the DAO can access one of the core functions in `DaoRegistry.sol`.
