// Whole-script strict mode syntax
"use strict";

/**
MIT License

Copyright (c) 2021 Openlaw

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

const { sha3, toHex, ZERO_ADDRESS } = require("./contract-util");
const { checkpoint, restore } = require("../utils/checkpoint-utils");
const { ContractType } = require("../migrations/configs/contracts.config");

const getContractFromTruffle = (c) => {
  return artifacts.require(c);
};

const getTruffleContracts = (contracts) => {
  return contracts
    .filter((c) => c.enabled)
    .map((c) => {
      c.interface = getContractFromTruffle(c.path);
      return c;
    });
};

const deployFunction = (deployer, daoArtifacts, allContracts) => {
  const deploy = async (contractInterface, args, configs) => {
    const restored = await restore(contractInterface, configs);
    if (restored)
      return {
        ...restored,
        configs,
      };

    if (args) {
      await deployer.deploy(contractInterface, ...args);
    } else {
      await deployer.deploy(contractInterface);
    }
    const instance = await contractInterface.deployed();
    const contract = {
      ...instance,
      configs,
    };
    return checkpoint(contract);
  };

  const loadOrDeploy = async (contractInterface, args) => {
    if (!contractInterface) return null; //throw Error("Invalid contract interface");

    const contractConfigs = allContracts.find(
      (c) => c.name === contractInterface.contractName
    );
    if (!contractConfigs)
      throw Error(
        `${contractInterface.contractName} contract not found in migrations/configs/contracts.config`
      );

    if (
      // Always deploy core, extension and test contracts
      contractConfigs.type === ContractType.Core ||
      contractConfigs.type === ContractType.Extension ||
      contractConfigs.type === ContractType.Test
    ) {
      return await deploy(contractInterface, args, contractConfigs);
    }

    const artifactsOwner = process.env.DAO_ARTIFACTS_OWNER_ADDR
      ? process.env.DAO_ARTIFACTS_OWNER_ADDR
      : process.env.DAO_OWNER_ADDR;

    // Attempt to load the contract from the DaoArtifacts to save deploy gas
    const address = await daoArtifacts.getArtifactAddress(
      sha3(contractConfigs.name),
      artifactsOwner,
      toHex(contractConfigs.version),
      contractConfigs.type
    );
    if (address && address !== ZERO_ADDRESS) {
      console.log(
        `Attached to existing contract ${contractConfigs.name}: ${address}`
      );
      const instance = await contractInterface.at(address);
      return { ...instance, configs: contractConfigs };
    }
    let deployedContract;
    // When the contract is not found in the DaoArtifacts, deploy a new one
    if (contractConfigs.type === ContractType.Factory) {
      const identity = await deploy(args[0], null, contractConfigs);
      deployedContract = await deploy(
        contractInterface,
        [identity.address].concat(args.slice(1)),
        contractConfigs
      );
    } else {
      deployedContract = await deploy(contractInterface, args, contractConfigs);
    }

    if (
      // Add the new contract to DaoArtifacts, should not store Core, Extension & Test contracts
      contractConfigs.type === ContractType.Factory ||
      contractConfigs.type === ContractType.Adapter ||
      contractConfigs.type === ContractType.Util
    ) {
      await daoArtifacts.addArtifact(
        sha3(contractConfigs.name),
        toHex(contractConfigs.version),
        deployedContract.address,
        contractConfigs.type
      );
      console.log(
        `${contractConfigs.name}:${contractConfigs.type}:${contractConfigs.version}:${deployedContract.address} added to DaoArtifacts`
      );
    }

    return deployedContract;
  };

  return loadOrDeploy;
};

module.exports = (contracts) => {
  const allContracts = getTruffleContracts(contracts);
  const truffleInterfaces = allContracts.reduce((previousValue, contract) => {
    previousValue[contract.name] = contract.interface;
    return previousValue;
  }, {});

  return {
    ...truffleInterfaces,
    deployFunctionFactory: (deployer, daoArtifacts) => {
      if (!deployer || !daoArtifacts)
        throw Error("Missing deployer or DaoArtifacts contract");
      return deployFunction(deployer, daoArtifacts, allContracts);
    },
  };
};
