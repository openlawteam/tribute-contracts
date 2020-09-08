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

  const numberOfShares = Web3.toBN('1000000000000000');
  const sharePrice = Web3.toBN(Web3.toWei("120", 'finney'));
  const remaining = sharePrice.sub(Web3.toBN('50000000000000'))
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
      { from: myAccount, gasPrice: Web3.toBN("0") });

    await daoFactory.newDao(sharePrice, numberOfShares, 1000, {from: myAccount, gasPrice: Web3.toBN("0")});
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    const onboardingAddress = await dao.getAddress(Web3.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    await onboarding.sendTransaction({from:otherAccount,value:sharePrice.mul(Web3.toBN(3)).add(remaining), gasPrice: Web3.toBN("0")});
    await onboarding.sponsorProposal(0, {from: myAccount, gasPrice: Web3.toBN("0")});

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

    const guildBalance = await bank.balanceOf(dao.address, GUILD, "0x0000000000000000000000000000000000000000");
    assert.equal(guildBalance.toString(), sharePrice.mul(Web3.toBN("3")).toString());
  })

  it("should be possible to any individual to request financing", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    const newMember = accounts[3];
    const token = "0x0000000000000000000000000000000000000000"; //0x0 indicates it is Native ETH
    const { voting, member, bank, proposal } = await prepareSmartContracts();

    let daoFactory = await DaoFactory.new(bank.address, member.address, proposal.address, voting.address, 
      { from: myAccount, gasPrice: Web3.toBN("0") });

    await daoFactory.newDao(sharePrice, numberOfShares, 1000, { from: myAccount, gasPrice: Web3.toBN("0") });
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAddress(Web3.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    await onboarding.sendTransaction({ from: newMember, value: sharePrice.mul(Web3.toBN(10)).add(remaining), gasPrice: Web3.toBN("0") });
    //Get the new proposal id
    pastEvents = await proposal.getPastEvents();
    let { proposalId }  = pastEvents[0].returnValues;

    //Sponsor the new proposal, vote and process it 
    await onboarding.sponsorProposal(proposalId, { from: myAccount, gasPrice: Web3.toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: Web3.toBN("0") });
    await advanceTime(10000);
    await onboarding.processProposal(proposalId, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(dao.address, GUILD, token);
    let expectedGuildBalance = Web3.toBN("1200000000000000000");
    assert.equal(Web3.toBN(guildBalance).toString(), expectedGuildBalance.toString());

    //Create Financing Request
    let requestedAmount = Web3.toBN(50000);
    let financingAddress = await dao.getAddress(Web3.sha3('financing'));
    let financingContract = await FinancingContract.at(financingAddress);
    await financingContract.createFinancingRequest(daoAddress, applicant, token, requestedAmount, Web3.fromUtf8(""));
    
    //Get the new proposalId from event log
    pastEvents = await proposal.getPastEvents();
    proposalId = pastEvents[0].returnValues.proposalId;
    assert.equal(proposalId, 1);

    //Member sponsors the Financing proposal
    await financingContract.sponsorProposal(proposalId, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Member votes on the Financing proposal
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Check applicant balance before Financing proposal is processed
    let applicantBalance = await bank.balanceOf(dao.address, applicant, token);
    assert.equal(Web3.toBN(applicantBalance).toString(), "0".toString());
    
    //Process Financing proposal after voting
    await advanceTime(10000);
    await financingContract.processProposal(proposalId, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Check Guild Bank balance to make sure the transfer has happened
    guildBalance = await bank.balanceOf(dao.address, GUILD, token);
    assert.equal(Web3.toBN(guildBalance).toString(), expectedGuildBalance.sub(requestedAmount).toString());

    //Check the applicant token balance to make sure the funds are available in the bank for the applicant account
    applicantBalance = await bank.balanceOf(dao.address, applicant, token);
    assert.equal(Web3.toBN(applicantBalance).toString(), requestedAmount.toString());
  })
});