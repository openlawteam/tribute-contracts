pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "../../core/DaoConstants.sol";
import "../../core/DaoRegistry.sol";
import "../../guards/AdapterGuard.sol";
import "../IExtension.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
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

contract ERC1155TokenExtension is
    DaoConstants,
    AdapterGuard,
    IExtension,
    IERC1155Receiver
{
    using Address for address payable;
    //LIBRARIES
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    bool public initialized = false; //internally tracks deployment under eip-1167 proxy pattern
    DaoRegistry public dao;

    enum AclFlag {WITHDRAW_NFT, COLLECT_NFT, INTERNAL_TRANSFER}

    //EVENTS
    event CollectedNFT(address nftAddr, uint256 nftTokenId, uint256 amount);
    event TransferredNFT(
        address oldOwner,
        address newOwner,
        address nftAddr,
        uint256 nftTokenId,
        uint256 amount
    );
    event WithdrawnNFT(
        address nftAddr,
        uint256 nftTokenId,
        uint256 amount,
        address toAddress
    );

    //MAPPINGS

    //All the Token IDs that belong to an NFT address stored in the GUILD
    mapping(address => EnumerableSet.UintSet) private _nfts;

    // The internal owner of record of an NFT that has been transferred to the extension
    mapping(bytes32 => EnumerableSet.AddressSet) private _ownership;

    //the number amount of Token IDs that belong to an NFT address stored in the Guild for a specific Token ID
    // owner => tokenAddress => tokenId => tokenAmount
    mapping(address => mapping(address => mapping(uint256 => uint256)))
        private _nftTracker;

    //All the NFT addresses collected and stored in the GUILD collection
    EnumerableSet.AddressSet private _nftAddresses;

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
     * @param amount The amount of NFT with nftTokenId to be collected.
     */
    function collect(
        address owner,
        address nftAddr,
        uint256 nftTokenId,
        uint256 amount
    ) external hasExtensionAccess(this, AclFlag.COLLECT_NFT) {
        IERC1155 erc1155 = IERC1155(nftAddr);
        erc1155.safeTransferFrom(
            owner,
            address(this),
            nftTokenId,
            amount,
            "0x0"
        );
        _saveNft(nftAddr, nftTokenId, GUILD, amount);
        emit CollectedNFT(nftAddr, nftTokenId, amount);
    }

    /**
     * @notice Transfers the NFT token from the extension address to the new owner.
     * @notice It also updates the internal state to keep track of the all the NFTs collected by the extension.
     * @notice The caller must have the ACL Flag: WITHDRAW_NFT
     * @dev Reverts if the NFT is not in ERC1155 standard.
     * @param newOwner The address of the new owner.
     * @param nftAddr The NFT address that must be in ERC1155 standard.
     * @param nftTokenId The NFT token id.
     */
    function withdrawNFT(
        address newOwner,
        address nftAddr,
        uint256 nftTokenId,
        uint256 amount
    ) external hasExtensionAccess(this, AclFlag.WITHDRAW_NFT) {
        IERC1155 erc1155 = IERC1155(nftAddr);
        uint256 balance = erc1155.balanceOf(address(this), nftTokenId);
        require(
            balance > 0 && amount > 0,
            "not enough funds or invalid amount"
        );

        uint256 currentAmount = _nftTracker[GUILD][nftAddr][nftTokenId];
        uint256 newAmount = currentAmount - amount;
        require(newAmount >= 0, "nothing to withdraw or insufficient funds");

        // remove / update the tokenID amount from the extension
        _nftTracker[GUILD][nftAddr][nftTokenId] = newAmount;

        // Remove the NFT from the contract address to the actual owner
        erc1155.safeTransferFrom(
            address(this),
            newOwner,
            nftTokenId,
            amount,
            "0x0"
        );
        //update/delete mappings if the amount of tokenId in Guild = 0
        uint256 ownerTokenIdBalance =
            erc1155.balanceOf(address(this), nftTokenId);
        if (ownerTokenIdBalance == 0) {
            delete _ownership[getNFTId(nftAddr, nftTokenId)];
            delete _nftTracker[GUILD][nftAddr][nftTokenId];
            _nfts[nftAddr].remove(nftTokenId);
        //if there are 0 tokenIds for the NFT address, remove the NFT from mapping
            if (_nfts[nftAddr].length() == 0) {
                _nftAddresses.remove(nftAddr);
            }
        }

        emit WithdrawnNFT(nftAddr, nftTokenId, amount, newOwner);
    }

    /**
     * @notice Updates internally the ownership of the NFT.
     * @notice The caller must have the ACL Flag: INTERNAL_TRANSFER
     * @dev Reverts if the NFT is not already internally owned in the extension.
     * @param fromOwner The address of the current owner.
     * @param toOwner The address of the new owner.
     * @param nftAddr The NFT address.
     * @param nftTokenId The NFT token id.
     * @param amount the number of a partricular NFT token id.
     */
    function internalTransfer(
        address fromOwner,
        address toOwner,
        address nftAddr,
        uint256 nftTokenId,
        uint256 amount
    ) public hasExtensionAccess(this, AclFlag.INTERNAL_TRANSFER) {
        // TODO should the `newOwner` be a member address?

        require(fromOwner != address(0x0), "invalid fromOwner arg");
        require(toOwner != address(0x0), "invalid toOwner arg");
        //check if fromOwner exists
        bool holdsNFT =
            _ownership[getNFTId(nftAddr, nftTokenId)].contains(fromOwner);
        require(holdsNFT, "nft not found");
        //update amount for fromOwner to newAmount
        uint256 currentAmount = _nftTracker[fromOwner][nftAddr][nftTokenId];
        uint256 newAmount = currentAmount - amount;
        //check to see if internalTransfer overdraws fromOwner's account
        require(newAmount >= 0, "nothing to transfer or insufficient funds");
        //retrieve  or create toOwner account for tokenId
        uint256 newOwnerBalance = _nftTracker[toOwner][nftAddr][nftTokenId];
        //update amounts for toOwner and fromOwner
        _nftTracker[toOwner][nftAddr][nftTokenId] = newOwnerBalance + amount;
        _nftTracker[fromOwner][nftAddr][nftTokenId] = newAmount;

        emit TransferredNFT(fromOwner, toOwner, nftAddr, nftTokenId, amount);
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

    //return amount of owner -> nft address - tokenID -amount
    function getNFTIdAmount(
        address _owner,
        address tokenAddr,
        uint256 tokenId
    ) public view returns (uint256) {
        return _nftTracker[_owner][tokenAddr][tokenId];
    }

    /**
     * @notice Returns the total amount of token ids collected for an NFT address.
     * @param tokenAddr The NFT address.
     */
    function nbNFTs(address tokenAddr) public view returns (uint256) {
        return _nfts[tokenAddr].length();
    }

    /**
     * @notice Returns token id associated with an NFT address stored in the GUILD collection at the specified index.
     * @param tokenAddr The NFT address.
     * @param index The index to get the token id if it exists.
     */
    function getNFT(address tokenAddr, uint256 index)
        public
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
    function getNFTOwner(
        address nftAddress,
        uint256 tokenId,
        uint256 index
    ) public view returns (address) {
        return _ownership[getNFTId(nftAddress, tokenId)].at(index);
    }

    /**
     * @notice Returns the total number of owners of an NFT addresses and token id collected.
     */
    function nbNFTOwners(address nftAddress, uint256 tokenId)
        external
        view
        returns (uint256)
    {
        return _ownership[getNFTId(nftAddress, tokenId)].length();
    }

    /**
     * @notice Helper function to update the extension states for an NFT collected by the extension.
     * @param nftAddr The NFT address.
     * @param nftTokenId The token id.
     * @param owner The address of the owner.
     * @param amount of the tokenID 
     */
    function _saveNft(
        address nftAddr,
        uint256 nftTokenId,
        address owner,
        uint256 amount
    ) private {
        //TODO - check if/else conditional needed in case the tokenId/owner or nft address is already in the mappings?
        // Save the asset
        _nfts[nftAddr].add(nftTokenId);
        // set ownership to the GUILD
        _ownership[getNFTId(nftAddr, nftTokenId)].add(owner);
        // Keep track of the collected assets
        _nftAddresses.add(nftAddr);
        //update the amount of a particular Token ID in the GUILD
        uint256 currentAmount = _nftTracker[owner][nftAddr][nftTokenId];
        _nftTracker[owner][nftAddr][nftTokenId] = currentAmount + amount;
    }

    /**
     *  @notice required function from IERC1155 standard to be able to to receive tokens
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        revert("not supported");
    }

    // TODO double check which type/interfaceIds it will support
    function supportsInterface(bytes4) external pure override returns (bool) {
        return true; // supportedInterfaces[interfaceID];
    }
}
