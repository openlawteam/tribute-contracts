const {advanceTime, createDao, GUILD, sharePrice, remaining, numberOfShares, BankContract, OnboardingContract, VotingContract, MemberContract} = require('../../utils/DaoFactory.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

contract('MolochV3 - Onboarding Adapter', async accounts => {

  it("should be possible to join a DAO", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const nonMemberAccount = accounts[3];
    
    let dao = await createDao({}, myAccount);
    
    const bankAddress = await dao.getAddress(sha3("bank"));
    const bank = await BankContract.at(bankAddress);
    
    const onboardingAddress = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAddress(sha3('voting'));
    const voting = await VotingContract.at(votingAddress);

    const memberAddress = await dao.getAddress(sha3('member'));
    const member = await MemberContract.at(memberAddress);

    await dao.sendTransaction({from:otherAccount,value:sharePrice.mul(toBN(3)).add(remaining), gasPrice: toBN("0")});
    await onboarding.sponsorProposal(dao.address, 0, [], {from: myAccount, gasPrice: toBN("0")});

    await voting.submitVote(dao.address, 0, 1, {from: myAccount, gasPrice: toBN("0")});
    
    try {
      await onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: toBN("0")});
    } catch(err) {
      assert.equal(err.reason, "proposal need to pass to be processed");
    }
    
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: toBN("0")});
    
    const myAccountShares = await member.nbShares(dao.address, myAccount);
    const otherAccountShares = await member.nbShares(dao.address, otherAccount);
    const nonMemberAccountShares = await member.nbShares(dao.address, nonMemberAccount);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), numberOfShares.mul(toBN("3")).toString());
    assert.equal(nonMemberAccountShares.toString(), "0");

    const guildBalance = await bank.balanceOf(GUILD, "0x0000000000000000000000000000000000000000");
    assert.equal(guildBalance.toString(), sharePrice.mul(toBN("3")).toString());
  })
});