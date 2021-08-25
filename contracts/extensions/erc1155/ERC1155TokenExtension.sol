pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "../../core/DaoConstants.sol";
import "../../core/DaoRegistry.sol";
import "../../guards/AdapterGuard.sol";
import "../../guards/MemberGuard.sol";
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
    MemberGuard,
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

    // All the Token IDs that belong to an NFT address stored in the GUILD.
    mapping(address => EnumerableSet.UintSet) private _nfts;

    // The internal mapping to track the owners, nfts, tokenIds, and amounts records of the owners that sent ther NFT to the extension
    // owner => (tokenAddress => (tokenId => tokenAmount)).
    mapping(address => mapping(address => mapping(uint256 => uint256)))
        private _nftTracker;

    // The (NFT Addr + Token Id) key reverse mapping to track all the tokens collected and actual owners.
    mapping(bytes32 => EnumerableSet.AddressSet) private _ownership;

    // All the NFT addresses collected and stored in the GUILD/Extension collection
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
            "erc1155Ext::accessDenied"
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
     * @param owner The actual owner of the NFT that will get collected.
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
        _saveNft(nftAddr, nftTokenId, owner, amount);
        emit CollectedNFT(nftAddr, nftTokenId, amount);
    }

    /**
     * @notice Transfers the NFT token from the extension address to the new owner.
     * @notice It also updates the internal state to keep track of the all the NFTs collected by the extension.
     * @notice The caller must have the ACL Flag: WITHDRAW_NFT
     * @notice This function needs to be called from a new adapter (RagequitNFT) that will manage the Bank balances, and will return the NFT to the owner.
     * @dev Reverts if the NFT is not in ERC1155 standard.
     * @param newOwner The address of the new owner that will receive the NFT.
     * @param nftAddr The NFT address that must be in ERC1155 standard.
     * @param nftTokenId The NFT token id.
     * @param amount The NFT token id amount to withdraw.
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

        uint256 currentAmount = _getTokenAmount(newOwner, nftAddr, nftTokenId);
        uint256 remainingAmount = currentAmount - amount;
        require(remainingAmount >= 0, "insufficient funds");

        // Updates the tokenID amount to keep the records consistent
        _updateTokenAmount(newOwner, nftAddr, nftTokenId, remainingAmount);

        // Transfer the NFT, TokenId and amount from the contract address to the new owner
        erc1155.safeTransferFrom(
            address(this),
            newOwner,
            nftTokenId,
            amount,
            "0x0"
        );

        uint256 ownerTokenIdBalance =
            erc1155.balanceOf(address(this), nftTokenId);

        // Updates the mappings if the amount of tokenId in the Extension is 0
        // It means the GUILD/Extension does not hold that token id anymore.
        if (ownerTokenIdBalance == 0) {
            delete _nftTracker[newOwner][nftAddr][nftTokenId];
            _ownership[getNFTId(nftAddr, nftTokenId)].remove(newOwner);
            _nfts[nftAddr].remove(nftTokenId);
            // If there are 0 tokenIds for the NFT address, remove the NFT from the collection
            if (_nfts[nftAddr].length() == 0) {
                _nftAddresses.remove(nftAddr);
                delete _nfts[nftAddr];
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
     * @param amount the number of a particular NFT token id.
     */
    function internalTransfer(
        address fromOwner,
        address toOwner,
        address nftAddr,
        uint256 nftTokenId,
        uint256 amount
    ) external hasExtensionAccess(this, AclFlag.INTERNAL_TRANSFER) {
        require(isActiveMember(dao, fromOwner), "fromOwner is not a member");
        require(isActiveMember(dao, toOwner), "toOwner is not a member");

        // Checks if the extension holds the NFT
        bool isNFTCollected = _nfts[nftAddr].contains(nftTokenId);
        require(isNFTCollected, "nft not found");

        // Checks if there token amount is valid and has enough funds
        uint256 currentAmount = _getTokenAmount(fromOwner, nftAddr, nftTokenId);
        uint256 remainingAmount = currentAmount - amount;
        require(
            amount > 0 && remainingAmount >= 0,
            "insufficient funds or invalid amount"
        );

        // Updates the internal records for toOwner with the current balance + the transferred amount
        uint256 toOwnerNewAmount =
            _getTokenAmount(toOwner, nftAddr, nftTokenId) + amount;
        _updateTokenAmount(toOwner, nftAddr, nftTokenId, toOwnerNewAmount);
        // Updates the internal records for fromOwner with the remaning amount
        _updateTokenAmount(fromOwner, nftAddr, nftTokenId, remainingAmount);

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

    /**
     * @notice gets owner's amount of a TokenId for an NFT address.
     * @param owner eth address
     * @param tokenAddr the NFT address.
     * @param tokenId The NFT token id.
     */
    function getNFTIdAmount(
        address owner,
        address tokenAddr,
        uint256 tokenId
    ) public view returns (uint256) {
        return _nftTracker[owner][tokenAddr][tokenId];
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
        // Save the asset address and tokenId
        _nfts[nftAddr].add(nftTokenId);
        // Track the owner by nftAddr+tokenId
        _ownership[getNFTId(nftAddr, nftTokenId)].add(owner);
        // Keep track of the collected assets addresses
        _nftAddresses.add(nftAddr);
        // Track the actual owner per Token Id and amount
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

    /**
     *  @notice required function from IERC1155 standard to be able to to batch receive tokens
     *  @dev this function is currently not supported in this extension and will revert
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        revert("not supported");
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
            interfaceID == 0x01ffc9a7 || // ERC-165 support (i.e. `bytes4(keccak256('supportsInterface(bytes4)'))`).
            interfaceID == 0x4e2312e0; // ERC-1155 `ERC1155TokenReceiver` support (i.e. `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)")) ^ bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).
    }

    /**
     *  @notice internal function to update the amount of a tokenID for an NFT an owner has
     */
    function _updateTokenAmount(
        address owner,
        address nft,
        uint256 tokenId,
        uint256 amount
    ) internal {
        _nftTracker[owner][nft][tokenId] = amount;
    }

    /**
     *  @notice internal function to get the amount of a tokenID for an NFT an owner has
     */
    function _getTokenAmount(
        address owner,
        address nft,
        uint256 tokenId
    ) internal view returns (uint256) {
        return _nftTracker[owner][nft][tokenId];
    }
}
