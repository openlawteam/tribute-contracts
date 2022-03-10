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
  toBN,
  toWei,
  fromAscii,
  soliditySha3,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  getAccounts,
  web3,
} = require("../../utils/hardhat-test-util");

const { checkSignature } = require("../../utils/test-util");

const proposalCounter = proposalIdGenerator().generator;

const arbitrarySignature =
  "0xc531a1d9046945d3732c73d049da2810470c3b0663788dca9e9f329a35c8a0d56add77ed5ea610b36140641860d13849abab295ca46c350f50731843c6517eee1c";
const arbitrarySignatureHash = soliditySha3({
  t: "bytes",
  v: arbitrarySignature,
});
const arbitraryMsgHash =
  "0xec4870a1ebdcfbc1cc84b0f5a30aac48ed8f17973e0189abdb939502e1948238";
const magicValue = "0x1626ba7e";

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - ERC1271", () => {
  let accounts, daoOwner;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];

    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
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

  it("should be possible to create a signature proposal and successfully query the erc1271 interface if it passes", async () => {
    const erc1271 = this.extensions.erc1271Ext;
    const voting = this.adapters.voting;
    const signatures = this.adapters.signatures;

    let proposalId = getProposalCounter();

    //submit a sig
    await signatures.submitProposal(
      this.dao.address,
      proposalId,
      arbitraryMsgHash,
      arbitrarySignatureHash,
      magicValue,
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(this.dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    //should not be able to process before the voting period has ended
    await expect(
      signatures.processProposal(this.dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("proposal needs to pass");

    await advanceTime(10000);
    await signatures.processProposal(this.dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    // query erc1271 interface
    await checkSignature(
      erc1271,
      arbitraryMsgHash,
      arbitrarySignature,
      magicValue
    );
  });

  it("should not be possible to get a valid signature if the proposal fails", async () => {
    const voting = this.adapters.voting;
    const signatures = this.adapters.signatures;
    const erc1271 = this.extensions.erc1271Ext;

    let proposalId = getProposalCounter();

    //submit a sig
    await signatures.submitProposal(
      this.dao.address,
      proposalId,
      arbitraryMsgHash,
      arbitrarySignatureHash,
      magicValue,
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    //Member votes on the signature proposal
    await voting.submitVote(this.dao.address, proposalId, 2, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await expect(
      signatures.processProposal(this.dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("proposal needs to pass");

    await expect(
      erc1271.isValidSignature(arbitraryMsgHash, arbitrarySignature)
    ).to.be.revertedWith("erc1271::invalid signature");
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.signatures;
    await expect(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
      })
    ).to.be.revertedWith("revert");
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const adapter = this.adapters.signatures;
    await expect(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei("1"),
        data: fromAscii("should go to fallback func"),
      })
    ).to.be.revertedWith("revert");
  });
});
