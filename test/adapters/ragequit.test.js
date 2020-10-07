const {
  advanceTime,
  createDao,
  sharePrice,
  GUILD,
  ETH_TOKEN,
  OLTokenContract, 
  OnboardingContract,
  NonVotingOnboardingContract,
  VotingContract,
  RagequitContract,
  FinancingContract
} = require("../../utils/DaoFactory.js");
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

contract('LAO LAND DAO - Ragequit Adapter', async accounts => {

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
  }

  ragequit = async (dao, shares, loot, member) => {
    let ragequitAddress = await dao.getAdapterAddress(sha3("ragequit"));
    let ragequitContract = await RagequitContract.at(ragequitAddress);
    await ragequitContract.ragequit(dao.address, toBN(shares), toBN(loot), {
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
  
    let dao = await createDao(myAccount);

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
      await ragequit(dao, shares, 0, nonMember);
    } catch (error){
      assert.equal(error.reason, "onlyMember");
    }
  })

  it("should not be possible to a member to ragequit when the member does not have enough shares", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(myAccount);

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
      await ragequit(dao, 100000000000000001, 0, newMember);
    } catch (error){
      assert.equal(error.reason, "insufficient shares");
    }
  })

  it("should be possible to a member to ragequit when the member has not voted on any proposals yet", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];
    
    let dao = await createDao(myAccount);

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
    let ragequitContract = await ragequit(dao, shares, 0, newMember);

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

    let dao = await createDao(myAccount);

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
    let ragequitContract = await ragequit(dao, shares, 0, newMember);

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

    let dao = await createDao(myAccount);

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
    let ragequitContract = await ragequit(dao, shares, 0, newMember);

    //Check Guild Bank Balance
    let newGuildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(newGuildBalance).toString(), "240"); //must be close to 0

    //Check Ragequit Event
    pastEvents = await ragequitContract.getPastEvents();
    let { member, burnedShares } = pastEvents[0].returnValues;
    assert.equal(member.toString(), newMember.toString());
    assert.equal(burnedShares.toString(), shares.toString());  
  })

  it("should be possible to an Advisor ragequit at any point in time", async () => {
    const myAccount = accounts[1];
    const advisorAccount = accounts[2];

    let lootSharePrice = 10;
    let nbOfLootShares = 100000000;
    let chunkSize = 5;
    let dao = await createDao(
      myAccount,
      lootSharePrice,
      nbOfLootShares,
      chunkSize
    );

    // Issue OpenLaw ERC20 Basic Token for tests
    let tokenSupply = 1000000;
    let oltContract = await OLTokenContract.new(tokenSupply);

    // Transfer 1000 OLTs to the Advisor account
    await oltContract.approve(advisorAccount, 100);
    await oltContract.transfer(advisorAccount, 100);
    let advisorTokenBalance = await oltContract.balanceOf.call(advisorAccount);
    assert.equal(
      100,
      advisorTokenBalance,
      "Advisor account must be initialized with 100 OLT Tokens"
    );

    const nonVotingOnboardingAddr = await dao.getAdapterAddress(
      sha3("nonvoting-onboarding")
    );
    const nonVotingMemberContract = await NonVotingOnboardingContract.at(
      nonVotingOnboardingAddr
    );

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    // Guild balance must be 0 if no Loot shares are issued
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "0");

    // Total of OLT to be sent to the DAO in order to get the Loot shares
    let tokenAmount = 10;

    // Pre-approve spender (DAO) to transfer applicant tokens
    await oltContract.approve(dao.address, tokenAmount, {
      from: advisorAccount,
      gasPrice: toBN(0),
    });

    // Send a request to join the DAO as an Advisor (non-voting power),
    // the tx passes the OLT ERC20 token, the amount and the nonVotingOnboarding adapter that handles the proposal
    await dao.onboard(
      oltContract.address,
      tokenAmount,
      nonVotingOnboardingAddr,
      {
        from: advisorAccount,
        gasPrice: toBN("0"),
      }
    );

    //Get the new proposal id
    pastEvents = await dao.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;

    // Sponsor the new proposal to allow the Advisor to join the DAO
    await nonVotingMemberContract.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Vote on the new proposal to accept the new Advisor
    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Process the new proposal
    await advanceTime(10000);
    await nonVotingMemberContract.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Check the number of Loot (non-voting shares) issued to the new Avisor
    const advisorAccountLoot = await dao.nbLoot(advisorAccount);
    assert.equal(advisorAccountLoot.toString(), "100000000");

    // Guild balance must change when Loot shares are issued
    guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "10");

    //Ragequit - Advisor ragequits
    let ragequitContract = await ragequit(
      dao,
      0,
      advisorAccountLoot,
      advisorAccount
    );

    //Check Guild Bank Balance
    let newGuildBalance = await dao.balanceOf(GUILD, oltContract.address);
    assert.equal(toBN(newGuildBalance).toString(), "0"); //must be close to

    //Check Ragequit Event
    pastEvents = await ragequitContract.getPastEvents();
    let { member, burnedLoot } = pastEvents[0].returnValues;
    assert.equal(member.toString(), advisorAccount.toString());
    assert.equal(burnedLoot.toString(), advisorAccountLoot);

    // Guild balance must change when Loot shares are burned
    guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1");
  });

});
