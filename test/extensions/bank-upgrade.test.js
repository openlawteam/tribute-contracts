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
  UNITS,
  sha3,
  toWei, 
} = require("../../utils/contract-util");

const {
  bankExtensionAclFlagsMap,
  entryBank,
} = require("../../utils/access-control-util");

const { extensionsIdsMap } = require("../../utils/dao-ids-util");

const {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  getAccounts,
  allContractConfigs,
  deployFunction,
} = require("../../utils/hardhat-test-util");

const { SigUtilSigner } = require("../../utils/offchain-voting-util");

const signer = {
  address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
  privKey: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
};

const chainId = 1337;

const generateManagerCouponSignature = (
  daoAddress,
  proposal,
  configs,
  nonce
) => {
  const signerUtil = SigUtilSigner(signer.privKey);

  const messageData = {
    type: "manager",
    daoAddress,
    proposal,
    configs,
    nonce,
  };
  return signerUtil(
    messageData,
    daoAddress,
    this.adapters.manager.address,
    chainId
  );
};

let onboardNonce = 1;
const onboardMember = async (dao, newMember) => {
  const signerUtil = SigUtilSigner(signer.privKey);
  console.log(Object.keys(this.adapters));
  const couponOnboarding = this.adapters.couponOnboarding;
  const couponData = {
    type: "coupon",

    authorizedMember: newMember,
    amount: 10,
    nonce: onboardNonce,
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
    onboardNonce,
    signature
  );

  onboardNonce++;
};

describe("Extension - BankV1Upgrade", () => {
  let accounts, daoOwner;

  before("deploy dao", async () => {
    accounts = await getAccounts();
    daoOwner = accounts[0];

    const { dao, adapters, extensions, factories } = await deployDefaultDao({
      owner: daoOwner,
      daoFactoryContract: "DaoV1Factory",
      DaoFactory: {enabled: false},
      DaoV1Factory: {enabled: true},
      BankFactory: {enabled: false},
      BankV1Factory: {enabled: true},
    });

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

  it("should be possible to upgrade the bankV1 into a compatible V2", async () => {
    const bankFactory = await deployFunction(allContractConfigs.bankV1UpgradeExtFactory);
    const dao = this.dao;
    const manager = this.adapters.manager;

    const newExtensionId = sha3("bank");
    
    const nonce = (await manager.nonces(dao.address)).toNumber() + 1;
    const { logs } = await bankFactory.create(dao.address, 100);
    const newBankAddr = logs[0].args[1];
    
    const proposal1 = {
      adapterOrExtensionId: newExtensionId,
      adapterOrExtensionAddr: newBankAddr,
      updateType: 1,
      flags: 0,
      keys: [],
      values: [],
      extensionAddresses: [
        this.extensions.bankExt.address,
      ],
      extensionAclFlags: [
        entryBank(newBankAddr, {
          extensions: {
            [extensionsIdsMap.BANK_EXT]: [
              bankExtensionAclFlagsMap.WITHDRAW,
            ],
          },
        }).flags,
      ],
    };

    const proposal2 = {
      adapterOrExtensionId: newExtensionId,
      adapterOrExtensionAddr: newBankAddr,
      updateType: 2,
      flags: 0,
      keys: [],
      values: [],
      extensionAddresses: [
        this.adapters.couponOnboarding.address,
        this.extensions.erc20Ext.address,
        this.adapters.reimbursement.address,
        this.adapters.BankAdapter
      ],
      extensionAclFlags: [
        entryBank(this.adapters.couponOnboarding.address, {
          extensions: {
            [extensionsIdsMap.BANK_EXT]: [
              bankExtensionAclFlagsMap.ADD_TO_BALANCE,
              bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
              bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
            ],
          },
        }).flags,
        entryBank(this.extensions.erc20Ext.address, {
          extensions: {
            [extensionsIdsMap.BANK_EXT]: [
              bankExtensionAclFlagsMap.ADD_TO_BALANCE,
              bankExtensionAclFlagsMap.SUB_FROM_BALANCE,
              bankExtensionAclFlagsMap.INTERNAL_TRANSFER,
            ],
          },
        }).flags,
        entryBank(this.adapters.reimbursement.address, {
          extensions: {
            [extensionsIdsMap.BANK_EXT]: [
              bankExtensionAclFlagsMap.WITHDRAW,
            ],
          },
        }).flags,
        entryBank(this.adapters.bankAdapter.address, {
          extensions: {
            [extensionsIdsMap.BANK_EXT]: [
              bankExtensionAclFlagsMap.ADD_TO_BALANCE,
              bankExtensionAclFlagsMap.WITHDRAW,
            ],
          },
        }).flags,
      ],
    };

    const sig1 = generateManagerCouponSignature(
      dao.address,
      proposal1,
      [],
      nonce
    );

    const sig2 = generateManagerCouponSignature(
      dao.address,
      proposal2,
      [],
      nonce + 1
    );

    await onboardMember(dao, accounts[2]);

    await this.adapters.bankAdapter.sendEth(dao.address, {value: toWei("1")});

    await manager.processSignedProposal(
      dao.address,
      proposal1,
      [], //configs
      nonce,
      sig1
    );

    await manager.processSignedProposal(
      dao.address,
      proposal2,
      [], //configs
      nonce + 1,
      sig2
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
    await onboardMember(dao, accounts[2]);

    otherAccountUnits = await bank.balanceOf(accounts[3], UNITS);
    expect(otherAccountUnits.toString()).equal("10");

    otherAccountUnits = await bank.balanceOf(accounts[2], UNITS);
    expect(otherAccountUnits.toString()).equal("20");

    await this.adapters.bankAdapter.sendEth(dao.address, {value: toWei("1")});
  });
});
