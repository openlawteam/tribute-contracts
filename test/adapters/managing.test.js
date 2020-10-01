
const {advanceTime, createDao, GUILD, ESCROW, TOTAL, ETH_TOKEN, ManagingContract, VotingContract, OnboardingContract} = require('../../utils/DaoFactory.js');
const toBN = web3.utils.toBN;
const sha3 = web3.utils.sha3;

contract('MolochV3 - Managing Adapter', async accounts => {
  
  it("should not be possible to propose a new module with 0x0 module address", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao({}, myAccount);

    //Submit a new Bank module proposal
    let newModuleId = sha3('bank');
    let managingContract = await dao.getAdapterAddress(sha3('managing'));
    let managing = await ManagingContract.at(managingContract);
    try {
      await managing.createModuleChangeRequest(dao.address, newModuleId, ETH_TOKEN, { from: myAccount, gasPrice: toBN("0") });
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "invalid module address");
    }

  })

  it("should not be possible to propose a new module when the module has a reserved address", async () => {
    const myAccount = accounts[1];
    
    //Create the new DAO
    let dao = await createDao({}, myAccount);

    //Submit a new Bank module proposal
    let newModuleId = sha3('bank');
    let managingContract = await dao.getAdapterAddress(sha3('managing'));
    let managing = await ManagingContract.at(managingContract);
    try {
      await managing.createModuleChangeRequest(dao.address, newModuleId, GUILD, { from: myAccount, gasPrice: toBN("0") });
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "module is using reserved address");
    }
    try {
      await managing.createModuleChangeRequest(dao.address, newModuleId, ESCROW, { from: myAccount, gasPrice: toBN("0") });
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "module is using reserved address");
    }
    try {
      await managing.createModuleChangeRequest(dao.address, newModuleId, TOTAL, { from: myAccount, gasPrice: toBN("0") });
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "module is using reserved address");
    }
  })

  it("should not be possible to propose a new module with an empty module address", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao({}, myAccount);

    //Submit a new Bank module proposal
    let newModuleId = sha3('managing');
    let managingContract = await dao.getAdapterAddress(sha3('managing'));
    let managing = await ManagingContract.at(managingContract);
    try {
      await managing.createModuleChangeRequest(dao.address, newModuleId, "", { from: myAccount, gasPrice: toBN("0") });
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "invalid address");
    }
  })

  it("should be possible to any individual to propose a new DAO module", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao({}, myAccount);
    let managingContract = await dao.getAdapterAddress(sha3('managing'));
    let managing = await ManagingContract.at(managingContract);

    let votingContract = await dao.getAdapterAddress(sha3('voting'));
    let voting = await VotingContract.at(votingContract);

    //Submit a new Bank module proposal
    let newModuleId = sha3('onboarding');
    let newModuleAddress = accounts[3]; //TODO deploy some Banking test contract
    await managing.createModuleChangeRequest(dao.address, newModuleId, newModuleAddress, { from: myAccount, gasPrice: toBN("0") });

    //Get the new proposal id
    pastEvents = await dao.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;
    
    //Sponsor the new proposal, vote and process it 
    await managing.sponsorProposal(dao.address, proposalId, [], { from: myAccount, gasPrice: toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: toBN("0") });
    await advanceTime(10000);
    await managing.processProposal(dao.address, proposalId, { from: myAccount, gasPrice: toBN("0") });

    //Check if the Bank Module was added to the Registry
    let newBankAddress = await dao.getAdapterAddress(sha3('onboarding'));
    assert.equal(newBankAddress.toString(), newModuleAddress.toString());
  })

  it("should be possible to propose a new DAO module with a delegate key", async () => {
    const myAccount = accounts[1];
    const delegateKey = accounts[3];

    //Create the new DAO
    let dao = await createDao({}, myAccount);
    let managingContract = await dao.getAdapterAddress(sha3('managing'));
    let managing = await ManagingContract.at(managingContract);

    let votingContract = await dao.getAdapterAddress(sha3('voting'));
    let voting = await VotingContract.at(votingContract);
    //Submit a new Bank module proposal
    let newModuleId = sha3('onboarding');
    let newModuleAddress = accounts[4]; //TODO deploy some Banking test contract
    await managing.createModuleChangeRequest(dao.address, newModuleId, newModuleAddress, { from: myAccount, gasPrice: toBN("0") });

    //Get the new proposal id
    pastEvents = await dao.getPastEvents();
    let { proposalId } = pastEvents[0].returnValues;
    
    //set new delegate key
    const onboardingAddr = await dao.getAdapterAddress(sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddr);
    await onboarding.updateDelegateKey(dao.address, delegateKey, { from: myAccount, gasPrice: toBN("0") });

    //Sponsor the new proposal, vote and process it 
    await managing.sponsorProposal(dao.address, proposalId, [], { from: delegateKey, gasPrice: toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: delegateKey, gasPrice: toBN("0") });
    try {
      await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: toBN("0") });
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "onlyMember");
    }
    await advanceTime(10000);
    await managing.processProposal(dao.address, proposalId, { from: delegateKey, gasPrice: toBN("0") });

    //Check if the Bank Module was added to the Registry
    let newBankAddress = await dao.getAdapterAddress(sha3('onboarding'));
    assert.equal(newBankAddress.toString(), newModuleAddress.toString());
  })
});