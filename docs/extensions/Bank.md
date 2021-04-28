## Extension description and scope

This extension manages the funds of the DAO. The funds can be ETH or any ERC-20 token.

It also manages internal tokens such as units and loot (but could be anything else).

On top of that, it implements balance checkpoints so it is possible to retrieve prior balance at a certain block number. The balance is managed for the member address (not the delegate key).

`availableTokens` and `availableInteralTokens`, are tokens that have been whitelisted for use with the DAO. A token goes from `tokens` or `internalTokens` to `availableTokens` and `availableInternalTokens` respectively when the function `registerPotentialNewToken` or `registerPotentialNewInternalToken` is called.

## Extension state

### address[] public tokens

List of all the external tokens that are whitelisted in the bank.

### address[] public internalTokens

List of all the internal tokens that have been whitelisted / created.

### mapping(address => bool) public availableTokens

Same as the list of tokens but accessible in a random way.

### mapping(address => bool) public availableInternalTokens;

Same as the list of internal tokens but accessible in a random way.

### mapping(address => mapping(address => mapping(uint32 => Checkpoint))) public checkpoints

Checkpoints for each token / member.

### mapping(address => mapping(address => uint32)) public numCheckpoints

Checkpoint counts for each token / member.

## Functions description, assumptions, checks, dependencies, interactions and access control

### function initialize(DaoRegistry \_dao, address creator)

This function can be called only once and only by the creator of the DAO.
It registers the internal token UNITS, and gives 1 unit to the creator.

### function withdraw(address payable account, address tokenAddr, uint256 amount)

This function is only accessible if you have extension access `WITHDRAW`.

The function subtracts from the account the amount and then transfers the actual tokens to the account address.

### function isInternalToken(address token) returns (bool)

Returns true if the token address is a registered internal token.

### function isTokenAllowed(address token) returns (bool)

Returns true if the token address is a registered external token.

### function setMaxExternalTokens(uint8 maxTokens)

Sets the maximum number of external tokens managed by the Bank. It is possible to set that only if the Bank extension has not been initialized, otherwise it will fail. By default the extension can not handle more than 200 tokens - to prevent issues with block size limit.

### function registerPotentialNewToken(address token)

Whitelists a token if it is not already the case.

### function registerPotentialNewInternalToken(address token)

Whitelists an internal token if it is not already the case.

### function getToken(uint256 index) external view returns (address)

Gets the token at index in tokens.

### function nbTokens() external view returns (uint256)

Return the length of tokens.

### function getInternalToken(uint256 index) external view returns (address)

Gets the internal token at index in internalTokens.

### function nbInternalTokens() external view returns (uint256)

Return the length of internalTokens.

### function addToBalance( address member, address token, uint256 amount)

Adds to the member balance the amount in token.
This also updates the checkpoint for this member / token.

### function subtractFromBalance(address user, address token, uint256 amount)

Subtracts from the member balance the amount in token.
This also updates the checkpoint for this member / token.

### function internalTransfer( address from, address to, address token, uint256 amount)

Subtracts from the `from` address and then adds to the `to` address the amount in token.
This also updates the checkpoint for the addresses / token.

### function updateToken(address tokenAddr)

This function updates the internal bank accounting by calling the balance of the bank at the given token address.

If the real total is higher than the internal total, the internal total is updated and the difference is added to the guild bank.
If the real total is lower than the internal total then we have two cases:

- If the difference is lower than the guild bank, the difference is subtracted from the guild bank and the total is updated.
- If the difference is higher than the guild bank, the guild bank balance is set to 0 and the total is updated to subtract only what has been subtracted from the guild bank.

Usually, the second case should not happen. A proper ERC-20 should not remove tokens without a direct action from the bank extension (and we have no way to approve the token either). But it is possible that some ERC-20 tokens are dynamically changing the balance and we need to take that into account. If too many tokens are being removed from the bank by a third party, keeping it out of sync seems to make sense to avoid getting into very complex accounting and trying to figure out who should get slashed too.

If the balance changes again, calling updateToken can fix the issue.

### function balanceOf(address account, address tokenAddr) returns (uint256)

Returns the balance of a certain account for a certain token.

### function getPriorAmount(address account, address tokenAddr, uint256 blockNumber) returns (uint256)

Returns the balance of a certain account for a certain token at a certain point in time (block number).

### function \_createNewAmountCheckpoint(address member, address tokenAddr, uint256 amount)

Internal function to create a new amount checkpoint (if a balance has been updated).
