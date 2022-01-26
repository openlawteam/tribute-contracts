pragma solidity ^0.8.0;
function c_0x5dd37422(bytes32 c__0x5dd37422) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";
import "../utils/Signatures.sol";
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

contract CouponOnboardingContract is Reimbursable, AdapterGuard, Signatures {
function c_0xcc94009b(bytes32 c__0xcc94009b) public pure {}

    struct Coupon {
        address authorizedMember;
        uint256 amount;
        uint256 nonce;
    }

    using SafeERC20 for IERC20;

    string public constant COUPON_MESSAGE_TYPE =
        "Message(address authorizedMember,uint256 amount,uint256 nonce)";
    bytes32 public constant COUPON_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(COUPON_MESSAGE_TYPE));

    bytes32 constant SignerAddressConfig =
        keccak256("coupon-onboarding.signerAddress");
    bytes32 constant TokenAddrToMint =
        keccak256("coupon-onboarding.tokenAddrToMint");

    bytes32 constant ERC20InternalTokenAddr =
        keccak256("coupon-onboarding.erc20.internal.token.address");

    mapping(address => mapping(uint256 => uint256)) private _flags;

    event CouponRedeemed(
        address daoAddress,
        uint256 nonce,
        address authorizedMember,
        uint256 amount
    );

    /**
     * @notice Configures the Adapter with the coupon signer address and token to mint.
     * @param signerAddress the address of the coupon signer
     * @param erc20 the address of the internal ERC20 token to issue shares
     * @param tokenAddrToMint the address of the token to mint the coupon
     * @param maxAmount max amount of coupons to mint
     */
    function configureDao(
        DaoRegistry dao,
        address signerAddress,
        address erc20,
        address tokenAddrToMint,
        uint88 maxAmount
    ) external onlyAdapter(dao) {c_0xcc94009b(0x37327eb27d407ad49143e33bd96688a2d473a3c24149c47276aac8614ab6df93); /* function */ 

c_0xcc94009b(0xb8d89a448ba4652f3346bac9d5bc76019cac2985572e87f3cfdcfd8ee8992b62); /* line */ 
        c_0xcc94009b(0xbb491793feaf26773032de94c23e276f972f04b43fabcd6923887ebce5ef9b15); /* statement */ 
dao.setAddressConfiguration(SignerAddressConfig, signerAddress);
c_0xcc94009b(0x4cd11abfc4a7738a4d21a3ce4c311d476ff1cd6b907b0ce2879128a91e44fcec); /* line */ 
        c_0xcc94009b(0xe4eb31fdf17c1706ffc14d41d06e384cb7fd0b03682c5a79209bbf7986bb9d76); /* statement */ 
dao.setAddressConfiguration(ERC20InternalTokenAddr, erc20);
c_0xcc94009b(0x512f6dc8a9d2c1db277aec16797a56d6a8ad7b51761dbe0f843424e3296bdd0f); /* line */ 
        c_0xcc94009b(0x119debec00a33ca0fc0a3e0992f9addbb0bc219a371959ff2161661d882719b8); /* statement */ 
dao.setAddressConfiguration(TokenAddrToMint, tokenAddrToMint);

c_0xcc94009b(0x9ef86a0ef6c1a7ccae8e57714a778d4d583b7ddb39f7e98ef091e30c58ce860c); /* line */ 
        c_0xcc94009b(0x2d114343f29ccaedea778e96591a60820175c5c40470e49f312ff5acfaf1ba4a); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0xcc94009b(0x1c8c75502179be2075410a5d0064b78ffe7966305934973e94ea8a037c604f5d); /* line */ 
        c_0xcc94009b(0x897129ddac370efee96689c5faa82defb0cbeb9715aadc6519b109b0fd1ade28); /* statement */ 
bank.registerPotentialNewInternalToken(dao, tokenAddrToMint);
c_0xcc94009b(0x7675a9501e6afa04b68b61e0ca58f34f0fcf938c2250471c0d99a028bca2338f); /* line */ 
        c_0xcc94009b(0x724d528b1641d225b4a12cad7953ea0bb86dae10541accfc507262f782afb313); /* statement */ 
uint160 currentBalance = bank.balanceOf(
            DaoHelper.TOTAL,
            tokenAddrToMint
        );
c_0xcc94009b(0x903c4d7c9cbea2d10f588ed7bef069fa5809acb51a11c25a019f85ef33ede12f); /* line */ 
        c_0xcc94009b(0xd99083f5fa6831f1fb3a772685746e80457ea72ce19ef1f61347081f7961ed15); /* statement */ 
if (currentBalance < maxAmount) {c_0xcc94009b(0x445377851be15a782024b47fc511292c31bb109de0825f20e5e72899b9be025d); /* branch */ 

c_0xcc94009b(0x0680dadab0a875e71342bf417d7d3fedf57391c8d81713ce09e57d7e3921c773); /* line */ 
            c_0xcc94009b(0xf97b33054e7a9c030d6c1088b9615815f6f59fd5a42156a76e50e15af3bebefa); /* statement */ 
bank.addToBalance(
                dao,
                DaoHelper.GUILD,
                tokenAddrToMint,
                maxAmount - currentBalance
            );
        }else { c_0xcc94009b(0x4209e58aeaf952987a9c78af85f2d32369ab0e727b5f8c429fd217bc55e16e69); /* branch */ 
}
    }

    /**
     * @notice Hashes the provided coupon as an ERC712 hash.
     * @param dao is the DAO instance to be configured
     * @param coupon is the coupon to hash
     */
    function hashCouponMessage(DaoRegistry dao, Coupon memory coupon)
        public
        view
        returns (bytes32)
    {c_0xcc94009b(0x961f09e25aa09014222e9eefd7b8358c15cfa981ec85d4b560b6a0f3bc7cc2d8); /* function */ 

c_0xcc94009b(0xfb147633fe9807bc5ecf5e1b43782c220694794d265f7484a45be6751a41e8da); /* line */ 
        c_0xcc94009b(0x9a670768282ca42170a44039d383c8c2735a096600e842ed5d98b6ee3ddf6390); /* statement */ 
bytes32 message = keccak256(
            abi.encode(
                COUPON_MESSAGE_TYPEHASH,
                coupon.authorizedMember,
                coupon.amount,
                coupon.nonce
            )
        );

c_0xcc94009b(0xb5d9ca2190eaefecc68a54d8e21ed2e9bcf80824a645f4e76c4983370b2b0323); /* line */ 
        c_0xcc94009b(0xa1da160bf249a687ffa58211703a4de4134183b9549d0f3521a1d43c9d2961b6); /* statement */ 
return hashMessage(dao, address(this), message);
    }

    /**
     * @notice Redeems a coupon to add a new member.
     * @param dao is the DAO instance to be configured
     * @param authorizedMember is the address that this coupon authorized to become a new member
     * @param amount is the amount of units that this member will receive
     * @param nonce is a unique identifier for this coupon request
     * @param signature is message signature for verification
     */
    // function is protected against reentrancy attack with the reentrancyGuard(dao)
    // slither-disable-next-line reentrancy-benign
    function redeemCoupon(
        DaoRegistry dao,
        address authorizedMember,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external reimbursable(dao) {c_0xcc94009b(0x46e024dc368f9aad52f30426974fb9e558afd70dc7834228fac460cf9f8f1f08); /* function */ 

c_0xcc94009b(0xa4cb62cedb480aa2e39e06d9f9f93ae4e001684423b317105497b37f67ba8041); /* line */ 
        {
c_0xcc94009b(0x8e9bfba5787fec79cf39acb1d6c2b5bd662f6d8528ff776f08c5360baa24df6b); /* line */ 
            c_0xcc94009b(0x8095fed2fcaeab8fafb01427f448838330eb8952781b67de2c3845e0a8c114a5); /* statement */ 
uint256 currentFlag = _flags[address(dao)][nonce / 256];
c_0xcc94009b(0x5e487b4d5e2984975154209e271060ec99fa6cb31be3d91e3da5178058d69572); /* line */ 
            c_0xcc94009b(0xb8c2e0cdb733a2b7351f3d16ced075e0477835bd06d1baaa51205a3021235577); /* statement */ 
_flags[address(dao)][nonce / 256] = DaoHelper.setFlag(
                currentFlag,
                nonce % 256,
                true
            );
c_0xcc94009b(0x799f84cc7c99c7237a13817c8706dad1f768ae061306809df2cf4c0f2f92ffeb); /* line */ 
            c_0xcc94009b(0x673fa312ca72a9ab0c24038ae98372f34541cdc1b728232b430f0c81e24005aa); /* requirePre */ 
c_0xcc94009b(0xb28849abd2ce1c7ec913c1fa55f2f83a2d99d0a87a818c4c3088bea2cf9b95cc); /* statement */ 
require(
                DaoHelper.getFlag(currentFlag, nonce % 256) == false,
                "coupon already redeemed"
            );c_0xcc94009b(0x775bfc0c90b9f99f8dddfd2160f2ecb93fecc41f20dc0e66a1c30a50679ef9b5); /* requirePost */ 

        }

c_0xcc94009b(0x506ca389daf0639e9a89b46d16990287b480ab1e4e533e4ff8ea09ac5e98f87c); /* line */ 
        c_0xcc94009b(0x6d90908ec3f2812fa5c9cee18cdc2bf8b2e6bb742bd04568518af8a4047bdc0c); /* statement */ 
Coupon memory coupon = Coupon(authorizedMember, amount, nonce);
c_0xcc94009b(0xc8c8e834169b507b724a15c58fd06a15a6c67c8fb31311668d24b5c0cf5c2165); /* line */ 
        c_0xcc94009b(0x31747907bce2103fe642b265199a22f039b859b4a03582af3771e91b6efcf179); /* statement */ 
bytes32 hash = hashCouponMessage(dao, coupon);

c_0xcc94009b(0x0b75894172c34c2fd7af621c4962c33d75f8c54ec1387504a9513d6a8c9a3472); /* line */ 
        c_0xcc94009b(0xf08598870532e51656211c782a91102a65ed96bde3a2f46d8450a224355983fb); /* requirePre */ 
c_0xcc94009b(0x907b437d0454669777f4e85ec67f1041635c004a99e0e165773e738b91d9a9d0); /* statement */ 
require(
            SignatureChecker.isValidSignatureNow(
                dao.getAddressConfiguration(SignerAddressConfig),
                hash,
                signature
            ),
            "invalid sig"
        );c_0xcc94009b(0x148156542e01532dcb9e34493797e4b4479090857f5d16fc56983c4217c8e7e6); /* requirePost */ 


c_0xcc94009b(0x51cc7b8183d9f3e31752b73194e2d194ce33ba943b5c2cd492069810dc5de2a1); /* line */ 
        c_0xcc94009b(0xaac0a1ce6820d7164d72bf48122607c6315274548c49fbdbe65d5cbf09b9512b); /* statement */ 
IERC20 erc20 = IERC20(
            dao.getAddressConfiguration(ERC20InternalTokenAddr)
        );
c_0xcc94009b(0xa4a93e905d09bc25593d56dbae04fcec2f23fb307ee669d630fec41cb7d698d3); /* line */ 
        c_0xcc94009b(0x91c69bed120303d4c468be12452d76832941fd68929739ac076badf3da87c410); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0xcc94009b(0xad712b206b8d6da341584d57384e9395ac5a807d4c24b9f7286526bb847cd3d3); /* line */ 
        c_0xcc94009b(0x8ab410002568b094cc74d1e0c9cce2c57fff735c463ad9d1b26ecbe2074ca3e7); /* statement */ 
if (address(erc20) == address(0x0)) {c_0xcc94009b(0x60f548d4d1c33ceaf9049a7f2260f4494e4c8bf9cee8215a616e7f021954d5cd); /* branch */ 

c_0xcc94009b(0xcac6c57e5afcb302b6457de221c2b994ada315373a464b5abd8294028718d9fa); /* line */ 
            c_0xcc94009b(0x82368d0894ddaa1fd3fe72d76c5852a0f89aaa69c3e7d506bd8b038d8276c5ab); /* statement */ 
address tokenAddressToMint = dao.getAddressConfiguration(
                TokenAddrToMint
            );
c_0xcc94009b(0x68a2b90ed19b0f020eb7a9abbafdb40009a39cd9f74cea73275c480379503ec3); /* line */ 
            c_0xcc94009b(0x5b4fbe80ccfc18ab628e0f68528c0bc5f5579d359b91f0c2deb09fb31c21f5bc); /* statement */ 
bank.internalTransfer(
                dao,
                DaoHelper.GUILD,
                authorizedMember,
                tokenAddressToMint,
                amount
            );
            // address needs to be added to the members mappings. ERC20 is doing it for us so no need to do it twice
c_0xcc94009b(0xf36f521350d96a91f7d610cb4d26581ed4a92cf71aae160b6a8a2127692f6dcd); /* line */ 
            c_0xcc94009b(0x17c2f302b52fae2dd5004be1609fad1ab2b240bef19651b9a24434a3a38b337b); /* statement */ 
DaoHelper.potentialNewMember(authorizedMember, dao, bank);
        } else {c_0xcc94009b(0x3f4c38d358505b8882f012cccdc034bb3c2b21015d6b2a27cfe6b1486f11b1b3); /* branch */ 

c_0xcc94009b(0x242f99b955805452d3ef0659ee5566b37013ec39a1fe18fd88c23dabf095b775); /* line */ 
            c_0xcc94009b(0x6273e75f8a05f39bc87cd8ba9bf3ecb3d27d5c3afc7a516191aad199e223c632); /* statement */ 
erc20.safeTransferFrom(DaoHelper.GUILD, authorizedMember, amount);
        }
        //slither-disable-next-line reentrancy-events
c_0xcc94009b(0xb0de0c3c7589f26261ef577ae35699722768e707d2d37963f8199c98b08c2226); /* line */ 
        c_0xcc94009b(0xdc584f8a8f7b7d3dbe1a7062d83fe6d29241e32377e65f12aec9ef4332eb0937); /* statement */ 
emit CouponRedeemed(address(dao), nonce, authorizedMember, amount);
    }
}
