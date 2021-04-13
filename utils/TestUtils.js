// Whole-script strict mode syntax
"use strict";

const {
  sha3,
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

  Object.keys(testObject).forEach((key) => {
    assert.equal(
      testObject[key],
      returnValues[key],
      "value mismatch for key " + key
    );
  });
};

const checkBalance = async (bank, address, token, expectedBalance) => {
  const balance = await bank.balanceOf(address, token);

  assert.equal(balance.toString(), expectedBalance.toString());
};

const isMember = async (bank, member) => {
  const shares = await bank.balanceOf(member, SHARES);
  const loot = await bank.balanceOf(member, LOOT);

  return shares > toBN("0") || loot > toBN("0");
};

const createNFTDao = async (daoOwner) => {
  const dimenson = 100; // 100x100 pixel matrix
  const pixelNFT = await PixelNFT.new(dimenson);

  const dao = await createDao(
    daoOwner,
    sharePrice,
    numberOfShares,
    10,
    1,
    ETH_TOKEN,
    false
  );

  await dao.finalizeDao();

  return { dao, pixelNFT };
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
  assert.equal(nbShares.toString(), "10000000000000000");
};

module.exports = {
  checkLastEvent,
  checkBalance,
  createNFTDao,
  onboardNewMember,
  isMember,
};
