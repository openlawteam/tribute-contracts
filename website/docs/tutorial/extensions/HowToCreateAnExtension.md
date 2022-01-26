---
id: creating-an-extension
title: How to create an Extension
---

[Extensions](/docs/intro/design/extensions/introduction) are reusable smart contracts that add additional capabilities to the DAO without cluttering the core contracts with complex logic.

The key difference between an **[Adapter](/docs/tutorial/adapters/creating-an-adapter)** and an **Extension**, is that adapters are not tied to a specific DAO address, so you can use the exact same Adapter to perform actions in different DAOs. While the **Extensions** are instantiate and associated to a particular DAO, because an extension can track additional state information of that DAO, and is used as an extension of the DAO core features. It means that a Core contract is allowed to execute calls to an Extension, but not to an Adapter.

Each extension needs to be configured with the DaoRegistry **[Access Flags](/docs/contracts/core/dao-registry#access-flags)** in order to access the **[Core Contracts](/docs/intro/design/core/introduction)**, but it also can define its own Access Flags that will be required if an Adapter interacts with it.

:::tip
Extensions can defined their own Access Flags to restrict access to its functions. Any Adapter that needs to interact with the extension needs to configure the custom access flags.
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
  constructor() {}

  /**
   * @notice Initializes the extension to be associated with a DAO
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
                DaoHelper.isInCreationModeAndHasAccess(dao) ||
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

- Make sure you add the correct `require` checks

  - Usually the extension needs to perform some verifications before executing the calls that may change the DAO state. Double check if the DAORegistry functions that your extension uses already implement some checks, so you do not need to repeat them in the adapter.

- Update the DaoHelper

  - If you are creating an extension that does not have the `keccak256` id declared in the [DaoHelper](https://github.com/openlawteam/tribute-contracts/blob/master/contracts/helpers/DaoHelper.sol) make sure you add it there.

- Add the correct function guards

  - onlyAdapter
  - hasExtensionAccess

After creating the functions that your extension will expose, and setting the correct guards, names, and conventions you should have, at this state, an extension code similar to the following example:

```solidity
contract MyExtension is DaoConstants, IExtension {
  // Internally tracks deployment under eip-1167 proxy pattern
  bool public initialized = false;

  // The DAO address that is the owner of this extension
  DaoRegistry public dao;

  enum AclFlag { EXECUTE }

  modifier hasExtensionAccess(AclFlag flag) {
    require(
      // 1. Allowed if the extension is calling itself
      address(this) == msg.sender ||
        // 2. Allowed if the DAO is calling the extension
        address(dao) == msg.sender ||
        // 3. Allowed if the DAO state is in CREATION mode
        DaoHelper.isInCreationModeAndHasAccess(dao) ||
        // 4. Allowed if the sender is a registered adapter
        dao.hasAdapterAccessToExtension(msg.sender, address(this), uint8(flag)),
      // 5. Revert message
      "myExtension::accessDenied"
    );
    _;
  }

  /**
   * @notice Initializes the extension to be associated with a DAO
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

There are several examples of tests that you can check to start building your own. Take a look at the **[tests/extensions](https://github.com/openlawteam/tribute-contracts/tree/master/test/extensions)**.

The general idea is to create one test suite per extension/contract. And try to cover all the happy paths first, and then add more complex and negative test cases after that.

You need to declare the new extension and factory contracts in `migrations/configs/contracts.config.js` file, so both contracts can be accessed in the deploy/test environment. Make sure you use following the structure:

```json
  {
    id: extensionsIdsMap.MY_EXTENSION,
    name: "MyExtension",
    alias: "myExt",
    path: "../../contracts/extensions/path/MyExtension",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Extension,
    buildAclFlag: entryMyExtension,
    acls: {
      dao: [],
      extensions: {},
    },
  },
  {
    id: "my-extension-factory",
    name: "MyExtensionFactory",
    alias: "myExtFactory",
    path: "../../contracts/extensions/path/MyExtensionFactory",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Factory,
    acls: {
      dao: [],
      extensions: {},
    },
    generatesExtensionId: extensionsIdsMap.MY_EXTENSION,
  },
```

The attributes of the contract configuration are defined below:

```typescript
/**
 * Each contract contains different configurations that will be required by the deployment
 * script. This type helps you to define these configs.
 */
export type ContractConfig = {
  /**
   * The id of the contract, usually it is imported from dao-ids-util.ts.
   */
  id: string;
  /**
   *  The name of the solidity contract, not the file name, but the contract itself.
   */
  name: string;
  /**
   * The javascript variable name that will be named
   * to access the contract. This is useful for variables
   * that are created during the deployment such as
   * adapters and extension. Using this alias you will be
   * able to access it in the test context,
   * e.g: adapters.<alias> will return the deployed contract.
   */
  alias?: string;
  /**
   * The path to the solidity contract.
   */
  path: string;
  /**
   * If true indicates that the contract must be deployed.
   */
  enabled: boolean;
  /**
   * Optional
   * skip auto deploy true indicates that the contract do need to be
   * automatically deployed during the migration script execution.
   * It is useful to skip the auto deploy for contracts that are not required
   * to launch a DAO, but that you manually configure them after the DAO is created,
   * but not finalized, e.g: Offchain Voting.
   */
  skipAutoDeploy?: boolean;
  /**
   * Version of the solidity contract.
   * It needs to be the name of the contract, and not the name of the .sol file.
   */
  version: string;
  /**
   * Type of the contract based on the ContractType enum.
   */
  type: ContractType;
  /**
   * The Access Control Layer flags selected to be granted to this contract in the DAO.
   */
  acls: SelectedACLs;
  /**
   * Optional
   * The function that computes the correct ACL value based on the selected ACL flags.
   */
  buildAclFlag?: ACLBuilder;
  /**
   * Optional
   * A contract may need custom arguments during the deployment time,
   * declare here all the arguments that are read from the env,
   * and passed to the configuration/deployment functions.
   * The names of the arguments must match the arguments provided
   * in the deployment script 2_deploy_contracts.js
   */
  deploymentArgs?: Array<string>;
  /**
   * Optional
   * Set of arguments to be passed to the `configureDao` call
   * after the contract has been deployment.
   */
  daoConfigs?: Array<Array<string>>;
  /**
   * Optional
   * The id of the extension generated by the factory, usually you will import that from extensionsIdsMap.
   * e.g: a BankFactory generates instances of contract BankContract, so the BankFactory config needs to
   * set the extensionsIdsMap.BANK_EXT in this attribute to indicate it generates bank contracts.
   */
  generatesExtensionId?: string;
};
```

After adding the config to the file, next time you run the tests or the migration script, your new extension will be auto deployed.

In order to speed up the test suites we usually don't create one DAO per test function, but we create the DAO during the suite initialization, and then only reset the chain after each test case using the evm snapshot feature. For instance:

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
   * Before each test function we take a chain snapshot, which
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
  it("should be possible to ...", async () => {
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

You may need to use an Adapter to test your new extension functions that are protected with the `adapterOnly` and `hasExtensionAccess` guards, you can ignore that if you have defined public functions that do not use any of these guards.

These adapters are known as Utility Adapters, we currently have some of them to access the **[Bank](/docs/contracts/adapters/utils/bank-adapter)** and **[NFT](/docs/contracts/adapters/utils/nft-adapter)** Extensions, or you can simply modify one of the existing adapters to access your new extensions as defined in the tutorial **[How to create an adapter](/docs/tutorial/adapters/creating-an-adapter#testing-the-new-adapter)**.

### Adding documentation

Each extension must provide its own documentation describing what is the use-case it solves, what are the functions and interactions it contains. Examples of that can be found in the existing extensions documentation **[here](/docs/contracts/extensions/bank-extension)**.

### Done

If you have followed all the steps above and created a well tested, documented Extension, please submit a Pull Request to **[Tribute Contracts](https://github.com/openlawteam/tribute-contracts/pulls)**, so we can review it and provide additional feedback. Thank you!
