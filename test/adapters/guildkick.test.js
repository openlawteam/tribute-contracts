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

// Whole-script strict mode syntax
"use strict";
const { expect } = require("chai");
const { Contract } = require("ethers");

const {
  toBN,
  toWei,
  unitPrice,
  UNITS,
  LOOT,
  GUILD,
  ETH_TOKEN,
  sha3,
  fromAscii,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  getAccounts,
  web3,
} = require("../../utils/hardhat-test-util");

const {
  onboardingNewMember,
  submitNewMemberProposal,
  guildKickProposal,
} = require("../../utils/test-util");

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - GuildKick", () => {
  let accounts, owner;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    owner = accounts[0];

    const { dao, adapters, extensions } = await deployDefaultDao({ owner });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(this.snapshotId);
    this.snapshotId = await takeChainSnapshot();
  });

  it("should be possible to kick a DAO member", async () => {
    const newMember = accounts[2];

    const bank = this.extensions.bankExt;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      owner,
      unitPrice,
      UNITS
    );

    //Check Guild Bank Balance
    const guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("1200000000000000000");

    //Check Member Units & Loot
    let units = await bank.balanceOf(newMember, UNITS);
    expect(units.toString()).equal("10000000000000000");
    let loot = await bank.balanceOf(newMember, LOOT);
    expect(loot.toString()).equal("0");

    //SubGuildKick
    const memberToKick = newMember;
    const kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      owner,
      kickProposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: owner,
      gasPrice: toBN("0"),
    });

    // Check Member Units & Loot, it should be 0 because both were subtracted from internal
    units = await bank.balanceOf(newMember, UNITS);
    expect(units.toString()).equal("0");
    loot = await bank.balanceOf(newMember, LOOT);
    expect(loot.toString()).equal("0");
  });

  it("should not be possible for a non-member to submit a guild kick proposal", async () => {
    const nonMember = accounts[7];
    const member = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      member,
      owner,
      unitPrice,
      UNITS
    );

    // Non member attemps to submit a guild kick proposal
    const newProposalId = getProposalCounter();
    await expect(
      guildKickProposal(
        this.dao,
        this.adapters.guildkick,
        member,
        nonMember,
        newProposalId
      )
    ).to.be.revertedWith("onlyMember");
  });

  it("should not be possible for a non-active member to submit a guild kick proposal", async () => {
    const newMember = accounts[2];
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      owner,
      unitPrice,
      UNITS
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      owner,
      kickProposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // The member gets kicked out of the DAO
    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: owner,
      gasPrice: toBN("0"),
    });

    // The kicked member which is now inactive attemps to submit a kick proposal
    // to kick the member that started the previous guild kick
    const newProposalId = getProposalCounter();
    await expect(
      guildKickProposal(
        this.dao,
        this.adapters.guildkick,
        owner,
        memberToKick,
        newProposalId
      )
    ).to.be.revertedWith("onlyMember");
  });

  it("should be possible for a non-member to process a kick proposal", async () => {
    const member = owner;
    const newMemberA = accounts[2];
    const nonMember = accounts[3];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMemberA,
      owner,
      unitPrice,
      UNITS
    );

    // Start a new kick poposal
    let memberToKick = newMemberA;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: nonMember,
      gasPrice: toBN("0"),
    });
  });

  it("should not be possible to process a kick proposal that was already processed", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // The member gets kicked out of the DAO
    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // The member attempts to process the same proposal again
    await expect(
      guildkickContract.processProposal(this.dao.address, kickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("flag already set");
  });

  it("should not be possible to process a kick proposal that does not exist", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );

    // Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // The member attempts to process the same proposal again
    let invalidKickProposalId = getProposalCounter();
    await expect(
      guildkickContract.processProposal(
        this.dao.address,
        invalidKickProposalId,
        {
          from: member,
          gasPrice: toBN("0"),
        }
      )
    ).to.be.revertedWith("proposal does not exist for this dao");
  });

  it("should not be possible to process a kick proposal if the voting did not pass", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    const bank = this.extensions.bankExt;
    // Start a new kick poposal
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );

    //Vote NO on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 2, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    let memberLoot = await bank.balanceOf(memberToKick, LOOT);
    expect(memberLoot.toString()).equal("0");
    let memberUnits = await bank.balanceOf(memberToKick, UNITS);
    expect(memberUnits.toString()).equal("10000000000000000");
  });

  it("should not be possible to process a kick proposal if the member to kick does not have any units nor loot", async () => {
    const member = owner;
    const newMember = accounts[3];
    const nonMember = accounts[4];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    // New member joins as an Advisor (only receives LOOT)
    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    // The member attemps to process the kick proposal, but the Advisor does not have any UNITS, only LOOT

    await expect(
      guildKickProposal(
        this.dao,
        guildkickContract,
        nonMember,
        newMember,
        getProposalCounter()
      )
    ).to.be.revertedWith("no units or loot");
  });

  it("should not be possible for a kicked member to sponsor an onboarding proposal", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    //SubGuildKick
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Member must be inactive after the kick has happened
    let kickedMember = memberToKick;

    // Submit proposal to onboard new member
    let newMemberB = accounts[3];
    let onboardProposalId = getProposalCounter();
    await submitNewMemberProposal(
      onboardProposalId,
      member,
      onboarding,
      this.dao,
      newMemberB,
      unitPrice,
      UNITS,
      toBN(10)
    );
  });

  it("should not be possible for a kicked member to vote on in an onboarding proposal", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    // Submit guild kick proposal
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );

    // Vote YES on a kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Process guild kick proposal
    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Member must be inactive after the kick has happened
    let kickedMember = memberToKick;

    // Submit proposal to onboard new member
    let newMemberB = accounts[3];
    let onboardProposalId = getProposalCounter();
    await submitNewMemberProposal(
      onboardProposalId,
      member,
      onboarding,
      this.dao,
      newMemberB,
      unitPrice,
      UNITS,
      toBN(10)
    );

    // kicked member attemps to vote
    await expect(
      voting.submitVote(this.dao.address, onboardProposalId, 1, {
        from: kickedMember,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("onlyMember");
  });

  it("should not be possible for a kicked member to sponsor a financing proposal", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;
    const financing = this.adapters.financing;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    //SubGuildKick
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Member must be inactive after the kick has happened
    let kickedMember = memberToKick;

    // Create Financing Request, the kicked member is the applicant and it is fine for now
    let requestedAmount = toBN(50000);
    let proposalId = getProposalCounter();
    await expect(
      financing.submitProposal(
        this.dao.address,
        proposalId,
        kickedMember,
        ETH_TOKEN,
        requestedAmount,
        [],
        { from: kickedMember, gasPrice: toBN("0") }
      )
    ).to.be.revertedWith("onlyMember");
  });

  it("should not be possible for a kicked member to sponsor a financing proposal", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;
    const managing = this.adapters.managing;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    //SubGuildKick
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Member must be inactive after the kick has happened
    let kickedMember = memberToKick;

    //Submit a new Bank adapter proposal
    let newAdapterId = sha3("onboarding");
    let newAdapterAddress = accounts[8];

    // kicked member attemps to submit a managing proposal
    await expect(
      managing.submitProposal(
        this.dao.address,
        getProposalCounter(),
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
        { from: kickedMember, gasPrice: toBN("0") }
      )
    ).to.be.revertedWith("onlyMember");
  });

  it("should not be possible for a kicked member to sponsor a managing proposal", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;
    const managing = this.adapters.managing;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    //SubGuildKick
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Member must be inactive after the kick has happened
    let kickedMember = memberToKick;

    const proposalId = getProposalCounter();
    //Submit a new Bank adapter proposal
    let newadapterId = sha3("onboarding");
    let newadapterAddress = accounts[3]; //TODO deploy some Banking test contract
    await expect(
      managing.submitProposal(
        this.dao.address,
        proposalId,
        {
          adapterOrExtensionId: newadapterId,
          adapterOrExtensionAddr: newadapterAddress,
          updateType: 1,
          flags: 0,
          keys: [],
          values: [],
          extensionAddresses: [],
          extensionAclFlags: [],
        },
        [], //configs
        [], //data
        { from: kickedMember, gasPrice: toBN("0") }
      )
    ).to.be.revertedWith("onlyMember");
  });

  it("should be possible to process a ragekick to return the funds to the kicked member", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;
    const bank = this.extensions.bankExt;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    // Submit GuildKick
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Process guild kick to remove the voting power of the kicked member
    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // The kicked member should not have LOOT & UNITS anymore
    let memberLoot = await bank.balanceOf(memberToKick, LOOT);
    expect(memberLoot.toString()).equal("0");
    let memberUnits = await bank.balanceOf(memberToKick, UNITS);
    expect(memberUnits.toString()).equal("0");

    // The kicked member must receive the funds in ETH_TOKEN after the ragekick was triggered by a DAO member
    let memberEthToken = await bank.balanceOf(memberToKick, ETH_TOKEN);
    expect(memberEthToken.toString()).equal("1199999999999999880");
  });

  it("should not be possible to process a ragekick if the batch index is smaller than the current processing index", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    // Submit GuildKick
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Process guild kick to remove the voting power of the kicked member
    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });
  });

  it("should not be possible to submit a guild kick to kick yourself", async () => {
    const member = owner;
    const guildkickContract = this.adapters.guildkick;

    // Attempt to kick yourself
    let memberToKick = member;
    await expect(
      guildKickProposal(
        this.dao,
        guildkickContract,
        memberToKick,
        member,
        getProposalCounter()
      )
    ).to.be.revertedWith("use ragequit");
  });

  it("should not be possible to reuse the kick proposal id", async () => {
    const memberA = owner;
    const memberB = accounts[3];
    const memberC = accounts[5];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      memberB,
      memberA,
      unitPrice,
      UNITS
    );
    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      memberC,
      memberA,
      unitPrice,
      UNITS
    );

    // Submit the first guild kick with proposalId 0x1
    const kickProposalId = getProposalCounter();
    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberB,
      memberA,
      kickProposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: memberA,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: memberA,
      gasPrice: toBN("0"),
    });

    // Submit the first guild kick with proposalId 0x1
    await expect(
      guildKickProposal(
        this.dao,
        guildkickContract,
        memberC,
        memberA,
        kickProposalId
      )
    ).to.be.revertedWith("proposalId must be unique");
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.guildkick;
    await expect(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: owner,
        gasPrice: toBN("0"),
        value: toWei("1"),
      })
    ).to.be.revertedWith("revert");
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const adapter = this.adapters.guildkick;
    await expect(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: owner,
        gasPrice: toBN("0"),
        value: toWei("1"),
        data: fromAscii("should go to fallback func"),
      })
    ).to.be.revertedWith("revert");
  });

  it("a guildick proposal should put the member in jail and therefore not let him move assets", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      getProposalCounter(),
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      unitPrice,
      UNITS
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let kickProposalId = getProposalCounter();

    const { erc20Ext } = this.extensions;

    const erc20 = new Contract(
      erc20Ext.address,
      erc20Ext.abi,
      await hre.ethers.getSigner(newMember)
    );

    await erc20.transfer(owner, 1, { from: memberToKick });

    await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member,
      kickProposalId
    );
    await expect(
      erc20.transfer(owner, 1, { from: memberToKick })
    ).to.be.revertedWith("no transfer from jail");

    //Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 2, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // The member gets kicked out of the DAO
    await guildkickContract.processProposal(this.dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Transfer is possible again!
    await erc20.transfer(owner, 1, { from: memberToKick });
  });
});
