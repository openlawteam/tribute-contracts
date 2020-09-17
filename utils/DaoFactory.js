const GUILD = "0x000000000000000000000000000000000000dead";
const ESCROW = "0x000000000000000000000000000000000000beef";
const TOTAL = "0x000000000000000000000000000000000000babe";
const ETH_TOKEN = "0x0000000000000000000000000000000000000000";

const numberOfShares = web3.utils.toBN('1000000000000000');
const sharePrice = web3.utils.toBN(web3.utils.toWei("120", 'finney'));
const remaining = sharePrice.sub(web3.utils.toBN('50000000000000'));

const FlagHelperLib = artifacts.require('./v3/helpers/FlagHelper');
const DaoFactory = artifacts.require('./v3/core/DaoFactory');
const Registry = artifacts.require('./v3/core/Registry');
const MemberContract = artifacts.require('./v3/core/MemberContract');
const VotingContract = artifacts.require('./v3/core/VotingContract');
const ProposalContract = artifacts.require('./v3/core/ProposalContract');
const ManagingContract = artifacts.require('./v3/adapter/ManagingContract');
const FinancingContract = artifacts.require('./v3/adapter/FinancingContract');
const RagequitContract = artifacts.require('./v3/adapters/RagequitContract');
const OnboardingContract = artifacts.require('./v3/adapters/OnboardingContract');
const BankContract = artifacts.require('./v3/core/banking/BankContract');

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
    let onboarding = await OnboardingContract.new();

    return { voting, proposal, member, ragequit, managing, financing, onboarding};
  }

async function createDao(overridenModules, senderAccount) {
    let modules = await prepareSmartContracts();
    modules = Object.assign(modules, overridenModules);
    const {member, proposal, voting, ragequit, managing, financing, onboarding} = modules;
    let daoFactory = await DaoFactory.new(member.address, proposal.address, voting.address, ragequit.address, managing.address, financing.address, onboarding.address,
      { from: senderAccount, gasPrice: web3.utils.toBN("0") });
    await daoFactory.newDao(sharePrice, numberOfShares, 1000, { from: senderAccount, gasPrice: web3.utils.toBN("0") });
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await Registry.at(daoAddress);
    return dao;
}

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


module.exports = {
    prepareSmartContracts,
    advanceTime,
    createDao,
    GUILD,
    ESCROW,
    TOTAL,
    numberOfShares,
    sharePrice,
    remaining,
    ETH_TOKEN,
    DaoFactory,
    Registry,
    MemberContract,
    VotingContract,
    ProposalContract,
    ManagingContract,
    FinancingContract,
    RagequitContract,
    OnboardingContract,
    BankContract
};