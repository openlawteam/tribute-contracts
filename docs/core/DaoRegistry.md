## DaoRegistry.sol 

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