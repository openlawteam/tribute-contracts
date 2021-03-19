pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoConstants.sol";
import "../../core/DaoRegistry.sol";
import "../../guards/AdapterGuard.sol";
import "../../helpers/AddressLib.sol";
import "../IExtension.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

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

contract NFTExtension is
    DaoConstants,
    AdapterGuard,
    IExtension,
    IERC721Receiver
{
    using Address for address payable;
    // Add the library methods
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    bool public initialized = false; // internally tracks deployment under eip-1167 proxy pattern
    DaoRegistry public dao;

    enum AclFlag {TRANSFER_NFT, RETURN_NFT, REGISTER_NFT}

    // All the NFTs and Token ids that belong to the GUILD
    mapping(address => mapping(address => EnumerableSet.UintSet))
        private _nftCollection;

    // All the NFTs addresses collected and stored in the GUILD collection
    EnumerableSet.AddressSet private _collectedNFTs;

    // The NFTs addresses supported by the extension
    mapping(address => bool) public availableNFTs;

    modifier hasExtensionAccess(IExtension extension, AclFlag flag) {
        require(
            dao.state() == DaoRegistry.DaoState.CREATION ||
                dao.hasAdapterAccessToExtension(
                    msg.sender,
                    address(extension),
                    uint8(flag)
                ),
            "nft-extension::accessDenied"
        );
        _;
    }

    /// @notice Clonable contract must have an empty constructor
    constructor() {}

    /**
     * @notice Initializes the extension with the DAO address that it belongs too.
     * @param _dao The address of the DAO that owns the extension.
     * @param creator The owner of the DAO and Extension that is also a member of the DAO.
     */
    function initialize(DaoRegistry _dao, address creator) external override {
        require(!initialized, "already initialized");
        require(_dao.isActiveMember(creator), "not active member");

        initialized = true;
        dao = _dao;
    }

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
    ) external {
        require(isNFTAllowed(nftAddr), "nft not allowed");
        IERC721 erc721 = IERC721(nftAddr);
        // Move the NFT to the contract address
        erc721.safeTransferFrom(owner, address(this), nftTokenId);
        // Save the asset in the GUILD collection
        _nftCollection[GUILD][nftAddr].add(nftTokenId);
        // Keep track of the collected assets
        _collectedNFTs.add(nftAddr);
    }

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
    ) public hasExtensionAccess(this, AclFlag.TRANSFER_NFT) {
        require(isNFTAllowed(nftAddr), "non allowed nft");
        IERC721 erc721 = IERC721(nftAddr);
        // Move the NFT to the contract address
        erc721.safeTransferFrom(escrowAddr, address(this), nftTokenId);
        // Save the asset in the GUILD collection
        _nftCollection[GUILD][nftAddr].add(nftTokenId);
        // Keep track of the collected assets
        _collectedNFTs.add(nftAddr);
    }

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
    ) public hasExtensionAccess(this, AclFlag.RETURN_NFT) {
        require(isNFTAllowed(nftAddr), "nft not allowed");

        // Remove the NFT from the contract address to the actual owner
        IERC721 erc721 = IERC721(nftAddr);
        erc721.approve(newOwner, nftTokenId);
        erc721.safeTransferFrom(address(this), newOwner, nftTokenId);
        // Remove the asset from the GUILD collection
        _nftCollection[GUILD][nftAddr].remove(nftTokenId);
        // If we dont hold the asset anymore, we can remove it
        if (_nftCollection[GUILD][nftAddr].length() == 0) {
            _collectedNFTs.remove(nftAddr);
        }
    }

    /**
     * @notice Registers a potential new NFT in the NFT extension.
     * @notice The caller must have the ACL Flag: REGISTER_NFT.
     * @dev Reverts if the token address is reserved.
     * @param nftAddr The address of the new NFT.
     */
    function registerPotentialNewNFT(address nftAddr)
        public
        hasExtensionAccess(this, AclFlag.REGISTER_NFT)
    {
        require(isNotReservedAddress(nftAddr), "reservedToken");

        if (!availableNFTs[nftAddr]) {
            availableNFTs[nftAddr] = true;
        }
    }

    /**
     * @notice Checks if a given token address is reserved.
     */
    function isNotReservedAddress(address addr) public pure returns (bool) {
        return addr != GUILD && addr != TOTAL && addr != SHARES;
    }

    /**
     * @notice Checks if a given token address is allowed/supported by the extension.
     */
    function isNFTAllowed(address nftAddr) public view returns (bool) {
        return availableNFTs[nftAddr];
    }

    /**
     * @notice Returns the total amount of NFTs collected.
     */
    function nbNFTs() public view returns (uint256) {
        return _collectedNFTs.length();
    }

    /**
     * @notice Returns NFT address stored in the GUILD collection at the specified index.
     * @param index The index to get the NFT address if it exists
     */
    function getNFTByIndex(uint256 index) public view returns (address) {
        return _collectedNFTs.at(index);
    }

    /**
     * @notice Required function from IERC721 standard to be able to receive assets to this contract address
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
