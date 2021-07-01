pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "../../core/DaoConstants.sol";
import "../../core/DaoRegistry.sol";
import "../../guards/AdapterGuard.sol";
import "../IExtension.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

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

contract ERC1155TokenExtension is
    DaoConstants,
    AdapterGuard,
    IExtension,
    IERC1155Receiver
{
    using Address for address payable;
    //LIBRARIES

    bool public initialized = false; //
    DaoRegistry public dao;

    enum AclFlag {WITHDRAW_1155, COLLECT_1155, INTERNAL_TRANSFER}

    //EVENTS

    //MAPPINGS

    //MODIFIERS
    modifier hasExtensionAccess(IExtension extension, AclFlag flag) {
        require(
            dao.state() == DaoRegistry.DaoState.CREATION ||
                dao.hasAdapterAccessToExtension(
                    msg.sender,
                    address(extension),
                    uint8(flag)
                ),
            "1155TokenExtension::accessDenied"
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
        require(!initialized, "already initialized");
        require(_dao.isMember(creator), "not a member");

        initialized = true;
        dao = _dao;
    }

    /**
     * @notice Collects the NFT from the owner and moves it to the NFT extension.
     * @notice It must be have been allowed to move this token by either {approve} or {setApprovalForAll}.
     * @dev Reverts if the NFT is not in ERC1155 standard.
     * @param nftAddr The NFT contract address.
     * @param nftTokenId The NFT token id.
     */
    function collect(address nftAddr, uint256 nftTokenId)
        external
        hasExtensionAccess(this, AclFlag.COLLECT_1155)
    {
        IERC1155 erc1155 = IERC1155(nftAddr);
        // Move the NFT to the contract address
        address currentOwner = erc1155.ownerOf(nftTokenId);
        //If the NFT is already in the NFTExtension, update the ownership if not set already
        if (currentOwner == address(this)) {
            if (_ownership[getNFTId(nftAddr, nftTokenId)] == address(0x0)) {
                _saveNft(nftAddr, nftTokenId, GUILD);

                emit CollectedNFT(nftAddr, nftTokenId);
            }
            //If the NFT is not in the NFTExtension, we try to transfer from the current owner of the NFT to the extension
        } else {
            erc1155.safeTransferFrom(currentOwner, address(this), nftTokenId);
            _saveNft(nftAddr, nftTokenId, GUILD);

            emit CollectedNFT(nftAddr, nftTokenId);
        }
    }
}
