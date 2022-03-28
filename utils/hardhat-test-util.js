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
  unitPrice,
  numberOfUnits,
  maximumChunks,
  maxAmount,
  maxUnits,
  ETH_TOKEN,
  UNITS,
  toBN,
} = require("./contract-util.js");
const chai = require("chai");
const { expect } = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);

const { deployDao } = require("./deployment-util.js");
const {
  contracts: allContractConfigs,
} = require("../configs/networks/test.config");
const { ContractType } = require("../configs/contracts.config");
import hre from "hardhat";

const expectEvent = async (txPromise, event, ...args) => {
  const { logs } = await txPromise;
  const log = logs[0];
  expect(log.event).to.be.equal(event);
  args.forEach((arg, i) => expect(log.args[i].toString()).to.be.equal(arg));
};

const txSigner = (signer, contract) => {
  return new hre.ethers.Contract(contract.address, contract.abi, signer);
};

const getCurrentBlockNumber = async () => {
  return await hre.ethers.provider.getBlockNumber();
};

const getBalance = async (account) => {
  const balance = await web3.eth.getBalance(account);
  return toBN(balance);
};

const attach = async (contractInterface, address) => {
  const factory = await hre.ethers.getContractFactory(
    contractInterface.contractName
  );
  const truffleContract = factory.attach(address);
  // Add the `connect` function to be able to switch the tx signer
  return { ...truffleContract, abi: contractInterface.abi };
};

const getSigners = async () => {
  return await hre.ethers.getSigners();
};

const getAccounts = async () => {
  const accounts = await getSigners();
  return accounts.map((s) => s.address);
};

export const getContractByName = (c) => {
  return hre.artifacts.require(c);
};

const getContract = (name) => {
  return hre.artifacts.require(name);
};

const deployFunction = async (contractInterface, args, from) => {
  if (!contractInterface) throw Error("undefined contractInterface");

  const contractConfig = allContractConfigs.find(
    (c) => c.name === contractInterface.contractName
  );

  const accounts = await getAccounts();
  const f = from ? from : accounts[0];

  let instance;
  if (contractConfig.type === ContractType.Factory && args) {
    const identityInterface = args[0];
    const identityInstance = await identityInterface.new({ from: f });
    const constructorArgs = [identityInstance.address].concat(args.slice(1));
    instance = await contractInterface.new(...constructorArgs, { from: f });
  } else {
    if (args) {
      instance = await contractInterface.new(...args, { from: f });
    } else {
      instance = await contractInterface.new({ from: f });
    }
  }

  return { ...instance, configs: contractConfig };
};

const getHardhatContracts = (contracts) => {
  return contracts
    .filter((c) => c.enabled)
    .reduce((previousValue, contract) => {
      previousValue[contract.name] = getContract(contract.name);
      previousValue[contract.name].contractName = contract.name;
      return previousValue;
    }, {});
};

const getDefaultOptions = (options) => {
  return {
    unitPrice: unitPrice,
    nbUnits: numberOfUnits,
    votingPeriod: 10,
    gracePeriod: 10,
    tokenAddr: ETH_TOKEN,
    maxChunks: maximumChunks,
    maxAmount,
    maxUnits,
    chainId: 1,
    maxExternalTokens: 100,
    couponCreatorAddress: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    kycMaxMembers: 1000,
    kycSignerAddress: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    kycFundTargetAddress: "0x823A19521A76f80EC49670BE32950900E8Cd0ED3",
    deployTestTokens: true,
    erc20TokenName: "Test Token",
    erc20TokenSymbol: "TTK",
    erc20TokenDecimals: Number(0),
    erc20TokenAddress: UNITS,
    supplyTestToken1: 1000000,
    supplyTestToken2: 1000000,
    supplyPixelNFT: 100,
    supplyOLToken: toBN("1000000000000000000000000"),
    erc1155TestTokenUri: "1155 test token",
    maintainerTokenAddress: UNITS,
    finalize: options.finalize === undefined || !!options.finalize,
    gasPriceLimit: "2000000000000",
    spendLimitPeriod: "259200",
    spendLimitEth: "2000000000000000000000",
    feePercent: "110",
    gasFixed: "50000",
    gelato: "0x1000000000000000000000000000000000000000",
    ...options, // to make sure the options from the tests override the default ones
  };
};

