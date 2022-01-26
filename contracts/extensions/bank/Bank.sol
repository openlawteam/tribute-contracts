pragma solidity ^0.8.0;
function c_0x193e2526(bytes32 c__0x193e2526) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../IExtension.sol";
import "../../guards/AdapterGuard.sol";
import "../../helpers/DaoHelper.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

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

contract BankExtension is IExtension, ERC165 {
function c_0xacf7abb3(bytes32 c__0xacf7abb3) public pure {}

    using Address for address payable;
    using SafeERC20 for IERC20;

    uint8 public maxExternalTokens; // the maximum number of external tokens that can be stored in the bank

    bool public initialized = false; // internally tracks deployment under eip-1167 proxy pattern
    DaoRegistry public dao;

    enum AclFlag {
        ADD_TO_BALANCE,
        SUB_FROM_BALANCE,
        INTERNAL_TRANSFER,
        WITHDRAW,
        REGISTER_NEW_TOKEN,
        REGISTER_NEW_INTERNAL_TOKEN,
        UPDATE_TOKEN
    }

    modifier noProposal() {c_0xacf7abb3(0x004a45861bcfd0c05bc18e80466e16434cf75ae8244078ed66724f6182069d7f); /* function */ 

c_0xacf7abb3(0xa4b7601c2f0265476eed2f64192221cd0de208706027da8ef656cb3c72055e32); /* line */ 
        c_0xacf7abb3(0x016912a66db6f68ec77a8f6025af5f3b340550a1e5ff22da887c2247ef6995b2); /* requirePre */ 
c_0xacf7abb3(0x631805bfab64af94a8cf88c7e283a52065a71d6e3cfd1e83dc6a72406ff3027b); /* statement */ 
require(dao.lockedAt() < block.number, "proposal lock");c_0xacf7abb3(0x416df697ca15a0e05d4703b5ff329b5c5c17647ec6e7a72931960ce6c4868a89); /* requirePost */ 

c_0xacf7abb3(0x79f88a5d04eac8b795c2af456c40ab24f1ddab4bfa3e9c08790a459f371dc8e1); /* line */ 
        _;
    }

    /// @dev - Events for Bank
    event NewBalance(address member, address tokenAddr, uint160 amount);

    event Withdraw(address account, address tokenAddr, uint160 amount);

    event WithdrawTo(
        address accountFrom,
        address accountTo,
        address tokenAddr,
        uint160 amount
    );

    /*
     * STRUCTURES
     */

    struct Checkpoint {
        // A checkpoint for marking number of votes from a given block
        uint96 fromBlock;
        uint160 amount;
    }

    address[] public tokens;
    address[] public internalTokens;
    // tokenAddress => availability
    mapping(address => bool) public availableTokens;
    mapping(address => bool) public availableInternalTokens;
    // tokenAddress => memberAddress => checkpointNum => Checkpoint
    mapping(address => mapping(address => mapping(uint32 => Checkpoint)))
        public checkpoints;
    // tokenAddress => memberAddress => numCheckpoints
    mapping(address => mapping(address => uint32)) public numCheckpoints;

    /// @notice Clonable contract must have an empty constructor
    constructor() {c_0xacf7abb3(0xbd7e674395d394a4de09d7854221ccacf0594e92eba4a970bd9fd10c0b270a57); /* function */ 
}

    // slither-disable-next-line calls-loop
    modifier hasExtensionAccess(DaoRegistry _dao, AclFlag flag) {c_0xacf7abb3(0xe453fc5f9ecc248834585bf90590f2bc64cb1e0b48b9b839a15dc119b9a1a6eb); /* function */ 

c_0xacf7abb3(0x7dbf72c2a9ca2a779e96ffe39909e1edc994cf32f5e6e5e3444c64427d7b69c8); /* line */ 
        c_0xacf7abb3(0xce7723ba74d192f0ddaca5c1c2aafc883e84455a164897cf52f02c9c4811791e); /* requirePre */ 
c_0xacf7abb3(0x878d70dad0d6f911f76deaec28065f0ddc20729493dd4d543bec05a2330d6d3e); /* statement */ 
require(
            dao == _dao &&
                (address(this) == msg.sender ||
                    address(dao) == msg.sender ||
                    DaoHelper.isInCreationModeAndHasAccess(dao) ||
                    dao.hasAdapterAccessToExtension(
                        msg.sender,
                        address(this),
                        uint8(flag)
                    )),
            "bank::accessDenied:"
        );c_0xacf7abb3(0x7a9cf062787cbc8d0429b6d928bb619a2ee2637ecc0593ea4f46e3e6b5f120f5); /* requirePost */ 

c_0xacf7abb3(0x76f08ae07a2c21c97ea695c159103b03580f4089e5604de096178689a7fb86c1); /* line */ 
        _;
    }

    /**
     * @notice Initialises the DAO
     * @dev Involves initialising available tokens, checkpoints, and membership of creator
     * @dev Can only be called once
     * @param creator The DAO's creator, who will be an initial member
     */
    function initialize(DaoRegistry _dao, address creator) external override {c_0xacf7abb3(0x1e8132f4c55fcb4c85822bb4f5dc4a98282a9b1a0e6edcc90460e70a8bb5ac93); /* function */ 

c_0xacf7abb3(0x56326b06169ebc4e88250e503ad12e5e257113765642b0b1ce5e81fc42c020b6); /* line */ 
        c_0xacf7abb3(0x3d2aff2f39490e55840b1466aa6b8717d1cab3781317dfdc58d688c46c5e0f11); /* requirePre */ 
c_0xacf7abb3(0x96414f94ca442e6cbf3de34d56dcadb098f3d5dd1ab2a83dcb1ec86137fccb7d); /* statement */ 
require(!initialized, "bank already initialized");c_0xacf7abb3(0x284c52679900cdd0c9da67e77e87bf5158843f2275be6feeb76f95b36cf8f0b3); /* requirePost */ 

c_0xacf7abb3(0xd6f3e0193b08393dfa035ee45d1ac90b39be437f412738bebbc034fbd1b1c0b6); /* line */ 
        c_0xacf7abb3(0x4e7a3c539bcaf360273e320e200304339a65a79e9663f205e7ae4ef76286ca3e); /* requirePre */ 
c_0xacf7abb3(0xf3f0c688e5afbf88d08f6d3cd5b5b01df4cbc34a0a7845359bacf2e51c79023b); /* statement */ 
require(_dao.isMember(creator), "bank::not member");c_0xacf7abb3(0xe7b65fe56197b62b42a11c8efc13730eefec5e20a7aa1f9cb771e01cfde20659); /* requirePost */ 

c_0xacf7abb3(0x8ad7ff3586e9d2aa32ae338c1dc17af02e5214397a68b00481dec6ecf66c342f); /* line */ 
        c_0xacf7abb3(0xd17de1a6402b89ce01a1831ddeb6b58cd3063b4148a44dc906ae797af651c50f); /* statement */ 
dao = _dao;
c_0xacf7abb3(0x172ca42322a4e8929224f0a1f639710f2b51ee46dea4438d8c3f771c13a36a08); /* line */ 
        c_0xacf7abb3(0x5015c96a870f0c0cade8205886589ebcaf9340f1597d1e381fe3d14f45dc3b08); /* statement */ 
initialized = true;

c_0xacf7abb3(0xd502120ddc5e6fb5cf1fe8d882301279c02c7f61735949b54c16f5eb8c90d02f); /* line */ 
        c_0xacf7abb3(0x508de19b7cdc5c4fb983c3e09c251cc2f64a5ddfb3247805e7a33f7880787707); /* statement */ 
availableInternalTokens[DaoHelper.UNITS] = true;
c_0xacf7abb3(0x5cad38838d547705ebb2dbc5683857e0d25749c1de4f0687629e0e08b4fbfc6b); /* line */ 
        c_0xacf7abb3(0x09db3c822d02b174da33f7955b11843cc2fbd3c1cc980f705f0a60725ddbb104); /* statement */ 
internalTokens.push(DaoHelper.UNITS);

c_0xacf7abb3(0x4549312367194a47d907b9c6a6884f02a7fd1c88721bebf8a5275da413d93a57); /* line */ 
        c_0xacf7abb3(0xa7546ed5d28e8eeaeb9ca8072f3ff54d22d8cae64b3066bc60c8ab63e40a4520); /* statement */ 
availableInternalTokens[DaoHelper.MEMBER_COUNT] = true;
c_0xacf7abb3(0x56c7469c416ebc2afe9a7036c338e3fe484442300cac922a364e61e10ac83e35); /* line */ 
        c_0xacf7abb3(0x1191b1c73bef13c0a0e5c3638236879a30aadde480ca02f2acc49cc93ca543bc); /* statement */ 
internalTokens.push(DaoHelper.MEMBER_COUNT);
c_0xacf7abb3(0x05bfe22269dd05fb08585f9eeb40b82889db454306b734b2b2f58d44b1ae6a5f); /* line */ 
        c_0xacf7abb3(0x30657da92d1b39f185b5b695c3c59b74a3dea132f7625531b811a821e196bf74); /* statement */ 
uint256 nbMembers = _dao.getNbMembers();
c_0xacf7abb3(0x369574d265eb0171583eae0d9aa7cf950b4c0e4384ef7f0471c5a54678e6de26); /* line */ 
        c_0xacf7abb3(0xff9b00f40e0d6c1a79a5ade4614736695904d7ad26a6513b7088ac2a5fce8d93); /* statement */ 
for (uint256 i = 0; i < nbMembers; i++) {
            //slither-disable-next-line calls-loop
c_0xacf7abb3(0x79f56be63a8199ce6b859715b910f78f6da90004431082bd56a1f4585a9d7281); /* line */ 
            c_0xacf7abb3(0x4b1444937de4c3bf3dfccad2391985c1029fb3c0276ae37833ae4d4fab3ea915); /* statement */ 
addToBalance(
                _dao,
                _dao.getMemberAddress(i),
                DaoHelper.MEMBER_COUNT,
                1
            );
        }

c_0xacf7abb3(0xa8ce3c9d0fe70da499449303060a4dfcbe122bd64878f423d8c0d4949846155e); /* line */ 
        c_0xacf7abb3(0xb88b5d22b3182047c04d7052162411b85e0151798145927086deae30f9bfc41e); /* statement */ 
_createNewAmountCheckpoint(creator, DaoHelper.UNITS, 1);
c_0xacf7abb3(0xf7488c70b6b81eff4fa54ff044dec20caafefb831851ee33a77415af75df2b32); /* line */ 
        c_0xacf7abb3(0xed025d9bfc49e6d6abc75f8d764be5a90f0986bf6c8473969835a7b4fd476352); /* statement */ 
_createNewAmountCheckpoint(DaoHelper.TOTAL, DaoHelper.UNITS, 1);
    }

    function withdraw(
        DaoRegistry _dao,
        address payable member,
        address tokenAddr,
        uint256 amount
    ) external hasExtensionAccess(_dao, AclFlag.WITHDRAW) {c_0xacf7abb3(0x4ea063d799e6f853f0431dbc3bd8f4c1d50fd8ef04c3b91d1a7ca8c625048662); /* function */ 

c_0xacf7abb3(0x5bd7607fae7eee97a68d655913672e753040830cce0646836f7e01c63bb8ea9e); /* line */ 
        c_0xacf7abb3(0xf3dd5655b092a11e332b2095b9a1b16ecf1b5ca4854e9a761e87f23ddbe5383d); /* requirePre */ 
c_0xacf7abb3(0x944b1624a3410dd9eadc33a7c9db4b07c18ea4da0591c9798af0b670b0afd571); /* statement */ 
require(
            balanceOf(member, tokenAddr) >= amount,
            "bank::withdraw::not enough funds"
        );c_0xacf7abb3(0xf023c2e6c5e975303eba90f0cfa5d41032fec98211ae14a49721cbec563571de); /* requirePost */ 

c_0xacf7abb3(0x9ab15bfc8a811b8b37fc339567c417f44b06084f32cdaa04da3b4a53f8c82d9a); /* line */ 
        c_0xacf7abb3(0xb282f3346a4e6d7617bfc6d6e990e73e80cf815a97d60e0c84c544278dbc031a); /* statement */ 
subtractFromBalance(_dao, member, tokenAddr, amount);
c_0xacf7abb3(0x00874444fa5d37b2be18479b6680f1f8100724b5d2c42e78fb3b60753d75fff3); /* line */ 
        c_0xacf7abb3(0xa619671d88a5ff456dcf006017fe59b8f27da051e4fc1cb8ac2d64eebebbfce2); /* statement */ 
if (tokenAddr == DaoHelper.ETH_TOKEN) {c_0xacf7abb3(0xeb91f073f135cb9600c3a3d8674986ec396f14f705fc2c6d2c587f5b2801341d); /* branch */ 

c_0xacf7abb3(0xc249fb7180de3642230729eb70fb8caf6796bbd041fdb9cd12c22a22384cb866); /* line */ 
            c_0xacf7abb3(0x6ca34beee3e22acaa0a9fb774006dc7b19e88f13ef89514c09baaba994414be3); /* statement */ 
member.sendValue(amount);
        } else {c_0xacf7abb3(0xc9004dcc1253562af5397bc679984dd1d74d2af469bf3a12d807f4981756a4a3); /* branch */ 

c_0xacf7abb3(0x90f938821a54984d9725e86ccbd37ec4118bf0fc58df2bcb49ce7cd97b091c6d); /* line */ 
            c_0xacf7abb3(0x46da661cf8138695f27232ddf92245ca95074977d9e9fe618dce484c320afbdc); /* statement */ 
IERC20(tokenAddr).safeTransfer(member, amount);
        }

        //slither-disable-next-line reentrancy-events
c_0xacf7abb3(0xcce606de1099c8455dff9ba7d6ed495ce3b9d74a63803b9aef2a6708ba5e05f6); /* line */ 
        c_0xacf7abb3(0x495994b728e541f0d58dc8584e62915ad1d96957bab311c52862f99208734bcf); /* statement */ 
emit Withdraw(member, tokenAddr, uint160(amount));
    }

    function withdrawTo(
        DaoRegistry _dao,
        address memberFrom,
        address payable memberTo,
        address tokenAddr,
        uint256 amount
    ) external hasExtensionAccess(_dao, AclFlag.WITHDRAW) {c_0xacf7abb3(0x8b7961a5f8ba499c5ad7fc598d0aedcef460ab2e7d267bc705bb123dcdbbfd3b); /* function */ 

c_0xacf7abb3(0x1c5d1a90a106f0a255425148b81d2a0b92b612c4f71984b2dd39039c19d04b0f); /* line */ 
        c_0xacf7abb3(0x22e22dae7aa3b000e567e6e6e7ffe852bebbfae554304775c3516bab7bfc3330); /* requirePre */ 
c_0xacf7abb3(0x5b67679ffeee7d11eacbd4b1db9b59b35823e5be23b2eab7317c09cd3050384f); /* statement */ 
require(
            balanceOf(memberFrom, tokenAddr) >= amount,
            "bank::withdraw::not enough funds"
        );c_0xacf7abb3(0xa026f3c7653cd6deaf1d3c56026c9ef704e7e0f80d3e500bd24b5018294933e8); /* requirePost */ 

c_0xacf7abb3(0xdb4694b916823571968874dcad971eb2d5a52dbb8c89fc8247f420fed61a6bb4); /* line */ 
        c_0xacf7abb3(0x697356b325b93ef8d38967c2e1ee60fc84ed35a3d1f36f222656b5b1065ee3dc); /* statement */ 
subtractFromBalance(_dao, memberFrom, tokenAddr, amount);
c_0xacf7abb3(0x4f00d66402abfd785d85a11f95cac25fb573c41d9b1c85acd18d8ea9ffa97991); /* line */ 
        c_0xacf7abb3(0x163ce26073a367cdc0b214a31940fdf1874b9e4c308990c65c870ae84121d16f); /* statement */ 
if (tokenAddr == DaoHelper.ETH_TOKEN) {c_0xacf7abb3(0xfba4c27058ca96a3f2d80736bd3892115b5d0d41afc78b4a4a1370eb413ca30d); /* branch */ 

c_0xacf7abb3(0xd783025d313cc314b8ae2a248b5817eaa54091f57dbe8d2ba7aeab7b0dbb865c); /* line */ 
            c_0xacf7abb3(0xdea22262e89d412230b6c4849b76563a8308a581b84297d8ee1daee0b14b34d6); /* statement */ 
memberTo.sendValue(amount);
        } else {c_0xacf7abb3(0xa54ff0177404d88824b8d49608d7fb6326dae6635df4effc23657b4f28cc834f); /* branch */ 

c_0xacf7abb3(0x9f97349452ab2399f5d738b7b211c3aa2b52a4aa34da29890addbd29220fed9a); /* line */ 
            c_0xacf7abb3(0xa15394c80bfb46cce200d7f908e9a9d4fc3bf280cecd90ae80c1a6ac37b6e7dd); /* statement */ 
IERC20(tokenAddr).safeTransfer(memberTo, amount);
        }

        //slither-disable-next-line reentrancy-events
c_0xacf7abb3(0x0d30d6ce8edd8c6b1320286d0e63ef9c985183a2d12ba030cf96f9911f442bf9); /* line */ 
        c_0xacf7abb3(0xde5c8736eedfa3920d9d186ffbfdedaed737d3030de577aeb26461c6cf3bdb0d); /* statement */ 
emit WithdrawTo(memberFrom, memberTo, tokenAddr, uint160(amount));
    }

    /**
     * @return Whether or not the given token is an available internal token in the bank
     * @param token The address of the token to look up
     */
    function isInternalToken(address token) external view returns (bool) {c_0xacf7abb3(0x916de29e3d8623b0f8814af4a477d6433fcefb4702e5c9736fe3d11477508e11); /* function */ 

c_0xacf7abb3(0xad266c98f4d7e1352b67aa8703c301b792e1a7a80d03756e29bf939a732d402e); /* line */ 
        c_0xacf7abb3(0x33b9faf023c0785988e6544542ccd0f6402f4604930a14160e38cd3a0f254e0a); /* statement */ 
return availableInternalTokens[token];
    }

    /**
     * @return Whether or not the given token is an available token in the bank
     * @param token The address of the token to look up
     */
    function isTokenAllowed(address token) public view returns (bool) {c_0xacf7abb3(0x0b872b3ec5399da79a59d15967b91e3dec2a860778f5e0c5a9d813cc0a0c52aa); /* function */ 

c_0xacf7abb3(0x3b55cdd39b1cb49c233f0287756a47d3c9c865cb251574cda633af5685501be2); /* line */ 
        c_0xacf7abb3(0xacaac8b0b3db2663620c39309288afbcbc09d1099e31096cc81a4d3c135bd4ac); /* statement */ 
return availableTokens[token];
    }

    /**
     * @notice Sets the maximum amount of external tokens allowed in the bank
     * @param maxTokens The maximum amount of token allowed
     */
    function setMaxExternalTokens(uint8 maxTokens) external {c_0xacf7abb3(0x778f8dfc0196221039301cd66fa1591c6b26904c910b1bee91853ace51371572); /* function */ 

c_0xacf7abb3(0x90b5566f14d9f26cc6df23b07d0a9aa7c592bccfe376a728b21dd21e708024fc); /* line */ 
        c_0xacf7abb3(0x2263b5dfe66b50eb3869d67afd54bcbd49dfafc4909f45aa6aa0eec6fd5e73a3); /* requirePre */ 
c_0xacf7abb3(0x6792239a3c99ce4b2497c2a99b846a1146369511037f7ce4491b8a2c0b8f4f2b); /* statement */ 
require(!initialized, "bank already initialized");c_0xacf7abb3(0x67398196031e93ce73a707ad1bc244a8221477e7f313777ce2b3ef73229ab981); /* requirePost */ 

c_0xacf7abb3(0x813e95b440db602fa46c2a893aa6efc0de0750d575c65173f88116ac94a5df0f); /* line */ 
        c_0xacf7abb3(0xf76c57e262f9513657bc23ad4704f32629aeb282a580ccb18b74c6190bdd9c2b); /* requirePre */ 
c_0xacf7abb3(0x5c382df6a836c041bdb6c702d084b3560c4ad8252118a9552674b53720c935f3); /* statement */ 
require(
            maxTokens > 0 && maxTokens <= DaoHelper.MAX_TOKENS_GUILD_BANK,
            "max number of external tokens should be (0,200)"
        );c_0xacf7abb3(0x43b3f70234ceeee0eff5ee7147d15b72e4929246c17506a1bcb51eca2b7ba8ad); /* requirePost */ 

c_0xacf7abb3(0x1d774bb0ca75d8d61a55b835f8d46c4dab08fafd069bf1bd60d766c2dd50b308); /* line */ 
        c_0xacf7abb3(0x8b9e7436d10db89e897b102fde254d97ec230aee4c3e95c27f289e0e82b15016); /* statement */ 
maxExternalTokens = maxTokens;
    }

    /*
     * BANK
     */

    /**
     * @notice Registers a potential new token in the bank
     * @dev Cannot be a reserved token or an available internal token
     * @param token The address of the token
     */
    function registerPotentialNewToken(DaoRegistry _dao, address token)
        external
        hasExtensionAccess(_dao, AclFlag.REGISTER_NEW_TOKEN)
    {c_0xacf7abb3(0x360cbe3ed2b2fc4fd6694b04f6bc10af099e93523a88689fb09e46c63af3bfb3); /* function */ 

c_0xacf7abb3(0x570e3d582f783d7db4641b37c973b8218334763f37721137a2cdb6b8437014c2); /* line */ 
        c_0xacf7abb3(0x58665bbec7a9e6c4945725cd6af35682d6682aec496f968311ea100a2e03d64d); /* requirePre */ 
c_0xacf7abb3(0x8ac15f5502a9f483e4c6f298c3d8c231d32ba7e854505bfca408230b0ccea50d); /* statement */ 
require(DaoHelper.isNotReservedAddress(token), "reservedToken");c_0xacf7abb3(0xe767569730ff33f2349860eae751a252867d692e998fa26c5e979e0a2eae0424); /* requirePost */ 

c_0xacf7abb3(0x37786c1aaf5a6b39407ff104a563f71620dbb9a2452663e575311890f07c6cfa); /* line */ 
        c_0xacf7abb3(0xf01a82819601fb0a2ef80eff91e41104d1ee408f1e516be4b56a544d266abc1c); /* requirePre */ 
c_0xacf7abb3(0x7cb2def0b557a965f7f324466fa76005abc93030f97a690657dd2f08dd3e718b); /* statement */ 
require(!availableInternalTokens[token], "internalToken");c_0xacf7abb3(0xb98d37dbc02119f906f8326a5f53351c470255925cfbf70f9800c4f7e611203b); /* requirePost */ 

c_0xacf7abb3(0x92605a6cddc38188b438a26187d8404daf6443fffc7746048b3c980dd431a089); /* line */ 
        c_0xacf7abb3(0xf7263d78c0ee34333d859873fd278dc457d1f8fc26bfd6366931d6e5af1c947d); /* requirePre */ 
c_0xacf7abb3(0xd5a8910ebf261e2453761e36b9b62cf4ed7f59291e120eff6d4dfc2380179ab5); /* statement */ 
require(
            tokens.length <= maxExternalTokens,
            "exceeds the maximum tokens allowed"
        );c_0xacf7abb3(0xdd4f87b3eb4422d63237437a5263d2b0debb0c88913bbf75e7c27d868d5239f3); /* requirePost */ 


c_0xacf7abb3(0x11d781b97f945fb50f6e37d7ff9e4c5528aea5be8d3a65c70caa14ba531c0147); /* line */ 
        c_0xacf7abb3(0x9c6e5b38224df56fd3c5b2f7646d6093f04011ca59338e915bd1295d8aa7a107); /* statement */ 
if (!availableTokens[token]) {c_0xacf7abb3(0x97a5293beafdae0cad1cfba370b1534f561d270e38d6e1ed0200cc3c1112157a); /* branch */ 

c_0xacf7abb3(0x4faf5e6ea826860638bc3ab9ceaa326c805ddab295f4989b4c1cdbffd59f1372); /* line */ 
            c_0xacf7abb3(0x231fd30c4ceb49a55c716f74926238a8918f815b43c20584576e38fea8bf2370); /* statement */ 
availableTokens[token] = true;
c_0xacf7abb3(0xa9a1381e13540a532602c60ad820979dd05170266f3756ddf6b45979d175b0d6); /* line */ 
            c_0xacf7abb3(0x5dba8682af0db0066cdd841f2ba960160a40f0cd140ab3ccef58884918c362ab); /* statement */ 
tokens.push(token);
        }else { c_0xacf7abb3(0x77a70074783b5753c16eae3e5bf48c3b165c464aafface1c31d6235e955668fa); /* branch */ 
}
    }

    /**
     * @notice Registers a potential new internal token in the bank
     * @dev Can not be a reserved token or an available token
     * @param token The address of the token
     */
    function registerPotentialNewInternalToken(DaoRegistry _dao, address token)
        external
        hasExtensionAccess(_dao, AclFlag.REGISTER_NEW_INTERNAL_TOKEN)
    {c_0xacf7abb3(0x58294fa326565e883801c8b2ad4fa4f9160eb2f807a1a93608e6d88ef286a917); /* function */ 

c_0xacf7abb3(0x90aee9e2ab851821c40aade9e420c63f77607a4fad0a33bbcba0a53b7801bae9); /* line */ 
        c_0xacf7abb3(0x8cb4bc8e0e385f03466c130b6c392043d099554418ea99c48d9ec9196147280a); /* requirePre */ 
c_0xacf7abb3(0x2ddf936176993fb81e45a8c017bbda8475dfdc0908f064ce96c838ff242b614f); /* statement */ 
require(DaoHelper.isNotReservedAddress(token), "reservedToken");c_0xacf7abb3(0x2e588b39b0040fbf13228eeb8556f8ffb1dd4c1ba517ed11291f27ab0de4967d); /* requirePost */ 

c_0xacf7abb3(0xed29267287db2f8c172f511c70a3c2a59e507c0a5527e9e74e58f4489abc0472); /* line */ 
        c_0xacf7abb3(0xcba038f56d81f53834599224997c99f8e719a3a40b1762adc2535fc565184e77); /* requirePre */ 
c_0xacf7abb3(0x743ac95d7950f156ba598cfc3edfac6d455df7d16e43f62edb9599b31c021b6d); /* statement */ 
require(!availableTokens[token], "availableToken");c_0xacf7abb3(0x929681c30a114f57edfa99628e9f5b09cbff566bb2b1951e32317594b63453ec); /* requirePost */ 


c_0xacf7abb3(0x43c7396ab5b75222ee630cb5466e071ee21bd8a9b2b94d9de039b7a62e58588b); /* line */ 
        c_0xacf7abb3(0xc900af238c788c09af313a1660cee49978112bc3d865fc7989f2538bcf884dbb); /* statement */ 
if (!availableInternalTokens[token]) {c_0xacf7abb3(0x92fdf84c433d7b4e557aee63a6db96013c52d1de4dbb7d43c397b55165bf229c); /* branch */ 

c_0xacf7abb3(0x7eca856082bc7888b67de92c431238b7515b2e95c53f87e336815c1ad27da480); /* line */ 
            c_0xacf7abb3(0x47bd4c09cba155ee2d0bafe9cca83d4d1cf72dbcdcb0525a3c9f56ddd3b2ea21); /* statement */ 
availableInternalTokens[token] = true;
c_0xacf7abb3(0xa6022ffd26e983b60f3ce05d1c41455f1cf336acc83bfd3b5f5bb05a279ef36a); /* line */ 
            c_0xacf7abb3(0x9bd866a8eb896fc8d9f5959066eecb77af63da1a34fcec4c61226148b5417d32); /* statement */ 
internalTokens.push(token);
        }else { c_0xacf7abb3(0x935cff5ad1b62edab1ab0a747c6d08bd149980b3d5ff9b6b479c7c378e82d4bc); /* branch */ 
}
    }

    function updateToken(DaoRegistry _dao, address tokenAddr)
        external
        hasExtensionAccess(_dao, AclFlag.UPDATE_TOKEN)
    {c_0xacf7abb3(0x02854ce0817e411cdb2d2b13454cacf1fe4ae5aa6dcf1ec9ac7b4d14a17d8f60); /* function */ 

c_0xacf7abb3(0x04f10e18bfaaa583141da5aca69473a8f438a6fb6f22e27bb2f68e11cc79f78c); /* line */ 
        c_0xacf7abb3(0x0e6b85863bf7dde1c8ae767bd52e9c6bbd0dc20fc88a42e09124b74ba556b1cc); /* requirePre */ 
c_0xacf7abb3(0x5baf13da5e85613e33168a6a46f45ffb51275fc076e47b487fa41e71012bd332); /* statement */ 
require(isTokenAllowed(tokenAddr), "token not allowed");c_0xacf7abb3(0x4198b76497352369ed40e7ccf92d9c9218903422559a5c3079a82fa7cdd7e943); /* requirePost */ 

c_0xacf7abb3(0xeb99215eaec5c8345adfbe44650a1ae5d6512cc0db3e21591c0117deadef1dbf); /* line */ 
        c_0xacf7abb3(0x6b45384075d28fdb77c3c70725beaee820ccf876b260841bb57b384d60214bc4); /* statement */ 
uint256 totalBalance = balanceOf(DaoHelper.TOTAL, tokenAddr);

c_0xacf7abb3(0x7caa3c28fdbf22f15e55cfdc14d3bae0d26d93e6cb7ff074bc1ccf9cd6ce63df); /* line */ 
        c_0xacf7abb3(0x5377f3453e25dbcaaf89085d6e1a730730ee2ac9194ba10f67efae2510c9a8f3); /* statement */ 
uint256 realBalance;

c_0xacf7abb3(0xe4ab51cb09fd4b3be4f94d7113d503400f9e389330ded6ae5cf6fcf4b15df18e); /* line */ 
        c_0xacf7abb3(0xeac4a99940b0ac1908839289cd3ab303e2fec89fdede369cd9380ab081e3815b); /* statement */ 
if (tokenAddr == DaoHelper.ETH_TOKEN) {c_0xacf7abb3(0x076c598c480169e0a590217c425732bbfdf8b96dd4aedfd4296926e179d2db3f); /* branch */ 

c_0xacf7abb3(0x319f7c97d8d08aa3b14120b1e2f97bd3981d2a3f0f592fc5bdc30a2d146d5306); /* line */ 
            c_0xacf7abb3(0x7dce275fca230b700041e5a3e0a3fa5ef7948fc3475c9f6a79631fcecbdc65b7); /* statement */ 
realBalance = address(this).balance;
        } else {c_0xacf7abb3(0xf4e2980b93c5714303e48ff3f33f16c8cf5cb31f61bbfdde0c1edffcc68502c4); /* branch */ 

c_0xacf7abb3(0x875f8b8929ec9802680458c338876237baf9dd75bd05c05bca536036799fa009); /* line */ 
            c_0xacf7abb3(0x8ee308991d35c88471cef0dbc8f428594990f6a8c04b01e6ef18c08d566d3389); /* statement */ 
IERC20 erc20 = IERC20(tokenAddr);
c_0xacf7abb3(0xff474ac762ec6bcfa0691ad46c68ae5621b581eda57f1670ba6acab9859697b9); /* line */ 
            c_0xacf7abb3(0x79d68973cf031d1df5bfab9c31700c2aa9c3346c51d9adf260bc54585c301c71); /* statement */ 
realBalance = erc20.balanceOf(address(this));
        }

c_0xacf7abb3(0xc032655ff50a8c7c8407f133f84f0430792d821aaf13f74ace63a19421473855); /* line */ 
        c_0xacf7abb3(0xd77debe68a10f96bf4f4305eba44cbc666a4ba3e17c59ce4887807c343f4218d); /* statement */ 
if (totalBalance < realBalance) {c_0xacf7abb3(0x1c8b90b310b10ee31ee7b5431aa4b5bcf710be47008e8727b0ae6c8feae67214); /* branch */ 

c_0xacf7abb3(0x1357b140700594e4401f9c402a87bb15b07303b4e350fad9a67fb6433d38c6d3); /* line */ 
            c_0xacf7abb3(0xf775cbc4af4174251fe1b8dded9883e8dc9980584a5fc1edcdb799aa195e9406); /* statement */ 
addToBalance(
                _dao,
                DaoHelper.GUILD,
                tokenAddr,
                realBalance - totalBalance
            );
        } else {c_0xacf7abb3(0x53dd6203f4d4345ac5977eb48516bb790602310c422d1dbe858f71fa004d4095); /* statement */ 
c_0xacf7abb3(0xf1d49658f9381b10652a56a83c3cbcb18399082936da064fb7e69713a94e70b2); /* branch */ 
if (totalBalance > realBalance) {c_0xacf7abb3(0x07702280059f5a152c046a496beac6429f0520ca3b40a6a2bd611195e4fa4fe5); /* branch */ 

c_0xacf7abb3(0x08da6920a2b503d9b4af11307a52c7b2c55e721ba73420cb00f791efb0ab5252); /* line */ 
            c_0xacf7abb3(0xfbd08fe9c1476a56309a021be570b1a27c8d0edbf6c6fa724aed0dab3df2190f); /* statement */ 
uint256 tokensToRemove = totalBalance - realBalance;
c_0xacf7abb3(0x3a3fd08935c37502af443f08feac7eca457cf04a1d0a373687414fcff7649e1e); /* line */ 
            c_0xacf7abb3(0x309de285049d7f15bad1d52274cdc6ad5365b3276727f499ca11f4bb7f6be70f); /* statement */ 
uint256 guildBalance = balanceOf(DaoHelper.GUILD, tokenAddr);
c_0xacf7abb3(0x8790b640ba8fb13f60087cb113c04e55e32a8621646642712f4471c91c8aa125); /* line */ 
            c_0xacf7abb3(0x1565b12999055b12d92ec62bbd5f96f23f2df541b44b1cdc80aa06622f804b5f); /* statement */ 
if (guildBalance > tokensToRemove) {c_0xacf7abb3(0xe8c8baa315a593f9b6e1e1a4b6ef22d33ccc5d5856573fbe4b06cd4f57a1cf49); /* branch */ 

c_0xacf7abb3(0xe6be8db2defb94dc1086fbe34713dbedab302b50b983a14c2a3cc3376a1bcc69); /* line */ 
                c_0xacf7abb3(0x7217e135c7fab558247e4070e64a12c2c02fb912873fcf498cdba847559829f7); /* statement */ 
subtractFromBalance(
                    _dao,
                    DaoHelper.GUILD,
                    tokenAddr,
                    tokensToRemove
                );
            } else {c_0xacf7abb3(0x5e6debb4dffc4779c11335f3c8e9fc8bd45a4f577396f1ea5a5a4bc9bf09e7b2); /* branch */ 

c_0xacf7abb3(0x639e5a0413c824440ac98deab1369c1591fb8c11b053d2b4db681e45d69baf7c); /* line */ 
                c_0xacf7abb3(0x57ebd908eaa2d9f10b920c5503dc933310d0da5f2d9ec6d13ceba20a337e0714); /* statement */ 
subtractFromBalance(
                    _dao,
                    DaoHelper.GUILD,
                    tokenAddr,
                    guildBalance
                );
            }
        }else { c_0xacf7abb3(0x445e8821603b615e1d9864fb561d99cccfd0dbb710a73004b11f5c069b52d499); /* branch */ 
}}
    }

    /**
     * Public read-only functions
     */

    /**
     * Internal bookkeeping
     */

    /**
     * @return The token from the bank of a given index
     * @param index The index to look up in the bank's tokens
     */
    function getToken(uint256 index) external view returns (address) {c_0xacf7abb3(0xaec4ae350812c562e02a90122b539439a309922ca6cf3c7cd79af71ad32d2ac0); /* function */ 

c_0xacf7abb3(0x40d22f8dd949026936d629ae5d727be85c0fc969f8415245edd23beb6f341dc0); /* line */ 
        c_0xacf7abb3(0x3424a1ee48ac1e679d239a06f3a78611c5e46845ffab07b26921775bcc5d2919); /* statement */ 
return tokens[index];
    }

    /**
     * @return The amount of token addresses in the bank
     */
    function nbTokens() external view returns (uint256) {c_0xacf7abb3(0xa54ee2b34c554d5af9512405d1f3ecdf6b17bac15ef0824f18b2453484089b8c); /* function */ 

c_0xacf7abb3(0x873f3781736326aabd5cef5dcb3c7cb34a7eccb6487f03414f5617d4b8ccefd6); /* line */ 
        c_0xacf7abb3(0xfc61c321ce2f2c04f81730bc1d8b62e060a2c460ae2cbde8aeeb5587fcf4ae57); /* statement */ 
return tokens.length;
    }

    /**
     * @return All the tokens registered in the bank.
     */
    function getTokens() external view returns (address[] memory) {c_0xacf7abb3(0x29a7b5ed8c750679fd482dc42a84ef2eafaf0ab187dff1a2867a74213c252d39); /* function */ 

c_0xacf7abb3(0x03890b103933820a0f034db6da64ef079a86f6eebeaecccb5d2f8e3cc5133d4c); /* line */ 
        c_0xacf7abb3(0xbe76778ab992a47bc883049b55bcc25a22808237d95777d50045b3af9af384bc); /* statement */ 
return tokens;
    }

    /**
     * @return The internal token at a given index
     * @param index The index to look up in the bank's array of internal tokens
     */
    function getInternalToken(uint256 index) external view returns (address) {c_0xacf7abb3(0x6d8b062e0d761f26e26255a2487244d8ffd8ae48e93473377b16a97674ace323); /* function */ 

c_0xacf7abb3(0x348bdd8d8e3541b2df5b41ec3dbd6efbb0fd26841e03063f7ab52ec0dd603fc7); /* line */ 
        c_0xacf7abb3(0xb5b0dbb12dfdd097627beb8a9bcbb4332e458d2d68c2ffaf0d0da1a69fec311f); /* statement */ 
return internalTokens[index];
    }

    /**
     * @return The amount of internal token addresses in the bank
     */
    function nbInternalTokens() external view returns (uint256) {c_0xacf7abb3(0x8817400861365be1107eea5cac434379876f7ba269ce7c7d4c0f81a948a8d1e9); /* function */ 

c_0xacf7abb3(0x11177bd6a267c9d0af4f868624e9245fa797656672659f953e7442927c2ec057); /* line */ 
        c_0xacf7abb3(0x717031f88740c7019a6abc169653c9a86c2d2894b1fd6b19a3b42b40b272b5a8); /* statement */ 
return internalTokens.length;
    }

    /**
     * @notice Adds to a member's balance of a given token
     * @param member The member whose balance will be updated
     * @param token The token to update
     * @param amount The new balance
     */
    function addToBalance(
        DaoRegistry _dao,
        address member,
        address token,
        uint256 amount
    ) public payable hasExtensionAccess(_dao, AclFlag.ADD_TO_BALANCE) {c_0xacf7abb3(0x2c991b667531ef0b85f0fd2988e4dbbe68b0729265f7c2796d304596600a9f87); /* function */ 

c_0xacf7abb3(0x1358a1f03d1c6973f8722c84bbfb3d5b5283eb6c73c99e0bc1d63b7add6439fe); /* line */ 
        c_0xacf7abb3(0x34363ffcbe5eb532e558cddc8bde5b1555f2845ed9fa557a8d318ba2e4c90a80); /* requirePre */ 
c_0xacf7abb3(0x06365e1ee8dd4335bc08f5d911b021b2c8bc0757b1a7eaffca57a416c2edcdb7); /* statement */ 
require(
            availableTokens[token] || availableInternalTokens[token],
            "unknown token address"
        );c_0xacf7abb3(0x2c316f4518601ef875483bd005cc1dc1052b6597257aede3ca0006fb14ba35e2); /* requirePost */ 

c_0xacf7abb3(0x548128bb55e786e10c7b2a7a00025711990caed71d18f717bdcb927c618e604e); /* line */ 
        c_0xacf7abb3(0xeea371ca6092562491952d805cd39c6db69a719b71e6faa8de31ce2221c20c8e); /* statement */ 
uint256 newAmount = balanceOf(member, token) + amount;
c_0xacf7abb3(0x7b77ea6586538873abe80bb6a726f8d2b4a87d222ac6cf25271feb02e6c3a5e0); /* line */ 
        c_0xacf7abb3(0x471872f9735cdc5b570e657859ad2a4f3ac07e28014d5a43b3596ccc885e6f47); /* statement */ 
uint256 newTotalAmount = balanceOf(DaoHelper.TOTAL, token) + amount;

c_0xacf7abb3(0x77b30a06f8950ecd05d3845e8ce80ec237c9f134d33be2a8547c40fce1e261f0); /* line */ 
        c_0xacf7abb3(0xac043efd4668b7cdebd82a9c767a7cf15be6dcdf89a6a10f7401bb621550c1e3); /* statement */ 
_createNewAmountCheckpoint(member, token, newAmount);
c_0xacf7abb3(0xc78c1c28ee5c82aba0bb8f3832c6c7f28bbd3b8db3137a182313efa8bb901668); /* line */ 
        c_0xacf7abb3(0x4bd625f861da76f5ed164aaaf3bf2da57d3245a60d70dda38aa1258880862159); /* statement */ 
_createNewAmountCheckpoint(DaoHelper.TOTAL, token, newTotalAmount);
    }

    /**
     * @notice Remove from a member's balance of a given token
     * @param member The member whose balance will be updated
     * @param token The token to update
     * @param amount The new balance
     */
    function subtractFromBalance(
        DaoRegistry _dao,
        address member,
        address token,
        uint256 amount
    ) public hasExtensionAccess(_dao, AclFlag.SUB_FROM_BALANCE) {c_0xacf7abb3(0x4f937b90ef2ca236c9d7b9c6bea481898c73d20a43205350c12e05fed5257e45); /* function */ 

c_0xacf7abb3(0x620e4b36ccad4f2257f819d90a2006d390d50002eca7e4521b2c761f9ba7fe51); /* line */ 
        c_0xacf7abb3(0xc661b3692dfc0747a49433a6501b29d989afbf5ba8c0ad86ce6ffc533fac9c9b); /* statement */ 
uint256 newAmount = balanceOf(member, token) - amount;
c_0xacf7abb3(0x1555677b7801c673d1eb150f8213d5d31cd74f343118220dd753049df95605db); /* line */ 
        c_0xacf7abb3(0x3b62702199da5cb339fdf59a77fb10e7ffdf5a79aa1ca2d9be9a108d7140b248); /* statement */ 
uint256 newTotalAmount = balanceOf(DaoHelper.TOTAL, token) - amount;

c_0xacf7abb3(0x0f33d0f649e060b828aa7411f0f8d0a62fb715148805c0bbba46007f1963b430); /* line */ 
        c_0xacf7abb3(0x43cf0e9723c1171636b9cc37fd514f0626f2ced47354a98829b8db2e191fcb35); /* statement */ 
_createNewAmountCheckpoint(member, token, newAmount);
c_0xacf7abb3(0x74d6e0299ba9761012b9a6c0ece500468543e777791962a496a4187d614cb74b); /* line */ 
        c_0xacf7abb3(0x05a2652f5c3e05194adabe501ddb01564c73b18c1e1c3f834287a8225325d09a); /* statement */ 
_createNewAmountCheckpoint(DaoHelper.TOTAL, token, newTotalAmount);
    }

    /**
     * @notice Make an internal token transfer
     * @param from The member who is sending tokens
     * @param to The member who is receiving tokens
     * @param amount The new amount to transfer
     */
    function internalTransfer(
        DaoRegistry _dao,
        address from,
        address to,
        address token,
        uint256 amount
    ) external hasExtensionAccess(_dao, AclFlag.INTERNAL_TRANSFER) {c_0xacf7abb3(0xc4244008b551ecf3c2ca39451f58e7fd9bb9f613a3c95baf50c91385e4e07da1); /* function */ 

c_0xacf7abb3(0x24793a21067d4617bc749b824033dbb9f283846c516aa1d459484bdeac239f80); /* line */ 
        c_0xacf7abb3(0xf1193ce2df9f999b20a5060cb1c366c159f39968476baaf7cb33f37373ba4f00); /* statement */ 
uint256 newAmount = balanceOf(from, token) - amount;
c_0xacf7abb3(0x18dc681da74b63804daae7ea3ca629761b18c3115d93d85a91b6eaf7fe1b4adf); /* line */ 
        c_0xacf7abb3(0x1ecdc3d8be62d77e979778431256af471134ca0dec41a0b50bbb861e667c876f); /* statement */ 
uint256 newAmount2 = balanceOf(to, token) + amount;

c_0xacf7abb3(0x4bb03de1c73647febb485e155ee18250d61c00ae1a2fbb6ef03f56bbcf95335c); /* line */ 
        c_0xacf7abb3(0xca1b0485f691662361d0d5e67aaf84f4cb61779c64cd09ee13169ce63a244b3e); /* statement */ 
_createNewAmountCheckpoint(from, token, newAmount);
c_0xacf7abb3(0xb2e90f54fbc0700f5ca5fb4b627cec774cc446c7cb977e8b93222c257d26459b); /* line */ 
        c_0xacf7abb3(0xa78aaab82bdb97b2c1079ba31af9d8e4d804499c2bdee2bed4d976e8bb09233b); /* statement */ 
_createNewAmountCheckpoint(to, token, newAmount2);
    }

    /**
     * @notice Returns an member's balance of a given token
     * @param member The address to look up
     * @param tokenAddr The token where the member's balance of which will be returned
     * @return The amount in account's tokenAddr balance
     */
    function balanceOf(address member, address tokenAddr)
        public
        view
        returns (uint160)
    {c_0xacf7abb3(0xd610a901a09505f17685c9a7966faaca4a624fde04e7743cb8cd4d05987e28d4); /* function */ 

c_0xacf7abb3(0xdfde260ea5d6449bbc6e3502c34a664a1dfef10d9f8d88ed59214dfd0fb0b166); /* line */ 
        c_0xacf7abb3(0xe09308e32d3b53ad2a744aa7362a62fade3bf3b6ce812b38255df671a299e384); /* statement */ 
uint32 nCheckpoints = numCheckpoints[tokenAddr][member];
c_0xacf7abb3(0xbdc5e697a453971b5d7b2eaf82bfcc8a0b825bdf1c0ce5e6126df87560738bfc); /* line */ 
        c_0xacf7abb3(0x2e758e5deaec8a3dcfd036ec1085aa035ec8588476f25fa3ed1594d054563003); /* statement */ 
return
            nCheckpoints > 0
                ? checkpoints[tokenAddr][member][nCheckpoints - 1].amount
                : 0;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorAmount(
        address account,
        address tokenAddr,
        uint256 blockNumber
    ) external view returns (uint256) {c_0xacf7abb3(0x169a57482dd0109fa8b2d5a4e66db1a1a01d9cbba8cba111d3332e7e81c63748); /* function */ 

c_0xacf7abb3(0x1e0353381feccef6175b11158a46aa539957e232e6645abd9ca0aa531f9d9cb5); /* line */ 
        c_0xacf7abb3(0xe3ba3ef27b0d98add11482f77708b8154fb6ef6bdb8b26f6134e6a0b85e22041); /* requirePre */ 
c_0xacf7abb3(0x26f539c401169481c8772492f0561a6fc0d0a817415c5d3a6032041749dfb58a); /* statement */ 
require(
            blockNumber < block.number,
            "Uni::getPriorAmount: not yet determined"
        );c_0xacf7abb3(0x1afa2060df23e7fa116552c218bbf554a1cc638728ee69fc1eabc91286d2a3a0); /* requirePost */ 


c_0xacf7abb3(0xa6a58938f437922ce774985e3aca9a7135af5472e683e3501038abe16023fc61); /* line */ 
        c_0xacf7abb3(0xf88af9c2308eabf832cd44aec20a939097db0f10be753c49b7bc80f88b3e18a0); /* statement */ 
uint32 nCheckpoints = numCheckpoints[tokenAddr][account];
c_0xacf7abb3(0xd3f628d4e044c5c65a9777ad93448f154a0ad9e849eaa81fd3af06b389832ef8); /* line */ 
        c_0xacf7abb3(0xac418f6c960e17327ca723ed9935386f0717a8e41db4635ff6f0755e168c5f16); /* statement */ 
if (nCheckpoints == 0) {c_0xacf7abb3(0xc4e652d6c6d27df4d97e0a61e31d8d209f58abda9dacaa07c6fc5d95b7b14e43); /* branch */ 

c_0xacf7abb3(0xe4c2ab842de4c4666d4020718578dde3c72e662b80ac3a6e17cd53c5de5b21a1); /* line */ 
            c_0xacf7abb3(0x7832f53ebd800cf2507e35024c96dab94ba021c3eb11265d220d6c42e739bcc6); /* statement */ 
return 0;
        }else { c_0xacf7abb3(0xb5b80b3892485a71179500e0613fec7cd166f2329397bb6b69faceaee5db901d); /* branch */ 
}

        // First check most recent balance
c_0xacf7abb3(0xe2ce564b7a8f89f387e4571b2511cc1a8ee4e795a38331083affefa12aac1d18); /* line */ 
        c_0xacf7abb3(0x81c82d847a34d67802421f1e5df151727e643c0f0244233afcf1477ef3fe4683); /* statement */ 
if (
            checkpoints[tokenAddr][account][nCheckpoints - 1].fromBlock <=
            blockNumber
        ) {c_0xacf7abb3(0x002845736223bb8d398f52aa48765f704d542fb1e34a9be7b5d51a71d0979370); /* branch */ 

c_0xacf7abb3(0xc3b06d03694112970a745be957ebe1030a721aef46330fb458458a1402e2647d); /* line */ 
            c_0xacf7abb3(0xbe41f945046e6e0a74e63de0684513f718c0488c8653a0cb074da3ffaa304df8); /* statement */ 
return checkpoints[tokenAddr][account][nCheckpoints - 1].amount;
        }else { c_0xacf7abb3(0xce37d9e9867de09cda33127fb34f9386df40fc9d967cb0f7a52cdf6ba1713941); /* branch */ 
}

        // Next check implicit zero balance
c_0xacf7abb3(0x50ffc4166f7d111bee7fcf1156d7bc433375ecd5e0748721a2486a258de30b1d); /* line */ 
        c_0xacf7abb3(0x4443ea3c0627e9cc51d6ec074a5d95fe3939b55ebc29ba464f1cf3ba12adfbbd); /* statement */ 
if (checkpoints[tokenAddr][account][0].fromBlock > blockNumber) {c_0xacf7abb3(0x143d729727bb998b2042d39d383210788606bda43e24bf8f617514643ef91019); /* branch */ 

c_0xacf7abb3(0x83fe33c0705a2d2bb95cbba130337ae51dcbbe85d5fb87c618c1e23119540f29); /* line */ 
            c_0xacf7abb3(0x423a8b262f1cd064174fea0f76ccf05e2cfd9fd674c2edd6ae76f88c0b899fd4); /* statement */ 
return 0;
        }else { c_0xacf7abb3(0x0abd3092060fcf6d6cd9fcd15f55ccfcd72c97d1dec8859910b67f8dbfdb470a); /* branch */ 
}

c_0xacf7abb3(0x197c74ebde69b4c84a9c224698a0ecbbb4cf38c77900a34ad36d0a20cf8e7cb6); /* line */ 
        c_0xacf7abb3(0xc44b1f04fb56d1d4453b499079576a271065b2ff92d2e0af878ab1e153ebc195); /* statement */ 
uint32 lower = 0;
c_0xacf7abb3(0x92caf1384dc47fc0c8a7bd3033c1f8fc1543afc2acc228b39309018f040af44b); /* line */ 
        c_0xacf7abb3(0x56376778882505cc311985c0d1a23c05dbd9114607baac5daafa0de002b77ea2); /* statement */ 
uint32 upper = nCheckpoints - 1;
c_0xacf7abb3(0xb5e5fc05094bba0667be3210bf99d5e00923d74b187e878cca693c9ff81f85d7); /* line */ 
        c_0xacf7abb3(0x1e3a43d9bfbb8af80951cd4adaf8507b4f985831a599b2cc753698cd3f85d312); /* statement */ 
while (upper > lower) {
c_0xacf7abb3(0xf2ad601715f4af0061e4c55ce094d288c1a9939b92674b8eab45cd2330822a5f); /* line */ 
            c_0xacf7abb3(0x1a733233f4cd8ed444ed5cc216afd1a1bb7236ae30a4bdcfd72b0b78530b5240); /* statement */ 
uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
c_0xacf7abb3(0x03f6d01321f682e161b6c58624b1a7d895c1a60a2e1d7531bc04c3f8c6ae37d1); /* line */ 
            c_0xacf7abb3(0xe90bcab947ef98e102485f02a4dff6758e3d6cb964bc74b5e8745516ddb4be2e); /* statement */ 
Checkpoint memory cp = checkpoints[tokenAddr][account][center];
c_0xacf7abb3(0x0d08b7e05e2dfd8cfe32d2f582706d0b794e6bae04365933747aa4f3ac954346); /* line */ 
            c_0xacf7abb3(0x11e055673cfde4088f24afe9418ff31e0b38fddef59c967428d57dfe85a0765a); /* statement */ 
if (cp.fromBlock == blockNumber) {c_0xacf7abb3(0xa159fb9010df7a690216b9681298ebdbbb8663412d2d257c87ec40b65f836cd6); /* branch */ 

c_0xacf7abb3(0xc978d4508a83cca1e43f5ad2a80d4b880da3f906c9388b0a22fe4d6d7f86a988); /* line */ 
                c_0xacf7abb3(0xb6aefd1fbf140c3cb6b807842c964e0812f9517e255f92e4a4563b05585d9a38); /* statement */ 
return cp.amount;
            } else {c_0xacf7abb3(0xfffb13482b2274044f6e67e6cdf878c8524cff47047dcd9268e5522bff3cc17d); /* statement */ 
c_0xacf7abb3(0xcc77d8e714f29bddbd2ca92e36eddf14d2759e3462b55f1b44cb1a2d82346d14); /* branch */ 
if (cp.fromBlock < blockNumber) {c_0xacf7abb3(0xaaf5929d8d29e83e1ad16e5b70ae9ef2e7ff8b3cbdb9e4266fa9f5fc6cde3e40); /* branch */ 

c_0xacf7abb3(0xde580e79fd4afb89d66deb60140722f0249efbf6f89245f9d2d0be82b4893397); /* line */ 
                c_0xacf7abb3(0x2d825beac1c536ad19cf2546cecba0cf98d69858f5e616469e7f1557932182e1); /* statement */ 
lower = center;
            } else {c_0xacf7abb3(0xad2ca3a32b63acbe92821e1ea2f828479e3eb105ef6c1a88e9cb51106aa49d5f); /* branch */ 

c_0xacf7abb3(0xeb7e1121da7a42a8c07ef079bfc40b3bff4b250bf02fd96f48ef47b7302996b8); /* line */ 
                c_0xacf7abb3(0xbe35d3941650fa582ada656df025b7515aa1882c46a5f616247d4da8a35f0155); /* statement */ 
upper = center - 1;
            }}
        }
c_0xacf7abb3(0x87e5b5d0ae146a7c34d5828a9afd0643d8f5b52a152f3afa93a8fbd4094ccfd7); /* line */ 
        c_0xacf7abb3(0xf449493278d91dfd444dab2d1ab5d3c1af97358e8bd77753ba49aee4756196c3); /* statement */ 
return checkpoints[tokenAddr][account][lower].amount;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {c_0xacf7abb3(0x48b81be5704df4480bffce4c01255aa30bb58442da1860be8f12007250436a8d); /* function */ 

c_0xacf7abb3(0x80c86d1003a0f09f337dadb2290e84b58040918629a49a8596fe29ef87df419f); /* line */ 
        c_0xacf7abb3(0x4bbbb61404985f6044a216d1524e0488f42e88643714e52dcfb225aa37dce2bf); /* statement */ 
return
            super.supportsInterface(interfaceId) ||
            this.subtractFromBalance.selector == interfaceId ||
            this.addToBalance.selector == interfaceId ||
            this.getPriorAmount.selector == interfaceId ||
            this.balanceOf.selector == interfaceId ||
            this.internalTransfer.selector == interfaceId ||
            this.nbInternalTokens.selector == interfaceId ||
            this.getInternalToken.selector == interfaceId ||
            this.getTokens.selector == interfaceId ||
            this.nbTokens.selector == interfaceId ||
            this.getToken.selector == interfaceId ||
            this.updateToken.selector == interfaceId ||
            this.registerPotentialNewInternalToken.selector == interfaceId ||
            this.registerPotentialNewToken.selector == interfaceId ||
            this.setMaxExternalTokens.selector == interfaceId ||
            this.isTokenAllowed.selector == interfaceId ||
            this.isInternalToken.selector == interfaceId ||
            this.withdraw.selector == interfaceId ||
            this.withdrawTo.selector == interfaceId;
    }

    /**
     * @notice Creates a new amount checkpoint for a token of a certain member
     * @dev Reverts if the amount is greater than 2**64-1
     * @param member The member whose checkpoints will be added to
     * @param token The token of which the balance will be changed
     * @param amount The amount to be written into the new checkpoint
     */
    function _createNewAmountCheckpoint(
        address member,
        address token,
        uint256 amount
    ) internal {c_0xacf7abb3(0x7704cc4bd0216d141b1a84ce7abf6979d0e60da5abe9305c1b5a29df3b9f3a61); /* function */ 

c_0xacf7abb3(0xca5ac553c2f6185638065a1f275543dbdf5441e6bf01ac61c6fa56cb76f5e0c3); /* line */ 
        c_0xacf7abb3(0xa96dfdc8c84ec8c640aa48f1f49fbe36c1c7f262d62499d5ff450a4ff55459ef); /* statement */ 
bool isValidToken = false;
c_0xacf7abb3(0x3c726c1729f340ff5d2e6f4513e2ebe5fefda2f6274c3c7e570650f66991d015); /* line */ 
        c_0xacf7abb3(0x6424b7571c8e0da8877648123fab7b46c5c3a560e34c0183ae9d1ac4ed633664); /* statement */ 
if (availableInternalTokens[token]) {c_0xacf7abb3(0xc35329390838375a332234e30ad5957e85d6690b89f9a11a1e0507d761960167); /* branch */ 

c_0xacf7abb3(0x4d5ed13377fd40b508e7b2ff32ad25837eeaaae368e1d73a96ea45cca8b8b37a); /* line */ 
            c_0xacf7abb3(0x89d72e0deaad20ba8258b968a2933e9b7b9c77aeae44981beb8305bb8618bd61); /* requirePre */ 
c_0xacf7abb3(0x3ede86d4cb76b97f2911c2bd5f90422317833d898ffba226cb95bac048e7f037); /* statement */ 
require(
                amount < type(uint88).max,
                "token amount exceeds the maximum limit for internal tokens"
            );c_0xacf7abb3(0x49097e3fdf17f66af8f45537441f96e75314dbaa2a0a1a74bc8c8ae5862b480a); /* requirePost */ 

c_0xacf7abb3(0x1b00acb98833de48a3fe69dbbbf2aaef9ae3e7c9364f4af37a9b180c29af4fdd); /* line */ 
            c_0xacf7abb3(0xacef847ece456d4535a49ee1876a5fbe645fb842fc9098fdb5f7915a9338c292); /* statement */ 
isValidToken = true;
        } else {c_0xacf7abb3(0x07a3ff05fdc60e0b14089b04007c4f2048b297cbc3e3d7702032bafd2a22507c); /* statement */ 
c_0xacf7abb3(0xf8300636fd1bfe25f116b94cab5c347b438db7ca747df98007a28a6b74cbf023); /* branch */ 
if (availableTokens[token]) {c_0xacf7abb3(0x2a1fb09469466037ad1b52abf4f65247b0b62c61758153bde1bd5c1831a9e03b); /* branch */ 

c_0xacf7abb3(0xa390caf6d02700278b5ad12dbe8bce9acfe38dd60f18865b0f2236ffa4191f74); /* line */ 
            c_0xacf7abb3(0x4d4482f456148235f2e97b83f90dd0b39a107e811ca904c13eeaebaefcc05bae); /* requirePre */ 
c_0xacf7abb3(0x72adf411ac3bdb75615e8a0c7c2ee21d3202766acdd6b0bc9be88dfc12af8619); /* statement */ 
require(
                amount < type(uint160).max,
                "token amount exceeds the maximum limit for external tokens"
            );c_0xacf7abb3(0xdcd5d5122f5e364028664ebff325ffd7d99d853d6d36e893fd102e7cfce9cdb2); /* requirePost */ 

c_0xacf7abb3(0x35b4f8d7d34c78de27ac5d600fc4feb7e8761400a6d2f01278989d66675fd1b7); /* line */ 
            c_0xacf7abb3(0x4a4cbd50da1b51d3bfc4f339fec2982f834113a0504ccbc687113213ad6b5ef8); /* statement */ 
isValidToken = true;
        }else { c_0xacf7abb3(0x830f7be900006f48c7d4c15b6486f76bdefc29b4add803676dee906d1dbf4aeb); /* branch */ 
}}
c_0xacf7abb3(0x543f8d6fdc11e36bd0d833b89341e75f00af394ed7b28db65974e4650a22b338); /* line */ 
        c_0xacf7abb3(0xd217adceb74883001e525e58a8716268753c041d19edd7c6fb4eed6029d172c1); /* statement */ 
uint160 newAmount = uint160(amount);

c_0xacf7abb3(0xd1fb9fcbb5f3109bf693a8895ec651d2edf28879d741f4766210e119fafcf6f4); /* line */ 
        c_0xacf7abb3(0xeca3b30c3422001aae2c9089f0604201de3e7924142ea64a7e976496072126f1); /* requirePre */ 
c_0xacf7abb3(0xca379b68a0888803f5aa3b2bddb24dc27229b370f828395c704968b57fd50031); /* statement */ 
require(isValidToken, "token not registered");c_0xacf7abb3(0xffffd69c8a1aaa13726c3ee73c23ec48d86dc7c8d4038bb98c8358d2e850e69d); /* requirePost */ 


c_0xacf7abb3(0x125c08a3eca0e1ed68096839b2b9a387bede7aa084bff65fc3b03cfcab40b697); /* line */ 
        c_0xacf7abb3(0xdaf2116fac658a1190d61bee59974cee348da048ae8ca9e96d58e7f8f342e11f); /* statement */ 
uint32 nCheckpoints = numCheckpoints[token][member];
c_0xacf7abb3(0x3da204d9ef1f8f9cdb581557906eda283eecca1a56e85418e0c2421b072727fe); /* line */ 
        c_0xacf7abb3(0x7c86d1145ea59003b568ca712b7c9ef132f1bd44fcc4ab8939bfa7bf8d90652d); /* statement */ 
if (
            // The only condition that we should allow the amount update
            // is when the block.number exactly matches the fromBlock value.
            // Anything different from that should generate a new checkpoint.
            //slither-disable-next-line incorrect-equality
            nCheckpoints > 0 &&
            checkpoints[token][member][nCheckpoints - 1].fromBlock ==
            block.number
        ) {c_0xacf7abb3(0x6640b8a869f0e1a4879c0903e5e690d8cb69d8ece9cc6437153a1170b6575f5c); /* branch */ 

c_0xacf7abb3(0xd9de6dc6ab0f5b397a5b101d90268a3acfac8ae68b865846f93d896f46af5095); /* line */ 
            c_0xacf7abb3(0x3ed71e23e5b275554ae5f9541083d02aecc270fabb61d1f41a1a73d22ffd8e1b); /* statement */ 
checkpoints[token][member][nCheckpoints - 1].amount = newAmount;
        } else {c_0xacf7abb3(0x6725ee269fa61c1a26b662e2c8e1626e7b663b51c3709cc0887d5d0bdd5c9f0c); /* branch */ 

c_0xacf7abb3(0x959c6eaf912500f631a0f6f8aef1f17a079bef0c9daf0567526729b358be3d60); /* line */ 
            c_0xacf7abb3(0x9f4578ca3b5b189b7ff9042e84b5538fbccae9c05d5ac906685b1c0e79a66328); /* statement */ 
checkpoints[token][member][nCheckpoints] = Checkpoint(
                uint96(block.number),
                newAmount
            );
c_0xacf7abb3(0x393015e36f8b51fd3d41814b47a714b896f2185a2a3d5c4868bf1ad107e8e407); /* line */ 
            c_0xacf7abb3(0xa7d173204da035da526437b32bdb88a96908b18f4dce6bfa42520d8c6116b940); /* statement */ 
numCheckpoints[token][member] = nCheckpoints + 1;
        }
        //slither-disable-next-line reentrancy-events
c_0xacf7abb3(0xb4c6417b74c09d511ba97f46f132d0318b98a548f6833e5d029ce3a5cb4ae634); /* line */ 
        c_0xacf7abb3(0xad7b42cef50d0eca41ed896075377e43af47800a901daabe684c36bc9604c448); /* statement */ 
emit NewBalance(member, token, newAmount);
    }
}
