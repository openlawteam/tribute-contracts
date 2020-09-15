const {prepareSnapshot, addVote, prepareVoteResult, buildVoteLeafHashForMerkleTree} = require('../utils/offchain_voting.js');

const Web3 = require('web3-utils');
const FlagHelperLib = artifacts.require('./v3/helpers/FlagHelper');
const DaoFactory = artifacts.require('./v3/core/DaoFactory');
const ModuleRegistry = artifacts.require('./v3/core/Registry');
const MemberContract = artifacts.require('./v3/core/MemberContract');
const ProposalContract = artifacts.require('./v3/core/ProposalContract');
const OffchainVotingContract = artifacts.require('./v3/core/OffchainVotingContract');
const OnboardingContract = artifacts.require('./v3/adapters/OnboardingContract');



async function advanceTime(time) {
  await new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [time],
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    })
  });

  await new Promise((resolve, reject) => {
      web3.currentProvider.send({
          jsonrpc: '2.0',
          method: 'evm_mine',
          id: new Date().getTime()
      }, (err, result) => {
        if (err) { return reject(err) }
        return resolve(result)
      })
    });
}

async function prepareSmartContracts() {
  let lib = await FlagHelperLib.new();
  await MemberContract.link("FlagHelper", lib.address);
  await ProposalContract.link("FlagHelper", lib.address);
  let member = await MemberContract.new();
  let proposal = await ProposalContract.new();
  let voting = await OffchainVotingContract.new();
  return {voting, proposal, member};
}

contract('MolochV3 - Offchain Voting', async accounts => {

  const numberOfShares = Web3.toBN('1000000000000000');
  const sharePrice = Web3.toBN(Web3.toWei("120", 'finney'));
  const remaining = sharePrice.sub(Web3.toBN('50000000000000'))
  const GUILD = "0x000000000000000000000000000000000000dead";
  const ESCROW = "0x000000000000000000000000000000000000beef";
  const TOTAL = "0x000000000000000000000000000000000000babe";

  it("should be possible to vote offchain", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const {voting, member, proposal} = await prepareSmartContracts();

    let daoFactory = await DaoFactory.new(member.address, proposal.address, voting.address, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await daoFactory.newDao(sharePrice, numberOfShares, 1000, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    const onboardingAddress = await dao.getAddress(web3.utils.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    await onboarding.sendTransaction({from:otherAccount,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    const {snapshotTree} = await prepareSnapshot(dao, member, accounts);
    await onboarding.sponsorProposal(0, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getMerkleRoot(), 1]), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await voting.submitVoteResult(dao.address, 0, 1, 0, snapshotTree.getMerkleRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await advanceTime(10000);
    await onboarding.processProposal(0, {from: myAccount, gasPrice: web3.utils.toBN("0")});
  });

  it("should be possible to update the vote result if the total is wrong", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const {voting, member, proposal} = await prepareSmartContracts();

    let daoFactory = await DaoFactory.new(member.address, proposal.address, voting.address, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await daoFactory.newDao(sharePrice, numberOfShares, 1000, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    const onboardingAddress = await dao.getAddress(web3.utils.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    await onboarding.sendTransaction({from:otherAccount,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    const {snapshotTree, weights} = await prepareSnapshot(dao, member, accounts);
    await onboarding.sponsorProposal(0, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getMerkleRoot(), 1]), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    const proposalId = 0;
    const voteElements = await addVote([], snapshotTree.getMerkleRoot(), dao.address, proposalId, myAccount, 1, true);
    const {voteResultTree, votes} = prepareVoteResult(voteElements, weights);
    await voting.submitVoteResult(dao.address, proposalId, 10, 0, voteResultTree.getMerkleRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    const elementIndex = votes.length - 1;
    const lastVote = votes[elementIndex];
    const proof = voteResultTree.getProof(buildVoteLeafHashForMerkleTree(lastVote));
    await voting.fixResult(dao.address, 0, lastVote.address, lastVote.weight, lastVote.nbYes, lastVote.nbNo, lastVote.vote, proof);
    await advanceTime(10000);
    await onboarding.processProposal(0, {from: myAccount, gasPrice: web3.utils.toBN("0")});
  });

  it("should be possible to invalidate the vote if the node is in the wrong order", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const otherAccount2 = accounts[3];
    const {voting, member, proposal} = await prepareSmartContracts();

    let daoFactory = await DaoFactory.new(member.address, proposal.address, voting.address, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await daoFactory.newDao(sharePrice, numberOfShares, 1000, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    const onboardingAddress = await dao.getAddress(web3.utils.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    await onboarding.sendTransaction({from:otherAccount,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    await onboarding.sendTransaction({from:otherAccount2,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    const {snapshotTree} = await prepareSnapshot(dao, member, accounts);
    await onboarding.sponsorProposal(0, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getMerkleRoot(), 1]), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await onboarding.sponsorProposal(1, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getMerkleRoot(), 1]), {from: myAccount, gasPrice: web3.utils.toBN("0")});

    const voteElements = await addVote([], snapshotTree.getMerkleRoot(), dao.address, 0, myAccount, 1, true);
    const voteElements2 = await addVote([], snapshotTree.getMerkleRoot(), dao.address, 1, myAccount, 1, true);
    const r1 = prepareVoteResult(voteElements);
    const r2 = prepareVoteResult(voteElements2);
    await voting.submitVoteResult(dao.address, 0, 1, 0, r1.voteResultTree.getMerkleRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await voting.submitVoteResult(dao.address, 1, 1, 0, r2.voteResultTree.getMerkleRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await advanceTime(10000);
    await onboarding.processProposal(0, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await onboarding.processProposal(1, {from: myAccount, gasPrice: web3.utils.toBN("0")});

    const someone = accounts[4];

    await onboarding.sendTransaction({from:someone,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});

    const sr = await prepareSnapshot(dao, member, accounts);
    const proposalId = 2;

    await onboarding.sponsorProposal(proposalId, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [sr.snapshotTree.getMerkleRoot(), 3]), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    
    let ve = await addVote([], snapshotTree.getMerkleRoot(), dao.address, 0, myAccount, 1, true);
    ve = await addVote(ve, snapshotTree.getMerkleRoot(), dao.address, 0, otherAccount, 1, true);
    ve = await addVote(ve, snapshotTree.getMerkleRoot(), dao.address, 0, otherAccount2, 1, false);
    const r3 = prepareVoteResult([ve[2], ve[0] ,ve[1] ]);
    const voteResultTree2 = r3.voteResultTree;
    await voting.submitVoteResult(dao.address, proposalId, 2, 1, voteResultTree2.getMerkleRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    const t1 = r3.voteResultTree;

    const nodePrevious = {
      voter: r3.votes[0].address,      
      nbNo: r3.votes[0].nbNo,
      nbYes: r3.votes[0].nbYes,
      weight: r3.votes[0].weight,
      sig: r3.votes[0].vote,
      proof: t1.getProof(buildVoteLeafHashForMerkleTree(r3.votes[0]))
    };
    const nodeCurrent = {
      voter: r3.votes[1].address,      
      nbNo: r3.votes[1].nbNo,
      nbYes: r3.votes[1].nbYes,
      weight: r3.votes[1].weight,
      sig: r3.votes[1].vote,
      proof: r3.voteResultTree.getProof(buildVoteLeafHashForMerkleTree(r3.votes[1]))
    };

    await voting.challengeWrongOrder(dao.address, proposalId, 1, nodePrevious, nodeCurrent);
  });
});