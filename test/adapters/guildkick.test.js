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

const {
  toBN,
  fromUtf8,
  advanceTime,
  deployDefaultDao,
  sha3,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  accounts,
  sharePrice,
  GUILD,
  ETH_TOKEN,
  SHARES,
  LOOT,
  expect,
  expectRevert
} = require("../../utils/DaoFactory.js");

describe("Adapter - GuildKick", () => {
  const owner = accounts[1];
  const proposalCounter = proposalIdGenerator().generator;

  const getProposalCounter = () => {
    return proposalCounter().next().value;
  };

  beforeAll(async () => {
    const { dao, adapters, extensions } = await deployDefaultDao(owner);
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  const submitNewMemberProposal = async (
    member,
    onboarding,
    dao,
    newMember,
    sharePrice,
    token
  ) => {
    let proposalId = getProposalCounter();
    await onboarding.onboard(
      dao.address,
      proposalId,
      newMember,
      token,
      sharePrice.mul(toBN(10)),
      {
        from: member,
        value: sharePrice.mul(toBN(10)),
        gasPrice: toBN("0"),
      }
    );
    //Get the new proposal id
    return proposalId;
  };

  const sponsorNewMember = async (
    onboarding,
    dao,
    proposalId,
    sponsor,
    voting
  ) => {
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: sponsor,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: sponsor,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
  };

  const onboardingNewMember = async (
    dao,
    onboarding,
    voting,
    newMember,
    sponsor,
    sharePrice,
    token
  ) => {
    let newProposalId = await submitNewMemberProposal(
      sponsor,
      onboarding,
      dao,
      newMember,
      sharePrice,
      token
    );

    //Sponsor the new proposal, vote and process it
    await sponsorNewMember(onboarding, dao, newProposalId, sponsor, voting);
    await onboarding.processProposal(dao.address, newProposalId, {
      from: sponsor,
      gasPrice: toBN("0"),
    });
  };

  const guildKickProposal = async (
    dao,
    guildkickContract,
    memberToKick,
    sender,
    proposalId = null
  ) => {
    const newProposalId = proposalId ? proposalId : getProposalCounter();
    await guildkickContract.submitKickProposal(
      dao.address,
      newProposalId,
      memberToKick,
      fromUtf8(""),
      {
        from: sender,
        gasPrice: toBN("0"),
      }
    );

    return { kickProposalId: newProposalId };
  };

  test("should be possible to kick a DAO member", async () => {
    const newMember = accounts[2];

    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      owner,
      sharePrice,
      SHARES
    );

    //Check Guild Bank Balance
    const guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("1200000000000000000");

    //Check Member Shares & Loot
    let shares = await bank.balanceOf(newMember, SHARES);
    expect(shares.toString()).equal("10000000000000000");
    let loot = await bank.balanceOf(newMember, LOOT);
    expect(loot.toString()).equal("0");

    //SubGuildKick
    const memberToKick = newMember;
    const kickProposalId = getProposalCounter();
    await this.adapters.guildkick.submitKickProposal(
      this.dao.address,
      kickProposalId,
      memberToKick,
      fromUtf8(""),
      {
        from: owner,
        gasPrice: toBN("0"),
      }
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

    // Check Member Shares & Loot, it should be 0 because both were subtracted from internal
    shares = await bank.balanceOf(newMember, SHARES);
    expect(shares.toString()).equal("0");
    loot = await bank.balanceOf(newMember, LOOT);
    expect(loot.toString()).equal("0");
  });

  test("should not be possible for a non-member to submit a guild kick proposal", async () => {
    const owner = accounts[5];
    const nonMember = accounts[2];

    // Non member attemps to submit a guild kick proposal
    const memberToKick = owner;
    const newProposalId = getProposalCounter();
    await expectRevert(
      this.adapters.guildkick.submitKickProposal(
        this.dao.address,
        newProposalId,
        memberToKick,
        fromUtf8(""),
        {
          from: nonMember,
          gasPrice: toBN("0"),
        }
      ),
      "onlyMember"
    );
  });

  test("should not be possible for a non-active member to submit a guild kick proposal", async () => {
    // const member = accounts[6];
    const newMember = accounts[2];
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      owner,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      owner
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
    try {
      await this.adapters.guildkick.submitKickProposal(
        this.dao.address,
        newProposalId,
        owner,
        fromUtf8(""),
        {
          from: memberToKick,
          gasPrice: toBN("0"),
        }
      );
      throw Error("should not be possible to kick");
    } catch (e) {
      expect(e.reason).equal("onlyMember");
    }
  });

  test("should be possible for a non-member to process a kick proposal", async () => {
    const member = owner;
    const newMemberA = accounts[2];
    const nonMember = accounts[3];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMemberA,
      owner,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMemberA;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member
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

  test("should not be possible to process a kick proposal that was already processed", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member
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
    await expectRevert(
      guildkickContract.processProposal(this.dao.address, kickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      }),
      "flag already set"
    );
  });

  test("should not be possible to process a kick proposal that does not exist", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member
    );

    // Vote YES on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // The member attempts to process the same proposal again
    let invalidKickProposalId = getProposalCounter();
    await expectRevert(
      guildkickContract.processProposal(
        this.dao.address,
        invalidKickProposalId,
        {
          from: member,
          gasPrice: toBN("0"),
        }
      ),
      "proposal does not exist for this dao"
    );
  });

  test("should not be possible to process a kick proposal if the voting did not pass", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote NO on kick proposal
    await voting.submitVote(this.dao.address, kickProposalId, 2, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // The member attemps to process the kick proposal that did not pass
    await expectRevert(
      guildkickContract.processProposal(this.dao.address, kickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      }),
      "proposal did not pass"
    );
  });

  test("should not be possible to process a kick proposal if the member to kick does not have any shares nor loot", async () => {
    const member = owner;
    const advisor = accounts[3];
    const nonMember = accounts[4];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    // New member joins as an Advisor (only receives LOOT)
    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      advisor,
      member,
      sharePrice,
      LOOT
    );

    // The member attemps to process the kick proposal, but the Advisor does not have any SHARES, only LOOT
    await expectRevert(
      guildKickProposal(this.dao, guildkickContract, nonMember, member),
      "no shares or loot"
    );
  });

  test("should not be possible for a kicked member to sponsor an onboarding proposal", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    //SubGuildKick
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member
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
    let onboardProposalId = await submitNewMemberProposal(
      member,
      onboarding,
      this.dao,
      newMemberB,
      sharePrice,
      SHARES
    );

    // kicked member attemps to sponsor a new member
    await expectRevert(
      sponsorNewMember(
        onboarding,
        this.dao,
        onboardProposalId,
        kickedMember,
        voting
      ),
      "onlyMember"
    );
  });

  test("should not be possible for a kicked member to vote on in an onboarding proposal", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Submit guild kick proposal
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member
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
    let onboardProposalId = await submitNewMemberProposal(
      member,
      onboarding,
      this.dao,
      newMemberB,
      sharePrice,
      SHARES
    );

    //Sponsor the new proposal to start the voting process
    await onboarding.sponsorProposal(this.dao.address, onboardProposalId, [], {
      from: member,
      gasPrice: toBN("0"),
    });

    // kicked member attemps to vote
    await expectRevert(
      voting.submitVote(this.dao.address, onboardProposalId, 1, {
        from: kickedMember,
        gasPrice: toBN("0"),
      }),
      "onlyMember"
    );
  });

  test("should not be possible for a kicked member to sponsor a financing proposal", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;
    const financing = this.adapters.financing;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    //SubGuildKick
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member
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
    await financing.createFinancingRequest(
      this.dao.address,
      proposalId,
      kickedMember,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8(""),
      { gasPrice: toBN("0") }
    );

    // kicked member attemps to sponsor the financing proposal to get grant
    await expectRevert(
      financing.sponsorProposal(this.dao.address, proposalId, [], {
        from: kickedMember,
        gasPrice: toBN("0"),
      }),
      "onlyMember"
    );
  });

  test("should not be possible for a kicked member to sponsor a financing proposal", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;
    const managing = this.adapters.managing;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    //SubGuildKick
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member
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
    await expectRevert(
      managing.submitProposal(
        this.dao.address,
        getProposalCounter(),
        newAdapterId,
        newAdapterAddress,
        [],
        [],
        0,
        { from: kickedMember, gasPrice: toBN("0") }
      ),
      "onlyMember"
    );
  });

  test("should not be possible for a kicked member to sponsor a managing proposal", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;
    const managing = this.adapters.managing;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    //SubGuildKick
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member
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
    await managing.submitProposal(
      this.dao.address,
      proposalId,
      newadapterId,
      newadapterAddress,
      [],
      [],
      0,
      { from: member, gasPrice: toBN("0") }
    );

    // kicked member attemps to sponsor a managing proposal
    await expectRevert(
      managing.sponsorProposal(this.dao.address, proposalId, [], {
        from: kickedMember,
        gasPrice: toBN("0"),
      }),
      "onlyMember"
    );
  });

  test("should be possible to process a ragekick to return the funds to the kicked member", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;
    const bank = this.extensions.bank;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Submit GuildKick
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member
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

    // The kicked member should not have LOOT & SHARES anymore
    let memberLoot = await bank.balanceOf(memberToKick, LOOT);
    expect(memberLoot.toString()).equal("0");
    let memberShares = await bank.balanceOf(memberToKick, SHARES);
    expect(memberShares.toString()).equal("0");

    // The kicked member must receive the funds in ETH_TOKEN after the ragekick was triggered by a DAO member
    let memberEthToken = await bank.balanceOf(memberToKick, ETH_TOKEN);
    expect(memberEthToken.toString()).equal("1199999999999999880");
  });

  test("should not be possible to process a ragekick if the batch index is smaller than the current processing index", async () => {
    const member = owner;
    const newMember = accounts[2];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Submit GuildKick
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberToKick,
      member
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
    await expectRevert(
      guildKickProposal(this.dao, guildkickContract, memberToKick, member),
      "use ragequit"
    );
  });

  test("should not be possible to reuse the kick proposal id", async () => {
    const memberA = owner;
    const memberB = accounts[3];
    const memberC = accounts[5];

    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const guildkickContract = this.adapters.guildkick;

    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      memberB,
      memberA,
      sharePrice,
      SHARES
    );
    await onboardingNewMember(
      this.dao,
      onboarding,
      voting,
      memberC,
      memberA,
      sharePrice,
      SHARES
    );

    // Submit the first guild kick with proposalId 0x1
    const { kickProposalId } = await guildKickProposal(
      this.dao,
      guildkickContract,
      memberB,
      memberA
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
    await expectRevert(
      guildKickProposal(
        this.dao,
        guildkickContract,
        memberC,
        memberA,
        kickProposalId
      ),
      "proposalId must be unique"
    );
  });
});
