// Whole-script strict mode syntax
"use strict";

/**
MIT License

Copyright (c) 2020 Openlaw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

const Web3Utils = require('web3-utils');

const sha3 = Web3Utils.sha3;
const toBN = Web3Utils.toBN;
const toWei = Web3Utils.toWei;
const fromUtf8 = Web3Utils.fromUtf8;

const GUILD = "0x000000000000000000000000000000000000dead";
const TOTAL = "0x000000000000000000000000000000000000babe";
const SHARES = "0x00000000000000000000000000000000000FF1CE";
const LOOT = "0x00000000000000000000000000000000B105F00D";
const ETH_TOKEN = "0x0000000000000000000000000000000000000000";
const DAI_TOKEN = "0x95b58a6bff3d14b7db2f5cb5f0ad413dc2940658";

const numberOfShares = toBN("1000000000000000");
const sharePrice = toBN(toWei("120", "finney"));
const remaining = sharePrice.sub(toBN("50000000000000"));
const maximumChunks = toBN("11");

const OLTokenContract = artifacts.require("./test/OLT");

const FlagHelperLib = artifacts.require("./helpers/FlagHelper");
const DaoFactory = artifacts.require("./core/DaoFactory");
const DaoRegistry = artifacts.require("./core/DaoRegistry");
const VotingContract = artifacts.require("./adapters/VotingContract");
const WithdrawContract = artifacts.require("./adapters/WithdrawContract")
const ConfigurationContract = artifacts.require("./adapter/ConfigurationContract");
const ManagingContract = artifacts.require("./adapter/ManagingContract");
const FinancingContract = artifacts.require("./adapter/FinancingContract");
const RagequitContract = artifacts.require("./adapters/RagequitContract");
const GuildKickContract = artifacts.require("./adapters/GuildKickContract");
const OnboardingContract = artifacts.require("./adapters/OnboardingContract");
const OffchainVotingContract = artifacts.require("./adapters/OffchainVotingContract");

async function prepareSmartContracts(deployer) {
  let voting;
  let configuration;
  let ragequit;
  let managing;
  let financing;
  let onboarding;
  let guildkick;
  let withdraw;
  console.log("deploying smart contracts .....");
  if(deployer) {
    await deployer.deploy(VotingContract);
    await deployer.deploy(ConfigurationContract);
    await deployer.deploy(RagequitContract);
    await deployer.deploy(ManagingContract);
    await deployer.deploy(FinancingContract);
    await deployer.deploy(OnboardingContract);
    await deployer.deploy(GuildKickContract);
    await deployer.deploy(WithdrawContract);
    await console.log("retrieving contracts .....");
    voting = await VotingContract.deployed();
    configuration = await ConfigurationContract.deployed();
    ragequit = await RagequitContract.deployed();
    managing = await ManagingContract.deployed();
    financing = await FinancingContract.deployed();
    onboarding = await OnboardingContract.deployed();
    guildkick = await GuildKickContract.deployed();
    withdraw = await WithdrawContract.deployed();
  } else {
    voting = await VotingContract.new();
    configuration = await ConfigurationContract.new();
    ragequit = await RagequitContract.new();
    managing = await ManagingContract.new();
    financing = await FinancingContract.new();
    onboarding = await OnboardingContract.new();
    guildkick = await GuildKickContract.new();
    withdraw = await WithdrawContract.new();
  }

  return {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    withdraw
  };
}

async function addDefaultAdapters(
  dao,
  unitPrice = sharePrice,
  nbShares = numberOfShares,
  votingPeriod = 10,
  gracePeriod = 1,
  tokenAddr = ETH_TOKEN,
  maxChunks = maximumChunks,
  deployer
) {
  let daoFactory;
  if(deployer) {
    await deployer.deploy(DaoFactory, dao.address);
    daoFactory = await DaoFactory.deployed();
  } else {
    daoFactory = await DaoFactory.new(dao.address);
  }
  
  const {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    withdraw    
  } = await prepareSmartContracts(deployer);

  /**
     * EXISTS, SPONSORED, PROCESSED, JAILED,
        ADD_ADAPTER,REMOVE_ADAPTER,JAIL_MEMBER, UNJAIL_MEMBER, EXECUTE, SUBMIT_PROPOSAL, SPONSOR_PROPOSAL, PROCESS_PROPOSAL, 
        UPDATE_DELEGATE_KEY, REGISTER_NEW_TOKEN, REGISTER_NEW_INTERNAL_TOKEN, ADD_TO_BALANCE,SUB_FROM_BALANCE, INTERNAL_TRANSFER
     */

  await daoFactory.addAdapters(dao.address, [
    entry("voting", voting, {}),
    entry("configuration", configuration, {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      SET_CONFIGURATION: true,
    }),
    entry("ragequit", ragequit, {
      SUB_FROM_BALANCE: true,
      JAIL_MEMBER: true,
      UNJAIL_MEMBER: true,
      INTERNAL_TRANSFER: true,
    }),
    entry("guildkick", guildkick, {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SUB_FROM_BALANCE: true,
      ADD_TO_BALANCE: true,
      JAIL_MEMBER: true,
      UNJAIL_MEMBER: true,
      INTERNAL_TRANSFER: true,
    }),
    entry("managing", managing, {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      REMOVE_ADAPTER: true,
      ADD_ADAPTER: true,
    }),
    entry("financing", financing, {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
    }),
    entry("onboarding", onboarding, {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      ADD_TO_BALANCE: true,
      UPDATE_DELEGATE_KEY: true,
    }),

    entry("withdraw", withdraw, {
      WITHDRAW: true,
      SUB_FROM_BALANCE: true
    }),
  ]);

  await onboarding.configureDao(
    dao.address,
    SHARES,
    unitPrice,
    nbShares,
    maxChunks,
    tokenAddr
  );
  await onboarding.configureDao(
    dao.address,
    LOOT,
    unitPrice,
    nbShares,
    maxChunks,
    tokenAddr
  );
  await voting.configureDao(dao.address, votingPeriod, gracePeriod);

  return {dao, daoFactory};
}

