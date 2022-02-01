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

const { ZERO_ADDRESS } = require("./contract-util");
const { checkpoint, restore } = require("./checkpoint-util");
const { info } = require("./log-util");
const { ContractType } = require("../configs/contracts.config");
const hre = require("hardhat");

const attach = async (contractInterface, address) => {
  const factory = await hre.ethers.getContractFactory(
    contractInterface.contractName
  );
  return factory.attach(address);
};

const deployFunction = async ({ allConfigs, network, daoArtifacts }) => {
  const deploy = async (contractInterface, contractConfig, args) => {
    const restored = await restore(
      contractInterface,
      contractConfig,
      attach,
      network
    );
    if (restored)
      return {
        ...restored,
        configs: contractConfig,
      };

    const contractFactory = await hre.ethers.getContractFactory(
      contractConfig.name
    );

    let res;
    if (args && args.length > 0) {
      res = await contractFactory.deploy(...args.flat());
    } else {
      res = await contractFactory.deploy();
    }

    const tx = await res.deployTransaction.wait();
    const contract = await res.deployed();
    info(`
    Contract deployed '${contractConfig.name}'
    -------------------------------------------------
     transaction hash: ${tx.transactionHash}
     contract address: ${tx.contractAddress}
     block number:     ${tx.blockNumber}`);

    return checkpoint(
      {
        ...contract,
        configs: contractConfig,
        address: tx.contractAddress,
      },
      network
    );
  };

  const loadOrDeploy = async (contractInterface, ...args) => {
    if (!contractInterface) throw Error("Invalid contract interface");

    const contractConfig = allConfigs.find(
      (c) => c.name === contractInterface.contractName
    );
    if (!contractConfig)
      throw Error(
        `${contractInterface.contractName} contract not found in configs/contracts.config`
      );

    if (
      // Always deploy core, extension and test contracts
      contractConfig.type === ContractType.Core ||
      contractConfig.type === ContractType.Extension ||
      contractConfig.type === ContractType.Test
    ) {
      return await deploy(contractInterface, contractConfig, args);
    }

    const artifactsOwner = process.env.DAO_ARTIFACTS_OWNER_ADDR
      ? process.env.DAO_ARTIFACTS_OWNER_ADDR
      : process.env.DAO_OWNER_ADDR;

    // Attempt to load the contract from the DaoArtifacts to save deploy gas
    const address = null; //FIXME
    // const address = await daoArtifacts.getArtifactAddress(
    //   sha3(contractConfig.name),
    //   artifactsOwner,
    //   toBytes32(contractConfig.version),
    //   contractConfig.type
    // );

    if (address && address !== ZERO_ADDRESS) {
      info(`
    Contract attached '${contractConfig.name}'
    -------------------------------------------------
     contract address: ${address}
     block number:     ${tx.blockNumber}`);
      const instance = await attach(contractInterface, address);
      return { ...instance, configs: contractConfig };
    }
    let deployedContract;
    // When the contract is not found in the DaoArtifacts, deploy a new one
    if (contractConfig.type === ContractType.Factory && args) {
      // 1. first create a new identity contract
      const identityInterface = args.flat()[0];
      const identityConfig = allConfigs.find(
        (c) => c.name === identityInterface.contractName
      );
      const identityInstance = await deploy(identityInterface, identityConfig);

      // 2 deploy the factory with the new identity address, so it can be used for cloning ops later on
      deployedContract = await deploy(contractInterface, contractConfig, [
        identityInstance.address,
      ]);
    } else {
      deployedContract = await deploy(contractInterface, contractConfig, args);
    }

    if (
      // Add the new contract to DaoArtifacts, should not store Core, Extension & Test contracts
      contractConfig.type === ContractType.Factory ||
      contractConfig.type === ContractType.Adapter ||
      contractConfig.type === ContractType.Util
    ) {
      // FIXME
      // await daoArtifacts.addArtifact(
      //   sha3(contractConfig.name),
      //   toHex(contractConfig.version),
      //   deployedContract.address,
      //   contractConfig.type
      // );
    }

    return deployedContract;
  };

  return loadOrDeploy;
};

const getContractFromHardhat = (c) => {
  const artifact = hre.artifacts.readArtifactSync(c);
  return artifact;
};

const getConfigsWithFactories = (configs) => {
  return configs
    .filter((c) => c.enabled)
    .map((c) => {
      c.interface = getContractFromHardhat(c.name);
      return c;
    });
};

module.exports = (configs, network) => {
  const allConfigs = getConfigsWithFactories(configs);
  const interfaces = allConfigs.reduce((previousValue, contract) => {
    previousValue[contract.name] = contract.interface;
    return previousValue;
  }, {});

  return {
    ...interfaces,
    attachFunction: attach,
    deployFunctionFactory: (deployer, daoArtifacts) => {
      if (!deployer /*|| !daoArtifacts*/)
        throw Error("Missing deployer or DaoArtifacts contract");
      return deployFunction({ deployer, daoArtifacts, allConfigs, network });
    },
  };
};
