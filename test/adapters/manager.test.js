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
  TOTAL,
  GUILD,
  ZERO_ADDRESS,
  sha3,
} = require("../../utils/ContractUtil.js");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime,
  accounts,
  expect,
  expectRevert,
  web3,
  DaoRegistryAdapterContract,
  ManagerContract,
  FinancingContract,
  NFTExtension,
  VotingContract,
} = require("../../utils/OZTestUtil.js");

const { entryDao, entryBank } = require("../../utils/DeploymentUtil.js");
const { SigUtilSigner } = require("@openlaw/snapshot-js-erc712");

const daoOwner = accounts[1];
const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

const signer = {
  address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
  privKey: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
};

//////////////////////////

const generateCouponSignature = ({
  daoAddress,
  managerAddress,
  proposal,
  configs,
  nonce,
  chainId,
}) => {
  const signerUtil = SigUtilSigner(signer.privKey);
  const messageData = {
    type: "manager-coupon",
    daoAddress,
    proposal,
    configs,
    nonce,
  };
  const signature = signerUtil(
    messageData,
    daoAddress,
    managerAddress,
    chainId
  );

  return signature;
};

describe("Adapter - Manager", () => {
  const chainId = 1;

  before("deploy dao", async () => {
    const { dao, adapters, extensions } = await deployDefaultDao({
      owner: daoOwner,
      managerSignerAddress: signer.address,
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

  it("should not be possible to send ETH to the adapter", async () => {
    const manager = this.adapters.manager;
    await expectRevert(
      web3.eth.sendTransaction({
        to: manager.address,
        from: daoOwner,
        gasPrice: toBN("0"),
        value: toWei(toBN("1"), "ether"),
      }),
      "Returned error: VM Exception while processing transaction: revert fallback revert"
    );
  });

  it("should not be possible to submit a new adapter with more keys than values", async () => {
    const dao = this.dao;
    const manager = this.adapters.manager;
    const newAdapterId = sha3("bank");
    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;
    const proposal = {
      adapterOrExtensionId: newAdapterId,
      adapterOrExtensionAddr: GUILD,
      updateType: 1,
      flags: 0,
      keys: [
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        "0x0000000000000000000000000000000000000000000000000000000000000004",
      ], // 3 keys
      values: [], // 0 values
      extensionAddresses: [],
      extensionAclFlags: [],
    };

    const signature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: manager.address,
      chainId,
      proposal,
      configs: [],
      nonce,
    });

    await expectRevert(
      manager.processSignedProposal(
        dao.address,
        proposal,
        [], //configs
        nonce,
        signature
      ),
      "must be an equal number of config keys and values"
    );
  });

  it("should not be possible to propose a new adapter with more keys than values", async () => {
    const dao = this.dao;
    const manager = this.adapters.manager;
    const newAdapterId = sha3("bank");
    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;

    const proposal = {
      adapterOrExtensionId: newAdapterId,
      adapterOrExtensionAddr: GUILD,
      updateType: 1,
      flags: 0,
      keys: [
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        "0x0000000000000000000000000000000000000000000000000000000000000004",
      ], // 3 keys
      values: [], // 0 values
      extensionAddresses: [],
      extensionAclFlags: [],
    };

    const signature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: manager.address,
      chainId,
      proposal,
      configs: [],
      nonce,
    });

    await expectRevert(
      manager.processSignedProposal(
        dao.address,
        proposal,
        [],
        nonce,
        signature
      ),
      "must be an equal number of config keys and values"
    );
  });

  it("should not be possible to propose a new adapter with more values than keys", async () => {
    const dao = this.dao;
    const manager = this.adapters.manager;
    const newAdapterId = sha3("bank");
    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;

    const proposal = {
      adapterOrExtensionId: newAdapterId,
      adapterOrExtensionAddr: GUILD,
      updateType: 1,
      flags: 0,
      keys: [], // 0 keys
      values: [1, 2, 3], // 3 values
      extensionAddresses: [],
      extensionAclFlags: [],
    };

    const signature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: manager.address,
      chainId,
      proposal,
      configs: [],
      nonce,
    });

    await expectRevert(
      manager.processSignedProposal(
        dao.address,
        proposal,
        [],
        nonce,
        signature
      ),
      "must be an equal number of config keys and values"
    );
  });

  it("should not be possible to propose a new adapter using a reserved address", async () => {
    const dao = this.dao;
    const manager = this.adapters.manager;
    const newAdapterId = sha3("bank");
    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;

    const proposal = {
      adapterOrExtensionId: newAdapterId,
      adapterOrExtensionAddr: GUILD,
      updateType: 1,
      flags: 0,
      keys: [], // 0 keys
      values: [], // 3 values
      extensionAddresses: [],
      extensionAclFlags: [],
    };

    const signature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: manager.address,
      chainId,
      proposal,
      configs: [],
      nonce,
    });

    await expectRevert(
      manager.processSignedProposal(
        dao.address,
        proposal,
        [],
        nonce,
        signature
      ),
      "address is reserved"
    );
  });

  it("should be possible to remove an adapter if 0x0 is used as the adapter address", async () => {
    const dao = this.dao;
    const manager = this.adapters.manager;
    const adapterIdToRemove = sha3("onboarding");
    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;

    const proposal = {
      adapterOrExtensionId: adapterIdToRemove,
      adapterOrExtensionAddr: ZERO_ADDRESS,
      updateType: 1,
      flags: 0,
      keys: [], // 0 keys
      values: [], // 3 values
      extensionAddresses: [],
      extensionAclFlags: [],
    };

    const signature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: manager.address,
      chainId,
      proposal,
      configs: [],
      nonce,
    });

    // Proposal to remove the Onboading adapter
    await manager.processSignedProposal(
      dao.address,
      proposal,
      [],
      nonce,
      signature
    );

    //Check if the adapter was removed from the Registry
    await expectRevert(
      dao.getAdapterAddress(sha3("onboarding")),
      "adapter not found"
    );
  });

  it("should be possible to replace the manager adapter", async () => {
    const dao = this.dao;
    const manager = this.adapters.manager;
    const newManager = await ManagerContract.new();
    const newManagerId = sha3("manager");
    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;
    const { flags } = entryDao("manager", newManager, {
      SUBMIT_PROPOSAL: true,
      REPLACE_ADAPTER: true,
    });
    const proposal = {
      adapterOrExtensionId: newManagerId,
      adapterOrExtensionAddr: newManager.address,
      updateType: 1,
      flags,
      keys: [],
      values: [],
      extensionAddresses: [],
      extensionAclFlags: [],
    };
    const signature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: manager.address,
      chainId,
      proposal,
      configs: [],
      nonce,
    });

    await manager.processSignedProposal(
      dao.address,
      proposal,
      [], //configs
      nonce,
      signature
    );

    //Check if the new adapter was added to the Registry
    const newAddress = await dao.getAdapterAddress(newManagerId);
    expect(newAddress).equal(newManager.address);

    // Lets try to remove the financing adapter using the new
    // managing adapter to test its permission flags
    const financingAdapterId = sha3("financing");
    const newProposal = {
      adapterOrExtensionId: financingAdapterId,
      adapterOrExtensionAddr: ZERO_ADDRESS,
      updateType: 1,
      flags,
      keys: [],
      values: [],
      extensionAddresses: [],
      extensionAclFlags: [],
    };
    const newSignature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: newManager.address,
      chainId,
      proposal: newProposal,
      configs: [],
      nonce: nonce + 1,
    });

    await newManager.processSignedProposal(
      dao.address,
      newProposal,
      [], //configs
      nonce + 1,
      newSignature
    );

    await expectRevert(
      dao.getAdapterAddress(financingAdapterId),
      "adapter not found"
    );
  });

  it("should not be possible to add a new adapter using an address that is already registered", async () => {
    const dao = this.dao;
    const manager = this.adapters.manager;
    const voting = this.adapters.voting;
    const newAdapterId = sha3("financing");
    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;
    const proposal = {
      adapterOrExtensionId: newAdapterId,
      adapterOrExtensionAddr: voting.address, // using the voting.address as the new financing adapter address
      updateType: 1,
      flags: 0,
      keys: [],
      values: [],
      extensionAddresses: [],
      extensionAclFlags: [],
    };

    const signature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: manager.address,
      chainId,
      proposal,
      configs: [],
      nonce,
    });

    await expectRevert(
      manager.processSignedProposal(
        dao.address,
        proposal,
        [],
        nonce,
        signature
      ),
      "adapterAddress already in use"
    );
  });

  it("should be possible to add a new adapter and set the acl flags for some extension", async () => {
    const dao = this.dao;
    const manager = this.adapters.manager;
    const financing = await FinancingContract.new();
    const bankExt = this.extensions.bank;

    const newAdapterId = sha3("testFinancing");
    const newAdapterAddress = financing.address;
    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;
    const proposal = {
      adapterOrExtensionId: newAdapterId,
      adapterOrExtensionAddr: newAdapterAddress,
      updateType: 1,
      flags: 0,
      keys: [],
      values: [],
      // Set the extension address which will be accessed by the new adapter
      extensionAddresses: [bankExt.address],
      // Set the acl flags so the new adapter can access the bank extension
      extensionAclFlags: [
        entryBank(financing, {
          ADD_TO_BALANCE: true,
          SUB_FROM_BALANCE: true,
          INTERNAL_TRANSFER: true,
        }).flags,
      ],
    };

    const signature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: manager.address,
      chainId,
      proposal,
      configs: [],
      nonce,
    });

    await manager.processSignedProposal(
      dao.address,
      proposal,
      [],
      nonce,
      signature
    );

    // At this point the adapter should be able access the Bank Extension
    // We check that by verifying if the ACL flag in the DAO matches the one
    // submitted in the proposal.

    /**
     * Bank flags
     * 0: ADD_TO_BALANCE
     * 1: SUB_FROM_BALANCE
     * 2: INTERNAL_TRANSFER
     * 3: WITHDRAW
     * 4: REGISTER_NEW_TOKEN
     * 5: REGISTER_NEW_INTERNAL_TOKEN
     * 6: UPDATE_TOKEN
     */
    expect(await dao.getAdapterAddress(newAdapterId)).equal(newAdapterAddress);
    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        0 //ADD_TO_BALANCE
      )
    ).equal(true);
    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        1 // SUB_FROM_BALANCE
      )
    ).equal(true);
    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        2 // INTERNAL_TRANSFER
      )
    ).equal(true);

    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        3 // WITHDRAW
      )
    ).equal(false);

    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        4 // REGISTER_NEW_TOKEN
      )
    ).equal(false);

    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        5 // REGISTER_NEW_INTERNAL_TOKEN
      )
    ).equal(false);

    expect(
      await dao.hasAdapterAccessToExtension(
        newAdapterAddress,
        bankExt.address,
        6 // UPDATE_TOKEN
      )
    ).equal(false);
  });

  it("should be possible to add a new extension", async () => {
    const dao = this.dao;
    const manager = this.adapters.manager;
    const nftExt = await NFTExtension.new();

    const newExtensionId = sha3("testNewExtension");
    const newExtensionAddr = nftExt.address;
    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;
    const proposal = {
      adapterOrExtensionId: newExtensionId,
      adapterOrExtensionAddr: newExtensionAddr,
      updateType: 2, // 1 = Adapter, 2 = Extension
      flags: 0,
      keys: [],
      values: [],
      // Set the extension address which will be accessed by the new adapter
      extensionAddresses: [],
      // Set the acl flags so the new adapter can access the bank extension
      extensionAclFlags: [],
    };

    const signature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: manager.address,
      chainId,
      proposal,
      configs: [],
      nonce,
    });

    await manager.processSignedProposal(
      dao.address,
      proposal,
      [],
      nonce,
      signature
    );

    expect(await dao.getExtensionAddress(newExtensionId)).equal(
      newExtensionAddr
    );
  });

  it("should be possible to remove an extension", async () => {
    const dao = this.dao;
    const manager = this.adapters.manager;
    const voting = this.adapters.voting;

    const removeExtensionId = sha3("bank");
    // Use 0 address to indicate we don't want to add, it is just a removal
    const removeExtensionAddr = ZERO_ADDRESS;

    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;
    const proposal = {
      adapterOrExtensionId: removeExtensionId,
      adapterOrExtensionAddr: removeExtensionAddr,
      updateType: 2, // 1 = Adapter, 2 = Extension
      flags: 0,
      keys: [],
      values: [],
      // Set the extension address which will be accessed by the new adapter
      extensionAddresses: [],
      // Set the acl flags so the new adapter can access the bank extension
      extensionAclFlags: [],
    };

    const signature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: manager.address,
      chainId,
      proposal,
      configs: [],
      nonce,
    });

    await manager.processSignedProposal(
      dao.address,
      proposal,
      [],
      nonce,
      signature
    );

    await expectRevert(
      dao.getExtensionAddress(removeExtensionAddr),
      "extension not found"
    );
  });

  it("should revert if UpdateType is unknown", async () => {
    const dao = this.dao;
    const manager = this.adapters.manager;
    const voting = this.adapters.voting;

    const removeExtensionId = sha3("bank");
    // Use 0 address to indicate we don't want to add, it is just a removal
    const removeExtensionAddr = ZERO_ADDRESS;
    const proposalId = getProposalCounter();

    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;
    const proposal = {
      adapterOrExtensionId: removeExtensionId,
      adapterOrExtensionAddr: removeExtensionAddr,
      updateType: 0, //0 = Unknown 1 = Adapter, 2 = Extension
      flags: 0,
      keys: [],
      values: [],
      // Set the extension address which will be accessed by the new adapter
      extensionAddresses: [],
      // Set the acl flags so the new adapter can access the bank extension
      extensionAclFlags: [],
    };

    const signature = generateCouponSignature({
      daoAddress: dao.address,
      managerAddress: manager.address,
      chainId,
      proposal,
      configs: [],
      nonce,
    });

    await expectRevert(
      manager.processSignedProposal(
        dao.address,
        proposal,
        [],
        nonce,
        signature
      ),
      "unknown update type"
    );
  });
});
