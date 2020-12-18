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
const { checkLastEvent } = require("../../utils/TestUtils.js");

contract("LAOLAND - Ragequit Adapter", async (accounts) => {
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
    let { proposalId } = pastEvents[0].returnValues;
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

  const ragequit = async (dao, shares, loot, member) => {
    let ragequitAddress = await dao.getAdapterAddress(sha3("ragequit"));
    let ragequitContract = await RagequitContract.at(ragequitAddress);
    await ragequitContract.startRagequit(
      dao.address,
      toBN(shares),
      toBN(loot),
      {
        from: member,
        gasPrice: toBN("0"),
      }
    );

    await ragequitContract.burnShares(dao.address, member, 2, {
      gasPrice: toBN("0"),
    });

    //Check New Member Shares
    let newShares = await dao.balanceOf(member, SHARES);
    assert.equal(newShares.toString(), "0");
    return ragequitContract;
  };

  it("should not be possible for a non DAO member to ragequit", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(myAccount);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    let proposalId = await submitNewMemberProposal(
      onboarding,
      dao,
      newMember,
      sharePrice
    );

    //Sponsor the new proposal, vote and process it
    await sponsorNewMember(onboarding, dao, proposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(guildBalance).toString(), "1200000000000000000");

    //Check Member Shares
    let shares = await dao.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");

    //Ragequit
    try {
      let nonMember = accounts[4];
      await ragequit(dao, shares, 0, nonMember);
    } catch (error) {
      assert.equal(error.reason, "onlyMember");
    }
  });

  it("should not be possible to a member to ragequit when the member does not have enough shares", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(myAccount);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    let proposalId = await submitNewMemberProposal(
      onboarding,
      dao,
      newMember,
      sharePrice
    );

    //Sponsor the new proposal, vote and process it
    await sponsorNewMember(onboarding, dao, proposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1200000000000000000".toString());

    //Check Member Shares
    let shares = await dao.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");

    //Ragequit
    try {
      //Trying to Ragequit with shares + 1 to burn
      await ragequit(dao, 100000000000000001, 0, newMember);
    } catch (error) {
      assert.equal(error.reason, "insufficient shares");
    }
  });

  it("should be possible to a member to ragequit when the member has not voted on any proposals yet", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(myAccount);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    let proposalId = await submitNewMemberProposal(
      onboarding,
      dao,
      newMember,
      sharePrice
    );

    //Sponsor the new proposal to admit the new member, vote and process it
    await sponsorNewMember(onboarding, dao, proposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1200000000000000000".toString());

    //Check New Member Shares
    let shares = await dao.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");

    //Ragequit - Burn all the new member shares
    let ragequitContract = await ragequit(dao, shares, 0, newMember);

    //Check Guild Bank Balance
    let newGuildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(newGuildBalance).toString(), "120"); //must be close to 0
  });

  it("should be possible to a member to ragequit if the member voted YES on a proposal that is not processed", async () => {
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

    let proposalId = await submitNewMemberProposal(
      onboarding,
      dao,
      newMember,
      sharePrice
    );

    //Sponsor the new proposal to admit the new member, vote and process it
    await sponsorNewMember(onboarding, dao, proposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1200000000000000000".toString());

    //Check New Member Shares
    let shares = await dao.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");

    //Create Financing Request
    let requestedAmount = toBN(50000);
    await financing.createFinancingRequest(
      dao.address,
      applicant,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8("")
    );

    //Get the new proposalId from event log
    proposalId = 1;
    await checkLastEvent(dao, { proposalId });

    //Old Member sponsors the Financing proposal
    await financing.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //New Member votes YES on the Financing proposal
    let vote = 1; //YES
    await voting.submitVote(dao.address, proposalId, vote, {
      from: newMember,
      gasPrice: toBN("0"),
    });

    //Ragequit - New member ragequits after YES vote
    let ragequitContract = await ragequit(dao, shares, 0, newMember);

    //Check Guild Bank Balance
    let newGuildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(newGuildBalance).toString(), "120"); //must be close to 0
  });

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

    let proposalId = await submitNewMemberProposal(
      onboarding,
      dao,
      newMember,
      sharePrice
    );

    //Sponsor the new proposal to admit the new member, vote and process it
    await sponsorNewMember(onboarding, dao, proposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1200000000000000000".toString());

    //Check New Member Shares
    let shares = await dao.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");

    //Create Financing Request
    let requestedAmount = toBN(50000);
    await financing.createFinancingRequest(
      dao.address,
      applicant,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8("")
    );

    //Get the new proposalId from event log
    proposalId = 1;
    checkLastEvent(dao, { proposalId });

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
    assert.equal(toBN(newGuildBalance).toString(), "120"); //must be close to 0
  });

  it("should be possible to an Advisor ragequit at any point in time", async () => {
    const myAccount = accounts[1];
    const advisorAccount = accounts[2];

    let lootSharePrice = 10;
    let chunkSize = 5;

    // Issue OpenLaw ERC20 Basic Token for tests
    let tokenSupply = 1000000;
    let oltContract = await OLTokenContract.new(tokenSupply);

    let dao = await createDao(
      myAccount,
      lootSharePrice,
      chunkSize,
      10,
      1,
      oltContract.address
    );

    // Transfer 1000 OLTs to the Advisor account
    await oltContract.approve(advisorAccount, 100);
    await oltContract.transfer(advisorAccount, 100);
    let advisorTokenBalance = await oltContract.balanceOf(advisorAccount);
    assert.equal(
      100,
      advisorTokenBalance,
      "Advisor account must be initialized with 100 OLT Tokens"
    );

    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    // Guild balance must be 0 if no Loot shares are issued
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "0");

    // Total of OLT to be sent to the DAO in order to get the Loot shares
    let tokenAmount = 10;

    // Pre-approve spender (DAO) to transfer applicant tokens
    await oltContract.approve(onboardingAddress, tokenAmount, {
      from: advisorAccount,
      gasPrice: toBN(0),
    });

    // Send a request to join the DAO as an Advisor (non-voting power),
    // the tx passes the OLT ERC20 token, the amount and the nonVotingOnboarding adapter that handles the proposal
    await onboarding.onboard(dao.address, advisorAccount, LOOT, tokenAmount, {
      from: advisorAccount,
      gasPrice: toBN("0"),
    });

    let proposalId = 0;

    // Sponsor the new proposal to allow the Advisor to join the DAO
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
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
    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Check the number of Loot (non-voting shares) issued to the new Avisor
    const advisorAccountLoot = await dao.balanceOf(advisorAccount, LOOT);
    assert.equal(advisorAccountLoot.toString(), "5");

    // Guild balance must change when Loot shares are issued
    guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "10");

    //Ragequit - Advisor ragequits
    await ragequit(dao, 0, advisorAccountLoot, advisorAccount);

    //Check Guild Bank Balance
    let newGuildBalance = await dao.balanceOf(GUILD, oltContract.address);
    assert.equal(toBN(newGuildBalance).toString(), "0"); //must be close to

    // Guild balance must change when Loot shares are burned
    guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "2");
  });

  it("should not be possible to vote if you are jailed", async () => {
    const myAccount = accounts[1];
    const memberAccount = accounts[2];
    const otherAccount = accounts[3];

    let lootSharePrice = 10;
    let chunkSize = 5;

    let dao = await createDao(myAccount, lootSharePrice, chunkSize, 10, 1);

    // Transfer 1000 OLTs to the Advisor account
    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    // Guild balance must be 0 if no Loot shares are issued
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "0");

    // Total of OLT to be sent to the DAO in order to get the Loot shares
    let tokenAmount = 10;

    // Send a request to join the DAO as an Advisor (non-voting power),
    // the tx passes the OLT ERC20 token, the amount and the nonVotingOnboarding adapter that handles the proposal
    await onboarding.onboard(dao.address, memberAccount, SHARES, tokenAmount, {
      from: myAccount,
      value: tokenAmount,
      gasPrice: toBN("0"),
    });

    let proposalId = 0;

    // Sponsor the new proposal to allow the Advisor to join the DAO
    await onboarding.sponsorProposal(dao.address, proposalId, [], {
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
    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    let ragequitAddress = await dao.getAdapterAddress(sha3("ragequit"));
    let ragequitContract = await RagequitContract.at(ragequitAddress);

    const shares = await dao.balanceOf(memberAccount, SHARES);
    await ragequitContract.startRagequit(
      dao.address,
      toBN(Math.floor(shares / 2)),
      toBN(0),
      {
        from: memberAccount,
        gasPrice: toBN("0"),
      }
    ); // we are not burning all the shares so we are still members once it is done

    await onboarding.onboard(dao.address, otherAccount, SHARES, tokenAmount, {
      from: myAccount,
      value: tokenAmount,
      gasPrice: toBN("0"),
    });

    proposalId = 1;

    // Sponsor the new proposal to allow the Advisor to join the DAO
    try {
      await onboarding.sponsorProposal(dao.address, proposalId, [], {
        from: memberAccount,
        gasPrice: toBN("0"),
      });
      throw new Error("should fail");
    } catch (err) {
      assert.equal(err.message.indexOf("onlyMember") > -1, true);
    }

    await ragequitContract.burnShares(dao.address, memberAccount, 2, {
      gasPrice: toBN("0"),
    });

    // member can vote again!

    await onboarding.sponsorProposal(dao.address, proposalId, [], {
      from: memberAccount,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 1, {
      from: memberAccount,
      gasPrice: toBN("0"),
    });

    const delegateKey = await dao.getCurrentDelegateKey(memberAccount);

    assert.equal(memberAccount, delegateKey);
  });
});
