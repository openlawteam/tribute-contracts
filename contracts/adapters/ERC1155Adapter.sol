pragma solidity ^0.8.0;
function c_0xdf071ed3(bytes32 c__0xdf071ed3) pure {}


// SPDX-License-Identifier: MIT
import "../core/DaoRegistry.sol";
import "../extensions/erc1155/ERC1155TokenExtension.sol";
import "../guards/AdapterGuard.sol";
import "./interfaces/IConfiguration.sol";
import "../adapters/interfaces/IVoting.sol";
import "../helpers/DaoHelper.sol";

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

contract ERC1155AdapterContract is AdapterGuard {
function c_0x6db68451(bytes32 c__0x6db68451) public pure {}

    /**
     * @notice Internally transfers the NFT from one owner to a new owner as long as both are active members.
     * @notice Reverts if the addresses of the owners are not members.
     * @notice Reverts if the fromOwner does not hold the NFT.
     * @param dao The DAO address.
     * @param toOwner The new owner address of the NFT.
     * @param nftAddr The NFT smart contract address.
     * @param nftTokenId The NFT token id.
     * @param amount of the nftTokenId.
     */
    function internalTransfer(
        DaoRegistry dao,
        address toOwner,
        address nftAddr,
        uint256 nftTokenId,
        uint256 amount
    ) external reentrancyGuard(dao) {c_0x6db68451(0x68efaa4076508c35e1c7569e41d34d2e282777fc76cb87830dc1210f25d7a132); /* function */ 

c_0x6db68451(0x6b4e8f73527f9370e1cba61e183b783901b48a3e011ca3667b7bf8e66e60f103); /* line */ 
        c_0x6db68451(0x1c2606bbc05f69b875a67479d95bd224dc3ddb731863f3a0cfe5e8ea7ec18ddb); /* statement */ 
ERC1155TokenExtension erc1155 = ERC1155TokenExtension(
            dao.getExtensionAddress(DaoHelper.ERC1155_EXT)
        );
c_0x6db68451(0x425d0a00f71d817617d43d3d80c05fe238f1af7a2309688822f8c23342d0f332); /* line */ 
        c_0x6db68451(0x2419950a5ef51b2a8ac3e3543b7783907ff76602061393179bc51e85943e9abc); /* statement */ 
erc1155.internalTransfer(
            dao,
            DaoHelper.msgSender(dao, msg.sender),
            toOwner,
            nftAddr,
            nftTokenId,
            amount
        );
    }
}
