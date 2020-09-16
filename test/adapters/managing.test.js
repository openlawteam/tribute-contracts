
const Web3 = require('web3-utils');
const FlagHelperLib = artifacts.require('./v3/helpers/FlagHelper');
const DaoFactory = artifacts.require('./v3/core/DaoFactory');
const ModuleRegistry = artifacts.require('./v3/core/Registry');
const MemberContract = artifacts.require('./v3/core/MemberContract');
const VotingContract = artifacts.require('./v3/core/VotingContract');
const ProposalContract = artifacts.require('./v3/core/ProposalContract');
const ManagingContract = artifacts.require('./v3/adapters/ManagingContract');

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

contract('MolochV3 - Managing Adapter', async accounts => {

  const GUILD = "0x000000000000000000000000000000000000dead";
  const ESCROW = "0x000000000000000000000000000000000000beef";
  const TOTAL = "0x000000000000000000000000000000000000babe";

  const numberOfShares = Web3.toBN('1000000000000000');
  const sharePrice = Web3.toBN(Web3.toWei("120", 'finney'));
  const token = "0x0000000000000000000000000000000000000000";
  const allowedTokens = [token];

  async function prepareSmartContracts() {
    let lib = await FlagHelperLib.new();
    await MemberContract.link("FlagHelper", lib.address);
    await ProposalContract.link("FlagHelper", lib.address);
    let member = await MemberContract.new();
    let proposal = await ProposalContract.new();
    let voting = await VotingContract.new();
    return { voting, proposal, member};
  }

  async function createDao(member, proposal, voting, senderAccount) {
    let daoFactory = await DaoFactory.new(member.address, proposal.address, voting.address,
      { from: senderAccount, gasPrice: Web3.toBN("0") });
    await daoFactory.newDao(sharePrice, numberOfShares, 1000, allowedTokens, { from: senderAccount, gasPrice: Web3.toBN("0") });
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);
    return dao;
  }

  it("should not be possible to propose a new module with 0x0 module address", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    const { voting, member, proposal } = await prepareSmartContracts();

    //Create the new DAO
    let dao = await createDao(member, proposal, voting, myAccount);

    //Submit a new Bank module proposal
    let managingAddress = await dao.getAddress(Web3.sha3('managing'));
    let managing = await ManagingContract.at(managingAddress);
    let newModuleId = Web3.sha3('bank');

    try {
      await managing.createModuleChangeRequest(applicant, newModuleId, token);
    } catch (err) {
      assert.equal(err.reason, "invalid module address");
    }

  })

  it("should not be possible to propose a new module when the applicant has a reserved address", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    const { voting, member, proposal } = await prepareSmartContracts();

    //Create the new DAO
    let dao = await createDao(member, proposal, voting, myAccount);

    //Submit a new Bank module proposal
    let managingAddress = await dao.getAddress(Web3.sha3('managing'));
    let managing = await ManagingContract.at(managingAddress);
    let newModuleId = Web3.sha3('bank');

    try {
      await managing.createModuleChangeRequest(GUILD, newModuleId, accounts[3]);
    } catch (err) {
      assert.equal(err.reason, "applicant address cannot be reserved");
    }
    try {
      await managing.createModuleChangeRequest(ESCROW, newModuleId, accounts[3]);
    } catch (err) {
      assert.equal(err.reason, "applicant address cannot be reserved");
    }
    try {
      await managing.createModuleChangeRequest(TOTAL, newModuleId, accounts[3]);
    } catch (err) {
      assert.equal(err.reason, "applicant address cannot be reserved");
    }
  })

  it("should not be possible to propose a new module when the module has a reserved address", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    const { voting, member, proposal } = await prepareSmartContracts();

    //Create the new DAO
    let dao = await createDao(member, proposal, voting, myAccount);

    //Submit a new Bank module proposal
    let managingAddress = await dao.getAddress(Web3.sha3('managing'));
    let managing = await ManagingContract.at(managingAddress);
    let newModuleId = Web3.sha3('bank');

    try {
      await managing.createModuleChangeRequest(applicant, newModuleId, GUILD);
    } catch (err) {
      assert.equal(err.reason, "module address cannot be reserved");
    }
    try {
      await managing.createModuleChangeRequest(applicant, newModuleId, ESCROW);
    } catch (err) {
      assert.equal(err.reason, "module address cannot be reserved");
    }
    try {
      await managing.createModuleChangeRequest(applicant, newModuleId, TOTAL);
    } catch (err) {
      assert.equal(err.reason, "module address cannot be reserved");
    }
  })

  it("should not be possible to propose a new module with an empty module address", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    const { voting, member, proposal } = await prepareSmartContracts();

    //Create the new DAO
    let dao = await createDao(member, proposal, voting, myAccount);

    //Submit a new Bank module proposal
    let managingAddress = await dao.getAddress(Web3.sha3('managing'));
    let managing = await ManagingContract.at(managingAddress);
    let newModuleId = Web3.sha3('managing');

    try {
      await managing.createModuleChangeRequest(applicant, newModuleId, "");
    } catch (err) {
      assert.equal(err.reason, "invalid address");
    }
  })

  it("should be possible to any individual to propose a new DAO Banking module", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    const { voting, member, proposal } = await prepareSmartContracts();

    //Create the new DAO
    let dao = await createDao(member, proposal, voting, myAccount);

    //Submit a new Bank module proposal
    let managingAddress = await dao.getAddress(Web3.sha3('managing'));
    let managing = await ManagingContract.at(managingAddress);
    let newModuleId = Web3.sha3('bank');
    let newModuleAddress = accounts[3]; //TODO deploy some Banking test contract
    await managing.createModuleChangeRequest(applicant, newModuleId, newModuleAddress);

    //Get the new proposal id
    pastEvents = await proposal.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;
    
    //Sponsor the new proposal, vote and process it 
    await managing.sponsorProposal(proposalId, [], { from: myAccount, gasPrice: Web3.toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: Web3.toBN("0") });
    await advanceTime(10000);
    await managing.processProposal(proposalId, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Check if the Bank Module was added to the Registry
    let newBankAddress = await dao.getAddress(Web3.sha3('bank'));
    assert.equal(newBankAddress.toString(), newModuleAddress.toString());
  })
});