---
id: creating-an-adapter
title: How to create an Adapter
---

### Introduction

**[Adapters](/docs/intro/design/adapters/introduction)** are well defined, tested and extensible smart contracts that are created with a unique purpose. One Adapter is responsible for performing one or a set of tasks in a given context. With this approach we can develop adapters targeting specific use-cases, and update the DAO configurations to use these new adapters.

When a new adapter is created, one needs to submit a Managing proposal to add the new adapter to the DAO. Once the proposal passes, the new adapter is added and becomes available for use.

Each adapter needs to be configured with the **[Access Flags](/docs/contracts/core/dao-registry#access-flags)** in order to access the **[Core Contracts](/docs/intro/design/core/introduction)**, and/or use the existing **[Extensions](/docs/intro/design/extensions/introduction#existing-extensions)**. Otherwise the Adapter will not able to interact with the DAO.

:::tip

The adapter must follow the rules defined by the **[Template Adapter](/docs/tutorial/adapters/adapter-template)**.

:::

### Defining the Interface

The adapter must implement one or more of the available interfaces at [contracts/adapters/interfaces](https://github.com/openlawteam/tribute-contracts/tree/master/contracts/adapters/interfaces). If none of these interfaces match the use-case of your adapter, feel free to suggest a new interface.

### Pick the right Adapter type

There are two main types of adapters that serve different purposes.

#### Proposal

Writes/reads to/from the DAO state based on a proposal, and the proposal needs to pass, otherwise the DAO state changes are not applied, e.g: **[GuildKick.sol](/docs/contracts/adapters/exiting/guild-kick-adapter)**.

**Example of a Proposal Adapter**

```solidity
      contract SampleContract is
        IFinancing, // Some interface
        DaoConstants,
        MemberGuard, // Guards to check if the call is coming from a member address
        AdapterGuard // Guards to prevent reentrancy
        {

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
        ) external override reentrancyGuard(dao) {
          // If the submission needs to be restricted by DAO members/advisors
          // it is a good practice to use the helper function from the IVoting interface.
          // Mainly because if you have an offchain voting Adapter enabled, the sender address may vary.
          IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
          address submittedBy =
            votingContract.getSenderAddress(dao, address(this), data, msg.sender);

          // Add any `required` checks here before starting the proposal submission process.
          required(pre - condition, "error message");

          // Starts the submission
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

          // Performing any additional checks or logic you may need.

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
            reentrancyGuard(dao)
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
    }
```

#### Generic

Writes/reads to/from the DAO state without a proposal, e.g: **[Bank Adapter](/docs/contracts/adapters/utils/bank-adapter)**.

**Example of a Generic Adapter**

```solidity
contract Sample2Contract is
  IX, // Some interface
  DaoConstants,
  MemberGuard, // Guards to check if the call is coming from a member address
  AdapterGuard // Guards to prevent reentrancy
{
  /**
   * @notice Explain what the function does, if it changes the DAO state or just reads, etc.
   * @dev Describe any additional requirements/checks/configurations.
   * @param dao The DAO address.
   * @param param1 The description of the parameter 1.
   */
  function myFunction(DaoRegistry dao, type1 param1)
    external
    reentrancyGuard(dao)
  {
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
}

```

### Identifying the Modifiers

We have adapters that are accessible only to members and/or advisors of the DAO (e.g: **[Ragequit.sol](/docs/contracts/adapters/exiting/rage-quit-adapter)**), and adapters that are open to any individual or organization, e.g: **[Financing.sol](/docs/contracts/adapters/funding/financing-adapter)**.

While creating the adapter try to identify which sort of users you want to grant access to. Remember that the adapters are the only way we have to alter the DAO state, so be careful with the access modifiers you use. We already have some of them implemented, take a look at the **[Adapter Guards](/docs/contracts/guards/adapter-guards)**, and feel free to suggest new ones if needed.

:::caution
In addition to that, every external function in the adapter must contain the guard `reentrancyGuard` to prevent the reentrancy attack.
:::

### Map out the proper Access Flags

Another important point is to map out which sort of permissions your adapter needs in order to write/read data to/from the DAO. If your adapter interacts with an **[Extension](/docs/intro/design/extensions/introduction)**, you will also need to provide the correct Access Flags to access that extension.

### Set up the DAO custom configurations

Some adapters might need customized/additional configurations to make decisions on the fly. These configurations can and should be set per DAO. In order to do that you need to identify what sort of parameters that you want to keep customizable and set them up through the **[Configuration Adapter](/docs/contracts/adapters/configuration/configuration-adapter)**.

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

- If your adapter needs configurations, please add the `configureDao` function to receive the parameters.

- Make sure you add the correct `require` checks.

- Add the `reentrancyGuard(dao)` for external functions.

- Usually the adapter needs to perform some verifications before executing the calls that may change the DAO state. Double check if the DAORegistry functions that your adapter uses already implement some checks, so you do not need to repeat them in the adapter.

### Testing the new Adapter

In order to verify if the new adapter works properly, one needs to implement the basic test suite, so we can ensure it is actually doing what it was supposed to do.

There are several examples of tests that you can check to start building your own. Take a look at the **[tests/adapters](https://github.com/openlawteam/tribute-contracts/tree/master/test/adapters)** folder.

The general idea is to create one test suite per adapter/contract. And try to cover all the happy paths first, and then add more complex test cases after that.

You need to declare the new adapter contract in `migration/configs/contracts.config.js` file, so it can be accessed in the deploy/test environment. Make sure you use following the structure:

```json
 {
    id: adaptersIdsMap.SAMPLE2_ADAPTER,
    name: "Sample2Contract",
    alias: "sample2Adapter",
    path: "../../contracts/adapters/Sample2Contract",
    enabled: true,
    version: "1.0.0",
    type: ContractType.Adapter,
    acls: {
      // Set the Flags your adapter needs to work with the DAO
      dao: [
        daoAccessFlagsMap.SUBMIT_PROPOSAL,
        daoAccessFlagsMap.SET_CONFIGURATION,
      ],
      extensions: {
        // Set the Flags your adapter needs to work with the extension
        [extensionsIdsMap.BANK_EXT]: [
          bankExtensionAclFlagsMap.ADD_TO_BALANCE,
          bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
          bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
        ],
      },
    },
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

After adding the config the file, next time you run the tests or the migration script, your new adapter will be auto deployed.

In order to speed up the test suites we usually don't create one DAO per test function, but we create the DAO during the suite initialization, and then only reset the chain after each test case using the evm snapshot feature. For instance:

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

### Adding documentation

Each adapter must provide its own documentation describing what is the use-case it solves, what are the functions and interactions it contains. There is a template that you can use to create the docs for your new adapter, check out the **[Adapter Template](/docs/tutorial/adapters/adapter-template)**.

### Done

If you have followed all the steps above and created a well tested, documented Adapter, please submit a Pull Request to **[Tribute Contracts](https://github.com/openlawteam/tribute-contracts/pulls)**, so we can review it and provide additional feedback. Thank you!