async function deployDao(
  deployer,
  options
) {
  const unitPrice = options.unitPrice || sharePrice;
  const nbShares = options.nbShares || numberOfShares;
  const votingPeriod = options.votingPeriod || 10;
  const gracePeriod = options.gracePeriod || 1;
  const tokenAddr = options.tokenAddr || ETH_TOKEN;
  const maxChunks = options.maximumChunks || maximumChunks;

  await deployer.deploy(FlagHelperLib);
  
  await deployer.link(FlagHelperLib, DaoRegistry);

  await deployer.deploy(DaoRegistry);
  
  const dao = await cloneDaoDeployer(deployer);

  let {daoFactory} = await addDefaultAdapters(
    dao,
    unitPrice,
    nbShares,
    votingPeriod,
    gracePeriod,
    tokenAddr,
    maxChunks,
    deployer
  );

  const votingAddress = await dao.getAdapterAddress(sha3("voting"));
  const offchainVoting = await deployer.deploy(OffchainVotingContract, votingAddress, 1);
  await daoFactory.updateAdapter(
    dao.address,
    entry("voting", offchainVoting, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
      INTERNAL_TRANSFER: true,
    }));

  await offchainVoting.configureDao(
    dao.address,
    votingPeriod,
    gracePeriod,
    10);
  
  return dao;
}

async function createDao(
  senderAccount,
  unitPrice = sharePrice,
  nbShares = numberOfShares,
  votingPeriod = 10,
  gracePeriod = 1,
  tokenAddr = ETH_TOKEN
) {
  let lib = await FlagHelperLib.new();
  await DaoRegistry.link("FlagHelper", lib.address);

  const identityDao = await DaoRegistry.new({
    from: senderAccount,
    gasPrice: toBN("0"),
  });
  let receipt = await web3.eth.getTransactionReceipt(
    identityDao.transactionHash
  );
  console.log(
    "gas used to deploy the identity dao:",
    receipt && receipt.gasUsed
  );

  const dao = await cloneDao(identityDao.address, senderAccount);

  await addDefaultAdapters(
    dao,
    unitPrice,
    nbShares,
    votingPeriod,
    gracePeriod,
    tokenAddr
  );
  await dao.finalizeDao();
  return dao;
}

async function cloneDao(identityAddress, senderAccount) {
  // newDao: uses clone factory to clone the contract deployed at the identityAddress
  let daoFactory = await DaoFactory.new(identityAddress);
  await daoFactory.createDao("test-dao", [], [], false, {
    from: senderAccount,
    gasPrice: toBN("0"),
  });
  // checking the gas usaged to clone a contract
  let pastEvents = await daoFactory.getPastEvents();
  let { _address, _name } = pastEvents[0].returnValues;

  let dao = await DaoRegistry.at(_address);
  let receipt = await web3.eth.getTransactionReceipt(
    pastEvents[0].transactionHash
  );
  console.log(
    `gas used for cloned dao [${_name}]: `,
    receipt && receipt.gasUsed
  );
  return dao;
}

async function cloneDaoDeployer(deployer) {
  // newDao: uses clone factory to clone the contract deployed at the identityAddress
  const dao = await DaoRegistry.deployed();
  await deployer.deploy(DaoFactory, dao.address);
  let daoFactory = await DaoFactory.deployed();
  await daoFactory.createDao("test-dao", [], [], false);
  // checking the gas usaged to clone a contract
  let pastEvents = await daoFactory.getPastEvents();
  let { _address } = pastEvents[0].returnValues;

  return await DaoRegistry.at(_address);
}

function entry(name, contract, flags) {
  const values = [
    flags.EXISTS,
    flags.SPONSORED,
    flags.PROCESSED,
    flags.JAILED,
    flags.ADD_ADAPTER,
    flags.REMOVE_ADAPTER,
    flags.JAIL_MEMBER,
    flags.UNJAIL_MEMBER,
    flags.EXECUTE,
    flags.SUBMIT_PROPOSAL,
    flags.SPONSOR_PROPOSAL,
    flags.PROCESS_PROPOSAL,
    flags.UPDATE_DELEGATE_KEY,
    flags.REGISTER_NEW_TOKEN,
    flags.REGISTER_NEW_INTERNAL_TOKEN,
    flags.ADD_TO_BALANCE,
    flags.SUB_FROM_BALANCE,
    flags.INTERNAL_TRANSFER,
    flags.SET_CONFIGURATION,
    flags.WITHDRAW
  ];

  const acl = values
    .map((v, idx) => (v ? 2 ** idx : 0))
    .reduce((a, b) => a + b);

  return {
    id: sha3(name),
    addr: contract.address,
    flags: acl,
  };
}

async function advanceTime(time) {
  await new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [time],
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    );
  });

  await new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    );
  });
}

async function getContract(dao, id, contractFactory) {
  const address = await dao.getAdapterAddress(sha3(id));
  return await contractFactory.at(address);
}

module.exports = {
  prepareSmartContracts,
  advanceTime,
  createDao,
  deployDao,
  addDefaultAdapters,
  getContract,
  entry,
  sha3,
  toBN,
  toWei,
  fromUtf8,
  GUILD,
  TOTAL,
  DAI_TOKEN,
  SHARES,
  LOOT,
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
  GuildKickContract,
  OnboardingContract,
  WithdrawContract,
  ConfigurationContract,
  OnboardingContract,
};
