const {advanceTime, createDao, sharePrice, remaining, GUILD, OnboardingContract, VotingContract, RagequitContract, ETH_TOKEN} = require('../../utils/DaoFactory.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

contract('MolochV3 - Ragequit Adapter', async accounts => {

  it("should not be possible for a non DAO member to ragequit", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];
  
    let dao = await createDao({}, myAccount);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    await dao.sendTransaction({ from: newMember, value: sharePrice.mul(toBN(10)).add(remaining), gasPrice: toBN("0") });
    //Get the new proposal id
    pastEvents = await dao.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;

    //Sponsor the new proposal, vote and process it 
    await onboarding.sponsorProposal(dao.address, proposalId, [], { from: myAccount, gasPrice: toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: toBN("0") });
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    let expectedGuildBalance = toBN("1200000000000000000");
    assert.equal(toBN(guildBalance).toString(), expectedGuildBalance.toString());

    //Check Member Shares
    let shares = await dao.nbShares(newMember);
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

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    await dao.sendTransaction({ from: newMember, value: sharePrice.mul(toBN(10)).add(remaining), gasPrice: toBN("0") });
    //Get the new proposal id
    pastEvents = await dao.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;

    //Sponsor the new proposal, vote and process it 
    await onboarding.sponsorProposal(dao.address, proposalId, [], { from: myAccount, gasPrice: toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: toBN("0") });
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1200000000000000000".toString());

    //Check Member Shares
    let shares = await dao.nbShares(newMember);
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

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    await dao.sendTransaction({ from: newMember, value: sharePrice.mul(toBN(100)), gasPrice: toBN("0") });
    //Get the new proposal id
    let pastEvents = await dao.getPastEvents();
    let { proposalId }  = pastEvents[0].returnValues;

    //Sponsor the new proposal to admit the new member, vote and process it 
    await onboarding.sponsorProposal(dao.address, proposalId, [], { from: myAccount, gasPrice: toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: toBN("0") });
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "12000000000000000000".toString());

    //Check New Member Shares
    let shares = await dao.nbShares(newMember);
    assert.equal(shares.toString(), "100000000000000000");

    //Ragequit - Burn all the new member shares
    let ragequitAddress = await dao.getAddress(sha3('ragequit'));
    let ragequitContract = await RagequitContract.at(ragequitAddress);
    await ragequitContract.ragequit(dao.address, toBN(shares), { from: newMember, gasPrice: toBN("0") });

    //Check New Member Shares
    let newShares = await dao.nbShares(newMember);
    assert.equal(newShares.toString(), "0");

    //Check Guild Bank Balance
    let newGuildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(newGuildBalance).toString(), "240"); //must be close to 0

    //Check Ragequit Event
    pastEvents = await ragequitContract.getPastEvents();
    let {member, burnedShares} = pastEvents[0].returnValues;
    assert.equal(member.toString(), newMember.toString());
    assert.equal(burnedShares.toString(), shares.toString());
  })

  it("should be possible to a member to ragequit if the member voted YES on a proposal that is not processed", async () => {
    //TODO: this test is currently passing, we don't support the v2 feature which prevents a member to ragequit if voted YES on a not processed proposal
  })

  it("should be possible to a member to ragequit if the member voted NO on a proposal that is not processed", async () => {
    //TODO: it must pass
  })

  it("should be possible to a member to ragequit if the member voted YES on a proposal that is processed", async () => {
    //TODO: it must pass
  })

  it("should be possible to a member to ragequit if the member voted NO on a proposal that is processed", async () => {
    //TODO: it must pass
  })
  
});