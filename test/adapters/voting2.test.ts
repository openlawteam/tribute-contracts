// Whole-script strict mode syntax
"use strict";

import {schemas} from "@snapshot-labs/snapshot.js";

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
const { utils } = require("ethers");
const {
  toBN,
  toWei,
  fromAscii,
  sha3,
  unitPrice,
  remaining,
  ZERO_ADDRESS,
  UNITS,
} = require("../../utils/contract-util");

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
  PixelNFT,
} = require("../../utils/oz-util");

let {schemas} = require('@snapshot-labs/snapshot.js');

const { onboardingNewMember } = require("../../utils/test-util");

describe("Adapter - Voting", () => {
  const daoOwner = accounts[1];
  const proposalCounter = proposalIdGenerator().generator;

  const getProposalCounter = () => {
    return proposalCounter().next().value;
  };
  let thisDao: any;
  let thisAdapters: any, thisExtensions: any, snapshotId : any;

  before("deploy dao", async () => {
    console.log(client);
    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
    });
    thisDao = dao;
    thisAdapters = adapters;
    thisExtensions = extensions;
    snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(snapshotId);
    snapshotId = await takeChainSnapshot();
  });

  it("should be possible to vote", async () => {
    const account2 = accounts[2];
    const dao = thisDao;
    const onboarding = thisAdapters.onboarding;
    const voting = thisAdapters.voting;

    const proposalId = getProposalCounter();
    await onboarding.submitProposal(
      dao.address,
      proposalId,
      account2,
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
    expect(vote.toString()).equal("2"); // vote should be "pass = 2"
  });

  it("should not be possible to vote twice", async () => {
    const account2 = accounts[2];
    const dao = thisDao;
    const onboarding = thisAdapters.onboarding;
    const voting = thisAdapters.voting;

    const proposalId = getProposalCounter();
    await onboarding.submitProposal(
      dao.address,
      proposalId,
      account2,
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

    await expectRevert(
      voting.submitVote(dao.address, proposalId, 2, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "member has already voted"
    );
  });

  it("should not be possible to vote with a non-member address", async () => {
    const account2 = accounts[2];
    const account3 = accounts[3];
    const dao = thisDao;
    const onboarding = thisAdapters.onboarding;
    const voting = thisAdapters.voting;

    const proposalId = getProposalCounter();
    await onboarding.submitProposal(
      dao.address,
      proposalId,
      account2,
      UNITS,
      unitPrice.mul(toBN(3)).add(remaining),
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await expectRevert(
      voting.submitVote(dao.address, proposalId, 1, {
        from: account3,
        gasPrice: toBN("0"),
      }),
      "onlyMember"
    );
  });

  it("should be possible to vote with a delegate non-member address", async () => {
    const account2 = accounts[2];
    const account3 = accounts[3];
    const dao = thisDao;
    const onboarding = thisAdapters.onboarding;
    const voting = thisAdapters.voting;
    const daoRegistryAdapter = thisAdapters.daoRegistryAdapter;

    const proposalId = getProposalCounter();
    await onboarding.submitProposal(
      dao.address,
      proposalId,
      account2,
      UNITS,
      unitPrice.mul(toBN(3)).add(remaining),
      [],
      {
        from: daoOwner,
        gasPrice: toBN("0"),
      }
    );

    await daoRegistryAdapter.updateDelegateKey(dao.address, account3, {
      from: daoOwner,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 1, {
      from: account3,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);
    const vote = await voting.voteResult(dao.address, proposalId);
    expect(vote.toString()).equal("2"); // vote should be "pass = 2"
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = thisAdapters.voting;
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
    const adapter = thisAdapters.voting;
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

  it("should be possible to update a DAO configuration if you are a member and a maintainer that holds an external governance token", async () => {
    const maintainer = accounts[5];
    // Issue OpenLaw ERC20 Basic Token for tests, only DAO maintainer will hold this token
    const tokenSupply = toBN(100000);
    const oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to the maintainer account
    await oltContract.transfer(maintainer, toBN(1));
    const maintainerBalance = await oltContract.balanceOf.call(maintainer);
    expect(maintainerBalance.toString()).equal("1");

    const { dao, adapters } = await deployDefaultDao({
      owner: daoOwner,
      maintainerTokenAddress: oltContract.address,
    });
    const voting = adapters.voting;
    const configuration = adapters.configuration;
    const configKey = sha3(
      web3.utils.encodePacked(
        "governance.role.",
        utils.getAddress(configuration.address)
      )
    );

    // Make sure the governance token configuration was created
    const governanceToken = await dao.getAddressConfiguration(configKey);
    expect(governanceToken).equal(oltContract.address);

    // Onboard the maintainer as a DAO member
    await onboardingNewMember(
      getProposalCounter(),
      dao,
      adapters.onboarding,
      voting,
      maintainer,
      daoOwner,
      unitPrice,
      UNITS
    );

    const key = sha3("key");
    const proposalId = getProposalCounter();

    // The maintainer submits a new configuration proposal
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key,
          numericValue: 99,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ],
      [],
      { from: maintainer, gasPrice: toBN("0") }
    );

    let value = await dao.getConfiguration(key);
    expect(value.toString()).equal("0");

    // The maintainer votes on the new proposal
    await voting.submitVote(dao.address, proposalId, 1, {
      from: maintainer,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    // The maintainer processes on the new proposal
    await configuration.processProposal(dao.address, proposalId, {
      from: maintainer,
      gasPrice: toBN("0"),
    });

    value = await dao.getConfiguration(key);
    expect(value.toString()).equal("99");
  });

  it("should be possible to update a DAO configuration if you are a member and a maintainer that holds an internal governance token", async () => {
    const maintainer = accounts[5];
    const { dao, adapters } = await deployDefaultDao({
      owner: daoOwner,
      maintainerTokenAddress: UNITS, // if the member holds any UNITS he is a maintainer
    });
    const voting = adapters.voting;
    const configuration = adapters.configuration;
    const configKey = sha3(
      web3.utils.encodePacked(
        "governance.role.",
        utils.getAddress(configuration.address)
      )
    );

    // Make sure the governance token configuration was created
    const governanceToken = await dao.getAddressConfiguration(configKey);
    expect(governanceToken).equal(utils.getAddress(UNITS));

    // Onboard the maintainer as a DAO member
    await onboardingNewMember(
      getProposalCounter(),
      dao,
      adapters.onboarding,
      voting,
      maintainer,
      daoOwner,
      unitPrice,
      UNITS
    );

    const key = sha3("key");
    const proposalId = getProposalCounter();

    // The maintainer submits a new configuration proposal
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key,
          numericValue: 99,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ],
      [],
      { from: maintainer, gasPrice: toBN("0") }
    );

    let value = await dao.getConfiguration(key);
    expect(value.toString()).equal("0");

    // The maintainer votes on the new proposal
    await voting.submitVote(dao.address, proposalId, 1, {
      from: maintainer,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    // The maintainer processes on the new proposal
    await configuration.processProposal(dao.address, proposalId, {
      from: maintainer,
      gasPrice: toBN("0"),
    });

    value = await dao.getConfiguration(key);
    expect(value.toString()).equal("99");
  });

  it("should be possible to update a DAO configuration if you are a member and a maintainer that holds an internal default governance token", async () => {
    const maintainer = accounts[5];
    const { dao, adapters } = await deployDefaultDao({
      owner: daoOwner,
      // if the member holds any UNITS that represents the default governance token,
      // the member is considered a maintainer.
      defaultMemberGovernanceToken: UNITS,
    });
    const voting = adapters.voting;
    const configuration = adapters.configuration;
    const configKey = sha3(web3.utils.encodePacked("governance.role.default"));

    // Make sure the governance token configuration was created
    const governanceToken = await dao.getAddressConfiguration(configKey);
    expect(governanceToken).equal(utils.getAddress(UNITS));

    // Onboard the maintainer as a DAO member
    await onboardingNewMember(
      getProposalCounter(),
      dao,
      adapters.onboarding,
      voting,
      maintainer,
      daoOwner,
      unitPrice,
      UNITS
    );

    const key = sha3("key");
    const proposalId = getProposalCounter();

    // The maintainer submits a new configuration proposal
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key,
          numericValue: 99,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ],
      [],
      { from: maintainer, gasPrice: toBN("0") }
    );

    let value = await dao.getConfiguration(key);
    expect(value.toString()).equal("0");

    // The maintainer votes on the new proposal
    await voting.submitVote(dao.address, proposalId, 1, {
      from: maintainer,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    // The maintainer processes on the new proposal
    await configuration.processProposal(dao.address, proposalId, {
      from: maintainer,
      gasPrice: toBN("0"),
    });

    value = await dao.getConfiguration(key);
    expect(value.toString()).equal("99");
  });

  it("should be possible to update a DAO configuration if you are a member and a maintainer that holds an external default governance token", async () => {
    const maintainer = accounts[5];

    // Issue OpenLaw ERC20 Basic Token for tests, only DAO maintainer will hold this token
    const tokenSupply = toBN(100000);
    const oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to the maintainer account
    await oltContract.transfer(daoOwner, toBN(1));
    const maintainerBalance = await oltContract.balanceOf.call(daoOwner);
    expect(maintainerBalance.toString()).equal("1");

    const { dao, adapters } = await deployDefaultDao({
      owner: daoOwner,
      // if the member holds any OLTs that represents an external default
      // governance token, the member is considered a maintainer.
      defaultMemberGovernanceToken: oltContract.address,
    });
    const voting = adapters.voting;
    const configuration = adapters.configuration;
    const configKey = sha3(web3.utils.encodePacked("governance.role.default"));

    // Make sure the governance token configuration was created
    const governanceToken = await dao.getAddressConfiguration(configKey);
    expect(governanceToken).equal(oltContract.address);

    // Onboard the maintainer as a DAO member
    await onboardingNewMember(
      getProposalCounter(),
      dao,
      adapters.onboarding,
      voting,
      maintainer,
      daoOwner,
      unitPrice,
      UNITS
    );

    const key = sha3("key");
    const proposalId = getProposalCounter();

    // The maintainer submits a new configuration proposal
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key,
          numericValue: 99,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ],
      [],
      { from: maintainer, gasPrice: toBN("0") }
    );

    let value = await dao.getConfiguration(key);
    expect(value.toString()).equal("0");

    // The maintainer votes on the new proposal
    await voting.submitVote(dao.address, proposalId, 1, {
      from: maintainer,
      gasPrice: toBN("0"),
    });

    await advanceTime(10000);

    // The maintainer processes on the new proposal
    await configuration.processProposal(dao.address, proposalId, {
      from: maintainer,
      gasPrice: toBN("0"),
    });

    value = await dao.getConfiguration(key);
    expect(value.toString()).equal("99");
  });

  it("should not be possible to update a DAO configuration if you are a maintainer but not a member", async () => {
    const maintainer = accounts[5]; // not a member

    // Issue OpenLaw ERC20 Basic Token for tests, only DAO maintainer will hold this token
    const tokenSupply = toBN(100000);
    const oltContract = await OLToken.new(tokenSupply);

    // Transfer OLTs to the maintainer account
    await oltContract.transfer(maintainer, toBN(1));
    const maintainerBalance = await oltContract.balanceOf.call(maintainer);
    expect(maintainerBalance.toString()).equal("1");

    const { dao, adapters } = await deployDefaultDao({
      owner: daoOwner,
      maintainerTokenAddress: oltContract.address, // only holders of the OLT token are considered maintainers
    });
    const configuration = adapters.configuration;
    const configKey = sha3(
      web3.utils.encodePacked(
        "governance.role.",
        utils.getAddress(configuration.address)
      )
    );

    // Make sure the governance token configuration was created
    const governanceToken = await dao.getAddressConfiguration(configKey);
    expect(governanceToken).equal(oltContract.address);

    let key = sha3("key");

    const proposalId = getProposalCounter();
    //Submit a new configuration proposal
    await expectRevert(
      configuration.submitProposal(
        dao.address,
        proposalId,
        [
          {
            key: key,
            numericValue: 99,
            addressValue: ZERO_ADDRESS,
            configType: 0,
          },
        ],
        [],
        { from: maintainer, gasPrice: toBN("0") }
      ),
      "onlyMember"
    );
  });

  it("should not be possible to update a DAO configuration if you are a member but not a maintainer", async () => {
    // Issue OpenLaw ERC20 Basic Token for tests, only DAO maintainer will hold this token
    const tokenSupply = toBN(100000);
    const oltContract = await OLToken.new(tokenSupply);

    const { dao, adapters } = await deployDefaultDao({
      owner: daoOwner,
      // only holders of the OLT tokens are considered
      // maintainers
      maintainerTokenAddress: oltContract.address,
    });
    const voting = adapters.voting;
    const configuration = adapters.configuration;
    const configKey = sha3(
      web3.utils.encodePacked(
        "governance.role.",
        utils.getAddress(configuration.address)
      )
    );

    // Make sure the governance token configuration was created
    const governanceToken = await dao.getAddressConfiguration(configKey);
    expect(governanceToken).equal(oltContract.address);

    let key = sha3("key");

    const proposalId = getProposalCounter();

    // The DAO owner submits a new configuration proposal
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key,
          numericValue: 99,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ],
      [],
      {
        from: daoOwner, // The DAO Owner is not a maintainer because does not hold any OLT Tokens
        gasPrice: toBN("0"),
      }
    );

    let value = await dao.getConfiguration(key);
    expect(value.toString()).equal("0");

    // The DAO owner attempts to vote on the new proposal,
    // but since he is not a maintainer (does not hold OLT tokens) the voting weight is zero
    // so the vote should not be allowed
    await expectRevert(
      voting.submitVote(dao.address, proposalId, 1, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "vote not allowed"
    );
  });

  it("should not be possible to update a DAO configuration if you are a member & maintainer that holds an external token which not implements getPriorAmount function", async () => {
    // Mint a PixelNFT to use it as an External Governance Token which does not implements
    // the getPriorAmount function. Only a DAO maintainer will hold this token.
    const externalGovToken = await PixelNFT.new(10);
    await externalGovToken.mintPixel(daoOwner, 1, 1, {
      from: daoOwner,
    });

    const { dao, adapters } = await deployDefaultDao({
      owner: daoOwner,
      // only holders of the PixelNFTs tokens are considered
      // maintainers
      maintainerTokenAddress: externalGovToken.address,
    });
    const voting = adapters.voting;
    const configuration = adapters.configuration;
    const configKey = sha3(
      web3.utils.encodePacked(
        "governance.role.",
        utils.getAddress(configuration.address)
      )
    );

    // Make sure the governance token configuration was created
    const governanceToken = await dao.getAddressConfiguration(configKey);
    expect(governanceToken).equal(externalGovToken.address);

    let key = sha3("key");

    const proposalId = getProposalCounter();

    // The DAO owner submits a new configuration proposal
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [
        {
          key: key,
          numericValue: 99,
          addressValue: ZERO_ADDRESS,
          configType: 0,
        },
      ],
      [],
      {
        from: daoOwner, // The DAO Owner is not a maintainer because does not hold any OLT Tokens
        gasPrice: toBN("0"),
      }
    );

    let value = await dao.getConfiguration(key);
    expect(value.toString()).equal("0");

    // The DAO owner attempts to vote on the new proposal,
    // but since he is not a maintainer (does not hold OLT tokens) the voting weight is zero
    // so the vote should not be allowed
    await expectRevert(
      voting.submitVote(dao.address, proposalId, 1, {
        from: daoOwner,
        gasPrice: toBN("0"),
      }),
      "getPriorAmount not implemented"
    );
  });
});
