---
id: configuration-adapter
title: Configuration
---

The Configuration adapter manages storing and retrieving per-DAO settings required by shared adapters.

Some adapters have configurable settings which must be stored for each DAO instance that uses the shared adapter.

## Workflow

Submit proposal

- check that caller is valid member
- check that keys/values are same length
- check that proposalId is unique
- submit proposal to DAO
- create and store configuration structure

Sponsor module change request

- check that caller is valid member
- initiate vote

Process proposal

- check that caller is valid member
- check that proposalId exists
- check that proposal passed
- for each key and value, set it in the configuration for this DAO
- process proposal

## Access Flags

### DaoRegistry

- `SUBMIT_PROPOSAL`
- `SET_CONFIGURATION`

## Dependencies

### DaoRegistry

### Voting

## Structs

### Configuration

- `keys`: the name of the configurations.
- `values`: the value of the configurations.

### DaoRegistry

### Voting

## Storage

### \_configurations

Map of all keys and configurations values.

## Functions

### submitProposal

Creates and sponsors a new configuration proposal on behalf of the member calling the function.

```solidity
  /**
    * @notice Creates and sponsors a configuration proposal.
    * @param dao The DAO Address.
    * @param proposalId The proposal id.
    * @param keys The applicant address.
    * @param values The token to receive the funds.
    * @param data Additional details about the financing proposal.
    */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes32[] calldata keys,
        uint256[] calldata values,
        bytes calldata data
    ) external override onlyMember(dao) reentrancyGuard(dao)
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
