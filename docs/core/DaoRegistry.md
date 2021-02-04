## Description and scope

The DAO Registry is the identity of the DAO. This is the contract address that is passed to every adapter.

The scope of the registry is to manage the following:

- The adapter registry - which adapter is being used by this DAO and which access it has
- The extension registry - which extension is part of the DAO and the adapter's access to it
- Members registry - whether members exist, their delegate key and their flags

Each non-constant function in the DAO has an access control modifier linked to it, to make sure the caller has the right to call it.

## Registry state

### mapping(address => Member) public members

Mapping of all the members. Member struct contains the flags uint.

### address[] private \_members

List of all the member addresses. Useful to iterate through members.

### mapping(address => address) public memberAddressesByDelegatedKey

Mapping of the member address by delegate key (think inverted mapping from members by delegate key).

### mapping(address => mapping(uint32 => DelegateCheckpoint)) checkpoints

Delegate key checkpoints. This is useful to know what the delegate key is at a certain point in time.

### mapping(address => uint32) numCheckpoints

Checkpoint lengths per member address.

### DaoState public state

Dao state. This is used to know if the DAO is currently being set up or if it is already running. Useful to configure it.

### mapping(bytes32 => Proposal) public proposals

Mapping of all the proposals for the DAO. Each proposal has an adapterAddress (which adapter created it) and flags to define its state.

### mapping(bytes32 => address) public adapters

Mapping of all the adapters. bytes32 is the keccak256 of their name and address.

### mapping(address => AdapterEntry) public inverseAdapters

Mapping of adapter details. For each address, we can get its id (keccak256(name)) and its acl (access control, which function in the DAO it has access to).

### mapping(bytes32 => address) public extensions

Mapping of each extension. Like for adapters, the key here is keccak256(name) (e.g., keccak256("bank"))

### mapping(address => ExtensionEntry) public inverseExtensions

Mapping of extension details. For each extension address, you get its id (keccak256(name)) and a mapping from adapter address => access control.
Access control for each extension is centralized in the DaoRegistry to avoid each extension implementing its own ACL system.

### mapping(bytes32 => uint256) public mainConfiguration

Generic configuration mapping from key (keccak256(name)) to any type that can be encoded in 256 bytes (does not need to be uint, could be bytes32 too).

### mapping(bytes32 => address) public addressConfiguration

Since addresses are not encoded in 256 bytes, we need a separate configuration mapping for this type.

## Functions description, assumptions, checks, dependencies, interactions and access control

### function initialize(address creator) external

Initializes the DAO by creating the first member who is the creator passed to the function.

### function finalizeDao()

Mark the DAO as finalized. After that, changes can only be made through adapters.

### function setConfiguration(bytes32 key, uint256 value)

Set a generic configuration entry for the DAO.
Only adapters with access to this function can do it.

### function setAddressConfiguration(bytes32 key, address value)

Set an address configuration entry for the DAO.
Only adapters with access to this function can do it.

### function potentialNewMember(address memberAddress)

This functions checks if the member exists in the DAO. If the member does not exist,
it creates the entry for the new member.
That means creating an entry in the members mapping, setting the delegate key to be the same address as the new member and adding the address to the members list.

### function getConfiguration(bytes32 key) external view returns (uint256)

Get the generic config entry by passing the keccak256(config name).

### function getAddressConfiguration(bytes32 key)

Get the address config entry by passing the keccak256(config name).

### function addExtension(bytes32 extensionId, IExtension extension, address creator) external

Add a new extension to the registry. It first checks if the extension id is already used and reverts if it is the case.
It then adds the extension to the DAO and initializes it.

### function removeExtension(bytes32 extensionId)

Removes the extension by extension id. It reverts if no extension has been registered for that id (keccak256(name)).

### function setAclToExtensionForAdapter(address extensionAddress, address adapterAddress, uint256 acl)

Sets the access control for a particular adapter (by address) to a specific extension.
Both adapter and extension need to be already registered to the DAO.

### function addAdapter(bytes32 adapterId, address adapterAddress, uint256 acl)

