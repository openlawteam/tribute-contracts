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
  sharePrice,
  remaining,
  OLTokenContract,
  numberOfShares,
  OnboardingContract,
  VotingContract,
  BankExtension,
  sha3,
  ETH_TOKEN,
} = require("../../utils/DaoFactory.js");
const { checkBalance } = require("../../utils/TestUtils.js");

contract("LAOLAND - Onboarding Adapter", async (accounts) => {
  it("should be possible to join a DAO with ETH contribution", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const nonMemberAccount = accounts[3];

    let dao = await createDao(myAccount);
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);

    const myAccountInitialBalance = await web3.eth.getBalance(myAccount);
    // remaining amount to test sending back to proposer
    const ethAmount = sharePrice.mul(toBN(3)).add(remaining);

    await onboarding.onboard(dao.address, "0x1", otherAccount, SHARES, 0, {
      from: myAccount,
      value: ethAmount,
      gasPrice: toBN("0"),
    });

    // test return of remaining amount in excess of multiple of sharesPerChunk
    const myAccountBalance = await web3.eth.getBalance(myAccount);
    assert.equal(
      toBN(myAccountInitialBalance).sub(ethAmount).add(remaining).toString(),
      myAccountBalance.toString(),
      "myAccount did not receive remaining amount in excess of multiple of sharesPerChunk"
    );

    await onboarding.sponsorProposal(dao.address, "0x1", [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    voting.submitVote(dao.address, "0x1", 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    try {
      await onboarding.processProposal(dao.address, "0x1", {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal has not been voted on yet");
    }

    await advanceTime(10000);
    await onboarding.processProposal(dao.address, "0x1", {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    const myAccountShares = await bank.balanceOf(myAccount, SHARES);
    const otherAccountShares = await bank.balanceOf(otherAccount, SHARES);
    const nonMemberAccountShares = await bank.balanceOf(
      nonMemberAccount,
      SHARES
    );
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(
      otherAccountShares.toString(),
      numberOfShares.mul(toBN("3")).toString()
    );
    assert.equal(nonMemberAccountShares.toString(), "0");
    await checkBalance(bank, GUILD, ETH_TOKEN, sharePrice.mul(toBN("3")));
  });

  it("should be possible to join a DAO with ERC20 contribution", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const nonMemberAccount = accounts[3];

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    let oltContract = await OLTokenContract.new(tokenSupply);

    const nbOfERC20Shares = 100000000;
    const erc20SharePrice = toBN("10");
    const erc20Remaining = erc20SharePrice.sub(toBN("1"));

    let dao = await createDao(
      myAccount,
      erc20SharePrice,
      nbOfERC20Shares,
      10,
      1,
      oltContract.address
    );
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);

    // Transfer OLTs to myAccount
    const myAccountInitialTokenBalance = toBN("100");
    await oltContract.transfer(myAccount, myAccountInitialTokenBalance);
    let myAccountTokenBalance = await oltContract.balanceOf.call(myAccount);
    assert.equal(
      myAccountInitialTokenBalance.toString(),
      myAccountTokenBalance.toString(),
      "myAccount must be initialized with 100 OLT Tokens"
    );

    // Total of OLTs to be sent to the DAO in order to get the shares
    // (remaining amount to test sending back to proposer)
    const tokenAmount = erc20SharePrice.add(toBN(erc20Remaining));

    try {
      await onboarding.onboard(
        dao.address,
        "0x1",
        otherAccount,
        SHARES,
        tokenAmount,
        {
          from: myAccount,
          gasPrice: toBN("0"),
        }
      );
      assert.equal(true, false, "should have failed without spender approval!");
    } catch (err) {}

    // Pre-approve spender (onboarding adapter) to transfer proposer tokens
    await oltContract.approve(onboarding.address, tokenAmount, {
      from: myAccount,
    });

    await onboarding.onboard(
      dao.address,
      "0x1",
      otherAccount,
      SHARES,
      tokenAmount,
      {
        from: myAccount,
        gasPrice: toBN("0"),
      }
    );

    // test return of remaining amount in excess of multiple of sharesPerChunk
    myAccountTokenBalance = await oltContract.balanceOf.call(myAccount);
    assert.equal(
      myAccountInitialTokenBalance
        .sub(tokenAmount)
        .add(erc20Remaining)
        .toString(),
      myAccountTokenBalance.toString(),
      "myAccount did not receive remaining amount in excess of multiple of sharesPerChunk"
    );

    await onboarding.sponsorProposal(dao.address, "0x1", [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    voting.submitVote(dao.address, "0x1", 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    try {
      await onboarding.processProposal(dao.address, "0x1", {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal has not been voted on yet");
    }

    await advanceTime(10000);
    await onboarding.processProposal(dao.address, "0x1", {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    const myAccountShares = await bank.balanceOf(myAccount, SHARES);
    const otherAccountShares = await bank.balanceOf(otherAccount, SHARES);
    const nonMemberAccountShares = await bank.balanceOf(
      nonMemberAccount,
      SHARES
    );
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), "100000000");
    assert.equal(nonMemberAccountShares.toString(), "0");
    await checkBalance(bank, GUILD, oltContract.address, "10");
  });

  it("should not be possible to have more than the maximum number of shares", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];

    let dao = await createDao(myAccount);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);

    try {
      await onboarding.onboard(dao.address, "0x1", otherAccount, SHARES, 0, {
        from: myAccount,
        value: sharePrice.mul(toBN(11)).add(remaining),
        gasPrice: toBN("0"),
      });
      assert.err("should not allow more than maxumum shared to be requested");
    } catch (err) {
      assert.equal(
        err.reason,
        "total shares for this member must be lower than the maximum"
      );
    }
  });

  it("should be possible to cancel an onboarding proposal", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const dao = await createDao(myAccount);

    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);

    const myAccountInitialBalance = await web3.eth.getBalance(myAccount);
    await onboarding.onboard(dao.address, "0x1", otherAccount, SHARES, 0, {
      from: myAccount,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });

    try {
      await onboarding.cancelProposal(dao.address, "0x1", {
        from: otherAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "only proposer can cancel a proposal");
    }

    await onboarding.cancelProposal(dao.address, "0x1", {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    const isProcessed = await dao.getProposalFlag("0x1", toBN("2")); // 2 is processed flag index
    assert.equal(isProcessed, true);

    // test refund of ether contribution
    const myAccountBalance = await web3.eth.getBalance(myAccount);
    assert.equal(
      myAccountInitialBalance.toString(),
      myAccountBalance.toString(),
      "myAccount did not receive refund of ether contribution"
    );

    try {
      await onboarding.sponsorProposal(dao.address, "0x1", [], {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal already processed");
    }

    try {
      await onboarding.processProposal(dao.address, "0x1", {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal already processed");
    }

    const myAccountShares = await bank.balanceOf(myAccount, SHARES);
    const otherAccountShares = await bank.balanceOf(otherAccount, SHARES);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), "0");

    const guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "0");
  });

  it("should handle an onboarding proposal with a failed vote", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    let dao = await createDao(myAccount);

    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    const bank = await BankExtension.at(bankAddress);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);
    const voting = await getContract(dao, "voting", VotingContract);

    const myAccountInitialBalance = await web3.eth.getBalance(myAccount);
    await onboarding.onboard(dao.address, "0x1", otherAccount, SHARES, 0, {
      from: myAccount,
      value: sharePrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });
    await onboarding.sponsorProposal(dao.address, "0x1", [], {
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

    await onboarding.processProposal(dao.address, "0x1", {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    const isProcessed = await dao.getProposalFlag("0x1", toBN("2")); // 2 is processed flag index
    assert.equal(isProcessed, true);

    // test refund of ether contribution
    const myAccountBalance = await web3.eth.getBalance(myAccount);
    assert.equal(
      myAccountInitialBalance.toString(),
      myAccountBalance.toString(),
      "myAccount did not receive refund of ether contribution"
    );

    const myAccountShares = await bank.balanceOf(myAccount, SHARES);
    const otherAccountShares = await bank.balanceOf(otherAccount, SHARES);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), "0");

    const guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    assert.equal(guildBalance.toString(), "0");

    const otherAccountBalance = await bank.balanceOf(otherAccount, ETH_TOKEN);

    assert.equal(otherAccountBalance.toString(), "0");

    let onboardingBalance = await web3.eth.getBalance(onboarding.address);
    assert.equal(onboardingBalance.toString(), "0");
  });

  it("should validate inputs", async () => {
    const myAccount = accounts[1];
    let dao = await createDao(myAccount);

    const onboarding = await getContract(dao, "onboarding", OnboardingContract);

    try {
      await onboarding.sponsorProposal(dao.address, "0x1", [], {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (err) {
      assert.equal(err.reason, "proposal does not exist for this dao");
    }
  });
});
