pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/nft/NFT.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/AdapterGuard.sol";
import "../utils/PotentialNewMember.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
MIT License

Copyright (c) 2021 Openlaw

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

contract StakeNFTContract is
    DaoConstants,
    AdapterGuard,
    IERC721Receiver,
    IERC165,
    PotentialNewMember
{
    using Address for address payable;

    struct NFTProcess {
        address previousOwner;
        uint88 unitsPerNft;
    }

    struct ProcessProposal {
        DaoRegistry dao;
    }

    event NFTStaked(
        address nftContract,
        uint256 tokenId,
        address applicant,
        uint256 unitsPerNft
    );

    bytes32 constant UnitsPerNft = keccak256("stake-nft.unitsPerNft");
    bytes32 constant WhitelistedNFT = keccak256("stake-nft.whitelistedNFT");

    mapping(address => mapping(uint256 => NFTProcess)) internal nfts;

    /**
     * @notice Configures the adapter for a particular DAO.
     * @notice Registers the DAO internal token UNITS with the DAO Bank.
     * @dev Only adapters registered to the DAO can execute the function call (or if the DAO is in creation mode).
     * @dev A DAO Bank extension must exist and be configured with proper access for this adapter.
     * @param dao The DAO address.
     */
    function configureDao(
        DaoRegistry dao,
        address nftContractAddr,
        uint256 unitsPerNFT
    ) external onlyAdapter(dao) {
        require(nftContractAddr != address(0x0), "missing NFT addr");
        require(
            unitsPerNFT > 0 && unitsPerNFT < type(uint88).max,
            "bad unitsPerNFT"
        );

        dao.setConfiguration(UnitsPerNft, unitsPerNFT);
        dao.setAddressConfiguration(WhitelistedNFT, nftContractAddr);
    }

    /**
     * @notice Sends the NFT back to the original owner.
     */
    // slither-disable-next-line reentrancy-benign
    function sendNFTBack(
        DaoRegistry dao,
        address nftAddress,
        uint256 tokenId
    ) external reentrancyGuard(dao) {
        address previousOwner = nfts[nftAddress][tokenId].previousOwner;
        require(msg.sender == previousOwner, "only prev. owner can get NFT");
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));

        //remove the tokens
        bank.subtractFromBalance(
            msg.sender,
            UNITS,
            nfts[nftAddress][tokenId].unitsPerNft
        );
        NFTExtension nftExt = NFTExtension(dao.getExtensionAddress(NFT));

        nftExt.withdrawNFT(previousOwner, nftAddress, tokenId);
        delete nfts[nftAddress][tokenId];

        //TODO: emit an event
    }

    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        ProcessProposal memory ppS = abi.decode(data, (ProcessProposal));
        return _onERC721Received(ppS.dao, from, tokenId);
    }

    function _onERC721Received(
        DaoRegistry dao,
        address from,
        uint256 tokenId
    ) internal reentrancyGuard(dao) returns (bytes4) {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));

        uint256 unitsPerNft = dao.getConfiguration(UnitsPerNft);
        address whitelistedNFT = dao.getAddressConfiguration(WhitelistedNFT);

        require(whitelistedNFT == msg.sender, "not from whitelisted NFT");

        require(bank.isInternalToken(UNITS), "UNITS token not internal token");

        potentialNewMember(from, dao, bank);

        bank.addToBalance(from, UNITS, unitsPerNft);

        nfts[msg.sender][tokenId] = NFTProcess(from, uint88(unitsPerNft));
        IERC721 erc721 = IERC721(msg.sender);

        NFTExtension nftExt = NFTExtension(dao.getExtensionAddress(NFT));
        erc721.approve(address(nftExt), tokenId);
        nftExt.collect(msg.sender, tokenId);

        emit NFTStaked(msg.sender, tokenId, from, unitsPerNft);

        return this.onERC721Received.selector;
    }

    /**
     * @notice Supports ERC-165 & ERC-1155 interfaces only.
     * @dev https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1155.md
     */
    function supportsInterface(bytes4 interfaceID)
        external
        pure
        override
        returns (bool)
    {
        return
            interfaceID == this.supportsInterface.selector ||
            interfaceID == this.onERC721Received.selector;
    }
}
