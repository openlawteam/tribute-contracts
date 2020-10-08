const {advanceTime, OnboardingContract, DaoRegistry, DaoFactory, FlagHelperLib, sharePrice, remaining, numberOfShares, entry, addDefaultAdapters} = require('../../utils/DaoFactory.js');
const {addVote, prepareVoteResult, buildVoteLeafHashForMerkleTree} = require('../../utils/offchain_voting.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

const OffchainVotingContract = artifacts.require('./v3/adapters/OffchainVotingContract');

async function createOffchainVotingDao(senderAccount, unitPrice=sharePrice, nbShares=numberOfShares, votingPeriod=10, gracePeriod=1) {
  let lib = await FlagHelperLib.new();
  const daoFactory = await DaoFactory.new();
  await DaoRegistry.link("FlagHelper128", lib.address);
  let dao = await DaoRegistry.new({ from: senderAccount, gasPrice: web3.utils.toBN("0") });
  await addDefaultAdapters(dao, unitPrice, nbShares, votingPeriod, gracePeriod);
  const votingAddress = await dao.getAdapterAddress(sha3("voting"));
  const offchainVoting = await OffchainVotingContract.new(votingAddress);
  await daoFactory.updateAdapter(
    dao.address,
    entry("voting", offchainVoting))

  await offchainVoting.configureDao(dao.address, votingPeriod, gracePeriod, 10);
  await dao.finalizeDao();
  return {dao, voting: offchainVoting};
}

contract('LAO LAND DAO - Offchain Voting Module', async accounts => {

  it("should be possible to vote offchain", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    let {dao, voting} = await createOffchainVotingDao(myAccount);

    const onboardingAddress = await dao.getAdapterAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    await dao.sendTransaction({from:otherAccount,value:sharePrice.mul(toBN("3")).add(remaining), gasPrice: toBN("0")});
    const blockNumber = await web3.eth.getBlockNumber();
    await onboarding.sponsorProposal(dao.address, 0, web3.eth.abi.encodeParameter('uint256', blockNumber), {from: myAccount, gasPrice: toBN("0")});
    //passing a dummy value here with dao.address because we're not testing that here
    await voting.submitVoteResult(dao.address, 0, 1, 0, dao.address, {from: myAccount, gasPrice: toBN("0")});

    await advanceTime(10000);
    await onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: toBN("0")});
  });

  it("should be possible to invalidate the vote if the node is in the wrong order", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const otherAccount2 = accounts[3];

    let {dao, voting} = await createOffchainVotingDao(myAccount);

    const onboardingAddress = await dao.getAdapterAddress(web3.utils.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    await dao.sendTransaction({from:otherAccount,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    await dao.sendTransaction({from:otherAccount2,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    const blockNumber = await web3.eth.getBlockNumber();
    
    await onboarding.sponsorProposal(dao.address, 0, web3.eth.abi.encodeParameter('uint256', blockNumber), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await onboarding.sponsorProposal(dao.address, 1, web3.eth.abi.encodeParameter('uint256', blockNumber), {from: myAccount, gasPrice: web3.utils.toBN("0")});

    const voteElements = await addVote([], blockNumber, dao.address, 0, myAccount, 1, true);
    const voteElements2 = await addVote([], blockNumber, dao.address, 1, myAccount, 1, true);
    const r1 = prepareVoteResult(voteElements);
    const r2 = prepareVoteResult(voteElements2);
    await voting.submitVoteResult(dao.address, 0, 1, 0, r1.voteResultTree.getHexRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await voting.submitVoteResult(dao.address, 1, 1, 0, r2.voteResultTree.getHexRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await onboarding.processProposal(dao.address, 1, {from: myAccount, gasPrice: web3.utils.toBN("0")});

    const someone = accounts[4];

    await dao.sendTransaction({from:someone,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});

    const proposalId = 2;
    await onboarding.sponsorProposal(dao.address, proposalId, web3.eth.abi.encodeParameter('uint256', blockNumber), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    
    let ve = await addVote([], blockNumber, dao.address, proposalId, myAccount, 1, true);
    ve = await addVote(ve, blockNumber, dao.address, proposalId, otherAccount, 1, true);
    ve = await addVote(ve, blockNumber, dao.address, proposalId, otherAccount2, 1, false);

    const r3 = prepareVoteResult([ve[2], ve[0] ,ve[1] ]);
    const voteResultTree2 = r3.voteResultTree;
    const votes2 = r3.votes;
    await voting.submitVoteResult(dao.address, proposalId, 2, 1, voteResultTree2.getHexRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});

    const nodePrevious = {
      voter: votes2[0].address,      
      nbNo: votes2[0].nbNo,
      nbYes: votes2[0].nbYes,
      weight: votes2[0].weight,
      index: votes2[0].index,
      sig: votes2[0].vote,
      proof: voteResultTree2.getHexProof(buildVoteLeafHashForMerkleTree(votes2[0]))
    };

    const nodeCurrent = {
      voter: votes2[1].address,      
      nbNo: votes2[1].nbNo,
      nbYes: votes2[1].nbYes,
      weight: votes2[1].weight,
      index: votes2[1].index,
      sig: votes2[1].vote,
      proof: voteResultTree2.getHexProof(buildVoteLeafHashForMerkleTree(votes2[1]))
    };

    await voting.challengeWrongStep(dao.address, proposalId, nodePrevious, nodeCurrent);
  });
});