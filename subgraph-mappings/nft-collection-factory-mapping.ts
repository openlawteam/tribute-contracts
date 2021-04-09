import { NFTCollectionCreated } from "../generated/NFTCollectionFactory/NFTCollectionFactory";
import { NFTExtension as NFTExtensionTemplate } from "../generated/templates";
import { NFTCollection } from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";

function loadOrCreateNFTCollection(nftCollAddress: string): NFTCollection {
  let nftCollection = NFTCollection.load(nftCollAddress);
  if (nftCollection == null) {
    nftCollection = new NFTCollection(nftCollAddress);
  }

  return nftCollection as NFTCollection;
}

/**
 * handleNFTCollectionCreated
 *
 * @param event NFTCollectionCreated
 * `event.params.nftCollAddress` is the address of the new nft contract
 *
 *  NFTExtension.create(event.params.nftCollAddress);
 */
export function handleNFTCollectionCreated(event: NFTCollectionCreated): void {
  log.info(
    "================ NFTCollectionCreated event fired. nftCollAddress: {}",
    [event.params.nftCollAddress.toHexString()]
  );

  // load or create nftCollection and save
  let nftCollection = loadOrCreateNFTCollection(
    event.params.nftCollAddress.toHexString()
  );

  nftCollection.tributeDao = event.address.toHex();

  NFTExtensionTemplate.create(event.params.nftCollAddress);
}
