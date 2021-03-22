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
  createDao,
  getContract,
  GUILD,
  SHARES,
  OLToken,
  TributeContract,
  VotingContract,
  BankExtension,
  sha3,
} = require("../../utils/DaoFactory.js");
const { checkBalance } = require("../../utils/TestUtils.js");

contract("MolochV3 - Tribute Adapter", async (accounts) => {
  it("should be possible to provide ERC20 tokens in exchange for DAO shares", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    const nonMemberAccount = accounts[3];

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    const tribute = await getContract(dao, "tribute", TributeContract);
    const voting = await getContract(dao, "voting", VotingContract);

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    let oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to myAccount
    const initialTokenBalance = toBN("100");
    await oltContract.transfer(myAccount, initialTokenBalance);
    let myAccountTokenBalance = await oltContract.balanceOf.call(myAccount);
    assert.equal(
      initialTokenBalance.toString(),
      myAccountTokenBalance.toString(),
      "myAccount must be initialized with 100 OLT Tokens"
    );

    // Number of OLTs to be sent to the DAO in exchange for number of requested shares
    const tributeAmount = 10;
    const requestAmount = 100000000;

    try {
      await tribute.provideTribute(
        dao.address,
        "0x1",
        applicant,
        SHARES,
        requestAmount,
        oltContract.address,
        tributeAmount,
        {
          from: myAccount,
          gasPrice: toBN("0"),
        }
      );
      assert.fail("should have failed without spender approval!");
    } catch (e) {
      assert.equal(e.reason, "ERC20: transfer amount exceeds allowance");
    }

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    await oltContract.approve(tribute.address, tributeAmount, {
      from: myAccount,
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
        from: myAccount,
        gasPrice: toBN("0"),
      }
    );

    await tribute.sponsorProposal(dao.address, "0x1", [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, "0x1", 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // should not be able to process before the voting period has ended
    try {
      await tribute.processProposal(dao.address, "0x1", {
        from: myAccount,
        gasPrice: toBN("0"),
      });
      assert.fail("should not process the proposal before voting");
    } catch (err) {
      assert.equal(err.reason, "proposal has not been voted on yet");
    }

    await advanceTime(10000);
    await tribute.processProposal(dao.address, "0x1", {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    // test balances after proposal is processed
    const myAccountShares = await bank.balanceOf(myAccount, SHARES);
    assert.equal(myAccountShares.toString(), "1");
    const applicantShares = await bank.balanceOf(applicant, SHARES);
    assert.equal(applicantShares.toString(), requestAmount.toString());
    const nonMemberAccountShares = await bank.balanceOf(
      nonMemberAccount,
      SHARES
    );
    assert.equal(nonMemberAccountShares.toString(), "0");
    await checkBalance(
      bank,
      GUILD,
      oltContract.address,
      tributeAmount.toString()
    );

    // test active member status
    const applicantIsActiveMember = await dao.isActiveMember(applicant);
    assert.equal(applicantIsActiveMember, true);
    const nonMemberAccountIsActiveMember = await dao.isActiveMember(
      nonMemberAccount
    );
    assert.equal(nonMemberAccountIsActiveMember, false);
  });

  it("should be possible to cancel a tribute proposal", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    const tribute = await getContract(dao, "tribute", TributeContract);

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    let oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to myAccount
    const initialTokenBalance = toBN("100");
    await oltContract.transfer(myAccount, initialTokenBalance);
    let myAccountTokenBalance = await oltContract.balanceOf.call(myAccount);
    assert.equal(
      initialTokenBalance.toString(),
      myAccountTokenBalance.toString(),
      "myAccount must be initialized with 100 OLT Tokens"
    );

    // Number of OLTs to be sent to the DAO in exchange for number of requested shares
    const tributeAmount = 10;
    const requestAmount = 100000000;

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    await oltContract.approve(tribute.address, tributeAmount, {
      from: myAccount,
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
        from: myAccount,
        gasPrice: toBN("0"),
      }
    );

    try {
      await tribute.cancelProposal(dao.address, "0x1", {
        from: applicant,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "only proposer can cancel a proposal");
    }

    await tribute.cancelProposal(dao.address, "0x1", {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    const isProcessed = await dao.getProposalFlag("0x1", toBN("2")); // 2 is processed flag index
    assert.equal(isProcessed, true);

    // test refund of ERC20 contribution
    myAccountTokenBalance = await oltContract.balanceOf.call(myAccount);
    assert.equal(
      initialTokenBalance.toString(),
      myAccountTokenBalance.toString(),
      "myAccount did not receive refund of ERC20 contribution"
    );

    // should not be able to sponsor if the proposal has already been cancelled
    try {
      await tribute.sponsorProposal(dao.address, "0x1", [], {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal already processed");
    }

    // should not be able to process if the proposal has already been cancelled
    try {
      await tribute.processProposal(dao.address, "0x1", {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal already processed");
    }

    // test balances after proposal is processed
    const myAccountShares = await bank.balanceOf(myAccount, SHARES);
    assert.equal(myAccountShares.toString(), "1");
    const applicantShares = await bank.balanceOf(applicant, SHARES);
    assert.equal(applicantShares.toString(), "0");
    const guildBalance = await bank.balanceOf(GUILD, oltContract.address);
    assert.equal(guildBalance.toString(), "0");
  });

  it("should handle a tribute proposal with a failed vote", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    let dao = await createDao(myAccount);

    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    const tribute = await getContract(dao, "tribute", TributeContract);
    const voting = await getContract(dao, "voting", VotingContract);

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    let oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to myAccount
    const initialTokenBalance = toBN("100");
    await oltContract.transfer(myAccount, initialTokenBalance);
    let myAccountTokenBalance = await oltContract.balanceOf.call(myAccount);
    assert.equal(
      initialTokenBalance.toString(),
      myAccountTokenBalance.toString(),
      "myAccount must be initialized with 100 OLT Tokens"
    );

    // Number of OLTs to be sent to the DAO in exchange for number of requested shares
    const tributeAmount = 10;
    const requestAmount = 100000000;

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    await oltContract.approve(tribute.address, tributeAmount, {
      from: myAccount,
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
        from: myAccount,
        gasPrice: toBN("0"),
      }
    );

    await tribute.sponsorProposal(dao.address, "0x1", [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, "0x1", 2, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    const vote = await voting.voteResult(dao.address, "0x1");
    assert.equal(vote.toString(), "3"); // vote should be "not passed"

    await tribute.processProposal(dao.address, "0x1", {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    const isProcessed = await dao.getProposalFlag("0x1", toBN("2")); // 2 is processed flag index
    assert.equal(isProcessed, true);

    // test refund of ERC20 contribution
    myAccountTokenBalance = await oltContract.balanceOf.call(myAccount);
    assert.equal(
      initialTokenBalance.toString(),
      myAccountTokenBalance.toString(),
      "myAccount did not receive refund of ERC20 contribution"
    );

    // test balances after proposal is processed
    const myAccountShares = await bank.balanceOf(myAccount, SHARES);
    assert.equal(myAccountShares.toString(), "1");
    const applicantShares = await bank.balanceOf(applicant, SHARES);
    assert.equal(applicantShares.toString(), "0");
    const guildBalance = await bank.balanceOf(GUILD, oltContract.address);
    assert.equal(guildBalance.toString(), "0");
    const applicantBalance = await bank.balanceOf(
      applicant,
      oltContract.address
    );
    assert.equal(applicantBalance.toString(), "0");
    const tributeAdapterBalance = await oltContract.balanceOf.call(
      tribute.address
    );
    assert.equal(
      tributeAdapterBalance.toString(),
      "0",
      "tribute adapter did not refund ERC20 contribution"
    );

    // test active member status
    const applicantIsActiveMember = await dao.isActiveMember(applicant);
    assert.equal(applicantIsActiveMember, false);
  });

  it("should not be possible to sponsor proposal that does not exist", async () => {
    const myAccount = accounts[1];
    let dao = await createDao(myAccount);

    const tribute = await getContract(dao, "tribute", TributeContract);

    try {
      await tribute.sponsorProposal(dao.address, "0x1", [], {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal does not exist for this dao");
    }
  });

  it("should not be possible to process proposal that does not exist", async () => {
    const myAccount = accounts[1];
    let dao = await createDao(myAccount);

    const tribute = await getContract(dao, "tribute", TributeContract);

    try {
      await tribute.processProposal(dao.address, "0x1", {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal does not exist");
    }
  });

  it("should not be possible to join if the provided token exceeds the bank token limits", async () => {
    const daoOwner = accounts[1];
    const applicant = accounts[2];

    // Issue OpenLaw ERC20 Basic Token for tests
    // Token supply higher than the limit for external tokens
    // defined in Bank._createNewAmountCheckpoint function (2**160-1).
    const supply = toBN("2").pow(toBN("180")).toString();
    const oltContract = await OLToken.new(supply, { from: daoOwner });
    const oltContractAddr = oltContract.address;

    const dao = await createDao(
      daoOwner,
      toBN("1"), // share price
      toBN("10").pow(toBN("4")), // max shares per chunk
      10, // voting period
      1, // voting grace period
      oltContractAddr, // token address to mint
      true, // finalize dao creation
      100, // max external tokens
      toBN("2").pow(toBN("180")).toString() // max chunks
    );

    const tribute = await getContract(dao, "tribute", TributeContract);
    const voting = await getContract(dao, "voting", VotingContract);

    // Transfer OLTs to myAccount
    // Use an amount that will cause an overflow 2**161 > 2**160-1 for external tokens
    const initialTokenBalance = toBN("2").pow(toBN("161")).toString();
    await oltContract.approve.sendTransaction(applicant, initialTokenBalance, {
      from: daoOwner,
    });

    await oltContract.transfer(applicant, initialTokenBalance, {
      from: daoOwner,
    });

    let applicantTokenBalance = await oltContract.balanceOf.call(applicant);
    assert.equal(
      initialTokenBalance.toString(),
      applicantTokenBalance.toString(),
      "applicant account must be initialized with 2**161 OLT Tokens"
    );

    // Pre-approve spender (tribute adapter) to transfer proposer tokens
    const tributeAmount = initialTokenBalance;
    await oltContract.approve(tribute.address, initialTokenBalance.toString(), {
      from: applicant,
      gasPrice: toBN("0"),
    });

    const requestAmount = 100000000;
    const proposalId = "0x1";
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

    try {
      await tribute.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      });
    } catch (e) {
      console.log(e);
      assert.equal(e.reason, "");
    }

    // In case of failures the funds must be returned to the applicant
    applicantTokenBalance = await oltContract.balanceOf.call(applicant);
    assert.equal(
      initialTokenBalance.toString(),
      applicantTokenBalance.toString(),
      "applicant account should contain 2**161 OLT Tokens when the onboard fails"
    );
  });
});
