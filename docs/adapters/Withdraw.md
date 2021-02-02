## Adapter description and scope

A brief description of the adapter and what is the use-case covered by the implementation. It is also good to add the goal of the Adapter and which value it brings to the DAO.

## Adapter workflow

Describe the entire process, interactions and routines covered/executed by this Adapter.

## Adapter configuration

Specify which additional configurations are required to make this adapter work. For instance: needs access to the DAO member, needs access to the DAO Bank, relies on Adapter X, Y and Extension Z.

DAORegistry Access Flags: `WITHDRAW`, `SUB_FROM_BALANCE`.

Bank Extension Access Flags: `WITHDRAW`, `SUB_FROM_BALANCE`.

## Adapter state

Describe each variable public and private of the adapter and what is the purpose of that variable.

## Dependencies and interactions (internal / external)

Add the information about all the interactions that are triggered by this DAO, which contracts it depends on, and which functions it calls.

## Functions description and assumptions / checks

Descrive the public and private function signatures with proper documentation that clearly explains what the function does, what are expected the arguments and pre-conditions to execute the function. Also, provide what is the expected outcome.

Examples:

### receive() external payable

### function submitKickProposal

```solidity
    /**
     * @notice Creates a guild kick proposal, opens it for voting, and sponsors it.
     * @dev A member can not kick himself.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only members that have shares can be kicked out.
     * @dev Proposal ids can not be reused.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param memberToKick The member address that should be kicked out of the DAO.
     * @param data Additional information related to the kick proposal.
     */
    function submitKickProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address memberToKick,
        bytes calldata data
    ) external override onlyMember(dao)
```

## Events

List all the events that are emitted by the function in this Adapter implementation.
