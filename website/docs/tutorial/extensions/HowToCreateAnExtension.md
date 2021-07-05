---
id: creating-an-extension
title: How to create an Extension
---

[Extensions](/docs/intro/design/extensions/introduction) are reusable smart contracts that add additional capabilities to the DAO without cluttering the core contracts with complex logic.

The key difference between an **[Adapter](/docs/tutorial/adapters/creating-an-adapter)** and an **Extension**, is that adapters are not tied to a specific DAO address, so you can use the exact same Adapter to perform actions in different DAOs. While the **Extensions** are instantiate and associated to a particular DAO, because an extension can track additional state information of that DAO, and is used as an extension of the DAO core features. It means that a Core contract is allowed to execute calls to an Extension, but not to an Adapter.

Each extension needs to be configured with the DaoRegistry **[Access Flags](/docs/contracts/core/dao-registry#access-flags)** in order to access the **[Core Contracts](/docs/intro/design/core/introduction)**, but it also can define its own Access Flags that will be required if an Adapter interacts with it.

:::tip
Extensions can defined their own Access Flags to retrict access to its functions. Any Adapter that needs to interact with the extension needs to configure the custom access flags.
:::

### Defining the Interface

The extension must implement the [IExtension](https://github.com/openlawteam/tribute-contracts/blob/master/contracts/extensions/IExtension.sol) to be able to initialize the extension and set the correct DAO address that it belongs to.

It is a good practice to always verify if the extension was not initialized, and if the creator is a DAO member, otherwise the extension creation call might be hijacked.

If your extension will be used by adapters only, you can use the `AdapterGuard` function `onlyAdapter` to check if the adapter is registered in the DAO and is allowed to call your extension.

Here is a simple implementation that performs the verification:

```solidity
contract MyExtension is DaoConstants, IExtension {
  // Internally tracks deployment under eip-1167 proxy pattern
  bool public initialized = false;

  // The DAO address that is the owner of this extension
  DaoRegistry public dao;

  /// @notice Clonable contract must have an empty constructor
  // constructor() {
  // }

  /**
   * @notice Initialises the extension to be associated with a DAO
   * @dev Can only be called once
   * @param creator The DAO's creator, who will be an initial member
   */
  function initialize(DaoRegistry _dao, address creator) external override {
    require(!initialized, "executor::already initialized");
    require(_dao.isMember(creator), "executor::not member");
    dao = _dao;
    initialized = true;
  }
}

```

:::caution
Make sure you implement the initialization function to check if the creator belongs to the DAO, and if the extension was not initialized yet.
:::

### Map out the proper Access Flags

Another important point is to map out which sort of permissions your extension will require, so other client can set that up before using it.

In order to configure the access control layer in your extension, we use the same **[Access Flags](/docs/contracts/core/access-control)** concept that we have in the Core contracts. For that we can define:

1. Which flags the extension will require.
2. The guard implementation that will verify if the caller is allowed to execute the call.

Example:

```solidity

  enum AclFlag { EXECUTE }

  modifier hasExtensionAccess(AclFlag flag) {
        require(
            // 1. Allowed if the extension is calling itself
               address(this) == msg.sender ||
            // 2. Allowed if the DAO is calling the extension
                address(dao) == msg.sender ||
            // 3. Allowed if the DAO state is in CREATION mode
                dao.state() == DaoRegistry.DaoState.CREATION ||
            // 4. Allowed if the sender is a registered adapter
                dao.hasAdapterAccessToExtension(
                    msg.sender,
                    address(this),
                    uint8(flag)
                ),
            // 5. Revert message
            "myExtension::accessDenied"
        );
        _;
    }

```

In the example above we want to allow the call execution in 4 different scenarios:

1. The extension is calling itself:

   - useful if you have some sort of proxy pattern or delegate call.

2. The DAO is calling the extension:

   - when the DAO needs to read/write info to the extension.

3. The DAO state is in CREATION mode:

   - when the DAO is configuring the new extension during the `dao.addExtension` call.

4. The sender is a registered adapter:
   - an adapter uses the extension to read/write info.

### Set up the DAO custom configurations

In some cases extensions might need customized configurations to make decisions on the fly. These configurations can and should be set per DAO. In order to do that you have to identify which configuration parameters you need, and set them up through a proposal process via **[Configuration Adapter](/docs/contracts/adapters/configuration/configuration-adapter)**. You can find an example of the usage in the **[ERC20 Extension](/docs/contracts/extensions/erc20-extension#transfer)**.

In order to access the configuration parameter in your extension you can simply call this function:

```solidity

  uint256 myConfig = dao.getConfiguration("myExtension.config.name");

```

### Be mindful of the storage costs

The extension usually saves additional state that we don't want to propagate to the DAO Registry, however it is important to try to not use the storage that much. We prefer efficient and cheap extensions that can be easily deployable and maintainable. The less state it maintains and operations it executes, the better.

### Conventions & Implementation

- Function names (public)

  - myFunctionX

- Function names (private)

  - \_myFunctionX

- Revert as early as possible

- Your extension should not accept any funds. So it is a good practice to always revert the receive call.

  ```solidity
  /**
   * @notice default fallback function to prevent from sending ether to the contract.
   */
  receive() external payable {
    revert("fallback revert");
  }

  ```

- Make sure you add the correct `require` checks

  - Usually the extension needs to perform some verifications before executing the calls that may change the DAO state. Double check if the DAORegistry functions that your extension uses already implement some checks, so you do not need to repeat them in the adapter.

- Update the DAOConstants

  - If you are creating an extension that does not have the `keccak256` id declared in the [DAOConstants](https://github.com/openlawteam/tribute-contracts/blob/master/contracts/core/DaoConstants.sol#L45) make sure you add it there.

- Add the correct function guards

  - onlyAdapter
  - hasExtensionAccess

After implemeting the functions that your extension will expose, and setting the correct guards, names, and conventions you should have, at this state, an extension code similar to the following example:

```solidity
contract MyExtension is DaoConstants, IExtension {
  // Internally tracks deployment under eip-1167 proxy pattern
  bool public initialized = false;

  // The DAO address that is the owner of this extension
  DaoRegistry public dao;

  /// @notice Clonable contract must have an empty constructor
  // constructor() {
  // }

  enum AclFlag { EXECUTE }

  modifier hasExtensionAccess(AclFlag flag) {
    require(
      // 1. Allowed if the extension is calling itself
      address(this) == msg.sender ||
        // 2. Allowed if the DAO is calling the extension
        address(dao) == msg.sender ||
        // 3. Allowed if the DAO state is in CREATION mode
        dao.state() == DaoRegistry.DaoState.CREATION ||
        // 4. Allowed if the sender is a registered adapter
        dao.hasAdapterAccessToExtension(msg.sender, address(this), uint8(flag)),
      // 5. Revert message
      "myExtension::accessDenied"
    );
    _;
  }

  /**
   * @notice default fallback function to prevent from sending ether to the contract.
   */
  receive() external payable {
    revert("fallback revert");
  }

  /**
   * @notice Initialises the extension to be associated with a DAO
   * @dev Can only be called once
   * @param creator The DAO's creator, who will be an initial member
   */
  function initialize(DaoRegistry _dao, address creator) external override {
    require(!initialized, "executor::already initialized");
    require(_dao.isMember(creator), "executor::not member");
    dao = _dao;
    initialized = true;
  }

  function myFunctionX(DaoRegistry dao, ...)
    onlyAdapter(dao)  // checks if the caller is an adapter
    hasExtensionAccess(AclFlag.EXECUTE) // checks if the caller has access to this function.
    external {
      ... impl
    }
}

```

Since the extension code is ready to be deployed, we need a way to instantiate the extension contract. For that we a CloneFactory pattern for each new extension we created, so it becomes very cheap to deploy new versions of your extensions to different DAOs because the clone happens based on the identify extension address, and all state is fresh, so there is no state sharing between different DAOs.

```solidity
contract MyExtensionFactory is CloneFactory, DaoConstants {
  address public identityAddress;

  event MyExtensionCreated(address myExtensionAddress);

  constructor(address _identityAddress) {
    identityAddress = _identityAddress;
  }

  /**
   * @notice Create and initialize a new instance of MyExtension
   * @param x1 Any parameter that you may want to set before it gets initialized.
   */
  function create(uint256 x1) external {
    MyExtension myExtension = MyExtension(_createClone(identityAddress));
    myExtension.setParamX1(x1);
    emit MyExtensionCreated(address(myExtension));
  }
}

```

The factory also needs to be declared in the

### Testing the new Extension

In order to verify if the new extension works properly, one needs to implement the basic test suite, so we can ensure it is actually doing what it was supposed to do.

There are several examples of tests that you can check to start building your own. Take a look at the **[tests/extenions](https://github.com/openlawteam/tribute-contracts/tree/master/test/extensions)**.

The general idea is to create one test suite per extension/contract. And try to cover all the happy paths first, and then add more complex and negative test cases after that.

You need to declare the new extension contract to **[ContractUtil.js](https://github.com/openlawteam/tribute-contracts/blob/master/utils/ContractUtil.js)**, so it can be accessed in the deploy/test environment.

In order to speed up the test suites we usually don't create one DAO per test function, but we create the DAO during the suite initialization, and only reset the chain after each test function using the chain snapshot feature. For instance:

```javascript
describe("Extension - ExtensionName", () => {
  /**
   * Using the utility function `deployDefaultDao` * to create the DAO before all tests are
   * executed.
   * Once the DAO is created you can access the
   * adapters, extensions, factories, testContracts
   * and votingHelpers contracts. Use the test global scope
   * to store them and access it later in the test functions.
   */
  before("deploy dao", async () => {
    const {
      dao,
      adapters,
      extensions,
      factories,
      testContracts,
      votingHelpers,
    } = await deployDefaultDao({ owner });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
  });

  /**
   * Before each test funtion we take a chain snapshot, which
   * contains the fresh DAO configurations with zero
   * modifications.
   */
  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  /**
   * After the test function is executed we revert to the
   * latest chain snapshot took when the DAO was fresh
   * installed.
   * With this approach we save time in the DAO creation,
   * and the test suite runs 10x faster.
   */
  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  /**
   * Add a descriptive name to your test function that
   * covers the use case that you are testing.
   */
  it("shoud be possible to ...", async () => {
    // Access the global scope to read the contracts you may need.
    const dao = this.dao;
    const configuration = this.adapters.configuration;
    const voting = this.adapters.voting;

    // Use openzeppelin test-env to assert results, events,and failures, e.g:
    expect(value1.toString()).equal("1");
    expectEvent(tx.receipt, "EventName", {
      eventArg1: value1,
      eventArg2: toBN("2"), //value 2
    });
    await expectRevert(
      // Calling the contract function that returns promise
      configuration.submitProposal(dao.address, "0x1", [key], [], [], {
        from: owner,
        gasPrice: toBN("0"),
      }),
      "must be an equal number of config keys and values"
    );
  });
});
```

Considering the extension that you are creating is not part of the default set of extensions, you need to declare import it, and the Factory from **[ContractUtil.js](https://github.com/openlawteam/tribute-contracts/blob/master/utils/ContractUtil.js)**, then deploy both to be able to configure the extension access flags after it is used in the test suite, but it needs to happen _before_ the DAO is finalized. When the DAO is finalized it means that the DAO initialization has been completed, so any state changes must be done though a proposal, instead of doing it through the deployment phase. Here is a simple example of an extension configurated after its creation, but before the DAO creation is finalized:

```javascript

import { MyExtensionContract, MyExtensionFactory } from 'ContractUtil';

import { entry } from 'DeploymentUtil';

describe("Extension - ExtensionName", () => {

  const entryAccessFlag = (contract, flags) => {
    const values = [
      flags.EXECUTE,
    ];

    const acl = entry(values);

    return {
      id: sha3("n/a"),
      addr: contract.address,
      flags: acl,
    };
  };

  it("should be possible to...", async () => {

    // Creating the new DAO without finalizing it
    // So you can add new adapters without going through
    // a proposal process.
    const { dao, factories, extensions } = await deployDefaultDao({
      owner: owner,
      finalize: false, // Do not finalize the DAO so you can add your extension to it
    });

    // Create and deploy the identity contract and the factory contract
    const identityExtension = await MyExtensionContract.new();
    const myExtensionFactory = await MyExtensionFactory.new(identityExtension.address);

    let x1 = 1;
    // Create your new extension instance applying the custom parameters
    await myExtensionFactory.create(x1);

    let pastEvent;
    // Check if the event was emitted to capture the new extension address
    while (pastEvent === undefined) {
      let pastEvents = await myExtensionFactory.getPastEvents();
      pastEvent = pastEvents[0];
    }
    const { myExtensionAddress } = pastEvent.returnValues;
    // Associate your extension contract to the new address
    const myExtension = await MyExtensionContract.at(myExtensionAddress);

    // Add the new extension to the DAO, this is possible because the DAO was not finalized yet.
    await dao.addExtension(sha3("myExtension"), myExtension.address, owner, {
      from: owner,
    });

    // If you have an adapter that needs access to your new Extension,
    // you can set that up using the `daoFactory.configureExtension` function:
    await factories.daoFactory.configureExtension(
      dao.address,
      myExtension.address,
      [
        entryAccessFlag(mySampleAdapter.address, {
          EXECUTE: true,  // the name of the ACL flag, that needs to be enabled.
          // The flags deleclared here must match the flags declared in your new extension.
        }),
      ],
      { from: owner }
    );

    // After the extension was configured to access the DAO,
    // and/or an Extension, you can finalize the DAO creation.
    await dao.finalizeDao({ from: owner });

    // Start your test here
    ...
  });
});
```

You may need to use an adapter to test your new extension functions that are protected with the `adapterOnly` and `hasExtensionAccess` guards, unless you have defined functions that are not restricted to adapters only.

The adapters are known as Utility Adapters, we currently have some of them to access the **[Bank](/docs/contracts/adapters/utils/bank-adapter)** and **[NFT](/docs/contracts/adapters/utils/nft-adapter)** Extensions, or you can simply modify one of the existing adapters to access your new extensions as defined in the tutorial **[How to create an adapter](/docs/tutorial/adapters/creating-an-adapter#testing-the-new-adapter)**.

### Adding documentation

Each extension must provide its own documentation describing what is the use-case it solves, what are the functions and interactions it contains. Examples of that can be found in the existing extensions documentation **[here](/docs/contracts/extensions/bank-extension)**.

### Done

If you have followed all the steps above and created a well tested, documented Extension, please submit a Pull Request to **[Tribute Contracts](https://github.com/openlawteam/tribute-contracts/pulls)**, so we can review it and provide additional feedback. Thank you!
