## Adapter description and scope

Guild Kick is the process in which the DAO members decide to kick a member out of the DAO for any given reason.

In order to kick out a member of the DAO, the members must submit a proposal which needs to be voted on. If the proposal pass, then the member will be kicked out, and the kicked member will be able to withdraw his funds based on the number of shares and loot that the member was holding when the kick process was started.

The main goal is to give the members the freedom to choose which individuals should really be part of the DAO.

## Adapter workflow

The guild kick starts with the other members submitting a kick proposal (function `submitKickProposal`).
The kick proposal indicates which member should be kicked out.

A member can not kick himself, and only one kick proposal can be executed at time. In addition to that, only members are allowed to create kick proposals, and proposal ids can not be reused.

The kick proposal gets created, open for voting, and sponsored by the message sender. The adapter tracks all the kicks that have been executed already by the DAO, and also tracks the current kick that is in progress - this is done to ensure the kicks are executed sequentially per DAO.

Once the kick proposal has passed, the other members have to start the actual guild kick process (function `guildKick`). In this process the kicked member has its shares converted to loot, which removes his voting power, and after that the kicked member put in jail, so he can not perform any other actions in the DAO. After that, the kick proposal is completed, but the kicked member still does not have received his funds yet.

While the kicked member is in jail, an active member of the DAO needs trigger the internal transfer process to release the funds of the kicked member, to do that the member just need to execute the rage kick process (function `rageKick`).

The rage kick process is only alternative for a kicked member to receive his funds, it checks the historical guild balance (when the guild kick proposal has been created) to calculate the fair amount of funds to return to the kicked member.
It is important to mention that this process might be executed in multiple steps, because it relies on the number of tokens available in the bank. The funds are internally transfered from the Guild bank to the kicked member's account, so the member can withdraw the funds later on. At the end of the process, after all the transfers were completed with success for all available tokens, the kicked member's loot are burned and the member is removed from jail - because he is not an active member anymore. Only loot are burned because the shares were already converted to loot during the `guildKick` process.

## Adapter configuration

Tokens that are provided by the member have to be allowed/supported by the DAO.

The member needs to have enough shares and/or loot in order to convert it to funds.

## Adapter state

- `GuildKickStatus`: The kick status (Not Started, In Progress, Done).
- `GuildKick`: State of the guild kick proposal
  - `memberToKick`: The address of the member to kick out of the DAO.
  - `status`: The kick status.
  - `sharesToBurn`: The number of shares of the member that should be burned.
  - `lootToBurn`: The number of loot of the member that should be burned.
  - `data`: Additional information related to the kick proposal.
  - `currentIndex`: Current iteration index to control the cached for-loop.
  - `blockNumber`: The block number in which the guild kick proposal has been created.
- `kicks`: Keeps track of all the kicks executed per DAO.
- `ongoingKicks`: Keeps track of the latest ongoing kick proposal per DAO to ensure only 1 kick happens at time.

## Dependencies and interactions (internal / external)

- BankExtension

  - checks the kicked member's balance
  - subtracts the kicked member's shares.
  - adds the burned shares to the kicked member's loot account.
  - transfers the funds from the DAO account to the kicked member's account.
  - gets the available tokens.
  - gets the historical balance of the guild account.

- DaoRegistry

  - checks if the message sender is actually a member of the DAO.
  - checks if the kicked member is actually a member of the DAO.
  - processing the kick proposal.
  - jail/unjail the kicked member

- Voting

  - starts a new voting for the kick proposal.
  - checks the voting results.

- FairShareHelper

  - to calculate the amount of funds to be returned to the member based on the provided numbers of shares and/or loot, taking into account the historical balance of the GUILD and kicked member's accounts.

## Functions description and assumptions / checks

### receive() external payable

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable
```

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

### function guildKick

```solidity
    /**
     * @notice Process the guild kick proposal, converts the member's shares into loot.
     * @notice The kicked member is put in jail, so he can not perform any other action in the DAO.
     * @dev A kick proposal must be in progress.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only active members can be kicked out.
     * @dev Only proposals that passed the voting can be completed.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     */
    function guildKick(DaoRegistry dao, bytes32 proposalId)
        external
        override
        onlyMember(dao)
```

### function rageKick

```solidity
    /**
     * @notice Transfers the funds from the Guild account to the kicked member account.
     * @notice The amount of funds is caculated using the historical balance when the proposal was created.
     * @notice loot
     * @notice The kicked member is put in jail, so he can not perform any other action in the DAO.
     * @dev A kick proposal must be in progress.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only active members can be kicked out.
     * @dev Only proposals that passed the voting can be completed.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param toIndex The index to control the cached for-loop.
     */
    function rageKick(
        DaoRegistry dao,
        bytes32 proposalId,
        uint256 toIndex
    ) external override onlyMember(dao)
```

## Events

None
