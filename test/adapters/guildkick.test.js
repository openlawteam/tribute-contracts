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
  sha3,
  toBN,
  fromUtf8,
  advanceTime,
  createDao,
  getContract,
  sharePrice,
  GUILD,
  ETH_TOKEN,
  SHARES,
  OnboardingContract,
  VotingContract,
  GuildKickContract,
  FinancingContract,
  LOOT,
  ManagingContract,
  BankExtension,
} = require("../../utils/DaoFactory.js");
let proposalCounter = 1;
contract("LAOLAND - GuildKick Adapter", async (accounts) => {
  const submitNewMemberProposal = async (
    member,
    onboarding,
    dao,
    newMember,
    sharePrice,
    token
  ) => {
    let proposalId = "0x" + proposalCounter;
    proposalCounter++;
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
    const newProposalId = proposalId ? proposalId : "0x" + proposalCounter++;
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

  it("should be possible to kick a DAO member", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(guildBalance).toString(), "1200000000000000000");

    //Check Member Shares & Loot
    let shares = await bank.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");
    let loot = await bank.balanceOf(newMember, LOOT);
    assert.equal(loot.toString(), "0");

    //SubGuildKick
    let memberToKick = newMember;
    let { kickProposalId } = await guildKickProposal(
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Member must be active before the kick happens
    let activeMember = await dao.isActiveMember(memberToKick, {
      from: member,
      gasPrice: toBN("0"),
    });
    assert.equal(activeMember.toString(), "true");

    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Check Member Shares & Loot, it should be 0 because both were subtracted from internal
    shares = await bank.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "0");
    loot = await bank.balanceOf(newMember, LOOT);
    assert.equal(loot.toString(), "10000000000000000");

    // Member must be inactive after the kick has happened
    activeMember = await dao.isActiveMember(memberToKick, {
      from: member,
      gasPrice: toBN("0"),
    });
    assert.equal(activeMember.toString(), "false");
  });

  it("should not be possible for a non-member to submit a guild kick proposal", async () => {
    const member = accounts[4];
    const nonMember = accounts[2];

    let dao = await createDao(member);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );

    // Non member attemps to submit a guild kick proposal
    try {
      let memberToKick = member;
      await guildKickProposal(dao, guildkickContract, memberToKick, nonMember);
      assert.fail(
        "should not be possible a non-member to submit a guild kick proposal"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
  });

  it("should not be possible for a non-active member to submit a guild kick proposal", async () => {
    const member = accounts[6];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    await onboardingNewMember(
      dao,
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
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // The member gets kicked out of the DAO
    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    try {
      // The kicked member which is now inactive attemps to submit a kick proposal
      // to kick the member that started the previous guild kick
      await guildKickProposal(dao, guildkickContract, member, memberToKick);

      assert.fail(
        "a member that is not active (kicked out) should not be able to submit a guild kick proposal"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
  });

  it("should be possible for a non-member to process a kick proposal", async () => {
    const member = accounts[7];
    const newMemberA = accounts[2];
    const nonMember = accounts[3];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );

    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      newMemberA,
      member,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMemberA;
    let { kickProposalId } = await guildKickProposal(
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: nonMember,
      gasPrice: toBN("0"),
    });
  });

  it("should not be possible to process a kick proposal that was already processed", async () => {
    const member = accounts[9];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );

    await onboardingNewMember(
      dao,
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
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // The member gets kicked out of the DAO
    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    try {
      // The member attempts to process the same proposal again
      await guildkickContract.processProposal(dao.address, kickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a proposal that was already processed"
      );
    } catch (e) {
      assert.equal(e.reason, "flag already set");
    }
  });

  it("should not be possible to process a kick proposal that does not exist", async () => {
    const member = accounts[3];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );

    await onboardingNewMember(
      dao,
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
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    try {
      // The member attempts to process the same proposal again
      let invalidKickProposalId = "0x89";
      await guildkickContract.processProposal(
        dao.address,
        invalidKickProposalId,
        {
          from: member,
          gasPrice: toBN("0"),
        }
      );
      assert.fail(
        "should not be possible to process a proposal that does not exist"
      );
    } catch (e) {
      assert.equal(e.reason, "proposal does not exist for this dao");
    }
  });

  it("should not be possible to process a kick proposal if the voting did not pass", async () => {
    const member = accounts[7];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );

    await onboardingNewMember(
      dao,
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
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote NO on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 2, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    try {
      // The member attemps to process the kick proposal that did not pass
      await guildkickContract.processProposal(dao.address, kickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a guild kick proposal that did not pass"
      );
    } catch (e) {
      assert.equal(e.reason, "proposal did not pass");
    }
  });

  it("should not be possible to process a kick proposal if the member to kick does not have any shares nor loot", async () => {
    const member = accounts[8];
    const advisor = accounts[3];
    const nonMember = accounts[4];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );

    // New member joins as an Advisor (only receives LOOT)
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      advisor,
      member,
      sharePrice,
      LOOT
    );

    try {
      // The member attemps to process the kick proposal, but the Advisor does not have any SHARES, only LOOT
      await guildKickProposal(dao, guildkickContract, nonMember, member);
      assert.fail(
        "should not be possible to process a guild kick proposal if the member/advisor does not have any shares"
      );
    } catch (e) {
      assert.equal(e.reason, "no shares or loot");
    }
  });

  it("should not be possible for a kicked member to sponsor an onboarding proposal", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    await onboardingNewMember(
      dao,
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
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Member must be inactive after the kick has happened
    let kickedMember = memberToKick;
    let activeMember = await dao.isActiveMember(kickedMember, {
      from: member,
      gasPrice: toBN("0"),
    });
    assert.equal(activeMember.toString(), "false");

    // Submit proposal to onboard new member
    let newMemberB = accounts[3];
    let onboardProposalId = await submitNewMemberProposal(
      member,
      onboarding,
      dao,
      newMemberB,
      sharePrice,
      SHARES
    );

    try {
      // kicked member attemps to sponsor a new member
      await sponsorNewMember(
        onboarding,
        dao,
        onboardProposalId,
        kickedMember,
        voting
      );
      assert.fail(
        "should not be possible for a kicked member to sponsor a new member"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
  });

  it("should not be possible for a kicked member to vote on in an onboarding proposal", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    await onboardingNewMember(
      dao,
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
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    // Vote YES on a kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Process guild kick proposal
    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Member must be inactive after the kick has happened
    let kickedMember = memberToKick;
    let activeMember = await dao.isActiveMember(kickedMember, {
      from: member,
      gasPrice: toBN("0"),
    });
    assert.equal(activeMember.toString(), "false");

    // Submit proposal to onboard new member
    let newMemberB = accounts[3];
    let onboardProposalId = await submitNewMemberProposal(
      member,
      onboarding,
      dao,
      newMemberB,
      sharePrice,
      SHARES
    );

    //Sponsor the new proposal to start the voting process
    await onboarding.sponsorProposal(dao.address, onboardProposalId, [], {
      from: member,
      gasPrice: toBN("0"),
    });

    try {
      // kicked member attemps to vote
      await voting.submitVote(dao.address, onboardProposalId, 1, {
        from: kickedMember,
        gasPrice: toBN("0"),
      });
      assert.fail("should not be possible for a kicked member to vote");
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
  });

  it("should not be possible for a kicked member to sponsor a financing proposal", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    const financing = await getContract(dao, "financing", FinancingContract);
    await onboardingNewMember(
      dao,
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
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Member must be inactive after the kick has happened
    let kickedMember = memberToKick;
    let activeMember = await dao.isActiveMember(kickedMember, {
      from: member,
      gasPrice: toBN("0"),
    });
    assert.equal(activeMember.toString(), "false");

    // Create Financing Request, the kicked member is the applicant and it is fine for now
    let requestedAmount = toBN(50000);
    let proposalId = "0x" + proposalCounter++;
    await financing.createFinancingRequest(
      dao.address,
      proposalId,
      kickedMember,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8(""),
      { gasPrice: toBN("0") }
    );

    try {
      // kicked member attemps to sponsor the financing proposal to get grant
      await financing.sponsorProposal(dao.address, proposalId, [], {
        from: kickedMember,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible for a kicked member to sponsor a financing proposal"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
  });

  it("should not be possible for a kicked member to sponsor a financing proposal", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    const managing = await getContract(dao, "managing", ManagingContract);
    await onboardingNewMember(
      dao,
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
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Member must be inactive after the kick has happened
    let kickedMember = memberToKick;
    let activeMember = await dao.isActiveMember(kickedMember, {
      from: member,
      gasPrice: toBN("0"),
    });
    assert.equal(activeMember.toString(), "false");

    //Submit a new Bank adapter proposal
    let newAdapterId = sha3("onboarding");
    let newAdapterAddress = accounts[8];

    try {
      // kicked member attemps to submit a managing proposal
      await managing.createAdapterChangeRequest(
        dao.address,
        "0x45",
        newAdapterId,
        newAdapterAddress,
        [],
        [],
        0,
        { from: kickedMember, gasPrice: toBN("0") }
      );
      assert.fail(
        "should not be possible for a kicked member to submit a managing proposal"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
  });

  it("should not be possible for a kicked member to sponsor a managing proposal", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    const managing = await getContract(dao, "managing", ManagingContract);
    await onboardingNewMember(
      dao,
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
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Member must be inactive after the kick has happened
    let kickedMember = memberToKick;
    let activeMember = await dao.isActiveMember(kickedMember, {
      from: member,
      gasPrice: toBN("0"),
    });
    assert.equal(activeMember.toString(), "false");
    const proposalId = "0x" + proposalCounter++;
    //Submit a new Bank adapter proposal
    let newadapterId = sha3("onboarding");
    let newadapterAddress = accounts[3]; //TODO deploy some Banking test contract
    await managing.createAdapterChangeRequest(
      dao.address,
      proposalId,
      newadapterId,
      newadapterAddress,
      [],
      [],
      0,
      { from: member, gasPrice: toBN("0") }
    );

    try {
      // kicked member attemps to sponsor a managing proposal
      await managing.sponsorProposal(dao.address, proposalId, [], {
        from: kickedMember,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible for a kicked member to sponsor a managing proposal"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
  });

  it("should be possible to process a ragekick to return the funds to the kicked member", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    await onboardingNewMember(
      dao,
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
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Process guild kick to remove the voting power of the kicked member
    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Member must be inactive after the kick has happened
    let activeMember = await dao.isActiveMember(memberToKick, {
      from: member,
      gasPrice: toBN("0"),
    });
    assert.equal(activeMember.toString(), "false");

    // Check Members Bank Balance in LOOT before the ragekick is triggered by a DAO member
    let memberEthToken = await bank.balanceOf(memberToKick, ETH_TOKEN);
    assert.equal(memberEthToken.toString(), "0");
    let memberLoot = await bank.balanceOf(memberToKick, LOOT);
    assert.equal(memberLoot.toString(), "10000000000000000");

    // Process guild kick to remove the voting power of the kicked member
    let toIndex = 10;
    await guildkickContract.rageKick(dao.address, toIndex, {
      from: member,
      gasPrice: toBN("0"),
    });

    // The kicked member should not have LOOT & SHARES anymore
    memberLoot = await bank.balanceOf(memberToKick, LOOT);
    assert.equal(memberLoot.toString(), "0");
    let memberShares = await bank.balanceOf(memberToKick, SHARES);
    assert.equal(memberShares.toString(), "0");

    // The kicked member must receive the funds in ETH_TOKEN after the ragekick was triggered by a DAO member
    memberEthToken = await bank.balanceOf(memberToKick, ETH_TOKEN);
    assert.equal(memberEthToken.toString(), "1199999999999999880");
  });

  it("should not be possible to process a ragekick if the batch index is smaller than the current processing index", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    let dao = await createDao(member);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    await onboardingNewMember(
      dao,
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
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Process guild kick to remove the voting power of the kicked member
    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Process guild kick to remove the voting power of the kicked member
    let toIndex = 1;
    await guildkickContract.rageKick(dao.address, toIndex, {
      from: member,
      gasPrice: toBN("0"),
    });
  });

  it("should not be possible to submit a guild kick to kick yourself", async () => {
    const member = accounts[5];

    let dao = await createDao(member);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );

    try {
      // Attempt to kick yourself
      let memberToKick = member;
      await guildKickProposal(dao, guildkickContract, memberToKick, member);
      assert.fail("should not be possible to kick yourself");
    } catch (e) {
      assert.equal(e.reason, "you can not kick yourself");
    }
  });

  it("should not be possible to execute more than one kick at time", async () => {
    const memberA = accounts[1];
    const memberB = accounts[3];
    const memberC = accounts[5];

    let dao = await createDao(memberA);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      memberB,
      memberA,
      sharePrice,
      SHARES
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      memberC,
      memberA,
      sharePrice,
      SHARES
    );

    // Submit the first guild kick with proposalId 0x1
    let p1 = await guildKickProposal(dao, guildkickContract, memberB, memberA);
    let p2 = await guildKickProposal(dao, guildkickContract, memberC, memberA);

    await voting.submitVote(dao.address, p1.kickProposalId, 1, {
      from: memberA,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, p2.kickProposalId, 1, {
      from: memberA,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(dao.address, p1.kickProposalId, {
      from: memberA,
      gasPrice: toBN("0"),
    });

    try {
      // Submit the first guild kick with proposalId 0x1

      await guildkickContract.processProposal(dao.address, p2.kickProposalId, {
        from: memberA,
        gasPrice: toBN("0"),
      });

      assert.fail(
        "should not be possible to run more than one kick at time per DAO"
      );
    } catch (e) {
      assert.equal(e.reason, "another kick already in progress");
    }
  });

  it("should not be possible to reuse the kick proposal id", async () => {
    const memberA = accounts[1];
    const memberB = accounts[3];
    const memberC = accounts[5];

    let dao = await createDao(memberA);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      memberB,
      memberA,
      sharePrice,
      SHARES
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      memberC,
      memberA,
      sharePrice,
      SHARES
    );

    let proposalId = "0x1";

    // Submit the first guild kick with proposalId 0x1
    await guildKickProposal(
      dao,
      guildkickContract,
      memberB,
      memberA,
      proposalId
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, proposalId, 1, {
      from: memberA,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(dao.address, proposalId, {
      from: memberA,
      gasPrice: toBN("0"),
    });

    try {
      // Submit the first guild kick with proposalId 0x1
      await guildKickProposal(
        dao,
        guildkickContract,
        memberC,
        memberA,
        proposalId
      );
      assert.fail("should not be possible to reuse a proposal id");
    } catch (e) {
      assert.equal(e.reason, "proposalId must be unique");
    }
  });
});
