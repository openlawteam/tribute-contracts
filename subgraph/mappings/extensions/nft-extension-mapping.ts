import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import {
  NFTExtension,
  CollectedNFT,
  WithdrawnNFT,
  TransferredNFT,
} from "../../generated/templates/NFTExtension/NFTExtension";
import { NFT, NFTCollection } from "../../generated/schema";

function loadOrCreateNFT(
  extensionAddress: Address,
  nftAddress: Address,
  nftTokenId: BigInt
): NFT {
  // get nft extension bindings
  let registry = NFTExtension.bind(extensionAddress);
  let daoAddress = registry.dao();

  let nftId = daoAddress
    .toHex()
    .concat("-nft-")
    .concat(nftAddress.toHex())
    .concat("-")
    .concat(nftTokenId.toString());

  let nft = NFT.load(nftId);

  if (nft == null) {
    nft = new NFT(nftId);
  }

  return nft as NFT;
}

export function handleCollectedNFT(event: CollectedNFT): void {
  log.info(
    "================ CollectedNFT event fired. nftAddr: {}, nftTokenId: {}",
    [event.params.nftAddr.toHexString(), event.params.nftTokenId.toString()]
  );

  let nft = loadOrCreateNFT(
    event.address,
    event.params.nftAddr,
    event.params.nftTokenId
  );

  nft.nftAddress = event.params.nftAddr;
  nft.tokenId = event.params.nftTokenId;
  nft.from = event.transaction.from;
  nft.to = event.address;

  let nftRegistry = NFTExtension.bind(event.address);
  let daoAddress = nftRegistry.dao();

  // add to the daos nft collection
  let nftCollectionId = daoAddress
    .toHex()
    .concat("-nftcollection-")
    .concat(event.address.toHex());

  let nftCollection = NFTCollection.load(nftCollectionId);

  if (nftCollection != null) {
    // add to collection
    nft.nftCollection = nftCollectionId;
  }

  nft.save();
}

export function handleWithdrawnNFT(event: WithdrawnNFT): void {
  log.info(
    "================ WithdrawnNFT event fired. toAddress: {}, nftAddr: {}, nftTokenId: {}",
    [
      event.params.toAddress.toHexString(),
      event.params.nftAddr.toHexString(),
      event.params.nftTokenId.toString(),
    ]
  );

  let nft = loadOrCreateNFT(
    event.address,
    event.params.nftAddr,
    event.params.nftTokenId
  );

  if (nft != null) {
    nft.to = event.params.toAddress;

    nft.save();
  }
}

export function handleTransferredNFT(event: TransferredNFT): void {
  log.info(
    "================ TransferredNFT event fired. nftAddr: {}, nftTokenId: {}, newOwner: {}, oldOwner: {}",
    [
      event.params.nftAddr.toHexString(),
      event.params.nftTokenId.toString(),
      event.params.newOwner.toHexString(),
      event.params.oldOwner.toHexString(),
    ]
  );

  let nft = loadOrCreateNFT(
    event.address,
    event.params.nftAddr,
    event.params.nftTokenId
  );

  if (nft != null) {
    nft.to = event.params.newOwner;
    nft.from = event.params.oldOwner;

    nft.save();
  }
}
