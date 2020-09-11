
const Web3 = require('web3-utils');
const sha3 = web3.utils.sha3;
const FlagHelperLib = artifacts.require('./v3/helpers/FlagHelper');
const DaoFactory = artifacts.require('./v3/core/DaoFactory');
const ModuleRegistry = artifacts.require('./v3/core/Registry');
const MemberContract = artifacts.require('./v3/core/MemberContract');
const BankContract = artifacts.require('./v3/core/BankContract');
const VotingContract = artifacts.require('./v3/core/VotingContract');
const ProposalContract = artifacts.require('./v3/core/ProposalContract');
const OffchainVotingContract = artifacts.require('./v3/core/OffchainVotingContract');
const OnboardingContract = artifacts.require('./v3/adapters/OnboardingContract');
const FinancingContract = artifacts.require('./v3/adapters/FinancingContract');



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

contract('MolochV3 - Onboarding Adapter', async accounts => {

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
    return { voting, proposal, member};
  }

  it("should be possible to join a DAO", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const nonMemberAccount = accounts[3];
    const {voting, member, proposal} = await prepareSmartContracts();

    let daoFactory = await DaoFactory.new(member.address, proposal.address, voting.address, 
      { from: myAccount, gasPrice: Web3.toBN("0") });

    await daoFactory.newDao(sharePrice, numberOfShares, 1000, {from: myAccount, gasPrice: Web3.toBN("0")});
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);
    const bankAddress = await dao.getAddress(sha3("bank"));
    const bank = await BankContract.at(bankAddress);
    const onboardingAddress = await dao.getAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    await onboarding.sendTransaction({from:otherAccount,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    await onboarding.sponsorProposal(0, [], {from: myAccount, gasPrice: web3.utils.toBN("0")});

    await voting.submitVote(dao.address, 0, 1, {from: myAccount, gasPrice: Web3.toBN("0")});
    try {
      await onboarding.processProposal(0, {from: myAccount, gasPrice: Web3.toBN("0")});
    } catch(err) {
      assert.equal(err.reason, "proposal need to pass to be processed");
    }
    
    await advanceTime(10000);
    await onboarding.processProposal(0, {from: myAccount, gasPrice: Web3.toBN("0")});
    
    const myAccountShares = await member.nbShares(dao.address, myAccount);
    const otherAccountShares = await member.nbShares(dao.address, otherAccount);
    const nonMemberAccountShares = await member.nbShares(dao.address, nonMemberAccount);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), numberOfShares.mul(Web3.toBN("3")));
    assert.equal(nonMemberAccountShares.toString(), "0");

    const guildBalance = await bank.balanceOf(GUILD, "0x0000000000000000000000000000000000000000");
    assert.equal(guildBalance.toString(), sharePrice.mul(Web3.toBN("3")).toString());
  })
});