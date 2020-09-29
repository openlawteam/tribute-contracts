const {advanceTime, createDao, sharePrice, remaining, GUILD, OnboardingContract, VotingContract, RagequitContract, FinancingContract, ETH_TOKEN} = require('../../utils/DaoFactory.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

contract('MolochV3 - Ragequit Adapter', async accounts => {

  submitNewMemberProposal = async (dao, newMember, sharePrice) => {
    await dao.sendTransaction({
      from: newMember,
      value: sharePrice.mul(toBN(100)),
      gasPrice: toBN("0"),
    });
    //Get the new proposal id
    let pastEvents = await dao.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;
    return proposalId;
  };

  sponsorNewMember = async (
    onboarding,
    dao,
    proposalId,
    myAccount,
    voting
  ) => {
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
  }

  ragequit = async (dao, shares, member) => {
    let ragequitAddress = await dao.getAdapterAddress(sha3("ragequit"));
    let ragequitContract = await RagequitContract.at(ragequitAddress);
    await ragequitContract.ragequit(dao.address, toBN(shares), {
      from: member,
      gasPrice: toBN("0"),
    });

    //Check New Member Shares
    let newShares = await dao.nbShares(member);
    assert.equal(newShares.toString(), "0");
    return ragequitContract;
  }

  it("should not be possible for a non DAO member to ragequit", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];
  
    let dao = await createDao({}, myAccount);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAdapterAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    let proposalId = await submitNewMemberProposal(dao, newMember, sharePrice);

    //Sponsor the new proposal, vote and process it 
    await sponsorNewMember(onboarding, dao, proposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(guildBalance).toString(), "12000000000000000000");

    //Check Member Shares
    let shares = await dao.nbShares(newMember);
    assert.equal(shares.toString(), "100000000000000000");

    //Ragequit
    try {
      let nonMember = accounts[4];
      await ragequit(dao, toBN(shares), nonMember);
    } catch (error){
      assert.equal(error.reason, "onlyMember");
    }
  })

  it("should not be possible to a member to ragequit when the member does not have enough shares", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao({}, myAccount);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAdapterAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    let proposalId = await submitNewMemberProposal(dao, newMember, sharePrice);

    //Sponsor the new proposal, vote and process it 
    await sponsorNewMember(onboarding, dao, proposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "12000000000000000000".toString());

    //Check Member Shares
    let shares = await dao.nbShares(newMember);
    assert.equal(shares.toString(), "100000000000000000");

    //Ragequit
    try {
      //Trying to Ragequit with shares + 1 to burn
      await ragequit(dao, toBN("100000000000000001"), newMember);
    } catch (error){
      assert.equal(error.reason, "insufficient shares");
    }

    try {
      //Trying to Ragequit 0 shares to burn
      await ragequit(dao, toBN("0"), newMember);
    } catch (error) {
      assert.equal(error.reason, "insufficient shares");
    }

  })

  it("should be possible to a member to ragequit when the member has not voted on any proposals yet", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];
    
    let dao = await createDao({}, myAccount);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAdapterAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    let proposalId = await submitNewMemberProposal(dao, newMember, sharePrice);

    //Sponsor the new proposal to admit the new member, vote and process it 
    await sponsorNewMember(onboarding, dao, proposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "12000000000000000000".toString());

    //Check New Member Shares
    let shares = await dao.nbShares(newMember);
    assert.equal(shares.toString(), "100000000000000000");

    //Ragequit - Burn all the new member shares
    let ragequitContract = await ragequit(dao, toBN(shares), newMember);

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
    const myAccount = accounts[1];
    const newMember = accounts[2];
    const applicant = accounts[3];

    let dao = await createDao({}, myAccount);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAdapterAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const financingAddress = await dao.getAdapterAddress(sha3("financing"));
    const financing = await FinancingContract.at(financingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    let proposalId = await submitNewMemberProposal(dao, newMember, sharePrice);

    //Sponsor the new proposal to admit the new member, vote and process it 
    await sponsorNewMember(onboarding, dao, proposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "12000000000000000000".toString());

    //Check New Member Shares
    let shares = await dao.nbShares(newMember);
    assert.equal(shares.toString(), "100000000000000000");

    //Create Financing Request
    let requestedAmount = toBN(50000);
    await financing.createFinancingRequest(dao.address, applicant, ETH_TOKEN, requestedAmount, web3.utils.fromUtf8(""));

    //Get the new proposalId from event log
    pastEvents = await dao.getPastEvents();
    proposalId = pastEvents[0].returnValues.proposalId;
    assert.equal(proposalId, 1);

    //Old Member sponsors the Financing proposal
    await financing.sponsorProposal(dao.address, proposalId, [], { from: myAccount, gasPrice: toBN("0") });

    //New Member votes YES on the Financing proposal
    let vote = 1; //YES
    await voting.submitVote(dao.address, proposalId, vote, { from: newMember, gasPrice: toBN("0") });

    //Ragequit - New member ragequits after YES vote
    let ragequitContract = await ragequit(dao, shares, newMember);

    //Check Guild Bank Balance
    let newGuildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(newGuildBalance).toString(), "240"); //must be close to 0

    //Check Ragequit Event
    pastEvents = await ragequitContract.getPastEvents();
    let { member, burnedShares } = pastEvents[0].returnValues;
    assert.equal(member.toString(), newMember.toString());
    assert.equal(burnedShares.toString(), shares.toString());  
  })

  it("should be possible to a member to ragequit if the member voted NO on a proposal that is not processed", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];
    const applicant = accounts[3];

    let dao = await createDao({}, myAccount);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const financingAddress = await dao.getAdapterAddress(sha3("financing"));
    const financing = await FinancingContract.at(financingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    let proposalId = await submitNewMemberProposal(dao, newMember, sharePrice);

    //Sponsor the new proposal to admit the new member, vote and process it
    await sponsorNewMember(onboarding, dao, proposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "12000000000000000000".toString());

    //Check New Member Shares
    let shares = await dao.nbShares(newMember);
    assert.equal(shares.toString(), "100000000000000000");

    //Create Financing Request
    let requestedAmount = toBN(50000);
    await financing.createFinancingRequest(
      dao.address,
      applicant,
      ETH_TOKEN,
      requestedAmount,
      web3.utils.fromUtf8("")
    );

    //Get the new proposalId from event log
    pastEvents = await dao.getPastEvents();
    proposalId = pastEvents[0].returnValues.proposalId;
    assert.equal(proposalId, 1);

    //Old Member sponsors the Financing proposal
    await financing.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //New Member votes NO on the Financing proposal
    let vote = 2; //NO
    await voting.submitVote(dao.address, proposalId, vote, {
      from: newMember,
      gasPrice: toBN("0"),
    });

    //Ragequit - New member ragequits after YES vote
    let ragequitContract = await ragequit(dao, shares, newMember);

    //Check Guild Bank Balance
    let newGuildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(newGuildBalance).toString(), "240"); //must be close to 0

    //Check Ragequit Event
    pastEvents = await ragequitContract.getPastEvents();
    let { member, burnedShares } = pastEvents[0].returnValues;
    assert.equal(member.toString(), newMember.toString());
    assert.equal(burnedShares.toString(), shares.toString());  
  })

});
