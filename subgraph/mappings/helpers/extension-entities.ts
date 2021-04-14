import { Address, Bytes, log } from "@graphprotocol/graph-ts";

import {
  NFTExtension as NFTExtensionTemplate,
  BankExtension as BankExtensionTemplate,
} from "../../generated/templates";
import { Bank, NFTCollection } from "../../generated/schema";

import { BANK_EXTENSION_ID, NFT_EXTENSION_ID } from "./constants";

export function loadOrCreateExtensionEntity(
  daoAddress: Address,
  extensionId: Bytes,
  extensionAddress: Address
): void {
  if (BANK_EXTENSION_ID.toString() == extensionId.toHexString()) {
    log.info("INFO BANK_EXTENSION_ID, extensionId: {}", [
      extensionId.toHexString(),
    ]);

    bank(daoAddress, extensionAddress);
    BankExtensionTemplate.create(extensionAddress);
  } else if (NFT_EXTENSION_ID.toString() == extensionId.toHexString()) {
    log.info("INFO NFT_EXTENSION_ID, extensionId: {}", [
      extensionId.toHexString(),
    ]);

    nft(daoAddress, extensionAddress);
    NFTExtensionTemplate.create(extensionAddress);
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
