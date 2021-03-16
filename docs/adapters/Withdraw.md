## Adapter description and scope

The Withdraw adapter allows a member or an advisor of the DAO to withdraw the available funds in their bank account.

It is considered a Generic adapter because it does not rely on any proposals to perform an action that changes the DAO state.

## Adapter workflow

The user sends a transaction to withdraw the funds from the internal bank account. If there are no available funds, the transaction is reverted. If the user is using an address that is reserved to the DAO, the transaction is also reverted. And when the user provides a token that is not supported by the bank, the balance is always zero and the transaction gets reverted as well.

If all the parameters are valid, the user should be able to identify the funds transferred to its own account.

## Adapter configuration

Bank Extension Access Flags: `WITHDRAW`, `SUB_FROM_BALANCE`.

## Adapter state

The adapter does not keep track of any state during the withdraw process.

## Dependencies and interactions (internal / external)

BankExtension

- Checks the account balance.
- Executes the withdraw process.

DAORegistry

- Checks if the account address is not a reserved address.

## Functions description and assumptions / checks

### receive() external payable

```solidity
    /**
    * @notice default fallback function to prevent from sending ether to the contract
    */
    receive() external payable
```

### function withdraw

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
    ) external
```

## Events

No events are emitted from this adapter.
