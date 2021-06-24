import { Address, Bytes, log } from "@graphprotocol/graph-ts";

import {
  NFTExtension as NFTExtensionTemplate,
  BankExtension as BankExtensionTemplate,
} from "../../generated/templates";
import { Bank, NFTCollection } from "../../generated/schema";

import { internalERC20Balance } from "../extensions/bank-extension-mapping";
import {
  BANK_EXTENSION_ID,
  NFT_EXTENSION_ID,
  ERC20_EXTENSION_ID,
} from "../core/dao-constants";

export function loadOrCreateExtensionEntity(
  daoAddress: Address,
  extensionId: Bytes,
  extensionAddress: Address,
  transactionFrom: Address
): void {
  if (BANK_EXTENSION_ID.toString() == extensionId.toHexString()) {
    log.info("INFO BANK_EXTENSION_ID, extensionId: {}", [
      extensionId.toHexString(),
    ]);

    BankExtensionTemplate.create(extensionAddress);

    bank(daoAddress, extensionAddress);
  } else if (NFT_EXTENSION_ID.toString() == extensionId.toHexString()) {
    log.info("INFO NFT_EXTENSION_ID, extensionId: {}", [
      extensionId.toHexString(),
    ]);

    NFTExtensionTemplate.create(extensionAddress);

    nft(daoAddress, extensionAddress);
  } else if (ERC20_EXTENSION_ID.toString() == extensionId.toHexString()) {
    log.info("INFO ERC20_EXTENSION_ID, extensionId: {}", [
      extensionId.toHexString(),
    ]);

    erc20(daoAddress, transactionFrom);
  }
}

// if extension is a `bank` assign to its dao
function bank(daoAddress: Address, extensionAddress: Address): void {
  let bankId = daoAddress
    .toHex()
    .concat("-bank-")
    .concat(extensionAddress.toHex());
  let bank = Bank.load(bankId);

  if (bank == null) {
    bank = new Bank(bankId);
  }

  bank.tributeDao = daoAddress.toHex();
  bank.bankAddress = extensionAddress;

  bank.save();
}

// if extension is an `nft` assign to its dao
function nft(daoAddress: Address, extensionAddress: Address): void {
  let nftCollectionId = daoAddress
    .toHex()
    .concat("-nftcollection-")
    .concat(extensionAddress.toHex());
  let nftCollection = NFTCollection.load(nftCollectionId);

  if (nftCollection == null) {
    nftCollection = new NFTCollection(nftCollectionId);
    nftCollection.tributeDao = daoAddress.toHex();

    nftCollection.save();
  }
}

// if extension is an `erc20` assign to its dao, add creator with balance
function erc20(daoAddress: Address, transactionFrom: Address): void {
  // add creator to token holder entity with initial balance
  internalERC20Balance(daoAddress, transactionFrom);
}
