## FlagHelper.sol
Flags are bool values to determine the state of a member, proposal, or an adapter. 

  `EXISTS` - true if a member or a proposal exists. \
  `SPONSORED` - true if a submitted proposal has been sponsored by a member.\
  `PROCESSED` - true if a proprosal has been processed by DAO. \
  `JAILED` - true if a member has been jailed by the DAO. A member will then not be able to particpate in DAO. \
  `ADD_ADAPTER` - true if an adapter has been added to the DAO.  \
  `REMOVE_ADAPTER` -  true if an adapter has been removed from the DAO. \
  `JAIL_MEMBER` - true, if a DAO adapter is registered to `DaoRegistry.sol` and can call `jailMember` \
  `UNJAIL_MEMBER` - true, if a DAO adapter is registered to `DaoRegistry.sol` and can call `unjailMember`\
  `EXECUTE`  -  true if a DAO adapter hasAccess to an arbitrary function call, see `execute` in `DaoRegistry.sol`.  \
  `SUBMIT_PROPOSAL` -  true if a proposal has been been submitted.\   
  `SPONSOR_PROPOSAL` - true, if a DAO adapter is registered to the DAO and can call `sponsorProposal` function.\ 
  `PROCESS_PROPOSAL` -  true if a proposal has been processed.\
   `UPDATE_DELEGATE_KEY` - true, if a member has delegated their voting rights to another ETH address.  \
  `REGISTER_NEW_TOKEN` - true, if a DAO adapter is registered to `DaoRegistry.sol` and can call `registerPotentialNewToken`.  \
  `REGISTER_NEW_INTERNAL_TOKEN` - true, if a DAO adapter is registered `DaoRegistry.sol` and can call `registerPotentialNewInternalToken`. \
  `ADD_TO_BALANCE` -  true, if a DAO adapter is registered to `DaoRegistry.sol`and can call `addToBalance`. \
  `SUB_FROM_BALANCE` - true, if a DAO adapter is registered to `DaoRegistry.sol` and can call `subtractFromBalance`. \
  `INTERNAL_TRANSFER` - true, if a DAO adapter is registered to `DaoRegistry.sol` and can call `internalTransfer`. \ 
  `SET_CONFIGURATION` - true, if a key/value has been setup to `DaoRegistry.sol`. \
  `WITHDRAW` - true, if a DAO adapter is registered to `DaoRegistry.sol` and can call `withdraw`.\
