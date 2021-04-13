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
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  accounts,
  sharePrice,
  GUILD,
  ETH_TOKEN,
  SHARES,
  ESCROW,
  LOOT,
  expect,
  expectRevert,
} = require("../../utils/DaoFactory.js");

const {
  sponsorNewMember,
  onboardingNewMember,
} = require("../../utils/TestUtils.js");

describe("Adapter - Distribute", () => {
  const daoOwner = accounts[2];
  const proposalCounter = proposalIdGenerator().generator;

  const getProposalCounter = () => {
    return proposalCounter().next().value;
  };

  beforeAll(async () => {
    const { dao, adapters, extensions } = await deployDefaultDao(daoOwner);
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

  const distributeFundsProposal = async (
    dao,
    distributeContract,
    token,
    amount,
    shareHolderArr,
    sender,
    proposalId = null
  ) => {
    const newProposalId = proposalId ? proposalId : getProposalCounter();
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
    const daoMember = accounts[3];
    const dao = this.dao;
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const distributeContract = this.adapters.distribute;

    await onboardingNewMember(
      getProposalCounter(),
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
    expect(toBN(guildBalance).toString()).equal("1200000000000000000");

    // Checks the member shares (to make sure it was created)
    let shares = await bank.balanceOf(daoMember, SHARES);
    expect(shares.toString()).equal("10000000000000000");

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

    const escrowBalance = await bank.balanceOf(ESCROW, ETH_TOKEN);
    expect(toBN(escrowBalance).toString()).equal(amountToDistribute.toString());

    // Checks the member's internal balance before sending the funds
    let memberBalance = await bank.balanceOf(daoMember, ETH_TOKEN);
    expect(toBN(memberBalance).toString()).equal("0");

    // Distribute the funds to the DAO member
    // We can use 0 index here because the distribution happens for only 1 member
    await distributeContract.distribute(dao.address, 0, {
      from: daoMember,
      gasPrice: toBN("0"),
    });

    memberBalance = await bank.balanceOf(daoMember, ETH_TOKEN);
    expect(memberBalance.toString()).equal(amountToDistribute.toString());

    const newEscrowBalance = await bank.balanceOf(ESCROW, ETH_TOKEN);
    expect(newEscrowBalance.toString()).equal("0");
  });

  it("should be possible to distribute funds to all active members of the DAO", async () => {
    const daoMemberA = accounts[3];
    const daoMemberB = accounts[4];
    const dao = this.dao;
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const distributeContract = this.adapters.distribute;

    await onboardingNewMember(
      getProposalCounter(),
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
      getProposalCounter(),
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
    expect(toBN(guildBalance).toString()).equal("1800000000000000000");

    // Checks the member shares (to make sure it was created)
    let sharesMemberA = await bank.balanceOf(daoMemberA, SHARES);
    expect(sharesMemberA.toString()).equal("5000000000000000");
    // Checks the member shares (to make sure it was created)
    let sharesMemberB = await bank.balanceOf(daoMemberB, SHARES);
    expect(sharesMemberB.toString()).equal("10000000000000000");

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
    expect(toBN(memberABalance).toString()).equal("0");
    let memberBBalance = await bank.balanceOf(daoMemberB, ETH_TOKEN);
    expect(toBN(memberBBalance).toString()).equal("0");

    let numberOfMembers = toBN(await dao.getNbMembers()).toNumber();
    // It is expected to get 5 members:
    // 1 - dao owner
    // 1 - dao factory
    // 1 - dao payer (who paid to create the dao)
    // 2 - dao members
    // But the dao owner and the factory addresses are not active members
    // so they will not receive funds.
    expect(numberOfMembers).equal(5);

    // Distribute the funds to the DAO member
    // toIndex = number of members to process and distribute the funds to all members
    await distributeContract.distribute(dao.address, numberOfMembers, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    memberABalance = await bank.balanceOf(daoMemberA, ETH_TOKEN);
    expect(memberABalance.toString()).equal("4"); //4.9999... rounded to 4
    memberBBalance = await bank.balanceOf(daoMemberB, ETH_TOKEN);
    expect(memberBBalance.toString()).equal("9"); //9.9999... rounded to 9
    let ownerBalance = await bank.balanceOf(daoOwner, ETH_TOKEN);
    expect(ownerBalance.toString()).equal("0");
  });

  it("should not be possible to create a proposal with the amount equals to 0", async () => {
    const dao = this.dao;
    const distributeContract = this.adapters.distribute;

    // Submit distribute proposal with invalid amount
    const amountToDistribute = 0;
    await expectRevert(
      distributeContract.submitProposal(
        dao.address,
        getProposalCounter(),
        daoOwner,
        ETH_TOKEN,
        amountToDistribute,
        fromUtf8("paying dividends"),
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "invalid amount"
    );
  });

  it("should not be possible to create a proposal with an invalid token", async () => {
    const dao = this.dao;
    const distributeContract = this.adapters.distribute;

    // Submit distribute proposal with invalid token
    const invalidToken = "0x0000000000000000000000000000000000000123";
    await expectRevert(
      distributeContract.submitProposal(
        dao.address,
        getProposalCounter(),
        daoOwner,
        invalidToken,
        10,
        fromUtf8("paying dividends"),
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "token not allowed"
    );
  });

  it("should not be possible to create a proposal if the sender is not a member", async () => {
    const nonMember = accounts[5];
    const dao = this.dao;
    const distributeContract = this.adapters.distribute;

    await expectRevert(
      distributeContract.submitProposal(
        dao.address,
        getProposalCounter(),
        daoOwner,
        ETH_TOKEN,
        10,
        fromUtf8("paying dividends"),
        {
          from: nonMember, // The sender is not a member
          gasPrice: toBN("0"),
        }
      ),
      "onlyMember"
    );
  });

  it("should not be possible to create a proposal if the target member does not have shares (advisor)", async () => {
    const advisor = accounts[3];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const distributeContract = this.adapters.distribute;

    // New member joins as an Advisor (only receives LOOT)
    await onboardingNewMember(
      getProposalCounter(),
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
    await expectRevert(
      distributeContract.submitProposal(
        dao.address,
        getProposalCounter(),
        advisor,
        ETH_TOKEN,
        10,
        fromUtf8("paying dividends"),
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "not enough shares"
    );
  });

  it("should not be possible to create a proposal if the a non member is indicated to receive the funds", async () => {
    const nonMember = accounts[3];
    const dao = this.dao;
    const distributeContract = this.adapters.distribute;

    // Submit distribute proposal with a non member
    await expectRevert(
      distributeContract.submitProposal(
        dao.address,
        getProposalCounter(),
        nonMember,
        ETH_TOKEN,
        10,
        fromUtf8("paying dividends"),
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "not enough shares"
    );
  });

  it("should not be possible to create more than one proposal using the same proposal id", async () => {
    const daoMember = accounts[3];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const distributeContract = this.adapters.distribute;

    await onboardingNewMember(
      getProposalCounter(),
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
    await expectRevert(
      distributeContract.submitProposal(
        dao.address,
        proposalId,
        daoMember,
        ETH_TOKEN,
        10,
        fromUtf8("paying dividends"),
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "proposalId must be unique"
    );
  });

  it("should not be possible to process a proposal that was not voted on", async () => {
    const daoMemberA = accounts[3];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const distributeContract = this.adapters.distribute;

    await onboardingNewMember(
      getProposalCounter(),
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

    // Starts to process the proposal
    await expectRevert(
      distributeContract.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal has not been voted on"
    );
  });

  it("should not be possible to distribute if proposal vote result is TIE", async () => {
    const daoMemberA = accounts[3];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const distributeContract = this.adapters.distribute;

    await onboardingNewMember(
      getProposalCounter(),
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

    // Vote NO on the proposal
    await voting.submitVote(dao.address, proposalId, 2, {
      from: daoMemberA,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Starts to process the proposal
    await distributeContract.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Try to distribute funds when the proposal is not in progress
    await expectRevert(
      distributeContract.distribute(dao.address, 0, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "distribution completed or does not exist"
    );
  });

  it("should not be possible to distribute if proposal vote result is NOT_PASS", async () => {
    const daoMemberA = accounts[3];

    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const distributeContract = this.adapters.distribute;

    await onboardingNewMember(
      getProposalCounter(),
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

    // Vote NO on the proposal
    await voting.submitVote(dao.address, proposalId, 2, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Vote NO on the proposal
    await voting.submitVote(dao.address, proposalId, 2, {
      from: daoMemberA,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Starts to process the proposal
    await distributeContract.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Try to distribute funds when the proposal is not in progress
    await expectRevert(
      distributeContract.distribute(dao.address, 0, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "distribution completed or does not exist"
    );
  });

  it("should not be possible to process a proposal that was already processed", async () => {
    const daoMemberA = accounts[3];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const distributeContract = this.adapters.distribute;

    await onboardingNewMember(
      getProposalCounter(),
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

    // Attempt to process the same proposal that is already in progress
    await expectRevert(
      distributeContract.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "flag already set"
    );
  });

  it("should not be possible to process a new proposal if there is another in progress", async () => {
    const daoMemberA = accounts[3];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const distributeContract = this.adapters.distribute;

    await onboardingNewMember(
      getProposalCounter(),
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

    // Attempt to process the new proposal but there is one in progress already
    await expectRevert(
      distributeContract.processProposal(dao.address, result.proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "another proposal already in progress"
    );
  });

  it("should not be possible to distribute the funds if the proposal is not in progress", async () => {
    const daoMemberA = accounts[3];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;
    const distributeContract = this.adapters.distribute;

    await onboardingNewMember(
      getProposalCounter(),
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

    // Try to distribute funds when the proposal is not in progress
    await expectRevert(
      distributeContract.distribute(dao.address, 1, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "distribution completed or does not exist"
    );
  });
});
