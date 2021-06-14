# How to create an Adapter

- [Introduction](#introduction)
- [Defining the Interface](#defining-the-interface)
- [Pick the right Adapter type](#pick-the-right-adapter-type)
- [Identifying the Modifiers](#identifying-the-modifiers)
- [Map out the proper Access Flags](#map-out-the-proper-access-flags)
- [Set up the DAO custom configurations](#set-up-the-dao-custom-configurations)
- [Be mindful of the storage costs](#be-mindful-of-the-storage-costs)
- [Conventions & Implementation](#conventions-&-implementation)
- [Testing the new Adapter](#testing-the-new-adapter)
- [Adding documentation](#adding-documentation)

### Introduction

[Adapters](https://github.com/openlawteam/tribute-contracts#adapters) are well defined, tested and extensible smart contracts that are created with a unique purpose. One Adapter is responsible for performing one or a set of tasks in a given context. With this approach we can develop adapters targeting specific use-cases, and update the DAO configurations to use these new adapters.

When a new adapter is created, one needs to submit a Managing proposal to add the new adapter to the DAO. Once the proposal passes, the new adapter is added and becomes available for use.

Each adapter needs to be configured with the [Access Flags](https://github.com/openlawteam/tribute-contracts#access-control-layer) in order to access the [Core Contracts](https://github.com/openlawteam/tribute-contracts#core-contracts), and/or [Extensions](https://github.com/openlawteam/tribute-contracts##extensions). Otherwise the Adapter will not able to interact with the DAO.

### Defining the Interface

The adapter must implement one or more of the available interfaces at [contracts/adapters/interfaces](https://github.com/openlawteam/tribute-contracts/tree/master/contracts/adapters/interfaces). If none of these interfaces match the use-case of your adapter, feel free to suggest a new interface.

### Pick the right Adapter type

There are two main types of adapters that serve different purposes:

- `Proposal`: writes/reads to/from the DAO state based on a proposal, and the proposal needs to pass, otherwise the DAO state changes are not applied, e.g: [GuildKick.sol](https://github.com/openlawteam/tribute-contracts/blob/master/contracts/adapters/GuildKick.sol).

  - **Example of a Proposal Adapter**

    ```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable {
      revert("fallback revert");
    }

    /**
     * @notice Explain what the function does in addition to the proposal submission.
     * @dev Describe any required states/checks/parameters that are necessary to execute the function.
     * @param dao The DAO address.
     * @param proposalId The proposal id that is managed by the client.
     * @param param1 Description of the parameter 1.
     * @param param2 Description of the parameter 2.
     * @param paramN Description of the parameter n.
     */
    function submitProposal(
      DaoRegistry dao,
      bytes32 proposalId,
      type1 param1,
      type2 param2,
      typeN paramN
    ) external override {
      // If the submission needs to be restricted by DAO members/advisors
      // it is a good practice to use the helper function from the IVoting interface.
      // Mainly because if you have an offchain voting Adapter enabled, the sender address may vary.
      IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
      address submittedBy =
        votingContract.getSenderAddress(dao, address(this), data, msg.sender);

      // Add any `required` checks here before starting the proposal submission process.
      required(pre - condition, "error message");

      // Starts the submissiosn
      _submitXProposal(dao, proposalId, param1, param2, paramN);
    }

    /**
     * @notice Explain what the submission function does, what kind of checks/validations are performed. Sometimes you may want to sponsor the proposal
     * right away in the same transaction, so you can do that at the end of the submission process, by calling the dao.sponsorProposal.
     * @dev Describe any additional checks that the function performs, e.g: only members are allowed, etc.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param param1 Description of the parameter 1.
     * @param param2 Description of the parameter 2.
     * @param paramN Description of the parameter n.
     */
    function _submitProposal(
      DaoRegistry dao,
      bytes32 proposalId,
      type1 param1,
      type2 param2,
      typeN paramN
    ) internal onlyMember2(dao, submittedBy) {
      // onlyMember2 in this case we are restricting the access to members/advisors only

      // Make sure you create the proposal in the DAO.
      // The DAO already checks if the proposal id is not a duplicate.
      dao.submitProposal(proposalId);

      // Perfom any additional checks or logic you may need.

      // If you want to sponsor the proposal right away, you need to start the voting process.
      IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
      votingContract.startNewVotingForProposal(dao, proposalId, data);

      // Finally sponsor the x proposal.
      // The DAO already checks if the proposal exists and is being sent by a member/advisor.
      dao.sponsorProposal(proposalId, submittedBy);

      // If you do want to start the voting and sponsor the proposal in the same transaction,
      // just include these 2 last calls into a new function that must be triggered in another transaction.
    }

    /**
     * @notice Explain what happens during the processProposal execution.
     * @dev Describe additional validations that are performed in the function.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
    {
        // Update the DAO state to ensure the proposal is processed
        // The DAO already checks if the proposal id exists, or was already processed,
        dao.processProposal(proposalId);

        // Checks if the proposal has passed, otherwise it should not be processed.
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal did not pass"
        );

        // Here you can update any Adapter state that you may need
        ...
    }
    ```

- `Generic`: writes/reads to/from the DAO state without a proposal, e.g: [Withdraw.sol](https://github.com/openlawteam/tribute-contracts/blob/master/contracts/adapters/Withdraw.sol).

  - **Example of a Generic Adapter**

    ```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable {
      revert("fallback revert");
    }

    /**
     * @notice Explain what the function does, if it changes the DAO state or just reads, etc.
     * @dev Describe any additional requirements/checks/configurations.
     * @param dao The DAO address.
     * @param param1 The description of the parameter 1.
     */
    function myFunction(DaoRegistry dao, type1 param1) external {
      // Add any checks / validation you may need
      require(pre - condition, "error message");

      // Instantiate any Extension that you may want to use, e.g:
      BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));

      // Using the extension
      uint256 balance = bank.balanceOf(account, token);

      // Executing a transaction that changes the Extension state.
      bank.functionToCall(param1);

      // Emit an event if needed.
      emit MyEvent(address(dao), param1);
    }

    ```

### Identifying the Modifiers

We have adapters that are accessible only to members and/or advisors of the DAO (e.g: [Ragequit.sol](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Ragequit.md)), and adapters that are open to any individual or organization, e.g: [Financing.sol](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Financing.md).

While creating the adapter try to identify which sort of users you want to grant access to. Remember that the adapters are the only way we have to alter the DAO state, so be careful with the access modifiers you use. We already have some of them implemented, take a look at the [docs/guards](https://github.com/openlawteam/tribute-contracts/blob/master/docs/guards), and feel free to suggest new ones if needed.

In addition to that, every external function in the adapter must contain the modifier `reentrancyGuard(dao)` to prevent the reentrancy attack.

### Map out the proper Access Flags

Another important point is to map out which sort of permissions your adapter needs in order to write/read data to/from the DAO. If your adapter requires an [Extension](https://github.com/openlawteam/tribute-contracts#extensions), you will also need to provide the correct [Access Flags](https://github.com/openlawteam/tribute-contracts#access-control-layer) to access that extension. Checkout which permission each flag grants: [Flag Helper](https://github.com/openlawteam/tribute-contracts/blob/master/docs/helpers/FlagHelper.md).

### Set up the DAO custom configurations

Some adapters might need customized/additional configurations to make decisions on the fly. These configurations can and should be set per DAO. In order to do that you need to identify what sort of parameters that you want to keep customizable and set them up through the [Configuration Adapter](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Configuration.md).

### Be mindful of the storage costs

The key advantage of the adapters is to make them very small and suitable to a very specific use-case. With that in mind we try to not use the storage that much. We prefer efficient and cheap adapters that can be easily deployable and maintainable. The less state it maintains and operations it executes, the better.

### Conventions & Implementation

- Function names (public)

  - For Adapter that is a Proposal type
    - submitProposal
    - processProposal

- Function names (private)

  - \_myFunction

- Revert as early as possible

- Your adapter should not accept any funds. So it is a good practice to always revert the receive call.

  ```solidity
  /**
   * @notice default fallback function to prevent from sending ether to the contract.
   */
  receive() external payable {
    revert("fallback revert");
  }

  ```

- Make sure you add the correct `require` checks

  - Usually the adapter needs to perform some verifications before executing the calls that may change the DAO state. Double check if the DAORegistry functions that your adapter uses already implement some checks, so you do not need to repeat them in the adapter.

- Update the DAOConstants

  - If you are creating an adapter that does not have the `keccak256` id declared in the [DAOConstants](https://github.com/openlawteam/tribute-contracts/blob/master/contracts/core/DaoConstants.sol#L30) make sure you add it there.

### Testing the new Adapter

In order to verify if the new adapter works properly, one needs to implement the basic test suite, so we can ensure it is actually doing what it was supposed to do.

There are several examples of tests that you can check to start building your own. Take a look at the [tests/adapters](https://github.com/openlawteam/tribute-contracts/tree/master/test/adapters).

The general idea is to create one test suite per adapter/contract. And try to cover all the happy paths first, and then add more complex test cases after that.

You need to declare the new adapter contract to `ContractUtil.js`, so it can be accessed in the deploy/test environment.

In order to speed up the test suites we usually don't create one DAO per test function, but we create the DAO during the suite initialization, and only reset the chain after each test function using the chain snapshot feature. For instance:

```javascript
describe("Adapter - AdapterName", () => {
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
  it("should be possible to set a single configuration parameter", async () => {
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

Another important step in the test phase is to configure the adapter permissions during the DAO creation in the [DAOFactory.js](https://github.com/openlawteam/tribute-contracts/blob/master/utils/DaoFactory.js#L140).

If the adapter that you are using is not part of the default set of adapters, you need to import it from `ContractUtil.js`, and deploy it, then you can configure the Adapter access flags after the adapter is created in the test suite, but before the DAO is finalized. When the DAO is finalized it means that the DAO initialization has been completed, so any state changes must be done though a proposal, instead of doing it through the deployment phase. Here is a simple example of an adapter configurated after its creation, but before the DAO is finalized:

```javascript
describe("Adapter - AdapterName2", () => {
  it("should be possible to...", async () => {

    // Creating the new DAO without finalizing it
    // So you can add new adapters without going through
    // a proposal process.
    const { dao, factories, extensions } = await deployDefaultDao({
      owner: owner,
      finalize: false,
    });

    // Creating your adapter
    const myAdapter2Contract = await MyAdapter2Contract.new();

    // Once the dao is created, use the daoFactory contract
    // to add the new adapter to the DAO with the correct
    // ACL using the `addAdapters` function:
    await factories.daoFactory.addAdapters(
      dao.address,
      // When you are creating an adapter that access the DAO
      // state, you need to provide the `entryDAO` ACL
      // from DeploymentUtil.entryDao
      [entryDao("myAdapter2", myAdapter2Contract, {
        THE_ACL_FLAG_1: true // the name of the ACL flag, that needs to be enabled.
        // for more info checkout:
        // https://github.com/openlawteam/tribute-contracts/blob/master/docs/core/DaoRegistry.md#access-flags
      })],
      { from: owner }
    );

    // If your adapter needs to access a DAO Extension,
    // you can set up your adapter to access the extension
    // using the `daoFactory.configureExtension` function:
    await factories.daoFactory.configureExtension(
      dao.address,
      myAdapter2Contract.address,
      [
        entryExecutor(myAdapter2Contract, {
          THE_ACL_FLAG_X: true,  // the name of the ACL flag, that needs to be enabled.
          // Checkout the extension documentation for more info:
          // https://github.com/openlawteam/tribute-contracts/tree/master/docs/extensions
        }),
      ],
      { from: owner }
    );

    // After the adapter was configured to access the DAO,
    // and/or an Extension, you can finalize the DAO creation.
    await dao.finalizeDao({ from: owner });

    // Start your test here
    ...
  });
});
```

### Adding documentation

Each adapter must provide its own documentation describing what is the use-case it solves, what are the functions and interactions it contains. There is a template that you can use to create the docs for your new adapter, check out the [Template.md](https://github.com/openlawteam/tribute-contracts/blob/master/docs/adapters/Template.md).

### Done

If you have followed all the steps above and created a well tested, documented Adapter, please submit a Pull Request so we can review it and provide additional feedback. Thank you!
