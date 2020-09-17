
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
const RagequitContract = artifacts.require('./v3/adapters/RagequitContract');
const ManagingContract = artifacts.require('./v3/adapter/ManagingContract');
const FinancingContract = artifacts.require('./v3/adapter/FinancingContract');

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

contract('MolochV3 - Ragequit Adapter', async accounts => {

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
    return { voting, proposal, member, ragequit, managing, financing};
  }

  it("should not be possible for a non DAO member to ragequit", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];
    const token = "0x0000000000000000000000000000000000000000"; //0x0 indicates it is Native ETH
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
    let { proposalId } = pastEvents[0].returnValues;

    //Sponsor the new proposal, vote and process it 
    await onboarding.sponsorProposal(proposalId, [], { from: myAccount, gasPrice: Web3.toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: Web3.toBN("0") });
    await advanceTime(10000);
    await onboarding.processProposal(proposalId, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(GUILD, token);
    let expectedGuildBalance = Web3.toBN("1200000000000000000");
    assert.equal(Web3.toBN(guildBalance).toString(), expectedGuildBalance.toString());

    //Check Member Shares
    let shares = await member.nbShares(dao.address, newMember);
    assert.equal(shares.toString(), "10000000000000000");

    //Ragequit
    let ragequitAddress = await dao.getAddress(Web3.sha3('ragequit'));
    let ragequitContract = await RagequitContract.at(ragequitAddress);
    try {
      await ragequitContract.ragequit(dao.address, Web3.toBN(shares), { from: accounts[4], gasPrice: Web3.toBN("0") });
    } catch (error){
      assert.equal(error.reason, "only DAO members are allowed to call this function");
    }
  })

  it("should be possible to a member to ragequit", async () => {
    const myAccount = accounts[1];
    const newMember = accounts[2];
    const token = "0x0000000000000000000000000000000000000000"; //0x0 indicates it is Native ETH
    const { voting, member, proposal, ragequit, managing, financing} = await prepareSmartContracts();

    let daoFactory = await DaoFactory.new(member.address, proposal.address, voting.address, ragequit.address, managing.address, financing.address,
      { from: myAccount, gasPrice: Web3.toBN("0") });

    const txResult = await daoFactory.newDao(sharePrice, numberOfShares, 1000, { from: myAccount, gasPrice: Web3.toBN("0") });
    console.log('********');
    console.log(txResult.receipt.gasUsed);
    console.log('********');
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

    //Check Member Shares
    let shares = await member.nbShares(dao.address, newMember);
    assert.equal(shares.toString(), "10000000000000000");

    //Ragequit
    let ragequitAddress = await dao.getAddress(Web3.sha3('ragequit'));
    let ragequitContract = await RagequitContract.at(ragequitAddress);
    await ragequitContract.ragequit(dao.address, Web3.toBN(shares), { from: newMember, gasPrice: Web3.toBN("0") });

    //Check Member Shares
    shares = await member.nbShares(dao.address, newMember);
    assert.equal(shares.toString(), "0");

    //Check Ragequit Event
    // pastEvents = await proposal.getPastEvents();
    // proposalId = pastEvents[0].returnValues.proposalId;
    // assert.equal(proposalId, 1);

    //Check Member Balance for each avaiable token
    //TODO
    
  })
});