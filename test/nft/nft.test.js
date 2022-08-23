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
const { expect } = require("chai");
const {
  sha3,
  toBN,
  toWei,
  fromAscii,
  GUILD,
  ZERO_ADDRESS,
  DAI_TOKEN,
  ETH_TOKEN,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  getAccounts,
  web3,
  Manager,
  FinancingContract,
  BankExtension,
  ERC1271Extension,
  NFTExtension,
} = require("../../utils/hardhat-test-util");

const {
  bankExtensionAclFlagsMap,
  daoAccessFlagsMap,
  entryDao,
  entryBank,
} = require("../../utils/access-control-util");

const { extensionsIdsMap } = require("../../utils/dao-ids-util");

const { SigUtilSigner } = require("../../utils/offchain-voting-util");

const signer = {
  address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
  privKey: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
};

const { ethers, upgrades } = require("hardhat");

describe("nft test", () => {
  let accounts, daoOwner;
  const chainId = 1337;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];

    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
      managerSignerAddress: signer.address,
    });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(this.snapshotId);
    this.snapshotId = await takeChainSnapshot();
  });

  it('test', async () => {
    const TributeERC721 = await hre.ethers.getContractFactory("TributeERC721");
    const proxy = await upgrades.deployProxy(TributeERC721, ['first test', 'ft']);
    await proxy.deployed();
    const implementation = await upgrades.erc1967.getImplementationAddress(proxy.address);
    console.log("implementation: ", implementation);

    // const TributeERC721V2 = await hre.ethers.getContractFactory("TributeERC721V2");
    // const upgraded = await upgrades.upgradeProxy(nft.address, TributeERC721V2);
    
    // await upgraded.setTestVar();
    // console.log(await upgraded.testVar())
  });

});
