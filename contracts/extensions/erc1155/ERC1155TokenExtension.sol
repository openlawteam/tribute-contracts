pragma solidity ^0.8.0;
function c_0xa2fff341(bytes32 c__0xa2fff341) pure {}

// SPDX-License-Identifier: MIT
import "../../core/DaoRegistry.sol";
import "../../guards/MemberGuard.sol";
import "../../helpers/DaoHelper.sol";
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

contract ERC1155TokenExtension is IExtension, IERC1155Receiver {
function c_0xd7a065b7(bytes32 c__0xd7a065b7) public pure {}

    using Address for address payable;
    //LIBRARIES
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    bool public initialized = false; //internally tracks deployment under eip-1167 proxy pattern
    DaoRegistry public dao;

    enum AclFlag {
        WITHDRAW_NFT,
        COLLECT_NFT,
        INTERNAL_TRANSFER
    }

    //EVENTS
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

    // All the NFT addresses stored in the Extension collection
    EnumerableSet.AddressSet private _nftAddresses;

    //MODIFIERS
    modifier hasExtensionAccess(DaoRegistry _dao, AclFlag flag) {c_0xd7a065b7(0xf50e0de593259d866955c514c9addfd456038e66be6171a4e81c38756ae31b03); /* function */ 

c_0xd7a065b7(0xad9496d1b05e79b6a2d952230d09427e95eee063edcab40cb61aa21c251fb1f3); /* line */ 
        c_0xd7a065b7(0x75e8258234bc08e3aaa32f6b712f3f078ca8a340400acf5c1e535607c968c020); /* requirePre */ 
c_0xd7a065b7(0xe4696a595ada4b9d474da27b16b650d53c4aa7fa00302cde6c9c90798d7df8b7); /* statement */ 
require(
            _dao == dao &&
                (DaoHelper.isInCreationModeAndHasAccess(dao) ||
                    dao.hasAdapterAccessToExtension(
                        msg.sender,
                        address(this),
                        uint8(flag)
                    )),
            "erc1155Ext::accessDenied"
        );c_0xd7a065b7(0xc723e39bf35a2a34265ba20b655081d1f9eb330acbcb39b5917314a2a8d1089e); /* requirePost */ 

c_0xd7a065b7(0xa7f8ef81a4367ea71dcf60252011cb8009c3fb69b0a883580ba8537429dd303f); /* line */ 
        _;
    }

    /// @notice Clonable contract must have an empty constructor
    constructor() {c_0xd7a065b7(0x3a0425b1f29d3eded1988e7b08549a11fe840a3c1cfbdd26d15393affac10efe); /* function */ 
}

    /**
     * @notice Initializes the extension with the DAO address that it belongs to.
     * @param _dao The address of the DAO that owns the extension.
     * @param creator The owner of the DAO and Extension that is also a member of the DAO.
     */
    function initialize(DaoRegistry _dao, address creator) external override {c_0xd7a065b7(0x4bf7f267526ed943763c6a0a61d16585d6b8b4784dd2cfa1408bcb5cbecf860e); /* function */ 

c_0xd7a065b7(0x520cf5b3a44dd1a45fef230d4cc319eacfcf767cfa9f745d17b63f1d8957c0c5); /* line */ 
        c_0xd7a065b7(0x21e4438b7699325f278923f1a141fdc87647cdb78fe6b2dd9b885d3254afb92b); /* requirePre */ 
c_0xd7a065b7(0xb4c0b4d56d73c02e624cf0013756a51b1ea640cc37c71fc79de335c1aff31f7f); /* statement */ 
require(!initialized, "erc1155Ext::already initialized");c_0xd7a065b7(0x6e427ad37a7f05abda4eb08f3a9c5fcdc880448274b32ba2bb681af2cd20c033); /* requirePost */ 

c_0xd7a065b7(0xfa81a125f1d39361be337cf95eed6441d6f0c3ac9efd58833f3adebb77938ea1); /* line */ 
        c_0xd7a065b7(0x4785b6227ecf9d057225fc5621d05dbc5f591e36b3d52157f0d27d5c6fd7be5c); /* requirePre */ 
c_0xd7a065b7(0xb8322fd8e1533345cd7e9bd6ee1e1ecb4e453327394d8b544243b1e49173e4e7); /* statement */ 
require(_dao.isMember(creator), "erc1155Ext::not a member");c_0xd7a065b7(0x17212899cc9638242ec5d82a51694f5dbc7c7eb1ffd7f6deafc09f5dff0d2336); /* requirePost */ 


c_0xd7a065b7(0x28a63a384265376d929595619a1a45b4c1db4eb497c35441cb9c0916f2ce147a); /* line */ 
        c_0xd7a065b7(0x2306f633d2487128bfb1c44663ab210105cdec78ddd917262dc404dc97fc0e57); /* statement */ 
initialized = true;
c_0xd7a065b7(0x0b2bb9bbe751217c068c8766adbbdc5ec1d73cea6ee5c762b442c8d0d2f3e943); /* line */ 
        c_0xd7a065b7(0xe07b1a6b20a5d96c3450f40068e07c081b22dba8a1c50f3385e60914cf11b319); /* statement */ 
dao = _dao;
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
        DaoRegistry _dao,
        address from,
        address newOwner,
        address nftAddr,
        uint256 nftTokenId,
        uint256 amount
    ) external hasExtensionAccess(_dao, AclFlag.WITHDRAW_NFT) {c_0xd7a065b7(0xf56b8a1f6170e027d6559ba0b19445b3fc2b3924fcd90f8df7a427ef238c07e4); /* function */ 

c_0xd7a065b7(0x49b67487ef241fac92ae649f9b779d15c49e4f5f719afee720a48d30d11cf62a); /* line */ 
        c_0xd7a065b7(0xd415b4dd7296fa2ccaa29ee0c34e7dd8d0d5c32fb7980fc72a7b24825e33dc03); /* statement */ 
IERC1155 erc1155 = IERC1155(nftAddr);
c_0xd7a065b7(0x66356a0b879081c2b06eff7bbff3a44645977e276f07c4a43c8209db5dee8c75); /* line */ 
        c_0xd7a065b7(0x43d0f7b0bb901a2c5461be1203229447f4bf355b5d62dd956f0f50930c3d2b27); /* statement */ 
uint256 balance = erc1155.balanceOf(address(this), nftTokenId);
c_0xd7a065b7(0xe727acfa01ba57349405e5a41993cafbd63bf817c4425ab357c4356cfc1eb2ca); /* line */ 
        c_0xd7a065b7(0x9641711d9cf009b5104e8426705a739bda750c5b5465e8785e045ba573f4e63f); /* requirePre */ 
c_0xd7a065b7(0x7d69e6ea064bd5a8b034da7ca00a4b295dac293c9ffdbae8d3c0cc087ef252f3); /* statement */ 
require(
            balance > 0 && amount > 0,
            "erc1155Ext::not enough balance or amount"
        );c_0xd7a065b7(0x2e628c75fadacc740fb8706ed966f82399ba5b4c43175ca71f94574ee5ca5ccc); /* requirePost */ 


c_0xd7a065b7(0xa4b8e09d554670b7c45f9d4a12776549eec17a4f985ef1f609f97df2875c0d3b); /* line */ 
        c_0xd7a065b7(0x3252546b66ebc2ced081ebb87565fc0955fc702416864ea86c13214401cc3280); /* statement */ 
uint256 currentAmount = _getTokenAmount(from, nftAddr, nftTokenId);
c_0xd7a065b7(0x9714b6284d0dad4f6f6e336d456bda9274057fbd2cc5d1a3aa1215470a707308); /* line */ 
        c_0xd7a065b7(0x54772ebba7ac7611039e793f49158cc4e345f7e07900e296006604e108d3bf93); /* requirePre */ 
c_0xd7a065b7(0x2f5024889c2865da473a3b55847872b570920d250bef934a1fc065b9ccaf3359); /* statement */ 
require(currentAmount >= amount, "erc1155Ext::insufficient funds");c_0xd7a065b7(0xd3ad41300c3eec050e8e2d5c5cdcadb2460cf96b8daa52b21af959578408efc2); /* requirePost */ 

c_0xd7a065b7(0x982d910bab99457577565d26b84bc7e4231d74b95e97f114e602d3b96c8f7fb7); /* line */ 
        c_0xd7a065b7(0x451c5279bf9f8d74b396f3f8dea51aae53d5c27870230ce8df1bb0393311811f); /* statement */ 
uint256 remainingAmount = currentAmount - amount;

        // Updates the tokenID amount to keep the records consistent
c_0xd7a065b7(0x8f7fd84b49f344b8d39b252f94ab6b53e3f300e935d040349b5a9cc3dd7a896f); /* line */ 
        c_0xd7a065b7(0xc36843ac19bc007b638e8c6d85976f48a649eacc59f01b43c10c8a45162c8297); /* statement */ 
_updateTokenAmount(from, nftAddr, nftTokenId, remainingAmount);

c_0xd7a065b7(0x2cca49800fed0b6e56935a0846dcfff5e1e7ad96078d71edd56cce2f2b3ea1cb); /* line */ 
        c_0xd7a065b7(0xc4eed3397fdceef6ef1cc0fb3a7cbdf18a2661a1aff64f920586d22e0400d837); /* statement */ 
uint256 ownerTokenIdBalance = erc1155.balanceOf(
            address(this),
            nftTokenId
        ) - amount;

        // Updates the mappings if the amount of tokenId in the Extension is 0
        // It means the GUILD/Extension does not hold that token id anymore.
c_0xd7a065b7(0x2bf95ee1d2470b39615ff622634f851441078e0a8e528f9f60804e0e580f50f2); /* line */ 
        c_0xd7a065b7(0x14bcfdd274e608099bc781a933ef40717dab453cac31b3077b31a5bbc486f375); /* statement */ 
if (ownerTokenIdBalance == 0) {c_0xd7a065b7(0xce1c3801487e162639694150e5e2fa9ecaa1188f1f04b337955381a913066e2c); /* branch */ 

c_0xd7a065b7(0x030e970dd3db4cc9788487b47e5f491896217d5610a98dbcc6da863d2102313c); /* line */ 
            delete _nftTracker[newOwner][nftAddr][nftTokenId];
            //slither-disable-next-line unused-return
c_0xd7a065b7(0x7ad97ffc883c4a236a55fcb4224d4e967b46239a3e538ba125b6c32c94ffcbe0); /* line */ 
            c_0xd7a065b7(0xa52622c0081b66e0af3c804c685297e4498a7a3f99dfb2cdfd6fb30fb95aed44); /* statement */ 
_ownership[getNFTId(nftAddr, nftTokenId)].remove(newOwner);
            //slither-disable-next-line unused-return
c_0xd7a065b7(0x02dc12c4f279bbab6a04e8e9e124a64abef5bcf97d179ab6ddb2ea5a98b6198f); /* line */ 
            c_0xd7a065b7(0xc6730dcfd175cf2b1a48b154a593c7144af0a802aaf5e40eb0be94710646124e); /* statement */ 
_nfts[nftAddr].remove(nftTokenId);
            // If there are 0 tokenIds for the NFT address, remove the NFT from the collection
c_0xd7a065b7(0x284afedeba802b8bfa84ad560ddb5757f80fd7808b6b30267a2a477a96013a1b); /* line */ 
            c_0xd7a065b7(0xa39b7755fcc07b4d3bafd8d86a474fc8cb9b5c771358760261cf8728977de273); /* statement */ 
if (_nfts[nftAddr].length() == 0) {c_0xd7a065b7(0x62e9c33699e22d0eeb2bf159ea40a2ebe9eb88f8e80871ec7b51b40ec38bda73); /* branch */ 

                //slither-disable-next-line unused-return
c_0xd7a065b7(0x36ffc05fd372e475760ff01f9bc2764804d29971c6884d344fb128e52e7ccdc0); /* line */ 
                c_0xd7a065b7(0x45a26353b4857c8a0a1efe6ef885d12f48e2b333f71420a61db414f0537971fa); /* statement */ 
_nftAddresses.remove(nftAddr);
c_0xd7a065b7(0x43622023894f51c2569b8c026ce6e0d6bca229d1420ace444f97cc67dda91de2); /* line */ 
                delete _nfts[nftAddr];
            }else { c_0xd7a065b7(0xaf2cc62fc7dd39a9ad44b337eb4c95826cc1a89891c668b9e8b626081557a735); /* branch */ 
}
        }else { c_0xd7a065b7(0x71109bb4364e31e74dcd17a6e86342d7069a68370e0f5153a48901ec2c8f2eea); /* branch */ 
}

        // Transfer the NFT, TokenId and amount from the contract address to the new owner
c_0xd7a065b7(0xbf3d112384b873113c686d79300b9205de0a0b92ac7136f115668f7624d3c658); /* line */ 
        c_0xd7a065b7(0x7764af671c7ab0d6b47542110ffa02b72e9b439085f844ec065ef10648fc63de); /* statement */ 
erc1155.safeTransferFrom(
            address(this),
            newOwner,
            nftTokenId,
            amount,
            ""
        );
        //slither-disable-next-line reentrancy-events
c_0xd7a065b7(0xca99b824143d69465e35e4ec8a74c0f34b5f2203e556c7eade213867b09ebc8b); /* line */ 
        c_0xd7a065b7(0x9e431570a5bbd397254011d2044111fa9646fe5d5f98c6975f8d2d2d4317b50b); /* statement */ 
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
        DaoRegistry _dao,
        address fromOwner,
        address toOwner,
        address nftAddr,
        uint256 nftTokenId,
        uint256 amount
    ) external hasExtensionAccess(_dao, AclFlag.INTERNAL_TRANSFER) {c_0xd7a065b7(0x85e395dbe4183d1a5b3e93097dadeecbf8dc998f49e9434d0a419d5052cf3698); /* function */ 

        // Checks if there token amount is valid and has enough funds
c_0xd7a065b7(0x8b223e0eb2281867a3c439330b3efad48e479c9754be9882f20878a756e9d573); /* line */ 
        c_0xd7a065b7(0x3d5f498419a6be0d4926671cccce366b6793284e2ceaed5bb6dc264840f230c2); /* statement */ 
uint256 tokenAmount = _getTokenAmount(fromOwner, nftAddr, nftTokenId);
c_0xd7a065b7(0x84a73a79eb4ee73b739d00d53d7c34affd98a9fdfc35e0d76b7700c3ea7b355a); /* line */ 
        c_0xd7a065b7(0xebcd7bc4b1c7fa06ac1a383b53801a4da43aaf306715b8f9062d9f8c3e6de9eb); /* requirePre */ 
c_0xd7a065b7(0xc942685c09510c360fa66ff4c8954f2bf7ecd555952ba0246e8ac4fff33f4f7c); /* statement */ 
require(
            amount > 0 && tokenAmount >= amount,
            "erc1155Ext::invalid amount"
        );c_0xd7a065b7(0x5eae3f57d3a5c5d4d1f18f2b7e67033d4ead4c33ee2074068020de4f990883cd); /* requirePost */ 


        // Checks if the extension holds the NFT
c_0xd7a065b7(0x7a9ba56cec69b7009749b6c3dbdbff0fe2617d9505f9900cb329854ef6d16e99); /* line */ 
        c_0xd7a065b7(0x903051166ef38245634d9e17ac4eb2aa128f827cf293635af1556268b9cf1eed); /* requirePre */ 
c_0xd7a065b7(0x5219e6d28b08b585628f507708c99998b5a665e25b8d52dedd0e2f9500bb9f2e); /* statement */ 
require(
            _nfts[nftAddr].contains(nftTokenId),
            "erc1155Ext::nft not found"
        );c_0xd7a065b7(0x22150edf356be53cfa0dba6784d3fe4a182cdceb7439637f9cbc9b0a734417ba); /* requirePost */ 

c_0xd7a065b7(0x89ed5d5f15428a3897c451158e89d6929fe945c07a4def46a266e6f240911f42); /* line */ 
        c_0xd7a065b7(0xdf6723d5b727bef0c45123a359fa7be0705b42884b2ee6cae608b613474893d4); /* statement */ 
if (fromOwner != toOwner) {c_0xd7a065b7(0x7ad7670095c095d3df6100bb6ccc3aaa7072556a6b557315b82085d36f423a87); /* branch */ 

            // Updates the internal records for toOwner with the current balance + the transferred amount
c_0xd7a065b7(0x337f01836a3bc71cb662f8dc27e3a4b3777dbf1d608bed5cbef240d531980340); /* line */ 
            c_0xd7a065b7(0x39c5b5a86646bf9c260f9b8e465f9f3fe2cf6cb0ee1f73a93523f779e3a0df7e); /* statement */ 
uint256 toOwnerNewAmount = _getTokenAmount(
                toOwner,
                nftAddr,
                nftTokenId
            ) + amount;
c_0xd7a065b7(0xbb6b99a96aa5983e729769f18d3e3a8a4dd822f0084132a300099c3e993007ff); /* line */ 
            c_0xd7a065b7(0xfcf10606102393021c041cf4ccb8ceebc503687bc230a99167288360e036d663); /* statement */ 
_updateTokenAmount(toOwner, nftAddr, nftTokenId, toOwnerNewAmount);
            // Updates the internal records for fromOwner with the remaning amount
c_0xd7a065b7(0x3544848aec132a8ada4f016520cb5f0804540918cced9abcf2ee93bc6bb1b9c3); /* line */ 
            c_0xd7a065b7(0x4376173f22ef097a2ba43d1ffc6442a7af85ab34b46c7799e53739ae08f4d3e1); /* statement */ 
_updateTokenAmount(
                fromOwner,
                nftAddr,
                nftTokenId,
                tokenAmount - amount
            );
            //slither-disable-next-line reentrancy-events
c_0xd7a065b7(0xf929004e6a0ff55565bafc1a16687036c0693c53458d27f1ca6f0ac34b3b3de0); /* line */ 
            c_0xd7a065b7(0xe2d1b92f37e789d650ec09fe975dfc7b2263fe18f745460540637e85858db242); /* statement */ 
emit TransferredNFT(
                fromOwner,
                toOwner,
                nftAddr,
                nftTokenId,
                amount
            );
        }else { c_0xd7a065b7(0xfe62d1709a8591f5e4b18ee22cb7a1c764782496101e32e3b3545be8ca86309e); /* branch */ 
}
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
    {c_0xd7a065b7(0x8af0c370427e22c9da8cf680ca5c2961683620cc34cb770df31d668852c2bb91); /* function */ 

c_0xd7a065b7(0xa26ab992ba88f0eb894b16fa09f9081256d990cb97a351b3d356e19a2dfd062f); /* line */ 
        c_0xd7a065b7(0xd615874c1b2e176f064e46c0b2411e2af5c2a4e515e8e20083da872a58a9c39a); /* statement */ 
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
    ) external view returns (uint256) {c_0xd7a065b7(0x7a7c439f67248013c40b18bbbd20e96e283c304e3232b3fa3256af382694e246); /* function */ 

c_0xd7a065b7(0x7f0ef98d3a43b8b42cb3f36d006e5dedfb219f108ac52e893f3a1d1cbe92ceec); /* line */ 
        c_0xd7a065b7(0x16eb62554a8fe637919d1e111f2b0a10128d7eb3c83a48fb3618592ac93eee01); /* statement */ 
return _nftTracker[owner][tokenAddr][tokenId];
    }

    /**
     * @notice Returns the total amount of token ids collected for an NFT address.
     * @param tokenAddr The NFT address.
     */
    function nbNFTs(address tokenAddr) external view returns (uint256) {c_0xd7a065b7(0x0b93fb90be260d12308ca9792664ed5b502b343d0ccef26950bf09c5208bc628); /* function */ 

c_0xd7a065b7(0xe2d30039814e0713d28c303352c1ba8da970c1a2c15a19ac9a2b18fc26995ff5); /* line */ 
        c_0xd7a065b7(0x9565299c245cfe9eb8045927626063fe26c3d3ddabb3d97489636f10e4b1af9b); /* statement */ 
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
    {c_0xd7a065b7(0x7b73fdd1003e9ccd61e71e865ffe5a2950116d25be07dd884ef5f995d5dd6e18); /* function */ 

c_0xd7a065b7(0xd0757756ab71107a9b7a4708ab873eecae2488edacfcdf62dcfa9afc3bbf8128); /* line */ 
        c_0xd7a065b7(0x355075bf97f6c066d3f36af54f4d7b943c17a7e9f7d30606ded767dee520e247); /* statement */ 
return _nfts[tokenAddr].at(index);
    }

    /**
     * @notice Returns the total amount of NFT addresses collected.
     */
    function nbNFTAddresses() external view returns (uint256) {c_0xd7a065b7(0xd4f498f2b2c8c49d6b166c28d0b7f93a1d50f19f341871cd58f67c153194426b); /* function */ 

c_0xd7a065b7(0xb881491cffc68962116aadcb60264f94b4ce295076fdc4d4c27c75532f8e5a50); /* line */ 
        c_0xd7a065b7(0xddb9c5c4338c305d1ea0ce9ff43afe35a6f39207d48136cc59482d0a44c1d639); /* statement */ 
return _nftAddresses.length();
    }

    /**
     * @notice Returns NFT address stored in the GUILD collection at the specified index.
     * @param index The index to get the NFT address if it exists.
     */
    function getNFTAddress(uint256 index) external view returns (address) {c_0xd7a065b7(0x46113c681a6b815c7ca3a86252113b9f044242d980036b000f160d5eb778857a); /* function */ 

c_0xd7a065b7(0xcce84a3a05083d82d430e2d54ed744ce892ed043e2864b4f22e84fe161e4d1ca); /* line */ 
        c_0xd7a065b7(0x4cf4f2e9fdc05d1d5b30beea99391db8283f57ae10f309c6856b9a302c80d007); /* statement */ 
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
    ) external view returns (address) {c_0xd7a065b7(0x12e82f71760dcf18034599eb4be98cfa32168bdf603656357f53e153625e7a2d); /* function */ 

c_0xd7a065b7(0x68927a43529e8bdd64147519e354cc9b46c970c80282366069361dff561c39d5); /* line */ 
        c_0xd7a065b7(0x18f77ef3be6ea9deadac5eb402ad21229172b254403c72a4247ad5086a86a63a); /* statement */ 
return _ownership[getNFTId(nftAddress, tokenId)].at(index);
    }

    /**
     * @notice Returns the total number of owners of an NFT addresses and token id collected.
     */
    function nbNFTOwners(address nftAddress, uint256 tokenId)
        external
        view
        returns (uint256)
    {c_0xd7a065b7(0x17b4138a72bf37c517c5eda00996f53575ed4d12d3642322b3060d07f6e19ab6); /* function */ 

c_0xd7a065b7(0x29a87afbe8c1e3b9a633f6539902c32272d693e4a7c0a30d129b42a8b9f0f99d); /* line */ 
        c_0xd7a065b7(0x1f9b65e84b4956de5bee2a1eb8f2bba048df02ffe1e496f95fb85a0dade3f854); /* statement */ 
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
    ) private {c_0xd7a065b7(0x72e0ad74b9a4e7c51201a184f461be7c736ed43ecb483d3ee3dad79b3ae82981); /* function */ 

        // Save the asset address and tokenId
        //slither-disable-next-line unused-return
c_0xd7a065b7(0xadef107cad9420627483c880aa921b1e86fe2bb5fb6035fc36b038227631d520); /* line */ 
        c_0xd7a065b7(0xb40a9226a6419696617a5013dbe1eb35372bdc13929ff19d8b946fd2195d6415); /* statement */ 
_nfts[nftAddr].add(nftTokenId);
        // Track the owner by nftAddr+tokenId
        //slither-disable-next-line unused-return
c_0xd7a065b7(0x900bdda2f90626fff12b0fab38f9fae8e87c37a201b83ee49fbe8af847290cd6); /* line */ 
        c_0xd7a065b7(0xa37fbd70a6933e6fc2321054effae12bf3d71f8861bec4b02a6f4786d6ac795d); /* statement */ 
_ownership[getNFTId(nftAddr, nftTokenId)].add(owner);
        // Keep track of the collected assets addresses
        //slither-disable-next-line unused-return
c_0xd7a065b7(0xc43cafebd9eb178b06482f04ce466dc644baf4efa46ed3c5707eb1d83a38b242); /* line */ 
        c_0xd7a065b7(0x8d62732d759d636d1f0d7744688d64c7917789ccec1fbe4a9dbf55ad4b0bbfa9); /* statement */ 
_nftAddresses.add(nftAddr);
        // Track the actual owner per Token Id and amount
c_0xd7a065b7(0x3d9d94b5fa5b2b8b6792c161afdfd62714e48d3aa520d9fa81b83f8a730649dd); /* line */ 
        c_0xd7a065b7(0x0420ceb412a5a49d6e25d96dc284beb23049499fac1b60496fd12e7bf59bcfb5); /* statement */ 
uint256 currentAmount = _nftTracker[owner][nftAddr][nftTokenId];
c_0xd7a065b7(0x7cec6322726581d5af3d451fe9027d6953d93f71748e8c618e768f5821046371); /* line */ 
        c_0xd7a065b7(0xeab0929b926f7f83ccc5fd57ca5f2e1e2721721cbb67ccf27bced1dc565e403f); /* statement */ 
_nftTracker[owner][nftAddr][nftTokenId] = currentAmount + amount;
    }

    /**
     *  @notice required function from IERC1155 standard to be able to to receive tokens
     */
    function onERC1155Received(
        address,
        address,
        uint256 id,
        uint256 value,
        bytes calldata
    ) external override returns (bytes4) {c_0xd7a065b7(0xde895bb3c84720df93ff6cd147ed682be13a57f47eee0c2f0cd4c12e0e1e3ab2); /* function */ 

c_0xd7a065b7(0x42e8c19b77b994a0152ade6cca6491a128636f9e662a4a299bd405c8664633f7); /* line */ 
        c_0xd7a065b7(0x692245dc625f950ef22e6097c5ee9cb2784cedb64a8c042f781d4502159fa36c); /* statement */ 
_saveNft(msg.sender, id, DaoHelper.GUILD, value);
c_0xd7a065b7(0x150a0a279a6648c46080445ae1bc87fde3fed4f610e7286319b3394d1f79f19d); /* line */ 
        c_0xd7a065b7(0x4ec5f6e3bd7aa3b1c2daf76ad6449831ea824fe4c7ce76355ffd185032abaaa5); /* statement */ 
return this.onERC1155Received.selector;
    }

    /**
     *  @notice required function from IERC1155 standard to be able to to batch receive tokens
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata
    ) external override returns (bytes4) {c_0xd7a065b7(0x08343b13246460ccb8e7075bbaf66129cc8ee48abcffd6735d32acb3c9ab6aea); /* function */ 

c_0xd7a065b7(0x188bc4ced83f31104c5d64294a7f2993687cf4b5303c3d2383d37de56bfacf7c); /* line */ 
        c_0xd7a065b7(0xfb18b3640c1b1655c49c2efb5dc50f39574815ba911ec91f33878adae5367c1e); /* requirePre */ 
c_0xd7a065b7(0x83bdca40427f54169db2ff280de0bfa72d97c87b57f6a9c4be5d12d16a4a9db1); /* statement */ 
require(
            ids.length == values.length,
            "erc1155Ext::ids values length mismatch"
        );c_0xd7a065b7(0x2577250ff61d6fcb222f611c3c749c098dfb2546c00ade3bba0419c5a43b59d2); /* requirePost */ 

c_0xd7a065b7(0xdbed7b207148469f57ab5e03bb2168000c683b3d5a53c5140402b305482b3d82); /* line */ 
        c_0xd7a065b7(0xd5fe1cf081dadade1606adc0671093458b1dc33f7981346161de4392d5ea0578); /* statement */ 
for (uint256 i = 0; i < ids.length; i++) {
c_0xd7a065b7(0x4d5206c077cf55a2dd54db268edde2fca459551cfc31a96ee768f350041da01f); /* line */ 
            c_0xd7a065b7(0xba35a432617ecc2a0c60976029d5e0e09797de5fe55d4f1aa994078ba46278c0); /* statement */ 
_saveNft(msg.sender, ids[i], DaoHelper.GUILD, values[i]);
        }

c_0xd7a065b7(0xbbb676040399b99e3d25861852176d817e4db44c3592e1a990a0a326ae4be55d); /* line */ 
        c_0xd7a065b7(0xd409c29be2e785ac2f0a21b52b45baabf7170bb1a348df54b45ff1469ed854cc); /* statement */ 
return this.onERC1155Received.selector;
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
    {c_0xd7a065b7(0xe8ebc32d5d0380685a5615053440ab26229bd7fc85bf705b0ef4f2820ba93ebc); /* function */ 

c_0xd7a065b7(0xb6002e747529ce5bc6cee8ee047fe1c5ec0cb7c2a08f253b9da30ed4034a20be); /* line */ 
        c_0xd7a065b7(0x5449f796406b6a135622539c9de93eb9277e82499edf5a52b444f18b9d70b92d); /* statement */ 
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
    ) internal {c_0xd7a065b7(0x3e8675909d6cfade7805f2d97d45296cb1dc819bd89c0f5dbd185f3db9e6d5b1); /* function */ 

c_0xd7a065b7(0x851cb7f171a346701fb91fe1293b7327cb1b4bd1c78745e531e9b95901694613); /* line */ 
        c_0xd7a065b7(0x1de7bdfa4ff4060540923279095d43066518a1f5584011c7165f0f3d5b236742); /* statement */ 
_nftTracker[owner][nft][tokenId] = amount;
    }

    /**
     *  @notice internal function to get the amount of a tokenID for an NFT an owner has
     */
    function _getTokenAmount(
        address owner,
        address nft,
        uint256 tokenId
    ) internal view returns (uint256) {c_0xd7a065b7(0xc109fb48a0126d06f7fa3075defce038cf02751c87ad72105cf738ebc7db99ac); /* function */ 

c_0xd7a065b7(0x00f0e0cebe8f1310dfaebc5e889d65c4c3d63b1bbfe0d9896e8ca4734192e7be); /* line */ 
        c_0xd7a065b7(0x7425f22dde40c8bfbc064ba43e8c04976035f3afca37bac524a2f344c789ed28); /* statement */ 
return _nftTracker[owner][nft][tokenId];
    }
}
