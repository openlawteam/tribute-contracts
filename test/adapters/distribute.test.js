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

const {
  toBN,
  toWei,
  fromUtf8,
  fromAscii,
  unitPrice,
  UNITS,
  GUILD,
  ETH_TOKEN,
  LOOT,
  ESCROW,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  accounts,
  expectRevert,
  expect,
  web3,
} = require("../../utils/oz-util");

const { onboardingNewMember } = require("../../utils/test-util");

const daoOwner = accounts[2];

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Distribute", () => {
  before("deploy dao", async () => {
    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
      // creator: accounts[5]
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

  const distributeFundsProposal = async (
    dao,
    distributeContract,
    token,
    amount,
    unitHolderArr,
    sender,
    proposalId = null
  ) => {
    const newProposalId = proposalId ? proposalId : getProposalCounter();
    await distributeContract.submitProposal(
      dao.address,
      newProposalId,
      unitHolderArr,
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
    const bank = this.extensions.bankExt;
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
      unitPrice,
      UNITS
    );

    // Checks the Guild Bank Balance
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("1200000000000000000");

    // Checks the member units (to make sure it was created)
    let units = await bank.balanceOf(daoMember, UNITS);
    expect(units.toString()).equal("10000000000000000");

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
    expect(escrowBalance.toString()).equal(amountToDistribute.toString());

    // Checks the member's internal balance before sending the funds
    let memberBalance = await bank.balanceOf(daoMember, ETH_TOKEN);
    expect(memberBalance.toString()).equal("0");

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
    const bank = this.extensions.bankExt;
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
      unitPrice,
      UNITS,
      toBN(5) // asking for 5 units
    );

    await onboardingNewMember(
      getProposalCounter(),
      dao,
      onboarding,
      voting,
      daoMemberB,
      daoOwner,
      unitPrice,
      UNITS
    );

    // Checks the Guild Bank Balance
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("1800000000000000000");

    // Checks the member units (to make sure it was created)
    let unitsMemberA = await bank.balanceOf(daoMemberA, UNITS);
    expect(unitsMemberA.toString()).equal("5000000000000000");
    // Checks the member units (to make sure it was created)
    let unitsMemberB = await bank.balanceOf(daoMemberB, UNITS);
    expect(unitsMemberB.toString()).equal("10000000000000000");

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
    expect(memberABalance.toString()).equal("0");
    let memberBBalance = await bank.balanceOf(daoMemberB, ETH_TOKEN);
    expect(memberBBalance.toString()).equal("0");

    let numberOfMembers = await dao.getNbMembers();
    // It is expected to get 5 members:
    // 1 - dao owner
    // 1 - dao factory
    // 1 - dao payer (who paid to create the dao)
    // 2 - dao members
    // But the dao owner and the factory addresses are not active members
    // so they will not receive funds.
    expect(numberOfMembers.toString()).equal("5");

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

  it("should not be possible to create a proposal with the amount.toEquals to 0", async () => {
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

  it("should not be possible to create a proposal if the target member does not have units (advisor)", async () => {
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
      unitPrice,
      LOOT
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
      "not enough units"
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
      "not enough units"
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
      unitPrice,
      UNITS
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
      unitPrice,
      UNITS
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
      unitPrice,
      UNITS
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
      "distrib completed or not exist"
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
      unitPrice,
      UNITS
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
      "distrib completed or not exist"
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
      unitPrice,
      UNITS
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
      unitPrice,
      UNITS
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
      unitPrice,
      UNITS
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
      "distrib completed or not exist"
    );
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.distribute;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
      }),
      "revert"
    );
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const adapter = this.adapters.distribute;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
        data: fromAscii("should go to fallback func"),
      }),
      "revert"
    );
  });
});
