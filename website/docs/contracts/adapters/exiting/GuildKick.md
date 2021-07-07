---
id: guild-kick-adapter
title: Guild Kick
---

Guild Kick is the process in which the DAO members decide to kick a member out of the DAO for any given reason.

In order to kick out a member of the DAO, the members must submit a proposal which needs to be voted on. If the proposal passes, then the member will be kicked out, and the kicked member will be able to withdraw his funds based on the number of units and/or loot that the member was holding when the kick process was started.

The main goal is to give the members the freedom to choose which individuals or organizations should really be part of the DAO.

## Workflow

The guild kick starts with the other members submitting a kick proposal (function `submitProposal`). The kick proposal indicates which member should be kicked out.

A member can not kick himself and only members are allowed to create kick proposals, and proposal ids can not be reused.

The kick proposal gets created, opens for voting, and sponsored by the message sender. The adapter tracks all the kicks that have been executed already by each DAO.

Once the kick proposal has passed, the other members have to start the actual guild kick process (function `processProposal`).

The rage kick process is the only alternative for a kicked member to receive his funds. It uses the current guild balance to calculate the fair amount of funds to return to the kicked member. It is important to mention that this step relies on the number of tokens available in the bank, at this moment there is no limit of tokens available in the bank, but soon it will be updated to have a fixed size. The funds are internally transferred from the Guild bank to the kicked member's account, so the member can withdraw the funds later on using the Withdraw Adapter.

:::tip
Tokens that are provided by the member have to be allowed/supported by the DAO. The member needs to have enough units and/or loot in order to convert it to funds.
:::

## Access Flags

### DAORegistry

- `SUBMIT_PROPOSAL`

### BankExtension

- `WITHDRAW`
- `INTERNAL_TRANSFER`
- `SUB_FROM_BALANCE`
- `ADD_TO_BALANCE`

## Dependencies

### DaoRegistry

### BankExtension

### Voting

### GuildKickHelper

### FairShareHelper

## Structs

### GuildKick

- `memberToKick`: The address of the member to kick out of the DAO.
- `status`: The kick status.

### GuildKickStatus

- `status`: The kick status (`Not Started`, `In Progress`, `Done`).

## Storage

### kicks

Keeps track of all the kicks executed per DAO.

### Voting

- starts a new voting for the kick proposal.
- checks the voting results.

### FairShareHelper

- to calculate the amount of funds to be returned to the member based on the provided numbers of units and/or loot, taking into account the current balance of the GUILD and kicked member's accounts.

## Functions

### receive

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable
```

### submitProposal

```solidity
    /**
     * @notice Creates a guild kick proposal, opens it for voting, and sponsors it.
     * @dev A member can not kick himself.
     * @dev Only members that have units or loot can be kicked out.
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
    ) external override
```

### processProposal

If the proposal has passed, sends the fair unit of tokens from the guild bank to the member kicked.

## Events

- No events are emitted.
