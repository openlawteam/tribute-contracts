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
  toBN,
  unitPrice,
  UNITS,
  GUILD,
  ETH_TOKEN,
  sha3,
} = require("../../utils/ContractUtil.js");

const {
  deployDefaultNFTDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  accounts,
  expectRevert,
  expect,
} = require("../../utils/OZTestUtil.js");

const { onboardingNewMember, isMember } = require("../../utils/TestUtils.js");

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - TributeERC1155", () => {
 
  const daoOwner = accounts[0];

  before("deploy dao", async () => {
    const {
      dao,
      adapters,
      extensions,
      testContracts,
    } = await deployDefaultNFTDao({ owner: daoOwner });
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.testContracts = testContracts;
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });
  
  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  it("happy path- should be possible to submit, sponsor, and process erc1155 proposal", async () => {
    const nftOwner = accounts[1];
    const dao = this.dao;
    const erc1155TestToken = this.testContracts.erc1155TestToken;
    const tribute1155NFT = this.adapters.tribute1155NFT;
  });
});
