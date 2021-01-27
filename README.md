
[![codecov](https://codecov.io/gh/openlawteam/laoland/branch/master/graph/badge.svg?token=XZRL9RUYZE)](https://codecov.io/gh/openlawteam/laoland/)

## Overview

At the LAO, we realized that even though Moloch is very useful and powerful, it has a lot of features that we don't necessarily need. Also, there are a few features that are missing and are hard to change.

This is why we would like to introduce a more modular approach to Moloch architecture, which will give us:

- Simpler code, each part would do something more specific, this means easier to understand
- Adaptable, we will be able to adapt each part of the DAO to the needs of the ones using it without the need to audit the entire code bade every time
- Upgradable, it should be easier to upgrade parts once the need evolves. The best example we have in mind is voting, maybe the way of voting evolve with time and it is good to be able to upgrade that economic, we can imagine some modules being used by multiple DAOs without the need to be redeployed

Inspired by the hexagonal architecture pattern we believe that we can have additional layers of security and break the main contract into smaller contracts. With that, we create loosely coupled modules/contracts, easier to audit, and can be easily connected to the DAO.

The architecture is composed by 3 main types of components:

**Core Module**
- The Core module (Registry) keeps track of the state changes of the DAO.
- The Registry tracks all the registered Adapters, Proposals, and Bank Accounts of the DAO.
- Only Adapters are allowed to call functions from the Registry Module.
- The Registry does not communicate with External World directly, it needs to go through an Adapter to pull or push information.
- The Registry uses the `onlyAdapter` modifier to functions that change the state of the Registry/DAO, in the future we may want to grant different access types based on the Adapter type. It may expose some **read-only** public functions (`external` or `public`) to facilitate queries.

**Adapters**
- Public/External accessible functions called from External World.
- Adapters do not keep track of the state of the DAO, they might use storage but the ideal is that any DAO relevant state change is propagated to the Registry Core Module.
- Adapters just execute Smart Contract logic that changes the state of the DAO by calling the Registry Core Module, they also can compose complex calls that interact with External World to pull/push additional information.
- Each Adapter is a very specialized Smart Contract designed to do one thing very well.
- Adapters can have public access or access limited to members of the DAO (`onlyMember` modifier).

**External World**
- RPC clients responsible for calling the Adapters public/external functions to interact with the DAO Core Module.

![laoland_architecture](https://user-images.githubusercontent.com/708579/94478554-cddf5b00-01a9-11eb-9e80-cc3c55dea492.png)

The main idea is to limit access to the contracts according to each layer. External World (e.g: RPC clients) can access the core module only and via Adapter, never directly. Every adapter will contain all the necessary logic and data to provide to the Core module during the calls, and Core Module will keep track of the state changes in the DAO. An initial draft of this idea was implemented in the `Financing` Adapter which allows an individual to submit a request for financing/grant. The information always flows from the External World to the Core Module, never the other way around. If a Core Module needs external info, that should be provided via an Adapter instead of calling External World directly.


### Usage

#### Run Tests
This project uses truffle, to run the tests, simply run:
> npm run test

#### Code Coverage
To check the code coverage report, simply run:
> npm run coverage

|Coverage Graph per Contract|
|----------------------|
|[![graph](https://codecov.io/gh/openlawteam/laoland/branch/master/graphs/tree.svg)](undefined)|


#### Code Format
To fix the Solidity code with the linter hints, simply run:
> npm run lint:fix

## Documentation

### Core 

#### DaoRegistry.sol 

The DaoRegisrty.sol contract tracks the state of the DAO for 1) Adapter access, 2) State of Proposals, 3) Membership status, 4) Bank balances for the DAO and members. 
For an Adapater to be used it must be registered to DaoRegistry.sol. 

`enum DaoState {CREATION, READY}` CREATION  = the DAO has been deployed via `initializeDao`, but is not ready to be used. READY = the function `finalizeDao` has been called by the deployer is now ready to be used.  

**Events**

    Events for Dao Registry - The proposal order follows Moloch v2, in 1) a proposal is submitted, 2) then it sponsored by a member, and 3) after a proposal is voted on, it can finally be processed. 

    `event SubmittedProposal(bytes32 proposalId, uint256 flags);`
    `event SponsoredProposal(bytes32 proposalId, uint256 flags);`
    `event ProcessedProposal(bytes32 proposalId, uint256 flags);`
    
    Events for Adding and Removing Adapters
    `event AdapterAdded(bytes32 adapterId,address adapterAddress,uint256 flags);`
    `event AdapterRemoved(bytes32 adapterId);`

    Events for Members
    `event UpdateDelegateKey(address memberAddress, address newDelegateKey);`

    Events for Bank
    `event MemberJailed(address memberAddr);`
    `event MemberUnjailed(address memberAddr);`
    `event NewBalance(address member, address tokenAddr, uint256 amount);`
    `event Withdraw(address account, address tokenAddr, uint256 amount);`

