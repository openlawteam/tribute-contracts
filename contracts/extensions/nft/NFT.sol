pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../IExtension.sol";
import "@openzeppelin/contracts/utils/Address.sol";
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

contract NFTExtension is IExtension, IERC721Receiver {
    // Add the library methods
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    bool public initialized = false; // internally tracks deployment under eip-1167 proxy pattern
    DaoRegistry public dao;

    enum AclFlag {
        WITHDRAW_NFT,
        COLLECT_NFT,
        INTERNAL_TRANSFER
    }

    event CollectedNFT(address nftAddr, uint256 nftTokenId);
    event TransferredNFT(
        address nftAddr,
        uint256 nftTokenId,
        address oldOwner,
        address newOwner
    );
    event WithdrawnNFT(address nftAddr, uint256 nftTokenId, address toAddress);

    // All the Token IDs that belong to an NFT address stored in the GUILD collection
    mapping(address => EnumerableSet.UintSet) private _nfts;

    // The internal owner of record of an NFT that has been transferred to the extension
    mapping(bytes32 => address) private _ownership;

    // All the NFTs addresses collected and stored in the GUILD collection
    EnumerableSet.AddressSet private _nftAddresses;

    modifier hasExtensionAccess(DaoRegistry _dao, AclFlag flag) {
        require(
            dao == _dao &&
                (DaoHelper.isInCreationModeAndHasAccess(dao) ||
                    dao.hasAdapterAccessToExtension(
                        msg.sender,
                        address(this),
                        uint8(flag)
                    )),
            "erc721::accessDenied"
        );
        _;
    }

    /// @notice Clonable contract must have an empty constructor
    constructor() {}

    /**
     * @notice Initializes the extension with the DAO address that it belongs to.
     * @param _dao The address of the DAO that owns the extension.
     * @param creator The owner of the DAO and Extension that is also a member of the DAO.
     */
    function initialize(DaoRegistry _dao, address creator) external override {
        require(!initialized, "erc721::already initialized");
        require(_dao.isMember(creator), "erc721::not a member");

        initialized = true;
        dao = _dao;
    }

    /**
     * @notice Collects the NFT from the owner and moves it to the NFT extension.
     * @notice It must be have been allowed to move this token by either {approve} or {setApprovalForAll}.
     * @dev Reverts if the NFT is not in ERC721 standard.
     * @param nftAddr The NFT contract address.
     * @param nftTokenId The NFT token id.
     */
    // slither-disable-next-line reentrancy-benign
    function collect(
        DaoRegistry _dao,
        address nftAddr,
        uint256 nftTokenId
    ) external hasExtensionAccess(_dao, AclFlag.COLLECT_NFT) {
        IERC721 erc721 = IERC721(nftAddr);
        // Move the NFT to the contract address
        address currentOwner = erc721.ownerOf(nftTokenId);
        //If the NFT is already in the NFTExtension, update the ownership if not set already
        if (currentOwner == address(this)) {
            if (_ownership[getNFTId(nftAddr, nftTokenId)] == address(0x0)) {
                _saveNft(nftAddr, nftTokenId, DaoHelper.GUILD);
                // slither-disable-next-line reentrancy-events
                emit CollectedNFT(nftAddr, nftTokenId);
            }
            //If the NFT is not in the NFTExtension, we try to transfer from the current owner of the NFT to the extension
        } else {
            _saveNft(nftAddr, nftTokenId, DaoHelper.GUILD);
            erc721.safeTransferFrom(currentOwner, address(this), nftTokenId);
            // slither-disable-next-line reentrancy-events
            emit CollectedNFT(nftAddr, nftTokenId);
        }
    }

    /**
     * @notice Transfers the NFT token from the extension address to the new owner.
     * @notice It also updates the internal state to keep track of the all the NFTs collected by the extension.
     * @notice The caller must have the ACL Flag: WITHDRAW_NFT
     * @notice TODO This function needs to be called from a new adapter (RagequitNFT) that will manage the Bank balances, and will return the NFT to the owner.
     * @dev Reverts if the NFT is not in ERC721 standard.
     * @param newOwner The address of the new owner.
     * @param nftAddr The NFT address that must be in ERC721 standard.
     * @param nftTokenId The NFT token id.
     */
    // slither-disable-next-line reentrancy-benign
    function withdrawNFT(
        DaoRegistry _dao,
        address newOwner,
        address nftAddr,
        uint256 nftTokenId
    ) external hasExtensionAccess(_dao, AclFlag.WITHDRAW_NFT) {
        // Remove the NFT from the contract address to the actual owner
        require(
            _nfts[nftAddr].remove(nftTokenId),
            "erc721::can not remove token id"
        );
        IERC721 erc721 = IERC721(nftAddr);
        erc721.safeTransferFrom(address(this), newOwner, nftTokenId);
        // Remove the asset from the extension
        delete _ownership[getNFTId(nftAddr, nftTokenId)];

        // If we dont hold asset from this address anymore, we can remove it
        if (_nfts[nftAddr].length() == 0) {
            require(
                _nftAddresses.remove(nftAddr),
                "erc721::can not remove nft"
            );
        }
        //slither-disable-next-line reentrancy-events
        emit WithdrawnNFT(nftAddr, nftTokenId, newOwner);
    }

    /**
     * @notice Updates internally the ownership of the NFT.
     * @notice The caller must have the ACL Flag: INTERNAL_TRANSFER
     * @dev Reverts if the NFT is not already internally owned in the extension.
     * @param nftAddr The NFT address.
     * @param nftTokenId The NFT token id.
     * @param newOwner The address of the new owner.
     */
    function internalTransfer(
        DaoRegistry _dao,
        address nftAddr,
        uint256 nftTokenId,
        address newOwner
    ) external hasExtensionAccess(_dao, AclFlag.INTERNAL_TRANSFER) {
        require(newOwner != address(0x0), "erc721::new owner is 0");
        address currentOwner = _ownership[getNFTId(nftAddr, nftTokenId)];
        require(currentOwner != address(0x0), "erc721::nft not found");

        _ownership[getNFTId(nftAddr, nftTokenId)] = newOwner;

        emit TransferredNFT(nftAddr, nftTokenId, currentOwner, newOwner);
    }

    /**
     * @notice Gets ID generated from an NFT address and token id (used internally to map ownership).
     * @param nftAddress The NFT address.
     * @param tokenId The NFT token id.
     */
    function getNFTId(address nftAddress, uint256 tokenId)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(nftAddress, tokenId));
    }

    /**
     * @notice Returns the total amount of token ids collected for an NFT address.
     * @param tokenAddr The NFT address.
     */
    function nbNFTs(address tokenAddr) external view returns (uint256) {
        return _nfts[tokenAddr].length();
    }

    /**
     * @notice Returns token id associated with an NFT address stored in the GUILD collection at the specified index.
     * @param tokenAddr The NFT address.
     * @param index The index to get the token id if it exists.
     */
    function getNFT(address tokenAddr, uint256 index)
        external
        view
        returns (uint256)
    {
        return _nfts[tokenAddr].at(index);
    }

    /**
     * @notice Returns the total amount of NFT addresses collected.
     */
    function nbNFTAddresses() external view returns (uint256) {
        return _nftAddresses.length();
    }

    /**
     * @notice Returns NFT address stored in the GUILD collection at the specified index.
     * @param index The index to get the NFT address if it exists.
     */
    function getNFTAddress(uint256 index) external view returns (address) {
        return _nftAddresses.at(index);
    }

    /**
     * @notice Returns owner of NFT that has been transferred to the extension.
     * @param nftAddress The NFT address.
     * @param tokenId The NFT token id.
     */
    function getNFTOwner(address nftAddress, uint256 tokenId)
        external
        view
        returns (address)
    {
        return _ownership[getNFTId(nftAddress, tokenId)];
    }

    /**
     * @notice Required function from IERC721 standard to be able to receive assets to this contract address.
     */
    function onERC721Received(
        address,
        address,
        uint256 id,
        bytes calldata
    ) external override returns (bytes4) {
        _saveNft(msg.sender, id, DaoHelper.GUILD);
        return this.onERC721Received.selector;
    }

    /**
     * @notice Helper function to update the extension states for an NFT collected by the extension.
     * @param nftAddr The NFT address.
     * @param nftTokenId The token id.
     * @param owner The address of the owner.
     */
    function _saveNft(
        address nftAddr,
        uint256 nftTokenId,
        address owner
    ) private {
        // Save the asset, returns false if already saved.
        bool saved = _nfts[nftAddr].add(nftTokenId);
        if (saved) {
            // set ownership to the GUILD.
            _ownership[getNFTId(nftAddr, nftTokenId)] = owner;
            // Keep track of the collected assets.
            require(_nftAddresses.add(nftAddr), "erc721::can not add nft");
        }
    }
}
