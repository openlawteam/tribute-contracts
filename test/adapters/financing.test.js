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
const {
  toBN,
  fromUtf8,
  getContract,
  advanceTime,
  createDao,
  GUILD,
  SHARES,
  sharePrice,
  OnboardingContract,
  VotingContract,
  FinancingContract,
  WithdrawContract,
  ETH_TOKEN,
} = require("../../utils/DaoFactory.js");
const { checkBalance } = require("../../utils/TestUtils.js");
const remaining = sharePrice.sub(toBN("50000000000000"));

contract("LAOLAND - Financing Adapter", async (accounts) => {
  const myAccount = accounts[1];
  const applicant = accounts[2];
  const newMember = accounts[3];
  const expectedGuildBalance = toBN("1200000000000000000");

  it("should be possible to any individual to request financing", async () => {
    let dao = await createDao(myAccount);
    const voting = await getContract(dao, "voting", VotingContract);
    const financing = await getContract(dao, "financing", FinancingContract);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const withdraw = await getContract(dao, "withdraw", WithdrawContract);

    let proposalId = "0x0";

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    await onboarding.onboard(
      dao.address,
      proposalId,
      newMember,
      SHARES,
      sharePrice.mul(toBN(10)).add(remaining),
      {
        from: myAccount,
        value: sharePrice.mul(toBN(10)).add(remaining),
        gasPrice: toBN("0"),
      }
    );

    //Sponsor the new proposal, vote and process it
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    //should not be able to process before the voting period has ended
    try {
      await onboarding.processProposal(dao.address, proposalId, {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal has not been voted on yet");
    }

    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    //Check Guild Bank Balance
    checkBalance(dao, GUILD, ETH_TOKEN, expectedGuildBalance);

    //Create Financing Request
    let requestedAmount = toBN(50000);
    proposalId = "0x1";
    await financing.createFinancingRequest(
      dao.address,
      proposalId,
      applicant,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8(""),
      { gasPrice: toBN("0") }
    );

    //Member sponsors the Financing proposal
    await financing.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Member votes on the Financing proposal
    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check applicant balance before Financing proposal is processed
    checkBalance(dao, applicant, ETH_TOKEN, "0");

    //Process Financing proposal after voting
    await advanceTime(10000);
    await financing.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check Guild Bank balance to make sure the transfer has happened
    checkBalance(
      dao,
      GUILD,
      ETH_TOKEN,
      expectedGuildBalance.sub(requestedAmount)
    );
    //Check the applicant token balance to make sure the funds are available in the bank for the applicant account
    checkBalance(dao, applicant, ETH_TOKEN, requestedAmount);

    const ethBalance = await web3.eth.getBalance(applicant);
    await withdraw.withdraw(dao.address, applicant, ETH_TOKEN, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    checkBalance(dao, applicant, ETH_TOKEN, 0);
    const ethBalance2 = await web3.eth.getBalance(applicant);
    assert.equal(
      toBN(ethBalance).add(requestedAmount).toString(),
      ethBalance2.toString()
    );
  });

  it("should not be possible to get the money if the proposal fails", async () => {
    let dao = await createDao(myAccount);
    const voting = await getContract(dao, "voting", VotingContract);
    const financing = await getContract(dao, "financing", FinancingContract);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    let proposalId = "0x0";
    await onboarding.onboard(
      dao.address,
      proposalId,
      newMember,
      SHARES,
      sharePrice.mul(toBN(10)).add(remaining),
      {
        from: myAccount,
        value: sharePrice.mul(toBN(10)).add(remaining),
        gasPrice: toBN("0"),
      }
    );

    //Sponsor the new proposal, vote and process it
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Create Financing Request
    let requestedAmount = toBN(50000);
    proposalId = "0x1";
    await financing.createFinancingRequest(
      dao.address,
      proposalId,
      applicant,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8("")
    );

    //Member sponsors the Financing proposal
    await financing.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Member votes on the Financing proposal
    await voting.submitVote(dao.address, proposalId, 2, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Process Financing proposal after voting
    await advanceTime(10000);
    try {
      await financing.processProposal(dao.address, proposalId, {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal needs to pass");
    }
  });

  it("should not be possible to submit a proposal with a token that is not allowed", async () => {
    let dao = await createDao(myAccount);
    const voting = await getContract(dao, "voting", VotingContract);
    const financing = await getContract(dao, "financing", FinancingContract);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    let proposalId = "0x0";
    //Add funds to the Guild Bank after sposoring a member to join the Guild
    await onboarding.onboard(
      dao.address,
      proposalId,
      newMember,
      SHARES,
      sharePrice.mul(toBN(10)).add(remaining),
      {
        from: myAccount,
        value: sharePrice.mul(toBN(10)).add(remaining),
        gasPrice: toBN("0"),
      }
    );

    //Sponsor the new proposal, vote and process it
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    try {
      proposalId = "0x1";
      const invalidToken = "0x6941a80e1a034f57ed3b1d642fc58ddcb91e2596";
      //Create Financing Request with a token that is not allowed
      let requestedAmount = toBN(50000);
      await financing.createFinancingRequest(
        dao.address,
        proposalId,
        applicant,
        invalidToken,
        requestedAmount,
        fromUtf8("")
      );
      assert.fail(
        "should not be possible to submit a proposal with a token that is not allowed"
      );
    } catch (err) {
      assert.equal(err.reason, "token not allowed");
    }
  });

  it("should not be possible to submit a proposal to request funding with an amount equals to zero", async () => {
    let dao = await createDao(myAccount);
    const voting = await getContract(dao, "voting", VotingContract);
    const financing = await getContract(dao, "financing", FinancingContract);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    let proposalId = "0x0";
    //Add funds to the Guild Bank after sposoring a member to join the Guild
    await onboarding.onboard(
      dao.address,
      proposalId,
      newMember,
      SHARES,
      sharePrice.mul(toBN(10)).add(remaining),
      {
        from: myAccount,
        value: sharePrice.mul(toBN(10)).add(remaining),
        gasPrice: toBN("0"),
      }
    );

    //Sponsor the new proposal, vote and process it
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    try {
      proposalId = "0x1";
      // Create Financing Request with amount = 0
      let requestedAmount = toBN(0);
      await financing.createFinancingRequest(
        dao.address,
        proposalId,
        applicant,
        ETH_TOKEN,
        requestedAmount,
        fromUtf8("")
      );
      assert.fail(
        "should not be possible to submit a proposal with an amount == 0"
      );
    } catch (err) {
      assert.equal(err.reason, "invalid requested amount");
    }
  });
});
