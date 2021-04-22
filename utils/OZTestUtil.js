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

const {
  web3,
  contract,
  accounts,
  provider,
} = require("@openzeppelin/test-environment");

const {
  contracts,
  sharePrice,
  numberOfShares,
  maximumChunks,
  ETH_TOKEN,
  SHARES
} = require("./DaoFactory");

const {
  deployDao,
  prepareAdapters,
  entryDao,
  entryBank,
  entry
} = require("./DeploymentUtil");

const ozContracts = getContracts();

const deployFunction = async (contractInterface, args, from) => {
  const f = from ? from : accounts[0];
  if(args) {
    return await contractInterface.new(...args, {from: f});
  } else {
    return await contractInterface.new({from: f});
  }
}

const { expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

function getContractFromOpenZepplin(c) {
  return contract.fromArtifact(c.substring(c.lastIndexOf("/") + 1));
}

function getContracts() {
  return Object.keys(contracts).reduce((previousValue, key) => {
    previousValue[key] = getContractFromOpenZepplin(contracts[key]);
    return previousValue;
  }, {});
}

function getDefaultOptions(options) {
  let o = {
    unitPrice: sharePrice,
    nbShares: numberOfShares,
    votingPeriod: 10,
    gracePeriod : 1,
    tokenAddr : ETH_TOKEN,
    maxChunks: maximumChunks,
    chainId : 1,
    maxExternalTokens : 100,
    couponCreatorAddress : '0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8',
    deployTestTokens: true,
    ... options
  };

  o.finalize = options.finalize === undefined || !!options.finalize;
  return o;
}

const deployDefaultDao = async (options) => {
  return await deployDao({ ... getDefaultOptions(options) , ... ozContracts, deployFunction});
};

const deployDefaultNFTDao = async ({owner}) => {
  const { dao, adapters, extensions, testContracts } = await deployDao({
    ... getDefaultOptions({owner}),
    deployTestTokens: true,
    finalize: false,
    ...ozContracts,
    deployFunction
  });

  await dao.finalizeDao({ from: owner });

  return {
    dao: dao,
    adapters: adapters,
    extensions: extensions,
    testContracts: testContracts,
  };
};

const deployDaoWithOffchainVoting = async ({owner, newMember}) => {
  const {
    dao,
    adapters,
    extensions,
    testContracts,
    votingHelpers,
  } = await deployDao({
    ...getDefaultOptions({owner}),
    isOffchainVoting: true,
    deployTestTokens: true,
    finalize: false,
    ...ozContracts,
    deployFunction
  });

  await dao.potentialNewMember(newMember, {
    from: owner,
  });
  await extensions.bank.addToBalance(newMember, SHARES, 1, {
    from: owner,
  });

  await dao.finalizeDao({ from: owner });

  adapters["voting"] = votingHelpers.offchainVoting;

  return {
    dao: dao,
    adapters: adapters,
    extensions: extensions,
    testContracts: testContracts,
    votingHelpers: votingHelpers,
  };
};

const deployDaoWithBatchVoting = async ({owner, newMember}) => {

  const { dao, adapters, extensions, votingHelpers } = await deployDao({
    ...getDefaultOptions({owner}),
    ...ozContracts,
    deployTestTokens: false,
    batchVoting: true,
    finalize: false,
    deployFunction
  });

  await dao.potentialNewMember(newMember, {
    from: owner,
  });

  await extensions.bank.addToBalance(newMember, SHARES, 1, {
    from: owner,
  });

  await dao.finalizeDao({ from: owner });

  adapters["voting"] = adapters.batchVoting;

  return {
    dao: dao,
    adapters: adapters,
    extensions: extensions,
    votingHelpers: votingHelpers,
  };
};

const createIdentityDao = async (owner) => {
  let DaoRegistry = getContractFromOpenZepplin(DaoRegistryName);
  return await DaoRegistry.new({
    from: owner,
    gasPrice: toBN("0"),
  });
};

const addDefaultAdapters = async ({
  deployer,
  dao,
  unitPrice = sharePrice,
  nbShares = numberOfShares,
  votingPeriod = 10,
  gracePeriod = 1,
  tokenAddr = ETH_TOKEN,
  maxChunks = maximumChunks,
  daoFactory,
  nftAddr,
  couponCreatorAddress
}) => {
  const {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    daoRegistryAdapter,
    bankAdapter,
    nftAdapter,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT,
  } = await prepareAdapters(deployer);

  let BankExtension, NFTExtension;

  if(deployer) {
    BankExtension = getContractFromTruffle(BankExtensionName);
    NFTExtension = getContractFromTruffle(NFTExtensionName);
  } else {
    BankExtension = getContractFromOpenZepplin(BankExtensionName);
    NFTExtension = getContractFromOpenZepplin(NFTExtensionName);
  }

  const bankAddress = await dao.getExtensionAddress(sha3("bank"));
  const bankExtension = await BankExtension.at(bankAddress);

  const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
  const nftExtension = await NFTExtension.at(nftExtAddr);

  await configureDao({
    daoFactory,
    dao,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    daoRegistryAdapter,
    bankAdapter,
    nftAdapter,
    voting,
    configuration,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT,
    unitPrice,
    nbShares,
    votingPeriod,
    gracePeriod,
    tokenAddr,
    maxChunks,
    nftAddr,
    couponCreatorAddress,
    bankExtension,
    nftExtension
  });

  return {
    dao,
    adapters: {
      voting,
      configuration,
      ragequit,
      guildkick,
      managing,
      financing,
      onboarding,
      daoRegistryAdapter,
      bankAdapter,
      nftAdapter,
      couponOnboarding,
      tribute,
      distribute,
      tributeNFT,
    },
  };
};

const configureDao = async ({
  daoFactory,
  dao,
  ragequit,
  guildkick,
  managing,
  financing,
  onboarding,
  daoRegistryAdapter,
  bankAdapter,
  bankExtension,
  nftExtension,
  nftAdapter,
  voting,
  configuration,
  couponOnboarding,
  tribute,
  distribute,
  tributeNFT,
  unitPrice,
  nbShares,
  votingPeriod,
  gracePeriod,
  tokenAddr,
  maxChunks,
  couponCreatorAddress
}) => {
  await daoFactory.addAdapters(dao.address, [
    entryDao("voting", voting, {}),
    entryDao("configuration", configuration, {
      SUBMIT_PROPOSAL: true,
      SET_CONFIGURATION: true,
    }),
    entryDao("ragequit", ragequit, {}),
    entryDao("guildkick", guildkick, {
      SUBMIT_PROPOSAL: true,
    }),
    entryDao("managing", managing, {
      SUBMIT_PROPOSAL: true,
      REPLACE_ADAPTER: true,
    }),
    entryDao("financing", financing, {
      SUBMIT_PROPOSAL: true,
    }),
    entryDao("onboarding", onboarding, {
      SUBMIT_PROPOSAL: true,
      UPDATE_DELEGATE_KEY: true,
      NEW_MEMBER: true,
    }),
    entryDao("coupon-onboarding", couponOnboarding, {
      SUBMIT_PROPOSAL: false,
      ADD_TO_BALANCE: true,
      UPDATE_DELEGATE_KEY: false,
      NEW_MEMBER: true,
    }),
    entryDao("daoRegistry", daoRegistryAdapter, {
      UPDATE_DELEGATE_KEY: true,
    }),
    entryDao("nft", nftAdapter, {}),
    entryDao("bank", bankAdapter, {}),
    entryDao("tribute", tribute, {
      SUBMIT_PROPOSAL: true,
      NEW_MEMBER: true,
    }),
    entryDao("tribute-nft", tributeNFT, {
      SUBMIT_PROPOSAL: true,
      NEW_MEMBER: true,
    }),
    entryDao("distribute", distribute, {
      SUBMIT_PROPOSAL: true,
    }),
  ]);

  await daoFactory.configureExtension(dao.address, bankExtension.address, [
    entryBank(ragequit, {
      INTERNAL_TRANSFER: true,
      SUB_FROM_BALANCE: true,
      ADD_TO_BALANCE: true,
    }),
    entryBank(guildkick, {
      INTERNAL_TRANSFER: true,
      SUB_FROM_BALANCE: true,
      ADD_TO_BALANCE: true,
    }),
    entryBank(bankAdapter, {
      WITHDRAW: true,
      SUB_FROM_BALANCE: true,
      UPDATE_TOKEN: true,
    }),
    entryBank(onboarding, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
    }),
    entryBank(couponOnboarding, {
      ADD_TO_BALANCE: true,
    }),
    entryBank(financing, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
    }),
    entryBank(tribute, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
      REGISTER_NEW_TOKEN: true,
    }),
    entryBank(distribute, {
      INTERNAL_TRANSFER: true,
    }),
    entryBank(tributeNFT, {
      ADD_TO_BALANCE: true,
    }),
  ]);

  await daoFactory.configureExtension(dao.address, nftExtension.address, [
    entryNft(tributeNFT, {
      COLLECT_NFT: true,
    }),
    entryNft(nftAdapter, {
      COLLECT_NFT: true,
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
  await couponOnboarding.configureDao(
    dao.address,
    couponCreatorAddress,
    SHARES
  );

  await voting.configureDao(dao.address, votingPeriod, gracePeriod);
  await tribute.configureDao(dao.address, SHARES);
  await tribute.configureDao(dao.address, LOOT);
  await tributeNFT.configureDao(dao.address);
};

const cloneDao = async (deployer, identityDao, owner, name = "test-dao") => {
  // The owner of the DAO is always the 1st unlocked address if none is provided
  let txArgs = owner ? {from: owner } : undefined;

  let daoFactory, DaoRegistry;
  if (deployer) {
    let DaoFactory = getContractFromTruffle(DaoFactoryName);
    DaoRegistry = getContractFromTruffle(DaoRegistryName);
    await deployer.deploy(DaoFactory, identityDao.address);
    daoFactory = await DaoFactory.deployed();
  } else {
    let DaoFactory = getContractFromOpenZepplin(DaoFactoryName);
    DaoRegistry = getContractFromOpenZepplin(DaoRegistryName);
    daoFactory = await DaoFactory.new(identityDao.address, txArgs);
  }
  if(txArgs) {
    await daoFactory.createDao(name, ETH_TOKEN, txArgs);
  } else {
    await daoFactory.createDao(name, ETH_TOKEN);
  }
  
  // checking the gas usaged to clone a contract
  let pastEvents = await daoFactory.getPastEvents();
  let { _address, _name } = pastEvents[0].returnValues;
  let newDao = await DaoRegistry.at(_address);
  return { dao: newDao, daoFactory, daoName: _name };
};

const advanceTime = async (time) => {
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

  return true;
};

const takeChainSnapshot = async () => {
  return await new Promise((resolve, reject) =>
    provider.send(
      {
        jsonrpc: "2.0",
        method: "evm_snapshot",
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        let snapshotId = result.result; // {"id":X,"jsonrpc":"2.0","result":"0x..."}
        return resolve(snapshotId);
      }
    )
  );
};

const revertChainSnapshot = async (snapshotId) => {
  return await new Promise((resolve, reject) =>
    provider.send(
      {
        jsonrpc: "2.0",
        method: "evm_revert",
        params: [snapshotId],
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    )
  ).catch((e) => console.error(e));
};

const proposalIdGenerator = () => {
  var idCounter = 0;
  return {
    *generator() {
      idCounter++;
      return `0x${idCounter}`;
    },
  };
};

const configureOffchainVoting = async (
  owner,
  dao,
  daoFactory,
  chainId,
  votingAddress,
  bankAddress,
  votingPeriod,
  gracePeriod,
  deployer
) => {
  let snapshotProposalContract;
  let handleBadReporterAdapter;
  let offchainVoting;
  if (deployer) {
    let SnapshotProposalContract = getContractFromTruffle(SnapshotProposalContractName);
    let KickBadReporterAdapter = getContractFromTruffle(KickBadReporterAdapterName);
    let OffchainVotingContract = getContractFromTruffle(OffchainVotingContractName);
    snapshotProposalContract = await deployer.deploy(
      SnapshotProposalContract,
      chainId
    );
    handleBadReporterAdapter = await deployer.deploy(KickBadReporterAdapter);
    offchainVoting = await deployer.deploy(
      OffchainVotingContract,
      votingAddress,
      snapshotProposalContract.address,
      handleBadReporterAdapter.address
    );
  } else {
    let SnapshotProposalContract = getContractFromOpenZepplin(SnapshotProposalContractName);
    let KickBadReporterAdapter = getContractFromOpenZepplin(KickBadReporterAdapterName);
    let OffchainVotingContract = getContractFromOpenZepplin(OffchainVotingContractName);
    snapshotProposalContract = await SnapshotProposalContract.new(chainId);
    handleBadReporterAdapter = await KickBadReporterAdapter.new();
    offchainVoting = await OffchainVotingContract.new(
      votingAddress,
      snapshotProposalContract.address,
      handleBadReporterAdapter.address
    );
  }

  await daoFactory.updateAdapter(
    dao.address,
    entryDao("voting", offchainVoting, {})
  );

  await dao.setAclToExtensionForAdapter(
    bankAddress,
    offchainVoting.address,
    entryBank(offchainVoting, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
      INTERNAL_TRANSFER: true,
    }).flags
  );
  await offchainVoting.configureDao(dao.address, votingPeriod, gracePeriod, 10);

  return { offchainVoting, snapshotProposalContract, handleBadReporterAdapter };
};

const configureBatchVoting = async (
  owner,
  dao,
  daoFactory,
  chainId,
  votingPeriod,
  gracePeriod,
  deployer
) => {
  let snapshotProposalContract, batchVoting;
  if (deployer) {
    let SnapshotProposalContract = getContractFromTruffle(SnapshotProposalContractName);
    let BatchVotingContract = getContractFromTruffle(BatchVotingContractName);
    snapshotProposalContract = await deployer.deploy(
      SnapshotProposalContract,
      chainId
    );
    batchVoting = await deployer.deploy(
      BatchVotingContract,
      snapshotProposalContract.address
    );
  } else {
    let SnapshotProposalContract = getContractFromOpenZepplin(SnapshotProposalContractName);
    let BatchVotingContract = getContractFromOpenZepplin(BatchVotingContractName);
    snapshotProposalContract = await SnapshotProposalContract.new(chainId);
    batchVoting = await BatchVotingContract.new(
      snapshotProposalContract.address
    );
  }

  await daoFactory.updateAdapter(
    dao.address,
    entryDao("voting", batchVoting, {}),
    { from: owner }
  );

  await batchVoting.configureDao(dao.address, votingPeriod, gracePeriod, {
    from: owner,
  });

  return { batchVoting, snapshotProposalContract };
};

module.exports = {
  deployDao,
  deployDefaultDao,
  deployDefaultNFTDao,
  deployDaoWithBatchVoting,
  deployDaoWithOffchainVoting,
  createIdentityDao,
  cloneDao,
  prepareAdapters,
  addDefaultAdapters,
  entry,
  entryBank,
  entryDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  web3,
  provider,
  accounts,
  expect,
  expectRevert,
  deployFunction,
  ...ozContracts
};
