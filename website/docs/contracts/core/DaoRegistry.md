---
id: dao-registry
title: Registry
---

The DAO Registry contract is the identity of the DAO. This is the contract address that every adapter usually interacts with.

The scope of the registry is to manage the following:

- The adapter registry - which adapter is being used by this DAO and which access it has to the DAO state.
- The extension registry - which extension is part of the DAO and the adapter's access to it.
- Members registry - whether members exist, their delegate key and their access flags.

:::important
Each non-constant function in the DAO Registry has an access control modifier `hasAccess` linked to it, to make sure the caller has the right to call it.
:::

The DaoRegistry.sol contract tracks the state of the DAO for 1) Adapter and Extension access, 2) State of Proposals, 3) Membership status. If an Adapter needs to access the DAO Registry, it must be registered to the DAO with the correct access flags.

## DAO State

The DAO can be in one of the following states:

- `CREATION`: when the DAO is being deployed via `initializeDao`, but is not ready to be used.
- `READY`: when the function `finalizeDao` has been called, and is now ready to be used.

:::tip
Once the DaoState is changed to `READY`, then the only way to add additional Adapters is via proposal process using the **[Managing Adapter](/docs/contracts/adapters/configuration/managing-adapter)**.
:::

## Access Flags

The are three main categories of Access Flags for the DAO Registry Contract:

1. MemberFlags

   - `EXISTS`: right to check if a given address is already part of the DAO. Useful to restrict the DAO features that need to be access by members only.

2. ProposalFlag

   - `EXISTS`: right to check if a given proposal id already exists in the DAO storage.
   - `SPONSORED`: right to check if a given proposal id was already sponsored.
   - `PROCESSED`: right to check if a griven proposal id was already processed.

3. AclFlag
   - `REPLACE_ADAPTER`: right to add/remove/replace an adapter, function `dao.replaceAdapter`.
   - `SUBMIT_PROPOSAL`: right to submit a proposal, function `dao.submitProposal`.
   - `UPDATE_DELEGATE_KEY`: right to update the delegate key of a member, function `dao.updateDelegatedKey`.
   - `SET_CONFIGURATION`: right to set custom configurations parameters, function `dao.setConfiguration`.
   - `ADD_EXTENSION`: right to add an extension, function `dao.addExtension`.
   - `REMOVE_EXTENSION`: right to remove an extension, function `dao.removeExtension`.
   - `NEW_MEMBER`: right to add a new potential member to the DAO, function `dao.potentialNewMember`.

## Structs

### Proposal

The structure to track all the proposals in the DAO and their state (EXISTS, SPONSORED, PROCESSED).

### Member

The structure to track all the members in the DAO and their state (EXISTS).

### Checkpoint

Tribute makes use of the off-chain voting mechanism Snapshot. The `Checkpoint` struct assists with verifying the optimistic voting and proposal mechanisms at various blocktimes. See, https://github.com/snapshot-labs.

### AdapterEntry

When an Adapter is added to `DaoRegistry` via the function `replaceAdapter`, a bytes32 `id` and a uint256 `acl` are parameters assigned to the Adapter for use in identifying the Adapter.

### ExtensionEntry

When an Extension is added to `DaoRegistry` via `addExtenstion` a bytes32 `id` and a uint256 `acl` are parameters assigned to the Extension for use in identifying the Extension.

## Storage

### public members

Mapping of all the members. Member struct contains the flags uint.

### private \_members

List of all the member addresses. Useful to iterate through members.

### public memberAddressesByDelegatedKey

Mapping of the member address by delegate key (think inverted mapping from members by delegate key).

### checkpoints

Delegate key checkpoints. This is useful to know what the delegate key is at a certain point in time. A checkpoint is a data structure that allows storing data on a per-block basis and is originally inspired by the Compound contracts.

### numCheckpoints

Checkpoint lengths per member address.

### public state

Dao state. This is used to know if the DAO is currently being set up or if it is already running. Useful to configure it.

### public proposals

Mapping of all the proposals for the DAO. Each proposal has an adapterAddress (which adapter created it) and flags to define its state.

### public adapters

Mapping of all the adapters. bytes32 is the keccak256 of their name and address.

### public inverseAdapters

Mapping of adapter details. For each address, we can get its id (keccak256(name)) and its acl (access control, which function in the DAO it has access to).

### public extensions

Mapping of each extension. Like for adapters, the key here is keccak256(name) (e.g., keccak256("bank"))

### public inverseExtensions

Mapping of extension details. For each extension address, you get its id (keccak256(name)) and a mapping from adapter address => access control.
Access control for each extension is centralized in the DaoRegistry to avoid each extension implementing its own ACL system.

### public mainConfiguration

Generic configuration mapping from key (keccak256(name)) to any type that can be encoded in 256 bytes (does not need to be uint, could be bytes32 too).

### public addressConfiguration

Since addresses are not encoded in 256 bytes, we need a separate configuration mapping for this type.

## Functions

:::caution
The constructor function is non-existent, because this is a Cloneable contract. See, https://eips.ethereum.org/EIPS/eip-1167
:::

### initialize

