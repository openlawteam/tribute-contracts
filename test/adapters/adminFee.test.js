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
  sharePrice,
  GUILD,
  ETH_TOKEN,
  SHARES,
  LOOT,
  OLTokenContract,
  OnboardingContract,
  VotingContract,
  RagequitContract,
  FinancingContract,
} = require("../../utils/DaoFactory.js");
const {checkLastEvent} = require("../../utils/TestUtils.js");

contract("LAOLAND - Admin Fee Adapter", async (accounts) => {
  const submitNewMemberProposal = async (
    onboarding,
    dao,
    newMember,
    sharePrice
  ) => {
    const myAccount = accounts[1];

    await onboarding.onboard(
      dao.address,
      newMember,
      SHARES,
      sharePrice.mul(toBN(100)),
      {
        from: myAccount,
        value: sharePrice.mul(toBN(10)),
        gasPrice: toBN("0"),
      }
    );
    //Get the new proposal id
    let pastEvents = await dao.getPastEvents();
    let {proposalId} = pastEvents[0].returnValues;
    return proposalId;
  };

  const sponsorNewMember = async (
    onboarding,
    dao,
    proposalId,
    member,
    voting
  ) => {
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: member,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: member,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
  };

  const adminfee = async (dao, _laoFundAddress, _adminFeeDenominator) => {
    let adminFeeAddress = await dao.getAdapterAddress(sha3("ragequit"));
    let adminFeeContract = await AdminFee.at(adminFeeAddress);

    //configure admin K
    await adminFeeContract.configureAdmin(dao.address, accounts[2], 200, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //withdraw admin fee
    await adminFeeContract.withdrawAdminFee(dao.address, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
  }; //end of const adminfee

  /*
    check who can set admin fee denominator
    anyone can call withdraw
    check that payment period has passed before next withdraw can be called
    Check Guild balance
    Check Admin Balance 
*/

  // it("any Eth address should be able to call withdraw Admin fee" async() => {
  // });

  // it("should not be possible to withdraw adminfee before the paymentPeriod has passed" async() => {
  // });

  // it("the amount of tokens subtracted from the GUILD, should be the total GUILD balnce minus the GUILD balance divided by the adminFeeDenominator/denominator" async() => {
  // });

  // it(" laoFundAddress (recipient) should receive the amount of tokens in the GUILD divided by the denominator" async() => {
  // });

  // it("after the admin fee has been withdrawn, the next withdrawal should not occur until a paymentPeriod has passed since the lastPaymentTime" async() => {
  // });
}); //end of contract
