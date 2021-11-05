---
id: configuration-adapter
title: Configuration
---

The Configuration adapter manages proposals that update the DAO configs. These settings are usually used by different adapters and/or extensions.

The configs are defined as `Numeric` and `Address` types, and adapters/extension can read these settings from the DAO registry to take custom actions.

It is important to preserve these configs per DAO instance because if an adapter is replaced by a newer version, it is still possible to use that same config.

An example of that is the Onboarding adapter that uses the `onboarding.tokenAddr` configuration to get the token address that needs to be minted when a member joins the DAO.

## Workflow

Submit Proposal

- A member of the DAO submits a Configuration proposal with the configs array, the proposal gets sponsored and the data is stored in the adapter. After that the proposal is up for vote. If a non member attempt to submit a proposal it will revert the call.
- Only the configType indicated in the config object will get updated. It is not possible to update an `address` and a `numeric` config with the same config record and name. In order to do that you need to create a new entry in the configs array and submit that proposal with the correct `configType`.

Process proposal

- If the proposalId is valid and the vote passed, then the configs are applied to the DAO based on each config type: `address` and `numeric`. In order to remove a config from the DAO, one just need to pass the value `0` for `numeric` and `0x0...` (zero address) for the `address` type.

## Access Flags

### DaoRegistry

- `SUBMIT_PROPOSAL`
- `SET_CONFIGURATION`

## Dependencies

### DaoRegistry

### Voting

## Structs

### Configuration

- `key`: the sha3 of the name of the configuration.
- `numericValue`: the numeric value of the configuration if `configType=0`.
- `addressValue`: the address value of the configuration if `configType=1`.
- `configType`: the config type that will be updated: `0 = numeric`, `1 = address`.

### DaoRegistry

### Voting

## Storage

### \_configurations

Map of all proposals with the configurations values applied or to be applied to the DAO.

## Functions

### submitProposal

Creates and sponsors a new configuration proposal on behalf of the member calling the function.

```solidity
  /**
     * @notice Creates and sponsors a configuration proposal.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     * @param configs The keys, type, numeric and address config values.
     * @param data Additional details about the financing proposal.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        Configuration[] calldata configs,
        bytes calldata data
    ) external override reentrancyGuard(dao)

```

### processProposal

Processes a previously created configuration proposal by applying the configuration to the DAO.

```solidity
  /**
    * @notice Processing a configuration proposal to update the DAO state.
    * @param dao The DAO Address.
    * @param proposalId The proposal id.
    */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reentrancyGuard(dao)
```

## Events

- No events are emitted.
