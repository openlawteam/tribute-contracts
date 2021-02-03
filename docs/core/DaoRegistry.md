## DaoRegistry.sol 

The DaoRegisrty.sol contract tracks the state of the DAO for 1) Adapter access, 2) State of Proposals, 3) Membership status, 4) Bank balances for the DAO and members. 
For an Adapater to be used it must be registered to DaoRegistry.sol. 

`enum DaoState {CREATION, READY}` CREATION  = the DAO has been deployed via `initializeDao`, but is not ready to be used. READY = the function `finalizeDao` has been called by the deployer is now ready to be used.  Once the DaoState = `READY` then the only way to add additional Adapters is to via the proposal process. 

`enum MemberFlag {EXISTS, JAILED}` = `EXISTS` is true if a member or a proposal exists. `JAILED` is true if a member has been jailed by the DAO. A member will then not be able to particpate in DAO. 

` enum ProposalFlag {EXISTS, SPONSORED, PROCESSED}` = `EXISTS` true if a proposal has been been submitted. `SPONSORED` is true if a Submitted proposal has been Sponsored by an existing Member.

`enum AclFlag {
    ADD_ADAPTER,
    REMOVE_ADAPTER,
    JAIL_MEMBER,
    UNJAIL_MEMBER,
    SUBMIT_PROPOSAL,
    SPONSOR_PROPOSAL,
    PROCESS_PROPOSAL,
    UPDATE_DELEGATE_KEY,
    SET_CONFIGURATION,
    ADD_EXTENSION,
    REMOVE_EXTENSION,
    NEW_MEMBER
}`

  `ADD_ADAPTER` - true if an adapter has been added to the DAO.  
  `REMOVE_ADAPTER` -  true if an adapter has been removed from the DAO. 
  `JAIL_MEMBER` - true, if a DAO adapter is registered to `DaoRegistry.sol` and can call `jailMember`.
  `UNJAIL_MEMBER` - true, if a DAO adapter is registered to `DaoRegistry.sol` and can call `unjailMember
  `SUBMIT_PROPOSAL` -  true, if a DAO adapter is registered to the DAO and can call `submitProposal`.
  `SPONSOR_PROPOSAL` - true, if a DAO adapter is registered to the DAO and can call `sponsorProposal` function.
  `PROCESS_PROPOSAL` true, if a DAO adapter is registered to the DAO and can call `processProposal` function.
   `UPDATE_DELEGATE_KEY` - true, if a member has delegated their voting rights to another ETH address. 
   `SET_CONFIGURATION` - true, if a key/value has been setup to `DaoRegistry.sol`.
   `ADD_EXTENSION` - true, if a DAO adapter is registered to the DAO and can call `addExtension`
   `REMOVE_EXTENSION` - true, if a DAO adapter is registered to the DAO and can call `removeExtension` 
   `NEW_MEMBER` - true, if a DAO adapter is registered to the DAO and can call `potentialNewMember`  


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
    `event MemberJailed(address memberAddr);`
    `event MemberUnjailed(address memberAddr);`

    Configuration Events
    `event ConfigurationUpdated(bytes32 key, uint256 value);`
    `event AddressConfigurationUpdated(bytes32 key, address value);`


**Structs**

`struct Proposal` track the state of the proposal: exist, sponsored, processed, canceled. 

`struct Member` track state of a member: exists, jailed. 

`struct Checkpoint` Laoland makes use of the off-chain voting mechanism Snapshot. The `Checkpoint` struct assists with verifying the optimistic voting and proposal mechanisms at various blocktimes. See, https://github.com/snapshot-labs. 

`struct AdapterEntry` When an Adapter is added to `DaoRegistry` via the function `addAdapter`, a bytes32 `id` and a uint256 `acl` are parameters assigned to the Adapter for use in identifying the Adapter. 

`struct ExtensionEntry` When an Extension is added to `DaoRegistry` via `addExtenstion`  a bytes32 `id` and a uint256 `acl` are parameters assigned to the Extension for use in identifying the Extension. 
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

## Description and scope
The DAO Registry is the identity of the DAO. This is the contract address that is passed to every adapter.

The scope of th registry is to manage the folowing:
- The adapter registry, i.e. which adapter is being used by this DAO and which access it has
- The extension registry, i.e. which extension is part of the DAO and the adapter's access to it
- Memberes registry, whether they exist, their delegate key and their flags

Each non constant function in the DAO has an access control modifier linked to it, to make sure the caller has the right to call it.

## Registry state

### mapping(address => Member) public members;
Mapping of all the members. Member struct contains the flags uint

### address[] private _members
List of all the member addresses. Useful to iterate through members

### mapping(address => address) public memberAddressesByDelegatedKey
mapping of the member address by delegate key (think inverted mapping from members by delegate key)

### mapping(address => mapping(uint32 => DelegateCheckpoint)) checkpoints
Delegate key checkpoints. This is useful to know what the delegate key is at a certain point in time
    
### mapping(address => uint32) numCheckpoints
Checkpoint lengths per member address

### DaoState public state
Dao state. This is used to know if the DAO is currently being set up or if it is already running. Useful to configure it.

### mapping(bytes32 => Proposal) public proposals
Mapping of all the proposals for the DAO. Each proposal has an adapterAddress (which adapter created it) and flags to define its state.

### mapping(bytes32 => address) public adapters
Mapping of all the adatpers. bytes32 is the keccak256 of their name and address

### mapping(address => AdapterEntry) public inverseAdapters;
Mapping of adapter details. For each address, we can get its id (keccak256(name)) and its acl (access control, which function in the DAO it can access to)

### mapping(bytes32 => address) public extensions;
Mapping of each extension. Like for adapters, the key here is keccak256(name) (for ex: keccak256("bank"))

### mapping(address => ExtensionEntry) public inverseExtensions;
Mapping of extension details. For each extension address, you get its id (keccak256(name)) and a mapping from adapter address => access control
Access control for each extension is centralized in the DaoRegistry to avoid each extension implementing its own ACL system

### mapping(bytes32 => uint256) public mainConfiguration;
generic configuration mapping from key (keccak256(name)) to any type that can be encoded in 256 bytes (does not need to be uint, could be bytes32 too)

### mapping(bytes32 => address) public addressConfiguration;
Since addresses are not encoded in 256 bytes, we need a separte configuration mapping for this type.

## Functions description, assumptions, checks, dependencies, interactions and access control

### function initialize(address creator) external
Initializes the DAO by creating the first member being the creator passed to the function
        
### function finalizeDao() 
Mark the DAO as finalized and now changes can only be made through adapters

### function setConfiguration(bytes32 key, uint256 value)
Set a generic configuration entry for the DAO
Only adapters with access to this function can do it

### function setAddressConfiguration(bytes32 key, address value)
Set an address configuration entry for the DAO
Only adapters with access to this function can do it

### function potentialNewMember(address memberAddress)
This functions checks if the member exsits in the DAO, if he does not,
it creates the entry for it. 
That means creating an entry in the members mapping, setting the delegate key to be the same address as the new member and add the address to the members list    

### function getConfiguration(bytes32 key) external view returns (uint256) 
Get the generic config entry by passing the keccak256(config name)

### function getAddressConfiguration(bytes32 key)
Get the address config entry by passing the keccak256(config name)

### function addExtension(bytes32 extensionId, IExtension extension, address creator) external
Add a new extension to the registry. It first checks if the extension id is already used and reverts if it is the case.
It then adds the extension to the DAO and initializes it.

### function removeExtension(bytes32 extensionId)
Removes the extension by extension id. It reverts if no extension has been registered for that id (keccak256(name))

### function setAclToExtensionForAdapter(address extensionAddress, address adapterAddress, uint256 acl)
Set the access control for a particular adapter (by address) to a specifc extension
Both adapter and extesnion needs to be already registered to the DAO

### function addAdapter(bytes32 adapterId, address adapterAddress, uint256 acl) 
Adds an adapter to the DAO adapter registry. It also sets the access control.

The adapter can be added only if the adapter id it not already used

### function removeAdapter(bytes32 adapterId)
Remove an adapter from the DAO. Reverts if no adapter has been registered to the adapterId

### function isExtension(address extensionAddr) public view returns (bool) 
Checks whether the address is registered as an extension in the DAO


### function isAdapter(address adapterAddress) public view returns (bool)
Checks whether the address is registered as an adapter in the DAO
    
    /**
     * @notice Checks if an adapter has a given ACL flag
     * @return Whether or not the given adapter has the given flag set
     * @param adapterAddress The address to look up
     * @param flag The ACL flag to check against the given address
     */
### function hasAdapterAccess(address adapterAddress, AclFlag flag)    
Checks whether the adapter has access to a certain flag in the DAO

### function hasAdapterAccessToExtension(address adapterAddress, address extensionAddress, uint8 flag) returns (bool)
Checks whether a certain adapter has access to a certain extension in the DAO

### function getAdapterAddress(bytes32 adapterId) returns (address)
return the adapter address registered for this adapterId and reverts if not found.

The reason we revert here is to avoid the need to check everywhere that the return value is 0x0 when we want to use an adapter

### function getExtensionAddress(bytes32 extensionId) external view returns (address)
return the extension address registered for this extensionId and reverts if not found.

The reason we revert here is to avoid the need to check everywhere that the return value is 0x0 when we want to use an extension

### function jailMember(address memberAddr)
marks the member as jailed. 
reverts if the member does not exist.
The call can be done multiple times but if the member is already jailed, nothing happens
    

### function unjailMember(address memberAddr)
Unmark a member as jailed.
Reverts if the member does not exist, does nothing if the member is not jailed
    
### function submitProposal(bytes32 proposalId)        
Creates a proposal entry for the DAO.
It checks that the proposal was not previouls y created

### function sponsorProposal(bytes32 proposalId, address sponsoringMember)
Marks an existing proposal as sponsored.
Checks that the proposal has not been sponsored yet
Checks that the proposal exists
Checks that the adapter that sponsors the proposal is the one that submitted it
Checks that it has not been processed yet
Checks that the member sponsoring it is an active member

### function processProposal(bytes32 proposalId)
Marks an existing proposal as processed
Checks that the proposal has not been processed already and that it exists

### function _setProposalFlag(bytes32 proposalId, ProposalFlag flag)
internal utility function to set a flag to a proposal.
It checks that the proposal exists and that the flag ahs not been already set
### function isActiveMember(address addr) public view returns (bool)
returns true if the address is the delegate key of an existing member and that the member is not jailed
### function getProposalFlag(bytes32 proposalId, ProposalFlag flag) returns (bool)
Helper function to get the flag value for a proposal
### function getMemberFlag(address memberAddress, MemberFlag flag) returns (bool)
Helper function to get the flag value for a member

### function getNbMember() public view returns (uint256) 
return how many members have been registered in the DAO

### function getMemberAddress(uint256 index) public view returns (address) 
get an address at a certain index in the members list
### function updateDelegateKey(address memberAddr, address newDelegateKey) 
Updates the delegate key of a certain member.
It checks that the delegate key is not being used by another member and is not the address of an existing member.
It also checks that the member exists

If it all checks out, the delegate key is being updated and a elegate key checkpoint is created

### function isNotReservedAddress(address applicant)
make sure that the addres is not reserved (not TOTAL or GUILD)

### function getAddressIfDelegated(address checkAddr)
returns the member address if the address is used as a delegate key or the address itself if it is not.
    
### function getCurrentDelegateKey(address memberAddr) returns (address)
returns the current delegate key for a member address

### function getPreviousDelegateKey(address memberAddr) returns (address)
returns the previous delegate key for a member address. It is used to prepare the checkpoint
### function getPriorDelegateKey(address memberAddr, uint256 blockNumber) returns (address)
return the delegate key for a member at a certain block number
If none are found, the memberAddr is returned instead.

### function _createNewDelegateCheckpoint( address member, address newDelegateKey) internal
Writes a new checkpoint for a specific member