const advanceTime = async (time) => {
  await new Promise((resolve, reject) => {
    hre.network.provider.sendAsync(
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
    hre.network.provider.sendAsync(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        params: [],
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
    hre.network.provider.sendAsync(
      {
        jsonrpc: "2.0",
        method: "evm_snapshot",
        params: [],
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
    hre.network.provider.sendAsync(
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
      const str = "" + idCounter;

      return `0x${str.padStart(64, "0")}`;
    },
  };
};

module.exports = (() => {
  const hardhatContracts = getHardhatContracts(allContractConfigs);
  const deployDefaultDao = async (options) => {
    const { WETH } = hardhatContracts;
    const weth = await WETH.new();
    const finalize = options.finalize === undefined ? true : options.finalize;

    const result = await deployDao({
      ...getDefaultOptions(options),
      ...hardhatContracts,
      deployFunction,
      attachFunction: attach,
      contractConfigs: allContractConfigs,
      weth: weth.address,
      finalize: false,
    });

    if (finalize) await result.dao.finalizeDao({ from: options.owner });

    return { wethContract: weth, ...result };
  };

  const deployDefaultNFTDao = async ({ owner }) => {
    const { WETH } = hardhatContracts;
    const weth = await WETH.new();

    const {
      dao,
      adapters,
      extensions,
      factories,
      testContracts,
      utilContracts,
    } = await deployDao({
      ...getDefaultOptions({ owner }),
      ...hardhatContracts,
      deployFunction,
      attachFunction: attach,
      finalize: false,
      contractConfigs: allContractConfigs,
      weth: weth.address,
      wethContract: weth,
    });

    await dao.finalizeDao({ from: owner });

    return {
      dao: dao,
      adapters: adapters,
      extensions: extensions,
      factories: factories,
      testContracts: testContracts,
      utilContracts: utilContracts,
      wethContract: weth,
    };
  };

  const deployDaoWithOffchainVoting = async (options) => {
    const owner = options.owner;
    const newMember = options.newMember;

    const { WETH } = hardhatContracts;
    const weth = await WETH.new();
    const { dao, adapters, extensions, testContracts, votingHelpers } =
      await deployDao({
        ...getDefaultOptions(options),
        ...hardhatContracts,
        deployFunction,
        attachFunction: attach,
        finalize: false,
        offchainVoting: true,
        offchainAdmin: owner,
        contractConfigs: allContractConfigs,
        weth: weth.address,
      });

    if (newMember) {
      await dao.potentialNewMember(newMember, {
        from: owner,
      });

      await extensions.bankExt.addToBalance(dao.address, newMember, UNITS, 1, {
        from: owner,
      });
    }

    await dao.finalizeDao({ from: owner });

    return {
      dao: dao,
      adapters: adapters,
      extensions: extensions,
      testContracts: testContracts,
      votingHelpers: votingHelpers,
      wethContract: weth,
    };
  };

  const generateMembers = (amount) => {
    let newAccounts = [];
    for (let i = 0; i < amount; i++) {
      const account = hre.web3.eth.accounts.create();
      newAccounts.push(account);
    }
    return newAccounts;
  };

  const encodeProposalData = (dao, proposalId) =>
    hre.web3.eth.abi.encodeParameter(
      {
        ProcessProposal: {
          dao: "address",
          proposalId: "bytes32",
        },
      },
      {
        dao: dao.address,
        proposalId,
      }
    );

  return {
    web3: hre.web3,
    provider: hre.network.provider,
    expect,
    txSigner,
    expectEvent,
    getAccounts,
    getSigners,
    getCurrentBlockNumber,
    getBalance,
    generateMembers,
    deployDefaultDao,
    deployDefaultNFTDao,
    deployDaoWithOffchainVoting,
    encodeProposalData,
    takeChainSnapshot,
    revertChainSnapshot,
    proposalIdGenerator,
    advanceTime,
    deployFunction,
    attachFunction: attach,
    getContractFromOpenZeppelin: getContract,
    etContractFromOpenZeppelinByName: getContractByName,
    ...hardhatContracts,
  };
})();
