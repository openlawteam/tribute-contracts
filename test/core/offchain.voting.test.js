const {advanceTime, createDao, OnboardingContract, sharePrice, remaining, MemberContract} = require('../../utils/DaoFactory.js');
const {prepareSnapshot, addVote, prepareVoteResult} = require('../../utils/offchain_voting.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

const OffchainVotingContract = artifacts.require('./v3/core/OffchainVotingContract');

contract('MolochV3 - Offchain Voting Module', async accounts => {

  it("should be possible to vote offchain", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const voting = await OffchainVotingContract.new();
    let dao = await createDao({voting}, myAccount);

    const onboardingAddress = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const memberAddress = await dao.getAddress(sha3('member'));
    const member = await MemberContract.at(memberAddress);

    await dao.sendTransaction({from:otherAccount,value:sharePrice.mul(toBN("3")).add(remaining), gasPrice: toBN("0")});
    const {snapshotTree} = await prepareSnapshot(dao, member, accounts);
    await onboarding.sponsorProposal(dao.address, 0, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getRoot(), 1]), {from: myAccount, gasPrice: toBN("0")});
    await voting.submitVoteResult(dao.address, 0, 1, 0, snapshotTree.getRoot(), {from: myAccount, gasPrice: toBN("0")});
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: toBN("0")});
  });

  it("should be possible to invalidate vote if the total is wrong", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];

    const voting = await OffchainVotingContract.new();
    let dao = await createDao({voting}, myAccount);

    const onboardingAddress = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    const memberAddress = await dao.getAddress(sha3('member'));
    const member = await MemberContract.at(memberAddress);

    await dao.sendTransaction({from:otherAccount,value:sharePrice.mul(toBN(3)).add(remaining), gasPrice: toBN("0")});
    const {snapshotTree, weights} = await prepareSnapshot(dao, member, accounts);
    await onboarding.sponsorProposal(dao.address, 0, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getRoot(), 1]), {from: myAccount, gasPrice: toBN("0")});
    const proposalId = 0;
    const voteElements = await addVote([], snapshotTree.getRoot(), dao.address, proposalId, myAccount, 1, true);
    const {voteResultTree, votes} = prepareVoteResult(voteElements, weights);
    await voting.submitVoteResult(dao.address, proposalId, 10, 0, voteResultTree.getRoot(), {from: myAccount, gasPrice: toBN("0")});
    const elementIndex = votes.length - 1;
    const lastVoteElement = voteResultTree.elements[elementIndex];
    const lastVote = votes[elementIndex];
    const proof = voteResultTree.getProofOrdered(lastVoteElement, elementIndex + 1);
    await voting.fixResult(dao.address, 0, lastVote.address, lastVote.weight, lastVote.nbYes, lastVote.nbNo, lastVote.vote, proof);
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: toBN("0")});
  });
});