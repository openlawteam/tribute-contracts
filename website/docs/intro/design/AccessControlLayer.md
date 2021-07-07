---
id: access-control
title: Access Control Layer
---

The Access Control Layer (ACL) is implemented using Access Flags to indicate which permissions an Adapter must have in order to access and modify the DAO state.

A flag is essentially 1 bit of a 256 bits array controlled by two helper functions defined in the DAO Constants Contract.

In order to enable an access flag, one must compute the flag value using the `setFlag` function:

```solidity
function setFlag(
  uint256 flags,
  uint256 flag,
  bool value
) public pure returns (uint256) {
  if (getFlag(flags, flag) != value) {
    if (value) {
      return flags + 2**flag;
    } else {
      return flags - 2**flag;
    }
  } else {
    return flags;
  }
}

```

Read the value of the flag to check if it is enabled or not. Use the `getFlag` helper function:

```solidity
function getFlag(uint256 flags, uint256 flag) public pure returns (bool) {
  return (flags >> uint8(flag)) % 2 == 1;
}

```

The Access Flags are defined in the **[DAO Registry Contract](/docs/contracts/core/dao-registry#access-flags)** use the modifier `hasAccess`. That's a common pattern that you can also use. For example, suposing you created an Adapter that calls the DAO Registry function `potentialNewMember`, this function uses the modifier `hasAccess(this, AclFlag.NEW_MEMBER)`, it means that your Adapter needs to be configured with the Access Flag `NEW_MEMBER`, otherwise the call will revert.

:::important

The Access Flags of each Adapter must be provided to the DAOFactory when the `daoFactory.addAdapters` function is called. These flags will grant the access to the DAO Registry contract, and the same process must be done to grant the access of each Adapter to the Extensions it may use (function`daoFactory.configureExtension`).

:::

In order to create an Adapter with the proper Access Flags one needs to first map out all the functions that the Adapter will be calling in the DAO Registry and/or Extensions, and provide these Access Flags using the DAO Factory as described above.

:::tip

Each Extension defines its own Access Flags. Checkout the documentation of the **[existing Extensions](/docs/intro/design/extensions/introduction#existing-extensions)** to make sure you configured your adapters with the correct flags.

:::
