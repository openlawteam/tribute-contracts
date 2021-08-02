pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../extensions/erc1155/ERC1155TokenExtension.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "./interfaces/IConfiguration.sol";
import "../adapters/interfaces/IVoting.sol";

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

contract ERC1155AdapterContract is DaoConstants, MemberGuard, AdapterGuard {
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable {
        revert("fallback revert");
    }

    /**
     * @notice Collects the NFT from the owner and moves to the ERC1155 Token extension address
     * @param dao The DAO address.
     * @param nftAddr The NFT smart contract address.
     * @param nftTokenId The NFT token id.
     * @param amount of the nftTokenId
     */
     
    // function collect(
    //     DaoRegistry dao,
    //     address nftAddr,
    //     uint256 nftTokenId,
    //     uint256 amount
    // ) external reentrancyGuard(dao) {
    //     ERC1155TokenExtension erc1155 =
    //         ERC1155TokenExtension(dao.getExtensionAddress(ERC1155_EXT));
    //     erc1155.collect(msg.sender, nftAddr, nftTokenId, amount);
    // }

    function withdrawNFT(
        DaoRegistry dao,
        // address newOwner,// or msg.sender?
        address nftAddr,
        uint256 nftTokenId,
        uint256 amount
    ) external reentrancyGuard(dao) {
        ERC1155TokenExtension erc1155 =
            ERC1155TokenExtension(dao.getExtensionAddress(ERC1155_EXT));
        erc1155.withdrawNFT(msg.sender, nftAddr, nftTokenId, amount);
    }

    function internalTransfer(
        DaoRegistry dao,
        address fromOwner,
        address toOwner,
        address nftAddr,
        uint256 nftTokenId,
        uint256 amount
    ) external reentrancyGuard(dao) {
        ERC1155TokenExtension erc1155 =
            ERC1155TokenExtension(dao.getExtensionAddress(ERC1155_EXT));
        erc1155.internalTransfer(
            fromOwner,
            toOwner,
            nftAddr,
            nftTokenId,
            amount
        );
    }
}
