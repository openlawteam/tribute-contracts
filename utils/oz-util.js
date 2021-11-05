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
  unitPrice,
  numberOfUnits,
  maximumChunks,
  maxAmount,
  ETH_TOKEN,
  UNITS,
  toBN,
} = require("./contract-util.js");

const { expect } = require("chai");
const { expectRevert } = require("@openzeppelin/test-helpers");
const { deployDao } = require("./deployment-util.js");
const {
  contracts: allContractConfigs,
} = require("../migrations/configs/test.config");
const { ContractType } = require("../migrations/configs/contracts.config");

const deployFunction = async (contractInterface, args, from) => {
  if (!contractInterface) throw Error("undefined contract interface");

  const contractConfig = allContractConfigs.find(
    (c) => c.name === contractInterface.contractName
  );

  const f = from ? from : accounts[0];
  let instance;
  if (contractConfig.type === ContractType.Factory) {
    const identity = await args[0].new({ from: f });
    instance = await contractInterface.new(
      ...[identity.address].concat(args.slice(1)),
      { from: f }
    );
  } else {
    if (args) {
      instance = await contractInterface.new(...args, { from: f });
    } else {
      instance = await contractInterface.new({ from: f });
    }
  }
  return { ...instance, configs: contractConfig };
};

const getContractFromOpenZeppelin = (c) => {
  return contract.fromArtifact(c.substring(c.lastIndexOf("/") + 1));
};

const getOpenZeppelinContracts = (contracts) => {
  return contracts
    .filter((c) => c.enabled)
    .reduce((previousValue, contract) => {
      previousValue[contract.name] = getContractFromOpenZeppelin(contract.path);
      previousValue[contract.name].contractName = contract.name;
      return previousValue;
    }, {});
};

const getDefaultOptions = (options) => {
  return {
    unitPrice: unitPrice,
    nbUnits: numberOfUnits,
    votingPeriod: 10,
    gracePeriod: 1,
    tokenAddr: ETH_TOKEN,
    maxChunks: maximumChunks,
    maxAmount,
    chainId: 1,
    maxExternalTokens: 100,
    couponCreatorAddress: "0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8",
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
    finalize: options.finalize === undefined || !!options.finalize,
    ...options, // to make sure the options from the tests override the default ones
  };
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
      const str = "" + idCounter;

      return `0x${str.padStart(64, "0")}`;
    },
  };
};

module.exports = (() => {
  const ozContracts = getOpenZeppelinContracts(allContractConfigs);

  const deployDefaultDao = async (options) => {
    return await deployDao({
      ...getDefaultOptions(options),
      ...ozContracts,
      deployFunction,
      contractConfigs: allContractConfigs,
    });
  };

  const deployDefaultNFTDao = async ({ owner }) => {
    const { dao, adapters, extensions, testContracts, utilContracts } =
      await deployDao({
        ...getDefaultOptions({ owner }),
        ...ozContracts,
        deployFunction,
        finalize: false,
        contractConfigs: allContractConfigs,
      });

    await dao.finalizeDao({ from: owner });

    return {
      dao: dao,
      adapters: adapters,
      extensions: extensions,
      testContracts: testContracts,
      utilContracts: utilContracts,
    };
  };

  const deployDaoWithOffchainVoting = async ({ owner, newMember }) => {
    const { dao, adapters, extensions, testContracts, votingHelpers } =
      await deployDao({
        ...getDefaultOptions({ owner }),
        ...ozContracts,
        deployFunction,
        finalize: false,
        offchainVoting: true,
        offchainAdmin: owner,
        contractConfigs: allContractConfigs,
      });

    await dao.potentialNewMember(newMember, {
      from: owner,
    });

    await extensions.bankExt.addToBalance(newMember, UNITS, 1, {
      from: owner,
    });

    await dao.finalizeDao({ from: owner });

    return {
      dao: dao,
      adapters: adapters,
      extensions: extensions,
      testContracts: testContracts,
      votingHelpers: votingHelpers,
    };
  };

  const encodeProposalData = (dao, proposalId) =>
    web3.eth.abi.encodeParameter(
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
    deployDefaultDao,
    deployDefaultNFTDao,
    deployDaoWithOffchainVoting,
    encodeProposalData,
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
    getContractFromOpenZeppelin,
    ...ozContracts,
  };
})();