Adds an adapter to the DAO adapter registry. It also sets the access control.

The adapter can be added only if the adapter id is not already used.

### function removeAdapter(bytes32 adapterId)

Removes an adapter from the DAO. Reverts if no adapter has been registered to the adapterId.

### function isExtension(address extensionAddr) public view returns (bool)

Checks whether the address is registered as an extension in the DAO.

### function isAdapter(address adapterAddress) public view returns (bool)

Checks whether the address is registered as an adapter in the DAO.

### function hasAdapterAccess(address adapterAddress, AclFlag flag)

Checks whether the adapter has access to a certain flag in the DAO.

### function hasAdapterAccessToExtension(address adapterAddress, address extensionAddress, uint8 flag) returns (bool)

Checks whether a certain adapter has access to a certain extension in the DAO.

### function getAdapterAddress(bytes32 adapterId) returns (address)

Returns the adapter address registered for this adapterId and reverts if not found.

The reason we revert here is to avoid the need to check everywhere that the return value is 0x0 when we want to use an adapter.

### function getExtensionAddress(bytes32 extensionId) external view returns (address)

Returns the extension address registered for this extensionId and reverts if not found.

The reason we revert here is to avoid the need to check everywhere that the return value is 0x0 when we want to use an extension.

### function jailMember(address memberAddr)

Marks the member as jailed.
Reverts if the member does not exist.
The call can be done multiple times but if the member is already jailed, nothing happens.

### function unjailMember(address memberAddr)

Unmarks a member as jailed.
Reverts if the member does not exist, does nothing if the member is not jailed.

### function submitProposal(bytes32 proposalId)

Creates a proposal entry for the DAO.
It checks that the proposal was not previously created.

### function sponsorProposal(bytes32 proposalId, address sponsoringMember)

Marks an existing proposal as sponsored.
Checks that the proposal has not been sponsored yet.
Checks that the proposal exists.
Checks that the adapter that sponsors the proposal is the one that submitted it.
Checks that the proposal has not been processed yet.
Checks that the member sponsoring the proposal is an active member.

### function processProposal(bytes32 proposalId)

Marks an existing proposal as processed.
Checks that the proposal has not been processed already and that it exists.

### function \_setProposalFlag(bytes32 proposalId, ProposalFlag flag)

Internal utility function to set a flag to a proposal.
It checks that the proposal exists and that the flag has not been already set.

### function isActiveMember(address addr) public view returns (bool)

Returns true if the address is the delegate key of an existing member and that the member is not jailed.

### function getProposalFlag(bytes32 proposalId, ProposalFlag flag) returns (bool)

Helper function to get the flag value for a proposal.

### function getMemberFlag(address memberAddress, MemberFlag flag) returns (bool)

Helper function to get the flag value for a member.

### function getNbMember() public view returns (uint256)

Returns how many members have been registered in the DAO.

### function getMemberAddress(uint256 index) public view returns (address)

Gets an address at a certain index in the members list.

### function updateDelegateKey(address memberAddr, address newDelegateKey)

Updates the delegate key of a certain member.
It checks that the delegate key is not being used by another member and is not the address of an existing member.
It also checks that the member exists.

If all the checks pass, the delegate key is updated and a delegate key checkpoint is created.

### function isNotReservedAddress(address applicant)

Checks that the address is not reserved (not TOTAL or GUILD).

### function getAddressIfDelegated(address checkAddr)

Returns the member address if the address is used as a delegate key or the address itself if it is not.

### function getCurrentDelegateKey(address memberAddr) returns (address)

Returns the current delegate key for a member address.

### function getPreviousDelegateKey(address memberAddr) returns (address)

Returns the previous delegate key for a member address. It is used to prepare the checkpoint.

### function getPriorDelegateKey(address memberAddr, uint256 blockNumber) returns (address)

Returns the delegate key for a member at a certain block number.
If none are found, the memberAddr is returned instead.

### function \_createNewDelegateCheckpoint( address member, address newDelegateKey) internal

Writes a new checkpoint for a specific member.
