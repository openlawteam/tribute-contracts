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
  fromAscii,
  toWei,
  UNITS,
  GUILD,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  getAccounts,
  OLToken,
  deployDefaultNFTDao,
  web3,
} = require("../../utils/hardhat-test-util");

const { checkBalance, isMember } = require("../../utils/test-util");

const proposalCounter = proposalIdGenerator().generator;

const getProposalCounter = () => {
  return proposalCounter().next().value;
};

describe("Adapter - Tribute", () => {
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

  it("should be possible to provide ERC20 tokens in exchange for DAO units", async () => {
    const applicant = accounts[2];
    const nonMemberAccount = accounts[3];

    const dao = this.dao;
    const bank = this.extensions.bankExt;
    const tribute = this.adapters.tribute;
    const voting = this.adapters.voting;

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    let oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to daoOwner
    const initialTokenBalance = toBN("1000000");
    let daoOwnerTokenBalance = await oltContract.balanceOf.call(daoOwner);
    expect(daoOwnerTokenBalance.toString()).equal(
      initialTokenBalance.toString()
    );

    // Number of OLTs to be sent to the DAO in exchange for number of requested units
    const tributeAmount = 10;
    const requestAmount = 1000;
    const proposalId = getProposalCounter();
    await tribute.submitProposal(
      dao.address,
      proposalId,
      applicant,
      UNITS,
      requestAmount,
      oltContract.address,
      tributeAmount,
      daoOwner,
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    await expect(
      tribute.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    await oltContract.approve(tribute.address, tributeAmount, {
      from: daoOwner,
    });

    await tribute.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // test balances after proposal is processed
    const daoOwnerUnits = await bank.balanceOf(daoOwner, UNITS);
    expect(daoOwnerUnits.toString()).equal("1");
    const applicantUnits = await bank.balanceOf(applicant, UNITS);
    expect(applicantUnits.toString()).equal(requestAmount.toString());
    const nonMemberAccountUnits = await bank.balanceOf(nonMemberAccount, UNITS);
    expect(nonMemberAccountUnits.toString()).equal("0");
    await checkBalance(
      bank,
      GUILD,
      oltContract.address,
      tributeAmount.toString()
    );

    // test active member status
    const applicantIsActiveMember = await isMember(bank, applicant);
    expect(applicantIsActiveMember).equal(true);
    const nonMemberAccountIsActiveMember = await isMember(
      bank,
      nonMemberAccount
    );
    expect(nonMemberAccountIsActiveMember).equal(false);
  });

  it("should handle a tribute proposal with a failed vote", async () => {
    const applicant = accounts[2];

    const dao = this.dao;
    const bank = this.extensions.bankExt;
    const tribute = this.adapters.tribute;
    const voting = this.adapters.voting;

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    let oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to daoOwner
    const initialTokenBalance = toBN("1000000");
    let daoOwnerTokenBalance = await oltContract.balanceOf.call(daoOwner);
    // "daoOwner must be initialized with 100 OLT Tokens"
    expect(daoOwnerTokenBalance.toString()).equal(
      initialTokenBalance.toString()
    );

    // Number of OLTs to be sent to the DAO in exchange for number of requested units
    const tributeAmount = 10;
    const requestAmount = 100000000;

    const proposalId = getProposalCounter();
    await tribute.submitProposal(
      dao.address,
      proposalId,
      applicant,
      UNITS,
      requestAmount,
      oltContract.address,
      tributeAmount,
      daoOwner,
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 2, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    const vote = await voting.voteResult(dao.address, proposalId);
    expect(vote.toString()).equal("3"); // vote should be "not passed"

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    await oltContract.approve(tribute.address, tributeAmount, {
      from: daoOwner,
    });

    await tribute.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const isProcessed = await dao.getProposalFlag(proposalId, toBN("2")); // 2 is processed flag index
    expect(isProcessed).equal(true);

    // test balances after proposal is processed
    const daoOwnerUnits = await bank.balanceOf(daoOwner, UNITS);
    expect(daoOwnerUnits.toString()).equal("1");
    const applicantUnits = await bank.balanceOf(applicant, UNITS);
    expect(applicantUnits.toString()).equal("0");
    const guildBalance = await bank.balanceOf(GUILD, oltContract.address);
    expect(guildBalance.toString()).equal("0");
    const applicantBalance = await bank.balanceOf(
      applicant,
      oltContract.address
    );
    expect(applicantBalance.toString()).equal("0");
    const tributeAdapterBalance = await oltContract.balanceOf.call(
      tribute.address
    );
    expect(tributeAdapterBalance.toString()).equal("0");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, applicant);
    expect(applicantIsActiveMember).equal(false);

    // check if ERC20 tokens are still owned by the original owner
    daoOwnerTokenBalance = await oltContract.balanceOf.call(daoOwner);
    expect(daoOwnerTokenBalance.toString()).equal(
      initialTokenBalance.toString()
    );
  });

  it("should not be possible to process proposal that does not exist", async () => {
    const dao = this.dao;
    const tribute = this.adapters.tribute;

    await expect(
      tribute.processProposal(dao.address, "0x1", {
        from: daoOwner,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith("proposal does not exist");
  });

  it("should not be possible to join if the tribute amount exceeds the bank external token limit", async () => {
    const applicant = accounts[2];

    // Issue OpenLaw ERC20 Basic Token for tests
    // Token supply higher than the limit for external tokens
    // defined in Bank._createNewAmountCheckpoint function (2**160-1).
    const supply = toBN("2").pow(toBN("180"));
    const oltContract = await OLToken.new(supply, { from: daoOwner });
    const nbOfERC20Units = 100000000;
    const erc20UnitPrice = toBN("10");

    const { dao, adapters } = await deployDefaultNFTDao({
      owner: daoOwner,
      unitPrice: erc20UnitPrice,
      nbUnits: nbOfERC20Units,
      tokenAddr: oltContract.address,
    });

    const tribute = adapters.tribute;
    const voting = adapters.voting;

    // Transfer OLTs to applicant
    // Use an amount that will cause an overflow 2**161 > 2**160-1 for external tokens
    const initialTokenBalance = toBN("2").pow(toBN("161")).toString();
    await oltContract.transfer(applicant, initialTokenBalance, {
      from: daoOwner,
    });
    let applicantTokenBalance = await oltContract.balanceOf.call(applicant);
    // "applicant account must be initialized with 2**161 OLT Tokens";
    expect(applicantTokenBalance.toString()).equal(initialTokenBalance);

    // Number of OLTs to be sent to the DAO in exchange for number of requested units
    const tributeAmount = initialTokenBalance;
    const requestAmount = 100000000;

    const proposalId = getProposalCounter();
    await tribute.submitProposal(
      dao.address,
      proposalId,
      applicant,
      UNITS,
      requestAmount,
      oltContract.address,
      tributeAmount,
      applicant,
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    const vote = await voting.voteResult(dao.address, proposalId);
    expect(vote.toString()).equal("2");

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    await oltContract.approve(tribute.address, initialTokenBalance, {
      from: applicant,
      gasPrice: toBN("0"),
    });

    // Proposal is processed, but due to the overflow error the transaction is
    // reverted.
    await expect(
      tribute.processProposal(dao.address, proposalId, {
        from: applicant,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith(
      "token amount exceeds the maximum limit for external tokens"
    );
  });

  it("should not be possible to join if the requested amount exceeds the bank internal token limit", async () => {
    const applicant = accounts[2];

    const dao = this.dao;
    const tribute = this.adapters.tribute;
    const voting = this.adapters.voting;

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    let oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to daoOwner
    const initialTokenBalance = toBN("1000000");
    let daoOwnerTokenBalance = await oltContract.balanceOf.call(daoOwner);
    expect(daoOwnerTokenBalance.toString()).equal(
      initialTokenBalance.toString()
    );

    // Number of OLTs to be sent to the DAO in exchange for number of requested units
    const tributeAmount = 10;
    // Use an amount that will cause an overflow 2**89 > 2**88-1 for internal
    // tokens
    const requestAmount = toBN("2").pow(toBN("89")).toString();

    const proposalId = getProposalCounter();
    await tribute.submitProposal(
      dao.address,
      proposalId,
      applicant,
      UNITS,
      requestAmount,
      oltContract.address,
      tributeAmount,
      daoOwner,
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    await oltContract.approve(tribute.address, tributeAmount, {
      from: daoOwner,
    });

    // Proposal is processed, but due to the overflow error the transaction is
    // reverted.
    await expect(
      tribute.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      })
    ).to.be.revertedWith(
      "token amount exceeds the maximum limit for internal tokens"
    );
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.tribute;
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
    const adapter = this.adapters.tribute;
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
