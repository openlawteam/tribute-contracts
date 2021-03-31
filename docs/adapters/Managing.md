## Adapter description and scope

The Managing adapter handles the proposal creation, sponsorship and processing of a new adapter including its initial configuration, and permissions.

An adapter can be added, removed or replaced in the DAO registry. In order to remove an adapter one must pass the address 0x0 with the adapter id that needs to be removed. In order to add a new adapter one most provide the adapter id, address and access flags. The address of the new adapter can not be a reserved address, and the id must be a known id as defined in the `DaoConstants.sol`. The replace adapter operation removes the adapter from the registry based on the adapter id parameter, and also adds a new adapter using the same id but with a new address.

## Adapter workflow

Submit a proposal and check:

- if caller is an active member
- if keys and values have equal length
- if adapter address is valid
- if the access flags don't overflow
- if adapter address is not reserved

If all the requirements pass, then the proposal is subitted to registry and the adapter stores the proposal data.

To sponsor a proposal, you need to be an active member, and once sponsored the voting process starts.

Once the voting period ends, only a member can process the proposal. The proposal is processed only if:

- the caller is an active member
- the has not been processed already
- the proposal has been sponsored
- the voting has passed

## Adapter configuration

DAORegistry Access Flags: `SUBMIT_PROPOSAL`, `REPLACE_ADAPTER`.

## Adapter state

- `proposals`: All the proposals handled by the adapter per DAO.
- `ProposalDetails`:
  - `adapterId`: The id of the adapter to add, remove or replace.
  - `adapterAddress`: The address of the new adapter contract.
  - `keys`: The configuration keys for the adapter.
  - `values`: The values to set for the adapter configuration.
  - `flags`: The ACL for the new adapter.

## Dependencies and interactions (internal / external)

- DaoRegistry

  - Submits/sponsors/processes a proposal.
  - Checks if applicant and/or adapter address are not reserved.
  - Executes the replaceAdapter call to update the registry.

- Voting

  - Gets the address that sent the sponsorProposal transaction.
  - Starts a new voting for the kick proposal.
  - Checks the voting results.

## Functions description and assumptions / checks

### function submitProposal

```solidity
    /**
     * @notice Creates a proposal to replace, remove or add an adapter.
     * @dev If the adapterAddress is equal to 0x0, the adapterId is removed from the registry if available.
     * @dev If the adapterAddress is a reserved address, it reverts.
     * @dev keys and value must have the same length.
     * @dev proposalId can not be reused.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param adapterId The adapter id to replace, remove or add.
     * @param adapterAddress The adapter address to add or replace. Use 0x0 if you want to remove the adapter.
     * @param keys The configuration keys for the adapter.
     * @param values The values to set for the adapter configuration.
     * @param _flags The ACL for the new adapter, up to 2**128-1.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes32 adapterId,
        address adapterAddress,
        bytes32[] calldata keys,
        uint256[] calldata values,
        uint256 _flags
    ) external override onlyMember(dao)
```

### function sponsorProposal

```solidity
    /**
     * @notice Sponsor a proposal if the proposal id exists.
     * @dev Only members are allowed to sponsor proposals.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param data Additional data that can be used for offchain voting validation.
     */
    function sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes calldata data
    ) external override onlyMember(dao)
```

### function processProposal

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
        onlyMember(dao)

```

## Events

- `AdapterRemoved`: when an adapter is removed from the regitry. Event emitted by the DAO Registry.
- `AdapterAdded`: when a new adapter is added to the registry. Event emitted by the DAO Registry.
- `ConfigurationUpdated`: when a new configuration is stored in the registry. Event emitted by the DAO Registry.
