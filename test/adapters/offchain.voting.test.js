const {advanceTime, createDao, OnboardingContract, sharePrice, remaining, MemberContract, reportingTransaction} = require('../../utils/DaoFactory.js');
const {prepareSnapshot, addVote, prepareVoteResult, buildVoteLeafHashForMerkleTree} = require('../../utils/offchain_voting.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

const OffchainVotingContract = artifacts.require('./v3/adapters/OffchainVotingContract');

contract('MolochV3 - Offchain Voting Module', async accounts => {

  it("should be possible to vote offchain", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const voting = await OffchainVotingContract.new();
    let dao = await createDao({voting}, myAccount);

    const onboardingAddress = await dao.getAdapterAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    await dao.sendTransaction({from:otherAccount,value:sharePrice.mul(toBN("3")).add(remaining), gasPrice: toBN("0")});
    const {snapshotTree} = await prepareSnapshot(dao, accounts);

    await onboarding.sponsorProposal(dao.address, 0, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getHexRoot(), 1]), {from: myAccount, gasPrice: toBN("0")});
    await voting.submitVoteResult(dao.address, 0, 1, 0, snapshotTree.getHexRoot(), {from: myAccount, gasPrice: toBN("0")});

    await advanceTime(10000);
    await onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: toBN("0")});
  });

  it("should be possible to update the vote result if the total is wrong", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];

    const voting = await OffchainVotingContract.new();
    let dao = await createDao({voting}, myAccount);

    const onboardingAddress = await dao.getAdapterAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    await dao.sendTransaction({from:otherAccount,value:sharePrice.mul(toBN(3)).add(remaining), gasPrice: toBN("0")});
    const {snapshotTree, weights} = await prepareSnapshot(dao, accounts);

    await onboarding.sponsorProposal(dao.address, 0, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getHexRoot(), 1]), {from: myAccount, gasPrice: toBN("0")});

    const proposalId = 0;
    const voteElements = await addVote([], snapshotTree.getHexRoot(), dao.address, proposalId, myAccount, 1, true);
    const {voteResultTree, votes} = prepareVoteResult(voteElements, weights);

    await voting.submitVoteResult(dao.address, proposalId, 10, 0, voteResultTree.getHexRoot(), {from: myAccount, gasPrice: toBN("0")});

    const elementIndex = votes.length - 1;
    const lastVote = votes[elementIndex];
    
    const proof = voteResultTree.getHexProof(buildVoteLeafHashForMerkleTree(lastVote));
    await voting.fixResult(dao.address, 0, lastVote.address, lastVote.weight, lastVote.nbYes, lastVote.nbNo, lastVote.vote, proof);
    await advanceTime(10000);
    await onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: toBN("0")});
  });

  it("should be possible to invalidate the vote if the node is in the wrong order", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const otherAccount2 = accounts[3];

    const voting = await OffchainVotingContract.new();
    let dao = await createDao({voting}, myAccount);

    const onboardingAddress = await dao.getAdapterAddress(web3.utils.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    await dao.sendTransaction({from:otherAccount,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    await dao.sendTransaction({from:otherAccount2,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    const {snapshotTree} = await prepareSnapshot(dao, accounts);
    await reportingTransaction('sponsor proposal', onboarding.sponsorProposal(dao.address, 0, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getHexRoot(), 1]), {from: myAccount, gasPrice: web3.utils.toBN("0")}));
    await onboarding.sponsorProposal(dao.address, 1, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getHexRoot(), 1]), {from: myAccount, gasPrice: web3.utils.toBN("0")});

    const voteElements = await addVote([], snapshotTree.getHexRoot(), dao.address, 0, myAccount, 1, true);
    const voteElements2 = await addVote([], snapshotTree.getHexRoot(), dao.address, 1, myAccount, 1, true);
    const r1 = prepareVoteResult(voteElements);
    const r2 = prepareVoteResult(voteElements2);
    await voting.submitVoteResult(dao.address, 0, 1, 0, r1.voteResultTree.getHexRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await voting.submitVoteResult(dao.address, 1, 1, 0, r2.voteResultTree.getHexRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await advanceTime(10000);
    await reportingTransaction('process proposal', onboarding.processProposal(dao.address, 0, {from: myAccount, gasPrice: web3.utils.toBN("0")}));
    await onboarding.processProposal(dao.address, 1, {from: myAccount, gasPrice: web3.utils.toBN("0")});

    const someone = accounts[4];

    await reportingTransaction('onboarding call', dao.sendTransaction({from:someone,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")}));

    const sr = await prepareSnapshot(dao, accounts);
    const proposalId = 2;

    await onboarding.sponsorProposal(dao.address, proposalId, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [sr.snapshotTree.getHexRoot(), 3]), {from: myAccount, gasPrice: web3.utils.toBN("0")});

    let ve = await addVote([], sr.snapshotTree.getHexRoot(), dao.address, proposalId, myAccount, 1, true);
    ve = await addVote(ve, sr.snapshotTree.getHexRoot(), dao.address, proposalId, otherAccount, 1, true);
    ve = await addVote(ve, sr.snapshotTree.getHexRoot(), dao.address, proposalId, otherAccount2, 1, false);

    const r3 = prepareVoteResult([ve[2], ve[0] ,ve[1] ]);
    const voteResultTree2 = r3.voteResultTree;
    const votes2 = r3.votes;
    await voting.submitVoteResult(dao.address, proposalId, 2, 1, voteResultTree2.getHexRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});

    const nodePrevious = {
      voter: votes2[0].address,      
      nbNo: votes2[0].nbNo,
      nbYes: votes2[0].nbYes,
      weight: votes2[0].weight,
      sig: votes2[0].vote,
      proof: voteResultTree2.getHexProof(buildVoteLeafHashForMerkleTree(votes2[0]))
    };

    const nodeCurrent = {
      voter: votes2[1].address,      
      nbNo: votes2[1].nbNo,
      nbYes: votes2[1].nbYes,
      weight: votes2[1].weight,
      sig: votes2[1].vote,
      proof: voteResultTree2.getHexProof(buildVoteLeafHashForMerkleTree(votes2[1]))
    };

    await voting.challengeWrongOrder(dao.address, proposalId, 1, nodePrevious, nodeCurrent);
  });
});