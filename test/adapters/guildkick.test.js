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
} = require("../../utils/DaoFactory.js");

contract("LAOLAND - GuildKick Adapter", async (accounts) => {
  const submitNewMemberProposal = async (
    member,
    onboarding,
    dao,
    newMember,
    sharePrice,
    token
  ) => {
    await onboarding.onboard(
      dao.address,
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
    let pastEvents = await dao.getPastEvents();
    let {proposalId} = pastEvents[0].returnValues;
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
    sender
  ) => {
    await guildkickContract.submitKickProposal(
      dao.address,
      memberToKick,
      fromUtf8(""),
      {
        from: sender,
        gasPrice: toBN("0"),
      }
    );

    //Get the new proposal id
    let pastEvents = await dao.getPastEvents();
    let {proposalId} = pastEvents[0].returnValues;

    return {kickProposalId: proposalId};
  };

  it("should be possible to kick a DAO member", async () => {
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

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(guildBalance).toString(), "1200000000000000000");

    //Check Member Shares & Loot
    let shares = await dao.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");
    let loot = await dao.balanceOf(newMember, LOOT);
    assert.equal(loot.toString(), "0");

    //SubGuildKick
    let memberToKick = newMember;
    let {kickProposalId} = await guildKickProposal(
      dao,
      guildkickContract,
      memberToKick,
      member
    );
    assert.equal(kickProposalId.toString(), "1");

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

    await guildkickContract.guildKick(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Check Member Shares & Loot, the Shares must be converted to Loot to remove the voting power of the member
    shares = await dao.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "0");
    loot = await dao.balanceOf(newMember, LOOT);
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
    let {kickProposalId} = await guildKickProposal(
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
    await guildkickContract.guildKick(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    try {
      // The kicked member which is now inactive attemps to submit a kick proposal
      // to kick the member that started the previous guild kick
      await guildkickContract.guildKick(dao.address, kickProposalId, {
        from: memberToKick,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "a member that is not active (kicked out) should not be able to submit a guild kick proposal"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
  });

  it("should not be possible for a non-member to process a kick proposal", async () => {
    const member = accounts[7];
    const newMemberA = accounts[2];

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
    let {kickProposalId} = await guildKickProposal(
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

    const nonMember = accounts[3];

    try {
      // A non-member of the DAO attemps to process a kick proposal
      await guildkickContract.guildKick(dao.address, kickProposalId, {
        from: nonMember,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible for a non-member to process a kick proposal"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
  });

  it("should not be possible for a non-active member to process a kick proposal", async () => {
    const member = accounts[8];
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
    let {kickProposalId} = await guildKickProposal(
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
    await guildkickContract.guildKick(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    try {
      // The kicked member which is now inactive attemps to submit a kick proposal
      // to kick the member that started the previous guild kick
      await guildkickContract.guildKick(dao.address, kickProposalId, {
        from: memberToKick,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "a member that is not active (kicked out) should not be able to submit a guild kick proposal"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
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
    let {kickProposalId} = await guildKickProposal(
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
    await guildkickContract.guildKick(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    try {
      // The member attempts to process the same proposal again
      await guildkickContract.guildKick(dao.address, kickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a proposal that was already processed"
      );
    } catch (e) {
      assert.equal(e.reason, "guild kick already completed or does not exist");
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
    let {kickProposalId} = await guildKickProposal(
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
      let invalidKickProposalId = 89;
      await guildkickContract.guildKick(dao.address, invalidKickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a proposal that does not exist"
      );
    } catch (e) {
      assert.equal(e.reason, "guild kick already completed or does not exist");
    }
  });

  it("should not be possible to process a kick proposal for a non active member", async () => {
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
    let {kickProposalId} = await guildKickProposal(
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

    // The member gets kicked out and become inactive
    await guildkickContract.guildKick(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // The remaining members accidentaly submit another kick proposal for an inactive member
    // A member that was already kicked out
    let res = await guildKickProposal(
      dao,
      guildkickContract,
      memberToKick,
      member
    );
    kickProposalId = res.kickProposalId;
    try {
      await guildkickContract.guildKick(dao.address, kickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible for an inactive member to be kicked out again"
      );
    } catch (e) {
      assert.equal(e.reason, "memberToKick is not active");
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
    let {kickProposalId} = await guildKickProposal(
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
      await guildkickContract.guildKick(dao.address, kickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a guild kick proposal that did not pass"
      );
    } catch (e) {
      assert.equal(e.reason, "proposal did not pass yet");
    }
  });

  it("should not be possible to process a kick proposal if the member to kick does not have any shares", async () => {
    const member = accounts[8];
    const advisor = accounts[3];

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

    // Start a new kick poposal to kick out the advisor
    let memberToKick = advisor;
    let {kickProposalId} = await guildKickProposal(
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
      // The member attemps to process the kick proposal, but the Advisor does not have any SHARES, only LOOT
      await guildkickContract.guildKick(dao.address, kickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a guild kick proposal if the member/advisor does not have any shares"
      );
    } catch (e) {
      assert.equal(e.reason, "insufficient shares");
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
    let {kickProposalId} = await guildKickProposal(
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

    await guildkickContract.guildKick(dao.address, kickProposalId, {
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
    let {kickProposalId} = await guildKickProposal(
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
    await guildkickContract.guildKick(dao.address, kickProposalId, {
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
    let {kickProposalId} = await guildKickProposal(
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

    await guildkickContract.guildKick(dao.address, kickProposalId, {
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
    await financing.createFinancingRequest(
      dao.address,
      kickedMember,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8(""),
      {gasPrice: toBN("0")}
    );

    let pastEvents = await dao.getPastEvents();
    let {proposalId} = pastEvents[0].returnValues;

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
    let {kickProposalId} = await guildKickProposal(
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

    await guildkickContract.guildKick(dao.address, kickProposalId, {
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

    //Submit a new Bank module proposal
    let newModuleId = sha3("onboarding");
    let newModuleAddress = accounts[8];

    try {
      // kicked member attemps to submit a managing proposal
      await managing.createModuleChangeRequest(
        dao.address,
        newModuleId,
        newModuleAddress,
        [],
        [],
        0,
        {from: kickedMember, gasPrice: toBN("0")}
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
    let {kickProposalId} = await guildKickProposal(
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

    await guildkickContract.guildKick(dao.address, kickProposalId, {
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

    //Submit a new Bank module proposal
    let newModuleId = sha3("onboarding");
    let newModuleAddress = accounts[3]; //TODO deploy some Banking test contract
    await managing.createModuleChangeRequest(
      dao.address,
      newModuleId,
      newModuleAddress,
      [],
      [],
      0,
      {from: member, gasPrice: toBN("0")}
    );

    //Get the new proposal id
    let pastEvents = await dao.getPastEvents();
    let {proposalId} = pastEvents[0].returnValues;

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
    let {kickProposalId} = await guildKickProposal(
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
    await guildkickContract.guildKick(dao.address, kickProposalId, {
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
    let memberEthToken = await dao.balanceOf(memberToKick, ETH_TOKEN);
    assert.equal(memberEthToken.toString(), "0");
    let memberLoot = await dao.balanceOf(memberToKick, LOOT);
    assert.equal(memberLoot.toString(), "10000000000000000");

    // Process guild kick to remove the voting power of the kicked member
    let toIndex = 10;
    await guildkickContract.rageKick(dao.address, kickProposalId, toIndex, {
      from: member,
      gasPrice: toBN("0"),
    });

    // The kicked member should not have LOOT & SHARES anymore
    memberLoot = await dao.balanceOf(memberToKick, LOOT);
    assert.equal(memberLoot.toString(), "0");
    let memberShares = await dao.balanceOf(memberToKick, SHARES);
    assert.equal(memberShares.toString(), "0");

    // The kicked member must receive the funds in ETH_TOKEN after the ragekick was triggered by a DAO member
    memberEthToken = await dao.balanceOf(memberToKick, ETH_TOKEN);
    assert.equal(memberEthToken.toString(), "1199999999999999880");
  });

  it("should not be possible to process a ragekick if the caller is not a DAO member", async () => {
    const member = accounts[5];
    const nonMember = accounts[2];

    let dao = await createDao(member);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    try {
      let toIndex = 1;
      let kickProposalId = 1;
      await guildkickContract.rageKick(dao.address, kickProposalId, toIndex, {
        from: nonMember,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible for a non member to call the ragekick process"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
  });

  it("should not be possible to process a ragekick if the proposal does not exist", async () => {
    const member = accounts[5];

    let dao = await createDao(member);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    try {
      let toIndex = 1;
      let kickProposalId = 1;
      await guildkickContract.rageKick(dao.address, kickProposalId, toIndex, {
        from: member,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a ragekick request if the proposal does not exist"
      );
    } catch (e) {
      assert.equal(e.reason, "guild kick not completed or does not exist");
    }
  });

  it("should not be possible to process a ragekick if the proposal status is not DONE", async () => {
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
    let {kickProposalId} = await guildKickProposal(
      dao,
      guildkickContract,
      memberToKick,
      member
    );

    try {
      // Member attemps to process the ragekick, but the proposal is not completed
      let toIndex = 1;
      await guildkickContract.rageKick(dao.address, kickProposalId, toIndex, {
        from: member,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a ragekick if the proposal status is not DONE"
      );
    } catch (e) {
      assert.equal(e.reason, "guild kick not completed or does not exist");
    }
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
    let {kickProposalId} = await guildKickProposal(
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
    await guildkickContract.guildKick(dao.address, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Process guild kick to remove the voting power of the kicked member
    let toIndex = 1;
    await guildkickContract.rageKick(dao.address, kickProposalId, toIndex, {
      from: member,
      gasPrice: toBN("0"),
    });
  });
});
