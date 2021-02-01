// Whole-script strict mode syntax
("use strict");

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
  getContract,
  sharePrice,
  GUILD,
  ETH_TOKEN,
  SHARES,
  LOOT,
  OLTokenContract,
  OnboardingContract,
  VotingContract,
  RagequitContract,
  GuildKickContract,
  FinancingContract,
  BankExtension,
} = require("../../utils/DaoFactory.js");

let proposalCounter = 0;
contract("LAOLAND - Ragequit Adapter", async (accounts) => {
  const submitNewMemberProposal = async (
    onboarding,
    dao,
    newMember,
    sharePrice,
    token,
    sponsor
  ) => {
    const proposalId = "0x" + proposalCounter++;
    await onboarding.onboard(
      dao.address,
      proposalId,
      newMember,
      token ? token : SHARES,
      sharePrice.mul(toBN(100)),
      {
        from: sponsor ? sponsor : accounts[1],
        value: sharePrice.mul(toBN(10)),
        gasPrice: toBN("0"),
      }
    );
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

  const guildKickProposal = async (
    dao,
    guildkickContract,
    memberToKick,
    sender,
    proposalId = null
  ) => {
    const newProposalId = proposalId ? proposalId : "0x" + proposalCounter++;
    await guildkickContract.submitKickProposal(
      dao.address,
      newProposalId,
      memberToKick,
      fromUtf8(""),
      {
        from: sender,
        gasPrice: toBN("0"),
      }
    );

    return { kickProposalId: newProposalId };
  };

  const ragequit = async (dao, shares, loot, member, token = ETH_TOKEN) => {
    let ragequitAddress = await dao.getAdapterAddress(sha3("ragequit"));
    let ragequitContract = await RagequitContract.at(ragequitAddress);

    await ragequitContract.ragequit(
      dao.address,
      toBN(shares),
      toBN(loot),
      [token],
      {
        from: member,
        gasPrice: toBN("0"),
      }
    );

    return ragequitContract;
  };

  it("should return an error if a non DAO member attempts to ragequit", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

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
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(guildBalance).toString(), "1200000000000000000");

    //Check Member Shares
    let shares = await bank.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");

    //Ragequit
    try {
      let nonMember = accounts[4];
      await ragequit(dao, shares, 0, nonMember);
    } catch (error) {
      assert.equal(error.reason, "insufficient shares");
    }
  });

  it("should not be possible for a member to ragequit when the member does not have enough shares", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

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
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1200000000000000000".toString());

    //Check Member Shares
    let shares = await bank.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");

    //Ragequit
    try {
      //Trying to Ragequit with shares + 1 to burn
      await ragequit(dao, 100000000000000001, 0, newMember);
    } catch (error) {
      assert.equal(error.reason, "insufficient shares");
    }
  });

  it("should be possible for a member to ragequit when the member has not voted on any proposals yet", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

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
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1200000000000000000".toString());

    //Check New Member Shares
    let shares = await bank.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");

    //Ragequit - Burn all the new member shares
    await ragequit(dao, shares, 0, newMember);

    //Check Guild Bank Balance
    let newGuildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(newGuildBalance).toString(), "120"); //must be close to 0
  });

  it("should be possible for a member to ragequit if the member voted YES on a proposal that is not processed", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];
    const applicant = accounts[3];

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

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
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1200000000000000000".toString());

    //Check New Member Shares
    let shares = await bank.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");
    proposalId = "0x1";
    //Create Financing Request
    let requestedAmount = toBN(50000);
    await financing.createFinancingRequest(
      dao.address,
      proposalId,
      applicant,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8("")
    );

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
    await ragequit(dao, shares, 0, newMember);

    //Check Guild Bank Balance
    let newGuildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(newGuildBalance).toString(), "120"); //must be close to 0
  });

  it("should be possible for a member to ragequit if the member voted NO on a proposal that is not processed", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];
    const applicant = accounts[3];

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

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
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1200000000000000000".toString());

    //Check New Member Shares
    let shares = await bank.balanceOf(newMember, SHARES);
    assert.equal(shares.toString(), "10000000000000000");
    proposalId = "0x1";
    //Create Financing Request
    let requestedAmount = toBN(50000);
    await financing.createFinancingRequest(
      dao.address,
      proposalId,
      applicant,
      ETH_TOKEN,
      requestedAmount,
      fromUtf8("")
    );

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
    await ragequit(dao, shares, 0, newMember);

    //Check Guild Bank Balance
    let newGuildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(newGuildBalance).toString(), "120"); //must be close to 0
  });

  it("should be possible for an Advisor to ragequit", async () => {
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
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

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
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "0");

    // Total of OLT to be sent to the DAO in order to get the Loot shares
    let tokenAmount = 10;

    // Pre-approve spender (DAO) to transfer applicant tokens
    await oltContract.approve(onboardingAddress, tokenAmount, {
      from: advisorAccount,
      gasPrice: toBN(0),
    });
    let proposalId = "0x0";
    // Send a request to join the DAO as an Advisor (non-voting power),
    // the tx passes the OLT ERC20 token, the amount and the nonVotingOnboarding adapter that handles the proposal
    await onboarding.onboard(
      dao.address,
      proposalId,
      advisorAccount,
      LOOT,
      tokenAmount,
      {
        from: advisorAccount,
        gasPrice: toBN("0"),
      }
    );

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
    const advisorAccountLoot = await bank.balanceOf(advisorAccount, LOOT);
    assert.equal(advisorAccountLoot.toString(), "5");

    // Guild balance must change when Loot shares are issued
    guildBalance = await bank.balanceOf(GUILD, oltContract.address);
    assert.equal(guildBalance.toString(), "10");

    //Ragequit - Advisor ragequits
    await ragequit(
      dao,
      0,
      advisorAccountLoot,
      advisorAccount,
      oltContract.address
    );

    //Check Guild Bank Balance
    let newGuildBalance = await bank.balanceOf(GUILD, oltContract.address);
    assert.equal(toBN(newGuildBalance).toString(), "2"); //must be close to
  });

  it("should not be possible to vote after the ragequit", async () => {
    const myAccount = accounts[1];
    const memberAddr = accounts[2];

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    let proposalId = await submitNewMemberProposal(
      onboarding,
      dao,
      memberAddr,
      sharePrice
    );

    //Sponsor the new proposal to admit the new member, vote and process it
    await sponsorNewMember(onboarding, dao, proposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "1200000000000000000".toString());

    //Check New Member Shares
    let shares = await bank.balanceOf(memberAddr, SHARES);
    assert.equal(shares.toString(), "10000000000000000");

    //Ragequit - Burn all the new member shares
    await ragequit(dao, shares, 0, memberAddr);

    //Member attempts to sponsor a proposal after the ragequit
    try {
      await onboarding.sponsorProposal(dao.address, proposalId, [], {
        from: memberAddr,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to sponsor a proposal if the member has executed a full ragequit"
      );
    } catch (err) {
      assert.equal(err.reason, "onlyMember");
    }
    try {
      await voting.submitVote(dao.address, proposalId, 1, {
        from: memberAddr,
        gasPrice: toBN("0"),
      });
      assert.fail(
        "should not be possible to vote on a proposal if the member has executed a full ragequit"
      );
    } catch (err) {
      assert.equal(err.reason, "onlyMember");
    }
  });

  it("should not be possible to ragequit if the member have provided an invalid token", async () => {
    const myAccount = accounts[1];

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    // Check member shares
    let shares = await bank.balanceOf(myAccount, SHARES);
    assert.equal(shares.toString(), "1");

    try {
      //Ragequit - Attempts to ragequit using an invalid token to receive funds
      let invalidToken = accounts[7];
      await ragequit(dao, shares, 0, myAccount, invalidToken);
      assert.fail(
        "should not be possible to ragequit if the token is not allowed by the DAO"
      );
    } catch (err) {
      assert.equal(err.reason, "token not allowed");
    }
  });

  it("should be possible to ragequit if the member is part of a guild kick proposal but the proposal is not processed yet", async () => {
    const daoOwner = accounts[1];
    const memberA = accounts[2];

    let dao = await createDao(daoOwner);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );

    let proposalId = await submitNewMemberProposal(
      onboarding,
      dao,
      memberA,
      sharePrice
    );

    //Sponsor the new proposal to admit the new member, vote and process it
    await sponsorNewMember(onboarding, dao, proposalId, daoOwner, voting);
    await onboarding.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Check memberA shares
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);
    let memberAShares = await bank.balanceOf(memberA, SHARES);

    // Submit GuildKick for memberA
    await guildKickProposal(dao, guildkickContract, memberA, daoOwner);

    // MemberA ragequits before the kick proposal is processed
    await ragequit(dao, memberAShares, 0, memberA, ETH_TOKEN);
  });

  it("should not be possible to ragequit if the member is in jail", async () => {
    const daoOwner = accounts[1];
    const memberA = accounts[2];

    let dao = await createDao(daoOwner);
    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);
    const guildkickContract = await getContract(
      dao,
      "guildkick",
      GuildKickContract
    );

    let proposalId = await submitNewMemberProposal(
      onboarding,
      dao,
      memberA,
      sharePrice
    );

    //Sponsor the new proposal to admit the new member, vote and process it
    await sponsorNewMember(onboarding, dao, proposalId, daoOwner, voting);
    await onboarding.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Check memberA shares
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);
    let memberAShares = await bank.balanceOf(memberA, SHARES);

    // Submit GuildKick for memberA
    let { kickProposalId } = await guildKickProposal(
      dao,
      guildkickContract,
      memberA,
      daoOwner
    );

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    // Process the guild kick proposal to put the member in jail
    await guildkickContract.guildKick(dao.address, kickProposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    try {
      // MemberA attempts to ragequit, but he is in jail due to the guild kick
      await ragequit(dao, memberAShares, 0, memberA, ETH_TOKEN);
      assert.fail(
        "should not be possible to ragequit if the member is in jail"
      );
    } catch (err) {
      assert.equal(err.reason, "jailed member can not ragequit");
    }
  });

  //TODO test fairShareHelper overflow
});
