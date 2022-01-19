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
const { checkpoint, restore } = require("./checkpoint-utils");
const { ContractType } = require("../migrations/configs/contracts.config");
const hre = require("hardhat");

const attach = async (contractInterface, address) => {
  const factory = await hre.ethers.getContractFactory(
    contractInterface.contractName
  );
  return factory.attach(address);
};

const deployFunction = async (deployer, daoArtifacts, allConfigs) => {
  const deploy = async (contractFactory, args, contractConfig) => {
    let instance;
    if (args) {
      instance = await contractFactory.deploy(...args);
    } else {
      instance = await contractFactory.deploy();
    }

    const contract = await instance.deployed();
    // await contract.deployTransaction.wait();
    console.log(
      `Contract deployed: ${contractConfig.name}@${contract.address}`
    );
    //     Deploying 'ProxTokenContract'
    //    -----------------------------
    //    > transaction hash:    0xca3ecb072f46960b520b17c797c5fd83f38ae6637c720bbaa4471f5d46e5550d
    // - Blocks: 0            Seconds: 0
    //    > Blocks: 1            Seconds: 12
    //    > contract address:    0xfA9324b96db2f685FAB616eb4547Be00091B8D4e
    //    > block number:        9975523
    //    > block timestamp:     1641945671
    //    > account:             0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0
    //    > balance:             4.96689377772692208
    //    > gas used:            830997 (0xcae15)
    //    > gas price:           2.500000015 gwei
    //    > value sent:          0 ETH
    //    > total cost:          0.002077492512464955 ETH
    return {
      ...contract,
      configs: contractConfig,
    };
  };

  const loadOrDeploy = async (contractInterface, ...args) => {
    if (!contractInterface) return null; //throw Error("Invalid contract interface");

    const contractConfig = allConfigs.find(
      (c) => c.name === contractInterface.contractName
    );
    if (!contractConfig)
      throw Error(
        `${contractInterface.contractName} contract not found in migrations/configs/contracts.config`
      );

    const contractFactory = await hre.ethers.getContractFactory(
      contractInterface.contractName
    );

    if (
      // Always deploy core, extension and test contracts
      contractConfig.type === ContractType.Core ||
      contractConfig.type === ContractType.Extension ||
      contractConfig.type === ContractType.Test
    ) {
      return await deploy(contractFactory, args, contractConfig);
    }

    const artifactsOwner = process.env.DAO_ARTIFACTS_OWNER_ADDR
      ? process.env.DAO_ARTIFACTS_OWNER_ADDR
      : process.env.DAO_OWNER_ADDR;

    // Attempt to load the contract from the DaoArtifacts to save deploy gas
    const address = null;
    // await daoArtifacts.getArtifactAddress(
    //   sha3(contractConfig.name),
    //   artifactsOwner,
    //   toHex(contractConfig.version),
    //   contractConfig.type
    // );
    if (address && address !== ZERO_ADDRESS) {
      console.log(
        `Attached to existing contract ${contractConfig.name}: ${address}`
      );
      const instance = await contractInterface.at(address);
      return { ...instance, configs: contractConfig };
    }
    let deployedContract;
    // When the contract is not found in the DaoArtifacts, deploy a new one
    if (contractConfig.type === ContractType.Factory) {
      // first create a new identity contract
      const identityInterface = args[0];
      const identityConfig = allConfigs.find(
        (c) => c.name === identityInterface.contractName
      );
      const identityFactory = await hre.ethers.getContractFactory(
        identityInterface.contractName
      );
      const identityInstance = await deploy(
        identityFactory,
        null,
        identityConfig
      );

      // deploy the factory with the new identity address, so it can be used later for cloning
      deployedContract = await deploy(
        contractFactory,
        [identityInstance.address],
        contractConfig
      );
    } else {
      deployedContract = await deploy(contractFactory, args, contractConfig);
    }

    if (
      // Add the new contract to DaoArtifacts, should not store Core, Extension & Test contracts
      contractConfig.type === ContractType.Factory ||
      contractConfig.type === ContractType.Adapter ||
      contractConfig.type === ContractType.Util
    ) {
      // await daoArtifacts.addArtifact(
      //   sha3(contractConfig.name),
      //   toHex(contractConfig.version),
      //   deployedContract.address,
      //   contractConfig.type
      // );
      console.log(
        `${contractConfig.name}:${contractConfig.type}:${contractConfig.version}:${deployedContract.address} added to DaoArtifacts`
      );
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

module.exports = (configs) => {
  const allConfigs = getConfigsWithFactories(configs);
  const interfaces = allConfigs.reduce((previousValue, contract) => {
    previousValue[contract.name] = contract.interface;
    return previousValue;
  }, {});

  return {
    ...interfaces,
    attach,
    deployFunctionFactory: (deployer, daoArtifacts) => {
      // if (!deployer || !daoArtifacts)
      // throw Error("Missing deployer or DaoArtifacts contract");
      if (!deployer) throw Error("Missing deployer or DaoArtifacts contract");
      return deployFunction(deployer, daoArtifacts, allConfigs);
    },
  };
};
