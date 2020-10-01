const {advanceTime, createDao, ETH_TOKEN, GUILD, sharePrice, remaining, NonVotingOnboardingContract, VotingContract} = require('../../utils/DaoFactory.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

contract('MolochV3 - Non Voting Onboarding Adapter', async accounts => {

  it("should be possible to join a DAO as a member without any voting power by requesting Loot while staking raw ETH", async () => {
    const myAccount = accounts[1];
    const advisorAccount = accounts[2];

    let dao = await createDao({}, myAccount);

    const nonVotingOnboardingAddr = await dao.getAdapterAddress(
      sha3("nonvoting-onboarding")
    );
    const nonVotingMemberContract = await NonVotingOnboardingContract.at(
      nonVotingOnboardingAddr
    );

    const votingAddress = await dao.getAdapterAddress(sha3("voting"));
    const voting = await VotingContract.at(votingAddress);

    // Total of ETH to be sent to the DAO in order to get the Loot shares
    let ethAmount = sharePrice.mul(toBN(3)).add(remaining);

    // Request to join the DAO as an Advisor (non-voting power), Send a tx with RAW ETH only and specify the nonVotingOnboarding
    await dao.onboard(ETH_TOKEN, "0", nonVotingOnboardingAddr, {
      from: advisorAccount,
      value: ethAmount,
      gasPrice: toBN("0"),
    });

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
    })

    // Process the new proposal
    await advanceTime(10000);
    await nonVotingMemberContract.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // Check the number of Loot (non-voting shares) issued to the new Avisor
    const advisorAccountLoot = await dao.nbLoot(advisorAccount);
    assert.equal(advisorAccountLoot.toString(), "3000000000000000");

    // Guild balance must not change when Loot shares are issued
    const guildBalance = await dao.balanceOf(
      GUILD,
      "0x0000000000000000000000000000000000000000"
    );
    assert.equal(guildBalance.toString(), "360000000000000000");
  })
});