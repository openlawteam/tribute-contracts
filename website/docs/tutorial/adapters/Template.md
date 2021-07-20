---
id: adapter-template
title: Adapter Template
---

Description and scope of the new adapter. This is a template for the documentation of an Adapter.

Here you can provide a brief description of the adapter and what is the use-case covered by the implementation. It is also good to add the goal of the Adapter and what value it brings to the DAO.

## Workflow

An overview of the entire process executed by Adapter functions, the main interactions and routines covered/executed.

## Access Flags

Specify which additional configurations are required to make this adapter work. For instance: needs access to the DAO members, needs access to the DAO Bank, relies on Adapter X, Y and Extension Z.

### DAORegistry

- `SUBMIT_PROPOSAL`
- `x`,
- `y`,
- ...

### Bank Extension

- `WITHDRAW`
- `INTERNAL_TRANSFER`

## Dependencies

### DaoRegistry

### BankExtension

### Voting

## Structs

### MyStructX

- `fieldA`: the ...
- `fieldB`: the ...
- `...`: the ...

## Storage

Describe each variable public and private of the adapter and what is the purpose of that variable. Start with the public variables, and let the private ones to the end.

### varA

Keeps track of...

### \_varN

Tracks ...

## Functions

Describe the public and private functions signatures with proper documentation and clearly explain what each function does. Specify what are expected the arguments and pre-conditions to execute the functions. Also, provide what is the expected outcome, and start with the public functions.

### receive

Receives eth. Reverts when ...

### submitProposal

```solidity
    /**
     * @notice Creates a guild kick proposal, opens it for voting, and sponsors it.
     * @dev A member can not kick himself.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only members that have units can be kicked out.
     * @dev Proposal ids can not be reused.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param memberToKick The member address that should be kicked out of the DAO.
     * @param data Additional information related to the kick proposal.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address memberToKick,
        bytes calldata data
    ) external override onlyMember(dao)
```

## Events

- No events are emitted or

### KickedMember

When the kick proposal was processed with success.

- `event KickedMember(bytes32 proposalId, address member);`
