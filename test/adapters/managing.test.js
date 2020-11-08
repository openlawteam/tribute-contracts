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
  sha3,
  toBN,
  advanceTime,
  createDao,
  GUILD,
  TOTAL,
  ETH_TOKEN,
  ManagingContract,
  VotingContract,
  OnboardingContract,
} = require("../../utils/DaoFactory.js");

contract("LAOLAND - Managing Adapter", async (accounts) => {
  it("should not be possible to propose a new module with 0x0 module address", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao(myAccount);

    //Submit a new Bank module proposal
    let newModuleId = sha3("bank");
    let managingContract = await dao.getAdapterAddress(sha3("managing"));
    let managing = await ManagingContract.at(managingContract);
    try {
      await managing.createModuleChangeRequest(
        dao.address,
        newModuleId,
        ETH_TOKEN,
        [],
        [],
        0,
        {from: myAccount, gasPrice: toBN("0")}
      );
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "invalid module address");
    }
  });

  it("should not be possible to propose a new module when the module has a reserved address", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao(myAccount);

    //Submit a new Bank module proposal
    let newModuleId = sha3("bank");
    let managingContract = await dao.getAdapterAddress(sha3("managing"));
    let managing = await ManagingContract.at(managingContract);
    try {
      await managing.createModuleChangeRequest(
        dao.address,
        newModuleId,
        GUILD,
        [],
        [],
        0,
        {from: myAccount, gasPrice: toBN("0")}
      );
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "module is using reserved address");
    }

    try {
      await managing.createModuleChangeRequest(
        dao.address,
        newModuleId,
        TOTAL,
        [],
        [],
        0,
        {from: myAccount, gasPrice: toBN("0")}
      );
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "module is using reserved address");
    }
  });

  it("should not be possible to propose a new module with an empty module address", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao(myAccount);

    //Submit a new Bank module proposal
    let newModuleId = sha3("managing");
    let managingContract = await dao.getAdapterAddress(sha3("managing"));
    let managing = await ManagingContract.at(managingContract);
    try {
      await managing.createModuleChangeRequest(
        dao.address,
        newModuleId,
        [],
        [],
        "",
        {
          from: myAccount,
          gasPrice: toBN("0"),
        }
      );
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "invalid address");
    }
  });

  it("should be possible to any individual to propose a new DAO module", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao(myAccount);
    let managingContract = await dao.getAdapterAddress(sha3("managing"));
    let managing = await ManagingContract.at(managingContract);

    let votingContract = await dao.getAdapterAddress(sha3("voting"));
    let voting = await VotingContract.at(votingContract);

    //Submit a new Bank module proposal
    let newModuleId = sha3("onboarding");
    let newModuleAddress = accounts[3]; //TODO deploy some Banking test contract
    await managing.createModuleChangeRequest(
      dao.address,
      newModuleId,
      newModuleAddress,
      [],
      [],
      0,
      {from: myAccount, gasPrice: toBN("0")}
    );

    //Get the new proposal id
    let proposalId = 0;

    //Sponsor the new proposal, vote and process it
    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    await managing.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check if the Bank Module was added to the Registry
    let newBankAddress = await dao.getAdapterAddress(sha3("onboarding"));
    assert.equal(newBankAddress.toString(), newModuleAddress.toString());
  });

  it("should be possible to propose a new DAO module with a delegate key", async () => {
    const myAccount = accounts[1];
    const delegateKey = accounts[3];

    //Create the new DAO
    let dao = await createDao(myAccount);
    let managingContract = await dao.getAdapterAddress(sha3("managing"));
    let managing = await ManagingContract.at(managingContract);

    let votingContract = await dao.getAdapterAddress(sha3("voting"));
    let voting = await VotingContract.at(votingContract);
    //Submit a new Bank module proposal
    let newModuleId = sha3("onboarding");
    let newModuleAddress = accounts[4]; //TODO deploy some Banking test contract
    await managing.createModuleChangeRequest(
      dao.address,
      newModuleId,
      newModuleAddress,
      [],
      [],
      0,
      {from: myAccount, gasPrice: toBN("0")}
    );

    let proposalId = 0;

    //set new delegate key
    const onboardingAddr = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddr);
    await onboarding.updateDelegateKey(dao.address, delegateKey, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Sponsor the new proposal, vote and process it
    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: delegateKey,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: delegateKey,
      gasPrice: toBN("0"),
    });
    try {
      await voting.submitVote(dao.address, proposalId, 1, {
        from: myAccount,
        gasPrice: toBN("0"),
      });
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "onlyMember");
    }
    await advanceTime(10000);
    await managing.processProposal(dao.address, proposalId, {
      from: delegateKey,
      gasPrice: toBN("0"),
    });

    //Check if the Bank Module was added to the Registry
    let newBankAddress = await dao.getAdapterAddress(sha3("onboarding"));
    assert.equal(newBankAddress.toString(), newModuleAddress.toString());
  });
});
