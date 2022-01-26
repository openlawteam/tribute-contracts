pragma solidity ^0.8.0;
function c_0x1269e0c3(bytes32 c__0x1269e0c3) pure {}


// SPDX-License-Identifier: MIT
import "../../../core/DaoRegistry.sol";
import "../../../helpers/DaoHelper.sol";
import "../../../guards/AdapterGuard.sol";
import "../../IExtension.sol";
import "../../bank/Bank.sol";
import "./IERC20TransferStrategy.sol";
import "../../../guards/AdapterGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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

/**
 *
 * The ERC20Extension is a contract to give erc20 functionality
 * to the internal token units held by DAO members inside the DAO itself.
 */
contract ERC20Extension is AdapterGuard, IExtension, IERC20 {
function c_0x1d9fd123(bytes32 c__0x1d9fd123) public pure {}

    // The DAO address that this extension belongs to
    DaoRegistry public dao;

    // Internally tracks deployment under eip-1167 proxy pattern
    bool public initialized = false;

    // The token address managed by the DAO that tracks the internal transfers
    address public tokenAddress;

    // The name of the token managed by the DAO
    string public tokenName;

    // The symbol of the token managed by the DAO
    string public tokenSymbol;

    // The number of decimals of the token managed by the DAO
    uint8 public tokenDecimals;

    // Tracks all the token allowances: owner => spender => amount
    mapping(address => mapping(address => uint256)) private _allowances;

    /// @notice Clonable contract must have an empty constructor
    constructor() {c_0x1d9fd123(0xd8216ba465de8e68b555fa0169a5689a32ea3af4e88ff66ed48c87d9f7a87e0b); /* function */ 
}

    /**
     * @notice Initializes the extension with the DAO that it belongs to,
     * and checks if the parameters were set.
     * @param _dao The address of the DAO that owns the extension.
     * @param creator The owner of the DAO and Extension that is also a member of the DAO.
     */
    function initialize(DaoRegistry _dao, address creator) external override {c_0x1d9fd123(0x20ed59cf23008f092d2af2a02a7aa10347a21c8bcacb6af1a28da79b407eaea8); /* function */ 

c_0x1d9fd123(0x68a8788fbdd8eec712fd88351fbfb3cd3e6ba87e01901602125b991f197140c6); /* line */ 
        c_0x1d9fd123(0xb49d0e658ced2f2bdc9965976387f9fd818ac54a68d6007224988076ed9cd244); /* requirePre */ 
c_0x1d9fd123(0x36e892905dae31792e7c831ff52b96436abb47e2328d74f03d6457002685f5c2); /* statement */ 
require(!initialized, "already initialized");c_0x1d9fd123(0x1591503f07f75f7ca864cce077aeeb0b214329800712177c86d13b447c300886); /* requirePost */ 

c_0x1d9fd123(0xe3ea9be8cb847d86a1616c3dd50210b4ad90521de69c86c4a9f39dfb1ded7f2b); /* line */ 
        c_0x1d9fd123(0x13f95f2da349d1234ab09d9fe342ce1719c683bcb6f30eda98f6f8f7f8675078); /* requirePre */ 
c_0x1d9fd123(0x35b2eda97f22391dc91c47bdd109a9ac30437a404912ff3b79ac7b492ef8f28b); /* statement */ 
require(_dao.isMember(creator), "not a member");c_0x1d9fd123(0xdb50e151a98fe6bd21bffb3b7497e6914bed025cacb8e73d63485f6c1b7621c2); /* requirePost */ 

c_0x1d9fd123(0x55eec551203cf4c064c19ce8ebc4706df48559c5733e5016e67a424cea02f238); /* line */ 
        c_0x1d9fd123(0x42819660f1acca88e858993a324f290a30a3d477684d153a1bfb9cc8cd021a0b); /* requirePre */ 
c_0x1d9fd123(0x84e57196586f2e8a0903488e55d06f70a5034132a05d19126d22b8a3e8150638); /* statement */ 
require(tokenAddress != address(0x0), "missing token address");c_0x1d9fd123(0xfa49adb2bc22f4165fdd5664ca5ac7fd8734709677dbd97c199a6c2263412604); /* requirePost */ 

c_0x1d9fd123(0x86489b4f687ff08b315a5ffde7479eb4afaeaae24f841404e3e21361a2210540); /* line */ 
        c_0x1d9fd123(0x862a1106cbe231b7c68a35cc0a86028cfd974d0795734ab619db97e7454cc534); /* requirePre */ 
c_0x1d9fd123(0xf12ae7d80f402bb743c79ed17a850181cd264648fec35debb363ac2628b8efd6); /* statement */ 
require(bytes(tokenName).length != 0, "missing token name");c_0x1d9fd123(0xb83b803a0d3853883fb3c3a8a9a9805772d4aeb197ec352cc598eefba7adcd32); /* requirePost */ 

c_0x1d9fd123(0x2f0f87b4fb15a969c18399706bb0f19451840f5d4ad1fa7fd948c05cd0d2e815); /* line */ 
        c_0x1d9fd123(0xd9f851a12f3c7d17ac608b910cc756ed9fa79c948b618954e467e025d55f4183); /* requirePre */ 
c_0x1d9fd123(0x18fdea012934b61df47fc825952936ec39210d0a4fbc9b5c68d751a5471e2a8d); /* statement */ 
require(bytes(tokenSymbol).length != 0, "missing token symbol");c_0x1d9fd123(0xd4145245c926baf3e70155fb29ff2b3707fd76dbb7b6d3db6a1db41bddbeaa3d); /* requirePost */ 

c_0x1d9fd123(0x772f4c555c615e1cf666489f050eba5e803bdacd0c1f0bd2a728d1d2946f54fd); /* line */ 
        c_0x1d9fd123(0x74d479f98c0912e1c4ccd7289b5a123f68cacffb178952b9b5cb665a56e7913d); /* statement */ 
initialized = true;
c_0x1d9fd123(0x8ae9a888840a694cc8ee88c5b1af13eaabb96045ad379726bc18c6fe4b949394); /* line */ 
        c_0x1d9fd123(0xbc732c070f7f09d556a086c44be608541c8b6cfc2b77df3de7f7dad4ac20cfd4); /* statement */ 
dao = _dao;
    }

    /**
     * @dev Returns the token address managed by the DAO that tracks the
     * internal transfers.
     */
    function token() external view virtual returns (address) {c_0x1d9fd123(0xf675514278f44d7aaee0dad7201c229f2528bb759e66e8d838a530f937ad555c); /* function */ 

c_0x1d9fd123(0xcfae0c1f869cf33b87357cdb5e518cdd312464e5222542981cceeeee4403dc77); /* line */ 
        c_0x1d9fd123(0x1c3cf931a20c24990f460cb0968357c6a862e0baf1ba93cd64742a24ee142ec3); /* statement */ 
return tokenAddress;
    }

    /**
     * @dev Sets the token address if the extension is not initialized,
     * not reserved and not zero.
     */
    function setToken(address _tokenAddress) external {c_0x1d9fd123(0x6456766d4ba69a96355de47c5c66d272a7f060e07adadf89455980b1b567d1e6); /* function */ 

c_0x1d9fd123(0x64e1f8312660fe88098cbda0ad2d436c4c12b061183abda3cf848cfa6701993d); /* line */ 
        c_0x1d9fd123(0x4ebc6bc810b007abab53d5bab7c8854a499373b080ed3481537d176d50c16c4c); /* requirePre */ 
c_0x1d9fd123(0x5daa1a25e8b76d1b686d067a9b31362025b71611e11b61cf763ccbce1812a3bb); /* statement */ 
require(!initialized, "already initialized");c_0x1d9fd123(0x3ecc11ed808d1e96b7beff0e5877e7fda2798d4b00adb6ff592695803657a443); /* requirePost */ 

c_0x1d9fd123(0xd5a8cca9247d010000f563c246d5b437fb2f0dfc6e994d9893aee4649a605343); /* line */ 
        c_0x1d9fd123(0x376d6df27a543e9fa105cae83bed612ad2b383372a447e019f0b3a00022ffb0f); /* requirePre */ 
c_0x1d9fd123(0x825514971c2d84695a2cfe17c57efc60fbfe3302ff7e7daec76cb781279306e1); /* statement */ 
require(_tokenAddress != address(0x0), "invalid token address");c_0x1d9fd123(0xad7ec5cf7fb0cbfc2c90785aa877f20a665fa80c5036b01de4c9ca5d0373ebbd); /* requirePost */ 

c_0x1d9fd123(0x6cd860f44913cebf23da4176258028c3f32180de540ff50457dd9fb42f14a51e); /* line */ 
        c_0x1d9fd123(0x0216229e94e97174f1a098e90239bd178b7e8b82cd5c682eb187825c24fc58bc); /* requirePre */ 
c_0x1d9fd123(0x995c259f581ebc27db27fcf2ba579f54593741ab18546f3c9feb5ef09d3e480c); /* statement */ 
require(
            DaoHelper.isNotReservedAddress(_tokenAddress),
            "token address already in use"
        );c_0x1d9fd123(0x675e038660e21c9e884b94f4af688afb5efbcb1cc7acbe8d51afee425329d93b); /* requirePost */ 


c_0x1d9fd123(0x34964969fbae681bc4324607bb014d48282266b133c7cd76427e83534411bdce); /* line */ 
        c_0x1d9fd123(0x97bb723bff5ac63ab455c64450c91831beb4923ff49ea17f82b92d70d7605fad); /* statement */ 
tokenAddress = _tokenAddress;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() external view virtual returns (string memory) {c_0x1d9fd123(0x9cd44f39c8fb10cccc19141ff1856d2f357936803fa8187b630186df4078c78f); /* function */ 

c_0x1d9fd123(0x4341677f40dd6a2906c4bfa2b42c4d8b9e4ef2038ffeffa189f2f8d37ca68120); /* line */ 
        c_0x1d9fd123(0x3ea79b968ce88ff2f39e606ae1aae2f5fdc73a5eff540f2dd2034fc9338cb046); /* statement */ 
return tokenName;
    }

    /**
     * @dev Sets the name of the token if the extension is not initialized.
     */
    function setName(string memory _name) external {c_0x1d9fd123(0x6cfed1d84815a63a913429594b3a3f080e003d4e03da56860ba08e34f61251b2); /* function */ 

c_0x1d9fd123(0x3676d66465f0d954934614d9571a52d05c02812b02885f091cfaebde9ee9ee5c); /* line */ 
        c_0x1d9fd123(0x46b416e249ab9f80fc35ccc9d8ee2daedbcd29f269d508087ebf6d70b24eb13f); /* requirePre */ 
c_0x1d9fd123(0x1f6657685ab6efb436c4a989546044b49d97296fc105e735d7dc59940b817da5); /* statement */ 
require(!initialized, "already initialized");c_0x1d9fd123(0xa767c4c35cb5417bdf9fa1cf0a3d9666122812086c82bbf96cc1e4a556405ac7); /* requirePost */ 

c_0x1d9fd123(0x1e9252e28611715eb88dea3150ae9e562d1c3294eaeb7e626511bd7f02f1512b); /* line */ 
        c_0x1d9fd123(0xd8ee1fb030daf8029b043ca2972a89300fde25c13d453579af77a85d1fc97b8d); /* statement */ 
tokenName = _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() external view virtual returns (string memory) {c_0x1d9fd123(0x35d0e0623cbbe957a06617390e55b8c933f91e371def8db7031708cf0e47fd55); /* function */ 

c_0x1d9fd123(0x38b9db6d41591ef10f740bb63b67b2811431c5f8b5cf8f69517d6ffba86d0b3a); /* line */ 
        c_0x1d9fd123(0x21ea917a2e7a729866816cfef553f6b95b8c59334bacf7eb93e609c8a1826b75); /* statement */ 
return tokenSymbol;
    }

    /**
     * @dev Sets the token symbol if the extension is not initialized.
     */
    function setSymbol(string memory _symbol) external {c_0x1d9fd123(0xed8724750dfbaaa7ffa7d0f630f53b950dc64d74d6a61eaa3db29b4d092f1e31); /* function */ 

c_0x1d9fd123(0x0c71724880abab3d79478fe329f09186cacd44a00d5fd384462218f19e80b28e); /* line */ 
        c_0x1d9fd123(0x49855937962af61fbc6641b2d1b1a4b264b39b4ae20011e3c8aacbc1adb90591); /* requirePre */ 
c_0x1d9fd123(0xdaa2ac24bfb9769626bbbb1d4fd83e53eb5c977a425e194466cb114cd896890c); /* statement */ 
require(!initialized, "already initialized");c_0x1d9fd123(0xeb18025f8b15ac664fcd61f9269a11774029a4be62489fcc142accb0673a9f96); /* requirePost */ 

c_0x1d9fd123(0xd27844250ba3035734646d50e121fde8ae348467455f64f84a04cb0157b4f36c); /* line */ 
        c_0x1d9fd123(0x80c9e961c5ea86c909bb2c54703e1333719864f2e0fbabbf90a1f0716c464eca); /* statement */ 
tokenSymbol = _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     */
    function decimals() external view virtual returns (uint8) {c_0x1d9fd123(0xcdc6db08b75f31c24065bcf0572c16ad6e5ad21005c37813d6014595ffe3f514); /* function */ 

c_0x1d9fd123(0x79f16854babcd68c4732987a8452c46d67f8c84518bdb41bac74f58502faca89); /* line */ 
        c_0x1d9fd123(0x5bacb5e7afa49591cef8463d3600ffda8c3b9c4cfa934797d4f23e918ec64c92); /* statement */ 
return tokenDecimals;
    }

    /**
     * @dev Sets the token decimals if the extension is not initialized.
     */
    function setDecimals(uint8 _decimals) external {c_0x1d9fd123(0xe26472e9ee38077043fc688ea2836447514dd911ca0e1a2164ac0e568175e1ec); /* function */ 

c_0x1d9fd123(0x55791da74da499dfd279af4626e45f3062618b770253e11e6a4bc557f0d45c31); /* line */ 
        c_0x1d9fd123(0xc6ae8f32dce2398e9836967c0bddef67d11f4b6eb1c5c60be7226dc41d2f301a); /* requirePre */ 
c_0x1d9fd123(0x6c7e566a93a23e1701211547c741a9d6a8a9ec644ce5e8f54747adb4244d17e2); /* statement */ 
require(!initialized, "already initialized");c_0x1d9fd123(0xbdccc616e22dd7a21c5dd3cc8015a4cd2fc8a5a4ddb8db652f7bdd6e2927cab5); /* requirePost */ 

c_0x1d9fd123(0x9a9f11b4f1c81a123229498aa433b8ec9b01c574c9535c89b9d50c82200c5031); /* line */ 
        c_0x1d9fd123(0xdc7c9f6cd118a6f936c1d67698f81bb2689f48c6566aee88034fa3d2f25c58e5); /* statement */ 
tokenDecimals = _decimals;
    }

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() public view override returns (uint256) {c_0x1d9fd123(0xfb0a641a6cab9af09adba5d21cc8a4bf8f1f291056adb04e73512623f3cd6d07); /* function */ 

c_0x1d9fd123(0xd9713866cae620042b171dfa2f1c86983331302e9436383353dd43fa842f2740); /* line */ 
        c_0x1d9fd123(0x393e692b4d99c7d06c6c52cae7f8ba138c4dc76788d3ad4b106287450edd40fe); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0x1d9fd123(0x6e4bc31c97cc9107efa82d084baa83d267d629b3ab75b7d5a6eae6f0b1420f1c); /* line */ 
        c_0x1d9fd123(0x4916a134a27b6ce3001168908ea17f4de60297c0a34dafbe7cffbc85139da831); /* statement */ 
return bank.balanceOf(DaoHelper.TOTAL, tokenAddress);
    }

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) public view override returns (uint256) {c_0x1d9fd123(0x7bc63e6496243319dcaeb465df0b14bcfc99adbdae91d638cbea18c25f316958); /* function */ 

c_0x1d9fd123(0x9d09386cb34639be164bedf235d6e4018d7b4fc96ee7ae7c5d529fe0e13882aa); /* line */ 
        c_0x1d9fd123(0xa04cdaaf78e712940d432b20cff3aa2d7d20b1504be0ce0025f63e1de706c00b); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0x1d9fd123(0x28891803852602f792647358fc445bfd036f95f42c0d7cda9cd83c8cefbc77fd); /* line */ 
        c_0x1d9fd123(0xf1b37a08bed7f3698374f9dd1fb32faa70c35fb74cd7a874dad931556210e9d8); /* statement */ 
return bank.balanceOf(account, tokenAddress);
    }

    /**
     * @dev Returns the amount of tokens owned by `account` considering the snapshot.
     */
    function getPriorAmount(address account, uint256 snapshot)
        external
        view
        returns (uint256)
    {c_0x1d9fd123(0xf34bcd9742e8e73284c97d160e516805c01801157e2e14324f17d0a94f95bfa3); /* function */ 

c_0x1d9fd123(0x391458b380b69566e67c985801560ccc948f103d188fb775f9c2f5623603563e); /* line */ 
        c_0x1d9fd123(0xa91bb0283a8f2217ef0cb28fe1f45a0cace4e13d149bd9cdd68c8aedb2fd1f2c); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0x1d9fd123(0x93e8c4bf12a6ba7cd8ef3b63133319a290c10ab821e9c932a853156591a57650); /* line */ 
        c_0x1d9fd123(0xa6ad42f311365d06b41c21dfc5db75bd1fc8093f3e4251305e545bb7f55b6ad5); /* statement */ 
return bank.getPriorAmount(account, tokenAddress, snapshot);
    }

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender)
        public
        view
        override
        returns (uint256)
    {c_0x1d9fd123(0x73bebb372b302cd1576764e14fc511750f2fec607a0d4d2a8d8543a4fa893eec); /* function */ 

c_0x1d9fd123(0xebf04e516d63ae8598552d3203be521d319ae6706b12bafadcb122e4b308cf6e); /* line */ 
        c_0x1d9fd123(0xa75ef41896ff81422b2fd110ce3b20ad61d288398f00d647a543d9b0a7cff221); /* statement */ 
return _allowances[owner][spender];
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     * @param spender The address account that will have the units decremented.
     * @param amount The amount to decrement from the spender account.
     * @return a boolean value indicating whether the operation succeeded.
     *
     * Emits an {Approval} event.
     */
    // slither-disable-next-line reentrancy-benign
    function approve(address spender, uint256 amount)
        public
        override
        reentrancyGuard(dao)
        returns (bool)
    {c_0x1d9fd123(0xffd65b43178dbce436da647219675ba60588b773f46ed5c23d3f6ee10fe8d248); /* function */ 

c_0x1d9fd123(0x85217977b977d163b6c58376dd52e53e026bb4b0cc9b232aa866828d0006ef83); /* line */ 
        c_0x1d9fd123(0x2d0651d00fe9fc85561fa79863de228cf92e59335e09ef2076d03247594ac803); /* statement */ 
address senderAddr = dao.getAddressIfDelegated(msg.sender);
c_0x1d9fd123(0x542204c30b97e8520ddd41cb62a6fec0b18fecb067be4206811ce55e4902cc8b); /* line */ 
        c_0x1d9fd123(0x689703c3185b5ca17b43431d782a9fec37f0ffe73de51eda5eea73d42d97ef86); /* requirePre */ 
c_0x1d9fd123(0xdc33f182f7e204a2cc19c7f6ea6f1369da0f973b62b50c14ba41701896bc993f); /* statement */ 
require(
            DaoHelper.isNotZeroAddress(senderAddr),
            "ERC20: approve from the zero address"
        );c_0x1d9fd123(0x835401546b811de72616dbacf3a016b127a4076e18f7185e7ccada93f3ed1f35); /* requirePost */ 

c_0x1d9fd123(0x8f2a183c994b34dffaa3cbd00906709dc0d06c203905edf885fb682a5f3a01be); /* line */ 
        c_0x1d9fd123(0xeb5d6b721def3fff2dddee74891061fa11f56091450d2d925ee371073e6d7a0d); /* requirePre */ 
c_0x1d9fd123(0x8b1c89ddb2419b0e2dc2f3ba1c0fa31280d9570264deaf4cf045c5fe40b36695); /* statement */ 
require(
            DaoHelper.isNotZeroAddress(spender),
            "ERC20: approve to the zero address"
        );c_0x1d9fd123(0x8bb22be5e0ecb0464aa0cb6d4635191b097b3d90769d1b858375a50cd52958e4); /* requirePost */ 

c_0x1d9fd123(0x0708694a73b9d6892afa09233c897d160c7f046fb5c5923f74474c86011bc2d3); /* line */ 
        c_0x1d9fd123(0x3e2fb28a915e86b5a3a72a31f21a0edeecbb42f2867288134579e60d5a62b60f); /* requirePre */ 
c_0x1d9fd123(0x68ee72851c72ad44cc0996a91fde7078bd0b89eead811357d750c3a428ca2d0d); /* statement */ 
require(dao.isMember(senderAddr), "sender is not a member");c_0x1d9fd123(0x266a0ebab95ddc6a5c754091de5189ee59028d7556075834d8d49788c751c1b8); /* requirePost */ 

c_0x1d9fd123(0x4be9a25a75f1e3d0cfdbf2f845b197405c4403b4c6035b935da5022a0d53f881); /* line */ 
        c_0x1d9fd123(0x902efd3d292a27b1fe5b5793449cf43232fd677adaee7975e2060a8f73cf5cc3); /* requirePre */ 
c_0x1d9fd123(0x196c10848c9ec999719a29a2a47863d78c4eba0eed9331b45281d523d0a236b4); /* statement */ 
require(
            DaoHelper.isNotReservedAddress(spender),
            "spender can not be a reserved address"
        );c_0x1d9fd123(0x234f8f3860e6e9a0064b72fe3c12deac1e9b726655604fba3227e82c587ff37e); /* requirePost */ 


c_0x1d9fd123(0x9bfa386df36006fba37a259bbc09f4ba8b87382c82272ad498bb315957c4d0e7); /* line */ 
        c_0x1d9fd123(0xbfe82d1fb40d5efe81f60452394a9e6b12ee39ac52a6fd49ea817e8feb679fc2); /* statement */ 
_allowances[senderAddr][spender] = amount;
        // slither-disable-next-line reentrancy-events
c_0x1d9fd123(0x4fd7e9e0f5624379dc5b53c66ad0ad027738ba0d74202d51a01d0929afc3dc1e); /* line */ 
        c_0x1d9fd123(0x2c672bc4c6d4d6135e568d5d88df6a386ec12b2b04e60d2a7269a57e434cf88b); /* statement */ 
emit Approval(senderAddr, spender, amount);
c_0x1d9fd123(0x2df15d5d91d7213d9e06a9b1d147abed6fd2f80590e740f8e036e6fd7cf7d19b); /* line */ 
        c_0x1d9fd123(0xa975f3334276c42f8153e74bf11fd5109ddaeaac13b4aa5a3056705d534548b9); /* statement */ 
return true;
    }

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     * @dev The transfer operation follows the DAO configuration specified
     * by the ERC20_EXT_TRANSFER_TYPE property.
     * @param recipient The address account that will have the units incremented.
     * @param amount The amount to increment in the recipient account.
     * @return a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount)
        public
        override
        returns (bool)
    {c_0x1d9fd123(0x5fc57608ef41ae7e81dddd6b9bfaba109504d0ef0e911c619f5e882cc295172c); /* function */ 

c_0x1d9fd123(0x82441e769da1592129c97d14756b840476ecf87953ed13530d70df3add593697); /* line */ 
        c_0x1d9fd123(0xd47beec4da54949ea81f8bb80f8d1588acc07d22c3a44a9c327435ebc9839d2b); /* statement */ 
return
            transferFrom(
                dao.getAddressIfDelegated(msg.sender),
                recipient,
                amount
            );
    }

    function _transferInternal(
        address senderAddr,
        address recipient,
        uint256 amount,
        BankExtension bank
    ) internal {c_0x1d9fd123(0xc4ee0e0382465272b2663602304df2e2707cc126bcfc61bbe88cc6c4af080a07); /* function */ 

c_0x1d9fd123(0xfafaca9815c65091069c83dd05f467ba0752cac62560ab6cd03882806174c356); /* line */ 
        c_0x1d9fd123(0xe39e483d9e1d7b5d7f3da4f579ca764e6d37bea76054c33df51cd9e3dd94bebd); /* statement */ 
DaoHelper.potentialNewMember(recipient, dao, bank);
c_0x1d9fd123(0x9b63011e850ac89e22bbb553ee7460603d9030a781e7e0da9de7764114843dc7); /* line */ 
        c_0x1d9fd123(0x54cb0858a0b99525c13b21a34becd476527c5092fd9278ed03ab7339cbf87e43); /* statement */ 
bank.internalTransfer(dao, senderAddr, recipient, tokenAddress, amount);
    }

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     * @dev The transfer operation follows the DAO configuration specified
     * by the ERC20_EXT_TRANSFER_TYPE property.
     * @param sender The address account that will have the units decremented.
     * @param recipient The address account that will have the units incremented.
     * @param amount The amount to decrement from the sender account.
     * @return a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {c_0x1d9fd123(0x40eb2069d3e8dc130a7d4d12b0c78c63fae402d851fc35b790df3e2c2ba9568b); /* function */ 

c_0x1d9fd123(0x74cc1706423508d514a6cfcb566720168621fd0267e4661ca02b6a44f8ed40b3); /* line */ 
        c_0x1d9fd123(0xcf78c6184d31a794ffb0c6759239be408cdf678458fb62a86b38ad5964bac0e2); /* requirePre */ 
c_0x1d9fd123(0x0e631ef0cb6df1a3bcad3f63200f47fb41a32ac6d5a26be2e71cb92d973b4bde); /* statement */ 
require(
            DaoHelper.isNotZeroAddress(recipient),
            "ERC20: transfer to the zero address"
        );c_0x1d9fd123(0xa3793b7d4d7a07600cacf43ed4b882b7ef42827c9adab0f8bd229e4764a17e13); /* requirePost */ 


c_0x1d9fd123(0x4fab56044860fd7fb6e97b25eb3d82e66ae1803a29d4438074f40b240f24d102); /* line */ 
        c_0x1d9fd123(0xcf3b3ca7e9cb9270988de3a004dcc6a5476ab401f55149b3ee449db757fd1c86); /* statement */ 
IERC20TransferStrategy strategy = IERC20TransferStrategy(
            dao.getAdapterAddress(DaoHelper.TRANSFER_STRATEGY)
        );
c_0x1d9fd123(0x69252289c92635bddea44e1ab4c2ee4d46ae0d63e129ffcff46c76a07c98c69b); /* line */ 
        c_0x1d9fd123(0x79269cf34ad0693b83ea114cc817c015175ed0e9572614e3c3c0a900d503377e); /* statement */ 
(
            IERC20TransferStrategy.ApprovalType approvalType,
            uint256 allowedAmount
        ) = strategy.evaluateTransfer(
                dao,
                tokenAddress,
                sender,
                recipient,
                amount,
                msg.sender
            );

c_0x1d9fd123(0x18cd642df2d4baba9e2abd79669a2aa8d10e575b34e7392e8b18b276d49c897d); /* line */ 
        c_0x1d9fd123(0xd66abd90cadb9080250d0e993c54de28408cf20a72bbff2181695bb9f0230c7e); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );

c_0x1d9fd123(0x7dee43f94612afb2d56f0aad5b02efa4e9e6265fe2b9b48e3537e74d977defe4); /* line */ 
        c_0x1d9fd123(0xe8f6afdd72d7adf7d78edb0c7e404d3521891c19e0814f671c4c7f8290ec1002); /* statement */ 
if (approvalType == IERC20TransferStrategy.ApprovalType.NONE) {c_0x1d9fd123(0x2a839e3b6620710ab43a433d07283374e0976a851334a7d3eb3d58c28e36f3a8); /* branch */ 

c_0x1d9fd123(0x05abf539629b0bc0cc63ae4a337152e8eb7cf4ba4c8fe408bb40257e0bb6f03c); /* line */ 
            c_0x1d9fd123(0x0f620cf4d0ba51c30e7cc2c613526c62039fda34e89c996c1ea30a511e53aab9); /* statement */ 
revert("transfer not allowed");
        }else { c_0x1d9fd123(0x84c638ce4649b6b372e9c75a5d5efdfc0b711b35dc3c0bbdf60d1242cdf4c8a5); /* branch */ 
}

c_0x1d9fd123(0xf2ee3c261c55dcb77d734eb69deb612b3e247e1c26aeaaced4d6a77cba441a99); /* line */ 
        c_0x1d9fd123(0xce4664b51446fd3e56b441b1255d7678ad8ea41eb8198a66d27dd2b1fcb79276); /* statement */ 
if (approvalType == IERC20TransferStrategy.ApprovalType.SPECIAL) {c_0x1d9fd123(0x084b2e525ebd686983a115cc6f30053909051765ff3d82151db4a9059897fca1); /* branch */ 

c_0x1d9fd123(0xc06ff791f795b2c6a57289431134e29cbf5d58feafd03839fbcb2b38a2dadf94); /* line */ 
            c_0x1d9fd123(0x0cd07b8cf39bd1971ba015541f0e330115b4a87281bab7f7c4d3358e1fe7076d); /* statement */ 
_transferInternal(sender, recipient, amount, bank);
            //slither-disable-next-line reentrancy-events
c_0x1d9fd123(0xb965a129a3f7292ad62266a79935a3df1453f6c6290793a38ecf1b42de7f87e7); /* line */ 
            c_0x1d9fd123(0x9ded26fe33e8cc949d22249a0314832ed8fa3d3e8f40e3f3bc1ff37f462e7a94); /* statement */ 
emit Transfer(sender, recipient, amount);
c_0x1d9fd123(0xd6417e0cb5ffc963305136fdc2163d51134e0097d563156b080a4911e2bdcbe1); /* line */ 
            c_0x1d9fd123(0xf76a49bc010a03c8300934e22d4c02afcccea1ef4b3a1e4aac690e2488aaa28c); /* statement */ 
return true;
        }else { c_0x1d9fd123(0x679e4d61cbd3e6945490eb6ad2dafafc39bbcb810360e7afbe008846ada6b4ec); /* branch */ 
}

c_0x1d9fd123(0x32020b94d81091f86ceba90d71bc20b002612d0ae20c8bade75b8c662b878e58); /* line */ 
        c_0x1d9fd123(0x59f260015457abf93ecf48a1416e1da3560fbf2c99881c886214fa27e17f906e); /* statement */ 
if (sender != msg.sender) {c_0x1d9fd123(0x0813b50ebfa9098ef7b7430f1c3dbd83a7c0aed1dcf18c713d56b454a7678570); /* branch */ 

c_0x1d9fd123(0xdcf31fab1ecfe817b9743ba654b2a48f7f3b95938a26f9be41923a108cde7ddd); /* line */ 
            c_0x1d9fd123(0xbb072c8ba35c3f0fdea0d1a5b8e153a4666d39cd54a00bc9a64ac9d8cb85ea16); /* statement */ 
uint256 currentAllowance = _allowances[sender][msg.sender];
            //check if sender has approved msg.sender to spend amount
c_0x1d9fd123(0x5ae447e30c017fdea0c7ec43a6bef5f1070f652236e3169355e4e651890a610e); /* line */ 
            c_0x1d9fd123(0xd35a34544d1078462afbdafe63f9b033abc8a8ec72b080ead2744ccb8457614b); /* requirePre */ 
c_0x1d9fd123(0x55c4e1a0c70beeff8b5c73d9b332dd505f6b01dbf78f42cbd758792c5216e323); /* statement */ 
require(
                currentAllowance >= amount,
                "ERC20: transfer amount exceeds allowance"
            );c_0x1d9fd123(0xf0dc89c7c9e1388b287457b4134694297e70a2971c5c7bde2d087d7b7669bb8f); /* requirePost */ 


c_0x1d9fd123(0x937cc5cb24ba5102dd48622b2c2f30ee0e15e84a24adf890ee111a8f99f817de); /* line */ 
            c_0x1d9fd123(0x8bd7eeb6612810da3ab13c6d701a832b3fc4504f636a5cfe24cd61c68cc40341); /* statement */ 
if (allowedAmount >= amount) {c_0x1d9fd123(0x63c26a832a48db36e62dd927b642cd8301eb7c36580fba10ab8b6c76b14566da); /* branch */ 

c_0x1d9fd123(0x41d9f1f0608397d9918c778257fd58ca62f0b8a8bc16ccc809f3daec74867b66); /* line */ 
                c_0x1d9fd123(0x413c8d60311ae660ee3dd01c4f1215c38e124743975850ace76997eafb7b4f01); /* statement */ 
_allowances[sender][msg.sender] = currentAllowance - amount;
            }else { c_0x1d9fd123(0x7ba607c8893e5f4924587c028fc34c281c58d46f9e31648be82419768656af1e); /* branch */ 
}
        }else { c_0x1d9fd123(0x8b9ae9273eea6fc19179100aef309e925bf9426b526cd829655eba8a9c856c62); /* branch */ 
}

c_0x1d9fd123(0xd10338e6c3b0cbd3fc56b31d2cf7ab2d9c6349f0a630cbacbb52cda97f6a0994); /* line */ 
        c_0x1d9fd123(0x023f33a3e16e85c80b1577aecea59c13cea841822e77014691f1912aa6c07fb5); /* statement */ 
if (allowedAmount >= amount) {c_0x1d9fd123(0xecc6a91ad4a9cd38fe2a8a0f75f2c39c7daabef54ed39cd98bda6c56e87eeb4e); /* branch */ 

c_0x1d9fd123(0x7acb334774be59c6271f7b5c0cef7a3dce191e86e6ce6f78d725e27ca48b9f8e); /* line */ 
            c_0x1d9fd123(0xb90072b0d3058b000a31469e03f6ee84854b9bcf1bd1cc77c83554e730dc4c90); /* statement */ 
_transferInternal(sender, recipient, amount, bank);
            //slither-disable-next-line reentrancy-events
c_0x1d9fd123(0x1379c7f999d4b16395342bad9001c3103cca98e2b8de0822fdec620c65afc114); /* line */ 
            c_0x1d9fd123(0x388dab487981d800d54d80692e87e424c777cbdc91a4cb57c117ce63ce435696); /* statement */ 
emit Transfer(sender, recipient, amount);
c_0x1d9fd123(0xbf290147fcbbf901245352ed41201fc52627ef8c5a2f99d5478253350538000a); /* line */ 
            c_0x1d9fd123(0x6ed28af334684c1b79f975c7f05aec940654b8fc4b79f79846297cadf3e1abd2); /* statement */ 
return true;
        }else { c_0x1d9fd123(0x948e66799982784c42984c8ff335ed3182d196b955fba2a6d7da616509e6f691); /* branch */ 
}

c_0x1d9fd123(0x05be10360b551d0d704f0b67b887d1dcd65026d55801f5f8369bffbc64dad508); /* line */ 
        c_0x1d9fd123(0x6d610ebdb4512372b1d02339f061ca10ee81f3483e327e3b1fc3a05f2b933348); /* statement */ 
return false;
    }
}
