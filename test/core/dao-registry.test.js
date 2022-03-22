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
  toWei,
  toBN,
  fromAscii,
  fromUtf8,
  ETH_TOKEN,
  sha3,
  ZERO_ADDRESS,
  MEMBER_COUNT,
  DAI_TOKEN,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  DaoRegistry,
  BankExtension,
  web3,
  getAccounts,
  getSigners,
  getCurrentBlockNumber,
  expectEvent,
  advanceTime,
  txSigner,
} = require("../../utils/hardhat-test-util");

describe("Core - DaoRegistry", () => {
  let accounts, owner, creator, signers;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    signers = await getSigners();
    owner = accounts[0];
    creator = accounts[1];

    const { dao, extensions, factories } = await deployDefaultDao({
      owner,
    });
    this.dao = dao;
    this.extensions = extensions;
    this.factories = factories;
    this.snapshotId = await takeChainSnapshot();
  });

  beforeEach(async () => {
    await revertChainSnapshot(this.snapshotId);
    this.snapshotId = await takeChainSnapshot();
  });

  describe("Adapters", async () => {
    it("should be possible to replace an adapter when the id is already in use", async () => {
      const adapterId = fromUtf8("1");
      const adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const newAdapterAddr = "0xd7bCe30D77DE56E3D21AEfe7ad144b3134438F5B";
      const registry = await DaoRegistry.new();
      //Add a module with id 1
      await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
      await registry.replaceAdapter(adapterId, newAdapterAddr, 0, [], []);
      const address = await registry.getAdapterAddress(adapterId);
      expect(address).equal(newAdapterAddr);
    });

    it("should be possible to add an adapter with a valid id and address", async () => {
      const adapterId = fromUtf8("1");
      const adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const registry = await DaoRegistry.new();
      await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
      const address = await registry.getAdapterAddress(adapterId);
      expect(address).equal(adapterAddr);
    });

    it("should be possible to add an adapter with dao configurations", async () => {
      const adapterId = fromUtf8("1");
      const adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const registry = await DaoRegistry.new();
      await registry.replaceAdapter(
        adapterId,
        adapterAddr,
        0,
        [sha3("config1"), sha3("config2")],
        [1, 2]
      );
      expect(await registry.getAdapterAddress(adapterId)).equal(adapterAddr);
      expect(
        (await registry.getConfiguration(sha3("config1"))).toString()
      ).equal("1");
      expect(
        (await registry.getConfiguration(sha3("config2"))).toString()
      ).equal("2");
    });

    it("should be possible to remove an adapter when 0x0 address is provided", async () => {
      const adapterId = fromUtf8("2");
      const adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const registry = await DaoRegistry.new();
      await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
      const address = await registry.getAdapterAddress(adapterId);
      expect(address).equal(adapterAddr);
      // Remove the adapter using 0x0 address
      await registry.replaceAdapter(adapterId, ETH_TOKEN, 0, [], []);
      await expect(registry.getAdapterAddress(adapterId)).to.be.revertedWith(
        "adapter not found"
      );
    });

    it("should be possible to replace an existing adapter", async () => {
      const adapterId = fromUtf8("2");
      const adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const registry = await DaoRegistry.new();
      await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
      expect(await registry.getAdapterAddress(adapterId)).equal(adapterAddr);

      const newAdapterAddr = "0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8";
      await registry.replaceAdapter(adapterId, newAdapterAddr, 0, [], []);
      expect(await registry.getAdapterAddress(adapterId)).equal(newAdapterAddr);
    });

    it("should be possible to get the adapter address by id", async () => {
      const adapterId = fromUtf8("2");
      const adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const registry = await DaoRegistry.new();
      await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
      expect(await registry.getAdapterAddress(adapterId)).equal(adapterAddr);
    });

    it("should return true if an address is an adapter contract", async () => {
      const adapterId = fromUtf8("1");
      const adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const registry = await DaoRegistry.new();
      await registry.replaceAdapter(adapterId, adapterAddr, 0, [], []);
      expect(await registry.isAdapter(adapterAddr)).to.be.true;
    });

    it("should return false if an address is not an adapter contract", async () => {
      const adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const registry = await DaoRegistry.new();
      expect(await registry.isAdapter(adapterAddr)).to.be.false;
    });

    it("should not be possible to add an adapter with invalid id", async () => {
      const adapter = fromUtf8("");
      const address = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const registry = await DaoRegistry.new();
      await expect(
        registry.replaceAdapter(adapter, address, 0, [], [])
      ).to.be.revertedWith("adapterId must not be empty");
    });

    it("should be possible to add an adapter with invalid id", async () => {
      const adapter = fromUtf8("");
      const address = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const registry = await DaoRegistry.new();
      await expect(
        registry.replaceAdapter(adapter, address, 0, [], [])
      ).to.be.revertedWith("adapterId must not be empty");
    });

    it("should not be possible to get adapter address by id if it is not registered", async () => {
      const adapter = fromUtf8("");
      const registry = await DaoRegistry.new();
      await expect(registry.getAdapterAddress(adapter)).to.be.revertedWith(
        "adapter not found"
      );
    });

    it("should not be possible to add an adapter with invalid id", async () => {
      const adapterId = fromUtf8("");
      const adapterAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const registry = await DaoRegistry.new();
      await expect(
        registry.replaceAdapter(adapterId, adapterAddr, 0, [], [])
      ).to.be.revertedWith("adapterId must not be empty");
    });

    it("should not be possible to remove an adapter with an empty id", async () => {
      const adapterId = fromUtf8("");
      const registry = await DaoRegistry.new();
      await expect(
        registry.replaceAdapter(adapterId, ETH_TOKEN, 0, [], [])
      ).to.be.revertedWith("adapterId must not be empty");
    });
  });

  describe("Extensions", async () => {
    it("should be possible to add an extension that was already initialized", async () => {
      const extensionId = sha3("bank");
      const bankExt = this.extensions.bankExt;
      const registry = await DaoRegistry.new();
      await expectEvent(
        registry.addExtension(extensionId, bankExt.address),
        "ExtensionAdded",
        extensionId,
        bankExt.address
      );
    });

    it("should be possible to add an extension with valid id and address", async () => {
      const extensionId = sha3("bank");
      const registry = await DaoRegistry.new();
      await registry.initialize(creator, owner);
      await this.factories.bankExtFactory.create(registry.address, 10);
      const bankAddress =
        await this.factories.bankExtFactory.getExtensionAddress(
          registry.address
        );
      await registry.addExtension(extensionId, bankAddress);
      const address = await registry.getExtensionAddress(extensionId);
      expect(address).equal(bankAddress);
    });

    it("should be possible to remove an extension", async () => {
      const extensionId = sha3("bank");
      const registry = await DaoRegistry.new();
      await registry.initialize(creator, owner);
      await this.factories.bankExtFactory.create(registry.address, 10);
      const bankAddress =
        await this.factories.bankExtFactory.getExtensionAddress(
          registry.address
        );
      await registry.addExtension(extensionId, bankAddress);
      await registry.removeExtension(extensionId);
      await expect(
        registry.getExtensionAddress(extensionId)
      ).to.be.revertedWith("extension not found");
    });

    it("should return true if an address is an extension contract", async () => {
      const extensionId = sha3("bank");
      const registry = await DaoRegistry.new();
      await registry.initialize(creator, owner);
      await this.factories.bankExtFactory.create(registry.address, 10);
      const bankAddress =
        await this.factories.bankExtFactory.getExtensionAddress(
          registry.address
        );
      await registry.addExtension(extensionId, bankAddress);
      expect(await registry.isExtension(bankAddress)).to.be.true;
    });

    it("should return false if an address is not an extension contract", async () => {
      const extensionAddr = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      const registry = await DaoRegistry.new();
      expect(await registry.isExtension(extensionAddr)).to.be.false;
    });

    it("should be possible to get an extension address by the extension id", async () => {
      const extensionId = sha3("bank");
      const registry = await DaoRegistry.new();
      await registry.initialize(creator, owner);
      await this.factories.bankExtFactory.create(registry.address, 10);
      const bankAddress =
        await this.factories.bankExtFactory.getExtensionAddress(
          registry.address
        );
      await registry.addExtension(extensionId, bankAddress);
      expect(await registry.getExtensionAddress(extensionId)).to.be.equal(
        bankAddress
      );
    });

    it("should not be possible to get an extension address by the extension id if the extension is not registered", async () => {
      const extensionId = sha3("bank");
      const registry = await DaoRegistry.new();
      await expect(
        registry.getExtensionAddress(extensionId)
      ).to.be.revertedWith("extension not found");
    });

    it("should not be possible to re-add an extension", async () => {
      const extensionId = sha3("bank");
      const registry = await DaoRegistry.new();
      await registry.initialize(creator, owner);
      await this.factories.bankExtFactory.create(registry.address, 10);
      const bankAddressA =
        await this.factories.bankExtFactory.getExtensionAddress(
          registry.address
        );

      await this.factories.bankExtFactory.create(registry.address, 5);
      const bankAddressB =
        await this.factories.bankExtFactory.getExtensionAddress(
          registry.address
        );

      await registry.addExtension(extensionId, bankAddressA);
      await expect(
        registry.addExtension(extensionId, bankAddressB)
      ).to.be.revertedWith("extensionId already in use");
    });

    it("should not be possible to remove an extension with an empty id", async () => {
      const extensionId = fromUtf8("");
      const registry = await DaoRegistry.new();
      await registry.potentialNewMember(owner);
      await expect(registry.removeExtension(extensionId)).to.be.revertedWith(
        "extensionId must not be empty"
      );
    });

    it("should not be possible to add an extension using a duplicate id but different address", async () => {
      const extensionId = sha3("bank");
      const registry = await DaoRegistry.new();
      await registry.initialize(creator, owner);
      await this.factories.bankExtFactory.create(registry.address, 10);
      const bankAddress =
        await this.factories.bankExtFactory.getExtensionAddress(
          registry.address
        );
      await registry.addExtension(extensionId, bankAddress);
      await registry.removeExtension(extensionId);
      await expect(
        registry.addExtension(extensionId, bankAddress)
      ).to.be.revertedWith("extension can not be re-added");
    });

    it("should not be possible to remove a non registered extension", async () => {
      const extensionId = sha3("bank");
      const registry = await DaoRegistry.new();
      await registry.potentialNewMember(owner);
      await expect(registry.removeExtension(extensionId)).to.be.revertedWith(
        "extensionId not registered"
      );
    });
  });

  describe("Members", async () => {
    describe("Onboard", async () => {
      it("should be possible to register a member with a valid address", async () => {
        const registry = await DaoRegistry.new();
        const newMember = accounts[1];
        await registry.potentialNewMember(newMember);
        expect(await registry.isMember(newMember)).equal(true);
        const flags = await registry.members(newMember);
        expect(flags.toString()).to.be.equal("1"); //EXISTS
      });

      it.skip("should update the member count in bank extension when a new member is added and the extension is registered", async () => {
        const extensionId = sha3("bank");
        const registry = await DaoRegistry.new();
        await registry.potentialNewMember(owner);
        await this.factories.bankExtFactory.create(registry.address, 10);
        const bankAddress =
          await this.factories.bankExtFactory.getExtensionAddress(
            registry.address
          );
        await registry.addExtension(extensionId, bankAddress);
        const address = await registry.getExtensionAddress(extensionId);
        expect(address).equal(bankAddress);

        const newMember = accounts[1];
        await registry.potentialNewMember(newMember);

        const newBank = await BankExtension.at(bankAddress);
        const count = await newBank.balanceOf(registry.address, MEMBER_COUNT);
        expect(count.toString()).to.be.equal("1");
      });

      it("should not be possible to register a member with a zero address", async () => {
        const registry = await DaoRegistry.new();
        await expect(
          registry.potentialNewMember(ZERO_ADDRESS)
        ).to.be.revertedWith("invalid member address");
      });

      it("should not be possible to register a member more than once", async () => {
        const registry = await DaoRegistry.new();
        const newMember = accounts[1];
        await registry.potentialNewMember(newMember);
        await expect(registry.potentialNewMember(newMember)).to.be.revertedWith(
          "accessDenied"
        );
      });

      it("should return false for a zero address because it is not a member", async () => {
        const registry = await DaoRegistry.new();
        expect(await registry.isMember(ZERO_ADDRESS)).equal(false);
      });
    });

    describe("Delegate", async () => {
      it("should be possible to add a delegate key", async () => {
        const registry = await DaoRegistry.new();
        await registry.potentialNewMember(owner);
        const delegate = accounts[2];
        await expectEvent(
          registry.updateDelegateKey(owner, delegate),
          "UpdateDelegateKey",
          owner,
          delegate
        );
      });

      it("should not be possible to add a delegate key if the member does not exist", async () => {
        const registry = await DaoRegistry.new();
        const delegate = accounts[2];
        await expect(
          registry.updateDelegateKey(owner, delegate)
        ).to.be.revertedWith("member does not exist");
      });

      it("should not be possible to use zero address as delegate", async () => {
        const registry = await DaoRegistry.new();
        await registry.potentialNewMember(owner);
        await expect(
          registry.updateDelegateKey(owner, ZERO_ADDRESS)
        ).to.be.revertedWith("newDelegateKey cannot be 0");
      });

      it("should not be possible to overwrite a delegate", async () => {
        const delegate = accounts[1];
        const memberA = accounts[2];
        const memberB = accounts[3];
        const registry = await DaoRegistry.new();
        await registry.potentialNewMember(owner);
        await registry.potentialNewMember(memberA);
        await registry.potentialNewMember(memberB);

        await registry.updateDelegateKey(memberA, delegate);

        await expect(
          registry.updateDelegateKey(memberB, delegate)
        ).to.be.revertedWith("cannot overwrite existing delegated keys");
      });

      it("should not be possible to use a delegate to update a delegate", async () => {
        const delegateA = accounts[1];
        const delegateB = accounts[2];
        const memberA = accounts[3];
        const registry = await DaoRegistry.new();
        await registry.potentialNewMember(owner);
        await registry.potentialNewMember(memberA);

        await registry.updateDelegateKey(memberA, delegateA);

        await expect(
          registry.updateDelegateKey(delegateA, delegateA)
        ).to.be.revertedWith("address already taken as delegated key");
      });

      it("should be possible to get the member address by delegate", async () => {
        const delegateA = accounts[1];
        const memberA = accounts[3];
        const registry = await DaoRegistry.new();
        await registry.potentialNewMember(owner);
        await registry.potentialNewMember(memberA);

        await registry.updateDelegateKey(memberA, delegateA);

        expect(await registry.getAddressIfDelegated(delegateA)).to.be.equal(
          memberA
        );
      });

      it("should be return the provided address if it is not a delegate", async () => {
        const delegateA = accounts[1];
        const delegateB = accounts[2];
        const memberA = accounts[3];
        const registry = await DaoRegistry.new();
        await registry.potentialNewMember(owner);
        await registry.potentialNewMember(memberA);

        await registry.updateDelegateKey(memberA, delegateA);

        expect(await registry.getAddressIfDelegated(delegateA)).to.be.equal(
          memberA
        );

        expect(await registry.getAddressIfDelegated(delegateB)).to.be.equal(
          delegateB
        );
      });

      it("should be possible to get the current delegate by member", async () => {
        const delegateA = accounts[1];
        const memberA = accounts[3];
        const registry = await DaoRegistry.new();
        await registry.potentialNewMember(owner);
        await registry.potentialNewMember(memberA);

        await registry.updateDelegateKey(memberA, delegateA);

        expect(await registry.getCurrentDelegateKey(memberA)).to.be.equal(
          delegateA
        );
      });

      it("should return the member address if there is no previous delegate by member", async () => {
        const delegateA = accounts[1];
        const memberA = accounts[3];
        const registry = await DaoRegistry.new();
        await registry.potentialNewMember(owner);
        await registry.potentialNewMember(memberA);

        await registry.updateDelegateKey(memberA, delegateA);
        expect(await registry.getPreviousDelegateKey(memberA)).to.be.equal(
          memberA
        );
      });

      it("should be possible to get the previous delegate by member", async () => {
        const delegateA = accounts[1];
        const delegateB = accounts[2];
        const memberA = accounts[3];
        const registry = await DaoRegistry.new();
        await registry.potentialNewMember(owner);
        await registry.potentialNewMember(memberA);

        await registry.updateDelegateKey(memberA, delegateA);
        expect(await registry.getPreviousDelegateKey(memberA)).to.be.equal(
          memberA
        );

        await registry.updateDelegateKey(memberA, delegateB);
        expect(await registry.getPreviousDelegateKey(memberA)).to.be.equal(
          delegateA
        );
        expect(await registry.getCurrentDelegateKey(memberA)).to.be.equal(
          delegateB
        );
      });
    });

    it("should return the member address if the prior delegate has no checkpoints in a valid block", async () => {
      const delegateA = accounts[1];
      const memberA = accounts[3];
      const registry = await DaoRegistry.new();
      await registry.potentialNewMember(owner);
      await registry.potentialNewMember(memberA);

      const blockNumber = await getCurrentBlockNumber();
      await registry.updateDelegateKey(memberA, delegateA);

      expect(
        await registry.getPriorDelegateKey(memberA, blockNumber)
      ).to.be.equal(memberA);
    });

    it("should return the member delegate prior to the valid block", async () => {
      const delegateA = accounts[1];
      const delegateB = accounts[2];
      const memberA = accounts[3];
      const registry = await DaoRegistry.new();
      await registry.potentialNewMember(owner);
      await registry.potentialNewMember(memberA);

      await registry.updateDelegateKey(memberA, delegateA);
      await advanceTime(2000);

      const blockNumber = await getCurrentBlockNumber();
      await registry.updateDelegateKey(memberA, delegateB);
      await advanceTime(2000);

      expect(
        await registry.getPriorDelegateKey(memberA, blockNumber)
      ).to.be.equal(delegateA);
    });

    it("should not be possible to get the prior delegate by member with an invalid block", async () => {
      const delegateA = accounts[1];
      const memberA = accounts[3];
      const registry = await DaoRegistry.new();
      await registry.potentialNewMember(owner);
      await registry.potentialNewMember(memberA);
      const blockNumber = await getCurrentBlockNumber();

      await registry.updateDelegateKey(memberA, delegateA);

      await expect(
        registry.getPriorDelegateKey(memberA, blockNumber + 1)
      ).to.be.revertedWith("getPriorDelegateKey: NYD");
    });
  });

  describe("Proposals", async () => {
    describe("Submit", async () => {
      it("should be possible to submit a proposal", async () => {
        const dao = await DaoRegistry.new();
        const proposalId = fromUtf8("proposal1");
        await expectEvent(
          dao.submitProposal(proposalId),
          "SubmittedProposal",
          "0x70726f706f73616c310000000000000000000000000000000000000000000000",
          "1"
        );
        const proposal = await dao.proposals(proposalId);
        expect(proposal.adapterAddress).to.be.equal(owner); // owner sent the tx
        expect(proposal.flags.toString()).to.be.equal("1");
        // Exists
        expect(await dao.getProposalFlag(proposalId, 0)).to.be.true;
        // Not sponsored
        expect(await dao.getProposalFlag(proposalId, 1)).to.be.false;
        // Not processed
        expect(await dao.getProposalFlag(proposalId, 2)).to.be.false;
      });

      it("should return false if the proposal does not exist", async () => {
        expect(await this.dao.getProposalFlag(sha3(fromUtf8("proposal1")), 0))
          .to.be.false;
      });

      it("should not be possible to submit a proposal more than once", async () => {
        const dao = await DaoRegistry.new();
        const proposalId = fromUtf8("proposal1");
        await dao.submitProposal(proposalId);
        await expect(dao.submitProposal(proposalId)).to.be.revertedWith(
          "proposalId must be unique"
        );
      });
    });

    describe("Sponsor", async () => {
      it("should be possible to sponsor a proposal", async () => {
        const dao = await DaoRegistry.new();
        await dao.potentialNewMember(owner);
        const fakeVotingAdapter = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
        const proposalId = fromUtf8("proposal1");
        await dao.submitProposal(proposalId);
        await expectEvent(
          dao.sponsorProposal(proposalId, owner, fakeVotingAdapter),
          "SponsoredProposal",
          "0x70726f706f73616c310000000000000000000000000000000000000000000000",
          "3", // Sponsored flag
          fakeVotingAdapter
        );
        const proposal = await dao.proposals(proposalId);
        expect(proposal.adapterAddress).to.be.equal(owner); // owner sent the tx
        expect(proposal.flags.toString()).to.be.equal("3"); // sponsored
        // Exists
        expect(await dao.getProposalFlag(proposalId, 0)).to.be.true;
        // Sponsored
        expect(await dao.getProposalFlag(proposalId, 1)).to.be.true;
        // Not processed
        expect(await dao.getProposalFlag(proposalId, 2)).to.be.false;
      });

      it("should not be possible to sponsor if the sponsor is not a member/adapter", async () => {
        const dao = await DaoRegistry.new();
        await dao.potentialNewMember(owner);
        const nonMember = accounts[2];
        const fakeVotingAdapter = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
        const proposalId = fromUtf8("proposal1");
        await dao.submitProposal(proposalId);

        await expect(
          dao.sponsorProposal(proposalId, nonMember, fakeVotingAdapter)
        ).to.be.revertedWith("onlyMember");
      });

      it("should not be possible to sponsor a proposal if the sponsor is not the submitter", async () => {
        const dao = await DaoRegistry.new();
        await dao.potentialNewMember(owner);
        const submitter = accounts[1];
        await dao.potentialNewMember(submitter);
        const invalidSponsor = accounts[2];
        await dao.potentialNewMember(invalidSponsor, { from: submitter });
        // Register the submitter as an adapter to be able to set the proposal flags
        await dao.replaceAdapter(
          fromUtf8("submitterAdapter"),
          submitter,
          0,
          [],
          []
        );

        const proposalId = fromUtf8("proposal1");
        await dao.submitProposal(proposalId, {
          from: submitter,
        }); // a valid submitter

        await expect(
          dao.sponsorProposal(proposalId, invalidSponsor, submitter, {
            from: invalidSponsor, // invalid sponsor attempts to sponsor that proposal
          })
        ).to.be.revertedWith("invalid adapter try to set flag");
      });

      it("should not be possible to sponsor a proposal more than once", async () => {
        const dao = await DaoRegistry.new();
        await dao.potentialNewMember(owner);
        const fakeVotingAdapter = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
        const proposalId = fromUtf8("proposal1");
        await dao.submitProposal(proposalId);
        await dao.sponsorProposal(proposalId, owner, fakeVotingAdapter);
        await dao.processProposal(proposalId);

        await expect(
          dao.sponsorProposal(proposalId, owner, fakeVotingAdapter)
        ).to.be.revertedWith("flag already set");
      });
    });

    describe("Process", async () => {
      it("should be possible to process a proposal", async () => {
        const dao = await DaoRegistry.new();
        await dao.potentialNewMember(owner);
        const fakeVotingAdapter = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
        const proposalId = fromUtf8("proposal1");
        await dao.submitProposal(proposalId);
        await dao.sponsorProposal(proposalId, owner, fakeVotingAdapter);
        await expectEvent(
          dao.processProposal(proposalId),
          "ProcessedProposal",
          "0x70726f706f73616c310000000000000000000000000000000000000000000000",
          "7" // processed flag
        );

        const proposal = await dao.proposals(proposalId);
        expect(proposal.adapterAddress).to.be.equal(owner); // owner sent the tx
        expect(proposal.flags.toString()).to.be.equal("7"); // processed
        // Exists
        expect(await dao.getProposalFlag(proposalId, 0)).to.be.true;
        // Sponsored
        expect(await dao.getProposalFlag(proposalId, 1)).to.be.true;
        // Processed
        expect(await dao.getProposalFlag(proposalId, 2)).to.be.true;
      });

      it("should be possible to process a proposal more than once", async () => {
        const dao = await DaoRegistry.new();
        await dao.potentialNewMember(owner);
        const fakeVotingAdapter = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
        const proposalId = fromUtf8("proposal1");
        await dao.submitProposal(proposalId);
        await dao.sponsorProposal(proposalId, owner, fakeVotingAdapter);
        await dao.processProposal(proposalId);

        await expect(dao.processProposal(proposalId)).to.be.revertedWith(
          "flag already set"
        );
      });
    });
  });

  describe.skip("Configurations", async () => {
    //TODO
  });

  describe("Access Control", async () => {
    it("should not be possible to call initialize more than once", async () => {
      await expect(this.dao.initialize(creator, owner)).to.be.revertedWith(
        "dao already initialized"
      );
    });

    it.skip("should not be possible to call finalizeDao if the sender is not an active member or an adapter", async () => {
      await expect(
        txSigner(signers[2], this.dao).finalizeDao({ from: creator })
      ).to.be.revertedWith("not allowed to finalize");
    });

    it("should not be possible to call setConfiguration without the SET_CONFIGURATION permission", async () => {
      await expect(
        this.dao.setConfiguration(sha3("config1"), 1)
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call setAddressConfiguration without the SET_CONFIGURATION permission", async () => {
      await expect(
        this.dao.setAddressConfiguration(sha3("config1"), DAI_TOKEN)
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call replaceAdapter without the REPLACE_ADAPTER permission", async () => {
      await expect(
        this.dao.replaceAdapter(sha3("adapter1"), accounts[2], 1, [], [])
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call addExtension without the ADD_EXTENSION permission", async () => {
      await expect(
        this.dao.addExtension(sha3("extension1"), accounts[2])
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call removeExtension without the REMOVE_EXTENSION permission", async () => {
      await expect(
        this.dao.removeExtension(sha3("extension1"))
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call setAclToExtensionForAdapter without the ADD_EXTENSION permission", async () => {
      await expect(
        this.dao.setAclToExtensionForAdapter(accounts[2], accounts[3], 1)
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call submitProposal without the SUBMIT_PROPOSAL permission", async () => {
      await expect(
        this.dao.submitProposal(sha3(fromUtf8("proposal1")))
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call jailMember without the JAIL_MEMBER permission", async () => {
      await expect(this.dao.jailMember(owner)).to.be.revertedWith(
        "accessDenied"
      );
    });

    it("should not be possible to call unjailMember without the JAIL_MEMBER permission", async () => {
      await expect(this.dao.unjailMember(owner)).to.be.revertedWith(
        "accessDenied"
      );
    });

    it("should not be possible to call potentialNewMember without the NEW_MEMBER permission", async () => {
      await expect(this.dao.potentialNewMember(owner)).to.be.revertedWith(
        "accessDenied"
      );
    });

    it("should not be possible to call updateDelegateKey without the UPDATE_DELEGATE_KEY permission", async () => {
      await expect(
        this.dao.updateDelegateKey(owner, accounts[2])
      ).to.be.revertedWith("accessDenied");
    });

    //TODO lock, unlock
  });

  describe("General", async () => {
    it("should not be possible to send ETH to the DaoRegistry via receive function", async () => {
      const registry = await DaoRegistry.new();
      await expect(
        web3.eth.sendTransaction({
          to: registry.address,
          from: accounts[0],
          gasPrice: toBN("0"),
          value: toWei("1"),
        })
      ).to.be.revertedWith("revert");
    });

    it("should not be possible to send ETH to the DaoRegistry via fallback function", async () => {
      const registry = await DaoRegistry.new();
      await expect(
        web3.eth.sendTransaction({
          to: registry.address,
          from: accounts[0],
          gasPrice: toBN("0"),
          value: toWei("1"),
          data: fromAscii("should go to fallback func"),
        })
      ).to.be.revertedWith("revert");
    });
  });
});
