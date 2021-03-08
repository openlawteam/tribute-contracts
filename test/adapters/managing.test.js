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
  sha3,
  toBN,
  toWei,
  advanceTime,
  createDao,
  entryDao,
  getContract,
  GUILD,
  TOTAL,
  ManagingContract,
  VotingContract,
  OnboardingContract,
} = require("../../utils/DaoFactory.js");

const { expectRevert } = require("@openzeppelin/test-helpers");

contract("MolochV3 - Managing Adapter", async (accounts) => {
  it("should not be possible to send ETH to the adapter", async () => {
    const daoOwner = accounts[1];
    const dao = await createDao(daoOwner);
    const managing = await getContract(dao, "managing", ManagingContract);
    await expectRevert(
      web3.eth.sendTransaction({
        to: managing.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
      }),
      "fallback revert"
    );
  });

  it("should not be possible to propose a new adapter with more keys than values", async () => {
    const myAccount = accounts[1];
    const dao = await createDao(myAccount);
    const newAdapterId = sha3("bank");
    const managing = await getContract(dao, "managing", ManagingContract);
    await expectRevert(
      managing.submitProposal(
        dao.address,
        "0x1",
        newAdapterId,
        GUILD,
        ["0x1", "0x2", "0x3"], // 3 keys
        [], // 0 values
        0,
        { from: myAccount, gasPrice: toBN("0") }
      ),
      "must be an equal number of config keys and values"
    );
  });

  it("should not be possible to propose a new adapter with more values than keys", async () => {
    const myAccount = accounts[1];
    const dao = await createDao(myAccount);
    const newAdapterId = sha3("bank");
    const managing = await getContract(dao, "managing", ManagingContract);
    await expectRevert(
      managing.submitProposal(
        dao.address,
        "0x1",
        newAdapterId,
        GUILD,
        [], // 0 keys
        [1, 2, 3], // 3 values
        0,
        { from: myAccount, gasPrice: toBN("0") }
      ),
      "must be an equal number of config keys and values"
    );
  });

  it("should not be possible to propose a new adapter with a flag value higher than 2**128-1", async () => {
    const myAccount = accounts[1];
    const dao = await createDao(myAccount);
    const newAdapterId = sha3("bank");
    const managing = await getContract(dao, "managing", ManagingContract);
    await expectRevert(
      managing.submitProposal(
        dao.address,
        "0x1",
        newAdapterId,
        GUILD,
        [], // 0 keys
        [], // 0 values
        toBN("340282366920938463463374607431768211456"), //2**128
        { from: myAccount, gasPrice: toBN("0") }
      ),
      "flags parameter overflow"
    );
  });

  it("should not be possible to propose a new adapter using a reserved address", async () => {
    const myAccount = accounts[1];
    const dao = await createDao(myAccount);
    const newAdapterId = sha3("bank");
    const managing = await getContract(dao, "managing", ManagingContract);
    await expectRevert(
      managing.submitProposal(
        dao.address,
        "0x1",
        newAdapterId,
        GUILD,
        [],
        [],
        0,
        { from: myAccount, gasPrice: toBN("0") }
      ),
      "adapter address is reserved address"
    );

    await expectRevert(
      managing.submitProposal(
        dao.address,
        "0x0",
        newAdapterId,
        TOTAL,
        [],
        [],
        0,
        { from: myAccount, gasPrice: toBN("0") }
      ),
      "adapter address is reserved address"
    );
  });

  it("should be possible to remove an adapter if 0x0 is used as the adapter address", async () => {
    const daoOwner = accounts[1];
    const dao = await createDao(daoOwner);
    const managing = await getContract(dao, "managing", ManagingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const adapterIdToRemove = sha3("onboarding");
    let proposalId = "0x44";
    // Proposal to remove the Onboading adapter
    await managing.submitProposal(
      dao.address,
      proposalId,
      adapterIdToRemove,
      "0x0000000000000000000000000000000000000000",
      [],
      [],
      0,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

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
    assert.equal(tx[1].event, "AdapterRemoved");
    assert.equal(tx[1].returnValues.adapterId, adapterIdToRemove);
  });

  it("should be possible to propose a new DAO adapter with a delegate key", async () => {
    const myAccount = accounts[1];
    const delegateKey = accounts[3];
    const dao = await createDao(myAccount);
    const managing = await getContract(dao, "managing", ManagingContract);

    const voting = await getContract(dao, "voting", VotingContract);
    const proposalId = "0x1";
    const newAdapterId = sha3("onboarding");
    const newAdapterAddress = accounts[4];
    //Submit a new onboarding adapter proposal
    await managing.submitProposal(
      dao.address,
      proposalId,
      newAdapterId,
      newAdapterAddress,
      [],
      [],
      0,
      { from: myAccount, gasPrice: toBN("0") }
    );

    //set new delegate key
    const onboardingAddr = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddr);
    await onboarding.updateDelegateKey(dao.address, delegateKey, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Sponsor the new proposal, vote and process it
    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: delegateKey,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: delegateKey,
      gasPrice: toBN("0"),
    });
    try {
      await voting.submitVote(dao.address, proposalId, 1, {
        from: myAccount,
        gasPrice: toBN("0"),
      });
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "onlyMember");
    }
    await advanceTime(10000);
    await managing.processProposal(dao.address, proposalId, {
      from: delegateKey,
      gasPrice: toBN("0"),
    });

    //Check if the onboarding adapter was added to the Registry
    const newOnboardingAddress = await dao.getAdapterAddress(
      sha3("onboarding")
    );
    assert.equal(newOnboardingAddress.toString(), newAdapterAddress.toString());
  });

  it("should not be possible to reuse a proposal id", async () => {
    const daoOwner = accounts[1];
    const dao = await createDao(daoOwner);
    const newManaging = await ManagingContract.new();
    const newAdapterId = sha3("managing");
    const managing = await getContract(dao, "managing", ManagingContract);
    const proposalId = "0x1";
    await managing.submitProposal(
      dao.address,
      proposalId,
      newAdapterId,
      newManaging.address,
      [],
      [],
      0,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await expectRevert(
      managing.submitProposal(
        dao.address,
        proposalId,
        newAdapterId,
        newManaging.address,
        [],
        [],
        0,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "proposalId must be unique"
    );
  });

  it("should be possible to replace the managing adapter", async () => {
    const daoOwner = accounts[1];
    const dao = await createDao(daoOwner);
    const voting = await getContract(dao, "voting", VotingContract);
    const newManaging = await ManagingContract.new();
    const newAdapterId = sha3("managing");
    const managing = await getContract(dao, "managing", ManagingContract);
    const proposalId = "0x1";
    const { flags } = entryDao("managing", newManaging, {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      REPLACE_ADAPTER: true,
    });
    await managing.submitProposal(
      dao.address,
      proposalId,
      newAdapterId,
      newManaging.address,
      [],
      [],
      flags,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    let tx = await dao.getPastEvents();
    assert.equal(tx[1].event, "AdapterRemoved");
    assert.equal(tx[1].returnValues.adapterId, newAdapterId);

    assert.equal(tx[2].event, "AdapterAdded");
    assert.equal(tx[2].returnValues.adapterId, newAdapterId);
    assert.equal(tx[2].returnValues.adapterAddress, newManaging.address);
    assert.equal(tx[2].returnValues.flags, flags);

    //Check if the new adapter was added to the Registry
    const newAddress = await dao.getAdapterAddress(sha3("managing"));
    assert.equal(newAddress.toString(), newManaging.address.toString());

    // Lets try to remove the financing adapter using the new managing adapter to test its permission flags
    const newProposalId = "0x3";
    await newManaging.submitProposal(
      dao.address,
      newProposalId,
      sha3("financing"),
      "0x0000000000000000000000000000000000000000",
      [],
      [],
      0,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await newManaging.sponsorProposal(dao.address, newProposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, newProposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    advanceTime(1000);

    await newManaging.processProposal(dao.address, newProposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    tx = await dao.getPastEvents();
    assert.equal(tx[1].event, "AdapterRemoved");
    assert.equal(tx[1].returnValues.adapterId, sha3("financing"));

    await expectRevert(
      dao.getAdapterAddress(sha3("financing")),
      "adapter not found"
    );
  });

  it("should not be possible to use an adapter if it is not configured with the permission flags", async () => {
    const daoOwner = accounts[1];
    const dao = await createDao(daoOwner);
    const voting = await getContract(dao, "voting", VotingContract);
    const newManaging = await ManagingContract.new();
    const newAdapterId = sha3("managing");
    const managing = await getContract(dao, "managing", ManagingContract);
    const proposalId = "0x45";
    await managing.submitProposal(
      dao.address,
      proposalId,
      newAdapterId,
      newManaging.address,
      [],
      [],
      0, // no permissions were set
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // the new adapter is not configured, so it is fine to return an error
    await expectRevert(
      newManaging.submitProposal(
        dao.address,
        proposalId,
        newAdapterId,
        newManaging.address,
        [],
        [],
        0,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "accessDenied."
    );
  });

  it("should not be possible for a non member to propose a new adapter", async () => {
    const daoOwner = accounts[1];
    const nonMember = accounts[3];
    const dao = await createDao(daoOwner);
    const managing = await getContract(dao, "managing", ManagingContract);

    const newAdapterId = sha3("onboarding");
    const proposalId = "0x1";
    const newAdapterAddress = accounts[3];
    await expectRevert(
      managing.submitProposal(
        dao.address,
        proposalId,
        newAdapterId,
        newAdapterAddress,
        [],
        [],
        0,
        { from: nonMember, gasPrice: toBN("0") }
      ),
      "onlyMember"
    );
  });

  it("should not be possible for a non member to sponsor a proposal", async () => {
    const daoOwner = accounts[1];
    const dao = await createDao(daoOwner);
    const newVoting = await VotingContract.new();
    const newAdapterId = sha3("voting");
    const managing = await getContract(dao, "managing", ManagingContract);
    const proposalId = "0x1";
    await managing.submitProposal(
      dao.address,
      proposalId,
      newAdapterId,
      newVoting.address,
      [],
      [],
      0,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    const nonMemberAddress = accounts[5];
    await expectRevert(
      managing.sponsorProposal(dao.address, proposalId, [], {
        from: nonMemberAddress,
        gasPrice: toBN("0"),
      }),
      "onlyMember"
    );
  });

  it("should not be possible for a non member to process a proposal", async () => {
    const daoOwner = accounts[1];
    const nonMember = accounts[5];
    const dao = await createDao(daoOwner);
    const voting = await getContract(dao, "voting", VotingContract);
    const newAdapterId = sha3("voting");
    const managing = await getContract(dao, "managing", ManagingContract);
    const proposalId = "0x1";
    await managing.submitProposal(
      dao.address,
      proposalId,
      newAdapterId,
      accounts[6], //any sample address
      [],
      [],
      0,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    advanceTime(1000);

    await expectRevert(
      managing.processProposal(dao.address, proposalId, {
        from: nonMember,
        gasPrice: toBN("0"),
      }),
      "onlyMember"
    );
  });

  it("should not be possible to process a proposal if the voting did not pass", async () => {
    const daoOwner = accounts[1];
    const dao = await createDao(daoOwner);
    const voting = await getContract(dao, "voting", VotingContract);
    const newAdapterId = sha3("voting");
    const managing = await getContract(dao, "managing", ManagingContract);
    const proposalId = "0x1";
    await managing.submitProposal(
      dao.address,
      proposalId,
      newAdapterId,
      accounts[6], //any sample address
      [],
      [],
      0,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Voting NO = 2
    await voting.submitVote(dao.address, proposalId, 2, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    advanceTime(1000);

    await expectRevert(
      managing.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal did not pass"
    );
  });

  it("should not be possible to vote if the proposal was not sponsored", async () => {
    const daoOwner = accounts[1];
    const dao = await createDao(daoOwner);
    const voting = await getContract(dao, "voting", VotingContract);
    const newAdapterId = sha3("voting");
    const managing = await getContract(dao, "managing", ManagingContract);
    const proposalId = "0x1";
    await managing.submitProposal(
      dao.address,
      proposalId,
      newAdapterId,
      accounts[6], //any sample address
      [],
      [],
      0,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    // Voting NO = 2
    await expectRevert(
      voting.submitVote(dao.address, proposalId, 2, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "the proposal has not been sponsored yet"
    );
  });

  it("should not fail if the adapter id used for removal is not valid", async () => {
    const daoOwner = accounts[1];
    const dao = await createDao(daoOwner);
    const voting = await getContract(dao, "voting", VotingContract);
    const newAdapterId = sha3("invalid-id");
    const managing = await getContract(dao, "managing", ManagingContract);
    const proposalId = "0x1";
    await managing.submitProposal(
      dao.address,
      proposalId,
      newAdapterId,
      "0x0000000000000000000000000000000000000000", // 0ed address to indicate a removal operation
      [],
      [],
      0,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    advanceTime(1000);

    await managing.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
  });

  it("should not be possible to add a new adapter using an address that is already registered", async () => {
    const daoOwner = accounts[1];
    const dao = await createDao(daoOwner);
    const voting = await getContract(dao, "voting", VotingContract);
    const newAdapterId = sha3("financing");
    const managing = await getContract(dao, "managing", ManagingContract);
    const proposalId = "0x1";
    await managing.submitProposal(
      dao.address,
      proposalId,
      newAdapterId,
      voting.address, // using the voting.address as the new financing adapter address
      [],
      [],
      0,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    advanceTime(1000);

    await expectRevert(
      managing.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "adapterAddress already in use"
    );
  });
});
