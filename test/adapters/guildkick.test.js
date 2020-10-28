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
const { toUtf8 } = require("ethereumjs-util");
const {
  sha3,
  toBN,
  fromUtf8,
  advanceTime,
  createDao,
  sharePrice,
  GUILD,
  ETH_TOKEN,
  SHARES,
  OnboardingContract,
  VotingContract,
  GuildKickContract,
  LOOT,
} = require("../../utils/DaoFactory.js");

contract("LAOLAND - GuildKick Adapter", async (accounts) => {
  submitNewMemberProposal = async (
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
      sharePrice.mul(toBN(100)),
      {
        from: member,
        value: sharePrice.mul(toBN(100)),
        gasPrice: toBN("0"),
      }
    );
    //Get the new proposal id
    let pastEvents = await dao.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;
    return proposalId;
  };

  sponsorNewMember = async (onboarding, dao, proposalId, sponsor, voting) => {
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

  onboardingNewMember = async (dao, newMember, sponsor, sharePrice, token) => {
    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

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
    return voting;
  };

  guildKick = async (dao, memberToKick, sender) => {
    let guildkickAddress = await dao.getAdapterAddress(sha3("guildkick"));
    let guildkickContract = await GuildKickContract.at(guildkickAddress);
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
    let { proposalId } = pastEvents[0].returnValues;

    return { guildkickContract, kickProposalId: proposalId };
  };

  it("should be possible to kick a DAO member", async () => {
    const member = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(member);

    let voting = await onboardingNewMember(
      dao,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(guildBalance).toString(), "12000000000000000000");

    //Check Member Shares & Loot
    let shares = await dao.nbShares(newMember);
    assert.equal(shares.toString(), "100000000000000000");
    let loot = await dao.nbLoot(newMember);
    assert.equal(loot.toString(), "0");

    //SubGuildKick
    let memberToKick = newMember;
    let { guildkickContract, kickProposalId } = await guildKick(
      dao,
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

    await guildkickContract.kick(dao.address, memberToKick, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // Check Member Shares & Loot, the Shares must be converted to Loot to remove the voting power of the member
    shares = await dao.nbShares(newMember);
    assert.equal(shares.toString(), "0");
    loot = await dao.nbLoot(newMember);
    assert.equal(loot.toString(), "100000000000000000");

    // Member must be inactive after the kick has happened
    activeMember = await dao.isActiveMember(memberToKick, {
      from: member,
      gasPrice: toBN("0"),
    });
    assert.equal(activeMember.toString(), "false");
  });

  it("should not be possible for a non-member to submit a guild kick proposal", async () => {
    const member = accounts[1];
    const nonMember = accounts[2];

    let dao = await createDao(member);

    // Non member attemps to submit a guild kick proposal
    try {
      let memberToKick = member;
      await guildKick(dao, memberToKick, nonMember);
      assert.fail(
        "should not be possible a non-member to submit a guild kick proposal"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
  });

  it("should not be possible for a non-active member to submit a guild kick proposal", async () => {
    const member = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(member);

    let voting = await onboardingNewMember(
      dao,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let { guildkickContract, kickProposalId } = await guildKick(
      dao,
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
    await guildkickContract.kick(dao.address, memberToKick, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    try {
      // The kicked member which is now inactive attemps to submit a kick proposal
      // to kick the member that started the previous guild kick
      await guildkickContract.kick(dao.address, member, kickProposalId, {
        from: memberToKick,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "a member that is not active (kicked out) should not be able to submit a guild kick proposal"
      );
    } catch (e) {
      assert.equal(e.reason, "onlyMember");
    }
    //TODO: call other adapters to ensure the kicked member can't do anything else
  });

  it("should not be possible for a non-member to process a kick proposal", async () => {
    const member = accounts[1];
    const newMemberA = accounts[2];

    let dao = await createDao(member);

    let voting = await onboardingNewMember(
      dao,
      newMemberA,
      member,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMemberA;
    let { guildkickContract, kickProposalId } = await guildKick(
      dao,
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
      await guildkickContract.kick(dao.address, memberToKick, kickProposalId, {
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
    const member = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(member);
    let voting = await onboardingNewMember(
      dao,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let { guildkickContract, kickProposalId } = await guildKick(
      dao,
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
    await guildkickContract.kick(dao.address, memberToKick, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    try {
      // The kicked member which is now inactive attemps to submit a kick proposal
      // to kick the member that started the previous guild kick
      await guildkickContract.kick(dao.address, member, kickProposalId, {
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
    const member = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(member);
    let voting = await onboardingNewMember(
      dao,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let { guildkickContract, kickProposalId } = await guildKick(
      dao,
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
    await guildkickContract.kick(dao.address, memberToKick, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    try {
      // The member attempts to process the same proposal again
      await guildkickContract.kick(dao.address, memberToKick, kickProposalId, {
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
    const member = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(member);
    let voting = await onboardingNewMember(
      dao,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let { guildkickContract, kickProposalId } = await guildKick(
      dao,
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
      await guildkickContract.kick(
        dao.address,
        memberToKick,
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
      assert.equal(e.reason, "invalid kick proposal");
    }
  });

  it("should not be possible to process a kick proposal for a non active member", async () => {
    const member = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(member);
    let voting = await onboardingNewMember(
      dao,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let { guildkickContract, kickProposalId } = await guildKick(
      dao,
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
    await guildkickContract.kick(dao.address, memberToKick, kickProposalId, {
      from: member,
      gasPrice: toBN("0"),
    });

    // The remaining members accidentaly submit another kick proposal for an inactive member
    // A member that was already kicked out
    let res = await guildKick(dao, memberToKick, member);
    kickProposalId = res.kickProposalId;
    try {
      await guildkickContract.kick(dao.address, memberToKick, kickProposalId, {
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
    const member = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(member);
    let voting = await onboardingNewMember(
      dao,
      newMember,
      member,
      sharePrice,
      SHARES
    );

    // Start a new kick poposal
    let memberToKick = newMember;
    let { guildkickContract, kickProposalId } = await guildKick(
      dao,
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
      await guildkickContract.kick(dao.address, memberToKick, kickProposalId, {
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
    const member = accounts[2];
    const advisor = accounts[3];

    let dao = await createDao(member);
    // New member joins as an Advisor (only receives LOOT)
    let voting = await onboardingNewMember(
      dao,
      advisor,
      member,
      sharePrice,
      LOOT
    );

    // Start a new kick poposal to kick out the advisor
    let memberToKick = advisor;
    let { guildkickContract, kickProposalId } = await guildKick(
      dao,
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
      await guildkickContract.kick(dao.address, memberToKick, kickProposalId, {
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
});
