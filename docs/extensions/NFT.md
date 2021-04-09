## Extension description and scope

An [IERC721Receiver](https://docs.openzeppelin.com/contracts/3.x/api/token/erc721#IERC721Receiver) contract to safelly manage the collection of standard NFTs (ERC721) collected by the DAO.

It adds to the DAO the capability of managing and curate a collection of standard NFTs. Applicants can join the DAO offering NFTs as tributes, and if their proposal is approved their tributes get stored in the guild NFT collection - which supports tokens in ERC712 standard.

In order to join the DAO using a NFT as tribute, the DAO must have the [TributeNFT Adapter](https://github.com/openlawteam/molochv3-contracts/blob/master/docs/adapters/TributeNFT.md) pre-configured with the correct [Access Flags](#access-flags).

## Extension state

#### bool public initialized = false;

Internally tracks deployment under eip-1167 proxy pattern.

#### DaoRegistry public dao;

Keeps track of each DAO instance the current contract belongs to.

#### Access Flags

- `TRANSFER_NFT`: Allows the caller adapter to transfer the NFT to the GUILD collection.
- `RETURN_NFT`: Allows the caller to remove the NFT from the GUILD collection and return the a new owner.
- `REGISTER_NFT`: Allows the caller to register a new NFT address to be allowed/supported by the extension.

Access Control Layer Flags - explicitly grant external calls permissions to change the extension state.

#### mapping(address => mapping(address => EnumerableSet.UintSet)) private \_nftCollection;

Tracks all the NFTs and Token ids that belong to the GUILD collection.

#### EnumerableSet.AddressSet private \_collectedNFTs;

Tracks all the NFTs addresses collected and stored in the GUILD collection, so they can be accessed using indexes.

#### mapping(address => bool) public availableNFTs;

Tracks all the NFTs addresses that are allowed/supported by the extension.

## Extension functions

### function initialize

```solidity
/**
  * @notice Initializes the extension with the DAO address that it belongs too.
  * @param _dao The address of the DAO that owns the extension.
  * @param creator The owner of the DAO and Extension that is also a member of the DAO.
  */
function initialize(DaoRegistry _dao, address creator) external
```

### function collect

```solitidy
/**
  * @notice Collects the NFT from the owner and moves to the contract address
  * @notice It must be have been allowed to move this token by either {approve} or {setApprovalForAll}.
  * @dev Reverts if the NFT is not support/allowed, or is not in ERC721 standard.
  * @param owner The owner of the NFT that wants to store it in the DAO.
  * @param nftAddr The NFT address that must be in ERC721 and allowed/supported by the extension.
  * @param nftTokenId The NFT token id.
  */
function collect(
    address owner,
    address nftAddr,
    uint256 nftTokenId
) external
```

### function transferFrom

```solidity
/**
  * @notice Internally transfer the NFT token from the escrow adapter to the extension address.
  * @notice It also updates the internal state to keep track of the all the NFTs collected by the extension.
  * @notice It must be have been allowed to move this token by either {approve} or {setApprovalForAll}.
  * @notice The caller must have the ACL Flag: TRANSFER_NFT
  * @dev Reverts if the NFT is not support/allowed, or is not in ERC721 standard.
  * @param escrowAddr The address of the escrow adapter, usually it is the address of the TributeNFT adapter.
  * @param nftAddr The NFT address that must be in ERC721 and allowed/supported by the extension.
  * @param nftTokenId The NFT token id.
  */
function transferFrom(
    address escrowAddr,
    address nftAddr,
    uint256 nftTokenId
) public hasExtensionAccess(this, AclFlag.TRANSFER_NFT)
```

### function returnNFT

```solidity
/**
  * @notice Ttransfers the NFT token from the extension address to the new owner.
  * @notice It also updates the internal state to keep track of the all the NFTs collected by the extension.
  * @notice The caller must have the ACL Flag: RETURN_NFT
  * @dev Reverts if the NFT is not support/allowed, or is not in ERC721 standard.
  * @param newOwner The address of the new owner.
  * @param nftAddr The NFT address that must be in ERC721 and allowed/supported by the extension.
  * @param nftTokenId The NFT token id.
  */
function returnNFT(
    address newOwner,
    address nftAddr,
    uint256 nftTokenId
) public hasExtensionAccess(this, AclFlag.RETURN_NFT)
```

### function registerPotentialNewNFT

```solidity
/**
  * @notice Registers a potential new NFT in the NFT extension.
  * @notice The caller must have the ACL Flag: REGISTER_NFT.
  * @dev Reverts if the token address is reserved.
  * @param nftAddr The address of the new NFT.
  */
function registerPotentialNewNFT(address nftAddr)
    public
    hasExtensionAccess(this, AclFlag.REGISTER_NFT)
```

### function isNFTAllowed

```solidity
/**
  * @notice Checks if a given token address is allowed/supported by the extension.
  */
function isNFTAllowed(address nftAddr) public view returns (bool)
```

### function nbNFTs

```solidity
/**
  * @notice Returns the total amount of NFTs collected.
  */
function nbNFTs() public view returns (uint256)
```

### function getNFTByIndex

```solidity
/**
  * @notice Returns NFT address stored in the GUILD collection at the specified index.
  * @param index The index to get the NFT address if it exists
  */
function getNFTByIndex(uint256 index) public view returns (address)
```

### function onERC721Received

```solidity
/**
  * @notice Required function from IERC721 standard to be able to receive assets to this contract address
  */
function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
) external override returns (bytes4)
```

## Events

- `CollectedNFT`: when a NFT is collected/stored into the NFT collection.
- `RegisteredNFT`: when a new NFT address is registered into the NFT collection, so it can be collected.
- `ReturnedNFT`: when a NFT is transferred from the extension to another owner.
- `TransferredNFT`: when a NFT is transferred from the escrow adapter to the NFT collection in the extension.
