---
id: bank-adapter
title: Bank
---

The Bank adapter is an utility adapter that allows withdraws, and token balance updates.

It is considered a Generic adapter because it does not rely on any proposals to perform an action that changes the DAO state.

## Workflow

### Withdraw

The user sends a transaction to withdraw the funds from the internal bank account. If there are no available funds, the transaction is reverted. If the user is using an address that is reserved to the DAO, the transaction is also reverted. And when the user provides a token that is not supported by the bank, the balance is always zero and the transaction gets reverted as well.

If all the parameters are valid, the user should be able to identify the funds transferred to its own account.

### Balance Update

The Bank calculates the balance for a given token, and updates its internal records.

## Access Flags

### BankExtension

- `WITHDRAW`
- `SUB_FROM_BALANCE`
- `UPDATE_TOKEN`

## Dependencies

### DaoRegistry

### ERC20

### BankExtension

## Structs

- There are no structures.

## Storage

- The adapter does not keep track of any state.

## Functions

### receive

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable
```

### withdraw

```solidity
     /**
     * @notice Allows the member/advisor of the DAO to withdraw the funds from their internal bank account.
     * @notice Only accounts that are not reserved can withdraw the funds.
     * @notice If theres is no available balance in the user's account, the transaction is reverted.
     * @param dao The DAO address.
     * @param account The account to receive the funds.
     * @param token The token address to receive the funds.
     */
    function withdraw(
        DaoRegistry dao,
        address payable account,
        address token
    ) external reentrancyGuard(dao)
```

### updateToken

```solidity
    /**
     * @notice Allows anyone to update the token balance in the bank extension
     * @notice If theres is no available balance in the user's account, the transaction is reverted.
     * @param dao The DAO address.
     * @param token The token address to update.
     */
    function updateToken(DaoRegistry dao, address token)
        external
        reentrancyGuard(dao)
```

## Events

### Withdraw

When a member executes an withdraw.

- `event Withdraw(address account, address tokenAddr, uint160 amount);`

### NewBalance

When the token balance is updated in the Bank.

- `emit NewBalance(member, token, newAmount);`
