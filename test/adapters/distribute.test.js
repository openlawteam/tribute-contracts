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
  LOOT,
  OnboardingContract,
  VotingContract,
  DistributeContract,
  GuildKickContract,
  BankExtension,
} = require("../../utils/DaoFactory.js");

let proposalCounter = 1;

contract("LAOLAND - Distribute Adapter", async (accounts) => {
  const submitNewMemberProposal = async (
    member,
    onboarding,
    dao,
    newMember,
    sharePrice,
    token,
    desiredShares
  ) => {
    let proposalId = "0x" + proposalCounter;
    proposalCounter++;
    await onboarding.onboard(
      dao.address,
      proposalId,
      newMember,
      token,
      sharePrice.mul(toBN(desiredShares)),
      {
        from: member,
        value: sharePrice.mul(toBN(desiredShares)),
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
    token,
    desiredShares
  ) => {
    let newProposalId = await submitNewMemberProposal(
      sponsor,
      onboarding,
      dao,
      newMember,
      sharePrice,
      token,
      desiredShares
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

  const distributeFundsProposal = async (
    dao,
    distributeContract,
    token,
    amount,
    shareHolderArr,
    sender,
    proposalId = null
  ) => {
    const newProposalId = proposalId ? proposalId : "0x" + proposalCounter++;
    await distributeContract.submitProposal(
      dao.address,
      newProposalId,
      shareHolderArr,
      token,
      amount,
      fromUtf8("paying dividends"),
      {
        from: sender,
        gasPrice: toBN("0"),
      }
    );

    return { proposalId: newProposalId };
  };

  it("should be possible to distribute funds to only 1 member of the DAO", async () => {
    const daoOwner = accounts[2];
    const daoMember = accounts[3];

    let dao = await createDao(daoOwner);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      daoMember,
      daoOwner,
      sharePrice,
      SHARES,
      10
    );

    // Checks the Guild Bank Balance
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(guildBalance).toString(), "1200000000000000000");

    // Checks the member shares (to make sure it was created)
    let shares = await bank.balanceOf(daoMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");

    // Submit distribute proposal
    const amountToDistribute = 10;
    let { proposalId } = await distributeFundsProposal(
      dao,
      distributeContract,
      ETH_TOKEN,
      amountToDistribute,
      daoMember,
      daoOwner
    );

    // Vote YES on the proposal
    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Starts to process the proposal
    await distributeContract.processProposal(dao.address, proposalId, {
      from: daoMember,
      gasPrice: toBN("0"),
    });

    // Checks the member's internal balance before sending the funds
    let memberBalance = await bank.balanceOf(daoMember, ETH_TOKEN);
    assert.equal(toBN(memberBalance).toString(), "0");

    // Distribute the funds to the DAO member
    // We can use 0 index here because the distribution happens for only 1 member
    await distributeContract.distribute(dao.address, 0, {
      from: daoMember,
      gasPrice: toBN("0"),
    });

    memberBalance = await bank.balanceOf(daoMember, ETH_TOKEN);
    assert.equal(toBN(memberBalance).toString(), amountToDistribute);
  });

  it("should be possible to distribute funds to all active members of the DAO", async () => {
    const daoOwner = accounts[2];
    const daoMemberA = accounts[3];
    const daoMemberB = accounts[4];

    let dao = await createDao(daoOwner);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      daoMemberA,
      daoOwner,
      sharePrice,
      SHARES,
      5 // asking for 5 shares
    );

    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      daoMemberB,
      daoOwner,
      sharePrice,
      SHARES,
      10 // asking for 10 shares
    );

    // Checks the Guild Bank Balance
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(guildBalance).toString(), "1800000000000000000");

    // Checks the member shares (to make sure it was created)
    let sharesMemberA = await bank.balanceOf(daoMemberA, SHARES);
    assert.equal(sharesMemberA.toString(), "5000000000000000");
    // Checks the member shares (to make sure it was created)
    let sharesMemberB = await bank.balanceOf(daoMemberB, SHARES);
    assert.equal(sharesMemberB.toString(), "10000000000000000");

    // Submit distribute proposal
    const amountToDistribute = 15;
    let { proposalId } = await distributeFundsProposal(
      dao,
      distributeContract,
      ETH_TOKEN,
      amountToDistribute,
      "0x0000000000000000000000000000000000000000", //indicates the funds should be distributed to all active members
      daoOwner
    );

    // Vote YES on the proposal
    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Starts to process the proposal
    await distributeContract.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Checks the member's internal balance before sending the funds
    let memberABalance = await bank.balanceOf(daoMemberA, ETH_TOKEN);
    assert.equal(toBN(memberABalance).toString(), "0");
    let memberBBalance = await bank.balanceOf(daoMemberB, ETH_TOKEN);
    assert.equal(toBN(memberBBalance).toString(), "0");

    let numberOfMembers = toBN(await dao.getNbMembers()).toNumber();
    // It is expected to get 5 members:
    // 1 - dao owner
    // 1 - dao factory
    // 1 - dao payer (who paid to create the dao)
    // 2 - dao members
    // But the dao owner and the factory addresses are not active members
    // so they will not receive funds.
    assert.equal(numberOfMembers, 5);

    // Distribute the funds to the DAO member
    // toIndex = number of members to process and distribute the funds to all members
    await distributeContract.distribute(dao.address, numberOfMembers, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    memberABalance = await bank.balanceOf(daoMemberA, ETH_TOKEN);
    assert.equal(memberABalance, 4); //4.9999... rounded to 4
    memberBBalance = await bank.balanceOf(daoMemberB, ETH_TOKEN);
    assert.equal(memberBBalance, 9); //9.9999... rounded to 9
    let ownerBalance = await bank.balanceOf(daoOwner, ETH_TOKEN);
    assert.equal(ownerBalance, 0);
  });

  it("should not be possible to create a proposal with the amount equals to 0", async () => {
    const daoOwner = accounts[2];

    let dao = await createDao(daoOwner);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );

    // Submit distribute proposal with invalid amount
    const amountToDistribute = 0;
    try {
      await distributeFundsProposal(
        dao,
        distributeContract,
        ETH_TOKEN,
        amountToDistribute,
        daoOwner,
        daoOwner
      );
      assert.fail("should not be possible to distribute 0 funds to members");
    } catch (err) {
      assert.equal(err.reason, "invalid amount");
    }
  });

  it("should not be possible to create a proposal with an invalid token", async () => {
    const daoOwner = accounts[2];

    let dao = await createDao(daoOwner);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );

    // Submit distribute proposal with invalid amount
    const invalidToken = "0x0000000000000000000000000000000000000123";
    try {
      await distributeFundsProposal(
        dao,
        distributeContract,
        invalidToken,
        10,
        daoOwner,
        daoOwner
      );
      assert.fail(
        "should not be possible to distribute funds using an invalid token"
      );
    } catch (err) {
      assert.equal(err.reason, "token not allowed");
    }
  });

  it("should not be possible to create a proposal if the sender is not a member", async () => {
    const daoOwner = accounts[2];
    const nonMember = accounts[5];

    let dao = await createDao(daoOwner);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );

    // Submit distribute proposal with invalid amount
    const invalidToken = "0x0000000000000000000000000000000000000123";
    try {
      await distributeFundsProposal(
        dao,
        distributeContract,
        invalidToken,
        10,
        daoOwner,
        nonMember
      );
      assert.fail(
        "should not be create a proposal if it was sent by a non member"
      );
    } catch (err) {
      assert.equal(err.reason, "onlyMember");
    }
  });

  it("should not be possible to create a proposal if the target member does not have shares (advisor)", async () => {
    const daoOwner = accounts[2];
    const advisor = accounts[3];

    let dao = await createDao(daoOwner);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    // New member joins as an Advisor (only receives LOOT)
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      advisor,
      daoOwner,
      sharePrice,
      LOOT,
      10
    );

    // Submit distribute proposal with a non active member
    try {
      await distributeFundsProposal(
        dao,
        distributeContract,
        ETH_TOKEN,
        10,
        advisor,
        daoOwner
      );
      assert.fail(
        "should not be create a proposal if the member does not have shares"
      );
    } catch (err) {
      assert.equal(err.reason, "not enough shares");
    }
  });

  it("should not be possible to create a proposal if the target member is in jail due to a guild kick", async () => {
    const daoOwner = accounts[2];
    const jailedMember = accounts[8];

    let dao = await createDao(daoOwner);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    // New member joins as an Advisor (only receives LOOT)
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      jailedMember,
      daoOwner,
      sharePrice,
      SHARES,
      10
    );

    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    let { kickProposalId } = await guildKickProposal(
      dao,
      guildkickContract,
      jailedMember,
      daoOwner
    );
    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Submit distribute proposal with a member that is in jail
    try {
      await distributeFundsProposal(
        dao,
        distributeContract,
        ETH_TOKEN,
        10,
        jailedMember,
        daoOwner
      );
      assert.fail(
        "should not be possible to create a proposal if the member does not have shares"
      );
    } catch (err) {
      assert.equal(err.reason, "not enough shares");
    }
  });

  it("should not be possible to create a proposal if the a non member is indicated to receive the funds", async () => {
    const daoOwner = accounts[2];
    const nonMember = accounts[3];

    let dao = await createDao(daoOwner);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );

    // Submit distribute proposal with a non member
    try {
      await distributeFundsProposal(
        dao,
        distributeContract,
        ETH_TOKEN,
        10,
        nonMember,
        daoOwner
      );
      assert.fail(
        "should not be possible to create a proposal if a non member was indicated to receive the funds"
      );
    } catch (err) {
      assert.equal(err.reason, "not enough shares");
    }
  });

  it("should not be possible to create more than one proposal using the same proposal id", async () => {
    const daoOwner = accounts[2];
    const daoMember = accounts[3];

    let dao = await createDao(daoOwner);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      daoMember,
      daoOwner,
      sharePrice,
      SHARES,
      10
    );

    // Submit distribute proposal for the 1st time
    let { proposalId } = await distributeFundsProposal(
      dao,
      distributeContract,
      ETH_TOKEN,
      10,
      daoMember,
      daoOwner
    );

    // Submit distribute proposal using the same id
    try {
      await distributeFundsProposal(
        dao,
        distributeContract,
        ETH_TOKEN,
        10,
        daoMember,
        daoOwner,
        proposalId
      );
      assert.fail(
        "should not be possible to create a proposal with the same id"
      );
    } catch (err) {
      assert.equal(err.reason, "proposalId must be unique");
    }
  });

  it("should not be possible to process a proposal that did not pass", async () => {
    const daoOwner = accounts[2];
    const daoMemberA = accounts[3];

    let dao = await createDao(daoOwner);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      daoMemberA,
      daoOwner,
      sharePrice,
      SHARES,
      10
    );

    // Submit distribute proposal for the 1st time
    let { proposalId } = await distributeFundsProposal(
      dao,
      distributeContract,
      ETH_TOKEN,
      5,
      daoMemberA,
      daoOwner
    );

    try {
      // Starts to process the proposal
      await distributeContract.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a proposal that did not pass"
      );
    } catch (err) {
      assert.equal(err.reason, "proposal did not pass");
    }
  });

  it("should not be possible to process a proposal that was already processed", async () => {
    const daoOwner = accounts[2];
    const daoMemberA = accounts[3];

    let dao = await createDao(daoOwner);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      daoMemberA,
      daoOwner,
      sharePrice,
      SHARES,
      10
    );

    // Submit distribute proposal for the 1st time
    let { proposalId } = await distributeFundsProposal(
      dao,
      distributeContract,
      ETH_TOKEN,
      5,
      daoMemberA,
      daoOwner
    );

    // Vote YES on the proposal
    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Starts to process the proposal
    await distributeContract.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    try {
      // Attempt to process the same proposal that is already in progress
      await distributeContract.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process a proposal that was already processed"
      );
    } catch (err) {
      // when the flag is already set, it means the proposal was processed already,
      // so it is not possible to process it again
      assert.equal(err.reason, "flag already set");
    }
  });

  it("should not be possible to process a new proposal if there is another in progress", async () => {
    const daoOwner = accounts[2];
    const daoMemberA = accounts[3];

    let dao = await createDao(daoOwner);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      daoMemberA,
      daoOwner,
      sharePrice,
      SHARES,
      10
    );

    // Submit distribute proposal for the 1st time
    let { proposalId } = await distributeFundsProposal(
      dao,
      distributeContract,
      ETH_TOKEN,
      5,
      daoMemberA,
      daoOwner
    );

    // Vote YES on the proposal
    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Starts to process the proposal
    await distributeContract.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Creates a new distribution proposal
    let result = await distributeFundsProposal(
      dao,
      distributeContract,
      ETH_TOKEN,
      5,
      daoMemberA,
      daoOwner
    );

    // Vote YES on the proposal
    await voting.submitVote(dao.address, result.proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    try {
      // Attempt to process the new proposal but there is one in progress already
      await distributeContract.processProposal(dao.address, result.proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to process more than one proposal at time"
      );
    } catch (err) {
      assert.equal(err.reason, "another proposal already in progress");
    }
  });

  it("should not be possible to distribute the funds if the proposal is not in progress", async () => {
    const daoOwner = accounts[2];
    const daoMemberA = accounts[3];

    let dao = await createDao(daoOwner);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      daoMemberA,
      daoOwner,
      sharePrice,
      SHARES,
      10
    );

    // Submit distribute proposal for the 1st time
    await distributeFundsProposal(
      dao,
      distributeContract,
      ETH_TOKEN,
      5,
      daoMemberA,
      daoOwner
    );

    try {
      // Try to distribute funds when the proposal is not in progress
      await distributeContract.distribute(dao.address, 1, {
        from: daoOwner,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to distribute if the proposal is not in progress"
      );
    } catch (err) {
      assert.equal(err.reason, "distribution completed or does not exist");
    }
  });

  it("should be possible to distribute the funds if the member was put in jail after the distribution proposal was processed", async () => {
    const daoOwner = accounts[2];
    const jailedMember = accounts[8];

    let dao = await createDao(daoOwner);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    // New member joins as an Advisor (only receives LOOT)
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      jailedMember,
      daoOwner,
      sharePrice,
      SHARES,
      10
    );

    // Creates the distribution proposal
    let { proposalId } = await distributeFundsProposal(
      dao,
      distributeContract,
      ETH_TOKEN,
      10,
      jailedMember,
      daoOwner
    );
    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    // Starts to process the proposal
    await distributeContract.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // The members decide to kick out a share holder
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    let { kickProposalId } = await guildKickProposal(
      dao,
      guildkickContract,
      jailedMember,
      daoOwner
    );
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    // Share holder is put in jail and has the shares converted to Loot
    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Attempt to distribute the funds after the member was jailed
    await distributeContract.distribute(dao.address, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);
    let jailedMemberBalance = await bank.balanceOf(jailedMember, ETH_TOKEN);
    assert.equal(toBN(jailedMemberBalance).toString(), 10);
  });

  it("should not be possible to distribute the funds if the member was put in jail before the distribution proposal was processed", async () => {
    const daoOwner = accounts[2];
    const jailedMember = accounts[8];

    let dao = await createDao(daoOwner);
    const distributeContract = await getContract(
      dao,
      "distribute",
      DistributeContract
    );

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    // New member joins as an Advisor (only receives LOOT)
    await onboardingNewMember(
      dao,
      onboarding,
      voting,
      jailedMember,
      daoOwner,
      sharePrice,
      SHARES,
      10
    );

    // Creates the distribution proposal
    let { proposalId } = await distributeFundsProposal(
      dao,
      distributeContract,
      ETH_TOKEN,
      10,
      jailedMember,
      daoOwner
    );
    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // The members decide to kick out a share holder
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );
    let { kickProposalId } = await guildKickProposal(
      dao,
      guildkickContract,
      jailedMember,
      daoOwner
    );
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Share holder is put in jail and has the shares converted to Loot
    await guildkickContract.processProposal(dao.address, kickProposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // The distribution proposal is processed after the guild kick proposal is processed
    await distributeContract.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    try {
      // Attempt to distribute the funds after the member was jailed
      await distributeContract.distribute(dao.address, 1, {
        from: daoOwner,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "not enough shares");
    }
  });
});
