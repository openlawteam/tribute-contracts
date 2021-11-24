// Whole-script strict mode syntax
"use strict";

/**
MIT License

Copyright (c) 2020 Openlaw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
const {
  toBN,
  toWei,
  sha3,
  fromAscii,
  TOTAL,
  GUILD,
  ZERO_ADDRESS,
  DAI_TOKEN,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  accounts,
  expect,
  expectRevert,
  web3,
  DaoRegistryAdapterContract,
  ManagingContract,
  FinancingContract,
  ERC1271Extension,
  VotingContract,
  NFTExtension,
} = require("../../utils/oz-util");

const {
  bankExtensionAclFlagsMap,
  daoAccessFlagsMap,
  entryDao,
  entryBank,
} = require("../../utils/access-control-util");

const { extensionsIdsMap } = require("../../utils/dao-ids-util");

const daoOwner = accounts[1];
const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Managing", () => {
  before("deploy dao", async () => {
    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
    });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(this.snapshotId);
    this.snapshotId = await takeChainSnapshot();
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const managing = this.adapters.managing;
    await expectRevert(
      web3.eth.sendTransaction({
        to: managing.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
      }),
      "revert"
    );
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const managing = this.adapters.managing;
    await expectRevert(
      web3.eth.sendTransaction({
        to: managing.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
        data: fromAscii("should go to fallback func"),
      }),
      "revert"
    );
  });

  it("should not be possible to propose a new adapter with more keys than values", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const newAdapterId = sha3("bank");

    await expectRevert(
      managing.submitProposal(
        dao.address,
        "0x1",
        {
          adapterOrExtensionId: newAdapterId,
          adapterOrExtensionAddr: GUILD,
          updateType: 1,
          flags: 0,
          keys: [
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            "0x0000000000000000000000000000000000000000000000000000000000000004",
          ], // 3 keys
          values: [], // 0 values
          extensionAddresses: [],
          extensionAclFlags: [],
        },
        [], //configs
        [], //data
        { from: daoOwner, gasPrice: toBN("0") }
      ),
      "must be an equal number of config keys and values"
    );
  });

  it("should not be possible to propose a new adapter with more values than keys", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const newAdapterId = sha3("bank");
    await expectRevert(
      managing.submitProposal(
        dao.address,
        "0x1",
        {
          adapterOrExtensionId: newAdapterId,
          adapterOrExtensionAddr: GUILD,
          updateType: 1,
          flags: 0,
          keys: [], // 0 keys
          values: [1, 2, 3], // 3 values
          extensionAddresses: [],
          extensionAclFlags: [],
        },
        [], //configs
        [], //data
        { from: daoOwner, gasPrice: toBN("0") }
      ),
      "must be an equal number of config keys and values"
    );
  });

  it("should not be possible to propose a new adapter using a reserved address", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const newAdapterId = sha3("bank");
    await expectRevert(
      managing.submitProposal(
        dao.address,
        "0x1",
        {
          adapterOrExtensionId: newAdapterId,
          adapterOrExtensionAddr: GUILD,
          updateType: 1,
          flags: 0,
          keys: [], // 0 keys
          values: [], // 3 values
          extensionAddresses: [],
          extensionAclFlags: [],
        },
        [], //configs
        [], //data
        { from: daoOwner, gasPrice: toBN("0") }
      ),
      "address is reserved"
    );

    await expectRevert(
      managing.submitProposal(
        dao.address,
        "0x0",
        {
          adapterOrExtensionId: newAdapterId,
          adapterOrExtensionAddr: TOTAL,
          updateType: 1,
          flags: 0,
          keys: [], // 0 keys
          values: [], // 3 values
          extensionAddresses: [],
          extensionAclFlags: [],
        },
        [], //configs
        [], //data
        { from: daoOwner, gasPrice: toBN("0") }
      ),
      "address is reserved"
    );
  });

  it("should be possible to remove an adapter if 0x0 is used as the adapter address", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;
    const adapterIdToRemove = sha3("onboarding");
    let proposalId = getProposalCounter();
    // Proposal to remove the Onboading adapter
    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: adapterIdToRemove,
        adapterOrExtensionAddr: ZERO_ADDRESS,
        updateType: 1,
        flags: 0,
        keys: [], // 0 keys
        values: [], // 3 values
        extensionAddresses: [],
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    let tx = await dao.getPastEvents();

    //Check if the adapter was removed from the Registry
    await expectRevert(
      dao.getAdapterAddress(sha3("onboarding")),
      "adapter not found"
    );
    expect(tx[1].event).equal("AdapterRemoved");
    expect(tx[1].returnValues.adapterId).equal(adapterIdToRemove);
  });

  it("should be possible to propose a new DAO adapter with a delegate key", async () => {
    const delegateKey = accounts[3];
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;
    const proposalId = getProposalCounter();
    const newAdapterId = sha3("onboarding");
    const newAdapterAddress = accounts[4];
    //Submit a new onboarding adapter proposal
    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newAdapterId,
        adapterOrExtensionAddr: newAdapterAddress,
        updateType: 1,
        flags: 0,
        keys: [], // 0 keys
        values: [], // 3 values
        extensionAddresses: [],
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      { from: daoOwner, gasPrice: toBN("0") }
    );

    //set new delegate key
    const daoRegistryAdapterAddress = await dao.getAdapterAddress(
      sha3("daoRegistry")
    );
    const daoRegistryAdapter = await DaoRegistryAdapterContract.at(
      daoRegistryAdapterAddress
    );

    await daoRegistryAdapter.updateDelegateKey(dao.address, delegateKey, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    //Sponsor the new proposal, vote and process it
    await voting.submitVote(dao.address, proposalId, 1, {
      from: delegateKey,
      gasPrice: toBN("0"),
    });

    // The same member attempts to vote again
    await expectRevert(
      voting.submitVote(dao.address, proposalId, 1, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "member has already voted"
    );

    await advanceTime(10000);
    await managing.processProposal(dao.address, proposalId, {
      from: delegateKey,
      gasPrice: toBN("0"),
    });

    //Check if the onboarding adapter was added to the Registry
    const newOnboardingAddress = await dao.getAdapterAddress(
      sha3("onboarding")
    );
    expect(newOnboardingAddress.toString()).equal(newAdapterAddress.toString());
  });

  it("should not be possible to reuse a proposal id", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const newManaging = await ManagingContract.new();
    const newAdapterId = sha3("managing");
    const proposalId = getProposalCounter();
    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newAdapterId,
        adapterOrExtensionAddr: newManaging.address,
        updateType: 1,
        flags: 0,
        keys: [],
        values: [],
        extensionAddresses: [],
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await expectRevert(
      managing.submitProposal(
        dao.address,
        proposalId,
        {
          adapterOrExtensionId: newAdapterId,
          adapterOrExtensionAddr: newManaging.address,
          updateType: 1,
          flags: 0,
          keys: [],
          values: [],
          extensionAddresses: [],
          extensionAclFlags: [],
        },
        [], //configs
        [], //data
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "proposalId must be unique"
    );
  });

  it("should be possible to replace the managing adapter", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;
    const newManaging = await ManagingContract.new();
    const newAdapterId = sha3("managing");
    const proposalId = getProposalCounter();
    const { flags } = entryDao(newAdapterId, newManaging.address, {
      dao: [
        daoAccessFlagsMap.SUBMIT_PROPOSAL,
        daoAccessFlagsMap.REPLACE_ADAPTER,
      ],
    });
    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newAdapterId,
        adapterOrExtensionAddr: newManaging.address,
        updateType: 1,
        flags,
        keys: [],
        values: [],
        extensionAddresses: [],
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    let tx = await dao.getPastEvents();
    expect(tx[1].event).equal("AdapterRemoved");
    expect(tx[1].returnValues.adapterId).equal(newAdapterId);

    expect(tx[2].event).equal("AdapterAdded");
    expect(tx[2].returnValues.adapterId).equal(newAdapterId);
    expect(tx[2].returnValues.adapterAddress).equal(newManaging.address);
    expect(tx[2].returnValues.flags).equal(flags.toString());

    //Check if the new adapter was added to the Registry
    const newAddress = await dao.getAdapterAddress(sha3("managing"));
    expect(newAddress.toString()).equal(newManaging.address.toString());

    // Lets try to remove the financing adapter using the new managing adapter to test its permission flags
    const newProposalId = "0x3";
    await newManaging.submitProposal(
      dao.address,
      newProposalId,
      {
        adapterOrExtensionId: sha3("financing"),
        adapterOrExtensionAddr: ZERO_ADDRESS,
        updateType: 1,
        flags: 0,
        keys: [],
        values: [],
        extensionAddresses: [],
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, newProposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(1000);

    await newManaging.processProposal(dao.address, newProposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    tx = await dao.getPastEvents();
    expect(tx[1].event).equal("AdapterRemoved");
    expect(tx[1].returnValues.adapterId).equal(sha3("financing"));

    await expectRevert(
      dao.getAdapterAddress(sha3("financing")),
      "adapter not found"
    );
  });

  it("should not be possible to use an adapter if it is not configured with the permission flags", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;

    const newManaging = await ManagingContract.new();
    const newAdapterId = sha3("managing");

    const proposalId = getProposalCounter();
    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newAdapterId,
        adapterOrExtensionAddr: newManaging.address,
        updateType: 1,
        flags: entryDao(newAdapterId, newManaging.address, {
          dao: [], // no permissions were set
          extensions: {}, // no permissions were set
        }).flags,
        keys: [],
        values: [],
        extensionAddresses: [],
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // the new adapter is not configured with the correct access flags, so it must return an error
    const newProposalId = getProposalCounter();
    await expectRevert(
      newManaging.submitProposal(
        dao.address,
        newProposalId,
        {
          adapterOrExtensionId: sha3("voting"),
          adapterOrExtensionAddr: voting.address,
          updateType: 1,
          flags: 0,
          keys: [],
          values: [],
          extensionAddresses: [],
          extensionAclFlags: [],
        },
        [], //configs
        [], //data
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "accessDenied"
    );
  });

  it("should not be possible for a non member to propose a new adapter", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const nonMember = accounts[3];

    const newAdapterId = sha3("onboarding");
    const proposalId = getProposalCounter();
    const newAdapterAddress = accounts[3];
    await expectRevert(
      managing.submitProposal(
        dao.address,
        proposalId,
        {
          adapterOrExtensionId: newAdapterId,
          adapterOrExtensionAddr: newAdapterAddress,
          updateType: 1,
          flags: 0,
          keys: [],
          values: [],
          extensionAddresses: [],
          extensionAclFlags: [],
        },
        [], //configs
        [], //data
        { from: nonMember, gasPrice: toBN("0") }
      ),
      "onlyMember"
    );
  });

  it("should not be possible for a non member to submit a proposal", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const nonMemberAddress = accounts[5];
    const newVoting = await VotingContract.new();
    const newAdapterId = sha3("voting");

    const proposalId = getProposalCounter();
    await expectRevert(
      managing.submitProposal(
        dao.address,
        proposalId,
        {
          adapterOrExtensionId: newAdapterId,
          adapterOrExtensionAddr: newVoting.address,
          updateType: 1,
          flags: 0,
          keys: [],
          values: [],
          extensionAddresses: [],
          extensionAclFlags: [],
        },
        [], //configs
        [], //data
        {
          from: nonMemberAddress,
          gasPrice: toBN("0"),
        }
      ),
      "onlyMember"
    );
  });

  it("should be possible for a non member to process a proposal", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;

    const nonMember = accounts[5];
    const newAdapterId = sha3("voting");
    const proposalId = getProposalCounter();
    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newAdapterId,
        adapterOrExtensionAddr: accounts[6], //any sample address
        updateType: 1,
        flags: 0,
        keys: [],
        values: [],
        extensionAddresses: [],
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: nonMember,
      gasPrice: toBN("0"),
    });

    const processedFlag = 2;
    expect(await dao.getProposalFlag(proposalId, processedFlag)).equal(true);
  });

  it("should not be possible to process a proposal if the voting did not pass", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;
    const newAdapterId = sha3("voting");
    const proposalId = getProposalCounter();
    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newAdapterId,
        adapterOrExtensionAddr: accounts[6], //any sample address
        updateType: 1,
        flags: 0,
        keys: [],
        values: [],
        extensionAddresses: [],
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    // Voting NO = 2
    await voting.submitVote(dao.address, proposalId, 2, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(1000);

    await expectRevert(
      managing.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal did not pass"
    );
  });

  it("should not fail if the adapter id used for removal is not valid", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;
    const newAdapterId = sha3("invalid-id");
    const proposalId = getProposalCounter();
    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newAdapterId,
        adapterOrExtensionAddr: ZERO_ADDRESS, // 0 address to indicate a removal operation
        updateType: 1,
        flags: 0,
        keys: [],
        values: [],
        extensionAddresses: [],
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
  });

  it("should not be possible to add a new adapter using an address that is already registered", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;
    const newAdapterId = sha3("financing");
    const proposalId = getProposalCounter();
    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newAdapterId,
        adapterOrExtensionAddr: voting.address, // using the voting.address as the new financing adapter address
        updateType: 1,
        flags: 0,
        keys: [],
        values: [],
        extensionAddresses: [],
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(1000);

    await expectRevert(
      managing.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "adapterAddress already in use"
    );
  });

  it("should be possible to add a new adapter and set the acl flags for some extension", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;
    const financing = await FinancingContract.new();
    const bankExt = this.extensions.bankExt;

    const newAdapterId = sha3("testFinancing");
    const newAdapterAddress = financing.address;
    const proposalId = getProposalCounter();

    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newAdapterId,
        adapterOrExtensionAddr: newAdapterAddress,
        updateType: 1,
        flags: 0,
        keys: [],
        values: [],
        // Set the extension address which will be accessed by the new adapter
        extensionAddresses: [bankExt.address],
        // Set the acl flags so the new adapter can access the bank extension
        extensionAclFlags: [
          entryBank(financing.address, {
            extensions: {
              [extensionsIdsMap.BANK_EXT]: [
                bankExtensionAclFlagsMap.ADD_TO_BALANCE,
                bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
                bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
              ],
            },
          }).flags,
        ],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // At this point the adapter should be able access the Bank Extension
    // We check that by verifying if the ACL flag in the DAO matches the one
    // submitted in the proposal.

    /**
     * Bank flags
     * 0: ADD_TO_BALANCE
     * 1: SUB_FROM_BALANCE
     * 2: INTERNAL_TRANSFER
     * 3: WITHDRAW
     * 4: REGISTER_NEW_TOKEN
     * 5: REGISTER_NEW_INTERNAL_TOKEN
     * 6: UPDATE_TOKEN
     */
    expect(await dao.getAdapterAddress(newAdapterId)).equal(newAdapterAddress);
    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        0 //ADD_TO_BALANCE
      )
    ).equal(true);
    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        1 // SUB_FROM_BALANCE
      )
    ).equal(true);
    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        2 // INTERNAL_TRANSFER
      )
    ).equal(true);

    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        3 // WITHDRAW
      )
    ).equal(false);

    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        4 // REGISTER_NEW_TOKEN
      )
    ).equal(false);

    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        5 // REGISTER_NEW_INTERNAL_TOKEN
      )
    ).equal(false);

    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        6 // UPDATE_TOKEN
      )
    ).equal(false);
  });

  it("should be possible to add a new adapter with DAO configs", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;
    const financing = await FinancingContract.new();
    const bankExt = this.extensions.bankExt;

    const newAdapterId = sha3("testFinancing");
    const newAdapterAddress = financing.address;
    const proposalId = getProposalCounter();

    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newAdapterId,
        adapterOrExtensionAddr: newAdapterAddress,
        updateType: 1,
        flags: 0,
        keys: [],
        values: [],
        // Set the extension address which will be accessed by the new adapter
        extensionAddresses: [bankExt.address],
        // Set the acl flags so the new adapter can access the bank extension
        extensionAclFlags: [
          entryBank(financing, {
            ADD_TO_BALANCE: true,
            SUB_FROM_BALANCE: true,
            INTERNAL_TRANSFER: true,
          }).flags,
        ],
      },
      [
        {
          key: sha3("some.numeric.config"),
          numericValue: 32,
          addressValue: ZERO_ADDRESS,
          configType: 0, //NUMERIC
        },
        {
          key: sha3("some.address.config"),
          numericValue: 0,
          addressValue: DAI_TOKEN,
          configType: 1, //ADDRESS
        },
      ], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    expect(await dao.getAdapterAddress(newAdapterId)).equal(newAdapterAddress);
    const numericConfig = await dao.getConfiguration(
      sha3("some.numeric.config")
    );
    expect(numericConfig.toString()).equal("32");
    const addressConfig = await dao.getAddressConfiguration(
      sha3("some.address.config")
    );
    expect(addressConfig.toLowerCase()).equal(DAI_TOKEN);
  });

  it("should be possible to add a new extension", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;
    const erc1171Ext = await ERC1271Extension.new();

    const newExtensionId = sha3("testNewExtension");
    const newExtensionAddr = erc1171Ext.address;
    const proposalId = getProposalCounter();

    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newExtensionId,
        adapterOrExtensionAddr: newExtensionAddr,
        updateType: 2, // 1 = Adapter, 2 = Extension
        flags: 0,
        keys: [],
        values: [],
        // Set the extension address which will be accessed by the new adapter
        extensionAddresses: [],
        // Set the acl flags so the new adapter can access the bank extension
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    expect(await dao.getExtensionAddress(newExtensionId)).equal(
      newExtensionAddr
    );
  });

  it("should be possible to add a new extension with DAO configs", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;
    const nftExt = await NFTExtension.new();

    const newExtensionId = sha3("testNewExtension");
    const newExtensionAddr = nftExt.address;
    const proposalId = getProposalCounter();

    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: newExtensionId,
        adapterOrExtensionAddr: newExtensionAddr,
        updateType: 2, // 1 = Adapter, 2 = Extension
        flags: 0,
        keys: [],
        values: [],
        // Set the extension address which will be accessed by the new adapter
        extensionAddresses: [],
        // Set the acl flags so the new adapter can access the bank extension
        extensionAclFlags: [],
      },
      [
        {
          key: sha3("some.numeric.config"),
          numericValue: 32,
          addressValue: ZERO_ADDRESS,
          configType: 0, //NUMERIC
        },
        {
          key: sha3("some.address.config"),
          numericValue: 0,
          addressValue: DAI_TOKEN,
          configType: 1, //ADDRESS
        },
      ], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    expect(await dao.getExtensionAddress(newExtensionId)).equal(
      newExtensionAddr
    );
    const numericConfig = await dao.getConfiguration(
      sha3("some.numeric.config")
    );
    expect(numericConfig.toString()).equal("32");
    const addressConfig = await dao.getAddressConfiguration(
      sha3("some.address.config")
    );
    expect(addressConfig.toLowerCase()).equal(DAI_TOKEN);
  });

  it("should be possible to remove an extension", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;
    const bankExt = this.extensions.bankExt;

    const removeExtensionId = sha3("bank");
    // Use 0 address to indicate we don't want to add, it is just a removal
    const removeExtensionAddr = ZERO_ADDRESS;
    const proposalId = getProposalCounter();

    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: removeExtensionId,
        adapterOrExtensionAddr: removeExtensionAddr,
        updateType: 2, // 1 = Adapter, 2 = Extension
        flags: 0,
        keys: [],
        values: [],
        // Set the extension address which will be accessed by the new adapter
        extensionAddresses: [],
        // Set the acl flags so the new adapter can access the bank extension
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await expectRevert(
      dao.getExtensionAddress(removeExtensionAddr),
      "extension not found"
    );
  });

  it("should revert if UpdateType is unknown", async () => {
    const dao = this.dao;
    const managing = this.adapters.managing;
    const voting = this.adapters.voting;

    const removeExtensionId = sha3("bank");
    // Use 0 address to indicate we don't want to add, it is just a removal
    const removeExtensionAddr = ZERO_ADDRESS;
    const proposalId = getProposalCounter();

    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterOrExtensionId: removeExtensionId,
        adapterOrExtensionAddr: removeExtensionAddr,
        updateType: 0, //0 = Unknown 1 = Adapter, 2 = Extension
        flags: 0,
        keys: [],
        values: [],
        // Set the extension address which will be accessed by the new adapter
        extensionAddresses: [],
        // Set the acl flags so the new adapter can access the bank extension
        extensionAclFlags: [],
      },
      [], //configs
      [], //data
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(1000);

    await expectRevert(
      managing.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "unknown update type"
    );
  });
});
