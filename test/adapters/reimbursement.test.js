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
const {
  toBN,
  unitPrice,
  sha3,
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
  generateMembers,
  advanceTime,
  accounts,
  expectRevert,
  expect,
  web3,
} = require("../../utils/OZTestUtil.js");

const { checkBalance, isMember, onboardingNewMember } = require("../../utils/TestUtils.js");

const daoOwner = accounts[0];
const delegatedKey = accounts[9];

const proposalCounter = proposalIdGenerator().generator;

const members = generateMembers(10);

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Reimbursement", () => {
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

  it("should be possible to join a DAO with ETH contribution", async () => {
    const applicant = members[2];
  
    const dao = this.dao;
    const onboarding = this.adapters.onboarding;
    const reimbursement = this.adapters.reimbursement;
    const voting = this.adapters.voting;
    
    // remaining amount to test sending back to proposer
    const ethAmount = unitPrice.mul(toBN(3)).add(remaining);

    const proposalId = getProposalCounter();
    
    await onboardingNewMember(getProposalCounter(), dao, onboarding, voting, members[2].address, daoOwner, unitPrice, UNITS);

    const votingSigData = sha3(web3.eth.abi.encodeParameters(["address", "address", "bytes32", "uint256"], [dao.address, onboarding.address, proposalId, 1]));
    const voteData = web3.eth.abi.encodeParameter(
      {
        PermitVote: {
          proposalId: "bytes32",
          choice: "uint256",
          submitter: "address",
          signature: "bytes",
        },
      },
      {
        proposalId,
        choice: "1",
        signature: web3.eth.accounts.sign(votingSigData, applicant.privateKey).signature,
        submitter: applicant.address,
      }
    );

    const onboardingCall = onboarding.contract.methods.submitProposal(
      dao.address,
      proposalId,
      applicant.address,
      UNITS,
      ethAmount,
      voteData).encodeABI();
      
      /*
    await expectRevert(reimbursement.callFromHere(onboarding.address, onboardingCall,
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    ), "not enough funds");    
*/
    await reimbursement.callFromHere(onboarding.address, onboardingCall,
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
  });
});
