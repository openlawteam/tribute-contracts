const {prepareSnapshot, addVote, prepareVoteResult} = require('../utils/offchain_voting.js');

const Web3 = require('web3-utils');
const sha3 = web3.utils.sha3;
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
    await onboarding.sponsorProposal(0, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getRoot(), 1]), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await voting.submitVoteResult(dao.address, 0, 1, 0, snapshotTree.getRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await advanceTime(10000);
    await onboarding.processProposal(0, {from: myAccount, gasPrice: web3.utils.toBN("0")});
  });

  it("should be possible to invalidate vote if the total is wrong", async () => {
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
    await onboarding.sponsorProposal(0, web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [snapshotTree.getRoot(), 1]), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    const proposalId = 0;
    const voteElements = await addVote([], snapshotTree.getRoot(), dao.address, proposalId, myAccount, 1, true);
    const {voteResultTree, votes} = prepareVoteResult(voteElements, weights);
    await voting.submitVoteResult(dao.address, proposalId, 10, 0, voteResultTree.getRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    const elementIndex = votes.length - 1;
    const lastVoteElement = voteResultTree.elements[elementIndex];
    const lastVote = votes[elementIndex];
    const proof = voteResultTree.getProofOrdered(lastVoteElement, elementIndex + 1);
    await voting.fixResult(dao.address, 0, lastVote.address, lastVote.weight, lastVote.nbYes, lastVote.nbNo, lastVote.vote, proof);
    await advanceTime(10000);
    await onboarding.processProposal(0, {from: myAccount, gasPrice: web3.utils.toBN("0")});
  });
});