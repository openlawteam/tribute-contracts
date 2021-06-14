## Extension description and scope

The Executor Extension is a Proxy Contract inspired by the [OpenZeppelin Proxy](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Proxy.sol) from [OpenZeppelin](https://github.com/OpenZeppelin) team.

The common use case for [Proxy Patterns in Ethereum Blockchain](https://blog.openzeppelin.com/proxy-patterns/) is to make your contracts upgradable. This is achieved by setting up a proxy contract that allows you to call a new deployed contract as if the main logic has been upgraded. The trick here is to send the call through a Proxy contract, and use the `delegatecall` EVM instruction to redirect/delegate its the execution to the latest deployed contract logic.

When working with Proxy contract we need to take into account:

1. If you call a function that is not supported/implemented by the contract, the contract `fallback` function is trigged. You can customize your `fallback` function to handle special cases. For instance, you can make your proxy contract to use a custom `fallback` function to redirect/delegate calls to other contracts.
2. If a contract `A` delegates a call to another contract `B`, `A` executes the code of contract `B` in the context of contract `A`, so the `msg.value` and `msg.sender` values will be preserved, i.e: you will not see the address of `A` as `msg.sender` in the executed function in `B`, but you will see the actual caller address that triggered the call to contract `A`. In addition to that, the storage modifications will always be applied to the storage of contract `A`, and `B` storage remains intact even after the delegated execution.

With that in mind, we implemented the Executor Extension, which adds to the DAO the capability of executing delegated calls to another contract using the same EVM instruction `delegatecall`. The call is triggered via custom `fallback` function, which sets the `msg.sender` as the called address, and executes in the target contract identified by its address provided via `implementation` argument. For that, we can use the `fallback` function to pass the `implementation` address as the `msg.sender`, i.e: the contract `A`, in our example, will be calling itself through a proxy. This enables different use cases for proxy patterns in the Tribute DAO Framework.

Most of the time, we determine who is calling a function by checking the `msg.sender`, but supposing we want to execute calls from the DAO through different adapters directly, `msg.sender` would be the address of the adapter itself, and that is an issue because an adapter can be shared between different DAOs. In addition to that, if you want to do execute a new logic from a new adapter, the adapter address would change, hence the `msg.sender`, and there is no way to link between them.

However, when you execute the function call through the Executor Extension, suddenly the DAO has creates an identity, because the interaction with the implementation contract that triggers a new function call that will be using the `msg.sender` as the Executor address via an internal transaction, and that provides a generic proxy pattern that allows you to interact with other smart contracts with the same `msg.sender` (Executor Extension), no matter the logic implemented in the target contract.

There are some restrictions and conventions that need to be respected to make sure the calls are executed safelly:

- The caller contract, usually an Adapter, must have permission to use the extension. The permission is set through the ACL Flag: `EXECUTOR` during the Adapter configuration phase.
- The caller contract must implement the function that will be triggered by the Executor, and it needs to be restricted to the Executor address only. It can be done by adding the access guard: `executorFunc(dao)` from `AdapterGuard`.
- The caller contract can not change/upgrade it's own state/storage in the logic function (i.e: the function that will be called by the Executor). The reason for that is to prevent storage collisions with the Executor storage. Any state change must be stored in a third contract, the contract that actually manages the state changes, and that will be associated to the Executor address though an internal transaction.

With the Executor Extension we can cover new use cases, and basically execute any sort function call from the DAO to the outside world. Considering the Tribute DAO Framework architecture, the call should always go through an Adapter, because a core contract should not acess the extenal world directly, but it is fine if it relies on an Adapter. Some examples of these proxy call are:

- joining an LP from the DAO (with staking).
- joining another DAO.
- claiming money from a parent DAO.

## Extension state

### DaoRegistry public dao;

The DAO address that this extension belongs to

### bool public initialized = false;

Internally tracks deployment under eip-1167 proxy pattern

#### Access Flags

- None, it does not access the DAO Registry.

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

### function \_delegate

```solidity
/**
  * @dev Delegates the current call to `implementation`.
  *
  * This function does not return to its internall call site, it will return directly to the external caller.
  */
function _delegate(address implementation)
    internal
    virtual
    hasExtensionAccess(AclFlag.EXECUTE)
```

### function \_fallback

```solidity
/**
  * @dev Delegates the current call to the sender address.
  *
  * This function does not return to its internall call site, it will return directly to the external caller.
  */
function _fallback() internal virtual
```

### function fallback

```solidity
 /**
  * @dev Fallback function that delegates calls to the sender address. Will run if no other
  * function in the contract matches the call data.
  */
fallback() external payable
```

### function receive

```solidity
/**
  * @dev Fallback function that delegates calls to the address returned by `_implementation()`.
  */
receive() external payable
```

## Events

- No events are emitted.

## Required Access Permissions

- `EXECUTE`: to be able to execute the delegatedcall using the Executor Proxy pattern.