Initializes the DAO by creating the initial members who are 1) the DAO creator passed to the function, 2) the account passed to the function which paid for the transaction to create the DAO, and 3) the DaoFactory calling this function.

### finalizeDao

Mark the DAO as finalized. After that, changes can only be made through adapters.

### setConfiguration

Set a generic configuration entry for the DAO.
Only adapters with access to this function can do it.

### setAddressConfiguration

Set an address configuration entry for the DAO.
Only adapters with access to this function can do it.

### potentialNewMember

This functions checks if the member exists in the DAO. If the member does not exist,
it creates the entry for the new member.
That means creating an entry in the members mapping, setting the delegate key to be the same address as the new member and adding the address to the members list.

### getConfiguration

Get the generic config entry by passing the keccak256(config name).

### getAddressConfiguration

Get the address config entry by passing the keccak256(config name).

### addExtension

Add a new extension to the registry. It first checks if the extension id is already used and reverts if it is the case.
It then adds the extension to the DAO and initializes it.

### removeExtension

Removes the extension by extension id. It reverts if no extension has been registered for that id (keccak256(name)).

### setAclToExtensionForAdapter

Sets the access control for a particular adapter (by address) to a specific extension.
Both adapter and extension need to be already registered to the DAO.

### replaceAdapter

Adds, removes or replaces an adapter om the DAO registry. It also sets the access control.
The adapter can be added only if the adapter id is not already in use.
To remove an adapter from the DAO just set the address to 0x0.

### isExtension

Checks whether the address is registered as an extension in the DAO.

### isAdapter

Checks whether the address is registered as an adapter in the DAO.

### hasAdapterAccess

Checks whether the adapter has access to a certain flag in the DAO.

### hasAdapterAccessToExtension

Checks whether a certain adapter has access to a certain extension in the DAO.

### getAdapterAddress

Returns the adapter address registered for this adapterId and reverts if not found.

The reason we revert here is to avoid the need to check everywhere that the return value is 0x0 when we want to use an adapter.

### getExtensionAddress

Returns the extension address registered for this extensionId and reverts if not found.

The reason we revert here is to avoid the need to check everywhere that the return value is 0x0 when we want to use an extension.

### submitProposal

Creates a proposal entry for the DAO.
It checks that the proposal was not previously created.

### sponsorProposal

Marks an existing proposal as sponsored.
saves which voting adapter is being used for this proposal.
Checks that the proposal has not been sponsored yet.
Checks that the proposal exists.
Checks that the adapter that sponsors the proposal is the one that submitted it.
Checks that the proposal has not been processed yet.
Checks that the member sponsoring the proposal is an active member.

### processProposal

Marks an existing proposal as processed.
Checks that the proposal has not been processed already and that it exists.

### \_setProposalFlag

Internal utility function to set a flag to a proposal.
It checks that the proposal exists and that the flag has not been already set.

### isMember(address addr)

Returns true if the address is the delegate key of an existing member

### getProposalFlag

Helper function to get the flag value for a proposal.

### getMemberFlag

Helper function to get the flag value for a member.

### getNbMembers

Returns how many members have been registered in the DAO.

### getMemberAddress

Gets an address at a certain index in the members list.

### updateDelegateKey

Updates the delegate key of a certain member.
It checks that the delegate key is not being used by another member and is not the address of an existing member.
It also checks that the member exists.

If all the checks pass, the delegate key is updated and a delegate key checkpoint is created.

### getAddressIfDelegated

Returns the member address if the address is used as a delegate key or the address itself if it is not.

### getCurrentDelegateKey(address memberAddr)

Returns the current delegate key for a member address. The member's delegate key is an alternative address to their original membership address that they have specified for interacting with the DAO. This delegation can be used for a number of different reasons (attack, reorg, technical issues, tax).

### getPreviousDelegateKey

Returns the previous delegate key for a member address. It is used to prepare the checkpoint.

### getPriorDelegateKey

Returns the delegate key for a member at a certain block number.
If none are found, the memberAddr is returned instead.

### \_createNewDelegateCheckpoint

Writes a new checkpoint for a specific member.

## Events

### Proposals

The proposal order follows Moloch v2

1. A proposal is submitted

- `event SubmittedProposal(bytes32 proposalId, uint256 flags);`

2. Then it sponsored by a member

- `event SponsoredProposal(bytes32 proposalId, uint256 flags, address votingAdapter);`

3. After a proposal is voted on, it can finally be processed

- `event ProcessedProposal(bytes32 proposalId, uint256 flags);`

### Adapters

1. A new adapter is added (registereds) to the DAO

- `event AdapterAdded(bytes32 adapterId,address adapterAddress,uint256 flags);`

2. An adapter is removed from the DAO

- `event AdapterRemoved(bytes32 adapterId);`

### Members

1. When a member updates the delegated key

- `event UpdateDelegateKey(address memberAddress, address newDelegateKey);`

### Configuration

1. When a new configuration is added/erased

- `event ConfigurationUpdated(bytes32 key, uint256 value);`

2. When the Address configuration is updated

- `event AddressConfigurationUpdated(bytes32 key, address value);`
