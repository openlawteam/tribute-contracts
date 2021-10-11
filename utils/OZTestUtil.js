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
} = require("./ContractUtil");

const {
  deployDao,
  entryDao,
  entryBank,
  entryERC1271,
  entryExecutor,
  entry,
} = require("./DeploymentUtil");

const { expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { ContractType } = require("../deployment/contracts.config");

const deployFunction = async (contractInterface, args, from) => {
  if (!contractInterface) throw Error("undefined contract interface");
  const { contracts } = require("../deployment/test.config");

  const contractConfig = contracts.find(
    (c) => c.name === contractInterface.contractName
  );

  const f = from ? from : accounts[0];
  if (contractConfig.type === ContractType.Factory) {
    const identity = await args[0].new({ from: f });
    return await contractInterface.new(
      ...[identity.address].concat(args.slice(1)),
      { from: f }
    );
  } else {
    if (args) {
      return await contractInterface.new(...args, { from: f });
    } else {
      return await contractInterface.new({ from: f });
    }
  }
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
  let o = {
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
    ...options,
  };

  o.finalize = options.finalize === undefined || !!options.finalize;
  return o;
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
  const { contracts } = require("../deployment/test.config");
  const ozContracts = getOpenZeppelinContracts(contracts);

  const deployDefaultDao = async (options) => {
    return await deployDao({
      ...getDefaultOptions(options),
      ...ozContracts,
      deployFunction,
    });
  };

  const deployDefaultNFTDao = async ({ owner }) => {
    const { dao, adapters, extensions, testContracts } = await deployDao({
      ...getDefaultOptions({ owner }),
      deployTestTokens: true,
      finalize: false,
      ...ozContracts,
      deployFunction,
    });

    await dao.finalizeDao({ from: owner });

    return {
      dao: dao,
      adapters: adapters,
      extensions: extensions,
      testContracts: testContracts,
    };
  };

  const deployDaoWithOffchainVoting = async ({ owner, newMember }) => {
    const {
      dao,
      adapters,
      extensions,
      testContracts,
      votingHelpers,
    } = await deployDao({
      ...getDefaultOptions({ owner }),
      offchainVoting: true,
      deployTestTokens: true,
      offchainAdmin: owner,
      finalize: false,
      ...ozContracts,
      deployFunction,
    });

    await dao.potentialNewMember(newMember, {
      from: owner,
    });

    await extensions.bank.addToBalance(newMember, UNITS, 1, {
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

  const deployDaoWithBatchVoting = async ({ owner, newMember }) => {
    const { dao, adapters, extensions, votingHelpers } = await deployDao({
      ...getDefaultOptions({ owner }),
      ...ozContracts,
      deployTestTokens: false,
      batchVoting: true,
      finalize: false,
      deployFunction,
    });

    await dao.potentialNewMember(newMember, {
      from: owner,
    });

    await extensions.bank.addToBalance(newMember, UNITS, 1, {
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
    deployDaoWithBatchVoting,
    deployDaoWithOffchainVoting,
    entry,
    encodeProposalData,
    entryERC1271,
    entryBank,
    entryDao,
    entryExecutor,
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
