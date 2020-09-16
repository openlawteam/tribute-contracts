const Web3 = require('web3-utils');
const FlagHelperLib = artifacts.require('./v3/helpers/FlagHelper');
const DaoFactory = artifacts.require('./v3/core/DaoFactory');
const Registry = artifacts.require('./v3/core/Registry');
const MemberContract = artifacts.require('./v3/core/MemberContract');
const VotingContract = artifacts.require('./v3/core/VotingContract');
const ProposalContract = artifacts.require('./v3/core/ProposalContract');
const RagequitContract = artifacts.require('./v3/adapters/RagequitContract');

contract('Registry', async (accounts) => {

  const numberOfShares = Web3.toBN('1000000000000000');
  const sharePrice = Web3.toBN(Web3.toWei("120", 'finney'));
  const zeroedAddr = "0x0000000000000000000000000000000000000000";

  prepareSmartContracts = async () => {
    let lib = await FlagHelperLib.new();
    await MemberContract.link("FlagHelper", lib.address);
    await ProposalContract.link("FlagHelper", lib.address);
    let member = await MemberContract.new();
    let proposal = await ProposalContract.new();
    let voting = await VotingContract.new();
    let ragequit = await RagequitContract.new();
    return { voting, proposal, member, ragequit };
  }

  assertRegisteredModule = async (dao, moduleId) => {
    let moduleAddr = await dao.getAddress(Web3.sha3(moduleId));
    assert.notEqual(moduleAddr, zeroedAddr);
    assert(Web3.isAddress(moduleAddr), "invalid address for module " + moduleId);
  }

  it("should be possible to create a DAO with all adapters and core modules", async () => {
    const myAccount = accounts[0];
    const { voting, member, proposal, ragequit } = await prepareSmartContracts();

    //New factory
    let daoFactory = await DaoFactory.new(member.address, proposal.address, voting.address, ragequit.address,
      { from: myAccount, gasPrice: Web3.toBN("0") });

    //Create the DAO and get the DAO Address
    await daoFactory.newDao(sharePrice, numberOfShares, 1000, { from: myAccount, gasPrice: Web3.toBN("0") });
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    
    //Get the Registry
    let dao = await Registry.at(daoAddress);

    //Check if all Adapters are registered
    await assertRegisteredModule(dao, 'onboarding');
    await assertRegisteredModule(dao, 'financing');
    await assertRegisteredModule(dao, 'managing');
    await assertRegisteredModule(dao, 'ragequit');

    //Check if all core modules are registered
    await assertRegisteredModule(dao, 'bank');
    await assertRegisteredModule(dao, 'member');
    await assertRegisteredModule(dao, 'proposal');
    await assertRegisteredModule(dao, 'voting');
  });

});