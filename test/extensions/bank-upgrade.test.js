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
  ETH_TOKEN,
  UNITS,
  toBN,
  sha3,
  toWei,
  fromAscii,
  ZERO_ADDRESS,
} = require("../../utils/contract-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  getAccounts,
  allContractConfigs,
  DaoV1Factory,
  BankV1UpgradeFactory,
  web3,
  deployFunction,
  proposalIdGenerator,
} = require("../../utils/hardhat-test-util");

const { SigUtilSigner } = require("../../utils/offchain-voting-util");

const signer = {
  address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
  privKey: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
};

const chainId = 1337;

const proposalCounter = proposalIdGenerator().generator;
const getProposalCounter = () => proposalCounter().next().value;

const generateManagerCouponSignature = (
  daoAddress,
  proposal,
  configs,
  proposalId,
  nonce
) => {
  const signerUtil = SigUtilSigner(signer.privKey);

  const messageData = {
    type: "manager",
    daoAddress,
    proposal,
    configs,
    proposalId,
    nonce,
  };
  return signerUtil(
    messageData,
    daoAddress,
    this.adapters.manager.address,
    chainId
  );
};
let nonce = 1;
const onboardMember = async (dao, newMember) => {
  const signerUtil = SigUtilSigner(signer.privKey);

  const couponOnboarding = this.adapters.couponOnboarding;
  console.log("nonce ", nonce);
  const couponData = {
    type: "coupon",
    authorizedMember: newMember,
    amount: 10,
    nonce,
  };

  var signature = signerUtil(
    couponData,
    dao.address,
    couponOnboarding.address,
    chainId
  );

  await couponOnboarding.redeemCoupon(
    dao.address,
    newMember,
    10,
    nonce,
    signature
  );

  nonce++;
};

