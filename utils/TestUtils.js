// Whole-script strict mode syntax
"use strict";

const {
  sha3,
  fromUtf8,
  toBN,
  createDao,
  getContract,
  advanceTime,
  sharePrice,
  numberOfShares,
  SHARES,
  ETH_TOKEN,
  OnboardingContract,
  PixelNFT,
  VotingContract,
  BankExtension,
  LOOT,
} = require("./DaoFactory.js");

const checkLastEvent = async (dao, testObject) => {
  let pastEvents = await dao.getPastEvents();
  let returnValues = pastEvents[0].returnValues;

  Object.keys(testObject).forEach((key) =>
    expect(testObject[key], "value mismatch for key " + key).toEqual(
      returnValues[key]
    )
  );
};

const checkBalance = async (bank, address, token, expectedBalance) => {
  const balance = await bank.balanceOf(address, token);

  expect(balance.toString()).toEqual(expectedBalance.toString());
};

const isMember = async (bank, member) => {
  const shares = await bank.balanceOf(member, SHARES);
  const loot = await bank.balanceOf(member, LOOT);

  return shares > toBN("0") || loot > toBN("0");
};

const submitNewMemberProposal = async (
  proposalId,
  member,
  onboarding,
  dao,
  newMember,
  sharePrice,
  token,
  desiredShares = toBN(10)
) => {
  await onboarding.onboard(
    dao.address,
    proposalId,
    newMember,
    token,
    sharePrice.mul(desiredShares),
    {
      from: member,
      value: sharePrice.mul(desiredShares),
      gasPrice: toBN("0"),
    }
  );
};

const onboardNewMember = async (dao, sponsor, newMember, proposalId) => {
  const voting = await getContract(dao, "voting", VotingContract);
  const onboarding = await getContract(dao, "onboarding", OnboardingContract);
  //Add funds to the Guild Bank after sposoring a member to join the Guild
  await onboarding.onboard(
    dao.address,
    proposalId,
    newMember,
    SHARES,
    sharePrice.mul(toBN(10)),
    {
      from: sponsor,
      value: sharePrice.mul(toBN(10)),
      gasPrice: toBN("0"),
    }
  );

  // Sponsor the new proposal
  await onboarding.sponsorProposal(dao.address, proposalId, [], {
    from: sponsor,
    gasPrice: toBN("0"),
  });

  // Vote yes
  await voting.submitVote(dao.address, proposalId, 1, {
    from: sponsor,
    gasPrice: toBN("0"),
  });

  await advanceTime(10000);

  await onboarding.processProposal(dao.address, proposalId, {
    from: sponsor,
    gasPrice: toBN("0"),
  });

  const bankAddress = await dao.getExtensionAddress(sha3("bank"));
  const bank = await BankExtension.at(bankAddress);
  const nbShares = await bank.balanceOf(newMember, SHARES);
  expect(nbShares.toString()).to.equal("10000000000000000");
};

const onboardingNewMember = async (
  proposalId,
  dao,
  onboarding,
  voting,
  newMember,
  sponsor,
  sharePrice,
  token,
  desiredShares = toBN(10)
) => {
  await submitNewMemberProposal(
    proposalId,
    sponsor,
    onboarding,
    dao,
    newMember,
    sharePrice,
    token,
    desiredShares
  );

  //Sponsor the new proposal, vote and process it
  await sponsorNewMember(onboarding, dao, proposalId, sponsor, voting);
  await onboarding.processProposal(dao.address, proposalId, {
    from: sponsor,
    gasPrice: toBN("0"),
  });
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

const guildKickProposal = async (
  dao,
  guildkickContract,
  memberToKick,
  sender,
  proposalId
) => {
  await guildkickContract.submitKickProposal(
    dao.address,
    proposalId,
    memberToKick,
    fromUtf8(""),
    {
      from: sender,
      gasPrice: toBN("0"),
    }
  );
};

module.exports = {
  checkLastEvent,
  checkBalance,
  onboardNewMember,
  submitNewMemberProposal,
  sponsorNewMember,
  onboardingNewMember,
  guildKickProposal,
  isMember,
};
