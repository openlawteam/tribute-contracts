// Whole-script strict mode syntax
"use strict";

const { toBN, advanceTime, SHARES } = require("./DaoFactory.js");

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

const submitNewMemberProposal = async (
  onboarding,
  dao,
  newMember,
  sharePrice,
  sender,
  proposalId
) => {
  await onboarding.onboard(
    dao.address,
    proposalId,
    newMember,
    SHARES,
    sharePrice.mul(toBN(100)),
    {
      from: sender,
      value: sharePrice.mul(toBN(10)),
      gasPrice: toBN("0"),
    }
  );
  return proposalId;
};

module.exports = {
  checkLastEvent,
  checkBalance,
};
