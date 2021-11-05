// Whole-script strict mode syntax
"use strict";

const { toBN, UNITS, LOOT } = require("./ContractUtil.js");

const { expect, advanceTime } = require("./OZTestUtil.js");

const checkLastEvent = async (dao, testObject) => {
  let pastEvents = await dao.getPastEvents();
  let returnValues = pastEvents[0].returnValues;

  Object.keys(testObject).forEach((key) =>
    expect(testObject[key], "value mismatch for key " + key).equal(
      returnValues[key]
    )
  );
};

const checkBalance = async (bank, address, token, expectedBalance) => {
  const balance = await bank.balanceOf(address, token);

  expect(balance.toString()).equal(expectedBalance.toString());
};

const isMember = async (bank, member) => {
  const units = await bank.balanceOf(member, UNITS);

  return units > toBN("0");
};

const submitNewMemberProposal = async (
  proposalId,
  member,
  onboarding,
  dao,
  newMember,
  unitPrice,
  token,
  desiredUnits = toBN(10)
) => {
  await onboarding.submitProposal(
    dao.address,
    proposalId,
    newMember,
    token,
    unitPrice.mul(desiredUnits),
    [],
    {
      from: member,
      gasPrice: toBN("0"),
    }
  );
};

const onboardingNewMember = async (
  proposalId,
  dao,
  onboarding,
  voting,
  newMember,
  sponsor,
  unitPrice,
  token,
  desiredUnits = toBN(10)
) => {
  await submitNewMemberProposal(
    proposalId,
    sponsor,
    onboarding,
    dao,
    newMember,
    unitPrice,
    token,
    desiredUnits
  );

  //vote and process it
  await voting.submitVote(dao.address, proposalId, 1, {
    from: sponsor,
    gasPrice: toBN("0"),
  });
  await advanceTime(10000);

  await onboarding.processProposal(dao.address, proposalId, {
    from: sponsor,
    value: unitPrice.mul(desiredUnits),
    gasPrice: toBN("0"),
  });
};

const guildKickProposal = async (
  dao,
  guildkickContract,
  memberToKick,
  sender,
  proposalId
) => {
  await guildkickContract.submitProposal(
    dao.address,
    proposalId,
    memberToKick,
    [],
    {
      from: sender,
      gasPrice: toBN("0"),
    }
  );
};

const submitConfigProposal = async (
  dao,
  proposalId,
  sender,
  configuration,
  voting,
  configs
) => {
  //Submit a new configuration proposal
  await configuration.submitProposal(dao.address, proposalId, configs, [], {
    from: sender,
    gasPrice: toBN("0"),
  });

  await voting.submitVote(dao.address, proposalId, 1, {
    from: sender,
    gasPrice: toBN("0"),
  });

  await advanceTime(10000);
  await configuration.processProposal(dao.address, proposalId, {
    from: sender,
    gasPrice: toBN("0"),
  });
};

module.exports = {
  checkLastEvent,
  checkBalance,
  submitNewMemberProposal,
  onboardingNewMember,
  guildKickProposal,
  submitConfigProposal,
  isMember,
};
