
const {advanceTime, createDao, GUILD, ESCROW, TOTAL, ETH_TOKEN, ManagingContract, ProposalContract, VotingContract} = require('../../utils/DaoFactory.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

contract('MolochV3 - Managing Adapter', async accounts => {
  
  it("should not be possible to propose a new module with 0x0 module address", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    

    //Create the new DAO
    let dao = await createDao({}, myAccount);

    //Submit a new Bank module proposal
    let newModuleId = sha3('bank');
    let managingContract = await dao.getAddress(sha3('managing'));
    let managing = await ManagingContract.at(managingContract);
    try {
      await managing.createModuleChangeRequest(dao.address, applicant, newModuleId, ETH_TOKEN);
    } catch (err) {
      assert.equal(err.reason, "invalid module address");
    }

  })

  it("should not be possible to propose a new module when the applicant has a reserved address", async () => {
    const myAccount = accounts[1];
  
    //Create the new DAO
    let dao = await createDao({}, myAccount);

    //Submit a new Bank module proposal
    let newModuleId = sha3('bank');
    let managingContract = await dao.getAddress(sha3('managing'));
    let managing = await ManagingContract.at(managingContract);
    try {
      await managing.createModuleChangeRequest(dao.address, GUILD, newModuleId, accounts[3]);
    } catch (err) {
      assert.equal(err.reason, "applicant address cannot be reserved");
    }
    try {
      await managing.createModuleChangeRequest(dao.address, ESCROW, newModuleId, accounts[3]);
    } catch (err) {
      assert.equal(err.reason, "applicant address cannot be reserved");
    }
    try {
      await managing.createModuleChangeRequest(dao.address, TOTAL, newModuleId, accounts[3]);
    } catch (err) {
      assert.equal(err.reason, "applicant address cannot be reserved");
    }
  })

  it("should not be possible to propose a new module when the module has a reserved address", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    
    //Create the new DAO
    let dao = await createDao({}, myAccount);

    //Submit a new Bank module proposal
    let newModuleId = sha3('bank');
    let managingContract = await dao.getAddress(sha3('managing'));
    let managing = await ManagingContract.at(managingContract);
    try {
      await managing.createModuleChangeRequest(dao.address, applicant, newModuleId, GUILD);
    } catch (err) {
      assert.equal(err.reason, "module address cannot be reserved");
    }
    try {
      await managing.createModuleChangeRequest(dao.address, applicant, newModuleId, ESCROW);
    } catch (err) {
      assert.equal(err.reason, "module address cannot be reserved");
    }
    try {
      await managing.createModuleChangeRequest(dao.address, applicant, newModuleId, TOTAL);
    } catch (err) {
      assert.equal(err.reason, "module address cannot be reserved");
    }
  })

  it("should not be possible to propose a new module with an empty module address", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];

    //Create the new DAO
    let dao = await createDao({}, myAccount);

    //Submit a new Bank module proposal
    let newModuleId = sha3('managing');
    let managingContract = await dao.getAddress(sha3('managing'));
    let managing = await ManagingContract.at(managingContract);
    try {
      await managing.createModuleChangeRequest(dao.address, applicant, newModuleId, "");
    } catch (err) {
      assert.equal(err.reason, "invalid address");
    }
  })

  it("should be possible to any individual to propose a new DAO Banking module", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];

    //Create the new DAO
    let dao = await createDao({}, myAccount);
    let managingContract = await dao.getAddress(sha3('managing'));
    let managing = await ManagingContract.at(managingContract);

    let proposalContract = await dao.getAddress(sha3('proposal'));
    let proposal = await ProposalContract.at(proposalContract);

    let votingContract = await dao.getAddress(sha3('voting'));
    let voting = await VotingContract.at(votingContract);
    //Submit a new Bank module proposal
    let newModuleId = sha3('bank');
    let newModuleAddress = accounts[3]; //TODO deploy some Banking test contract
    await managing.createModuleChangeRequest(dao.address, applicant, newModuleId, newModuleAddress);

    //Get the new proposal id
    pastEvents = await proposal.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;
    
    //Sponsor the new proposal, vote and process it 
    await managing.sponsorProposal(dao.address, proposalId, [], { from: myAccount, gasPrice: toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: toBN("0") });
    await advanceTime(10000);
    await managing.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check if the Bank Module was added to the Registry
    let newBankAddress = await dao.getAddress(sha3('bank'));
    assert.equal(newBankAddress.toString(), newModuleAddress.toString());
  })
});