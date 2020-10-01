const {advanceTime, createDao, reportingTransaction, GUILD, sharePrice, remaining, numberOfShares, NonVotingOnboardingContract, VotingContract, MemberContract} = require('../../utils/DaoFactory.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

contract('MolochV3 - NonVoting Membership Adapter', async accounts => {

  it("should be possible to join a DAO as a member without any voting power", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const nonMemberAccount = accounts[3];
    
    let dao = await createDao({}, myAccount);
    
    const nonVotingOnboardingAddr = await dao.getAdapterAddress(sha3('nonvoting-onboarding'));
    const nonVotingMemberContract = await NonVotingOnboardingContract.at(
      nonVotingOnboardingAddr
    );

    const votingAddress = await dao.getAdapterAddress(sha3('voting'));
    const voting = await VotingContract.at(votingAddress);

     await dao.sendTransaction({
       from: otherAccount,
       value: sharePrice.mul(toBN(3)).add(remaining),
       gasPrice: toBN("0"),
     });
     
    await nonVotingMemberContract.sponsorProposal(dao.address, 0, [], {from: myAccount, gasPrice: toBN("0")});

    await reportingTransaction('submit vote', voting.submitVote(dao.address, 0, 1, {from: myAccount, gasPrice: toBN("0")}));
    
    try {
      await nonVotingMemberContract.processProposal(dao.address, 0, {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch(err) {
      assert.equal(err.reason, "proposal need to pass");
    }
    
    await advanceTime(10000);
    await nonVotingMemberContract.processProposal(dao.address, 0, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    
    const otherAccountLoot = await dao.nbLoot(otherAccount);
    const nonMemberAccountLoot = await dao.nbLoot(nonMemberAccount);
    assert.equal(
      otherAccountLoot.toString(),
      numberOfShares.mul(toBN("3")).toString()
    );
    assert.equal(nonMemberAccountLoot.toString(), "0");

    const guildBalance = await dao.balanceOf(GUILD, "0x0000000000000000000000000000000000000000");
    assert.equal(guildBalance.toString(), sharePrice.mul(toBN("3")).toString());
  })
});