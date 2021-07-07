---
id: rage-quit-adapter
title: Rage Quit
---

Ragequit is the process in which a member of the DAO decides to opt out of the DAO for any given reason.

This implementation of ragequit adapter does not cover the case in which the member is put in jail before updating the internal balance - as it happens in Moloch V2 to disincentivize the behavior in which members vote Yes on proposals that are essentially bad for the future of the DAO, and right after that they quit with their funds.

It also does not check if the member has voted Yes on a proposal that is not processed yet, and does not keep track of the latest proposal that was voted Yes on.

The main goal is to give the members the freedom to choose when it is the best time to withdraw their funds without any additional preconditions, except for the fact that they need to have enough units to be converted to funds. Members do not need to convert all their units/loot at once.

## Workflow

In order to opt out of the DAO, the member needs to indicate the amount of units and/or loots that the member has decided to burn (to convert back into a token value).

The proportional units and/or loots are burned when the member provides the tokens in which one expects to receive the funds. The funds are deducted from the internal DAO bank balance, and added to the member's internal balance.

If the member provides at least one invalid token, e.g: a token that is not supported/allowed by the DAO, the entire ragequit process is canceled/reverted. By default the adapter expects that the token array is sorted in ascending order. This is done to test for duplicates, and each token needs to be smaller than the next one, otherwise the transaction is reverted.
In addition to that, if the member provides a long list of tokens that may cause issues due to the block size limit, it is expected that the transaction returns a failure, so it can be retried in another run with a fewer tokens.

Once the ragequit process is completed, the funds are deducted from the bank, added to the member's internal balance, and an event called `MemberRagequit` is emitted.

:::tip
Tokens that are provided by the member have to be allowed/supported by the DAO. The member/advisor needs to have enough units and/or loot in order to convert it to funds.
:::

## Access Flags

### BankExtension

- `INTERNAL_TRANSFER`
- `SUB_FROM_BALANCE`
- `ADD_TO_BALANCE`

## Dependencies

### DaoRegistry

### BankExtension

### FairShareHelper

## Structs

- There are no structs defined.

## Storage

There is no state tracking for this adapter.

## Functions

### receive

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable
```

### ragequit

```solidity
    /**
     * @notice Allows a member or advisor of the DAO to opt out by burning the proportional amount of units/loot of the member.
     * @notice Anyone is allowed to call this function, but only members and advisors that have units are able to execute the entire ragequit process.
     * @notice The array of token needs to be sorted in ascending order before executing this call, otherwise the transaction will fail.
     * @dev The sum of unitsToBurn and lootToBurn have to be greater than zero.
     * @dev The member becomes an inactive member of the DAO once all the units/loot are burned.
     * @dev If the member provides an invalid/not allowed token, the entire processed is reverted.
     * @dev If no tokens are informed, the transaction is reverted.
     * @param dao The dao address that the member is part of.
     * @param unitsToBurn The amount of units of the member that must be converted into funds.
     * @param lootToBurn The amount of loot of the member that must be converted into funds.
     * @param tokens The array of tokens that the funds should be sent to.
     */
    function ragequit(
        DaoRegistry dao,
        uint256 unitsToBurn,
        uint256 lootToBurn,
        address[] calldata tokens
    ) external override reentrancyGuard(dao)
```

### \_prepareRagequit

```solidity
    /**
     * @notice Subtracts from the internal member's account the proportional units and/or loot.
     * @param memberAddr The member address that wants to burn the units and/or loot.
     * @param unitsToBurn The amount of units of the member that must be converted into funds.
     * @param lootToBurn The amount of loot of the member that must be converted into funds.
     * @param tokens The array of tokens that the funds should be sent to.
     * @param bank The bank extension.
     */
    function _prepareRagequit(
        address memberAddr,
        uint256 unitsToBurn,
        uint256 lootToBurn,
        address[] memory tokens,
        BankExtension bank
    ) internal
```

### \_burnUnits

```solidity
     /**
     * @notice Subtracts from the bank's account the proportional units and/or loot,
     * @notice and transfers the funds to the member's internal account based on the provided tokens.
     * @param memberAddr The member address that wants to burn the units and/or loot.
     * @param unitsToBurn The amount of units of the member that must be converted into funds.
     * @param lootToBurn The amount of loot of the member that must be converted into funds.
     * @param initialTotalUnitsAndLoot The sum of units and loot before internal transfers.
     * @param tokens The array of tokens that the funds should be sent to.
     * @param bank The bank extension.
     */
    function _burnUnits(
        address memberAddr,
        uint256 unitsToBurn,
        uint256 lootToBurn,
        uint256 initialTotalUnitsAndLoot,
        address[] memory tokens,
        BankExtension bank
    ) internal
```

## Events

### MemberRagequit

When a member of the DAO executes a rage quit call.

- `event MemberRagequit( address memberAddr, uint256 burnedUnits, uint256 burnedLoot, uint256 initialTotalUnitsAndLoot );`
