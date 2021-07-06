---
id: bank-extension
title: Bank
---

The Bank extension manages the funds of the members of the DAO. The funds can be ETH or any ERC-20 token.

It also manages internal tokens such as units and loot (but could be anything else).

On top of that, it implements balance checkpoints so it is possible to retrieve prior balance at a certain block number. The balance is managed for the member address (not the delegate key).

The `availableTokens` and `availableInteralTokens`, are tokens that have been whitelisted for use within the DAO. A token goes from `tokens` or `internalTokens` to `availableTokens` and `availableInternalTokens` respectively when the function `registerPotentialNewToken` or `registerPotentialNewInternalToken` is called.

## Access Flags

- `ADD_TO_BALANCE`: right to add balance to the bank.
- `SUB_FROM_BALANCE`: right to subtract balance from the bank.
- `INTERNAL_TRANSFER`: right to internally move the funds from one account to another.
- `WITHDRAW`: right to withdraw the funds to an external wallet.
- `REGISTER_NEW_TOKEN`: right to register a new external token.
- `REGISTER_NEW_INTERNAL_TOKEN`: right to register a new internal token.
- `UPDATE_TOKEN`: right to update the extenal token balance.

## Storage

### public tokens

List of all the external tokens that are whitelisted in the bank.

### public internalTokens

List of all the internal tokens that have been whitelisted / created.

### public availableTokens

Same as the list of tokens but accessible in a random way.

### public availableInternalTokens;

Same as the list of internal tokens but accessible in a random way.

### public checkpoints

Checkpoints for each token / member.

### public numCheckpoints

Checkpoint counts for each token / member.

## Functions

### initialize

This function can be called only once and only by the creator of the DAO.
It registers the internal token UNITS, and gives 1 unit to the creator.

### withdraw

This function is only accessible if you have extension access `WITHDRAW`.

The function subtracts from the account the amount and then transfers the actual tokens to the account address.

### isInternalToken

Returns true if the token address is a registered internal token.

### isTokenAllowed

Returns true if the token address is a registered external token.

### setMaxExternalTokens

Sets the maximum number of external tokens managed by the Bank. It is possible to set that only if the Bank extension has not been initialized, otherwise it will fail. By default the extension can not handle more than 200 tokens - to prevent issues with block size limit.

### registerPotentialNewToken

Whitelists a token if it is not already the case.

### registerPotentialNewInternalToken

Whitelists an internal token if it is not already the case.

### getToken

Gets the token at index in tokens.

### nbTokens

Returns the length of tokens.

### getInternalToken

Gets the internal token at index in internalTokens.

### nbInternalTokens

Return the length of internalTokens.

### addToBalance

Adds to the member balance the amount in token.
This also updates the checkpoint for this member / token.

### subtractFromBalance

Subtracts from the member balance the amount in token.
This also updates the checkpoint for this member / token.

### internalTransfer

Subtracts from the `from` address and then adds to the `to` address the amount in token.
This also updates the checkpoint for the addresses / token.

### updateToken

This function updates the internal bank accounting by calling the balance of the bank at the given token address.

If the real total is higher than the internal total, the internal total is updated and the difference is added to the guild bank.
If the real total is lower than the internal total then we have two cases:

- If the difference is lower than the guild bank, the difference is subtracted from the guild bank and the total is updated.
- If the difference is higher than the guild bank, the guild bank balance is set to 0 and the total is updated to subtract only what has been subtracted from the guild bank.

Usually, the second case should not happen. A proper ERC-20 should not remove tokens without a direct action from the bank extension (and we have no way to approve the token either). But it is possible that some ERC-20 tokens are dynamically changing the balance and we need to take that into account. If too many tokens are being removed from the bank by a third party, keeping it out of sync seems to make sense to avoid getting into very complex accounting and trying to figure out who should get slashed too.

If the balance changes again, calling updateToken can fix the issue.

### balanceOf

Returns the balance of a certain account for a certain token.

### getPriorAmount

Returns the balance of a certain account for a certain token at a certain point in time (block number).

### \_createNewAmountCheckpoint

Internal function to create a new amount checkpoint (if a balance has been updated).

## Events

### New Balance

- `event NewBalance(address member, address tokenAddr, uint160 amount);`

### Withdraw

- `event Withdraw(address account, address tokenAddr, uint160 amount);`
