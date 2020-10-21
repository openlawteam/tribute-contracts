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
const {advanceTime, createDao, GUILD, SHARES, sharePrice, remaining, numberOfShares, OnboardingContract, VotingContract} = require('../../utils/DaoFactory.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

contract('LAOLAND - Onboarding Adapter', async accounts => {

  it("should be possible to join a DAO", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const nonMemberAccount = accounts[3];
    
    let dao = await createDao(myAccount);
    
    const onboardingAddress = await dao.getAdapterAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3('voting'));
    const voting = await VotingContract.at(votingAddress);

    await onboarding.onboard(dao.address, otherAccount, SHARES, 0, {from:myAccount,value:sharePrice.mul(toBN(3)).add(remaining), gasPrice: toBN("0")});
    await onboarding.sponsorProposal(dao.address, 0, [], {from: myAccount, gasPrice: toBN("0")});

    voting.submitVote(dao.address, 0, 1, {from: myAccount, gasPrice: toBN("0")});
    
    try {
      await onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: toBN("0")});
    } catch(err) {
      assert.equal(err.reason, "proposal needs to pass");
    }
    
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: toBN("0")});
    
    const myAccountShares = await dao.nbShares(myAccount);
    const otherAccountShares = await dao.nbShares(otherAccount);
    const nonMemberAccountShares = await dao.nbShares(nonMemberAccount);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), numberOfShares.mul(toBN("3")).toString());
    assert.equal(nonMemberAccountShares.toString(), "0");

    const guildBalance = await dao.balanceOf(GUILD, "0x0000000000000000000000000000000000000000");
    assert.equal(guildBalance.toString(), sharePrice.mul(toBN("3")).toString());
  })

  it("should be possible to cancel a proposal", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    
    let dao = await createDao(myAccount);
    
    const onboardingAddress = await dao.getAdapterAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3('voting'));
    const voting = await VotingContract.at(votingAddress);

    await onboarding.onboard(dao.address, otherAccount, SHARES, 0, {from:myAccount,value:sharePrice.mul(toBN(3)).add(remaining), gasPrice: toBN("0")});

		await onboarding.cancelProposal(dao.address, 0, {from: myAccount, gasPrice: toBN("0")});
    const isCancelled = await dao.isProposalCancelled(toBN("0"));
		assert.equal(isCancelled, true);

		try {
			voting.submitVote(dao.address, 0, 1, {from: myAccount, gasPrice: toBN("0")});
		} catch(err) {
      assert.equal(err.reason, "proposal needs to pass");
		}

    try {
      await onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: toBN("0")});
    } catch(err) {
      assert.equal(err.reason, "proposal needs to pass");
    }
    
    const myAccountShares = await dao.nbShares(myAccount);
    const otherAccountShares = await dao.nbShares(otherAccount);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), numberOfShares.mul(toBN("0")).toString());

    const guildBalance = await dao.balanceOf(GUILD, "0x0000000000000000000000000000000000000000");
    assert.equal(guildBalance.toString(), sharePrice.mul(toBN("0")).toString());
  })
});
