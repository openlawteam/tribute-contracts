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
  DistributeContract,
  FinancingContract,
  LOOT,
  ManagingContract,
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
    console.log(toBN(memberBalance).toString());
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
    const amountToDistribute = 6;
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
    // It is expected to get 4 members:
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
    assert.equal(toBN(memberABalance).toString(), 1);
    memberBBalance = await bank.balanceOf(daoMemberB, ETH_TOKEN);
    assert.equal(toBN(memberBBalance).toString(), 3);
    let ownerBalance = await bank.balanceOf(daoOwner, ETH_TOKEN);
    assert.equal(toBN(ownerBalance).toString(), 0);
  });
});
