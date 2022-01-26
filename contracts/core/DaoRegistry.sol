pragma solidity ^0.8.0;
function c_0x3a9333dd(bytes32 c__0x3a9333dd) pure {}


// SPDX-License-Identifier: MIT

import "../guards/AdapterGuard.sol";
import "../guards/MemberGuard.sol";
import "../extensions/IExtension.sol";
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

contract DaoRegistry is MemberGuard, AdapterGuard {
function c_0x419558c7(bytes32 c__0x419558c7) public pure {}

    bool public initialized = false; // internally tracks deployment under eip-1167 proxy pattern

    enum DaoState {
        CREATION,
        READY
    }

    /*
     * EVENTS
     */
    /// @dev - Events for Proposals
    event SubmittedProposal(bytes32 proposalId, uint256 flags);
    event SponsoredProposal(
        bytes32 proposalId,
        uint256 flags,
        address votingAdapter
    );
    event ProcessedProposal(bytes32 proposalId, uint256 flags);
    event AdapterAdded(
        bytes32 adapterId,
        address adapterAddress,
        uint256 flags
    );
    event AdapterRemoved(bytes32 adapterId);

    event ExtensionAdded(bytes32 extensionId, address extensionAddress);
    event ExtensionRemoved(bytes32 extensionId);

    /// @dev - Events for Members
    event UpdateDelegateKey(address memberAddress, address newDelegateKey);
    event ConfigurationUpdated(bytes32 key, uint256 value);
    event AddressConfigurationUpdated(bytes32 key, address value);

    enum MemberFlag {
        EXISTS
    }

    enum ProposalFlag {
        EXISTS,
        SPONSORED,
        PROCESSED
    }

    enum AclFlag {
        REPLACE_ADAPTER,
        SUBMIT_PROPOSAL,
        UPDATE_DELEGATE_KEY,
        SET_CONFIGURATION,
        ADD_EXTENSION,
        REMOVE_EXTENSION,
        NEW_MEMBER
    }

    /*
     * STRUCTURES
     */
    struct Proposal {
        // the structure to track all the proposals in the DAO
        address adapterAddress; // the adapter address that called the functions to change the DAO state
        uint256 flags; // flags to track the state of the proposal: exist, sponsored, processed, canceled, etc.
    }

    struct Member {
        // the structure to track all the members in the DAO
        uint256 flags; // flags to track the state of the member: exists, etc
    }

    struct Checkpoint {
        // A checkpoint for marking number of votes from a given block
        uint96 fromBlock;
        uint160 amount;
    }

    struct DelegateCheckpoint {
        // A checkpoint for marking the delegate key for a member from a given block
        uint96 fromBlock;
        address delegateKey;
    }

    struct AdapterEntry {
        bytes32 id;
        uint256 acl;
    }

    struct ExtensionEntry {
        bytes32 id;
        mapping(address => uint256) acl;
        bool deleted;
    }

    /*
     * PUBLIC VARIABLES
     */
    mapping(address => Member) public members; // the map to track all members of the DAO
    address[] private _members;

    // delegate key => member address mapping
    mapping(address => address) public memberAddressesByDelegatedKey;

    // memberAddress => checkpointNum => DelegateCheckpoint
    mapping(address => mapping(uint32 => DelegateCheckpoint)) checkpoints;
    // memberAddress => numDelegateCheckpoints
    mapping(address => uint32) numCheckpoints;

    DaoState public state;

    /// @notice The map that keeps track of all proposasls submitted to the DAO
    mapping(bytes32 => Proposal) public proposals;
    /// @notice The map that tracks the voting adapter address per proposalId
    mapping(bytes32 => address) public votingAdapter;
    /// @notice The map that keeps track of all adapters registered in the DAO
    mapping(bytes32 => address) public adapters;
    /// @notice The inverse map to get the adapter id based on its address
    mapping(address => AdapterEntry) public inverseAdapters;
    /// @notice The map that keeps track of all extensions registered in the DAO
    mapping(bytes32 => address) public extensions;
    /// @notice The inverse map to get the extension id based on its address
    mapping(address => ExtensionEntry) public inverseExtensions;
    /// @notice The map that keeps track of configuration parameters for the DAO and adapters
    mapping(bytes32 => uint256) public mainConfiguration;
    mapping(bytes32 => address) public addressConfiguration;

    uint256 public lockedAt;

    /// @notice Clonable contract must have an empty constructor
    constructor() {c_0x419558c7(0x81dc5141dc82b1cc1dfb0f8950a1d54830fe0e3d3f6d7cf36c2e406dd14fbb19); /* function */ 
}

    /**
     * @notice Initialises the DAO
     * @dev Involves initialising available tokens, checkpoints, and membership of creator
     * @dev Can only be called once
     * @param creator The DAO's creator, who will be an initial member
     * @param payer The account which paid for the transaction to create the DAO, who will be an initial member
     */
    //slither-disable-next-line reentrancy-no-eth
    function initialize(address creator, address payer) external {c_0x419558c7(0x517fa32478171ddde5fb7dfb62cd939dea5e2489eb1346807bdf1cce1aeea51f); /* function */ 

c_0x419558c7(0xf096cb4912b3c98187c3048fdf26cd7faba2aa8553050958762e518a02c39287); /* line */ 
        c_0x419558c7(0xfedf697b47844bd834c04be3539e2e1616075c3485c56dcd9ec26ca6e35576a6); /* requirePre */ 
c_0x419558c7(0xc24cc0bc8434e457b397ac0eba511e724ef52b836063e7d579dae6bc9c3afa39); /* statement */ 
require(!initialized, "dao already initialized");c_0x419558c7(0xf717b1b2ca5d22fe5c4b202f21687ed6842b197993205c34c22326dd8d7d5988); /* requirePost */ 

c_0x419558c7(0xc253ae828ae3768976ae89ef3cf1398bb56eccf3d7b3563555dbee80fe7319c6); /* line */ 
        c_0x419558c7(0xa553fe401d16024008a68505c6560d6be297f1305a02be21edfb3485cd631696); /* statement */ 
initialized = true;
c_0x419558c7(0x73d25a411f0c3d9dede6a9c86a2766dd2893baea3b13826deb485c7e41c19287); /* line */ 
        c_0x419558c7(0x8b0476a8d7cf573a50b201cea775ce919684436514f9fbbd5389093a47dc2064); /* statement */ 
potentialNewMember(msg.sender);
c_0x419558c7(0x0c9f5101174c0bca7ab54c65ac5dbc6b39697919a66837bc63cbf9f5241c81fd); /* line */ 
        c_0x419558c7(0xe292fc40d199cff0e78bf0198e1f471c487f831750560db7c4a74e98276d00bd); /* statement */ 
potentialNewMember(payer);
c_0x419558c7(0x942986452017fad5a8da82c733a2ce3da90d4b251d1e78e0caf96c1687cf54f5); /* line */ 
        c_0x419558c7(0xd914a5c70acdd721208866668e98db6a2e54f8682e1a4732f2abcbc56b98360a); /* statement */ 
potentialNewMember(creator);
    }

    /**
     * @dev Sets the state of the dao to READY
     */
    function finalizeDao() external {c_0x419558c7(0x86576d9cd30a113ee92221409324b51e88d172402b6f8969cc1d3cfb6b608c6b); /* function */ 

c_0x419558c7(0xf58eec81f023b091714b8eda03edc36f7d75f9834969da45678f6b96a3f4cf64); /* line */ 
        c_0x419558c7(0xff6937aa398351549e9a0a4e7b9e9d33d49447a5d88819dddc88356b3aa37539); /* requirePre */ 
c_0x419558c7(0xf4624893821bbc241671fe73c2aea7ed9f21358151bd9f029bd879ddc5593668); /* statement */ 
require(
            isActiveMember(this, msg.sender) || isAdapter(msg.sender),
            "not allowed to finalize"
        );c_0x419558c7(0x9018e90fb53a21ef7fbb2fde33b1520a6e966613c6875b3ead2ffe0ec44aca72); /* requirePost */ 

c_0x419558c7(0x6a1b446ffc078f4895d6c46b74d0b0e9856c9c08d9815eb06bd0410f096326df); /* line */ 
        c_0x419558c7(0x4429cf9022fe90bb652de5620504e6d33cd2d4e5b5b629411a93b0a27ef03b47); /* statement */ 
state = DaoState.READY;
    }

    /**
     * @notice Contract lock strategy to lock only the caller is an adapter or extension.
     */
    function lockSession() external {c_0x419558c7(0x3e4e1d6feeca8509a22148ea485f0cd7e598290fa7521ec378b89d0a2dbd55ef); /* function */ 

c_0x419558c7(0xc2c817dca9c024936405087ac448122eec9fdc8f5d3b2975f864be938a12f5a1); /* line */ 
        c_0x419558c7(0xbffb61d6993f5e0b9714e7ec469aa67530f4f2fb59d80b9b402775cb375a6e32); /* statement */ 
if (isAdapter(msg.sender) || isExtension(msg.sender)) {c_0x419558c7(0xeb3c2093807da222b3c5a6ee57b7c585c13cc9bda8667ea70c59754b4ad54a47); /* branch */ 

c_0x419558c7(0x59488a3ba4be622e179d9196ef4cc8f83ed044a19d8b28a1bc1e655341062984); /* line */ 
            c_0x419558c7(0x7c11299522ae8c3833982c062a20f94ba7bb860da560e34244dab4f99208c004); /* statement */ 
lockedAt = block.number;
        }else { c_0x419558c7(0xa77097f165ae45ba03b5d9dbf77012818b66d12ea1cf4c09e0888d4021cedc78); /* branch */ 
}
    }

    /**
     * @notice Contract lock strategy to release the lock only the caller is an adapter or extension.
     */
    function unlockSession() external {c_0x419558c7(0x64fd92dd997fe1d5aed1d17a8599e0270bea19495ec3d7c3cfaa3cd2ac3854a9); /* function */ 

c_0x419558c7(0x95340f4c37c368a8291ee1cef871ad34115a39f2ff6bb303c093a86221980b66); /* line */ 
        c_0x419558c7(0x702cf4abb5f62b033e78040e03f7e01098c995e432acb47529755eada582b0de); /* statement */ 
if (isAdapter(msg.sender) || isExtension(msg.sender)) {c_0x419558c7(0x70d0639894f44ca3315863ff978f2de37d467ba4a7a24826104f748d38e5de32); /* branch */ 

c_0x419558c7(0xcba9ecbba69bbcb2e72566e3d1cd78cb82693413847b65a055086a3ce8188379); /* line */ 
            c_0x419558c7(0xe4ddf1c41da6f36ae521e71d279e05c1f3be073ac9f4e8eb7ac96f235f115600); /* statement */ 
lockedAt = 0;
        }else { c_0x419558c7(0x4dbd3851b2dd330354feb7abf7aad51e3670c8f647e8020baa5b2ece40bbec74); /* branch */ 
}
    }

    /**
     * @notice Sets a configuration value
     * @dev Changes the value of a key in the configuration mapping
     * @param key The configuration key for which the value will be set
     * @param value The value to set the key
     */
    function setConfiguration(bytes32 key, uint256 value)
        external
        hasAccess(this, AclFlag.SET_CONFIGURATION)
    {c_0x419558c7(0x1e000d426ffe877862f04adfa266d0f9656de6d9bce2eb6bd5791a77d3e52ff6); /* function */ 

c_0x419558c7(0xeff1ab362d8a649c66b0bb6b729f9d68510ac7319440d1ee53d64c488b070ec1); /* line */ 
        c_0x419558c7(0x438965e7ca05cb5e17149defd2ccb59456ab801cd1c759298ed7b8b77a869d0e); /* statement */ 
mainConfiguration[key] = value;

c_0x419558c7(0x3fda0a08f8b8780953f68f8e2463e281e4493d0be01c22d5fabcbac6d9b4fc60); /* line */ 
        c_0x419558c7(0x5940b3d84d481e8bff344f348de2e128ba012f031ede6b62c4220d31b43d2f47); /* statement */ 
emit ConfigurationUpdated(key, value);
    }

    /**
     * @notice Registers a member address in the DAO if it is not registered or invalid.
     * @notice A potential new member is a member that holds no shares, and its registration still needs to be voted on.
     */
    function potentialNewMember(address memberAddress)
        public
        hasAccess(this, AclFlag.NEW_MEMBER)
    {c_0x419558c7(0x46b604ff52a4b762ae023b11d65ea42e04214743f177859563c799935323ed4f); /* function */ 

c_0x419558c7(0x437f4864b4f0c44e962d0b57615acbadbd208d74bedb953e6f351436b9788a7f); /* line */ 
        c_0x419558c7(0x25e3f49c979b1725311d703267214b194e62d19353e4062f4cba03b43cc6c8d2); /* requirePre */ 
c_0x419558c7(0xa85cb8da401de35e2740629bb02fad27942f745bc3cd988ffeab16ef73fb768f); /* statement */ 
require(memberAddress != address(0x0), "invalid member address");c_0x419558c7(0x3b7b9c73f876f75e74c0fe7926451d51f3e8a3ff06adcf3f427cb9f65d387d33); /* requirePost */ 


c_0x419558c7(0x3d658a20c721d9bffc0f6e621796321ac256b4c6587684f596fc276a7ef190f7); /* line */ 
        c_0x419558c7(0x2391fddaf86678f50db9c971e38f8759c1a8406d549fcfc4613f7964f34d29bc); /* statement */ 
Member storage member = members[memberAddress];
c_0x419558c7(0x93cf01af3c52e0a1b92250bb7dd46987352ad885d4d8bdb6ad1648945c235706); /* line */ 
        c_0x419558c7(0xfa1d27060b3d8ebbc5eb9fedfef86444136ed3d56c9947a550b61b0d8cc1f96d); /* statement */ 
if (!DaoHelper.getFlag(member.flags, uint8(MemberFlag.EXISTS))) {c_0x419558c7(0x139fc6a7e9190ebda6e00534e104dc572749570d6800dcc3c18b34c5795665c4); /* branch */ 

c_0x419558c7(0xd0bb1d701448a76ce36f7be22e3123af3f0e989b2ece1279cf5bf4a5beb285a6); /* line */ 
            c_0x419558c7(0x270d91aa9f3ec3d90d25d406457f992af6a6771c0fc901f9aecd4124938ef0b5); /* requirePre */ 
c_0x419558c7(0x6d874e85dccdc09202ae4889eeb99f00a754d938d1842900196aea27f279c988); /* statement */ 
require(
                memberAddressesByDelegatedKey[memberAddress] == address(0x0),
                "member address already taken as delegated key"
            );c_0x419558c7(0x7c29a5ec7451fa2db0820c8a9aaffc2d52d982d2b683f64c449108c5580bd045); /* requirePost */ 

c_0x419558c7(0xa0f081fd76b7ca507e1b3d489c0a9e2772fc047fed4275928d85e58f31c40886); /* line */ 
            c_0x419558c7(0x5c9aaad160d07744751256208e3c44f09cae7c14d93beb38f83543eac20a1772); /* statement */ 
member.flags = DaoHelper.setFlag(
                member.flags,
                uint8(MemberFlag.EXISTS),
                true
            );
c_0x419558c7(0x20f04fb3c3cfa07d3fe521e74b0fcbd1ef7a804f7f81d010f48fabdb2f5b2b45); /* line */ 
            c_0x419558c7(0xb6c5d10b3be3467918b768c10fb5ffc56c9bf139516eebd7d66e154c6f21bad3); /* statement */ 
memberAddressesByDelegatedKey[memberAddress] = memberAddress;
c_0x419558c7(0x957783b7c6996a3229fb1a1675c8a125d0b7ce1a4ca3a726ea972338ddf97f57); /* line */ 
            c_0x419558c7(0xae17bc3a8a5b52701f681d66beae4bc0dc8e56cebcc35f58db37e5ec48ed0ccd); /* statement */ 
_members.push(memberAddress);
        }else { c_0x419558c7(0x41ff79237dc9dc274cab7fed995cd510d0ba1fc9f6e3341eab45b2a30c942b99); /* branch */ 
}

c_0x419558c7(0x5da802009a8e7c68623a3f077ca56b813bb00b25982a55a4da06caf5262d33c6); /* line */ 
        c_0x419558c7(0xf13de3b33f8629584c1f394a5b94503e4f330631a83d989aa40ddd96b7067473); /* statement */ 
address bankAddress = extensions[DaoHelper.BANK];
c_0x419558c7(0x073278ca249102252cb73be19f6096ec26e4dfe5563ad7a9a84635ffcb902401); /* line */ 
        c_0x419558c7(0x075750e359c95009efd4773e880add3fd8e8bdea845655e63a161dbcff9c7794); /* statement */ 
if (bankAddress != address(0x0)) {c_0x419558c7(0x32e1e79286e5eb279c87fa9ae350284700901a537efbe987a6978611d33c7bce); /* branch */ 

c_0x419558c7(0x8ae0c256344e9fcfa5dfe8a6774ca6a72cbe99669bd464b63dad9384358c9677); /* line */ 
            c_0x419558c7(0x315359cb19400e629051234d0cb3583c7946617adf1738f98246bebf1ccf76f2); /* statement */ 
BankExtension bank = BankExtension(bankAddress);
c_0x419558c7(0x0e95b923bd600251db41a376b6e60e33575992e4a97a0ff040626b1176bcbef9); /* line */ 
            c_0x419558c7(0xd4f2493bafa107b53f647440ee8fda623ebe5a8c33ec24aaae9e79870766c791); /* statement */ 
if (bank.balanceOf(memberAddress, DaoHelper.MEMBER_COUNT) == 0) {c_0x419558c7(0xee46cd5ade16aa04e080bd17f56a108773eaace4b462ddc95911a91320519086); /* branch */ 

c_0x419558c7(0x6a598ad2be6fcbdf925978bc98a47c9fc9f60af227e0fe193ffc41161ce6ebe4); /* line */ 
                c_0x419558c7(0xd46d2e35d8cb05a05d632e5f00f6cdbc9b5e28c187c32cbc121b0df5dc07705c); /* statement */ 
bank.addToBalance(
                    this,
                    memberAddress,
                    DaoHelper.MEMBER_COUNT,
                    1
                );
            }else { c_0x419558c7(0x1cbcd240fafdcdb69990efb24f66f454c69eb8b070fee28fb60597836faa32a6); /* branch */ 
}
        }else { c_0x419558c7(0xa5bdb7ed1296846e8a9140d12519060da365d9802c88071d96c4c0f28170dfaf); /* branch */ 
}
    }

    /**
     * @notice Sets an configuration value
     * @dev Changes the value of a key in the configuration mapping
     * @param key The configuration key for which the value will be set
     * @param value The value to set the key
     */
    function setAddressConfiguration(bytes32 key, address value)
        external
        hasAccess(this, AclFlag.SET_CONFIGURATION)
    {c_0x419558c7(0x0b95b5042c2249f2b63fcc4301c5c91efe4693d3877067094ba22d4153176efa); /* function */ 

c_0x419558c7(0x5a1c2601d638ed2c643bcc4e1dbe52406a52b91b8b8e7316c0c1dd7e490a481f); /* line */ 
        c_0x419558c7(0xecb7a63c4422ca570a45a7d1ee0ed90604e36a4b7bf7af1cfa493536c0d2bf8a); /* statement */ 
addressConfiguration[key] = value;

c_0x419558c7(0x79233b78553f76f77a9913556c0dac2e57e3b781309a59fabb82834cee0edb22); /* line */ 
        c_0x419558c7(0xe1c46c5879308b78c58c6b14e165ca2b3bc91ff1a4a9d0717c994fcd0c0747cd); /* statement */ 
emit AddressConfigurationUpdated(key, value);
    }

    /**
     * @return The configuration value of a particular key
     * @param key The key to look up in the configuration mapping
     */
    function getConfiguration(bytes32 key) external view returns (uint256) {c_0x419558c7(0x6778de70eb6561c8b616461f1042889c3057464557264ca8d93c25f99e453992); /* function */ 

c_0x419558c7(0x33e0855d44862d2ac0ce17ac912a0ffd2072fc01c7abcd70382abdcf6892dbde); /* line */ 
        c_0x419558c7(0x4b343352e2c8ee801c55c51492f28cc79139a82e370ff7d552101ecc51f7281f); /* statement */ 
return mainConfiguration[key];
    }

    /**
     * @return The configuration value of a particular key
     * @param key The key to look up in the configuration mapping
     */
    function getAddressConfiguration(bytes32 key)
        external
        view
        returns (address)
    {c_0x419558c7(0x0d4b1eb5bf66c411cda9d115c8fe6a976815d53d6ed5476478fd96b61d01c801); /* function */ 

c_0x419558c7(0xcbe8cf1ea3e489cddbd01fcb4bdc61d2c0d591fbef5414ae0755c7c43fd59915); /* line */ 
        c_0x419558c7(0x408f3e88dcf365063dcaffb8edb53454d35b4c738488f56eb3ab417f260323f1); /* statement */ 
return addressConfiguration[key];
    }

    /**
     * @notice It sets the ACL flags to an Adapter to make it possible to access specific functions of an Extension.
     */
    function setAclToExtensionForAdapter(
        address extensionAddress,
        address adapterAddress,
        uint256 acl
    ) external hasAccess(this, AclFlag.ADD_EXTENSION) {c_0x419558c7(0x36feffbfd6dd9e49beb117ac43ca0fbe0418fb8d746cb306641c3e34cbf06790); /* function */ 

c_0x419558c7(0x9ea6e8e6eb5dae77d8dde1f1b03ae06f731464870cb99af405a5d4571b0799d7); /* line */ 
        c_0x419558c7(0xdfa6648a58dbcc9f5f3bcc16f3d2ad81df16ef214b7bf7cb3fdd62bbb79d3dd3); /* requirePre */ 
c_0x419558c7(0x22f3bda88282fbd7a35e6e8f26340311bbbc2c44bb59cb2046e0e7da648e4a6f); /* statement */ 
require(isAdapter(adapterAddress), "not an adapter");c_0x419558c7(0xa36db91ec45857c527b6bdd6df6d3a6eea7c0494713287ce07c5328cf43d51ff); /* requirePost */ 

c_0x419558c7(0xdeb234d656bd21627353be3dcad0f16d3da987ea2d400be9934558464752d60f); /* line */ 
        c_0x419558c7(0x2f7315b2c8f5b3165908d3ecb123f36a486130bd42f98ca7a74e7389ee36dce8); /* requirePre */ 
c_0x419558c7(0xa2811987d5bff5a22fb1c59dedfe8464787d2da23f732c2b51d4582a61fd30af); /* statement */ 
require(isExtension(extensionAddress), "not an extension");c_0x419558c7(0xd17eeb7bdd672624e8324907a5a1fbfcff0384311a2acaa7c3bca012ef201842); /* requirePost */ 

c_0x419558c7(0xd5790dad3f1652811d3b8adcedae92281aaf80dc76fac356e137b0dabbad3456); /* line */ 
        c_0x419558c7(0x36552596b1e65f0521dc167ad53ff4d5a6cc6fb82403419f48e20aa731558946); /* statement */ 
inverseExtensions[extensionAddress].acl[adapterAddress] = acl;
    }

    /**
     * @notice Replaces an adapter in the registry in a single step.
     * @notice It handles addition and removal of adapters as special cases.
     * @dev It removes the current adapter if the adapterId maps to an existing adapter address.
     * @dev It adds an adapter if the adapterAddress parameter is not zeroed.
     * @param adapterId The unique identifier of the adapter
     * @param adapterAddress The address of the new adapter or zero if it is a removal operation
     * @param acl The flags indicating the access control layer or permissions of the new adapter
     * @param keys The keys indicating the adapter configuration names.
     * @param values The values indicating the adapter configuration values.
     */
    function replaceAdapter(
        bytes32 adapterId,
        address adapterAddress,
        uint128 acl,
        bytes32[] calldata keys,
        uint256[] calldata values
    ) external hasAccess(this, AclFlag.REPLACE_ADAPTER) {c_0x419558c7(0xdc5ba7e9606789c481c3b812c28c749a43953b372981823a47efc0638ff4efc6); /* function */ 

c_0x419558c7(0x048b875a2d6297b7ea7a20cb582eb2ae43f135952dffdb4918755530bd968786); /* line */ 
        c_0x419558c7(0x6e45dc40f5e3dd1803f66e0e17a7b12d59c828b1e7096acdbba9eb2045eb3ecb); /* requirePre */ 
c_0x419558c7(0xd63a88a050a3d0f6913c698b5cef7e9331e331f8380fcd53e18014df9b9f9e16); /* statement */ 
require(adapterId != bytes32(0), "adapterId must not be empty");c_0x419558c7(0x81e0cad03f1384ba3a0bdcc2e518de9410213721154e92f1aad4049b0b85f7cc); /* requirePost */ 


c_0x419558c7(0x349ab0a144f00faf52d1017eef8bf266f759b70bf2182bd78d0822b085a712fb); /* line */ 
        c_0x419558c7(0x9441a334fad46d92de1e8fd6e64672aeea2b132a58cda9cf0f05901a501c5d80); /* statement */ 
address currentAdapterAddr = adapters[adapterId];
c_0x419558c7(0xbd36f31f81e7143f8dabc8909df49c902f27be288b1d5c3aa0ac4e1d6d2f6716); /* line */ 
        c_0x419558c7(0xac7dc3f4367e45909fdaff4dd509c11f01e46fd44228e8388fc3cc8a7d56c24c); /* statement */ 
if (currentAdapterAddr != address(0x0)) {c_0x419558c7(0x1ad505cab25360fc398425ad3c9f3f17ff6b7a31bc2446a02d6c9f92b8523b85); /* branch */ 

c_0x419558c7(0xb2895c80322d9793aa1ca7054a925ed7970c5abc117b78da689506d181e14212); /* line */ 
            delete inverseAdapters[currentAdapterAddr];
c_0x419558c7(0x4b7aa99ce545c5b76658e01458abbb3614fe193bec268724bac952062bbdedfa); /* line */ 
            delete adapters[adapterId];
c_0x419558c7(0x50e5b96f9cac1dcaf3bbd51a3b9d9c71dd54086b16f28cc1e511e7aeaefa8083); /* line */ 
            c_0x419558c7(0x13cbc5211d204ccfe4079f90adfd2e6d509379c57482a405be3704db7529f197); /* statement */ 
emit AdapterRemoved(adapterId);
        }else { c_0x419558c7(0xc9aae5cd26e23aa006943d99563ac688d54e0af76b922fe534234df3d4208d27); /* branch */ 
}

c_0x419558c7(0x64d6b01755fc404c844361549c6c809566016a03f4cfe916008ad08a69be6da9); /* line */ 
        c_0x419558c7(0x72036fc3bac5bd2bad1fc7b3c2b7fe8cd122b17f804efbfdaa2e98f99e2d7999); /* statement */ 
for (uint256 i = 0; i < keys.length; i++) {
c_0x419558c7(0x4898373a59f4c8f01dce018a1522573585ec72b5680f91b9ec26f49d41185892); /* line */ 
            c_0x419558c7(0x73d2efbd8006f5b6414619bd2c6e06b6687eb4c71964c6e90f939d8bc8c9d3fb); /* statement */ 
bytes32 key = keys[i];
c_0x419558c7(0xcd64805e87d41b3076f763da53c231644bb1a84411d8dcd9ecabac7d83c9492d); /* line */ 
            c_0x419558c7(0x3cf8ac2c6b181951924248057572f83e907ea4a9b36351b8c7699f644b7624ec); /* statement */ 
uint256 value = values[i];
c_0x419558c7(0xd143e86505ec4125be40dc5561e8e7eac65e3cd17e615efbe6bdb06ac8d9b4e2); /* line */ 
            c_0x419558c7(0x09bf58458b651b46f710cd51bb753821fc5136aa7e6db30aabf71e6044ca1f47); /* statement */ 
mainConfiguration[key] = value;
c_0x419558c7(0x577584190a3a42bd2098d774e10b568344d558353492402c3e67d0c377043966); /* line */ 
            c_0x419558c7(0x5f34f684461aaf4a1ff6cb49963b66ce7a8117b7eb228630341e22a6fe4481e1); /* statement */ 
emit ConfigurationUpdated(key, value);
        }

c_0x419558c7(0xbf747edf85f3a633d01c50d0d36da9f4ad9bb1608a9c5b0694820fb8dd960e2b); /* line */ 
        c_0x419558c7(0x9008609491b861cc2c355805e75a96da2af6a05a24ac3ab2ae75108fd5ffb969); /* statement */ 
if (adapterAddress != address(0x0)) {c_0x419558c7(0x549ec508c6a17ac4a3e47322193825dc8053f2dbdf3e047b1bb6d3a52da0637c); /* branch */ 

c_0x419558c7(0xe96af3a8df68077110db5d8e4bf5e7c12c8eea5d394be3b14fdb85ac22a7e9da); /* line */ 
            c_0x419558c7(0x7f6004667ac2a041f62a2e41fe66cff222974d4aca8e56ae39580ec376e1bca0); /* requirePre */ 
c_0x419558c7(0x1c7d07abfe9647c4746623f1beeca9e15bfb5ed4fea88f7889ed03fe7c406ed9); /* statement */ 
require(
                inverseAdapters[adapterAddress].id == bytes32(0),
                "adapterAddress already in use"
            );c_0x419558c7(0x0ec1e92f213203878ec4f37e684e0a6c3692602572b52bd98bc56986eb49c61b); /* requirePost */ 

c_0x419558c7(0xc9d02c3345a657de09dea2ce9920797b116c0a89561787ea1c47969b1c97e041); /* line */ 
            c_0x419558c7(0xd07aabbc12ea6eceb5d37df1eeeae240b0c560fdbee565c5161036900135c736); /* statement */ 
adapters[adapterId] = adapterAddress;
c_0x419558c7(0x78ccf57a3e86a447af3c34f0b1ea20f57529cb59ee740e25d46fd28a5c67e0f0); /* line */ 
            c_0x419558c7(0x3f88ebc9c3ab6f0b4dd1ce6e6da6c5925199280b86a7c7e2a04cfb755b4b2f5b); /* statement */ 
inverseAdapters[adapterAddress].id = adapterId;
c_0x419558c7(0x408c8e42e0561fe6154d2ff95c13b6c7cd2e41701b6baf52cc71855025657415); /* line */ 
            c_0x419558c7(0xc59cdbb9a066b6c7a2b0ebec2e142757d70f9bcce814be19559705e3c17ad6d5); /* statement */ 
inverseAdapters[adapterAddress].acl = acl;
c_0x419558c7(0xe2c27970fffc9c8cb9fbce6cb45e9691b7a603fd18ecc49113bf3adf66d0a44a); /* line */ 
            c_0x419558c7(0x69e4e7fc23a63a5be7eee940f7f2c373f87952b7672d2c12468482b661a1a8ee); /* statement */ 
emit AdapterAdded(adapterId, adapterAddress, acl);
        }else { c_0x419558c7(0x49df6be28348d5766b72b084f250f1544ca121cab8520aed3c46a1110a065495); /* branch */ 
}
    }

    /**
     * @notice Adds a new extension to the registry
     * @param extensionId The unique identifier of the new extension
     * @param extension The address of the extension
     * @param creator The DAO's creator, who will be an initial member
     */
    // slither-disable-next-line reentrancy-events
    function addExtension(
        bytes32 extensionId,
        IExtension extension,
        address creator
    ) external hasAccess(this, AclFlag.ADD_EXTENSION) {c_0x419558c7(0xee57c4bd207fa78289de0b450c74bcb2510bd3c2541c9ef1181e4b31bd7d6830); /* function */ 

c_0x419558c7(0xc6129146356c5aa2d66b807cf297bc04dc513b06480eafd50580029e981f8fac); /* line */ 
        c_0x419558c7(0x6b895e8584d6cb97cec486d77bea531ff74ed235017578e821d9be3699f51e27); /* requirePre */ 
c_0x419558c7(0xe9250e5569602fafc07e83dd67efc7bab972eadc5ec34cf1e87fb95620e57332); /* statement */ 
require(extensionId != bytes32(0), "extension id must not be empty");c_0x419558c7(0x81cb0739aa1048ed8a90fcae02ca65f504eb221fade35e5c66fa24f26d866fb9); /* requirePost */ 

c_0x419558c7(0x4ce9b43eeb58903d8678a8cba5b541ae0e020984291e62c16e79e79b63afb64e); /* line */ 
        c_0x419558c7(0xb9a74528031a0a18f7dd513a45c675d474fa3104b1f76dfa4e0d959b8efac1f6); /* requirePre */ 
c_0x419558c7(0x450d314a434ab7e9c9a28d463ee247589e8257ebc88d4d66054f5f71057a72c0); /* statement */ 
require(
            extensions[extensionId] == address(0x0),
            "extension Id already in use"
        );c_0x419558c7(0xa78cc3e7a11d64482eafc51c57889e73cd30d8a5f052f4d11fff64072263064c); /* requirePost */ 

c_0x419558c7(0x623e9bfe8779264f9980b167d0ef80abd73cfd486c57976132b509a2225c4877); /* line */ 
        c_0x419558c7(0x144549258158db1f32943829c47027d1f662e88982c140eff7d305d3ad89c978); /* requirePre */ 
c_0x419558c7(0xb15033a38fd1cfb06a4b654653e869e20141b0cb772867c4cb87aeaa49d31ebe); /* statement */ 
require(
            !inverseExtensions[address(extension)].deleted,
            "extension can not be re-added"
        );c_0x419558c7(0x4fadbf176984d2a788cc12a6558a519c8d948c4ed43ed324a2953c53106c2edb); /* requirePost */ 

c_0x419558c7(0x12afe81b133834f6ca9420ed4c60566201a98e542aeb5100b160e15b2d830056); /* line */ 
        c_0x419558c7(0x27f8a29064cdaaba9a3ac15c0627f6e4cf53553d43e0cc06ea68d193558f0283); /* statement */ 
extensions[extensionId] = address(extension);
c_0x419558c7(0xa4999888b5a854ee64c58f8dddb46e0afd9f52a07e03b7357c1a5d7b5d056c80); /* line */ 
        c_0x419558c7(0xc6091dab1616f728f8d631d40d2fb204b2a4f6a98786f9eab62b98de6e322dc4); /* statement */ 
inverseExtensions[address(extension)].id = extensionId;
c_0x419558c7(0x8fddc5b55cb302c96064f0f48c7a07f48fb3c9fc1e602c5c405225a82aeb22e2); /* line */ 
        c_0x419558c7(0x458c1280978d00032ee8d3e70d065edbf9f8daad908a3cd5e24bb68ddef2496b); /* statement */ 
extension.initialize(this, creator);
c_0x419558c7(0xade167575d810274cdd5b1c85e18d4a4e21a430d96ad07db12ec2607f47f745b); /* line */ 
        c_0x419558c7(0x8c590595b3f37efca944c9273e602fea60f5d3fa2c1c41a7991f375f7ff94f1a); /* statement */ 
emit ExtensionAdded(extensionId, address(extension));
    }

    /**
     * @notice Removes an adapter from the registry
     * @param extensionId The unique identifier of the extension
     */
    function removeExtension(bytes32 extensionId)
        external
        hasAccess(this, AclFlag.REMOVE_EXTENSION)
    {c_0x419558c7(0x4e6c65e00316c844fffd6095f7e5bf939bb1224d9539ecfab3f0709f15c241e7); /* function */ 

c_0x419558c7(0x21d02ffa4c178016494ec10880fd1b5d1e51bc895c14ae4911cae5385d6d3f8d); /* line */ 
        c_0x419558c7(0x92334e36cf24ac8de99b05c6532bf58b851424aaa5f26bac61e100872331a524); /* requirePre */ 
c_0x419558c7(0x0da4455ee92207d6c00d932d05c4a2ca9c3e811db78623558edb57d4713ac770); /* statement */ 
require(extensionId != bytes32(0), "extensionId must not be empty");c_0x419558c7(0xfc47d6e9234e431593b6a1e7e2cde62c52d79c80c2a149281e6d5540f2622bbe); /* requirePost */ 

c_0x419558c7(0x6a75f0161d78ddd3db735cfcaca9d477b7007353cae11ab2b6ffb709cbb204d7); /* line */ 
        c_0x419558c7(0x9e8a78794da3e74700020609d133279c89793cbe32525d3bc52ee229988227ea); /* statement */ 
address extensionAddress = extensions[extensionId];
c_0x419558c7(0xacc9375f7454aa6210c23e88095171ac03b8e063c0fb7bafae22a545755e8e56); /* line */ 
        c_0x419558c7(0xc4bd1014aaf0412be0208a2a784aef4b694eafde98ad9e78895533d31c60b661); /* requirePre */ 
c_0x419558c7(0x9dee3f2c1fee3f5ac4d0c7073459aa7f2dc0ede8b8fa5d5d97788107ee6c2d7a); /* statement */ 
require(extensionAddress != address(0x0), "extensionId not registered");c_0x419558c7(0xc8274953b2b39c09b9ec02d51269834ca13a0fbddabd83e3de0303db49c16449); /* requirePost */ 

c_0x419558c7(0xba6ba295343919f1d97aba2cabfe642f8c4c49876bd1c6380c796f3b075857f2); /* line */ 
        c_0x419558c7(0x6c5c9d64a6ab4e6e56a7e5b1d7bda3458bfa479af36bd29dc6559a8d084a8b09); /* statement */ 
ExtensionEntry storage extEntry = inverseExtensions[extensionAddress];
c_0x419558c7(0x8deb80348cb0347302267b0a0f9bbf8d9ef9f16817af74bb7505b40b30c3a065); /* line */ 
        c_0x419558c7(0x6b9893606375d0f5eb63521a6efd3a459fa28b8fe8b27f94b4194d92bbb06d4e); /* statement */ 
extEntry.deleted = true;
        //slither-disable-next-line mapping-deletion
c_0x419558c7(0xf6f835a48e9d66241a9ff01c772ee5eb6500d3535b6797d6da86e1956f99902d); /* line */ 
        delete inverseExtensions[extensionAddress];
c_0x419558c7(0x5958ebad8b72d7dabe3d736b884504f83b0b0332e79aec1b04f6953ae0a4066a); /* line */ 
        delete extensions[extensionId];
c_0x419558c7(0x5cb4d6773a8ec08af7b6d6d050e7d64366f46839c113172464e39266c7595e49); /* line */ 
        c_0x419558c7(0x2a5ad8515c83e54dc8940e0d1256fe33f0f8f10c8229dbe5c18e7c7984f9dc8c); /* statement */ 
emit ExtensionRemoved(extensionId);
    }

    /**
     * @notice Looks up if there is an extension of a given address
     * @return Whether or not the address is an extension
     * @param extensionAddr The address to look up
     */
    function isExtension(address extensionAddr) public view returns (bool) {c_0x419558c7(0x3595f9444782ec0da63a6169923e3596cdec446d6c5f15dcdd2855ae0eb73837); /* function */ 

c_0x419558c7(0x3c31798570b11313d206d637753baacd67a35234fc7b0f76fa31c576e0338bc1); /* line */ 
        c_0x419558c7(0x005d5aa9422cda138894daf1eff22495f839b205232d331c4cb742d53e8824c8); /* statement */ 
return inverseExtensions[extensionAddr].id != bytes32(0);
    }

    /**
     * @notice Looks up if there is an adapter of a given address
     * @return Whether or not the address is an adapter
     * @param adapterAddress The address to look up
     */
    function isAdapter(address adapterAddress) public view returns (bool) {c_0x419558c7(0x057190d2072cba2cd93d8eb16ff337e6c8ae90c97908e03515492f08f3e3c1a9); /* function */ 

c_0x419558c7(0x02243283aefd714d1cb775f7ba37490867778e200210647451eba07e8b97cc3e); /* line */ 
        c_0x419558c7(0xc04bee92b87338896a3c61a12e7410acd8a63c5a2a597e335c2a13f74f186f90); /* statement */ 
return inverseAdapters[adapterAddress].id != bytes32(0);
    }

    /**
     * @notice Checks if an adapter has a given ACL flag
     * @return Whether or not the given adapter has the given flag set
     * @param adapterAddress The address to look up
     * @param flag The ACL flag to check against the given address
     */
    function hasAdapterAccess(address adapterAddress, AclFlag flag)
        external
        view
        returns (bool)
    {c_0x419558c7(0x6506a53017c1378fdb49080d35cfc72aae8727e056d01c1ce184f0d77de51d24); /* function */ 

c_0x419558c7(0xb5f090cbebbc60d4e162880a33309a01354f0b0a3991c52c36a58f6088ebfad9); /* line */ 
        c_0x419558c7(0x9e626bf3cf9bb388d9dcaa9ac0e6561dae493577371e0fdd0686f5acd96029c7); /* statement */ 
return
            DaoHelper.getFlag(inverseAdapters[adapterAddress].acl, uint8(flag));
    }

    /**
     * @notice Checks if an adapter has a given ACL flag
     * @return Whether or not the given adapter has the given flag set
     * @param adapterAddress The address to look up
     * @param flag The ACL flag to check against the given address
     */
    function hasAdapterAccessToExtension(
        address adapterAddress,
        address extensionAddress,
        uint8 flag
    ) external view returns (bool) {c_0x419558c7(0x0f2ca46caab8ce74405e3b7392ac9aef90476ef6e12a2c2cb1b9375f1b46abf8); /* function */ 

c_0x419558c7(0x927d0afaf6e3ac6b6891427a201f9eb28d6b5892de64fddb9c8832882cbc0e43); /* line */ 
        c_0x419558c7(0xd6021fd26984d3bab0ced270b32c70d00ada61abc81c7e25430457f561bec5b1); /* statement */ 
return
            isAdapter(adapterAddress) &&
            DaoHelper.getFlag(
                inverseExtensions[extensionAddress].acl[adapterAddress],
                uint8(flag)
            );
    }

    /**
     * @return The address of a given adapter ID
     * @param adapterId The ID to look up
     */
    function getAdapterAddress(bytes32 adapterId)
        external
        view
        returns (address)
    {c_0x419558c7(0xc134f69b937e4fe478416f00c7d24e96f307c9398c61d01b80c77d258a7e9966); /* function */ 

c_0x419558c7(0xbcfb1877e76583e46a5dd83671b85ea8b68a6d4501b3e34c76ae31c2841ebd2b); /* line */ 
        c_0x419558c7(0x967b0d360fcf7f6449384c97c8cb971fcb27169f66adc63c1b6e8b7dbbbe7274); /* requirePre */ 
c_0x419558c7(0x775431e1b190e4af47f37492c7b1ae916f454f17349127bc00cef3c5849d2d9e); /* statement */ 
require(adapters[adapterId] != address(0), "adapter not found");c_0x419558c7(0xcd267bde234f11602b0800dd6d3da17666c5d755615631f6415cf357375ef2dd); /* requirePost */ 

c_0x419558c7(0x6c2f0ac92f94f0be5f679af10411c00e86019ba4765fe8d81f49d929aee2d047); /* line */ 
        c_0x419558c7(0xd76d20ef580f83bc99a0f2082115dea5789e4a2f3876522883261280cda5e851); /* statement */ 
return adapters[adapterId];
    }

    /**
     * @return The address of a given extension Id
     * @param extensionId The ID to look up
     */
    function getExtensionAddress(bytes32 extensionId)
        external
        view
        returns (address)
    {c_0x419558c7(0xc126afeb91ee72e6e7de45567ad6f17d9801b0ab5f3cbc9c16b1d0e462e9c84d); /* function */ 

c_0x419558c7(0x656239d06dec36bcbd5f85182362ef475f1a38cd7cbf6ce67af902d8f42abca8); /* line */ 
        c_0x419558c7(0xe9ab8aebd59e9f83f2957b21da8001439d90e73c323b98382c9491ed41755678); /* requirePre */ 
c_0x419558c7(0x85c1e684531900f68958e2974c3edb7a160e54093bb32a2d4b067dcb088d6a2f); /* statement */ 
require(extensions[extensionId] != address(0), "extension not found");c_0x419558c7(0x7b3454940eb51112fe00d9f5bbb3fe261eaef9fd8d097b49129efd005a2a1f0c); /* requirePost */ 

c_0x419558c7(0x699a2e879540844c43bcc3db898c56f2fe1637953e18f0804a305b807b6b29ff); /* line */ 
        c_0x419558c7(0x4082ca92f858816d242337a13bc7633c4e4559077117b984fcf88d9b5f852827); /* statement */ 
return extensions[extensionId];
    }

    /**
     * PROPOSALS
     */
    /**
     * @notice Submit proposals to the DAO registry
     */
    function submitProposal(bytes32 proposalId)
        external
        hasAccess(this, AclFlag.SUBMIT_PROPOSAL)
    {c_0x419558c7(0xcbbf3d5159455f57dc554a61bbbd75e1b08d0ca019e15a23d873c5693baeddc0); /* function */ 

c_0x419558c7(0xe69b032e65e49da6203185bc2c01a75ac7e6f872f7c42c8cb7205d369186bbb9); /* line */ 
        c_0x419558c7(0xd5f713b221f49a30f33c3c2b3d201837bef093bf27a58f660274a2679c4ab25a); /* requirePre */ 
c_0x419558c7(0x3bd6e80b7941156fc3ea43e5d05c0d918cba962f1592d7b1c2f4f4a297cbca8d); /* statement */ 
require(proposalId != bytes32(0), "invalid proposalId");c_0x419558c7(0xec3a6cb98c9f70437220d592ef9d41bef564e13a095419adfd722fdb99ed3aac); /* requirePost */ 

c_0x419558c7(0x7648b6bb4d084fff8140ee2a598c0fd54657c248579d01980b18dc6d718369c5); /* line */ 
        c_0x419558c7(0xd243d2dd93c651e05087bba9ae02f94d6eb92168db583867860926184ac675e0); /* requirePre */ 
c_0x419558c7(0x67691ee6964f6c16bfe254654f52bbdaa2a4cd9c6e6dd1c5b2baa135d4f105d0); /* statement */ 
require(
            !getProposalFlag(proposalId, ProposalFlag.EXISTS),
            "proposalId must be unique"
        );c_0x419558c7(0x752e43aabd7ac35c9d4a7370ce5072f953405a8f6d843ce0529c8a18a34dabc4); /* requirePost */ 

c_0x419558c7(0xe1355aebd54b463f8c58d22cf50034f6489ec279d5e4235e6b1873f5156e0188); /* line */ 
        c_0x419558c7(0x58f70bc0a432e2cbdc5e47baebd4e23de88cc9ca2a216917be1df0908bc789a9); /* statement */ 
proposals[proposalId] = Proposal(msg.sender, 1); // 1 means that only the first flag is being set i.e. EXISTS
c_0x419558c7(0xf470c1e8ab481f790387929203a66389cfca688a620bb379fefaa312fb1c3651); /* line */ 
        c_0x419558c7(0x582a5317d26e02f52209c2142c826c4491a68a42bc25d69b732c3bf736bcd7ab); /* statement */ 
emit SubmittedProposal(proposalId, 1);
    }

    /**
     * @notice Sponsor proposals that were submitted to the DAO registry
     * @dev adds SPONSORED to the proposal flag
     * @param proposalId The ID of the proposal to sponsor
     * @param sponsoringMember The member who is sponsoring the proposal
     */
    function sponsorProposal(
        bytes32 proposalId,
        address sponsoringMember,
        address votingAdapterAddr
    ) external onlyMember2(this, sponsoringMember) {c_0x419558c7(0x5cbdc174478de3de00fe6dc6470cdb07bb7db08a39178907bde21bc662440118); /* function */ 

        // also checks if the flag was already set
c_0x419558c7(0x7ff56b96d03995084f16b81aa7cd46e153923c85a7105d7dfcda5ec294cfa224); /* line */ 
        c_0x419558c7(0x0a60d951b1e72deea46ec0240d7fbaee903607570444c1a99792d77e86b2203b); /* statement */ 
Proposal storage proposal = _setProposalFlag(
            proposalId,
            ProposalFlag.SPONSORED
        );

c_0x419558c7(0x04dacfdc62b6644252852407f2dafcfd48154c6604eb7b2c9bf43afc68f5ed3e); /* line */ 
        c_0x419558c7(0x7d894f932e9a1e0dc641ee163f043ebbde6fe1c0cf6b8bfe5149a4070276bc17); /* statement */ 
uint256 flags = proposal.flags;

c_0x419558c7(0x78b4dd91a071d54b62a1bd0d83ded6ed394fb200f84895740884e492591cead6); /* line */ 
        c_0x419558c7(0x426336d3217bfeef56d78fbed6d30beb3f42dc002e7013c100ca4efec101f3c8); /* requirePre */ 
c_0x419558c7(0x106d9fe9c4750c3f526a140b4ca0b635f1ec2f4c03acb8470f5571c403bbf4b2); /* statement */ 
require(
            proposal.adapterAddress == msg.sender,
            "only the adapter that submitted the proposal can process it"
        );c_0x419558c7(0x470364c2d10185444590b5a627951c9a37ac51905cd00456156a472e504800da); /* requirePost */ 


c_0x419558c7(0x06837cbf6f1cc2609a9aff8c60764a2f181fff43d2aeae18a61207948965887f); /* line */ 
        c_0x419558c7(0x89f8e142383235c875b43aa2bf26c9f391e7f56592ec219f4ce330e8c9d907a8); /* requirePre */ 
c_0x419558c7(0xa608ab63a00692cb403479edeb342a1abe36413dcb1ba06f658abe036e113883); /* statement */ 
require(
            !DaoHelper.getFlag(flags, uint8(ProposalFlag.PROCESSED)),
            "proposal already processed"
        );c_0x419558c7(0x4d32999a8c8d2a06539e0e72e5287d80286d1eb31875ab8b065350dd6ed1adef); /* requirePost */ 

c_0x419558c7(0x324a489761d7d6a6c5e775bf698213fae6ab3aa15ede8c3bbe15d10473a5dbe7); /* line */ 
        c_0x419558c7(0x86357a890a83f2dbcd2df7e279d2ff8a3e64a24accbf5b36ca28060e67aa6b57); /* statement */ 
votingAdapter[proposalId] = votingAdapterAddr;
c_0x419558c7(0xd869a4ca0e3768fcbc4e3d27d7d37fd020bff88792c9991c7744826718665c85); /* line */ 
        c_0x419558c7(0xf42510f8410594359b17b3827dcc53a2443292fa5c952f5ce226bd6134866b78); /* statement */ 
emit SponsoredProposal(proposalId, flags, votingAdapterAddr);
    }

    /**
     * @notice Mark a proposal as processed in the DAO registry
     * @param proposalId The ID of the proposal that is being processed
     */
    function processProposal(bytes32 proposalId) external {c_0x419558c7(0x1c682b91a71e594b7d0f1a4facc96d749bcd33ecaaa855b63c38783159c2b8d8); /* function */ 

c_0x419558c7(0xf5dea78143153f591cd795da322d56ee4276f9dd5c010f07f4be9fa92b2db500); /* line */ 
        c_0x419558c7(0x3d1683f8b6bfb252c0860a2068a538f350f83a58913fccc9ee99567b9f0fe668); /* statement */ 
Proposal storage proposal = _setProposalFlag(
            proposalId,
            ProposalFlag.PROCESSED
        );

c_0x419558c7(0xf02aa7e76c65d22f7f7add6485fdef885e54eb35224232a9d208ee7b983f392d); /* line */ 
        c_0x419558c7(0x6d72f269e0e7789bbf8a0a1bc01f9d982351b398407695abf36cb92be9562861); /* requirePre */ 
c_0x419558c7(0x8ccb488c8d0c9f5943d411569c43fffa7b899daaa3f23c5223aaebf45619d975); /* statement */ 
require(proposal.adapterAddress == msg.sender, "err::adapter mismatch");c_0x419558c7(0x32ab48754d49f3f52fa74bdad3fdf5b2b69db7c1457748bbaf5e8d9e9f9d2ecf); /* requirePost */ 

c_0x419558c7(0x18194fc0511b3b31d6a2f591195cd9786826751196d151c3da45e52934620728); /* line */ 
        c_0x419558c7(0x3ae7921ae1339f8971db83bf32f007bd8d3a6cb8431f07a7e919fcdc8dee7150); /* statement */ 
uint256 flags = proposal.flags;

c_0x419558c7(0x75c7fb11704ed3595cba020eacebfe9c92729cac19059941af9b770818aa6d0e); /* line */ 
        c_0x419558c7(0x5b2f8a8fcf0cc2be04bdf1551e42d0361c6af85e63f752ae9da32dc789624285); /* statement */ 
emit ProcessedProposal(proposalId, flags);
    }

    /**
     * @notice Sets a flag of a proposal
     * @dev Reverts if the proposal is already processed
     * @param proposalId The ID of the proposal to be changed
     * @param flag The flag that will be set on the proposal
     */
    function _setProposalFlag(bytes32 proposalId, ProposalFlag flag)
        internal
        returns (Proposal storage)
    {c_0x419558c7(0x35fac1c3282176cd18163ce49e066b47027549d81cfa8dd6280a85bb69eb24ca); /* function */ 

c_0x419558c7(0xd6f1ae1967c59a9419fc6d463b7504a1a504aa00bc23fd2ccbe6c97f787ac850); /* line */ 
        c_0x419558c7(0x6a23939d204a979891bd4985c6e0ff0563d00cd72405edd54d4640fbe8f85bbf); /* statement */ 
Proposal storage proposal = proposals[proposalId];

c_0x419558c7(0xf2a754fea83f6ab40115aa5e59581049116ff69a3ece7fa5df9b7b58690fb362); /* line */ 
        c_0x419558c7(0x3ad23be378197cfba1b867172bc2c9e832b35fc71e215fb563b6dc5c53485f37); /* statement */ 
uint256 flags = proposal.flags;
c_0x419558c7(0x9cc9a4b4df9b8b5124f82367df77079b847756fe99265660d8ba4cfc72402bab); /* line */ 
        c_0x419558c7(0xd299b96d766903af22798258e7edae911aa6599d2f28a45f3552a2e90d44ea41); /* requirePre */ 
c_0x419558c7(0xcb161f9d373bf4aaef935a3100588303a8b1ee4e90fd7254e655b78930526d05); /* statement */ 
require(
            DaoHelper.getFlag(flags, uint8(ProposalFlag.EXISTS)),
            "proposal does not exist for this dao"
        );c_0x419558c7(0xefb3bb82c03146a21ed57bfb28d81ee156fee9d015a44737d4039ac255ac0454); /* requirePost */ 


c_0x419558c7(0xf82a8ceb102413165557d51ed1fb378e3c4222bd53379997f2e2e40e276c3c33); /* line */ 
        c_0x419558c7(0xa4ebb3098f97ca395e1a40be1531d76c51a6975f92f7098e9f4043cd8ed242f1); /* requirePre */ 
c_0x419558c7(0xdbb7a3f4778f8e4c024c76ee371edbd0ab27fd430bcecffa76676837c2bd61bc); /* statement */ 
require(
            proposal.adapterAddress == msg.sender,
            "invalid adapter try to set flag"
        );c_0x419558c7(0x2912b4add3e570a9bcc185a9a32221e97821d2bcea0521faba5d75af203558de); /* requirePost */ 


c_0x419558c7(0xa85332907c92666e8f3f353fd1d7486431257f3dbc2e667c968893d2cdf784b9); /* line */ 
        c_0x419558c7(0x90fd85405a0e371e8cad39d7323477b45e508280ad4886702073da512375efa5); /* requirePre */ 
c_0x419558c7(0x232b89814119b864542832fce2f3b1a6c80d772ae9c9c445056dbeb3dcebb15b); /* statement */ 
require(!DaoHelper.getFlag(flags, uint8(flag)), "flag already set");c_0x419558c7(0xe20b9f0ad941c513112a7a8ca07c48cb95aae7588c923c7ca8b600d7ac3e5a13); /* requirePost */ 


c_0x419558c7(0x38717aa02d9154caa36948c6f385fce888b1e51681c9b41d1bcf906e6cdbb8d7); /* line */ 
        c_0x419558c7(0xbc9bec82d9e3726381fbdfd1d4dbe25225011f2e8af415220a01b720c19a5141); /* statement */ 
flags = DaoHelper.setFlag(flags, uint8(flag), true);
c_0x419558c7(0x47385287090073bce01acd8c11cd5e60749c4805d676245595a77a8d92c303f2); /* line */ 
        c_0x419558c7(0x4b1165f704ec21f48cdac9b8e7cec513fc93b28922328ae693e7299d354c84ea); /* statement */ 
proposals[proposalId].flags = flags;

c_0x419558c7(0x1e1d147b80512d4cc1ad16f1c3dc19775767f4438e448dd532c3cf6377de4bdb); /* line */ 
        c_0x419558c7(0xb495c451b311fc6e506d525f218c8debe6efeb1e0f4c6ae62915c2bc62599786); /* statement */ 
return proposals[proposalId];
    }

    /*
     * MEMBERS
     */

    /**
     * @return Whether or not a given address is a member of the DAO.
     * @dev it will resolve by delegate key, not member address.
     * @param addr The address to look up
     */
    function isMember(address addr) external view returns (bool) {c_0x419558c7(0x814e7fb7aed708e947de6a1516a035d590bd9280445f7bc4cdb7222ac6fcf54f); /* function */ 

c_0x419558c7(0x0674fad27c708ba07c6d5871afe395c1899c13215d0fcc12060073ae32049e73); /* line */ 
        c_0x419558c7(0xf9f0aac081f3039880649c5434c705e32b43d76f8a92f8a29ce146b669a549bb); /* statement */ 
address memberAddress = memberAddressesByDelegatedKey[addr];
c_0x419558c7(0x75ddfb14837208996f81667db1e1a5efb97d230735e08f84fd0df6ce86cf7b17); /* line */ 
        c_0x419558c7(0x0f12a6ae469a08a052e7d4cbee4b5c40091b3bcc86083a81778292f29126f386); /* statement */ 
return getMemberFlag(memberAddress, MemberFlag.EXISTS);
    }

    /**
     * @return Whether or not a flag is set for a given proposal
     * @param proposalId The proposal to check against flag
     * @param flag The flag to check in the proposal
     */
    function getProposalFlag(bytes32 proposalId, ProposalFlag flag)
        public
        view
        returns (bool)
    {c_0x419558c7(0x8bf9844855c47225303294af224911a268cff409ccfa007e63088bed8dd3542f); /* function */ 

c_0x419558c7(0x2ae52fdf6266d328fd504e291b06fc384e9b647e1c7971db38c9737266fbf772); /* line */ 
        c_0x419558c7(0xf5deae74fca4042d521423077db228b039367374950f124cf0bf9579e8b1b43d); /* statement */ 
return DaoHelper.getFlag(proposals[proposalId].flags, uint8(flag));
    }

    /**
     * @return Whether or not a flag is set for a given member
     * @param memberAddress The member to check against flag
     * @param flag The flag to check in the member
     */
    function getMemberFlag(address memberAddress, MemberFlag flag)
        public
        view
        returns (bool)
    {c_0x419558c7(0xc122fb84508b5ba044131d6f248ec75190c65330e81b12645f938b65c630fbc6); /* function */ 

c_0x419558c7(0x3b537c9519b4901cac96b032bfe2e04b10e695e5768f309f502cffaa0dfa3022); /* line */ 
        c_0x419558c7(0xcb745743bc2723e20b9ad8e2746c731cb581b96cd2181acad294fdc616b9e5b4); /* statement */ 
return DaoHelper.getFlag(members[memberAddress].flags, uint8(flag));
    }

    function getNbMembers() external view returns (uint256) {c_0x419558c7(0x684e8e9dca8fcc1b4a5547fd18a89d4eefbaa3616de628bd75fa5b25ad6eefac); /* function */ 

c_0x419558c7(0xcb52fd1ce68b5734d8d621f42f3963efe09b372e9918e5cc9bfc727ab4dd2596); /* line */ 
        c_0x419558c7(0x54816cbbe306c7ff478f5497c6359075a59b86961d6966ecf9f1eb546c7e25cb); /* statement */ 
return _members.length;
    }

    function getMemberAddress(uint256 index) external view returns (address) {c_0x419558c7(0x70488373f2ced8a80ae220d85bd056c1f4385e8eb92507170dd3fde99a3b08cb); /* function */ 

c_0x419558c7(0x81a3a0f8163466d8d3b394d667d9847bef67aac44c98aac165f7ad95f0070a88); /* line */ 
        c_0x419558c7(0x7bdacb89a0e4364b917961519216ea3650da906c70c49bbc1d900dc704661907); /* statement */ 
return _members[index];
    }

    /**
     * @notice Updates the delegate key of a member
     * @param memberAddr The member doing the delegation
     * @param newDelegateKey The member who is being delegated to
     */
    function updateDelegateKey(address memberAddr, address newDelegateKey)
        external
        hasAccess(this, AclFlag.UPDATE_DELEGATE_KEY)
    {c_0x419558c7(0x6976bd85ef2b68d3310df42ea64ce9c51facf1a39b57ad7a48e883b0413d8dc0); /* function */ 

c_0x419558c7(0x0228c75f84511803467456399b6488aaf17f7b534ae485e22caaaaf81a7945cc); /* line */ 
        c_0x419558c7(0xdaecb5b346081b13086d9854836d4f5bfe18ba07c903781fd0e964390370d78a); /* requirePre */ 
c_0x419558c7(0xaa7b00dae2288d997ad6f2fa0ff162007fb10ad7f85f2b68d1159b987f1141ea); /* statement */ 
require(newDelegateKey != address(0x0), "newDelegateKey cannot be 0");c_0x419558c7(0x068d6b7b11db8844076d15f99aa5da1e9a33125f62f4d468342a59f144d88405); /* requirePost */ 


        // skip checks if member is setting the delegate key to their member address
c_0x419558c7(0x24b943ea5e5e366523c6e43e731ab865082162cefe5b9851161f14a64d9eb1f3); /* line */ 
        c_0x419558c7(0xe429b0b228a15f8e758e6a76b5563de2bb4a4a28e4fc033d5d3f7af997d9fec7); /* statement */ 
if (newDelegateKey != memberAddr) {c_0x419558c7(0xa0d4e3a28d8028daec681f37db78157a18e0fdb58e10f7bd9b96c04c4e130ee0); /* branch */ 

c_0x419558c7(0x7f5e15919c7f49a888efc2491cb246aba3847ab2a5f5a3bac62dbdb2b21886ef); /* line */ 
            c_0x419558c7(0x72abcddee529d76970032cad38381177aee9a02ebf333611c01dddb4c7785d9e); /* requirePre */ 
c_0x419558c7(0x6c82d2a31c99a390b43959f4293ba9f5f216a77aebb37fb1c3e8c6dafbe21100); /* statement */ 
require(
                // newDelegate must not be delegated to
                memberAddressesByDelegatedKey[newDelegateKey] == address(0x0),
                "cannot overwrite existing delegated keys"
            );c_0x419558c7(0xc9df04797ecb1a0d3bae544aee4a72d3abe721664070712622c1a669ed1be0b2); /* requirePost */ 

        } else {c_0x419558c7(0xdb81a85ec7fc17a05d1d5f2ac5816b983a8a5353ca144696062c9791c324d681); /* branch */ 

c_0x419558c7(0x857c027e8a1d951147e681ea76c57dada60444eaa9eacd5a8c9e6219fa08df00); /* line */ 
            c_0x419558c7(0x6aa0485b71b681eb90dac5898780ad4a9f7954b21262e1c2cf93895b79515953); /* requirePre */ 
c_0x419558c7(0x1d0f5a8a5c1a9a9910e3ef7e965b887500b7934cdc4e064edc0f47f486552cbc); /* statement */ 
require(
                memberAddressesByDelegatedKey[memberAddr] == address(0x0),
                "address already taken as delegated key"
            );c_0x419558c7(0x1df8627e2ffe2b9cade464d7a93680484a577dec506df7cc6f22e66106adaa8a); /* requirePost */ 

        }

c_0x419558c7(0xc9ab9f3c9eadcdf3ba96c75dac3c802fb6453ac6d85199e8f4fba3145e32ed3c); /* line */ 
        c_0x419558c7(0x805a59a7ecd9de0fa6f163c1187d3ebcc78ca77c49da213dc1dc37257e161036); /* statement */ 
Member storage member = members[memberAddr];
c_0x419558c7(0xf48a3b7f43d23a0544d4858c9ff84f55ecc9793e373d9d1f50cc803bcdc9401d); /* line */ 
        c_0x419558c7(0x7bf3a55d8326c69889288e4c311abbe2e38a5d06c984677e7f409c2a5d2eb629); /* requirePre */ 
c_0x419558c7(0x8ca3778e0af93f3f557cda2de925a1d1210e481e5bc9d9e200fbe6a21556f068); /* statement */ 
require(
            DaoHelper.getFlag(member.flags, uint8(MemberFlag.EXISTS)),
            "member does not exist"
        );c_0x419558c7(0x531d96f4230d1b0311072493d0b2b60c6885b6c80c1a58160e1c3127b2fb8442); /* requirePost */ 


        // Reset the delegation of the previous delegate
c_0x419558c7(0x64470c7def9f84d1f236d85524ff4a52364e2e9e9a8ed187bc47f39b117f297c); /* line */ 
        c_0x419558c7(0x8d18311bacda724892b8079bd357b10e7f0677d4d1dfd2304ab50f545824a907); /* statement */ 
memberAddressesByDelegatedKey[
            getCurrentDelegateKey(memberAddr)
        ] = address(0x0);

c_0x419558c7(0xd154364456613508c217c9ab38ea0e0b59a653b6868d04b545dadec08d2fd14b); /* line */ 
        c_0x419558c7(0xcb5bb99d9a1839116080cf46d410282b56cd4c7f4547083d5b2333638acd6363); /* statement */ 
memberAddressesByDelegatedKey[newDelegateKey] = memberAddr;

c_0x419558c7(0x55b978879f8e5cefdb0f8ab33ca8793a475a65f2d35f747b041ce40917481fb6); /* line */ 
        c_0x419558c7(0x4da9f64564883fb0cfe8a9eb7fb096b2ab53137fc8255ad249826958b73a27f8); /* statement */ 
_createNewDelegateCheckpoint(memberAddr, newDelegateKey);
c_0x419558c7(0xb0a4c35b31b789a69e3e88ee430aae93399c986d4da8384ebd99c2c23174e45e); /* line */ 
        c_0x419558c7(0xeeeac1b14b72a04e008a366e803b4186420755290b375979929641eab7639554); /* statement */ 
emit UpdateDelegateKey(memberAddr, newDelegateKey);
    }

    /**
     * Public read-only functions
     */

    /**
     * @param checkAddr The address to check for a delegate
     * @return the delegated address or the checked address if it is not a delegate
     */
    function getAddressIfDelegated(address checkAddr)
        external
        view
        returns (address)
    {c_0x419558c7(0x68804120bd4fcf43a822af877ed10cfa33d52f731f887a52cc00403a9e675ac2); /* function */ 

c_0x419558c7(0x99c3344c71553ad4d04ff0d29ccda036c0661231387413f8e8c9067f585caec6); /* line */ 
        c_0x419558c7(0xe209f40f423b06ad795efbc807b9ea5228a35170e1ef2ff960cf94bfae0ff942); /* statement */ 
address delegatedKey = memberAddressesByDelegatedKey[checkAddr];
c_0x419558c7(0x9f07c799f48fb092cbf41353db924f1265b36b5b4b5b72047e944cd26487a129); /* line */ 
        c_0x419558c7(0x15fcd84e29e4574258dd0edd3aab5bc3057eb9c7c49c0fdb7d1d13ffe08aa9db); /* statement */ 
return delegatedKey == address(0x0) ? checkAddr : delegatedKey;
    }

    /**
     * @param memberAddr The member whose delegate will be returned
     * @return the delegate key at the current time for a member
     */
    function getCurrentDelegateKey(address memberAddr)
        public
        view
        returns (address)
    {c_0x419558c7(0xf3a05c3f1195bb375e4c99f1caa95a99becca127218dc1fdbe39d72c452e5346); /* function */ 

c_0x419558c7(0xf59f8ce81c812df56f57d7e58aa12a66f5214109f473225c5962dcf7c35bdfe8); /* line */ 
        c_0x419558c7(0x318251e4588a9d8e5a1a771b8a6f9472b0e3ee28386cd8ded6a7b698070c4f33); /* statement */ 
uint32 nCheckpoints = numCheckpoints[memberAddr];
c_0x419558c7(0x75be3afad3b054ca43d96f3de15f1fac0a9a952816c9c140373993323445e77d); /* line */ 
        c_0x419558c7(0xf14678200c77e5ea5241afd390fc3d3c9ffdd247c129ed0267793acd3e3417b4); /* statement */ 
return
            nCheckpoints > 0
                ? checkpoints[memberAddr][nCheckpoints - 1].delegateKey
                : memberAddr;
    }

    /**
     * @param memberAddr The member address to look up
     * @return The delegate key address for memberAddr at the second last checkpoint number
     */
    function getPreviousDelegateKey(address memberAddr)
        external
        view
        returns (address)
    {c_0x419558c7(0x2bf4043c713bf82018d5aaada0aa1e3dc2267c3af74616ff9ae6a0c2af87d4a1); /* function */ 

c_0x419558c7(0xf12195818c029979652fd2f7e76b71e9341f27c9df8290116252ed5fe11e532e); /* line */ 
        c_0x419558c7(0x7c4cc8eef01e357dbc6d2bebc76bee3fdfdbd9484f1c344d8e7166270c7b1245); /* statement */ 
uint32 nCheckpoints = numCheckpoints[memberAddr];
c_0x419558c7(0xf57dbf6b55a4f5337651aa1e8ff5ed67e21323181a505ca730452ded92ee114d); /* line */ 
        c_0x419558c7(0x588a99bb8551368256ac642e4fcadc13cbb366b7ce119bcd788de237aa151fe9); /* statement */ 
return
            nCheckpoints > 1
                ? checkpoints[memberAddr][nCheckpoints - 2].delegateKey
                : memberAddr;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param memberAddr The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorDelegateKey(address memberAddr, uint256 blockNumber)
        external
        view
        returns (address)
    {c_0x419558c7(0x33b021a9047a978130f47d86eaea5cc0d041a57f30cbb4dbf0f827f5e45defb4); /* function */ 

c_0x419558c7(0xad8a73c486e02182ab14b381eb8f98e8fa26dfe27a1e2137e87decb4917415b5); /* line */ 
        c_0x419558c7(0xd690851ecd3576e7cb015896c841c18454fe085910beee62a65e4841934ae711); /* requirePre */ 
c_0x419558c7(0xc3465ca0709aa02e006bf284cf336be75af259df9d4b2a08daae1fb78edbda9f); /* statement */ 
require(blockNumber < block.number, "Uni::getPriorDelegateKey: NYD");c_0x419558c7(0x8d96fc11d9ee811d7ae657782cd85d2a91ee5b3281b61fc4c09171f19137e636); /* requirePost */ 


c_0x419558c7(0x9191f9a15cc4aacb6752523b7c4d2047f06bf78fa3b2cfe46eede4cd36578f1b); /* line */ 
        c_0x419558c7(0x2404cec8d83b9ed2d8bdecb73d965e23c8e33310ca40c92abad643deedade8c4); /* statement */ 
uint32 nCheckpoints = numCheckpoints[memberAddr];
c_0x419558c7(0xa62aa5b2fd51e9bc16fa6fde5269699a0abc6119a1b98ad1f95d36aa13ee8d17); /* line */ 
        c_0x419558c7(0x369e3b4590fe3c5bdef11dff83d1ea20158f9b52e435635121898f27b82a3e42); /* statement */ 
if (nCheckpoints == 0) {c_0x419558c7(0x58b0c90ff7586f656632f8fd4f7aa58d1112879fea28baa138ad08fbc3a70090); /* branch */ 

c_0x419558c7(0x3731921a3861eec8a6ffb74fa4d53b102ae25fa1ad04a3e205612c0ae3d699e5); /* line */ 
            c_0x419558c7(0x210054e85d725f26ff97b92aa23b6a3a33f6f0cc274ce7adbd966b914f9c835b); /* statement */ 
return memberAddr;
        }else { c_0x419558c7(0xd05d3c7474fd58286333e08487d6645d3e46f9317bd84b90550e4d19ee879468); /* branch */ 
}

        // First check most recent balance
c_0x419558c7(0xafdc0291f56390fd9a944285fee378a4e3347e3715dba101fea5c9257cc99ef5); /* line */ 
        c_0x419558c7(0x8378dac2cb0feac3bb56768a5eac3ffedcc8652dad0e7b44fea52f0955f1269f); /* statement */ 
if (
            checkpoints[memberAddr][nCheckpoints - 1].fromBlock <= blockNumber
        ) {c_0x419558c7(0x7b1a9bbb7a8c03c96a30bf7d70c2d2477c2a1fa4fee8d26a4b42896708045e95); /* branch */ 

c_0x419558c7(0x9298af3f39d83f48cbc98207a004bc9d96603f8542e0909ae6640a561e6a9c5f); /* line */ 
            c_0x419558c7(0x61363124548f5ebcb8670966defd1316e7c11c1238f2038b26ec1bbda5c92111); /* statement */ 
return checkpoints[memberAddr][nCheckpoints - 1].delegateKey;
        }else { c_0x419558c7(0x70108340de84d2cda54afbf25773e4d10ee4edffde0b72b099f304c93dbb4125); /* branch */ 
}

        // Next check implicit zero balance
c_0x419558c7(0x6ace1d03dd3394ec440195194afee2cbaf17cb80f732a247dbfb283e7402cd19); /* line */ 
        c_0x419558c7(0x43ee5334448341c5d3aec01cce2034cc499787ca6b1fc34392eb17ccd4b429e3); /* statement */ 
if (checkpoints[memberAddr][0].fromBlock > blockNumber) {c_0x419558c7(0x28ff6edcf62c58d2e26c262606c911c11cf2655920d76ab7a362e5ae2f71bd04); /* branch */ 

c_0x419558c7(0x8d530fffcdeb570332d3087e2785689235188a583f420410004bd8ba482d4eca); /* line */ 
            c_0x419558c7(0x6d9ae36ebb69ee0c4a7c01007d0b6b1af4e1de500513d2f4b7cdb0b64cbf8f53); /* statement */ 
return memberAddr;
        }else { c_0x419558c7(0x7519f3f8fbd9c0a2207c08e950d661dbd0d9567d05a29c6d00aeb95910f9c265); /* branch */ 
}

c_0x419558c7(0x9bff4cf3a5483e6cf57e462227925e4f94c0037e6fcfc98255f0bbc9b4727f6d); /* line */ 
        c_0x419558c7(0xb7501cbc5b567da148a340b455f3dd7077035fc236dce96b9238ba9319771e2a); /* statement */ 
uint32 lower = 0;
c_0x419558c7(0xe7a0ae12017d4b2585b2e04a52b71bab4b93018736b8cf93e5d35277fab584a2); /* line */ 
        c_0x419558c7(0x43598acd1e3d5ae0f2919a4b023f50bddd5aaf01b5ba00c3af45c1fdec68b678); /* statement */ 
uint32 upper = nCheckpoints - 1;
c_0x419558c7(0xf4b03c15e7716ba5d2fafda40f05a8c812dad00ceafb4e1c90d990aae23aad7e); /* line */ 
        c_0x419558c7(0x9a5d3bf7d910f403730fc0a226a6e858f15f1e3523f66e3e771c5632292858ee); /* statement */ 
while (upper > lower) {
c_0x419558c7(0xe3c68cc2e769216c6e7d2979a466758a62bdf8e2aa39d9e496b81c46bed7f496); /* line */ 
            c_0x419558c7(0x05a9505c9786db2950e8b1803df67f7c56ce2b78b757db60c7acf3d477fa24e4); /* statement */ 
uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
c_0x419558c7(0x4787d2a2b6cc0f308274aadb2fe48743fd7b3061c2a578d13aab9595f8f4d883); /* line */ 
            c_0x419558c7(0x7294d8a0cb1c910226dd086c433ec84008d397491d753bd72d5501108c1c0235); /* statement */ 
DelegateCheckpoint memory cp = checkpoints[memberAddr][center];
c_0x419558c7(0xb0d48de3247714c9fa2aa7d1b9db4137677e38b7731254cd8cab44c25b04a78c); /* line */ 
            c_0x419558c7(0x805b586b22e57c4ff31292430c06d75d1267275f7fc7058cc360fa6d90cf9ce7); /* statement */ 
if (cp.fromBlock == blockNumber) {c_0x419558c7(0xbdf6af5b149b85064021c02930e0ce48fa6c8fa7db52480da472aad331771db4); /* branch */ 

c_0x419558c7(0x9f87bb6712aad2bcae3fb238fc72451c0cf7f35ed68d6d9fb5f573a82373c2ee); /* line */ 
                c_0x419558c7(0x0118f2edb741cf7c4e20c8d6f553952bffbd10a2a5e2078ca87adb542389ff6a); /* statement */ 
return cp.delegateKey;
            } else {c_0x419558c7(0xdbdd404f0377dd99efe83aa6e50fd193565c3535523e6e66f7aa2d598464c323); /* statement */ 
c_0x419558c7(0x5835c1d4ffbc61474fec069506b9c3b80a4d134898d23df5143c14631bacd752); /* branch */ 
if (cp.fromBlock < blockNumber) {c_0x419558c7(0x1147a9c0ad804e5bedb793c233d332984de42f1f40ce4ce0c495a981c27bc4c2); /* branch */ 

c_0x419558c7(0x566aa4533fa9d1ef9b1b372601abd9b345ed88384c859c350d9b8bad82bd1c1b); /* line */ 
                c_0x419558c7(0x51d2ffbf300c6d22f36dc4fd9823bcdc4a8b965412e80eedaf0824f23e1e6370); /* statement */ 
lower = center;
            } else {c_0x419558c7(0x134352d1ec7ab99c13effd9d44623bfb80f0f54af2e85780ae11360bb0e559fd); /* branch */ 

c_0x419558c7(0x42972e1c304f45704aa04d4f88b5abe6309b488caca1924a22d61c11a59e7881); /* line */ 
                c_0x419558c7(0xfdadced0e5b80b9038e92deed6f4d5eb4818379aa8a65c81bacf17f50a8f1819); /* statement */ 
upper = center - 1;
            }}
        }
c_0x419558c7(0x0e343f91d7c309c606a84c941e08a84088372e6b853b0dbb3a6e6d5179e2a193); /* line */ 
        c_0x419558c7(0x8360d5b43330a14581c65b86a839960b87a4a24eac0bbbbaf414dd199838a323); /* statement */ 
return checkpoints[memberAddr][lower].delegateKey;
    }

    /**
     * @notice Creates a new delegate checkpoint of a certain member
     * @param member The member whose delegate checkpoints will be added to
     * @param newDelegateKey The delegate key that will be written into the new checkpoint
     */
    function _createNewDelegateCheckpoint(
        address member,
        address newDelegateKey
    ) internal {c_0x419558c7(0x188f396ac391992e69117121acf485a953594f35500f4b94069f71c07653f2e0); /* function */ 

c_0x419558c7(0x8fc8aa61c848dc9e8429759f74b0e25e146cbb856f68c67d6653bfcfbaae55f3); /* line */ 
        c_0x419558c7(0x9ea95b0b178d8d8063784ddb87ebfd3967e6146d21bb827ff19e487fc990a11a); /* statement */ 
uint32 nCheckpoints = numCheckpoints[member];
        // The only condition that we should allow the deletegaKey upgrade
        // is when the block.number exactly matches the fromBlock value.
        // Anything different from that should generate a new checkpoint.
c_0x419558c7(0x9fabe62093e4895adf83365bb067fd5c6433f77321f9ff1074dcd1f19c69d5da); /* line */ 
        c_0x419558c7(0x83488c6f739b85fe81726c0a564093eb826ba393a39510bb1432529fcda8011a); /* statement */ 
if (
            //slither-disable-next-line incorrect-equality
            nCheckpoints > 0 &&
            checkpoints[member][nCheckpoints - 1].fromBlock == block.number
        ) {c_0x419558c7(0xf3179afd56757ffed151711e408dd170dd29506b0ed417cc6bb6316e08775b8f); /* branch */ 

c_0x419558c7(0xb98e37cb3e3dc14f98de8a296d93bdc1bc68b7bbdf0fc41411c7ccc0388b0e18); /* line */ 
            c_0x419558c7(0x870d7b8e4ca7dd99177ac07432e65cbb76dcae0d0dd9b6dca2c1e5b887dbff23); /* statement */ 
checkpoints[member][nCheckpoints - 1].delegateKey = newDelegateKey;
        } else {c_0x419558c7(0x31a2aa1ea972aee511facb781291b4e0c99465e236d0151172d39fd6e32f3ae2); /* branch */ 

c_0x419558c7(0x01c1f574ba4d01f259fe7414851d68ee96fcbe53000868afe27997e7422e8a51); /* line */ 
            c_0x419558c7(0x3daecb76f43fa808e75f7b5f26a49084c683bf27d9e8399e3104dfe694b7f2f7); /* statement */ 
checkpoints[member][nCheckpoints] = DelegateCheckpoint(
                uint96(block.number),
                newDelegateKey
            );
c_0x419558c7(0xe3c40f270bdd7d9a514737f75f848af495275c62c16a12b2eb36985094762791); /* line */ 
            c_0x419558c7(0x3b43c2013ef0916b1f2da34d729d394719fdf2ee513a7aca86d57e4f1d03ea93); /* statement */ 
numCheckpoints[member] = nCheckpoints + 1;
        }
    }
}
