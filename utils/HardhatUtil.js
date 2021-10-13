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

const { sha3, toHex, ZERO_ADDRESS, fromAscii, hexToBytes} = require("./ContractUtil");
const { ContractType } = require("../deployment/contracts.config");

const waitDeploy = async (factory, args) => {
    return new Promise((resolve, reject) => {
        let timer = setTimeout(async () => {
        resolve(await args ? factory.deploy(...args) : factory.deploy());
        clearTimeout(timer);
       }, 0);
    })
};

const getContractFromHardhat = async (c)  => {
    return await hre.ethers.getContractFactory(c);
};

const getHardhatContracts = (contracts) => {
    return contracts
      .filter((c) => c.enabled)
      .map((c) => {
        c.interface = getContractFromHardhat(c.name);
        return c;
      });
  };

const deployFunction = (deployer, daoArtifacts, allContracts) => {
    const deploy = async (contract, factory, args) => {
      const instance = await waitDeploy(await factory, args);
      const res = await instance.deployed();
      const tx = await res.deployTransaction.wait();
      console.log(`Contract deployed: ${contract} - ${tx.contractAddress}`);
      return res;
    };
  
    const loadOrDeploy = async (contract, factory, args) => {
        if (!factory) return null; //throw Error("Invalid contract interface");
    
        const contractConfig = allContracts.find(
          (c) => c.name === contract
        );
        if (!contractConfig)
          throw Error(
            `${contract} contract not found in deployment/contracts.config`
          );
    
        if (
          // Always deploy core, extension and test contracts
          contractConfig.type === ContractType.Core ||
          contractConfig.type === ContractType.Extension ||
          contractConfig.type === ContractType.Test
        ) {
          return deploy(contract, factory, args);
        }
    
        const artifactsOwner = process.env.DAO_ARTIFACTS_OWNER_ADDR
          ? process.env.DAO_ARTIFACTS_OWNER_ADDR
          : process.env.DAO_OWNER_ADDR;
    
        // Attempt to load the contract from the DaoArtifacts to save deploy gas
        const address = await daoArtifacts.getArtifactAddress(
          sha3(contractConfig.name),
          artifactsOwner,
          fromAscii(contractConfig.version).padEnd(66, '0'),
          contractConfig.type
        );
        if (address && address !== ZERO_ADDRESS) {
          console.log(
            `Attached to existing contract ${contractConfig.name}: ${address}`
          );
          return await (await factory).attach(address);
        }
    
        // When the contract is not found in the DaoArtifacts, deploy a new one
        const deployedContract = await deploy(contract, factory, args);
    
        if (
          // Add the new contract to DaoArtifacts, should not store Core, Extension & Test contracts
          contractConfig.type === ContractType.Factory ||
          contractConfig.type === ContractType.Adapter ||
          contractConfig.type === ContractType.Util
        ) {
          await daoArtifacts.addArtifact(
            sha3(contractConfig.name),
            fromAscii(contractConfig.version).padEnd(66, '0'),
            deployedContract.address,
            contractConfig.type
          );
          console.log(
            `${contractConfig.name}:${contractConfig.type}:${contractConfig.version}:${deployedContract.address} added to DaoArtifacts`
          );
        }
    
        return deployedContract;
    };
    
    return loadOrDeploy;
};


module.exports = (contracts) => {
    const allContracts = getHardhatContracts(contracts);
    const hardHatInterfaces = allContracts.reduce((previousValue, contract) => {
        previousValue[contract.name] = getContractFromHardhat(contract.name);
        return previousValue;
    }, {});

    return {
        ...hardHatInterfaces,
        deployFunctionFactory: (deployer, daoArtifacts) => {
        if (!deployer || !daoArtifacts)
            throw Error("Missing deployer or DaoArtifacts contract");
        return deployFunction(deployer, daoArtifacts, allContracts);
      },
    };
};