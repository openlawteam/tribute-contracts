pragma solidity ^0.8.0;
function c_0xf7064b8e(bytes32 c__0xf7064b8e) pure {}

import "../extensions/bank/Bank.sol";
import "../core/DaoRegistry.sol";

// SPDX-License-Identifier: MIT

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
library DaoHelper {
function c_0xf9d0c894(bytes32 c__0xf9d0c894) public pure {}

    // Adapters
    bytes32 internal constant VOTING = keccak256("voting");
    bytes32 internal constant ONBOARDING = keccak256("onboarding");
    bytes32 internal constant NONVOTING_ONBOARDING =
        keccak256("nonvoting-onboarding");
    bytes32 internal constant TRIBUTE = keccak256("tribute");
    bytes32 internal constant FINANCING = keccak256("financing");
    bytes32 internal constant MANAGING = keccak256("managing");
    bytes32 internal constant RAGEQUIT = keccak256("ragequit");
    bytes32 internal constant GUILDKICK = keccak256("guildkick");
    bytes32 internal constant CONFIGURATION = keccak256("configuration");
    bytes32 internal constant DISTRIBUTE = keccak256("distribute");
    bytes32 internal constant TRIBUTE_NFT = keccak256("tribute-nft");
    bytes32 internal constant REIMBURSEMENT = keccak256("reimbursement");
    bytes32 internal constant TRANSFER_STRATEGY =
        keccak256("erc20-transfer-strategy");
    bytes32 internal constant DAO_REGISTRY_ADAPT = keccak256("daoRegistry");
    bytes32 internal constant BANK_ADAPT = keccak256("bank");
    bytes32 internal constant ERC721_ADAPT = keccak256("nft");
    bytes32 internal constant ERC1155_ADAPT = keccak256("erc1155-adpt");
    bytes32 internal constant ERC1271_ADAPT = keccak256("signatures");
    bytes32 internal constant SNAPSHOT_PROPOSAL_ADPT =
        keccak256("snapshot-proposal-adpt");
    bytes32 internal constant VOTING_HASH_ADPT = keccak256("voting-hash-adpt");
    bytes32 internal constant KICK_BAD_REPORTER_ADPT =
        keccak256("kick-bad-reporter-adpt");
    bytes32 internal constant COUPON_ONBOARDING_ADPT =
        keccak256("coupon-onboarding");
    bytes32 internal constant LEND_NFT_ADPT = keccak256("lend-nft");
    bytes32 internal constant ERC20_TRANSFER_STRATEGY_ADPT =
        keccak256("erc20-transfer-strategy");

    // Extensions
    bytes32 internal constant BANK = keccak256("bank");
    bytes32 internal constant ERC1271 = keccak256("erc1271");
    bytes32 internal constant NFT = keccak256("nft");
    bytes32 internal constant EXECUTOR_EXT = keccak256("executor-ext");
    bytes32 internal constant INTERNAL_TOKEN_VESTING_EXT =
        keccak256("internal-token-vesting-ext");
    bytes32 internal constant ERC1155_EXT = keccak256("erc1155-ext");
    bytes32 internal constant ERC20_EXT = keccak256("erc20-ext");

    // Reserved Addresses
    address internal constant GUILD = address(0xdead);
    address internal constant ESCROW = address(0x4bec);
    address internal constant TOTAL = address(0xbabe);
    address internal constant UNITS = address(0xFF1CE);
    address internal constant LOCKED_UNITS = address(0xFFF1CE);
    address internal constant LOOT = address(0xB105F00D);
    address internal constant LOCKED_LOOT = address(0xBB105F00D);
    address internal constant ETH_TOKEN = address(0x0);
    address internal constant MEMBER_COUNT = address(0xDECAFBAD);

    uint8 internal constant MAX_TOKENS_GUILD_BANK = 200;

    function totalTokens(BankExtension bank) internal view returns (uint256) {c_0xf9d0c894(0xf27531270ab3a4165455106b85a742bf89ae7a177386a1b918fe4b3665b8221e); /* function */ 

c_0xf9d0c894(0x7e5d130f56e2886a89905f9cf225a7cdc1f2bb1413a66a842e2e4df64e192f85); /* line */ 
        c_0xf9d0c894(0x4cedac609ba5fee873296f3bf2dc9f057a22e7d52beb73151298e37da400444d); /* statement */ 
return memberTokens(bank, TOTAL) - memberTokens(bank, GUILD); //GUILD is accounted for twice otherwise
    }

    /**
     * @notice calculates the total number of units.
     */
    function priorTotalTokens(BankExtension bank, uint256 at)
        internal
        view
        returns (uint256)
    {c_0xf9d0c894(0xd2c10c30c9c61cea991f9b0582addf50a95efbe500325d3f3aaa47e1f7d75787); /* function */ 

c_0xf9d0c894(0x71ee07c028db57e0d33130de3f93e082d7c16fb4b00b27e7a5d7140e0b103f81); /* line */ 
        c_0xf9d0c894(0x7e5183ec70adffc05f03a7de6acd971bafacd58ac54280e6e36d57528f236c87); /* statement */ 
return
            priorMemberTokens(bank, TOTAL, at) -
            priorMemberTokens(bank, GUILD, at);
    }

    function memberTokens(BankExtension bank, address member)
        internal
        view
        returns (uint256)
    {c_0xf9d0c894(0x3e8b09598cfb2e4cddf7b99282faa9b40cdb61a5f503f8a78940855da12a38d5); /* function */ 

c_0xf9d0c894(0x9f130ed9e89a66f963048fa363ac153a8ed292c28cd6bb51b4813fb27c9f6218); /* line */ 
        c_0xf9d0c894(0x2ed899ae67e810a49513eb31f19379e1a33b8b9346013ecc3f6c67d81ef09272); /* statement */ 
return
            bank.balanceOf(member, UNITS) +
            bank.balanceOf(member, LOCKED_UNITS) +
            bank.balanceOf(member, LOOT) +
            bank.balanceOf(member, LOCKED_LOOT);
    }

    function msgSender(DaoRegistry dao, address addr)
        internal
        view
        returns (address)
    {c_0xf9d0c894(0xd1f5e10e574fbe2ac02835b994f0a714b79536d47ba1b8964848823bbce9316b); /* function */ 

c_0xf9d0c894(0x420010e49afbac92f7c7d17ae49312485318e3828ab019acfd79f997bcb35a05); /* line */ 
        c_0xf9d0c894(0x9cfd5b2970f3c7cfe3b25d2abd69d0bd5aa258ba66d2005cdf539b4f646ad1a0); /* statement */ 
address memberAddress = dao.getAddressIfDelegated(addr);
c_0xf9d0c894(0xc4e19acc00f999251b431c648a10a6cb813aa5cfed6a14cc0e6a9545d26cdceb); /* line */ 
        c_0xf9d0c894(0x5ddf56b6f7722602af13c6c079090693356c22d11a3da57c2939ddf864751a60); /* statement */ 
address delegatedAddress = dao.getCurrentDelegateKey(addr);

c_0xf9d0c894(0x4a813bf2c535140b711722ea7ecc2b1a3791262946419c8394247062e308db3c); /* line */ 
        c_0xf9d0c894(0x473a58aadf214b866e2434917a77cfa286a2213bbdc3da735113b5ee3d148b56); /* requirePre */ 
c_0xf9d0c894(0x6c7cc45d7faae2c20c40f296baf072032179bfb678256205664365ca335f837a); /* statement */ 
require(
            memberAddress == delegatedAddress || delegatedAddress == addr,
            "call with your delegate key"
        );c_0xf9d0c894(0xfce9c4025e173d9227c05c94262f038b9c8bd6a0fccf5028de8686c45235251e); /* requirePost */ 


c_0xf9d0c894(0xe14c22337c358bb1b350f97f9e26b1f09e86738560a2c77800d5f9837a3e4315); /* line */ 
        c_0xf9d0c894(0x88ab030a3d65071537be1db71c96586abbf14f3864443f7a1a5db14fcb78a36e); /* statement */ 
return memberAddress;
    }

    /**
     * @notice calculates the total number of units.
     */
    function priorMemberTokens(
        BankExtension bank,
        address member,
        uint256 at
    ) internal view returns (uint256) {c_0xf9d0c894(0xebd8b25cf47dad00b66086ab93c921f0e548989503315b507fe4667798733c46); /* function */ 

c_0xf9d0c894(0xa6a5d5e6ea1f70ef7072bce58ad3c3eb7a359f4a1674b72629c80bd844b8b6bf); /* line */ 
        c_0xf9d0c894(0x2585aa23551241c5c4b170fea5ec9e35d4f6b36c671a86a3db8f0ae4161f7379); /* statement */ 
return
            bank.getPriorAmount(member, UNITS, at) +
            bank.getPriorAmount(member, LOCKED_UNITS, at) +
            bank.getPriorAmount(member, LOOT, at) +
            bank.getPriorAmount(member, LOCKED_LOOT, at);
    }

    //helper
    function getFlag(uint256 flags, uint256 flag) internal pure returns (bool) {c_0xf9d0c894(0xfd5d5c0f66a72da45f6e393dbec9a67063c3f6bccbd9d8e87503c14f7181d6fe); /* function */ 

c_0xf9d0c894(0xcfecdddd74ee02c6fb5069587bb98a4621612803e8e63d424bb5dd0090922679); /* line */ 
        c_0xf9d0c894(0x5bc7f0f1087ee36a21e62691b1a2e8dc6db3a0249e6bc77741b929285cc4cb91); /* statement */ 
return (flags >> uint8(flag)) % 2 == 1;
    }

    function setFlag(
        uint256 flags,
        uint256 flag,
        bool value
    ) internal pure returns (uint256) {c_0xf9d0c894(0x41530079db0b750f733fef689dcd1d1a6960c7c2da41d9c8d70495369ba99731); /* function */ 

c_0xf9d0c894(0x832960f46d36896a825abf306fd9fe56a0bb52366fa417c1455245bb0fe9b806); /* line */ 
        c_0xf9d0c894(0x633cebd64cf1e5205a556ef6e3aadd762fed05e1ea941cd5ddf458f177872bcc); /* statement */ 
if (getFlag(flags, flag) != value) {c_0xf9d0c894(0xf92da2c6d21e73507dd6b5fe78e542401a7d40caac4c29017d9c65424d3c5fc3); /* branch */ 

c_0xf9d0c894(0x6e561ab0786330cf459cc8c9055d63b80c43b0a490203cec1be171d92f43b770); /* line */ 
            c_0xf9d0c894(0x0fbdba968becad9e5bccfdc40ebdc3f42c6271f5fcb0b18ae7d8c4fd1fc30bb7); /* statement */ 
if (value) {c_0xf9d0c894(0x35f392af5bcfadfa66818b1dbbb5679becdd0c7473b561d38bc5b4453746490d); /* branch */ 

c_0xf9d0c894(0x753e53dfcf5bc597de67c95c1929321a2de042796306727800b30cb64e8d4520); /* line */ 
                c_0xf9d0c894(0x0fbf54e927c25dd8f54fd72c146d14482ec64dd72aa1cecccc9d930fd2b00e19); /* statement */ 
return flags + 2**flag;
            } else {c_0xf9d0c894(0x9760be9f158c5b756cdc68e7fe823e701c1bb678279a638cde9ea18fbaf52ccf); /* branch */ 

c_0xf9d0c894(0xda9a75ab05d572f1c8b764612569acba7e5f20881b7b0c88791f21bc5421f44d); /* line */ 
                c_0xf9d0c894(0xc1bbee3cdf5cc6c79f1f107a0ae8b2c3f2b6f4aaa36f70cab923e35a11a19e57); /* statement */ 
return flags - 2**flag;
            }
        } else {c_0xf9d0c894(0x911e96bd2ee0cb3e30b9f65954c1a440abb145cd930360ce65f83ae7334549f0); /* branch */ 

c_0xf9d0c894(0x52c1bf9102577cccb371a8f576564c84602e5bf7f10d07045b347b99071e5665); /* line */ 
            c_0xf9d0c894(0xf2dfdf06119fef6101e83142d5883060ab3464ebbcde03fd9477fd8fbcdec73b); /* statement */ 
return flags;
        }
    }

    /**
     * @notice Checks if a given address is reserved.
     */
    function isNotReservedAddress(address addr) internal pure returns (bool) {c_0xf9d0c894(0x6f609f44e2aacdcfa712437915bd942f4e1ab49e16b28efacaf60c146f9340e3); /* function */ 

c_0xf9d0c894(0xa48d169eca8f985b9a171ad2a7047145a06661bdacfeacb5839c109699c21562); /* line */ 
        c_0xf9d0c894(0x41244cf30effe9f0849b6bb327d9d87d75d1c177047c0ff15b869cd8ef185345); /* statement */ 
return addr != GUILD && addr != TOTAL && addr != ESCROW;
    }

    /**
     * @notice Checks if a given address is zeroed.
     */
    function isNotZeroAddress(address addr) internal pure returns (bool) {c_0xf9d0c894(0x242527dff57ab3e49f8d9d8860fc97f5d6f7449f646d43952bbde1f2ea3ad08a); /* function */ 

c_0xf9d0c894(0x9d6278a2044a361c16b0a0cb93543446951260f2c6b1cde1b74654815c1f97b4); /* line */ 
        c_0xf9d0c894(0xe9abc46f790f95a301a7aceff9749198a1552c028530bee7ee1d0347e8a83c9b); /* statement */ 
return addr != address(0x0);
    }

    function potentialNewMember(
        address memberAddress,
        DaoRegistry dao,
        BankExtension bank
    ) internal {c_0xf9d0c894(0x4b9c3b67ae0978191efaaa094c51385855f01ec013ef615410223ef4b2ff2bc2); /* function */ 

c_0xf9d0c894(0xefe34484ec5130f8aa82720a669db0564f5360ef9ce0cba60a2a8393874f3af8); /* line */ 
        c_0xf9d0c894(0x8b4d89fd80a8471e50472b532857db7d8fe44403d5bf34bbe675777d3675e415); /* statement */ 
dao.potentialNewMember(memberAddress);
c_0xf9d0c894(0xe4514bd863a6cfcfc180255e7a6b9748e1b76024adbefc469350dee0dbc3797e); /* line */ 
        c_0xf9d0c894(0xccc2c5ed08eacd998e3c4b3311bcc55bf84b9b933512b26232a4ee3faf706d09); /* requirePre */ 
c_0xf9d0c894(0x39f41dbed2aa643ce7947b0527cfdb01937f0513353153f7ac871c3f01911919); /* statement */ 
require(memberAddress != address(0x0), "invalid member address");c_0xf9d0c894(0x38eed175a549f41465f0d96811119959e1b523438b6a32e280d5ffe28b678bbd); /* requirePost */ 

c_0xf9d0c894(0x466427d18439e789286df9c2907269a36e70ec9cf66dede9205fc9ce9aa1d106); /* line */ 
        c_0xf9d0c894(0x2996f9afc8c3cf92105788a846b3412c18b800d1567ed79440fffac2f67456e1); /* statement */ 
if (address(bank) != address(0x0)) {c_0xf9d0c894(0xdbf2789c69b837c8ac1145b6beced699181181ca22d7635f5b1b8727ac6374a9); /* branch */ 

c_0xf9d0c894(0x744b1ffc51161e047b7af18280b4e5d45c9f440a7e8701b5096ec5fd15fce938); /* line */ 
            c_0xf9d0c894(0x04118378cc06521a5da529badcc85ec92756aab59077db08b49892d5b7b4afd1); /* statement */ 
if (bank.balanceOf(memberAddress, MEMBER_COUNT) == 0) {c_0xf9d0c894(0x8e591d1603c86abad6721ec20777f1eebdf7df95a6b6a8752043a0a314a3e899); /* branch */ 

c_0xf9d0c894(0x3425a7669ed3be47b36bbf78833f97dd60c07a3a1827eedf3510a8ce0e34bb89); /* line */ 
                c_0xf9d0c894(0x7a9e527c013f6c785009ca310bece7eae067ed75a9c06d531ec06d9c0d7ff0c0); /* statement */ 
bank.addToBalance(dao, memberAddress, MEMBER_COUNT, 1);
            }else { c_0xf9d0c894(0xc1c7f9cd2badbe944edb266b4fbd672729509c21f20a27bcaecd6a9142c1c9e5); /* branch */ 
}
        }else { c_0xf9d0c894(0x5fa2ac4ba56425068fcf321fd4c30bc9e94db38c7fb4a6eb0da3e364946909ea); /* branch */ 
}
    }

    /**
     * A DAO is in creation mode is the state of the DAO is equals to CREATION and
     * 1. The number of members in the DAO is ZERO or,
     * 2. The sender of the tx is a DAO member (usually the DAO owner) or,
     * 3. The sender is an adapter.
     */
    // slither-disable-next-line calls-loop
    function isInCreationModeAndHasAccess(DaoRegistry dao)
        internal
        view
        returns (bool)
    {c_0xf9d0c894(0x16e599afafb11c106bb4e440cc566359e26af09aadc763d8b7bacdf2fb2e48bd); /* function */ 

c_0xf9d0c894(0x2cb6350765f2f7fdda775264f79945dabf0f3a26011d3f64f57dceb40237ab0a); /* line */ 
        c_0xf9d0c894(0xedf9a9676c68126a2b4c2b3cc99d3328962a64da105bb8b1c816cdc83935adcf); /* statement */ 
return
            dao.state() == DaoRegistry.DaoState.CREATION &&
            (dao.getNbMembers() == 0 ||
                dao.isMember(msg.sender) ||
                dao.isAdapter(msg.sender));
    }
}
