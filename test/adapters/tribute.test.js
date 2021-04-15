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
  advanceTime,
  deployDao,
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  accounts,
  GUILD,
  SHARES,
  OLToken,
  expectRevert,
} = require("../../utils/DaoFactory.js");
const { checkBalance, isMember } = require("../../utils/TestUtils.js");

describe("Adapter - Tribute", () => {
  const daoOwner = accounts[1];
  const proposalCounter = proposalIdGenerator().generator;

  const getProposalCounter = () => {
    return proposalCounter().next().value;
  };

  beforeAll(async () => {
    const { dao, adapters, extensions } = await deployDefaultDao(daoOwner);
    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  it("should be possible to provide ERC20 tokens in exchange for DAO shares", async () => {
    const applicant = accounts[2];
    const nonMemberAccount = accounts[3];

    const dao = this.dao;
    const bank = this.extensions.bank;
    const tribute = this.adapters.tribute;
    const voting = this.adapters.voting;

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    let oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to daoOwner
    const initialTokenBalance = toBN("100");
    await oltContract.transfer(daoOwner, initialTokenBalance);
    let daoOwnerTokenBalance = await oltContract.balanceOf.call(daoOwner);
    expect(daoOwnerTokenBalance.toString()).toEqual(
      initialTokenBalance.toString()
    );

    // Number of OLTs to be sent to the DAO in exchange for number of requested shares
    const tributeAmount = 10;
    const requestAmount = 100000000;

    await expectRevert(
      tribute.provideTribute(
        dao.address,
        getProposalCounter(),
        applicant,
        SHARES,
        requestAmount,
        oltContract.address,
        tributeAmount,
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "ERC20: transfer amount exceeds allowance"
    );

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    await oltContract.approve(tribute.address, tributeAmount, {
      from: daoOwner,
    });

    await tribute.provideTribute(
      dao.address,
      "0x1",
      applicant,
      SHARES,
      requestAmount,
      oltContract.address,
      tributeAmount,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await tribute.sponsorProposal(dao.address, "0x1", [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, "0x1", 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // should not be able to process before the voting period has ended
    await expectRevert(
      tribute.processProposal(dao.address, "0x1", {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal has not been voted on yet"
    );

    await advanceTime(10000);
    await tribute.processProposal(dao.address, "0x1", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // test balances after proposal is processed
    const daoOwnerShares = await bank.balanceOf(daoOwner, SHARES);
    expect(daoOwnerShares.toString()).toEqual("1");
    const applicantShares = await bank.balanceOf(applicant, SHARES);
    expect(applicantShares.toString()).toEqual(requestAmount.toString());
    const nonMemberAccountShares = await bank.balanceOf(
      nonMemberAccount,
      SHARES
    );
    expect(nonMemberAccountShares.toString()).toEqual("0");
    await checkBalance(
      bank,
      GUILD,
      oltContract.address,
      tributeAmount.toString()
    );

    // test active member status
    const applicantIsActiveMember = await isMember(bank, applicant);
    expect(applicantIsActiveMember).toEqual(true);
    const nonMemberAccountIsActiveMember = await isMember(
      bank,
      nonMemberAccount
    );
    expect(nonMemberAccountIsActiveMember).toEqual(false);
  });

  it("should be possible to cancel a tribute proposal", async () => {
    const applicant = accounts[2];

    const dao = this.dao;
    const bank = this.extensions.bank;
    const tribute = this.adapters.tribute;

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    let oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to daoOwner
    const initialTokenBalance = toBN("100");
    await oltContract.transfer(daoOwner, initialTokenBalance);
    let daoOwnerTokenBalance = await oltContract.balanceOf.call(daoOwner);
    expect(daoOwnerTokenBalance.toString()).toEqual(
      initialTokenBalance.toString()
    );

    // Number of OLTs to be sent to the DAO in exchange for number of requested shares
    const tributeAmount = 10;
    const requestAmount = 100000000;

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    await oltContract.approve(tribute.address, tributeAmount, {
      from: daoOwner,
    });

    await tribute.provideTribute(
      dao.address,
      "0x1",
      applicant,
      SHARES,
      requestAmount,
      oltContract.address,
      tributeAmount,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await expectRevert(
      tribute.cancelProposal(dao.address, "0x1", {
        from: applicant,
        gasPrice: toBN("0"),
      }),
      "only proposer can cancel a proposal"
    );

    await tribute.cancelProposal(dao.address, "0x1", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    const isProcessed = await dao.getProposalFlag("0x1", toBN("2")); // 2 is processed flag index
    expect(isProcessed).toEqual(true);

    // test refund of ERC20 contribution
    daoOwnerTokenBalance = await oltContract.balanceOf.call(daoOwner);
    // "daoOwner did not receive refund of ERC20 contribution"
    expect(daoOwnerTokenBalance.toString()).toEqual(
      initialTokenBalance.toString()
    );

    // should not be able to sponsor if the proposal has already been cancelled
    await expectRevert(
      tribute.sponsorProposal(dao.address, "0x1", [], {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal already processed"
    );

    // should not be able to process if the proposal has already been cancelled
    await expectRevert(
      tribute.processProposal(dao.address, "0x1", {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal already processed"
    );

    // test balances after proposal is processed
    const daoOwnerShares = await bank.balanceOf(daoOwner, SHARES);
    expect(daoOwnerShares.toString()).toEqual("1");
    const applicantShares = await bank.balanceOf(applicant, SHARES);
    expect(applicantShares.toString()).toEqual("0");
    const guildBalance = await bank.balanceOf(GUILD, oltContract.address);
    expect(guildBalance.toString()).toEqual("0");
  });

  it("should handle a tribute proposal with a failed vote", async () => {
    const applicant = accounts[2];

    const dao = this.dao;
    const bank = this.extensions.bank;
    const tribute = this.adapters.tribute;
    const voting = this.adapters.voting;

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    let oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to daoOwner
    const initialTokenBalance = toBN("100");
    await oltContract.transfer(daoOwner, initialTokenBalance);
    let daoOwnerTokenBalance = await oltContract.balanceOf.call(daoOwner);
    // "daoOwner must be initialized with 100 OLT Tokens"
    expect(daoOwnerTokenBalance.toString()).toEqual(
      initialTokenBalance.toString()
    );

    // Number of OLTs to be sent to the DAO in exchange for number of requested shares
    const tributeAmount = 10;
    const requestAmount = 100000000;

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    await oltContract.approve(tribute.address, tributeAmount, {
      from: daoOwner,
    });

    const proposalId = getProposalCounter();
    await tribute.provideTribute(
      dao.address,
      proposalId,
      applicant,
      SHARES,
      requestAmount,
      oltContract.address,
      tributeAmount,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await tribute.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 2, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    const vote = await voting.voteResult(dao.address, proposalId);
    expect(vote.toString()).toEqual("3"); // vote should be "not passed"

    await tribute.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const isProcessed = await dao.getProposalFlag(proposalId, toBN("2")); // 2 is processed flag index
    expect(isProcessed).toEqual(true);

    // test refund of ERC20 contribution
    daoOwnerTokenBalance = await oltContract.balanceOf.call(daoOwner);
    // "daoOwner did not receive refund of ERC20 contribution"
    expect(daoOwnerTokenBalance.toString()).toEqual(
      initialTokenBalance.toString()
    );

    // test balances after proposal is processed
    const daoOwnerShares = await bank.balanceOf(daoOwner, SHARES);
    expect(daoOwnerShares.toString()).toEqual("1");
    const applicantShares = await bank.balanceOf(applicant, SHARES);
    expect(applicantShares.toString()).toEqual("0");
    const guildBalance = await bank.balanceOf(GUILD, oltContract.address);
    expect(guildBalance.toString()).toEqual("0");
    const applicantBalance = await bank.balanceOf(
      applicant,
      oltContract.address
    );
    expect(applicantBalance.toString()).toEqual("0");
    const tributeAdapterBalance = await oltContract.balanceOf.call(
      tribute.address
    );
    // "tribute adapter did not refund ERC20 contribution";
    expect(tributeAdapterBalance.toString()).toEqual("0");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, applicant);
    expect(applicantIsActiveMember).toEqual(false);
  });

  it("should not be possible to sponsor proposal that does not exist", async () => {
    const dao = this.dao;
    const tribute = this.adapters.tribute;

    await expectRevert(
      tribute.sponsorProposal(dao.address, "0x1", [], {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal does not exist for this dao"
    );
  });

  it("should not be possible to process proposal that does not exist", async () => {
    const dao = this.dao;
    const tribute = this.adapters.tribute;

    await expectRevert(
      tribute.processProposal(dao.address, "0x1", {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal does not exist"
    );
  });

  it("should not be possible to join if the provided token exceeds the bank token limits", async () => {
    const applicant = accounts[2];

    // Issue OpenLaw ERC20 Basic Token for tests
    // Token supply higher than the limit for external tokens
    // defined in Bank._createNewAmountCheckpoint function (2**160-1).
    const supply = toBN("2").pow(toBN("180"));
    const oltContract = await OLToken.new(supply, { from: daoOwner });
    const nbOfERC20Shares = 100000000;
    const erc20SharePrice = toBN("10");

    const { dao, adapters } = await deployDao(null, {
      owner: daoOwner,
      unitPrice: erc20SharePrice,
      nbShares: nbOfERC20Shares,
      tokenAddr: oltContract.address,
    });

    const tribute = adapters.tribute;
    const voting = adapters.voting;

    // Transfer OLTs to daoOwner
    // Use an amount that will cause an overflow 2**161 > 2**160-1 for external tokens
    const initialTokenBalance = toBN("2").pow(toBN("161")).toString();
    await oltContract.approve.sendTransaction(applicant, initialTokenBalance, {
      from: daoOwner,
    });

    await oltContract.transfer(applicant, initialTokenBalance, {
      from: daoOwner,
    });

    let applicantTokenBalance = await oltContract.balanceOf.call(applicant);
    // "applicant account must be initialized with 2**161 OLT Tokens";
    expect(applicantTokenBalance.toString()).toEqual(
      initialTokenBalance.toString()
    );

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    const tributeAmount = initialTokenBalance;
    await oltContract.approve(tribute.address, initialTokenBalance.toString(), {
      from: applicant,
      gasPrice: toBN("0"),
    });

    const requestAmount = tributeAmount;
    const proposalId = getProposalCounter();

    await tribute.provideTribute(
      dao.address,
      proposalId,
      applicant,
      SHARES,
      requestAmount,
      oltContract.address,
      tributeAmount.toString(),
      {
        from: applicant,
        gasPrice: toBN("0"),
      }
    );

    await tribute.sponsorProposal(dao.address, proposalId, [], {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 1, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    const vote = await voting.voteResult(dao.address, proposalId);
    expect(vote.toString()).toEqual("2");

    // Proposal is processed, but due to the overflow error the funds must be returned
    // to the applicant
    await tribute.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // Due to the overflow it fails, and the funds must be in the applicant's account
    applicantTokenBalance = await oltContract.balanceOf.call(applicant);
    // "applicant account should contain 2**161 OLT Tokens when the onboard fails";
    expect(applicantTokenBalance.toString()).toEqual(
      initialTokenBalance.toString()
    );
  });
});
