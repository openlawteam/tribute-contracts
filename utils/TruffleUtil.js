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

const { sha3 } = require("./ContractUtil");

const { ContractType } = require("../deployment/contracts.config");

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

const deployFunctionFactory = (deployer, daoArtifacts, allContracts) => {
  const deploy = async (contractInterface, args) => {
    console.log("Deploy new contract");
    if (!contractInterface) return null;
    if (args) {
      await deployer.deploy(contractInterface, ...args);
    } else {
      await deployer.deploy(contractInterface);
    }
    return await contractInterface.deployed();
  };

  const loadOrDeploy = async (contractInterface, args) => {
    const contractConfig = allContracts.find(
      (c) => c.interface === contractInterface
    );
    console.log(`Contract found: ${contractConfig.name}`);
    if (contractConfig.type === ContractType.Test) {
      return deploy(contractConfig, contractInterface, args);
    }

    const address = await daoArtifacts.getArtifactAddress(
      sha3(contractConfig.name),
      process.env.ARTIFACT_OWNER_ADDR,
      contractConfig.version,
      contractConfig.type
    );
    let contract;
    if (address) {
      contract = await contractInterface.at(address);
    }
    if (contract) return contract;
    return deploy(contractConfig, contractInterface, args);
  };

  return loadOrDeploy;
};

module.exports = (contracts) => {
  const allContracts = getTruffleContracts(contracts);
  const truffleInterfaces = allContracts.reduce((previousValue, contract) => {
    previousValue[contract.name] = getContractFromTruffle(contract.path);
    return previousValue;
  }, {});

  return {
    ...truffleInterfaces,
    deployFunctionFactory: (deployer, daoArtifacts) => {
      deployFunctionFactory(deployer, daoArtifacts, allContracts);
    },
  };
};
