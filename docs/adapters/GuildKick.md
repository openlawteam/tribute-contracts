## Adapter description and scope

Guild Kick is the process in which the DAO members decide to kick a member out of the DAO for any given reason.

In order to kick out a member of the DAO, the members must submit a proposal which needs to be voted on. If the proposal pass, then the member will be kicked out, and the kicked member will be able to withdraw his funds based on the number of shares and loot that the member was holding.

The main goal is to give the members the freedom to choose which individuals should really be part of the DAO.

## Adapter workflow

The guild kick starts with the other members submitting a kick proposal (function `submitKickProposal`).
The kick proposal indicates which member should be kicked out.

A member can not kick himself, and only one kick proposal can be executed at time. In addition to that, only members are allowed to create kick proposals.

The kick proposal gets created, open for voting, and sponsored by the message sender. The adapter tracks all the kicks that have been executed already by the DAO, and also tracks the current kick that is still in progress - this is done to ensure the kicks are executed sequentially.

Once the proposal to kick out the member has passed, the other members have to start the actual guild kick process (function `guildKick`). In this process the kicked member has its shares converted to loot, which removes his voting power, and after that his put in jail, so he can not perform any other actions in the DAO anymore. After that the kick proposal is completed, but the kicked member still does not have received his funds yet.

While the kicked member is in jail, an active member of the DAO, or the actual kicked member can trigger the internal transfer process to grant the funds to the kicked member (function `rageKick`) (maybe we can make this function open, otherwise the kicked member wont be able to call it, because he is in jail).

The rage kick process is only alternative for a kicked member to receive his funds, it checks the historical guild balance (when the guild kick proposal has been created) to calculate the fair amount of funds to return to the kicked member.
It is important to mention that this process my take multiple steps, because it relies on the number of tokens available in the bank. The funds are internally transfered from the Guild bank to the kicked member's account, so the member can withdraw the funds later on. At the end of the process, after all the transfers were completed with success for all available tokens, the kicked member's loot are burned and the member is removed from jail - because he is not an active member anymore.

## Adapter configuration

Tokens that are provided by the member have to be allowed/supported by the DAO.

The member needs to have enough shares and/or loot in order to convert it to funds.

## Adapter state

There are no state tracking for this adapter.

## Dependencies and interactions (internal / external)

- BankExtension

  - to check the member's balance
  - to subtract the member's balance.
  - to transfer the funds from the DAO account to the member's account taking into consideration the provided tokens.

- DaoRegistry

  - to check if the message sender is actually a member of the DAO.
  - to check if the provided token is supported/allowed by the DAO.

- FairShareHelper

  - to calculate the amount of funds to be returned to the member based on the provided numbers of shares and/or loot.

## Functions description and assumptions / checks

### receive() external payable

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable
```

### function ragequit

```solidity
    /**
     * @notice Allows a member or advisor of the DAO to opt out by burning the proportional amount of shares/loot of the member.
     * @notice Anyone is allowed to call this function, but only members and advisor that have shares are able to execute the entire ragequit process.
     * @dev The member becomes an inative member of the DAO once all the shares/loot are burned.
     * @dev If the member provides an invalid/not allowed token, the entire processed is reverted.
     * @param dao The dao address that the member is part of.
     * @param sharesToBurn The amount of shares of the member that must be converted into funds.
     * @param lootToBurn The amount of loot of the member that must be converted into funds.
     * @param tokens The array of tokens that the funds should be sent to.
     */
    function ragequit(
        DaoRegistry dao,
        uint256 sharesToBurn,
        uint256 lootToBurn,
        address[] memory tokens
    ) external
```

### function \_prepareRagequit

```solidity
    /**
    * @notice Subtracts from the internal member's account the proportional shares and/or loot.
    * @param memberAddr The member address that want to burn the shares and/or loot.
    * @param sharesToBurn The amount of shares of the member that must be converted into funds.
    * @param lootToBurn The amount of loot of the member that must be converted into funds.
    * @param tokens The array of tokens that the funds should be sent to.
    * @param bank The bank extension.
    */
    function _prepareRagequit(
        address memberAddr,
        uint256 sharesToBurn,
        uint256 lootToBurn,
        address[] memory tokens,
        BankExtension bank
    ) internal
```

### function \_burnShares

```solidity
    /**
    * @notice Subtracts from the bank's account the proportional shares and/or loot,
    * @notice and transfers the funds to the member's internal account based on the provided tokens.
    * @param memberAddr The member address that want to burn the shares and/or loot.
    * @param sharesToBurn The amount of shares of the member that must be converted into funds.
    * @param lootToBurn The amount of loot of the member that must be converted into funds.
    * @param initialTotalSharesAndLoot The sum of shares and loot before internal transfers.
    * @param tokens The array of tokens that the funds should be sent to.
    * @param bank The bank extension.
    */
    function _burnShares(
        address memberAddr,
        uint256 sharesToBurn,
        uint256 lootToBurn,
        uint256 initialTotalSharesAndLoot,
        address[] memory tokens,
        BankExtension bank
    ) internal
```

## Events

```solidity
    /**
     * @notice Event emitted when a member of the DAO executes a ragequit with all or parts of one shares/loot.
     */
    event MemberRagequit(
        address memberAddr,
        uint256 burnedShares,
        uint256 burnedLoot,
        uint256 initialTotalSharesAndLoot)
```