**Structs**

`struct Proposal` track the state of the proposal: exist, sponsored, processed, canceled. 

`struct Member` track state of a member: exists, jailed. 

`struct Checkpoint` Laoland makes use of the off-chain voting mechanism Snapshot. The `Checkpoint` struct assists with verifying the optimistic voting and proposal mechanisms at various blocktimes. See, https://github.com/snapshot-labs. 

`struct Bank {
      address[] tokens; 
      address[] internalTokens;
      // tokenAddress => availability
      mapping(address => bool) availableTokens;
      mapping(address => bool) availableInternalTokens;
      // tokenAddress => memberAddress => checkpointNum => Checkpoint
      mapping(address => mapping(address => mapping(uint32 => Checkpoint))) checkpoints;
      // tokenAddress => memberAddress => numCheckpoints
      mapping(address => mapping(address => uint32)) numCheckpoints;
  }` 

  Inside the `Bank` struct: 

  - `tokens` tokens sent to the DAO.
  - `internalTokens` are tokens managed by the DAO, similiar to shares in a company, or Shares from Moloch v.2 
 
   -  `availableTokens` and `availableInteralTokens`, are tokens that have been whitelisted for use with the DAO.  A token goes from `tokens` or `internalTokens` to `avaialbleTokens` and `availableInternalTokens` when the function `registerPotentialNewToken` or `registerPotentialNewInternalToken` is called.   
  - `checkpoints` and `numCheckpoints`  for each token in the Bank, we create checkpoints so we can figure out a balance at a certain block number. The balance is managed for the member address (not the delegate key).  The same technnique is to determine whiuch key controls a member at a certain block number (delegate key -> member address snapshot)

`struct AdapterDetails` When an Adapter is added to `DaoRegistry` via the function `addAdapter`, a bytes32 `id` and a uint256 `acl` are parameters assigned to the Adapter by for use in identifying the Adapter. 

**Public Variables**

`members` the map to track all members of the DAO.  
` memberAddressesByDelegatedKey` delegate key => member address mapping.  
`Bank` the state of the DAO Bank.  
`checkpoints`  a map to track memberAddress => checkpointNum => DelegateCheckpoint.  
`numCheckpoints` a map to track memberAddress to numDelegateCheckpoints.  
`DaoState` track whether Dao is in CREATION or READY.  
`proposals` map to track of all proposals submitted. 
`registry` map to track all adapters registered to DAO.  
`inverseRegistry` inverse map to get the adapter id based on its contract address. 
`mainConfiguration` map to track configuration parameters.  
`addressConfiguration` map to track configuration parameters.  

**Functions**
Note: the constructor function is non-existent, because this is a Cloneable contract. See, https://eips.ethereum.org/EIPS/eip-1167 

DEPLOYING.   
`initialize(address creator)` This function initializes the DAO. It initializes the available tokens, checkpoints, and membership of the `creator` with 1 Share.  
`receive` payable function.  
`finalizeDao` sets the state of the Dao to READY.  

CONFIGURING.   
Configure and save the DAO parameters. For example, Onboarding adapter uses `setConfiguration` to 1) save the max number of chunks allowed in the DAO, 2) save the number of shares per chunk and 3) save the chunk size. The stored configs will be read/used by the Adapters/Registry. This means values do not have to be hard coded in the contract, and also be updated. 

`setConfiguration(bytes32 key, uint256 value)`  
`setAddressConfiguration(bytes32 key, address value)`
`getConfiguration(bytes32 key)` 
`getAddressConfiguration(bytes32 key)`


ADDING & REMOVING ADAPTERS.     
`addAdapter(bytes32 adapterId, address adapterAddress, uint256 acl)`
`removeAdapter(bytes32 adapterId)`

### Helpers 
#### FlagHelper.sol
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

#### FairShareHelper.sol
  a library with one function `calc(balance, shares, _totalShares)` to calculate the fair share amount of tokens based the total shares and current balance.\
  
### Guards 

#### AdapterGuard.sol
 `onlyAdapter(DaoRegistry dao)` a modifier to ensure that only adapters registered to the DAO can execute the function call.   

 `hasAccess(DaoRegistry dao, FlagHelper.Flag flag)` a modifier to monitor the state of whether an adapter in the DAO can access one of the core functions in `DaoRegistry.sol`.  

 #### MemberGuard.sol
 `onlyMember(DaoRegistry dao)` Only members of the DAO are allowed to execute the function call.  

### Adapters 

## Contribute

Laoland exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## License

Laoland is released under the [MIT License](LICENSE).
