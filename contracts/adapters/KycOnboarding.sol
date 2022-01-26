pragma solidity ^0.8.0;
function c_0xe1be7cd1(bytes32 c__0xe1be7cd1) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/AdapterGuard.sol";
import "../utils/Signatures.sol";
import "../helpers/WETH.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./modifiers/Reimbursable.sol";

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

contract KycOnboardingContract is
    AdapterGuard,
    MemberGuard,
    Signatures,
    Reimbursable
{
function c_0x239370aa(bytes32 c__0x239370aa) public pure {}

    using Address for address payable;
    using SafeERC20 for IERC20;

    event Onboarded(DaoRegistry dao, address member, uint256 units);
    struct Coupon {
        address kycedMember;
    }

    struct OnboardingDetails {
        uint88 chunkSize;
        uint88 numberOfChunks;
        uint88 unitsPerChunk;
        uint88 unitsRequested;
        uint88 maximumTotalUnits;
        uint160 amount;
    }

    string public constant COUPON_MESSAGE_TYPE = "Message(address kycedMember)";
    bytes32 public constant COUPON_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(COUPON_MESSAGE_TYPE));

    bytes32 constant SignerAddressConfig =
        keccak256("kyc-onboarding.signerAddress");

    bytes32 constant ChunkSize = keccak256("kyc-onboarding.chunkSize");
    bytes32 constant UnitsPerChunk = keccak256("kyc-onboarding.unitsPerChunk");
    bytes32 constant MaximumChunks = keccak256("kyc-onboarding.maximumChunks");
    bytes32 constant MaximumUnits =
        keccak256("kyc-onboarding.maximumTotalUnits");
    bytes32 constant MaxMembers = keccak256("kyc-onboarding.maxMembers");
    bytes32 constant FundTargetAddress =
        keccak256("kyc-onboarding.fundTargetAddress");
    bytes32 constant TokensToMint = keccak256("kyc-onboarding.tokensToMint");

    WETH private _weth;
    IERC20 private _weth20;

    mapping(DaoRegistry => mapping(address => uint256)) public totalUnits;

    constructor(address payable weth) {c_0x239370aa(0x77c6a4e8403e8e344e33fc6d4e8075f5120c4891e9878af707ea57349268cfef); /* function */ 

c_0x239370aa(0xfd54caf5b097bf1d0029250d4d359fa08c00541528e6b6e7d610afbaff5ddca9); /* line */ 
        c_0x239370aa(0x5163775b2f4cc29f4d70285a4caa02e120239ca41ef382543a3b6d20baef5694); /* statement */ 
_weth = WETH(weth);
c_0x239370aa(0xbabd639921d6ad148004ce5abd3da519b27104a18789e7c529bc3a528640d2d1); /* line */ 
        c_0x239370aa(0xc141df00def4f429aa3956a3235075c605eb43f7713c52b2c84e2baf56f20e48); /* statement */ 
_weth20 = IERC20(weth);
    }

    /**
     * @notice Configures the Adapter with the coupon signer address and token to mint.
     * @param dao the dao to configure
     * @param signerAddress is the DAO instance to be configured
     * @param chunkSize how many wei per chunk
     * @param unitsPerChunk how many units do we get per chunk
     * @param maximumChunks maximum number of chunks allowed
     * @param maxUnits how many internal tokens can be minted
     * @param maxMembers maximum number of members allowed to join
     * @param fundTargetAddress multisig address to transfer the money from, set it to address(0) if you dont want to use a multisig
     * @param tokenAddr the token in which the onboarding can take place
     * @param internalTokensToMint the token that will be minted when the member joins the DAO
     */
    function configureDao(
        DaoRegistry dao,
        address signerAddress,
        uint256 chunkSize,
        uint256 unitsPerChunk,
        uint256 maximumChunks,
        uint256 maxUnits,
        uint256 maxMembers,
        address fundTargetAddress,
        address tokenAddr,
        address internalTokensToMint
    ) external onlyAdapter(dao) {c_0x239370aa(0xf4a4d707b59f89cb3062a4a14b43c69512e0a98912e9afa5ef87b9e28bd78310); /* function */ 

c_0x239370aa(0x86de66ef6e98083d7f3089cd896f291bebddf4a5b97252b2f992c4866723085e); /* line */ 
        c_0x239370aa(0xf99dc6b9d3abdb8178718ff0c63dabc9b3c81906a288e82164929a4ae8307b3d); /* requirePre */ 
c_0x239370aa(0x6b1237a63d30ba7bd6ac4c66b232619452280a2fe5d1a493146e39491a070c53); /* statement */ 
require(
            chunkSize > 0 && chunkSize < type(uint88).max,
            "chunkSize::invalid"
        );c_0x239370aa(0x7fbf0277920e06f02ce06eb2d07a1fc26e6dbf3310444922de1458aff32fc673); /* requirePost */ 

c_0x239370aa(0xf7f3335cf87fed9e227c66953c39ef981500d038c7a703490057aca311e1b2f3); /* line */ 
        c_0x239370aa(0x9a9eb4c258bdc347e0e9c277d6add2a68588a0ec0ec92ba1f7830a30c550a298); /* requirePre */ 
c_0x239370aa(0xa7d19c44eaf0693f36a49e6a8b4128dacd75326646c4514669fbbc84cafa91df); /* statement */ 
require(
            maxMembers > 0 && maxMembers < type(uint88).max,
            "maxMembers::invalid"
        );c_0x239370aa(0x872921c7fb99a33f5877216e71f46e0f8760e8bc80cef5417d68c42824a0bd64); /* requirePost */ 

c_0x239370aa(0xdc60c50ab15c49809ff862c810d57cfd70553d8984eab25b685705484740540b); /* line */ 
        c_0x239370aa(0x07382607a0797e4081a8b035a548774a0dacb9b260c202e84264242df0106bac); /* requirePre */ 
c_0x239370aa(0x49da345247bf1dcbe439e4e9d18ef2adc3a570e2df4a382699d05fafb0f5bb27); /* statement */ 
require(
            maximumChunks > 0 && maximumChunks < type(uint88).max,
            "maximumChunks::invalid"
        );c_0x239370aa(0x1795c5cbc0ee4ef2fbf599fd2e1243fe7a259413fdb6a48e4b0ac8a36b48055a); /* requirePost */ 

c_0x239370aa(0x818043f107db103c9ce5d7e581170c4d32deab379d4088d79b1cf9dc00e40857); /* line */ 
        c_0x239370aa(0x5b309ed992ac4fde491f2af262c6bce050a3a423824705af7594d4d004923bc5); /* requirePre */ 
c_0x239370aa(0x63407af14dba0d32968a572c1cdddeff3d0036ec7287f1665e6a66714ed82bd0); /* statement */ 
require(
            maxUnits > 0 && maxUnits < type(uint88).max,
            "maxUnits::invalid"
        );c_0x239370aa(0x5eb73432ee8770f12247ddbd9e3aa439bceb5317257979407a038782b927f64e); /* requirePost */ 

c_0x239370aa(0x60508e1dd937ebcf8063b646da0f5e8a8a0bb98aeb22fb747b8f12400dec3cf8); /* line */ 
        c_0x239370aa(0xe26b3dab265bc70654ebcff4ab7962c1dbedcec4737a226b111533972b2853a5); /* requirePre */ 
c_0x239370aa(0x00c36ceabf2ac41fb88ffa3e1c5c0bbd16e62957ef213022422238a287fc5e47); /* statement */ 
require(
            unitsPerChunk > 0 && unitsPerChunk < type(uint88).max,
            "unitsPerChunk::invalid"
        );c_0x239370aa(0x8e0338f0abf7eb6ff771e7c94229bd3a0767941f9de2312757f3be521a421b87); /* requirePost */ 

c_0x239370aa(0x88e3b9111978af35855e6552b98b36cfb5cc13ca8e42655d88dc9bd4e109af14); /* line */ 
        c_0x239370aa(0x5a2a1fa550e2c3bc96f1aab5fc7cfbc0e8cded06f002dc7201238f2943780a50); /* requirePre */ 
c_0x239370aa(0xe152b9d09a0fd4076dd5bc644192443a425f31e740f8563651c1b92a42198408); /* statement */ 
require(
            maximumChunks * unitsPerChunk < type(uint88).max,
            "potential overflow"
        );c_0x239370aa(0xf3947bf11a3b6271787484a08dc50aeeaff7b78e94384214b18123a41400e7bd); /* requirePost */ 


c_0x239370aa(0x9cb6e8ed88ac7da4cbbe985f3203a1c3b3f3e4c540248f2932a8c4c66a182bff); /* line */ 
        c_0x239370aa(0x367472c519c73cf42ac2900a3e9fdc89ec93951054e736f3cda01b1dcff2c1c2); /* requirePre */ 
c_0x239370aa(0x3bffb2718e3594eb96b6b6be235bd8c106e152bb795d7e4e0336a3a743380c13); /* statement */ 
require(
            DaoHelper.isNotZeroAddress(signerAddress),
            "signer address is nil!"
        );c_0x239370aa(0x645e5feb3945dd9ff19d09efa6c6a36b2979c19f6599227cbf8eea5151f17781); /* requirePost */ 


c_0x239370aa(0x45fb54350339f16567a0a2edcbe1815d57034bc2954d461a3a1187553648caad); /* line */ 
        c_0x239370aa(0x19fdda9a0dcc7c45458f3de0ee48bb72549c5e1db9cf56dc5a18dfae75334b4f); /* requirePre */ 
c_0x239370aa(0x4ce6853cbfbed8a141c2b524f795e6248d85ed7e86ffa786dcf0120438353282); /* statement */ 
require(
            DaoHelper.isNotZeroAddress(internalTokensToMint),
            "null internal token address"
        );c_0x239370aa(0xf86cd4279a5b9b42474318ef2c19f714ed82cc90daad15d2aad8d3098a69c73c); /* requirePost */ 


c_0x239370aa(0x5e8c32605e3782cfbfec29db275f7915cd1eb79cae62cfa39f42eba067ff230a); /* line */ 
        c_0x239370aa(0xafa68176c0a8a9d1ae693e1cf25f41f86008ccdb8aa4aad8efe443c17943b234); /* statement */ 
dao.setAddressConfiguration(
            _configKey(tokenAddr, SignerAddressConfig),
            signerAddress
        );
c_0x239370aa(0x45553273b08a4dc2e718be0f13111bc7d93f876398cf8eda8444d6b44663554e); /* line */ 
        c_0x239370aa(0x38698bc59d5655e270d1484b0f207f1128b3bdd75509af181a644f7c77ebe935); /* statement */ 
dao.setAddressConfiguration(
            _configKey(tokenAddr, FundTargetAddress),
            fundTargetAddress
        );
c_0x239370aa(0x807065dc7ec1b438c84985642b4f43dbffb4d022cd3dea4c580c18c9fe3e883e); /* line */ 
        c_0x239370aa(0x14ffd43983233aaba4c53b81d5dea937f9a76faa0aeebd4dfc5a3d5ce52047d6); /* statement */ 
dao.setConfiguration(_configKey(tokenAddr, ChunkSize), chunkSize);
c_0x239370aa(0xed06bd97c45b3ff37252635f9a96daad8946fac3ba7b16be35d4bf5bf0ae67c1); /* line */ 
        c_0x239370aa(0xb5a284ed6cd4830e0dd40bf77f17f4fb00bd54b6e293a0e908c10a0362c7d6d5); /* statement */ 
dao.setConfiguration(
            _configKey(tokenAddr, UnitsPerChunk),
            unitsPerChunk
        );
c_0x239370aa(0xa65a1c89ee9c7ecb3ac4746acd2d81f9cf734fc89671f1171fa71e9140d0e2af); /* line */ 
        c_0x239370aa(0xcbe08d38ee03630c010189cffd9de027f7347c5e757d27349912e583b78c729e); /* statement */ 
dao.setConfiguration(
            _configKey(tokenAddr, MaximumChunks),
            maximumChunks
        );
c_0x239370aa(0xf9abde89b2a606f24cba666e8a0dbd510506f6bad0496d85196909279dcb71c5); /* line */ 
        c_0x239370aa(0x90a310759e34b964eb88b92828719b77689a2f1e01b14b32e4af4d9db2569652); /* statement */ 
dao.setConfiguration(_configKey(tokenAddr, MaximumUnits), maxUnits);
c_0x239370aa(0xb97a47745e8d6692c8636dce115b0762c9f77874a81d128f17718217f38954c6); /* line */ 
        c_0x239370aa(0xda98b91fb3000495815359a7bccff3c597cd0f3dce9af031598db838f4e29e0a); /* statement */ 
dao.setConfiguration(_configKey(tokenAddr, MaxMembers), maxMembers);
c_0x239370aa(0x8bd45ce154ec4685c37a541b61fd6ccb71d8e4e4c550831127724c7e3b365392); /* line */ 
        c_0x239370aa(0x15b265c1bc7540d2f50eccd650c90b60dbfcbfdb9d452047ab9eaf787abe46d0); /* statement */ 
dao.setAddressConfiguration(
            _configKey(tokenAddr, TokensToMint),
            internalTokensToMint
        );

c_0x239370aa(0x6ebd0560041cac8d95f901431f8555fed389b928aebdbe42faeee1c1f6a63230); /* line */ 
        c_0x239370aa(0x92c019cc52dd7eb4d227f69bca612415c126808685a695e53e05a1e7247fc135); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0x239370aa(0x3e89cd1eca915bfb25af2486dd0dcc8e50e0a3a9415b797794c8a916263a6794); /* line */ 
        c_0x239370aa(0x5d0b1734489f139e4be8660bfccc725a5733fee1926355c3155e0658565e87b1); /* statement */ 
bank.registerPotentialNewInternalToken(dao, DaoHelper.UNITS);
c_0x239370aa(0x421e85393fb7572fd0b77ce9a022b19957e7268f7ffaf2b1e0c57976dc4c557d); /* line */ 
        c_0x239370aa(0x39d7123cde6761614aaecf24543cee3f1cda3a77bc0e1e95aa9a5c7d2b6b61e6); /* statement */ 
bank.registerPotentialNewToken(dao, tokenAddr);
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
    {c_0x239370aa(0xfd04f8f46d61e535070a7f2a40b9c18a7af4ba78b0e1870a1b08599b334adab2); /* function */ 

c_0x239370aa(0x816d604bc2ce6d17db900db09e09886e5bd902e8e0d2b85f9e5d1b4634d04112); /* line */ 
        c_0x239370aa(0x2a06678446209e423f39408e4903516744329008368ae1d40086b04840866625); /* statement */ 
bytes32 message = keccak256(
            abi.encode(COUPON_MESSAGE_TYPEHASH, coupon.kycedMember)
        );

c_0x239370aa(0x62a5eb0372304eb729ec9f64df3f1d4ca77c4becd62e51f7282edbea6f2c038d); /* line */ 
        c_0x239370aa(0x0a123ab1734ca077933e557d4005207e367a3dbf3f4504e39df26dc16462efc8); /* statement */ 
return hashMessage(dao, address(this), message);
    }

    /**
     * @notice Starts the onboarding propocess of a kyc member that is using ETH to join the DAO.
     * @param kycedMember The address of the kyced member that wants to join the DAO.
     * @param signature The signature that will be verified to redeem the coupon.
     */
    function onboardEth(
        DaoRegistry dao,
        address kycedMember,
        bytes memory signature
    ) external payable {c_0x239370aa(0x1c7eae8a97cfd21b150539c9c314fdeaa9a998c7075db9e4c7c1a67f2e79aa46); /* function */ 

c_0x239370aa(0xfadfe336c9123a9f6abd7d944c4a3d9561c41205294dc9831709456b72b3cedb); /* line */ 
        c_0x239370aa(0x63c25500051387ce8ca8cd15d3a7d9b585d02492bbceaa5d01fdd5ea0d1a981b); /* statement */ 
_onboard(dao, kycedMember, DaoHelper.ETH_TOKEN, msg.value, signature);
    }

    /**
     * @notice Starts the onboarding propocess of a kyc member that is any ERC20 token to join the DAO.
     * @param kycedMember The address of the kyced member that wants to join the DAO.
     * @param tokenAddr The address of the ERC20 token that contains that funds of the kycedMember.
     * @param amount The amount in ERC20 that will be contributed to the DAO in exchange for the DAO units.
     * @param signature The signature that will be verified to redeem the coupon.
     */
    function onboard(
        DaoRegistry dao,
        address kycedMember,
        address tokenAddr,
        uint256 amount,
        bytes memory signature
    ) external {c_0x239370aa(0x7c348b5c33c7db10bfb4d73cc3e44ac194e7fa7b7aacbb42fafd0f2ab2542bde); /* function */ 

c_0x239370aa(0x4ed829dd0aa976188a6ec1ea2b71f5f888f43b0538aecb842faf569c94bd78ba); /* line */ 
        c_0x239370aa(0xb05c962601dcfff61163def848181404ac31f7fab678b57173b977aacc3b875e); /* statement */ 
_onboard(dao, kycedMember, tokenAddr, amount, signature);
    }

    /**
     * @notice Redeems a coupon to add a new member
     * @param dao is the DAO instance to be configured
     * @param kycedMember is the address that this coupon authorized to become a new member
     * @param tokenAddr is the address the ETH address(0) or an ERC20 Token address
     * @param signature is message signature for verification
     */
    // The function is protected against reentrancy with the reentrancyGuard(dao)
    // so it is fine to change some state after the reentrancyGuard(dao) external call
    // because it calls the dao contract to lock the session/transaction flow.
    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function _onboard(
        DaoRegistry dao,
        address kycedMember,
        address tokenAddr,
        uint256 amount,
        bytes memory signature
    ) internal reimbursable(dao) {c_0x239370aa(0xea1ef8cc5198be28ff9b7c22393783aac6f5495d48818a1b7e4795862299a956); /* function */ 

c_0x239370aa(0xb369f18229426f233debbeb98d78f258c35e7bda0977f77390c9571ec52da4e0); /* line */ 
        c_0x239370aa(0x6e82bf9364eac461fd8cd950c00bd8dcf32c19f4d1f65786dc9b93b05aace7c0); /* requirePre */ 
c_0x239370aa(0xe380335dc61d0b89e2334d2255e1423c6027deed9c8d103c475d91383eab132d); /* statement */ 
require(
            !isActiveMember(dao, dao.getCurrentDelegateKey(kycedMember)),
            "already member"
        );c_0x239370aa(0x8a40c74875d41b76e96011d5191f448776b01ff7f873fc2fc4986e2959246182); /* requirePost */ 

c_0x239370aa(0x552a4ea0a0a3ade57d33d71470eb11995a39af54f807270e6a55589b97280427); /* line */ 
        c_0x239370aa(0x6522afc344e02bda11362d917d5febb5652a78787a0e4509f094809b170662f1); /* statement */ 
uint256 maxMembers = dao.getConfiguration(
            _configKey(tokenAddr, MaxMembers)
        );
c_0x239370aa(0x58356bc4068fb2d9098503f42f9de398a85d6aa62159d4818bfecae8c23f30c0); /* line */ 
        c_0x239370aa(0xe7e358fcb7e5d1ade130f3ed3763b6eb05f7b464e477d9531bf75eec27f1322e); /* requirePre */ 
c_0x239370aa(0x8ef5efd5eb18f7e4326f167f53bb3dbea49eccc304eb80416747f212bfbaa827); /* statement */ 
require(maxMembers > 0, "token not configured");c_0x239370aa(0xfb457edddd8ed5973907559a335962dc1479a8811d83a29781ae65c2c217acbf); /* requirePost */ 

c_0x239370aa(0x41464779e6dba8de44ce8fe89919ff2f7caabaee8253f4d599a01096c4d27d9f); /* line */ 
        c_0x239370aa(0x27911985ed405be600e73b19ed1554a4dc2f6072b6cdfc05f697b8bb261f98b0); /* requirePre */ 
c_0x239370aa(0x45aaa97cf3a59fbcee4d117c5324681042aeccc001905a9f932238f564511ef6); /* statement */ 
require(dao.getNbMembers() < maxMembers, "the DAO is full");c_0x239370aa(0x040b629a593686a10c7ffafa9d0a018c0597f680b0525507aafc8d6ce11863be); /* requirePost */ 


c_0x239370aa(0xfa798e5b8d68f3ce195de9c5b0c10d4d33dab817efa923aa91eba3e49998d841); /* line */ 
        c_0x239370aa(0xb196d4df77f659c08fc501890d321affea01dc1cd14f5db68b0ca228fd03878d); /* statement */ 
_checkKycCoupon(dao, kycedMember, tokenAddr, signature);

c_0x239370aa(0xf02041c93e93c3d5451a92f2c947b53ce7c954df1e740cbe27c742e8ee35344a); /* line */ 
        c_0x239370aa(0x7b48ff97e430f1c811010cc9aa87df0a8a4762104adee7d35137aceab15c6d90); /* statement */ 
OnboardingDetails memory details = _checkData(dao, tokenAddr, amount);
c_0x239370aa(0x110d753ecbb31679a8bb191d78da2e6c46a83d3717716548e9ee27c80ad71df5); /* line */ 
        c_0x239370aa(0xc66b4a97f7bb5aa07702e51097fe50d5282c8a488d3e40cc010ae68d21f09c30); /* statement */ 
totalUnits[dao][tokenAddr] += details.unitsRequested;

c_0x239370aa(0x7790fd387f9e34750f14dbc6e320e743fbb61a40dff886f7fe2ec8689b07fad6); /* line */ 
        c_0x239370aa(0x19a299f308c4dde148495c71e13223181b14de2649d7004aedc957b744c84c33); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0x239370aa(0x230c43257a378992d769061a5f23a12ecf2963cdeb2af0513e430bfbff29ea16); /* line */ 
        c_0x239370aa(0x943944155c13784de238994f157c868277e45e0b7558e1845de0be189f189d53); /* statement */ 
DaoHelper.potentialNewMember(kycedMember, dao, bank);

c_0x239370aa(0x6cbc5c8184f64913f842162a84b3e65322502a4c5ca695effa125f056aa0cba5); /* line */ 
        c_0x239370aa(0x4c0b5fd18c43c48d93c04d090ee93bd446c5f806faa15afb05d2199b7e17b311); /* statement */ 
address payable multisigAddress = payable(
            dao.getAddressConfiguration(
                _configKey(tokenAddr, FundTargetAddress)
            )
        );
c_0x239370aa(0x7cf3725ec7e7ce28381837e1e4bfc5980bdcaf95c20b019ccda7bb5a947c1713); /* line */ 
        c_0x239370aa(0x5dd3a4450889e7e0df1f0656b5bf6427e4644cd45fe7f6f675040c1e71483957); /* statement */ 
if (multisigAddress == address(0x0)) {c_0x239370aa(0x52d70f1e7d93e157da8102a06319d52d0c33e9b039dd37b6fbafcff00f542a53); /* branch */ 

c_0x239370aa(0xd3fe0b72c8c8321d28c7d490160dffca2e9018f2dd39624440e0fc4452110cf1); /* line */ 
            c_0x239370aa(0xc0517026b8e6ad459c77f827b6932069ba2e5a0af5d837de63d92314550040a1); /* statement */ 
if (tokenAddr == DaoHelper.ETH_TOKEN) {c_0x239370aa(0x9e37c827b742535c71a872e8fc29bc59f897fa846306f65faf2c284aa9e36b95); /* branch */ 

                // The bank address is loaded from the DAO registry,
                // hence even if we change that, it belongs to the DAO,
                // so it is fine to send eth to it.
                // slither-disable-next-line arbitrary-send
c_0x239370aa(0x94e906da491e03389f452478c88594b152140db83926d1553dff86d14344a543); /* line */ 
                c_0x239370aa(0xbe3fdf44ac69bf0f842b7dc0020189a3e8a3ba17f659473e68b2152ee68e3577); /* statement */ 
bank.addToBalance{value: details.amount}(
                    dao,
                    DaoHelper.GUILD,
                    DaoHelper.ETH_TOKEN,
                    details.amount
                );
            } else {c_0x239370aa(0x06002d789ceb93941608a7a62e5378647412fd91bb2338f3369ce27d22b197ce); /* branch */ 

c_0x239370aa(0xa979215555ddd0721154751ef78dfae8e1442057515cda7099b9859aa39baebe); /* line */ 
                c_0x239370aa(0xf8010ea4defd1bdd9d6b9d3f8254c318b31911cd329362d39cc7d40bbba3a2bb); /* statement */ 
bank.addToBalance(
                    dao,
                    DaoHelper.GUILD,
                    tokenAddr,
                    details.amount
                );
c_0x239370aa(0x5519fc4349119364f1daf4966acd3c302dac20e48fcee471a581ce3d0536d1e1); /* line */ 
                c_0x239370aa(0x5677a33c827a29cbfbb1654de5af7555ba91e2fbdeacce556af18d4cba89b567); /* statement */ 
IERC20 erc20 = IERC20(tokenAddr);
c_0x239370aa(0x4e31bdd36eb7dea5f2a2819953a073382f9cae23c26dcd206f9968bc98a32e58); /* line */ 
                c_0x239370aa(0xc221b3128bd00f03885bc3eb077f35f05bb96e8b4d9e1ccbd2f8a9270ce2b593); /* statement */ 
erc20.safeTransferFrom(
                    msg.sender,
                    address(bank),
                    details.amount
                );
            }
        } else {c_0x239370aa(0x33dc534d1104b415774d21884ad5bb9d324887827368de11d5505eff7e6ed2b4); /* branch */ 

c_0x239370aa(0xa84425d85b52817c1406da93b7e91a11258b71051500577c7e5040710283d32f); /* line */ 
            c_0x239370aa(0x74660aa79e35d2fe8df236969919b3e9098b4b0bfa379846cde4a0b3ed982dfd); /* statement */ 
if (tokenAddr == DaoHelper.ETH_TOKEN) {c_0x239370aa(0x11a5a246293d37b0aca232d5d6b067a4369193f6eaf4506ffaf26b37283e1b00); /* branch */ 

                // The _weth address is defined during the deployment of the contract
                // There is no way to change it once it has been deployed,
                // so it is fine to send eth to it.
                // slither-disable-next-line arbitrary-send
c_0x239370aa(0xf00a459aacc409942c0171b746f1ec7ef96015f7b013971844fedf0ef95d3b5c); /* line */ 
                c_0x239370aa(0x94b19c4753609e7e58f0442bfaa97adccea929b6f868a3c0bfb7b4d6775a217c); /* statement */ 
_weth.deposit{value: details.amount}();
c_0x239370aa(0x82da312142f814288f920ebbb6bf2cdfb89d7d59d7808d369dcb947f714205e6); /* line */ 
                c_0x239370aa(0xf053b40efd5e3aa3a1a71012ad9de21013597de8067a2c69cb7582e3c19864ad); /* statement */ 
_weth20.safeTransferFrom(
                    address(this),
                    multisigAddress,
                    details.amount
                );
            } else {c_0x239370aa(0x172f0602c13a95f494ec353a10459330b49172d43a3d32c895a8cc3adcb83532); /* branch */ 

c_0x239370aa(0xa16dca9a996b2ed21b89bfa44a4a567cb40b0fcf114f3986e616503b2defa795); /* line */ 
                c_0x239370aa(0xe76a6485ae8e8634e9f4e8efa1c0576a0c98038429e9feee491a87eab1ba303e); /* statement */ 
IERC20 erc20 = IERC20(tokenAddr);
c_0x239370aa(0x55c757d3fdd0d18590b959b90b4f9900b4e77423f9a768e4c7dbb86c185309e5); /* line */ 
                c_0x239370aa(0x4308071ba79e60afb1b54a4cd99edc283a9649046d20ef9e963177645a5520bb); /* statement */ 
erc20.safeTransferFrom(
                    msg.sender,
                    multisigAddress,
                    details.amount
                );
            }
        }

c_0x239370aa(0x847a2530cae324ef112613b1525f0a496ef00952ef76eead62360b4619a8faa9); /* line */ 
        c_0x239370aa(0xf84375739ee6b1a61ecde76876aa82c431380eafc81da34abbb43e169559828d); /* statement */ 
bank.addToBalance(
            dao,
            kycedMember,
            DaoHelper.UNITS,
            details.unitsRequested
        );

c_0x239370aa(0xee37025a4ba2a599d9adcbcfeb3da545e07c7de4aad76a87a7677046c958bd91); /* line */ 
        c_0x239370aa(0xe70ced9e877dd4d2f293eb03e2c478413ca01ffbea7e1bd33a1bf7cbcafd5d30); /* statement */ 
if (amount > details.amount && tokenAddr == DaoHelper.ETH_TOKEN) {c_0x239370aa(0xccf40a3d967a4f464889a1e9594065c9982b5e4ba4ddfd26921258651c141c00); /* branch */ 

c_0x239370aa(0x5220b69f5d13e2cb7705124f835b49476ce77a02377280354ace04ecb17c69a7); /* line */ 
            c_0x239370aa(0xdb5d7a1a0642abc5524276955f9064acac6e1cf53958edc5d20a456df76f2eff); /* statement */ 
payable(msg.sender).sendValue(msg.value - details.amount);
        }else { c_0x239370aa(0xcb8271628bf5a4834b9bca3b5456a181ae56a94576f46f81d9e2cb74f3615bdf); /* branch */ 
}

c_0x239370aa(0xd2e67df2a749a5a6ef5a2b48d743817ea5bb65cda52d69f58a96f491ca05c839); /* line */ 
        c_0x239370aa(0x29cd5feb8684d6f5be3a9f25a78e2dcb259007c104be7b6c68d555cf7dc689d5); /* statement */ 
emit Onboarded(dao, kycedMember, details.unitsRequested);
    }

    /**
     * @notice Verifies if the given amount is enough to join the DAO
     */
    function _checkData(
        DaoRegistry dao,
        address tokenAddr,
        uint256 amount
    ) internal view returns (OnboardingDetails memory details) {c_0x239370aa(0xbbd884fe522ef9da1f884a75c6222065d83bc739c29345aa9aad9cc414563f15); /* function */ 

c_0x239370aa(0xf2318c821075ba8f4ffa8f6ab64c5efb363b2477327aa75b22c5fa48b5c2aa3b); /* line */ 
        c_0x239370aa(0x4241c195def2fa9a099fa589f919c59bbc7ce94508fc2c89d54f9fb194e848a4); /* statement */ 
details.chunkSize = uint88(
            dao.getConfiguration(_configKey(tokenAddr, ChunkSize))
        );
c_0x239370aa(0x6de33be54574cbf0c1bbe1392a9c074b574adb87bbc309cd34b05605eb797e98); /* line */ 
        c_0x239370aa(0x8c86ce191ad136ff43130a91e7d8082af0447a88841abafb6a3229b0a44b1dcf); /* requirePre */ 
c_0x239370aa(0x018f8ca67ad9620fc47a2d9989ca6d55223ac8939ecd5309d4aa1a8ce645b872); /* statement */ 
require(details.chunkSize > 0, "config chunkSize missing");c_0x239370aa(0x73dff7ee0a9c62f04acb8d3f121bd9f37bf45d7f4fb36fe99a7c922f81eecb63); /* requirePost */ 

c_0x239370aa(0x006d159bf0b4fa0f3ebd2497807faa70d2526204c33eedc1da321d53077115c3); /* line */ 
        c_0x239370aa(0x05c73e60b037f0adf8f6f7d8b7738c1a687422842a0c86752bec7f73600406d2); /* statement */ 
details.numberOfChunks = uint88(amount / details.chunkSize);
c_0x239370aa(0x30aaac3ea795265d38fd61272b34882388369fac1756c79b904e38804889c443); /* line */ 
        c_0x239370aa(0x9cbdf44d191ef664fe429509e00412679d4c11b2a0f1120b4b415fcf7125ec9c); /* requirePre */ 
c_0x239370aa(0x4d6ea7f0d410f7294b33f0afabf40e14f9dd00625ab1fdc26f03709a221bf81e); /* statement */ 
require(details.numberOfChunks > 0, "insufficient funds");c_0x239370aa(0x3ca3383d37035a22e8f41acfa7f93a2d71f4e3e5b1f64170de31503142207fd7); /* requirePost */ 

c_0x239370aa(0xa173e8d60fa117b29d67eb3e81abdd516cbed8685ea83b387755a20c8ce3ab98); /* line */ 
        c_0x239370aa(0xa5510045ac9d58061bf672fae636513ee4e7a9ab926888fde50531c5a1ae32e7); /* requirePre */ 
c_0x239370aa(0x779d419c6cd65d5aa89cf0eb027e5b29110eaa08d3e3e22c69bc82ae4d2368de); /* statement */ 
require(
            details.numberOfChunks <=
                dao.getConfiguration(_configKey(tokenAddr, MaximumChunks)),
            "too much funds"
        );c_0x239370aa(0x6473f6dddfce757ff63ba085d9c14d635a2501d394bdc65af6d5099966d6b0c0); /* requirePost */ 


c_0x239370aa(0x2de843cc0045592edf4d5cd165cc6a80c0c707bccb8f73db10740f2ae566aef1); /* line */ 
        c_0x239370aa(0x462602b0f80e3f2c6cb26a014c4185aeb3b2ada126c6d37e7721311a6d8989ee); /* statement */ 
details.unitsPerChunk = uint88(
            dao.getConfiguration(_configKey(tokenAddr, UnitsPerChunk))
        );

c_0x239370aa(0x624220a7eb6f743a83a5af6afae9901a9137b8f91151373ef331c729b96ed0f8); /* line */ 
        c_0x239370aa(0x54230db9a49970db2710c284e2eb08f740f54664a7fcea903bf100cdcdff2191); /* requirePre */ 
c_0x239370aa(0x7bdf840793c481fcc9ab09635a0d406928247f5e375fcb7d511f477a7c8b2771); /* statement */ 
require(details.unitsPerChunk > 0, "config unitsPerChunk missing");c_0x239370aa(0x4efe050d23f877ecd9d5ffc32b4d5317b0d4cf52e4bbb76bf9483c371351c9c0); /* requirePost */ 

c_0x239370aa(0x15e87ba39fb22c52a996669740f3773d800848db9266299c8cc402bab892674d); /* line */ 
        c_0x239370aa(0xbb24552038e3a16f990b2d1c04b11d4407d7da526f96ecf83d2f310721a9e27d); /* statement */ 
details.amount = details.numberOfChunks * details.chunkSize;
c_0x239370aa(0x0217aa109ac005dec0d512ca253501f9318369e81669aff4e94944bd41350a74); /* line */ 
        c_0x239370aa(0x59422d5e691608302d31830c6c3da823e185e12708119a80d157e2440a846614); /* statement */ 
details.unitsRequested = details.numberOfChunks * details.unitsPerChunk;
c_0x239370aa(0x6d57772b549ece1289b93236d92c7cee13f368c38b29b2351d0f95d0c2b467f0); /* line */ 
        c_0x239370aa(0x45dec60d5a0a69c7c7801a5404609b9085af4c4ca093a679581c47045b3bc571); /* statement */ 
details.maximumTotalUnits = uint88(
            dao.getConfiguration(_configKey(tokenAddr, MaximumUnits))
        );

c_0x239370aa(0x6f3b9436a9b1e5d85c669461da9cfc54502564245588f755ce717d1c715bd335); /* line */ 
        c_0x239370aa(0x492e522b09aa0ef3586851761ca94f704aac9dc7a364961c816d28a83db0b86e); /* requirePre */ 
c_0x239370aa(0xe1064e9235e31da1bfe3b3330fb694570b52d03b146e979fdea7ae27ae7e6f36); /* statement */ 
require(
            details.unitsRequested + totalUnits[dao][tokenAddr] <=
                details.maximumTotalUnits,
            "over max total units"
        );c_0x239370aa(0x2f3aab0c9856ad465297e9593307ce46269525817400bab7e2dcd16c9975294f); /* requirePost */ 

    }

    /**
     * @notice Checks if the given signature is valid, if so the member is allowed to reedem the coupon and join the DAO.
     * @param kycedMember is the address that this coupon authorized to become a new member
     * @param tokenAddr is the address the ETH address(0) or an ERC20 Token address.
     * @param signature is message signature for verification
     */
    function _checkKycCoupon(
        DaoRegistry dao,
        address kycedMember,
        address tokenAddr,
        bytes memory signature
    ) internal view {c_0x239370aa(0x28d578febfb65f25d2d5eb0a892c3d14199d9b1bb76593fcbb201a02380d45ac); /* function */ 

c_0x239370aa(0x02ada6192c3ce47e7009b80db0e6d558e210bbba85ed89b712ab96d09a8267e8); /* line */ 
        c_0x239370aa(0x12d1c6612f9f196064c1e36ed6f2ea8af57bb4bfff621cd3546fd8fea0dbd6ce); /* requirePre */ 
c_0x239370aa(0x20d70627fdfa7efb197ba6adbcfd5048598c62967d4cda0f2215a40573a5d576); /* statement */ 
require(
            ECDSA.recover(
                hashCouponMessage(dao, Coupon(kycedMember)),
                signature
            ) ==
                dao.getAddressConfiguration(
                    _configKey(tokenAddr, SignerAddressConfig)
                ),
            "invalid sig"
        );c_0x239370aa(0x5e1f15f203481fb049cffb61b26c60f8e5fccf54b80cf1498a44b9bb8b00776e); /* requirePost */ 

    }

    /**
     * @notice Builds the configuration key by encoding an address with a string key.
     * @param tokenAddrToMint The address to encode.
     * @param key The key to encode.
     */
    function _configKey(address tokenAddrToMint, bytes32 key)
        internal
        pure
        returns (bytes32)
    {c_0x239370aa(0xf72029c0411139997056affb2f1c9afe4ae8ee2c738ec9eb55c642b83358a142); /* function */ 

c_0x239370aa(0x5f934155c0c85d577b7e4ad835bc7ef6156331a1ac20d504646f19c0e2b57d7f); /* line */ 
        c_0x239370aa(0xcc0fb93107d1805a1ed638b97ab5cf5b9007510448f71ece4c99bc5105b26e11); /* statement */ 
return keccak256(abi.encode(tokenAddrToMint, key));
    }
}
