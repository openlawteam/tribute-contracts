import { NFTCollectionCreated } from "../generated/NFTCollectionFactory/NFTCollectionFactory";
// import { NFTExtension as NFTExtensionTemplate } from "../generated/templates";
import { log } from "@graphprotocol/graph-ts";

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

  // NFTExtensionTemplate.create(event.params.nftCollAddress);
}
