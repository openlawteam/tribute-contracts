## Extension description and scope

An [ERC20](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20) contract safely manages the transfers of tokens that represent the voting power of each member of the DAO.

The extension adds to the DAO the capability of managing the voting power of members and external individuals in the DAO. It does that by tracking the token transfers between DAO members, or even, transfer from members to external accounts. That enhances the DAO features by allowing individuals that are not part of the DAO receive voting rights.

## Extension state

### DaoRegistry public dao;

The DAO address that this extension belongs to

### bytes32 public constant ERC20_EXT_TRANSFER_TYPE = keccak256("erc20ExtTransferType");

The custom configuration to set the transfer type, e.g:

- 0: transfers are enabled only between dao members
- 1: transfers are enabled between dao members and external accounts
- 2: all transfers are paused

It needs to be set via a [Configuration proposal](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Configuration.md), if the proposal pass, the new configuration gets stored in the DAO. By default, only transfers between members are allowed.

### bool public initialized = false;

Internally tracks deployment under eip-1167 proxy pattern

### address public tokenAddress;

The token address managed by the DAO that tracks the internal transfers

### string public tokenName;

The name of the token managed by the DAO

### string public tokenSymbol;

The symbol of the token managed by the DAO

### uint8 public tokenDecimals;

The number of decimals of the token managed by the DAO. The default number of decimals is 0 in `utils/DeploymentUtils.js.` It is set to 0, because then the number of Units issued by the Bank Extension is tracked on a 1:1 basis with the number of tokens. For example, in the DAO issues 1 Unit to a member, then the display in a wallet such as MetaMask will be equal "1" Token. Otherwise, if the default was to the standard 18 decimals, then it would display in MetaMask as "0.000000000000000001" Token.

### mapping(address => mapping(address => uint256)) private \_allowances;

Tracks all the token allowances: owner => spender => amount

#### Access Flags

- [Bank](https://github.com/openlawteam/tribute-contracts/blob/master/docs/extensions/Bank.md):
  - `INTERNAL_TRANSFER: true`:
- [DAO](https://github.com/openlawteam/tribute-contracts/blob/master/docs/core/DaoRegistry.md):
  - `NEW_MEMBER: true`

Access Control Layer Flags - explicitly grant the extension permissions to change the bank and dao states.

## Extension functions

### function initialize

```solidity
/**
  * @notice Initializes the extension with the DAO that it belongs to,
  * and checks if the parameters were set.
  * @param _dao The address of the DAO that owns the extension.
  * @param creator The owner of the DAO and Extension that is also a member of the DAO.
  */
function initialize(DaoRegistry _dao, address creator) external override
```

### function token

```solidity
/**
  * @dev Returns the token address managed by the DAO that tracks the
  * internal transfers.
  */
function token() public view virtual returns (address)
```

### function setToken

```solidity
/**
  * @dev Sets the token address if the extension is not initialized,
  * not reserved and not zero.
  */
function setToken(address _tokenAddress) external
```

### function name

```solidity
/**
  * @dev Returns the name of the token.
  */
function name() public view virtual returns (string memory)
```

### function setName

```solidity
/**
  * @dev Sets the name of the token if the extension is not initialized.
  */
function setName(string memory _name) external
```

### function symbol

```solidity
/**
  * @dev Returns the symbol of the token, usually a shorter version of the
  * name.
  */
function symbol() public view virtual returns (string memory)
```

### function setSymbol

```solidity
/**
  * @dev Sets the token symbol if the extension is not initialized.
  */
function setSymbol(string memory _symbol) external
```

### function decimals

```solidity
/**
  * @dev Returns the number of decimals used to get its user representation.
  * For example, if `decimals` equals `2`, a balance of `505` tokens should
  * be displayed to a user as `5,05` (`505 / 10 ** 2`).
  */
function decimals() public view virtual returns (uint8)
```

### function setDecimals

```solidity
/**
  * @dev Sets the token decimals if the extension is not initialized.
  */
function setDecimals(uint8 _decimals) external
```

### function totalSupply

```solidity
/**
  * @dev Returns the amount of tokens in existence.
  */
function totalSupply() public view override returns (uint256)
```

### function balanceOf

```solidity
/**
  * @dev Returns the amount of tokens owned by `account`.
  */
function balanceOf(address account) public view override returns (uint256)
```

### function allowance

```solidity
/**
  * @dev Returns the remaining number of tokens that `spender` will be
  * allowed to spend on behalf of `owner` through {transferFrom}. This is
  * zero by default.
  *
  * This value changes when {approve} or {transferFrom} are called.
  */
function allowance(address owner, address spender)
    public
    view
    override
    returns (uint256)
```

### function approve

```solidity
/**
  * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
  * @param spender The address account that will have the units decremented.
  * @param amount The amount to decrement from the spender account.
  * @return a boolean value indicating whether the operation succeeded.
  *
  * Emits an {Approval} event.
  */
function approve(address spender, uint256 amount)
    public
    override
    reentrancyGuard(dao)
    returns (bool)
```

### function transfer

```solidity
/**
  * @dev Moves `amount` tokens from the caller's account to `recipient`.
  * @dev The transfer operation follows the DAO configuration specified
  * by the ERC20_EXT_TRANSFER_TYPE property.
  * @param recipient The address account that will have the units incremented.
  * @param amount The amount to increment in the recipient account.
  * @return a boolean value indicating whether the operation succeeded.
  *
  * Emits a {Transfer} event.
  */
function transfer(address recipient, uint256 amount)
    public
    override
    reentrancyGuard(dao)
    returns (bool)
```

### function transferFrom

```solidity
/**
  * @dev Moves `amount` tokens from `sender` to `recipient` using the
  * allowance mechanism. `amount` is then deducted from the caller's
  * allowance.
  * @dev The transfer operation follows the DAO configuration specified
  * by the ERC20_EXT_TRANSFER_TYPE property.
  * @param sender The address account that will have the units decremented.
  * @param recipient The address account that will have the units incremented.
  * @param amount The amount to decrement from the sender account.
  * @return a boolean value indicating whether the operation succeeded.
  *
  * Emits a {Transfer} event.
  */
function transferFrom(
    address sender,
    address recipient,
    uint256 amount
) public override reentrancyGuard(dao) returns (bool)
```

## Events

- `Approval`: when the sender approves a spender to transfer a certain amount.
- `Transfer`: when the transfer happens between DAO members and/or external accounts.
