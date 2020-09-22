const {advanceTime, createDao, sharePrice, remaining, GUILD, BankContract, OnboardingContract, ProposalContract, VotingContract, MemberContract, RagequitContract, ETH_TOKEN} = require('../../utils/DaoFactory.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

contract('MolochV3 - Ragequit Adapter', async accounts => {

  it("should not be possible for a non DAO member to ragequit", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];
  
    let dao = await createDao({}, myAccount);

    const bankAddress = await dao.getAddress(sha3("bank"));
    const bank = await BankContract.at(bankAddress);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const proposalAddress = await dao.getAddress(sha3("proposal"));
    const proposal = await ProposalContract.at(proposalAddress);

    const votingAddress = await dao.getAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    const memberAddress = await dao.getAddress(sha3("member"));
    const member = await MemberContract.at(memberAddress);

    await dao.sendTransaction({ from: newMember, value: sharePrice.mul(toBN(10)).add(remaining), gasPrice: toBN("0") });
    //Get the new proposal id
    pastEvents = await proposal.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;

    //Sponsor the new proposal, vote and process it 
    await onboarding.sponsorProposal(dao.address, proposalId, [], { from: myAccount, gasPrice: toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: toBN("0") });
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(dao.address, GUILD, ETH_TOKEN);
    let expectedGuildBalance = toBN("1200000000000000000");
    assert.equal(toBN(guildBalance).toString(), expectedGuildBalance.toString());

    //Check Member Shares
    let shares = await member.nbShares(dao.address, newMember);
    assert.equal(shares.toString(), "10000000000000000");

    //Ragequit
    let ragequitAddress = await dao.getAddress(sha3('ragequit'));
    let ragequitContract = await RagequitContract.at(ragequitAddress);
    try {
      let nonMember = accounts[4];
      await ragequitContract.ragequit(dao.address, toBN(shares), { from: nonMember, gasPrice: toBN("0") });
    } catch (error){
      assert.equal(error.reason, "restricted to DAO members");
    }
  })

  it("should not be possible to a member to ragequit when the member does not have enough shares", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao({}, myAccount);

    const bankAddress = await dao.getAddress(sha3("bank"));
    const bank = await BankContract.at(bankAddress);

    const proposalAddress = await dao.getAddress(sha3("proposal"));
    const proposal = await ProposalContract.at(proposalAddress);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    const memberAddress = await dao.getAddress(sha3("member"));
    const member = await MemberContract.at(memberAddress);

    await dao.sendTransaction({ from: newMember, value: sharePrice.mul(toBN(10)).add(remaining), gasPrice: toBN("0") });
    //Get the new proposal id
    pastEvents = await proposal.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;

    //Sponsor the new proposal, vote and process it 
    await onboarding.sponsorProposal(dao.address, proposalId, [], { from: myAccount, gasPrice: toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: toBN("0") });
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(dao.address, GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1200000000000000000".toString());

    //Check Member Shares
    let shares = await member.nbShares(dao.address, newMember);
    assert.equal(shares.toString(), "10000000000000000");

    //Ragequit
    let ragequitAddress = await dao.getAddress(sha3('ragequit'));
    let ragequitContract = await RagequitContract.at(ragequitAddress);
    try {
      //Trying to Ragequit with shares + 1 to burn
      await ragequitContract.ragequit(dao.address, toBN("10000000000000001"), { from: newMember, gasPrice: toBN("0") });
    } catch (error){
      assert.equal(error.reason, "insufficient shares");
    }

    try {
      //Trying to Ragequit 0 shares to burn
      await ragequitContract.ragequit(dao.address, toBN("0"), { from: newMember, gasPrice: toBN("0") });
    } catch (error) {
      assert.equal(error.reason, "insufficient shares");
    }

  })

  it("should be possible to a member to ragequit when the member has not voted on any proposals yet", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];
    
    let dao = await createDao({}, myAccount);

    const bankAddress = await dao.getAddress(sha3("bank"));
    const bank = await BankContract.at(bankAddress);

    const proposalAddress = await dao.getAddress(sha3("proposal"));
    const proposal = await ProposalContract.at(proposalAddress);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    const memberAddress = await dao.getAddress(sha3("member"));
    const memberContract = await MemberContract.at(memberAddress);

    await dao.sendTransaction({ from: newMember, value: sharePrice.mul(toBN(100)), gasPrice: toBN("0") });
    //Get the new proposal id
    let pastEvents = await proposal.getPastEvents();
    let { proposalId }  = pastEvents[0].returnValues;

    //Sponsor the new proposal, vote and process it 
    await onboarding.sponsorProposal(dao.address, proposalId, [], { from: myAccount, gasPrice: toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: toBN("0") });
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(dao.address, GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "12000000000000000000".toString());

    //Check Member Shares
    let shares = await memberContract.nbShares(dao.address, newMember);
    assert.equal(shares.toString(), "100000000000000000");

    //Ragequit - burn all member shares
    let ragequitAddress = await dao.getAddress(sha3('ragequit'));
    let ragequitContract = await RagequitContract.at(ragequitAddress);
    await ragequitContract.ragequit(dao.address, toBN(shares), { from: newMember, gasPrice: toBN("0") });

    //Check Guild Bank Balance
    guildBalance = await bank.balanceOf(dao.address, GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "240"); //must be close to 0

    //Check Member Shares
    let newShares = await memberContract.nbShares(dao.address, newMember);
    assert.equal(newShares.toString(), "0");

    //Check Ragequit Event
    pastEvents = await ragequitContract.getPastEvents();
    let {member, burnedShares} = pastEvents[0].returnValues;
    assert.equal(member.toString(), newMember.toString());
    assert.equal(burnedShares.toString(), shares.toString());
  })

  it("should be possible to a member to ragequit even if the member voted YES on a proposal", async () => {
    //TODO
  })

  it("should be possible to a member to ragequit even if the member voted NO on a proposal", async () => {
    //TODO
  })
});