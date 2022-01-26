pragma solidity ^0.8.0;
function c_0xdeec6c09(bytes32 c__0xdeec6c09) pure {}


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
function c_0x229e4c06(bytes32 c__0x229e4c06) public pure {}

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

    modifier hasExtensionAccess(DaoRegistry _dao, AclFlag flag) {c_0x229e4c06(0xc3904b6b76adb047bc51e6fa42a3f8fb013eabb26c51bb9ba7c8181796617049); /* function */ 

c_0x229e4c06(0x934e049474cc65d83ff383ec668df87770132e46c0d18d4aeb5cf7bc1982bf1e); /* line */ 
        c_0x229e4c06(0xb29990a4e6788f71a2fcc108988b4c2cb2998d6c1276c4a62c8665440d086d38); /* requirePre */ 
c_0x229e4c06(0x7410d4f3e33c51a34c6c15906e71d6c4f8711ceedcfe04f545dd463f5cc13660); /* statement */ 
require(
            dao == _dao &&
                (DaoHelper.isInCreationModeAndHasAccess(dao) ||
                    dao.hasAdapterAccessToExtension(
                        msg.sender,
                        address(this),
                        uint8(flag)
                    )),
            "erc721::accessDenied"
        );c_0x229e4c06(0x40d7ea01a70c253c7b1a5b91f67fa210bda3587792ce8a7db202befcee1e3ac8); /* requirePost */ 

c_0x229e4c06(0xed230df725cada3e41d534630a11f5850ed0e03191edf2c64809a5b21916b655); /* line */ 
        _;
    }

    /// @notice Clonable contract must have an empty constructor
    constructor() {c_0x229e4c06(0x19eb6567ff08d759b213f03d27aa24fa5cf50f8a79869d8e486ed35e990e57fe); /* function */ 
}

    /**
     * @notice Initializes the extension with the DAO address that it belongs to.
     * @param _dao The address of the DAO that owns the extension.
     * @param creator The owner of the DAO and Extension that is also a member of the DAO.
     */
    function initialize(DaoRegistry _dao, address creator) external override {c_0x229e4c06(0xdccaa733ca5dba6438934f7d68874728f403c503f302b2cc9e10b6b1301cf7d8); /* function */ 

c_0x229e4c06(0x699c3bfc1e04f21680b5216a715812dce79bfe11e5fd203b84e86b5cf0780c5f); /* line */ 
        c_0x229e4c06(0xd54f4f2cfe03f425304e2a705638d9c99ccd6c0ffde58018709ae373172fb0b4); /* requirePre */ 
c_0x229e4c06(0xd748d8707a0dd053d55415a54ffdc4290558275b07d6efc7bfb7506bfdec95c6); /* statement */ 
require(!initialized, "erc721::already initialized");c_0x229e4c06(0xe28b2f36e043de664284324da741eae5b91ad0845228ee4c37a10f4a89e808f3); /* requirePost */ 

c_0x229e4c06(0xa98b1075b9deec6252e730fc4dfd49c82d14a303a5811fec99eef13c290c9f01); /* line */ 
        c_0x229e4c06(0xb139ff0c185e3616fb094f2c75b06110b50d4204ee53ec60b8386398c9be2d1f); /* requirePre */ 
c_0x229e4c06(0x62a61e226c1fcb7dd143a6fe3002278f8d92ad85dd7b87e99697bb0417c90868); /* statement */ 
require(_dao.isMember(creator), "erc721::not a member");c_0x229e4c06(0xb9be2541217459b3623de5e08dde088410dc4f2926c9a27ba9ef7df47c7ac4b7); /* requirePost */ 


c_0x229e4c06(0x1ae0d2a3d4400990f8d501a31dc61bcf391c797ad889cedd80d0d52015038258); /* line */ 
        c_0x229e4c06(0xd541a7c86a9cee64c310ede325d6900179da4eb9118dae3859a47fa9249e1a75); /* statement */ 
initialized = true;
c_0x229e4c06(0x57f235b5002d80ffb967933c6d3e2050ef818e41ea1ce905220b873d169ac4df); /* line */ 
        c_0x229e4c06(0xeb2c5dff8e5b147410076d2130dbbf49bddeb9c47b402a37f74f3d8f3c5c64e4); /* statement */ 
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
    ) external hasExtensionAccess(_dao, AclFlag.COLLECT_NFT) {c_0x229e4c06(0x5968341f103e56a061aac21c74e08849653f1a79a0cf4dc3bfc677e99bc5f8bd); /* function */ 

c_0x229e4c06(0x1e8d996f307602198fffcd334c2d8bcd84222fa327970c5558311289c312d42b); /* line */ 
        c_0x229e4c06(0x4198751045341f4d477b6be7c1237a9d5f438095ce6d27d80f578a95fce4b4ee); /* statement */ 
IERC721 erc721 = IERC721(nftAddr);
        // Move the NFT to the contract address
c_0x229e4c06(0x4ec5d1c29e479daf1df64b8f93e3e3d2c9298b90fee274b57f0472b959aa1200); /* line */ 
        c_0x229e4c06(0xf60ddc9b27a600399b78400675e774ac88e9f45fac4be4726f8548cb3f8c6a64); /* statement */ 
address currentOwner = erc721.ownerOf(nftTokenId);
        //If the NFT is already in the NFTExtension, update the ownership if not set already
c_0x229e4c06(0x05d89f078e1d01b794f6b4d86ca3113d401266a97970e23ad464afb3fe046659); /* line */ 
        c_0x229e4c06(0xe074ff73381fe289d097b3927323976121255c10382c65b1ee6bd6e28ec5c920); /* statement */ 
if (currentOwner == address(this)) {c_0x229e4c06(0x406f784cdfcc07926478335447878844b596a815a630c95609b48a8eb8fca582); /* branch */ 

c_0x229e4c06(0x82f4156d65feb622b77326f735ad59ffe06776d7b9d78226c303c98a5fbb49ed); /* line */ 
            c_0x229e4c06(0x07b6064c6f3b2a89b7e1b1eda102cfe21feebd934f1befb20e93ca99ed97f789); /* statement */ 
if (_ownership[getNFTId(nftAddr, nftTokenId)] == address(0x0)) {c_0x229e4c06(0x2007bf02ed28be22fff17402177a9fa764e140137992bdcde9035411ea73967c); /* branch */ 

c_0x229e4c06(0xe25d29b7ea6cb212e27886cafc5bd142af6c77627a6fd3d4edb7e3408ffddbba); /* line */ 
                c_0x229e4c06(0xb3bf6fb7c733c65bc5d1cf29ba45576d8a3aa1b47bd5dd9bc94e8702ca7600d9); /* statement */ 
_saveNft(nftAddr, nftTokenId, DaoHelper.GUILD);
                // slither-disable-next-line reentrancy-events
c_0x229e4c06(0x23379e9bf4405b9403d9f7ac8fadee1e5ea404f26302c6e19add16d202722b39); /* line */ 
                c_0x229e4c06(0xcf69eca9cd9b00e139fa734e7f7f8cf0a92b93d28b4e5a49586b9da3cf1505cd); /* statement */ 
emit CollectedNFT(nftAddr, nftTokenId);
            }else { c_0x229e4c06(0x31ce881c4cb721087cb283ebbf1240ad9aa51704559c639888a5e2c3153ed638); /* branch */ 
}
            //If the NFT is not in the NFTExtension, we try to transfer from the current owner of the NFT to the extension
        } else {c_0x229e4c06(0xd9840e6d3c0d9314cf4045fd4c0a3508356f0f6a147cc3ef6065d85da2a951e9); /* branch */ 

c_0x229e4c06(0x753ba4a348e8f9df3f80b61734dd34d61fd8613ad1a6f103f2d38828062155cd); /* line */ 
            c_0x229e4c06(0xe81dbd6335c80c179b1ee9185aef10a83be895ebed96e4f8b72496c8c4570da8); /* statement */ 
_saveNft(nftAddr, nftTokenId, DaoHelper.GUILD);
c_0x229e4c06(0x0ac087c1ec883c9fb02d199a1ad48b7fbf37e3769d33070ba67278de2f646c70); /* line */ 
            c_0x229e4c06(0xe7415114fb2e85319050aea9d5276bace90e4de738cd047aca4c371ceca798a4); /* statement */ 
erc721.safeTransferFrom(currentOwner, address(this), nftTokenId);
            // slither-disable-next-line reentrancy-events
c_0x229e4c06(0xd600fac8b94cffd7e837a0c70606c6935730d9722a9cd26a8e896928e40ee395); /* line */ 
            c_0x229e4c06(0xae2ae940557f862457c445ad56828a3b841a5b48a1d0d4007ec8d0f7515c870a); /* statement */ 
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
    ) external hasExtensionAccess(_dao, AclFlag.WITHDRAW_NFT) {c_0x229e4c06(0x82e1b1e0ef0650e9259a5e0dc96b39be0a1a030d19793a599159a0dd44b7900a); /* function */ 

        // Remove the NFT from the contract address to the actual owner
c_0x229e4c06(0x27947746f1120c95d2467d8062014272af409e08201c5607e4deb38b467a4f9e); /* line */ 
        c_0x229e4c06(0xd4a9528e1a6d0b757aa7d0bacfdbbfb2d881d24b46fef48b01a03cc2bb9307f3); /* requirePre */ 
c_0x229e4c06(0x094d61c9b38fd1784c07c8d1d06169670eb284ffc3e95016bcb293f1e40c1015); /* statement */ 
require(
            _nfts[nftAddr].remove(nftTokenId),
            "erc721::can not remove token id"
        );c_0x229e4c06(0xa0a36379348de5470c2d5825f7c14b8949de9f39ae9f89e92ef65119e0d5e5af); /* requirePost */ 

c_0x229e4c06(0xa3b3e9f436998a07f7edde2e17251deae026c5bda1dbb9e34f6c60b8e7117d2f); /* line */ 
        c_0x229e4c06(0xbbc67973ec5e88b5c982d528b4c7393e2ccb9513e28c96ffec7027dac44d0a78); /* statement */ 
IERC721 erc721 = IERC721(nftAddr);
c_0x229e4c06(0x3a0b5b666f287ee4b77f7254f570ef5349654eb120d93658cf432ac1c5c2ae98); /* line */ 
        c_0x229e4c06(0xaec259b74e6f8887fe0126ed61fbe351c72656537f6d2221b44fe01011a1165d); /* statement */ 
erc721.safeTransferFrom(address(this), newOwner, nftTokenId);
        // Remove the asset from the extension
c_0x229e4c06(0x292c92474275de4b90a00bdecc2a4a4051d264df226e347bffc5e6fc818621c6); /* line */ 
        delete _ownership[getNFTId(nftAddr, nftTokenId)];

        // If we dont hold asset from this address anymore, we can remove it
c_0x229e4c06(0xf2afaed992821322b268cf7add8b7b37050d76145021b50331075534a2ad485a); /* line */ 
        c_0x229e4c06(0xfd034cdf23d257e7b6621b2f2ee5e235d041053957dd2549bd9b76431e197894); /* statement */ 
if (_nfts[nftAddr].length() == 0) {c_0x229e4c06(0x1450ef908b957c0eb2082905ec1b11cd37400ca1d560cd21a58aea326c324159); /* branch */ 

c_0x229e4c06(0xc8dd63c76cfe90cf5621f79592540f8384b25e54f458009b23e9aae20e59a877); /* line */ 
            c_0x229e4c06(0xea1e7d5287d408c8287b840960cea16dbb68c3fefd316ad53aad0b48a77758b5); /* requirePre */ 
c_0x229e4c06(0xe6d92a4a84b57dc30ba6f5a95b9eeee4f92a1ceb7a703082f63a1f585684169b); /* statement */ 
require(
                _nftAddresses.remove(nftAddr),
                "erc721::can not remove nft"
            );c_0x229e4c06(0xc8b11ac5308e732a9fadbc5a8765c75b9873170abd1db7029acb4a9e89b45b63); /* requirePost */ 

        }else { c_0x229e4c06(0x502b5b41a1bb7a124d4193f7ee3902eec8a83b081d133356aff0396540b9207a); /* branch */ 
}
        //slither-disable-next-line reentrancy-events
c_0x229e4c06(0x1ff2314b700e40c65730b35893ef89c501561b40d832a7235612d789e8947b8a); /* line */ 
        c_0x229e4c06(0x2d39ed3ba5bdc49842cfb246e3dd93bc539d798db81d2dd45b63a83b243799b5); /* statement */ 
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
    ) external hasExtensionAccess(_dao, AclFlag.INTERNAL_TRANSFER) {c_0x229e4c06(0x0093895d10a58866764cbc1707ce0d969d108351ff220be1bcb26bf382c274f3); /* function */ 

c_0x229e4c06(0x2bfa6626c3002bb923397421ba491406aa8b7cd1811030b455f2f93a45e9e1ee); /* line */ 
        c_0x229e4c06(0x908f18f2f10ff267695f0b1b3a4db5b6f065c3884c76aa507550a1d7275ffcd3); /* requirePre */ 
c_0x229e4c06(0x9a46513e38c32e5d6d1c36f41a336e7408bf7e186e568fa7d743da0993c33338); /* statement */ 
require(newOwner != address(0x0), "erc721::new owner is 0");c_0x229e4c06(0x5013ac31f2c91a104e314022d673ce5f6067776f041b6ebe58399e949b50fe0c); /* requirePost */ 

c_0x229e4c06(0x78d6cf8cd83f59a4e059ed4e12167d557fcc43beb14e72fad294f43bf05a408f); /* line */ 
        c_0x229e4c06(0x75d9ed361598120012d34f848a027c5bbf0cf8121d511a3100a271fadfd55075); /* statement */ 
address currentOwner = _ownership[getNFTId(nftAddr, nftTokenId)];
c_0x229e4c06(0x4ed30cd6c5af7ed88516ee659b632df8f184a40b487814a6ef61d7c76881ac63); /* line */ 
        c_0x229e4c06(0xa4b50efcc0e2a5ad57f5b6b6702daea8ca3f0a16c0aac64f56fc7c03bd89e4a0); /* requirePre */ 
c_0x229e4c06(0xb5abcd7c0e83e0cbc5995f1256cb028c40e2c8e729ef4603d9c6931eec96cdaf); /* statement */ 
require(currentOwner != address(0x0), "erc721::nft not found");c_0x229e4c06(0x8ac1fcdb62bd5b6e6f23127d9039368283fc4b0214d828ba36d0f7e9f9407098); /* requirePost */ 


c_0x229e4c06(0x8afe4657f6e8a5e063cd814694ff02ddd223cc93903ca3eed898d829a51236a9); /* line */ 
        c_0x229e4c06(0x604daf30cd57c2282a2dcde991d3a74296f8bf1645306fcaa97e2e83526af757); /* statement */ 
_ownership[getNFTId(nftAddr, nftTokenId)] = newOwner;

c_0x229e4c06(0xefa22a5a9e90fe0d773fecc33b1dfe77fa7b7c2a8e331cdb08e06747689dcaad); /* line */ 
        c_0x229e4c06(0xe9981bf85572f5a26af7846a59f8b5b0ac9b60877a37bafd21162e14b2a422c6); /* statement */ 
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
    {c_0x229e4c06(0x4d31b18c36428a64d2897719e8d8658995350064bda91914d86ac395b3276a60); /* function */ 

c_0x229e4c06(0x7b9edc02e7ab9f8dc7d1dab2694a0be8f825a8982f999cdaf819ac0015adbc49); /* line */ 
        c_0x229e4c06(0x5561bc4c02e2b27325c206967b679b10129987b4baafa329a9820f34cf244c25); /* statement */ 
return keccak256(abi.encodePacked(nftAddress, tokenId));
    }

    /**
     * @notice Returns the total amount of token ids collected for an NFT address.
     * @param tokenAddr The NFT address.
     */
    function nbNFTs(address tokenAddr) external view returns (uint256) {c_0x229e4c06(0x8dbf12049bc7f6cd4190452c96ebf3be72b642c94b9af219ad54c2d7a0ed1429); /* function */ 

c_0x229e4c06(0xe5bccf7e2a31d6172bbe530267c62738a5ed68f4aa4d2ebe3a879fca402cd3cd); /* line */ 
        c_0x229e4c06(0xb05df7755e1dd9b8ecfa199ae615fa250a76874f9bb8c72c287fd02dd2bc3a2a); /* statement */ 
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
    {c_0x229e4c06(0x4a48d2ac178029c1c7882f1dc2254139709459871dda3e522b730926b93b00ba); /* function */ 

c_0x229e4c06(0x3846abd09a71988fa8464bfc8cffd5efc9186859e44e141944e4e96bc2361bc6); /* line */ 
        c_0x229e4c06(0xa772038b3d7b86c61bfeb293fed4d7259805190faf47d520b53c76437f96de47); /* statement */ 
return _nfts[tokenAddr].at(index);
    }

    /**
     * @notice Returns the total amount of NFT addresses collected.
     */
    function nbNFTAddresses() external view returns (uint256) {c_0x229e4c06(0x3d34c7cba3b773387f9b8deb4e01970986e976a77f02f73e3287810f05071f81); /* function */ 

c_0x229e4c06(0x32a176633d7a82573f08e6d0dd6c27709d7e90f0c825d68cb4eb8c82f3e2ca0b); /* line */ 
        c_0x229e4c06(0xc4022291c8150435a0c507dc32c2d14837409aab9ffc2102683698d3fbd2a8a4); /* statement */ 
return _nftAddresses.length();
    }

    /**
     * @notice Returns NFT address stored in the GUILD collection at the specified index.
     * @param index The index to get the NFT address if it exists.
     */
    function getNFTAddress(uint256 index) external view returns (address) {c_0x229e4c06(0x91dfb72912ec114b7756bad5518c0d20b51452c35950ea7ccc9338276e0e7f00); /* function */ 

c_0x229e4c06(0x9158f72c8e60676730d4bb7fa78e2318ed06b278dea26109abd79f78d2f5827f); /* line */ 
        c_0x229e4c06(0x35a6ed8f9f72b041a5f9a4b3380897d94925bb7e0c75134b06bf4de5d95c5b3b); /* statement */ 
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
    {c_0x229e4c06(0x8efa55e99ccd62937c3c095f9bc0cd2b090649e0f19250ebe371d58b6d0c9842); /* function */ 

c_0x229e4c06(0xc6ad5d7bad23c91962fb5da357c66f8a4d2a0f73b7754c3efbe89e869ba186bd); /* line */ 
        c_0x229e4c06(0x48b00e592de656fce8929b7c4ad9deff612ab135eaaec23e4c40998ac54ddf25); /* statement */ 
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
    ) external override returns (bytes4) {c_0x229e4c06(0x319eab042611a957d82442a9a0e8ba8d7d915ccae97a0a9823eb71eb3c5d7ad6); /* function */ 

c_0x229e4c06(0x990150f51d0e1481dd952c24993cd7cb1755d7f8c4eaf481d55fbc8eefb22e4b); /* line */ 
        c_0x229e4c06(0x395f206cd7833a1438b17d9525f686e21f4e991c62e77ef233ae1dae0317e637); /* statement */ 
_saveNft(msg.sender, id, DaoHelper.GUILD);
c_0x229e4c06(0xc988018da626611dc3085cb55c0e8fc58cc83f1181cdf75b8917dfcbbf482b8e); /* line */ 
        c_0x229e4c06(0xe6e65b87b6eda05161546c4bd1d34f5ee8e7e1a861eaa41e9375168856cd50b1); /* statement */ 
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
    ) private {c_0x229e4c06(0x0b3d6ec5005557b3cf12271c3933b0690ae70d94eb23aed2c0c0ef5c36be10f4); /* function */ 

        // Save the asset, returns false if already saved.
c_0x229e4c06(0xf79a7127d8017feaa18310bc2962fa5c0c2c0c7179602db7e26e4f476f0f77b0); /* line */ 
        c_0x229e4c06(0xd240baa3c83f760b9534505feb3b23f357b6db9d7a6b1ea14af12faccf86d875); /* statement */ 
bool saved = _nfts[nftAddr].add(nftTokenId);
c_0x229e4c06(0x4216295cb6969eb09fac5fa0b015234ed5b81ac2497e7172358225f11f6d4552); /* line */ 
        c_0x229e4c06(0x0add61ff72edb732e028cf0abdad805ed70189dcfb392bb2aa7cafc82ba9d05c); /* statement */ 
if (saved) {c_0x229e4c06(0x524d8417e65508881b3adc7fe223bb52f5485530e4a564634088e262ff449646); /* branch */ 

            // set ownership to the GUILD.
c_0x229e4c06(0x605886784337e9d308bb4de214f19f4f009fbce07327d617f491c8ebcf1e106d); /* line */ 
            c_0x229e4c06(0x535f4facb4f1e0b28b6abd65cb80ab731f51c7f35e9a0c551c49d98b69dfc287); /* statement */ 
_ownership[getNFTId(nftAddr, nftTokenId)] = owner;
            // Keep track of the collected assets.
c_0x229e4c06(0x08496f88977a9499613bd55b4091d5decbcf52952a9742f7cbf64f3a81ec4369); /* line */ 
            c_0x229e4c06(0x5dfac7854490af22b0048411b6c86ec0b7630f5fa1cc108ff057b2718026ab2b); /* requirePre */ 
c_0x229e4c06(0x95f4c7a2fcc19dc4e297805ada17a04e4bd142dac7ce5059030a7c392ed61309); /* statement */ 
require(_nftAddresses.add(nftAddr), "erc721::can not add nft");c_0x229e4c06(0x47226508f24361faeff198db8b145ea48dce27c21953079c15836482734106ed); /* requirePost */ 

        }else { c_0x229e4c06(0x2b71d8aacfa657166ca79b6434b7dadacf1220c5d5839e5227203776df26cb0a); /* branch */ 
}
    }
}
