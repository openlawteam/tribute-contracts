const { sha3 } = require("web3-utils");

const GUILD = "0x000000000000000000000000000000000000dead";
const ESCROW = "0x000000000000000000000000000000000000beef";
const TOTAL = "0x000000000000000000000000000000000000babe";
const ETH_TOKEN = "0x0000000000000000000000000000000000000000";
const DAI_TOKEN = "0x95b58a6bff3d14b7db2f5cb5f0ad413dc2940658";

const numberOfShares = web3.utils.toBN('1000000000000000');
const sharePrice = web3.utils.toBN(web3.utils.toWei("120", 'finney'));
const remaining = sharePrice.sub(web3.utils.toBN('50000000000000'));

const OLTokenContract = artifacts.require("./test/OLT");

const FlagHelperLib = artifacts.require('./helpers/FlagHelper128');
const DaoFactory = artifacts.require('./core/DaoFactory');
const DaoRegistry = artifacts.require("./core/DaoRegistry");
const VotingContract = artifacts.require('./adapters/VotingContract');
const ManagingContract = artifacts.require('./adapter/ManagingContract');
const FinancingContract = artifacts.require('./adapter/FinancingContract');
const RagequitContract = artifacts.require('./adapters/RagequitContract');
const OnboardingContract = artifacts.require('./adapters/OnboardingContract');
const NonVotingOnboardingContract = artifacts.require(
  "./adapters/NonVotingOnboardingContract"
);

async function prepareSmartContracts() {
    let voting = await VotingContract.new();
    let ragequit = await RagequitContract.new();
    let managing = await ManagingContract.new();
    let financing = await FinancingContract.new();
    let onboarding = await OnboardingContract.new();
    let nonVotingOnboarding = await NonVotingOnboardingContract.new();
    let daoFactory = await DaoFactory.new();

    return {
      voting,
      ragequit,
      managing,
      financing,
      onboarding,
      nonVotingOnboarding,
      daoFactory
    };
  }

async function addDefaultAdapters(dao, unitPrice=sharePrice, nbShares=numberOfShares, votingPeriod=10, gracePeriod=1, tokenAddr = ETH_TOKEN) {
    const {voting, ragequit, managing, financing, onboarding, nonVotingOnboarding, daoFactory} = await prepareSmartContracts();

    await daoFactory.addAdapters(
      dao.address,
      [
        entry("voting", voting), 
        entry("ragequit", ragequit),
        entry("managing", managing),
        entry("financing", financing),
        entry("onboarding", onboarding),
        entry("nonvoting-onboarding", nonVotingOnboarding)
    ])
    await onboarding.configureDao(dao.address, unitPrice, nbShares, tokenAddr);
    await nonVotingOnboarding.configureDao(dao.address, unitPrice, nbShares, tokenAddr);
    await voting.configureDao(dao.address, votingPeriod, gracePeriod);

    return dao;
}

async function createDao(senderAccount, unitPrice=sharePrice, nbShares=numberOfShares, votingPeriod=10, gracePeriod=1, tokenAddr = ETH_TOKEN) {
    let lib = await FlagHelperLib.new();
    await DaoRegistry.link("FlagHelper128", lib.address);
    let dao = await DaoRegistry.new({ from: senderAccount, gasPrice: web3.utils.toBN("0") });
    let receipt = await web3.eth.getTransactionReceipt(dao.transactionHash);
    console.log('gas used for dao:', receipt && receipt.gasUsed);
    await addDefaultAdapters(dao, unitPrice, nbShares, votingPeriod, gracePeriod, tokenAddr);
    await dao.finalizeDao();
    return dao;
}

function entry(name, contract) {
  return {
    id: sha3(name),
    addr: contract.address
  }
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
  addDefaultAdapters,
  entry,
  GUILD,
  ESCROW,
  TOTAL,
  DAI_TOKEN,
  numberOfShares,
  sharePrice,
  remaining,
  ETH_TOKEN,
  OLTokenContract,
  DaoFactory,
  DaoRegistry,
  FlagHelperLib,
  VotingContract,
  ManagingContract,
  FinancingContract,
  RagequitContract,
  OnboardingContract,
  NonVotingOnboardingContract,
};