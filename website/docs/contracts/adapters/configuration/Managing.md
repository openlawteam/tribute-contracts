---
id: managing-adapter
title: Managing
---

The Managing adapter handles the proposal creation, sponsorship and processing of a new adapter/extension including its initial configuration, and permissions.

An adapter/extension can be added, removed or replaced in the DAO registry. In order to remove an adapter/extension one must pass the address 0x0 with the adapter/extension id that needs to be removed. To add a new adapter/extension one most provide the adapter/extension id, address and access flags. The address of the new adapter/extension can not be a reserved address, and the id must be a known id as defined in the `DaoConstants.sol`. The replace adapter/extension operation removes the adapter/extension from the registry based on the id parameter, and also adds a new adapter/extension using the same id but with a new address.

The Managing adapter also allows one set custom ACL flags to adapters that need to communicate with different extensions.

:::caution
It is important to indicate which operation type will be performed. Set 1 to `updateType` when you are adding/removing an `Adapter`, and set 2 when you are adding/removing an `Extension`.
:::

## Workflow

Submit a proposal and check:

- if caller is an active member
- if keys and values have equal length
- if adapter/extension address is valid
- if the access flags don't overflow
- if adapter/extension address is not reserved

If all the requirements pass, then the proposal is subitted to registry and the adapter stores the proposal data.

Once the voting period ends, anyone can process the proposal. The proposal is processed only if:

- it has not been processed already
- the proposal has been sponsored
- the voting has passed
- the updateType is 1 (adapter) or 2 (extension)
- the extension `AclFlags`, and `address` are valid

## Access Flags

### DaoRegistry

- `SUBMIT_PROPOSAL`
- `REPLACE_ADAPTER`
- `ADD_EXTENSION`
- `REMOVE_EXTENSION`

## Dependencies

### DaoRegistry

### Voting

## Structs

### ProposalDetails

- `adapterOrExtensionId`: The id of the adapter/extension to add, remove or replace.
- `adapterOrExtensionAddr`: The contract address of the adapter/extension.
- `flags`: The DAO ACL for the new adapter.
- `keys`: The configuration keys for the adapter.
- `values`: The values to set for the adapter configuration.
- `extensionAddresses`: The list of extension addresses that the adapter interacts with.
- `extensionAclFlags`: The list of ACL flags that the adapter needs to interact with each extension.

## Storage

### proposals

All the proposals handled by the adapter per DAO.

## Functions

### submitProposal

```solidity
    /**
     * @notice Creates a proposal to replace, remove or add an adapter.
     * @dev If the adapterAddress is equal to 0x0, the adapterId is removed from the registry if available.
     * @dev If the adapterAddress is a reserved address, it reverts.
     * @dev keys and value must have the same length.
     * @dev proposalId can not be reused.
     * @param dao The dao address.
     * @param proposalId Tproposal details
     * @param proposal The proposal details
     * @param data Additional data to pass to the voting contract and identify the submitter
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        ProposalDetails calldata proposal,
        bytes calldata data
    ) external override onlyMember(dao) reentrancyGuard(dao)
```

### processProposal

```solidity
    /**
     * @notice Processes a proposal that was sponsored.
     * @dev Only members can process a proposal.
     * @dev Only if the voting pass the proposal is processed.
     * @dev Reverts when the adapter address is already in use and it is an adapter addition.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reentrancyGuard(dao)
```

## Events

### AdapterRemoved

When an adapter is removed from the regitry. Event emitted by the DAO Registry.

- `event AdapterRemoved(bytes32 adapterId);`

### AdapterAdded

When a new adapter is added to the registry. Event emitted by the DAO Registry.

- `event AdapterAdded(bytes32 adapterId, address adapterAddress, uint256 flags);`

### ConfigurationUpdated

When a new configuration is stored in the registry. Event emitted by the DAO Registry.

- `event ConfigurationUpdated(bytes32 key, uint256 value);`
