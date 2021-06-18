---
id: nft-adapter
title: NFT
---

The NFT adapter is an utility adapter that allows the individuals to send their NFTs to the DAO NFT Extension.

## Workflow

### Collect NFT

The user sends a transaction indicating which ERC721 Token Address and Token Id must be collected by the NFT Extensions. If the operation was pre-approved, the transaction is executed and the NFT is moved to the Extension Address, which is compatible with ERC721.

## Access Flags

### NFT Extension

- `COLLECT_NFT`

## Dependencies

### DaoRegistry

### NFTExtension

## Structs

- There are no structures.

## Storage

- The adapter does not keep track of any state.

## Functions

### receive

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable

```

### collect

```solidity
     /**
     * @notice Collects the NFT from the owner and moves to the NFT extension address
     * @param dao The DAO address.
     * @param nftAddr The NFT smart contract address.
     * @param nftTokenId The NFT token id.
     */
    function collect(
        DaoRegistry dao,
        address nftAddr,
        uint256 nftTokenId
    ) external reentrancyGuard(dao)
```

## Events

### Withdraw

When the NFT is collected by the NFT Extension.

- `event CollectedNFT(address nftAddr, uint256 nftTokenId);`
