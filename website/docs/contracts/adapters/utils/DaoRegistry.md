---
id: dao-registry-adapter
title: DAO Registry
---

The DAO Registry adapter is an utility adapter that allows members to update their own delegated keys.

It is considered a Generic adapter because it does not rely on any proposals to perform an action that changes the DAO state.

## Workflow

### Update Delegated Key

The members need send a transaction with the new key to update their own delegated keys. If the key is already in use by another member, the transaction will revert. If the key is zero, the transaction reverts as well. If the new key matches a member address, it will also revert.

## Access Flags

### DaoRegistry

- `UPDATE_DELEGATE_KEY`

## Dependencies

### DaoRegistry

### Voting

## Structs

- There are no structures.

## Storage

The adapter does not keep track of any state.

## Functions

### receive

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable
```

### updateDelegateKey

```solidity
     /**
     * @notice Allows the member/advisor to update their delegate key
     * @param dao The DAO address.
     * @param delegateKey the new delegate key.
     */
    function updateDelegateKey(DaoRegistry dao, address delegateKey)
        external
        reentrancyGuard(dao)
        onlyMember(dao)
```

## Events

### UpdateDelegateKey

When a member updates the delegated key.

- `event UpdateDelegateKey(address memberAddress, address newDelegateKey);`
