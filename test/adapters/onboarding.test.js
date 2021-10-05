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
  toWei,
  fromAscii,
  unitPrice,
  UNITS,
  GUILD,
  ETH_TOKEN,
  remaining,
  numberOfUnits,
} = require("../../utils/ContractUtil.js");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  accounts,
  expectRevert,
  expect,
  web3,
  OLToken,
} = require("../../utils/OZTestUtil.js");

const { checkBalance, isMember } = require("../../utils/TestUtils.js");

const daoOwner = accounts[0];
const delegatedKey = accounts[9];

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Onboarding", () => {
  before("deploy dao", async () => {
    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
      creator: delegatedKey,
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

  it("should not be possible onboard when the token amount exceeds the external token limits", async () => {
    const applicant = accounts[2];

    // Issue OpenLaw ERC20 Basic Token for tests
    // Token supply higher than the limit for external tokens
    // defined in Bank._createNewAmountCheckpoint function (2**160-1).
    const supply = toBN("2").pow(toBN("180")).toString();
    const oltContract = await OLToken.new(supply, { from: daoOwner });
    const nbOfERC20Units = 100000000;
    const erc20UnitPrice = toBN("10");

    const { dao, adapters } = await deployDefaultDao({
      owner: daoOwner,
      unitPrice: erc20UnitPrice,
      nbUnits: nbOfERC20Units,
      tokenAddr: oltContract.address,
    });

    const onboarding = adapters.onboarding;

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
    // applicant account must be initialized with 2**161 OLT Tokens
    expect(initialTokenBalance.toString()).equal(
      applicantTokenBalance.toString()
    );

    // Pre-approve spender (onboarding adapter) to transfer proposer tokens
    // Higher than the current limit for external tokens: 2^160-1
    const tokenAmount = initialTokenBalance;
    await oltContract.approve.sendTransaction(
      onboarding.address,
      initialTokenBalance.toString(),
      {
        from: applicant,
        gasPrice: toBN("0"),
      }
    );

    const proposalId = getProposalCounter();
    await expectRevert(
      onboarding.submitProposal(
        dao.address,
        proposalId,
        applicant,
        UNITS,
        tokenAmount,
        [],
        {
          from: applicant,
          gasPrice: toBN("0"),
        }
      ),
      "Returned error: VM Exception while processing transaction: revert"
    );

    // In case of failures the funds must be in the applicant account
    applicantTokenBalance = await oltContract.balanceOf.call(applicant);
    // "applicant account should contain 2**161 OLT Tokens when the onboard fails"
    expect(initialTokenBalance.toString()).equal(
      applicantTokenBalance.toString()
    );
  });

  it("should be possible to join a DAO with ETH contribution", async () => {
    const applicant = accounts[2];
    const nonMemberAccount = accounts[3];

    const dao = this.dao;
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    const myAccountInitialBalance = await web3.eth.getBalance(daoOwner);
    // remaining amount to test sending back to proposer
    const ethAmount = unitPrice.mul(toBN(3)).add(remaining);

    const proposalId = getProposalCounter();
    await onboarding.submitProposal(
      dao.address,
      proposalId,
      applicant,
      UNITS,
      ethAmount,
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

    // should not be able to process before the voting period has ended
    await expectRevert(
      onboarding.processProposal(dao.address, proposalId, {
        from: daoOwner,
        value: ethAmount,
        gasPrice: toBN("0"),
      }),
      "proposal has not been voted on yet"
    );

    await advanceTime(10000);
    await onboarding.processProposal(dao.address, proposalId, {
      from: daoOwner,
      value: ethAmount,
      gasPrice: toBN("0"),
    });

    // test return of remaining amount in excess of multiple of unitsPerChunk
    const myAccountBalance = await web3.eth.getBalance(daoOwner);
    // daoOwner did not receive remaining amount in excess of multiple of unitsPerChunk
    expect(
      toBN(myAccountInitialBalance).sub(ethAmount).add(remaining).toString()
    ).equal(myAccountBalance.toString());

    const myAccountUnits = await bank.balanceOf(daoOwner, UNITS);
    const applicantUnits = await bank.balanceOf(applicant, UNITS);
    const nonMemberAccountUnits = await bank.balanceOf(nonMemberAccount, UNITS);
    expect(myAccountUnits.toString()).equal("1");
    expect(applicantUnits.toString()).equal(
      numberOfUnits.mul(toBN("3")).toString()
    );
    expect(nonMemberAccountUnits.toString()).equal("0");
    await checkBalance(bank, GUILD, ETH_TOKEN, unitPrice.mul(toBN("3")));

    // test active member status
    const applicantIsActiveMember = await isMember(bank, applicant);
    expect(applicantIsActiveMember).equal(true);
    const nonMemberAccountIsActiveMember = await isMember(
      bank,
      nonMemberAccount
    );
    expect(nonMemberAccountIsActiveMember).equal(false);
  });

  it("should be possible to join a DAO with ERC20 contribution", async () => {
    const applicant = accounts[2];
    const nonMemberAccount = accounts[3];

    // Issue OpenLaw ERC20 Basic Token for tests
    const tokenSupply = 1000000;
    let oltContract = await OLToken.new(tokenSupply);

    const nbOfERC20Units = 100000000;
    const erc20UnitPrice = toBN("10");
    const erc20Remaining = erc20UnitPrice.sub(toBN("1"));

    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
      unitPrice: erc20UnitPrice,
      nbUnits: nbOfERC20Units,
      tokenAddr: oltContract.address,
    });

    const bank = extensions.bank;
    const onboarding = adapters.onboarding;
    const voting = adapters.voting;

    // Transfer OLTs to myAccount
    const initialTokenBalance = toBN("100");
    await oltContract.transfer(daoOwner, initialTokenBalance);
    let myAccountTokenBalance = await oltContract.balanceOf.call(daoOwner);
    expect(myAccountTokenBalance.toString()).equal(
      initialTokenBalance.toString()
    );

    // Total of OLTs to be sent to the DAO in order to get the units
    // (remaining amount to test sending back to proposer)
    const tokenAmount = erc20UnitPrice.add(toBN(erc20Remaining));

    const proposalId = getProposalCounter();

    await onboarding.submitProposal(
      dao.address,
      proposalId,
      applicant,
      UNITS,
      tokenAmount,
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

    // should not be able to process before the voting period has ended
    await expectRevert(
      onboarding.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "proposal has not been voted on yet"
    );

    await advanceTime(10000);
    await expectRevert(
      onboarding.processProposal(dao.address, proposalId, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "RC20: transfer amount exceeds allowance."
    );

    // Pre-approve spender (onboarding adapter) to transfer proposer tokens
    await oltContract.approve(onboarding.address, tokenAmount, {
      from: daoOwner,
    });

    onboarding.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    // test return of remaining amount in excess of multiple of unitsPerChunk
    myAccountTokenBalance = await oltContract.balanceOf.call(daoOwner);
    // "myAccount did not receive remaining amount in excess of multiple of unitsPerChunk"
    expect(myAccountTokenBalance.toString()).equal(
      initialTokenBalance.sub(tokenAmount).add(erc20Remaining).toString()
    );

    const myAccountUnits = await bank.balanceOf(daoOwner, UNITS);
    const applicantUnits = await bank.balanceOf(applicant, UNITS);
    const nonMemberAccountUnits = await bank.balanceOf(nonMemberAccount, UNITS);
    expect(myAccountUnits.toString()).equal("1");
    expect(applicantUnits.toString()).equal("100000000");
    expect(nonMemberAccountUnits.toString()).equal("0");
    await checkBalance(bank, GUILD, oltContract.address, "10");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, applicant);
    expect(applicantIsActiveMember).equal(true);
    const nonMemberAccountIsActiveMember = await isMember(
      bank,
      nonMemberAccount
    );
    expect(nonMemberAccountIsActiveMember).equal(false);
  });

  it("should not be possible to have more than the maximum number of units", async () => {
    const applicant = accounts[2];
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;

    await expectRevert(
      onboarding.submitProposal(
        dao.address,
        "0x1",
        applicant,
        UNITS,
        unitPrice.mul(toBN(11)).add(remaining),
        [],
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "total units for this member must be lower than the maximum"
    );
  });

  it("should handle an onboarding proposal with a failed vote", async () => {
    const applicant = accounts[2];
    const dao = this.dao;
    const bank = this.extensions.bank;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    const myAccountInitialBalance = await web3.eth.getBalance(daoOwner);
    const proposalId = getProposalCounter();
    await onboarding.submitProposal(
      dao.address,
      proposalId,
      applicant,
      UNITS,
      unitPrice.mul(toBN(3)).add(remaining),
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

    await onboarding.processProposal(dao.address, proposalId, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    const isProcessed = await dao.getProposalFlag(proposalId, toBN("2")); // 2 is processed flag index
    expect(isProcessed).equal(true);

    // test refund of ETH contribution
    const myAccountBalance = await web3.eth.getBalance(daoOwner);
    // "myAccount did not receive refund of ETH contribution"
    expect(myAccountBalance.toString()).equal(
      myAccountInitialBalance.toString()
    );

    const myAccountUnits = await bank.balanceOf(daoOwner, UNITS);
    const applicantUnits = await bank.balanceOf(applicant, UNITS);
    expect(myAccountUnits.toString()).equal("1");
    expect(applicantUnits.toString()).equal("0");

    const guildBalance = await bank.balanceOf(GUILD, ETH_TOKEN);
    expect(guildBalance.toString()).equal("0");

    const applicantBalance = await bank.balanceOf(applicant, ETH_TOKEN);
    expect(applicantBalance.toString()).equal("0");

    const onboardingBalance = await web3.eth.getBalance(onboarding.address);
    expect(onboardingBalance.toString()).equal("0");

    // test active member status
    const applicantIsActiveMember = await isMember(bank, applicant);
    expect(applicantIsActiveMember).equal(false);
  });

  it("should not be possible to process proposal that does not exist", async () => {
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const result = onboarding.processProposal(dao.address, "0x999", {
      from: daoOwner,
      gasPrice: toBN("0"),
    });
    await expectRevert(result, "proposal does not exist");
  });

  it("should be possible to update delegate key and the member continues as an active member", async () => {
    const delegateKey = accounts[9];
    const dao = this.dao;
    const bank = this.extensions.bank;
    const daoRegistryAdapter = this.adapters.daoRegistryAdapter;

    expect(await isMember(bank, daoOwner)).equal(true);
    expect(await dao.isMember(delegateKey)).equal(true); // use the dao to check delegatedKeys

    const newDelegatedKey = accounts[5];
    await daoRegistryAdapter.updateDelegateKey(dao.address, newDelegatedKey, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    expect(await isMember(bank, daoOwner)).equal(true);
    expect(await dao.isMember(newDelegatedKey)).equal(true); // use the dao to check delegatedKeys
  });

  it("should not be possible to overwrite a delegated key", async () => {
    const applicant = accounts[2];
    const dao = this.dao;
    const daoRegistryAdapter = this.adapters.daoRegistryAdapter;
    const onboarding = this.adapters.onboarding;

    const proposalId = getProposalCounter();
    await onboarding.submitProposal(
      dao.address,
      proposalId,
      applicant,
      UNITS,
      unitPrice.mul(toBN(3)).add(remaining),
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    // try to update the delegated key using the address of another member
    await expectRevert(
      daoRegistryAdapter.updateDelegateKey(dao.address, applicant, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "cannot overwrite existing delegated keys"
    );
  });

  it("should not be possible to update delegate key if the address is already taken as delegated key", async () => {
    const applicant = accounts[2];
    const dao = this.dao;
    const daoRegistryAdapter = this.adapters.daoRegistryAdapter;
    const onboarding = this.adapters.onboarding;
    const voting = this.adapters.voting;

    const proposalId = getProposalCounter();

    await onboarding.submitProposal(
      dao.address,
      proposalId,
      applicant,
      UNITS,
      unitPrice.mul(toBN(3)).add(remaining),
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
    expect(vote.toString()).equal("2"); // vote pass

    await onboarding.processProposal(dao.address, proposalId, {
      from: daoOwner,
      value: unitPrice.mul(toBN(3)).add(remaining),
      gasPrice: toBN("0"),
    });

    // try to update the delegated key using the same address as the member address
    await expectRevert(
      daoRegistryAdapter.updateDelegateKey(dao.address, applicant, {
        from: applicant,
        gasPrice: toBN("0"),
      }),
      "address already taken as delegated key"
    );
  });

  it("should not be possible to onboard a member with a zero address", async () => {
    const applicant = "0x0000000000000000000000000000000000000000";
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;

    const proposalId = getProposalCounter();
    await expectRevert(
      onboarding.submitProposal(
        dao.address,
        proposalId,
        applicant,
        UNITS,
        unitPrice.mul(toBN(3)).add(remaining),
        [],
        {
          from: daoOwner,
          gasPrice: toBN("0"),
        }
      ),
      "invalid member address."
    );

    let isMember = await dao.isMember(applicant);
    expect(isMember).equal(false);
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.onboarding;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
      }),
      "revert"
    );
  });

  it("should not be possible to send ETH to the adapter via fallback function", async () => {
    const adapter = this.adapters.onboarding;
    await expectRevert(
      web3.eth.sendTransaction({
        to: adapter.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
        data: fromAscii("should go to fallback func"),
      }),
      "revert"
    );
  });
});
