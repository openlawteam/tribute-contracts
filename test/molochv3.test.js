const Web3 = require('web3-utils');
const FlagHelperLib = artifacts.require('./v3/FlagHelper');
const DaoFactory = artifacts.require('./v3/DaoFactory');
const ModuleRegistry = artifacts.require('./v3/ModuleRegistry');
const MemberContract = artifacts.require('./v3/MemberContract');
const BankContract = artifacts.require('./v3/BankContract');
const VotingContract = artifacts.require('./v3/VotingContract');
const ProposalContract = artifacts.require('./v3/ProposalContract');
const OnboardingContract = artifacts.require('./v3/OnboardingContract');
const FinancingContract = artifacts.require('./v3/FinancingContract');

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

contract('MolochV3', async accounts => {

  it("should not be possible to create a dao with an invalid module id", async () => {
    let moduleId = Web3.fromUtf8("");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let contract = await ModuleRegistry.new();
    try {
      await contract.updateRegistry(moduleId, moduleAddress);
    } catch (err) {
      assert.equal(err.reason, "moduleId must not be empty");
    }
  });

  it("should not be possible to remove a module from dao if the module was not registered", async () => {
    let moduleId = Web3.fromUtf8("1");
    let contract = await ModuleRegistry.new();
    try {
      await contract.removeRegistry(moduleId);
    } catch (err) {
      assert.equal(err.reason, "moduleId not registered");
    }
  });

  it("should not be possible to create a dao with an invalid module address", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "";
    let contract = await ModuleRegistry.new();
    try {
      await contract.updateRegistry(moduleId, moduleAddress);
    } catch (err) {
      assert.equal(err.reason, "invalid address");
    }
  });

  it("should not be possible to create a dao with an empty module address", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "0x0";
    let contract = await ModuleRegistry.new();
    try {
      await contract.updateRegistry(moduleId, moduleAddress);
    } catch (err) {
      assert.equal(err.reason, "invalid address");
    }
  });

  it("should be possible to create a dao and register at least one module to it", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let contract = await ModuleRegistry.new();
    await contract.updateRegistry(moduleId, moduleAddress);
    let address = await contract.getAddress(moduleId);
    assert.equal(address, moduleAddress);
  });

  it("should be possible to remove a module from the dao", async () => {
    let moduleId = Web3.fromUtf8("2");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let contract = await ModuleRegistry.new();
    await contract.updateRegistry(moduleId, moduleAddress);
    let address = await contract.getAddress(moduleId);
    assert.equal(address, moduleAddress);
    await contract.removeRegistry(moduleId);
    address = await contract.getAddress(moduleId);
    assert.equal(address, "0x0000000000000000000000000000000000000000");
  });

  const numberOfShares = web3.utils.toBN('1000000000000000');
  const sharePrice = web3.utils.toBN(web3.utils.toWei("120", 'finney'));
  const remaining = sharePrice.sub(web3.utils.toBN('50000000000000'))
  const GUILD = "0x000000000000000000000000000000000000dead";
  const ESCROW = "0x000000000000000000000000000000000000beef";
  const TOTAL = "0x000000000000000000000000000000000000babe";

  async function prepareSmartContracts() {
    let lib = await FlagHelperLib.new();
    let bank = await BankContract.new();
    await MemberContract.link("FlagHelper", lib.address);
    await ProposalContract.link("FlagHelper", lib.address);
    let member = await MemberContract.new();
    let proposal = await ProposalContract.new();
    let voting = await VotingContract.new();
    return { voting, proposal, member, bank};
  }

  it("should be possible to join a DAO", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const nonMemberAccount = accounts[3];
    const {voting, member, bank, proposal} = await prepareSmartContracts();

    let daoFactory = await DaoFactory.new(bank.address, member.address, proposal.address, voting.address, 
      { from: myAccount, gasPrice: web3.utils.toBN("0") });

    await daoFactory.newDao(sharePrice, numberOfShares, 1000, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    const onboardingAddress = await dao.getAddress(web3.utils.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    await onboarding.sendTransaction({from:otherAccount,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    await onboarding.sponsorProposal(0, {from: myAccount, gasPrice: web3.utils.toBN("0")});

    await voting.submitVote(dao.address, 0, 1, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    try {
      await onboarding.processProposal(0, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    } catch(err) {
      assert.equal(err.reason, "proposal need to pass to be processed");
    }
    
    await advanceTime(10000);
    await onboarding.processProposal(0, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    
    const myAccountShares = await member.nbShares(dao.address, myAccount);
    const otherAccountShares = await member.nbShares(dao.address, otherAccount);
    const nonMemberAccountShares = await member.nbShares(dao.address, nonMemberAccount);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), numberOfShares.mul(web3.utils.toBN("3")));
    assert.equal(nonMemberAccountShares.toString(), "0");

    const guildBalance = await bank.balanceOf(dao.address, GUILD, "0x0000000000000000000000000000000000000000");
    assert.equal(guildBalance.toString(), sharePrice.mul(web3.utils.toBN("3")).toString());
  })

  it("should be possible to any individual to request financing", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    const token = "0x0000000000000000000000000000000000000000";
    const { voting, member, bank, proposal } = await prepareSmartContracts();

    let daoFactory = await DaoFactory.new(bank.address, member.address, proposal.address, voting.address, 
      { from: myAccount, gasPrice: web3.utils.toBN("0") });

    await daoFactory.newDao(sharePrice, numberOfShares, 1000, { from: myAccount, gasPrice: web3.utils.toBN("0") });
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    const financingAddress = await dao.getAddress(web3.utils.sha3('financing'));
    const financingContract = await FinancingContract.at(financingAddress);

    //Add funds to the Guild Bank
    //todo - only modules can execute the `addToGuild` function? How do we distribute the tokens?

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(dao.address, GUILD, "0x0000000000000000000000000000000000000000");
    assert.equal(guildBalance.toString(), web3.utils.toBN("10").toString());

    //Create Financing Request
    await financingContract.createFinancingRequest(daoAddress, applicant, token, 1000, Web3.fromUtf8("request financing to build v3"));

    //Member sponsors the Financing proposal
    await financingContract.sponsorProposal(0, { from: myAccount, gasPrice: web3.utils.toBN("0") });

    //Member votes on the Financing proposal
    await voting.submitVote(dao.address, 0, 1, { from: myAccount, gasPrice: web3.utils.toBN("0") });

    try {
      await financingContract.processProposal(0, { from: myAccount, gasPrice: web3.utils.toBN("0") });
    } catch (err) {
      assert.equal(err.reason, "proposal need to pass to be processed");
    }

    await advanceTime(10000);
    //Process Financing proposal after voting
    await financingContract.processProposal(0, { from: myAccount, gasPrice: web3.utils.toBN("0") });

    //Check Guild Bank balance to make sure the transfer has happened
    guildBalance = await bank.balanceOf(dao.address, GUILD, "0x0000000000000000000000000000000000000000");
    assert.equal(guildBalance.toString(), sharePrice.mul(web3.utils.toBN("3")).toString());

    //Check the applicant token balance to make sure the transfer has happened
    //todo...

    //Get the proposal data to check if the proposal has been updated to processed=true 
    //todo...
  })
});