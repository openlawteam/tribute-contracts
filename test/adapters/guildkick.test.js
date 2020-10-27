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
const { toUtf8 } = require("ethereumjs-util");
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
  OnboardingContract,
  VotingContract,
  GuildKickContract,
} = require("../../utils/DaoFactory.js");

contract("LAOLAND - GuildKick Adapter", async (accounts) => {
  submitNewMemberProposal = async (onboarding, dao, newMember, sharePrice) => {
    const myAccount = accounts[1];

    await onboarding.onboard(
      dao.address,
      newMember,
      SHARES,
      sharePrice.mul(toBN(100)),
      {
        from: myAccount,
        value: sharePrice.mul(toBN(100)),
        gasPrice: toBN("0"),
      }
    );
    //Get the new proposal id
    let pastEvents = await dao.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;
    return proposalId;
  };

  sponsorNewMember = async (onboarding, dao, proposalId, member, voting) => {
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

  guildKick = async (dao, memberToKick, sender) => {
    let guildkickAddress = await dao.getAdapterAddress(sha3("guildkick"));
    let guildkickContract = await GuildKickContract.at(guildkickAddress);
    await guildkickContract.submitKickProposal(
      dao.address,
      memberToKick,
      fromUtf8(""),
      {
        from: sender,
        gasPrice: toBN("0"),
      }
    );

    //Get the new proposal id
    let pastEvents = await dao.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;

    return { guildkickContract, kickProposalId: proposalId };
  };

  it("should be possible to kick a DAO member", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];

    let dao = await createDao(myAccount);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    let newProposalId = await submitNewMemberProposal(
      onboarding,
      dao,
      newMember,
      sharePrice
    );
    assert.equal(newProposalId.toString(), "0");

    //Sponsor the new proposal, vote and process it
    await sponsorNewMember(onboarding, dao, newProposalId, myAccount, voting);
    await onboarding.processProposal(dao.address, newProposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check Guild Bank Balance
    let guildBalance = await dao.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(toBN(guildBalance).toString(), "12000000000000000000");

    //Check Member Shares & Loot
    let shares = await dao.nbShares(newMember);
    assert.equal(shares.toString(), "100000000000000000");
    let loot = await dao.nbLoot(newMember);
    assert.equal(loot.toString(), "0");

    //SubGuildKick
    let memberToKick = newMember;
    let { guildkickContract, kickProposalId } = await guildKick(
      dao,
      memberToKick,
      myAccount
    );
    assert.equal(kickProposalId.toString(), "1");

    //Vote YES on kick proposal
    await voting.submitVote(dao.address, kickProposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await guildkickContract.kick(dao.address, memberToKick, kickProposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Check Member Shares & Loot, the Shares must be converted to Loot to remove the voting power of the member
    shares = await dao.nbShares(newMember);
    assert.equal(shares.toString(), "0");
    loot = await dao.nbLoot(newMember);
    assert.equal(loot.toString(), "100000000000000000");

    // TODO Check if the member is in jail

    // TODO try to access other functions
  });
});
