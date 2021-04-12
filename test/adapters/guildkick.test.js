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
  accounts,
  sharePrice,
  GUILD,
  ETH_TOKEN,
  SHARES,
  LOOT,
  expect,
  expectRevert,
} = require("../../utils/DaoFactory.js");

let proposalCounter = 1;
describe("Adapter - GuildKick", () => {
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

  test("should be possible to kick a DAO member", async () => {
    const owner = accounts[1];
    const newMember = accounts[2];
    const { dao, adapters, extensions } = await deployDefaultDao(owner);

    const bank = extensions.bank;
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;

    await onboardingNewMember(
      dao,
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
    const kickProposalId = `0x${proposalCounter++}`;
    await adapters.guildkick.submitKickProposal(
      dao.address,
      kickProposalId,
      memberToKick,
      fromUtf8(""),
      {
        from: owner,
        gasPrice: toBN("0"),
      }
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: owner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: owner,
      gasPrice: toBN("0"),
    });

    // Check Member Shares & Loot, it should be 0 because both were subtracted from internal
    shares = await bank.balanceOf(newMember, SHARES);
    expect(shares.toString()).equal("0");
    loot = await bank.balanceOf(newMember, LOOT);
    expect(loot.toString()).to.equals("0");
  });

  test("should not be possible for a non-member to submit a guild kick proposal", async () => {
    const owner = accounts[5];
    const nonMember = accounts[2];
    const { dao, adapters } = await deployDefaultDao(owner);

    // Non member attemps to submit a guild kick proposal
    const memberToKick = owner;
    const newProposalId = proposalCounter + 1;
    await expectRevert(
      adapters.guildkick.submitKickProposal(
        dao.address,
        `0x${newProposalId}`,
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

  //FIXME
  test("should not be possible for a non-active member to submit a guild kick proposal", async () => {
    const member = accounts[6];
    const newMember = accounts[2];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;

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

    // The kicked member which is now inactive attemps to submit a kick proposal
    // to kick the member that started the previous guild kick
    const newProposalId = proposalCounter + 1;
    try {
      await adapters.guildkick.submitKickProposal(
        dao.address,
        `0x${newProposalId}`,
        member,
        fromUtf8(""),
        {
          from: memberToKick,
          gasPrice: toBN("0"),
        }
      );
      throw Error("should not be possible to kick");
    } catch (e) {
      e.reason;
      expect(e.reason).to.equals("onlyMember");
    }
  });

  test("should be possible for a non-member to process a kick proposal", async () => {
    const member = accounts[7];
    const newMemberA = accounts[2];
    const nonMember = accounts[3];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;

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

  test("should not be possible to process a kick proposal that was already processed", async () => {
    const member = accounts[9];
    const newMember = accounts[2];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;

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

    // The member attempts to process the same proposal again
    await expectRevert(
      guildkickContract.processProposal(dao.address, kickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      }),
      "flag already set"
    );
  });

  test("should not be possible to process a kick proposal that does not exist", async () => {
    const member = accounts[3];
    const newMember = accounts[2];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;

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

    // Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // The member attempts to process the same proposal again
    let invalidKickProposalId = "0x89";
    await expectRevert(
      guildkickContract.processProposal(dao.address, invalidKickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      }),
      "proposal does not exist for this dao"
    );
  });

  test("should not be possible to process a kick proposal if the voting did not pass", async () => {
    const member = accounts[7];
    const newMember = accounts[2];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;

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

    // The member attemps to process the kick proposal that did not pass
    await expectRevert(
      guildkickContract.processProposal(dao.address, kickProposalId, {
        from: member,
        gasPrice: toBN("0"),
      }),
      "proposal did not pass"
    );
  });

  test("should not be possible to process a kick proposal if the member to kick does not have any shares nor loot", async () => {
    const member = accounts[8];
    const advisor = accounts[3];
    const nonMember = accounts[4];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;

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

    // The member attemps to process the kick proposal, but the Advisor does not have any SHARES, only LOOT
    await expectRevert(
      guildKickProposal(dao, guildkickContract, nonMember, member),
      "no shares or loot"
    );
  });

  test("should not be possible for a kicked member to sponsor an onboarding proposal", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;

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

    // kicked member attemps to sponsor a new member
    await expectRevert(
      sponsorNewMember(
        onboarding,
        dao,
        onboardProposalId,
        kickedMember,
        voting
      ),
      "onlyMember"
    );
  });

  test("should not be possible for a kicked member to vote on in an onboarding proposal", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;

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

    // kicked member attemps to vote
    await expectRevert(
      voting.submitVote(dao.address, onboardProposalId, 1, {
        from: kickedMember,
        gasPrice: toBN("0"),
      }),
      "onlyMember"
    );
  });

  test("should not be possible for a kicked member to sponsor a financing proposal", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;
    const financing = adapters.financing;

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

    // kicked member attemps to sponsor the financing proposal to get grant
    await expectRevert(
      financing.sponsorProposal(dao.address, proposalId, [], {
        from: kickedMember,
        gasPrice: toBN("0"),
      }),
      "onlyMember"
    );
  });

  test("should not be possible for a kicked member to sponsor a financing proposal", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;
    const managing = adapters.managing;

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

    //Submit a new Bank adapter proposal
    let newAdapterId = sha3("onboarding");
    let newAdapterAddress = accounts[8];

    // kicked member attemps to submit a managing proposal
    await expectRevert(
      managing.submitProposal(
        dao.address,
        "0x45",
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
    const member = accounts[5];
    const newMember = accounts[2];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;
    const managing = adapters.managing;

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

    const proposalId = "0x" + proposalCounter++;
    //Submit a new Bank adapter proposal
    let newadapterId = sha3("onboarding");
    let newadapterAddress = accounts[3]; //TODO deploy some Banking test contract
    await managing.submitProposal(
      dao.address,
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
      managing.sponsorProposal(dao.address, proposalId, [], {
        from: kickedMember,
        gasPrice: toBN("0"),
      }),
      "onlyMember"
    );
  });

  test("should be possible to process a ragekick to return the funds to the kicked member", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    const { dao, adapters, extensions } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;
    const bank = extensions.bank;

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

    // The kicked member should not have LOOT & SHARES anymore
    let memberLoot = await bank.balanceOf(memberToKick, LOOT);
    expect(memberLoot.toString()).to.equals("0");
    let memberShares = await bank.balanceOf(memberToKick, SHARES);
    expect(memberLoot.toString()).to.equals("0");

    // The kicked member must receive the funds in ETH_TOKEN after the ragekick was triggered by a DAO member
    let memberEthToken = await bank.balanceOf(memberToKick, ETH_TOKEN);
    expect(memberEthToken.toString()).to.equals("1199999999999999880");
  });

  test("should not be possible to process a ragekick if the batch index is smaller than the current processing index", async () => {
    const member = accounts[5];
    const newMember = accounts[2];

    const { dao, adapters } = await deployDefaultDao(member);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;

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
  });

  it("should not be possible to submit a guild kick to kick yourself", async () => {
    const member = accounts[5];

    const { dao, adapters } = await deployDefaultDao(member);
    const guildkickContract = adapters.guildkick;

    // Attempt to kick yourself
    let memberToKick = member;
    await expectRevert(
      guildKickProposal(dao, guildkickContract, memberToKick, member),
      "use ragequit"
    );
  });

  test("should not be possible to reuse the kick proposal id", async () => {
    const memberA = accounts[1];
    const memberB = accounts[3];
    const memberC = accounts[5];

    const { dao, adapters } = await deployDefaultDao(memberA);
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;
    const guildkickContract = adapters.guildkick;

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

    // Submit the first guild kick with proposalId 0x1
    await expectRevert(
      guildKickProposal(dao, guildkickContract, memberC, memberA, proposalId),
      "proposalId must be unique"
    );
  });
});
