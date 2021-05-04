## DaoRegistry description and scope

The DAO Registry is the identity of the DAO. This is the contract address that is every adapter usually interacts with.

The scope of the registry is to manage the following:

- The adapter registry - which adapter is being used by this DAO and which access it has to the DAO state.
- The extension registry - which extension is part of the DAO and the adapter's access to it.
- Members registry - whether members exist, their delegate key and their access flags.

Each non-constant function in the DAO has an access control modifier linked to it, to make sure the caller has the right to call it.

The DaoRegistry.sol contract tracks the state of the DAO for 1) Adapter and Extension access, 2) State of Proposals, 3) Membership status. For an Adapter to be used it must be registered to DaoRegistry.sol.

## Enums

### DAO State

`enum DaoState {CREATION, READY}` CREATION = the DAO has been deployed via `initializeDao`, but is not ready to be used. READY = the function `finalizeDao` has been called and is now ready to be used. Once the DaoState = `READY` then the only way to add additional Adapters is to via the proposal process.

### Access Flags

`enum MemberFlag {EXISTS}` = `EXISTS` is true if a member or a proposal exists.

` enum ProposalFlag {EXISTS, SPONSORED, PROCESSED}` = `EXISTS` true if a proposal has been been submitted. `SPONSORED` is true if a Submitted proposal has been Sponsored by an existing Member.

`enum AclFlag { REPLACE_ADAPTER, SUBMIT_PROPOSAL, UPDATE_DELEGATE_KEY, SET_CONFIGURATION, ADD_EXTENSION, REMOVE_EXTENSION, NEW_MEMBER }`

- `REPLACE_ADAPTER` - if true, the caller adapter has access to add, remove, and replace adapters in the DAO, function `dao.replaceAdapter`.
- `SUBMIT_PROPOSAL` - if true, the caller adapter is allowed to submit/create proposals in the DAO, function `dao.submitProposal`.
- `UPDATE_DELEGATE_KEY` - if true, the caller adapter has the access to update the member's delegated key in the DAO, function `dao.updateDelegatedKey`.
- `SET_CONFIGURATION` - if true, the caller adapter is allowed to store custom configurations as key/value in the DAO, function `dao.setConfiguration`.
- `ADD_EXTENSION` - if true, the caller adapter is allowed to add new Extensions to the DAO, function `dao.addExtension`.
- `REMOVE_EXTENSION` - if true, the caller adapter is allowed to remove Extensions from the DAO, function `dao.removeExtension`.
- `NEW_MEMBER` - if true, the caller adapter has access to register new members in the DAO, function `dao.potentialNewMember`.

## Events

    Events for Proposals - The proposal order follows Moloch v2, in 1) a proposal is submitted, 2) then it sponsored by a member, and 3) after a proposal is voted on, it can finally be processed.

    `event SubmittedProposal(bytes32 proposalId, uint256 flags);`
    `event SponsoredProposal(bytes32 proposalId, uint256 flags, address votingAdapter);`
    `event ProcessedProposal(bytes32 proposalId, uint256 flags);`

    Events for Adding and Removing Adapters
    `event AdapterAdded(bytes32 adapterId,address adapterAddress,uint256 flags);`
    `event AdapterRemoved(bytes32 adapterId);`

    Events for Members
    `event UpdateDelegateKey(address memberAddress, address newDelegateKey);`

    Configuration Events
    `event ConfigurationUpdated(bytes32 key, uint256 value);`
    `event AddressConfigurationUpdated(bytes32 key, address value);`

## Structs

`struct Proposal` the structure to track all the proposals in the DAO and their state (EXISTS, SPONSORED, PROCESSED).

`struct Member` the structure to track all the members in the DAO and their state (EXISTS).

`struct Checkpoint` Tribute makes use of the off-chain voting mechanism Snapshot. The `Checkpoint` struct assists with verifying the optimistic voting and proposal mechanisms at various blocktimes. See, https://github.com/snapshot-labs.

`struct DelegateCheckpoint` A checkpoint for marking number of votes from a given block.

`struct AdapterEntry` When an Adapter is added to `DaoRegistry` via the function `replaceAdapter`, a bytes32 `id` and a uint256 `acl` are parameters assigned to the Adapter for use in identifying the Adapter.

`struct ExtensionEntry` When an Extension is added to `DaoRegistry` via `addExtenstion` a bytes32 `id` and a uint256 `acl` are parameters assigned to the Extension for use in identifying the Extension.

## Registry state & Public Variables

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

Note: the constructor function is non-existent, because this is a Cloneable contract. See, https://eips.ethereum.org/EIPS/eip-1167

### function initialize(address creator, address payer) external

Initializes the DAO by creating the initial members who are 1) the DAO creator passed to the function, 2) the account passed to the function which paid for the transaction to create the DAO, and 3) the DaoFactory calling this function.

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

### function replaceAdapter(bytes32 adapterId, address adapterAddress, uint256 acl, bytes32[] calldata keys,uint256[] calldata values)

Adds, removes or replaces an adapter om the DAO registry. It also sets the access control.
The adapter can be added only if the adapter id is not already in use.
To remove an adapter from the DAO just set the address to 0x0.

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

### function submitProposal(bytes32 proposalId)

Creates a proposal entry for the DAO.
It checks that the proposal was not previously created.

### function sponsorProposal(bytes32 proposalId, address sponsoringMember, address votingAdapterAddress)

Marks an existing proposal as sponsored.
saves which voting adapter is being used for this proposal.
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

### function isMember(address addr) public view returns (bool)

Returns true if the address is the delegate key of an existing member

### function getProposalFlag(bytes32 proposalId, ProposalFlag flag) returns (bool)

Helper function to get the flag value for a proposal.

### function getMemberFlag(address memberAddress, MemberFlag flag) returns (bool)

Helper function to get the flag value for a member.

### function getNbMembers() public view returns (uint256)

Returns how many members have been registered in the DAO.

### function getMemberAddress(uint256 index) public view returns (address)

Gets an address at a certain index in the members list.

### function updateDelegateKey(address memberAddr, address newDelegateKey)

Updates the delegate key of a certain member.
It checks that the delegate key is not being used by another member and is not the address of an existing member.
It also checks that the member exists.

If all the checks pass, the delegate key is updated and a delegate key checkpoint is created.

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