describe("Extension - BankV1Upgrade", () => {
  let accounts, daoOwner, creator;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];
    creator = accounts[1];
    const { dao, adapters, extensions, factories } = await deployDefaultDao({
      owner: daoOwner,
      DaoFactory: DaoV1Factory,
      BankFactory: allContractConfigs.BankV1Factory,
    });

    if (!factories[allContractConfigs.BankV1UpgradeFactory.alias]) {
      factories[allContractConfigs.BankV1UpgradeFactory.alias] =
        await deployFunction(allContractConfigs.BankV1UpgradeFactory, [
          allContractConfigs.BankV1UpgradeExtension,
        ]);
    }

    this.dao = dao;
    this.adapters = adapters;
    this.extensions = extensions;
    this.factories = factories;
  });

  beforeEach(async () => {
    this.snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(this.snapshotId);
  });

  describe("Factory", async () => {
    it("should be possible to create an extension using the factory", async () => {
      const { logs } = await this.factories.bankV1UpgradeExtFactory.create(
        this.dao.address,
        10
      );
      const log = logs[0];
      expect(log.event).to.be.equal("BankCreated");
      expect(log.args[0]).to.be.equal(this.dao.address);
      expect(log.args[1]).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should be possible to get an extension address by dao", async () => {
      await this.factories.bankV1UpgradeExtFactory.create(this.dao.address, 10);
      const extAddress =
        await this.factories.bankV1UpgradeExtFactory.getExtensionAddress(
          this.dao.address
        );
      expect(extAddress).to.not.be.equal(ZERO_ADDRESS);
    });

    it("should return zero address if there is no extension address by dao", async () => {
      const daoAddress = accounts[2];
      const extAddress =
        await this.factories.bankV1UpgradeExtFactory.getExtensionAddress(
          daoAddress
        );
      expect(extAddress).to.be.equal(ZERO_ADDRESS);
    });

    it("should not be possible to create an extension using a zero address dao", async () => {
      await expect(
        this.factories.bankV1UpgradeExtFactory.create(ZERO_ADDRESS, 10)
      ).to.be.reverted;
    });
  });

  describe("Access Control", async () => {
    it("should not be possible to call initialize more than once", async () => {
      const extension = this.extensions.bankExt;
      await expect(
        extension.initialize(this.dao.address, daoOwner)
      ).to.be.revertedWith("already initialized");
    });

    it("should not be possible to call initialize with a non member", async () => {
      const extension = await allContractConfigs.BankV1UpgradeExtension.new(
        this.extensions.bankExt.address
      );
      await expect(
        extension.initialize(this.dao.address, creator)
      ).to.be.revertedWith("not a member");
    });

    it("should not be possible to call withdraw without the WITHDRAW permission", async () => {
      const extension = this.extensions.bankExt;
      await expect(
        extension.withdraw(this.dao.address, daoOwner, ETH_TOKEN, 1)
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call withdrawTo without the WITHDRAW permission", async () => {
      const extension = this.extensions.bankExt;
      await expect(
        extension.withdrawTo(this.dao.address, daoOwner, creator, ETH_TOKEN, 1)
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call registerPotentialNewToken without the REGISTER_NEW_TOKEN permission", async () => {
      const extension = this.extensions.bankExt;
      await expect(
        extension.registerPotentialNewToken(this.dao.address, ETH_TOKEN)
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call registerPotentialNewInternalToken without the REGISTER_NEW_INTERNAL_TOKEN permission", async () => {
      const extension = this.extensions.bankExt;
      await expect(
        extension.registerPotentialNewInternalToken(this.dao.address, ETH_TOKEN)
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call updateToken without the UPDATE_TOKEN permission", async () => {
      const extension = this.extensions.bankExt;
      await expect(
        extension.updateToken(this.dao.address, ETH_TOKEN)
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call addToBalance without the ADD_TO_BALANCE permission", async () => {
      const extension = this.extensions.bankExt;
      await expect(
        extension.addToBalance(this.dao.address, daoOwner, ETH_TOKEN, 1)
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call subtractFromBalance without the SUB_FROM_BALANCE permission", async () => {
      const extension = this.extensions.bankExt;
      await expect(
        extension.subtractFromBalance(this.dao.address, daoOwner, ETH_TOKEN, 1)
      ).to.be.revertedWith("accessDenied");
    });

    it("should not be possible to call internalTransfer without the INTERNAL_TRANSFER permission", async () => {
      const extension = this.extensions.bankExt;
      await expect(
        extension.internalTransfer(
          this.dao.address,
          daoOwner,
          creator,
          ETH_TOKEN,
          1
        )
      ).to.be.revertedWith("accessDenied");
    });
  });

  it("should be possible to create a dao with a bank extension pre-configured", async () => {
    const dao = this.dao;
    const bankAddress = await dao.getExtensionAddress(sha3("bank"));
    expect(bankAddress).to.not.be.null;
  });

  it("should be possible to get all the tokens registered in the bank", async () => {
    const bank = this.extensions.bankExt;
    const tokens = await bank.getTokens();
    expect(tokens.toString()).equal([ETH_TOKEN].toString());
  });

  it("should be possible to get a registered token using the token index", async () => {
    const bank = this.extensions.bankExt;
    const token = await bank.getToken(0);
    expect(token.toString()).equal(ETH_TOKEN.toString());
  });

  it("should be possible to get the total amount of tokens registered in the bank", async () => {
    const bank = this.extensions.bankExt;
    const totalTokens = await bank.nbTokens();
    expect(totalTokens.toString()).equal("1");
  });

  it("should not be possible to create a bank that supports more than 200 external tokens", async () => {
    const maxExternalTokens = 201;
    const identityBank = this.extensions.bankExt;
    const bankFactory = await BankV1UpgradeFactory.new(identityBank.address);
    await expect(
      bankFactory.create(this.dao.address, maxExternalTokens)
    ).to.be.revertedWith("maxTokens should be (0,200]");
  });

  it("should not be possible to create a bank that supports 0 external tokens", async () => {
    const maxExternalTokens = 0;
    const identityBank = this.extensions.bankExt;
    const bankFactory = await BankV1UpgradeFactory.new(identityBank.address);
    await expect(
      bankFactory.create(this.dao.address, maxExternalTokens)
    ).to.be.revertedWith("maxTokens should be (0,200]");
  });

  it("should not be possible to set the max external tokens if bank is already initialized", async () => {
    const bank = this.extensions.bankExt;
    await expect(bank.setMaxExternalTokens(10)).to.be.revertedWith(
      "already initialized"
    );
  });

  it("should not be possible to send ETH to the adapter via receive function", async () => {
    const adapter = this.adapters.bankAdapter;
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
    const adapter = this.adapters.bankAdapter;
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

  it("should be possible to upgrade the bankV1 into a compatible V2", async () => {
    const bankFactory = this.factories.bankV1UpgradeExtFactory;
    const dao = this.dao;
    const manager = this.adapters.manager;

    const newExtensionId = sha3("bank");
    const proposalId = getProposalCounter();
    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;
    const { logs } = await bankFactory.create(dao.address, 100);
    const newBankAddr = logs[0].args[1];
    const proposal = {
      adapterOrExtensionId: newExtensionId,
      adapterOrExtensionAddr: newBankAddr,
      updateType: 2,
      flags: 0,
      keys: [],
      values: [],
      extensionAddresses: [],
      extensionAclFlags: [],
    };

    const sig = generateManagerCouponSignature(
      dao.address,
      proposal,
      [],
      proposalId,
      nonce
    );

    await onboardMember(dao, accounts[2]);

    await manager.processSignedProposal(
      dao.address,
      proposalId,
      proposal,
      [], //configs
      nonce,
      sig
    );

    const bankAddr = await dao.getExtensionAddress(newExtensionId);
    expect(bankAddr).to.equal(newBankAddr);

    const bank = await allContractConfigs.BankV1UpgradeExtension.at(
      newBankAddr
    );

    const daoOwnerUnits = await bank.balanceOf(daoOwner, UNITS);
    let otherAccountUnits = await bank.balanceOf(accounts[2], UNITS);

    expect(daoOwnerUnits.toString()).equal("1");
    expect(otherAccountUnits.toString()).equal("10");

    await onboardMember(dao, accounts[3]);

    otherAccountUnits = await bank.balanceOf(accounts[3], UNITS);

    expect(otherAccountUnits.toString()).equal("10");
  });
});
