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
  TOTAL,
  GUILD,
  sha3,
} = require("../../utils/ContractUtil.js");

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
  VotingContract,
} = require("../../utils/OZTestUtil.js");

const { entryDao } = require("../../utils/DeploymentUtil.js");

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

  it("should not be possible to send ETH to the adapter", async () => {
    const managing = this.adapters.managing;
    await expectRevert(
      web3.eth.sendTransaction({
        to: managing.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
      }),
      "Returned error: VM Exception while processing transaction: revert fallback revert"
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
          adapterId: newAdapterId,
          adapterAddress: GUILD,
          flags: 0,
        },
        ["0x1", "0x2", "0x3"], // 3 keys
        [], // 0 values
        [],
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
          adapterId: newAdapterId,
          adapterAddress: GUILD,
          flags: 0,
        },
        [], // 0 keys
        [1, 2, 3], // 3 values
        [],
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
          adapterId: newAdapterId,
          adapterAddress: GUILD,
          flags: 0,
        },
        [],
        [],
        [],
        { from: daoOwner, gasPrice: toBN("0") }
      ),
      "adapter address is reserved address"
    );

    await expectRevert(
      managing.submitProposal(
        dao.address,
        "0x0",
        {
          adapterId: newAdapterId,
          adapterAddress: TOTAL,
          flags: 0,
        },
        [],
        [],
        [],
        { from: daoOwner, gasPrice: toBN("0") }
      ),
      "adapter address is reserved address"
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
        adapterId: adapterIdToRemove,
        adapterAddress: "0x0000000000000000000000000000000000000000",
        flags: 0,
      },
      [],
      [],
      [],
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
        adapterId: newAdapterId,
        adapterAddress: newAdapterAddress,
        flags: 0,
      },
      [],
      [],
      [],
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
        adapterId: newAdapterId,
        adapterAddress: newManaging.address,
        flags: 0,
      },
      [],
      [],
      [],
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
          adapterId: newAdapterId,
          adapterAddress: newManaging.address,
          flags: 0,
        },
        [],
        [],
        [],
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
    const { flags } = entryDao("managing", newManaging.address, {
      SUBMIT_PROPOSAL: true,
      REPLACE_ADAPTER: true,
    });
    await managing.submitProposal(
      dao.address,
      proposalId,
      {
        adapterId: newAdapterId,
        adapterAddress: newManaging.address,
        flags,
      },
      [],
      [],
      [],
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
        adapterId: sha3("financing"),
        adapterAddress: "0x0000000000000000000000000000000000000000",
        flags: 0,
      },
      [],
      [],
      [],
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

  //FIXME - for some reason the adapter with flag = 0 is able to submit a proposal, but it shouldnt be possible
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
        adapterId: newAdapterId,
        adapterAddress: newManaging.address,
        flags: entryDao("managing", newManaging, {}).flags, // no permissions were set
      },
      [],
      [],
      [],
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
          adapterId: sha3("voting"),
          adapterAddress: voting.address,
          flags: 0,
        },
        [],
        [],
        [],
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
          adapterId: newAdapterId,
          adapterAddress: newAdapterAddress,
          flags: 0,
        },
        [],
        [],
        [],
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
          adapterId: newAdapterId,
          adapterAddress: newVoting.address,
          flags: 0,
        },
        [],
        [],
        [],
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
        adapterId: newAdapterId,
        adapterAddress: accounts[6], //any sample address
        flags: 0,
      },
      [],
      [],
      [],
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
        adapterId: newAdapterId,
        adapterAddress: accounts[6], //any sample address
        flags: 0,
      },
      [],
      [],
      [],
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
        adapterId: newAdapterId,
        adapterAddress: "0x0000000000000000000000000000000000000000", // 0ed address to indicate a removal operation
        flags: 0,
      },
      [],
      [],
      [],
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
        adapterId: newAdapterId,
        adapterAddress: voting.address, // using the voting.address as the new financing adapter address
        flags: 0,
      },
      [],
      [],
      [],
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
});
