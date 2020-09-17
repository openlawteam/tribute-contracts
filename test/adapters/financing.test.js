
const Web3 = require('web3-utils');
const sha3 = web3.utils.sha3;
const FlagHelperLib = artifacts.require('./v3/helpers/FlagHelper');
const DaoFactory = artifacts.require('./v3/core/DaoFactory');
const ModuleRegistry = artifacts.require('./v3/core/Registry');
const MemberContract = artifacts.require('./v3/core/MemberContract');
const BankContract = artifacts.require('./v3/core/BankContract');
const VotingContract = artifacts.require('./v3/core/VotingContract');
const ProposalContract = artifacts.require('./v3/core/ProposalContract');
const OnboardingContract = artifacts.require('./v3/adapters/OnboardingContract');
const ManagingContract = artifacts.require('./v3/adapter/ManagingContract');
const FinancingContract = artifacts.require('./v3/adapter/FinancingContract');
const RagequitContract = artifacts.require('./v3/adapters/RagequitContract');

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

contract('MolochV3 - Financing Adapter', async accounts => {

  const numberOfShares = Web3.toBN('1000000000000000');
  const sharePrice = Web3.toBN(Web3.toWei("120", 'finney'));
  const remaining = sharePrice.sub(Web3.toBN('50000000000000'))
  const GUILD = "0x000000000000000000000000000000000000dead";
  const ESCROW = "0x000000000000000000000000000000000000beef";
  const TOTAL = "0x000000000000000000000000000000000000babe";

  async function prepareSmartContracts() {
    let lib = await FlagHelperLib.new();
    await MemberContract.link("FlagHelper", lib.address);
    await ProposalContract.link("FlagHelper", lib.address);
    let member = await MemberContract.new();
    let proposal = await ProposalContract.new();
    let voting = await VotingContract.new();
    let ragequit = await RagequitContract.new();
    let managing = await ManagingContract.new();
    let financing = await FinancingContract.new();
    return { voting, proposal, member, ragequit, managing, financing };
  }

  it("should be possible to any individual to request financing", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    const newMember = accounts[3];
    const token = "0x0000000000000000000000000000000000000000";
    const { voting, member, proposal, ragequit, managing, financing } = await prepareSmartContracts();

    let daoFactory = await DaoFactory.new(member.address, proposal.address, voting.address, ragequit.address, managing.address, financing.address,
      { from: myAccount, gasPrice: Web3.toBN("0") });

    await daoFactory.newDao(sharePrice, numberOfShares, 1000, { from: myAccount, gasPrice: Web3.toBN("0") });
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    const bankAddress = await dao.getAddress(sha3("bank"));
    const bank = await BankContract.at(bankAddress);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAddress(Web3.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    await onboarding.sendTransaction({ from: newMember, value: sharePrice.mul(Web3.toBN(10)).add(remaining), gasPrice: Web3.toBN("0") });
    //Get the new proposal id
    pastEvents = await proposal.getPastEvents();
    let { proposalId }  = pastEvents[0].returnValues;

    //Sponsor the new proposal, vote and process it 
    await onboarding.sponsorProposal(proposalId, [], { from: myAccount, gasPrice: Web3.toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: Web3.toBN("0") });
    await advanceTime(10000);
    await onboarding.processProposal(proposalId, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(GUILD, token);
    let expectedGuildBalance = Web3.toBN("1200000000000000000");
    assert.equal(Web3.toBN(guildBalance).toString(), expectedGuildBalance.toString());

    //Create Financing Request
    let requestedAmount = Web3.toBN(50000);
    let financingAddress = await dao.getAddress(Web3.sha3('financing'));
    let financingContract = await FinancingContract.at(financingAddress);
    await financingContract.createFinancingRequest(dao.address, applicant, token, requestedAmount, Web3.fromUtf8(""));
    
    //Get the new proposalId from event log
    pastEvents = await proposal.getPastEvents();
    proposalId = pastEvents[0].returnValues.proposalId;
    assert.equal(proposalId, 1);

    //Member sponsors the Financing proposal
    await financingContract.sponsorProposal(dao.address, proposalId, [], { from: myAccount, gasPrice: Web3.toBN("0") });

    //Member votes on the Financing proposal
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Check applicant balance before Financing proposal is processed
    let applicantBalance = await bank.balanceOf(applicant, token);
    assert.equal(Web3.toBN(applicantBalance).toString(), "0".toString());
    
    //Process Financing proposal after voting
    await advanceTime(10000);
    await financingContract.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Check Guild Bank balance to make sure the transfer has happened
    guildBalance = await bank.balanceOf(GUILD, token);
    assert.equal(Web3.toBN(guildBalance).toString(), expectedGuildBalance.sub(requestedAmount).toString());

    //Check the applicant token balance to make sure the funds are available in the bank for the applicant account
    applicantBalance = await bank.balanceOf(applicant, token);
    assert.equal(Web3.toBN(applicantBalance).toString(), requestedAmount.toString());
  })
});