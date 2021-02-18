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

    // Keeps track of the nft owners managed by the contract
    mapping(address => mapping(address => EnumerableSet.UintSet))
        private _tokenOriginalOwners;

    address[] public nftCollection;
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

    function initialize(DaoRegistry _dao, address creator) external override {
        require(!initialized, "already initialized");
        require(_dao.isActiveMember(creator), "not active member");

        initialized = true;
        dao = _dao;
    }

    /**
     * @notice Collects the NFT from the owner and moves to the contract address
     * @notice It must be have been allowed to move this token by either {approve} or {setApprovalForAll}.
     */
    function collect(
        address owner,
        address nftAddr,
        uint256 nftTokenId
    ) external {
        require(isNFTAllowed(nftAddr), "nft not allowed");
        IERC721 erc712 = IERC721(nftAddr);
        // Move the NFT to the contract address
        erc712.safeTransferFrom(owner, address(this), nftTokenId);
        // Save the old owner, nft and tokenId to be able to return it back later on
        _tokenOriginalOwners[owner][nftAddr].add(nftTokenId);
    }

    /**
     * @notice Internally transfer the NFT token from the old owner to the new owner address
     * @notice It also updates the internal state to keep track of the new other and holdings
     * @notice It must be have been allowed to move this token by either {approve} or {setApprovalForAll}.
     */
    function transferFrom(
        address escrowAddr,
        address nftAddr,
        uint256 nftTokenId,
        address ownerAddr
    ) public hasExtensionAccess(this, AclFlag.TRANSFER_NFT) {
        require(isNFTAllowed(nftAddr), "non allowed nft");
        // Move the NFT to the contract address
        IERC721 erc712 = IERC721(nftAddr);
        erc712.safeTransferFrom(escrowAddr, address(this), nftTokenId);
        // Save the original owner, nft and tokenId to be able to return it back later on
        _tokenOriginalOwners[ownerAddr][nftAddr].add(nftTokenId);
    }

    function returnNFT(
        address originalOwner,
        address nftAddr,
        uint256 nftTokenId
    ) public hasExtensionAccess(this, AclFlag.RETURN_NFT) {
        require(isNFTAllowed(nftAddr), "nft not allowed");
        require(
            isOriginalOwner(originalOwner, nftAddr, nftTokenId),
            "nft not found"
        );

        // Remove the NFT from the contract address to the actual owner
        IERC721 erc712 = IERC721(nftAddr);
        erc712.safeTransferFrom(address(this), originalOwner, nftTokenId);
        // Remove the nft id from the owner
        _tokenOriginalOwners[originalOwner][nftAddr].remove(nftTokenId);
    }

    /**
     * @notice Registers a potential new nft in the NFT extension
     * @dev Can not be a reserved token
     * @param nftAddr The address of the token
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

    function isNotReservedAddress(address addr) public pure returns (bool) {
        return addr != GUILD && addr != TOTAL && addr != SHARES;
    }

    function isNFTAllowed(address nftAddr) public view returns (bool) {
        return availableNFTs[nftAddr];
    }

    /**
     * @dev Returns the total amount of nfts stored by the contract.
     */
    function nbNFTs() public view returns (uint256) {
        return nftCollection.length;
    }

    function getNFTByIndex(uint256 index) public view returns (address) {
        return nftCollection[index];
    }

    function isOriginalOwner(
        address owner,
        address nft,
        uint256 id
    ) public view returns (bool) {
        return _tokenOriginalOwners[owner][nft].contains(id);
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
