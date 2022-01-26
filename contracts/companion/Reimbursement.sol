pragma solidity ^0.8.0;
function c_0xed3cbbab(bytes32 c__0xed3cbbab) pure {}


// SPDX-License-Identifier: MIT

import "./interfaces/IReimbursement.sol";
import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/AdapterGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../helpers/DaoHelper.sol";
import "./GelatoRelay.sol";

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

contract ReimbursementContract is IReimbursement, AdapterGuard, GelatoRelay {
function c_0xea85b50e(bytes32 c__0xea85b50e) public pure {}

    using Address for address payable;
    using SafeERC20 for IERC20;

    struct ReimbursementData {
        uint256 ethUsed;
        uint256 rateLimitStart;
    }

    constructor(address payable _gelato) GelatoRelay(_gelato) {c_0xea85b50e(0x01adfff2304aa8088d1996f7b9c362b11876523038893e66c1feca6926ae0311); /* function */ 
}

    mapping(address => ReimbursementData) private _data;

    bytes32 internal constant GasPriceLimit =
        keccak256("reimbursement.gasPriceLimit");
    bytes32 internal constant SpendLimitPeriod =
        keccak256("reimbursement.spendLimitPeriod");
    bytes32 internal constant SpendLimitEth =
        keccak256("reimbursement.spendLimitEth");
    bytes32 internal constant EthUsed = keccak256("reimbursement.ethUsed");
    bytes32 internal constant RateLimitStart =
        keccak256("reimbursement.rateLimitStart");

    /**
     * @param dao the dao to configure
     * @param gasPriceLimit the max gas price allowed for reimbursement. This is used to avoid someone draining the DAO by putting crazy gas price
     * @param spendLimitPeriod how many seconds constitute a period (a way to define a period as 1 day, 1 week, 1 hour etc ...)
     * @param spendLimitEth how much ETH is reimbursable during the payment period
     **/
    function configureDao(
        DaoRegistry dao,
        uint256 gasPriceLimit,
        uint256 spendLimitPeriod,
        uint256 spendLimitEth
    ) external onlyAdapter(dao) {c_0xea85b50e(0x7ba93dfd6636fd21aea395170e123ee49d47cc3d1a2312fa7817676e35a21859); /* function */ 

c_0xea85b50e(0x73694eb8f0ace21de0a7d959f61b143490a5b587ecc53afe1796ce75377954a2); /* line */ 
        c_0xea85b50e(0x29d84e17cc287e6aef61aa3316567188eb391252b38ce7aec51ef38b09761286); /* requirePre */ 
c_0xea85b50e(0xd45034dc477f9c07f8bcb7a07fe2cac53ca09d6e14f5909be9f91f0234e44611); /* statement */ 
require(gasPriceLimit > 0, "gasPriceLimit::invalid");c_0xea85b50e(0x9d62562b02d01475b18dbee333d06d865d5fb4fc4559166ac08687d965b21221); /* requirePost */ 

c_0xea85b50e(0x15c308616440ea99da3c2395c7bc90aeab8cc36c23a6ab7dfcd51af268d1955a); /* line */ 
        c_0xea85b50e(0x857edc404a68c561ce59bd314cbfa288130732f5fea4cb57af3eba4c83226ca0); /* requirePre */ 
c_0xea85b50e(0x8f08238683b7e9629b6204d9892b375d138f529d4b08316f0ab8a929ddaa23ba); /* statement */ 
require(spendLimitPeriod > 0, "spendLimitPeriod::invalid");c_0xea85b50e(0x4fe3d4258dd01a81ee3490a1eb69cacce850974d4d111f3989524fca03797747); /* requirePost */ 

c_0xea85b50e(0x66da11864cf7f55d84ab43ab786e8238a10add750a46ec1b7b7c883abf30239d); /* line */ 
        c_0xea85b50e(0xa544c3416b2b8d17abb04385c837f3c7df23fb527b975aed3735471f4194ec11); /* requirePre */ 
c_0xea85b50e(0x8f81fcc994c0ddcd90f9389a00a133feb07c22398a242a1359bef70307171632); /* statement */ 
require(spendLimitEth > 0, "spendLimitEth::invalid");c_0xea85b50e(0xd9c364737cb147dc740d7e1dc3a2ff2b9e20d5dc73940b8869f54f0419b49da4); /* requirePost */ 


c_0xea85b50e(0xf1080b08b29466980b290e33614f26f2855d8f0cf2166921bd4d4cf12b0d56d6); /* line */ 
        c_0xea85b50e(0xa0292d3ecc3a8e2900a4801cf845b1031314c657f77fa42f256c94b5a01dff1c); /* statement */ 
dao.setConfiguration(GasPriceLimit, gasPriceLimit);
c_0xea85b50e(0x8c5d89fbae24e49610c15d779834fab435b6c78b0522acda125930bc9cd36498); /* line */ 
        c_0xea85b50e(0xeeef5619c43bd6892da95b372a1d490574b6b21e1a503eaecacc06960f646f63); /* statement */ 
dao.setConfiguration(SpendLimitPeriod, spendLimitPeriod);
c_0xea85b50e(0x55239e43674ddac14d7c87d3c6cacf512249a4aba8ae10394ceda4addbdba9ba); /* line */ 
        c_0xea85b50e(0x22c100086011a3824bd4533f7cfa916e5a4240b711c862eefca372f3e76b4c44); /* statement */ 
dao.setConfiguration(SpendLimitEth, spendLimitEth);
    }

    /**
     * @notice returns whether the current transaction should be reimbursed or not. It returns the spendLimitPeriod to avoid someone updating it during the execution.
     * @param dao the dao that should reimburse
     * @param gasLeft the maximum gas usable in this transaction
     */
    function shouldReimburse(DaoRegistry dao, uint256 gasLeft)
        external
        view
        override
        returns (bool, uint256)
    {c_0xea85b50e(0x1eb3576656ceb5ad726249046663c6c92ab7472365177e15c1f28c48008f71de); /* function */ 

        //if it is a gelato call, do nothing as it will be handled somewhere else
c_0xea85b50e(0x9fc857dde0411370c1c45c6e90868fc6a63e6cdc6a4b1076fb5639ee1f11a651); /* line */ 
        c_0xea85b50e(0xf3889b47a18d64846e0ed2991d967e2247f0613d44312f0c6855c93be3f7fe54); /* statement */ 
if (msg.sender == address(this)) {c_0xea85b50e(0xbb3f0759f17875a57ea0149cda3e84104140f527fee712727f64ecd12ea2e160); /* branch */ 

c_0xea85b50e(0x3ae801a4cc497e852e4661b4657b5a7c67c8dbe0517e801a13ab24772e049987); /* line */ 
            c_0xea85b50e(0xf83d05630ac7ab7a7a3eb2d0d2da98aa81c5052597aaaae16fff57ab6b4a0dee); /* statement */ 
return (false, 0);
        }else { c_0xea85b50e(0x01ff382c42bcd67c11569b732c12d9a285d247ec9bba584b458f64fe9e88e935); /* branch */ 
}

c_0xea85b50e(0x525df2b510f7a7c281a3d38d4969ec4f6ce3e62ea8538581c29c0d975070f0c9); /* line */ 
        c_0xea85b50e(0xf04f0f4fbf208c3488be2ca7a103d0b9eb662b13193190d25edc3c9412f022ec); /* statement */ 
uint256 gasPriceLimit = dao.getConfiguration(GasPriceLimit);

c_0xea85b50e(0x27ef90319cdff23abb3e3e3b08180db2f50db4c20afdb812b9ebd6386d239367); /* line */ 
        c_0xea85b50e(0x897d5cabbcf9ac0dc1cd7b085d9a578b7f76c4a4b3c43c8ae3f847de779cbd91); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );

c_0xea85b50e(0x8ff481c5f5cdea7bcb8b00485a11b55ab0f0de5d6b0dd8db0dd0e7108b62c2bb); /* line */ 
        c_0xea85b50e(0x79b376dc10024d8cc8c358a84cce33ce7559b8b6cd5658ad9fd681ae40f435e4); /* statement */ 
if (gasPriceLimit < tx.gasprice) {c_0xea85b50e(0x188062f2cf2334b0e27063826406e7a88ec592a1dbc7fc4b9b443bca6d47ff15); /* branch */ 

c_0xea85b50e(0x823a097681183ddf5180f44cf2cce08476af36ad6c48fe256cb5cb34efe40f8e); /* line */ 
            c_0xea85b50e(0xec75f75faddb81a40cba36229e357519e8c24c96c2fbdd500c66f4fc4a361461); /* statement */ 
return (false, 0);
        }else { c_0xea85b50e(0x988f60573b2e0cc3aba6492a6dec692ead2a79e0f61488db096d64ce520bc8da); /* branch */ 
}

c_0xea85b50e(0xc1a3ee30c32411eabe71dce6dc38bb2994be2ed4616b4a8749021e8ea100466f); /* line */ 
        c_0xea85b50e(0x82552eabacea545ffae8cc5f9094ffb79d8a11ec269b3253d7634adc775db3ac); /* statement */ 
if (bank.balanceOf(DaoHelper.GUILD, DaoHelper.ETH_TOKEN) < gasLeft) {c_0xea85b50e(0xc3ffb45a52deae2720ce367b47314721cf3088e1055ee1770705816781a48708); /* branch */ 

c_0xea85b50e(0xb69d491aec9334b321ef5628a461fcf3b6db1ac7af0174b13de2ffbfb13210d0); /* line */ 
            c_0xea85b50e(0x64b86c9bb0c4fa9e0970665a81fe6d60aa92bae1854409c7f02fe67e4e3e5ad0); /* statement */ 
return (false, 0);
        }else { c_0xea85b50e(0x5c8614f6551955f0d7380480e7120f13e426e9c58d2f42803c4ce22b3a1295f0); /* branch */ 
}

c_0xea85b50e(0x01a32a4c48dda4d17777bd8b455de0702bf47cc60f610de99235a97e39cdbce7); /* line */ 
        c_0xea85b50e(0xaf806d595eba2e4950f78b1bbb6f95ad7ddb9555ccb5282f91532461e777ad7c); /* statement */ 
uint256 spendLimitPeriod = dao.getConfiguration(SpendLimitPeriod);
c_0xea85b50e(0x2b71a6bb666f467792bcd75a959f9b16726c94adf73f448ddd29f47d495b2f36); /* line */ 
        c_0xea85b50e(0x4d45b548e12256179ea05f83cea027e7884667c4b48e5f27c2927dd81d51591d); /* statement */ 
uint256 spendLimitEth = dao.getConfiguration(SpendLimitEth);

c_0xea85b50e(0x1a49b17ff044563a3d74492ba7f4fdf58d9b622aae614c7c5daa9f230087bd5b); /* line */ 
        c_0xea85b50e(0x357c6d92c7500cd0d97025f6b3a70fc287888d7ca111edd0fd7e6c7425f33934); /* statement */ 
uint256 payback = gasLeft * tx.gasprice;

c_0xea85b50e(0x24a08b7601938c92739da9a13af0cc04687d285d167066126645028d5e77a45d); /* line */ 
        c_0xea85b50e(0xa8c1cb94d1652d178f074edb023cecbf618606fd3d24107fa532f551daa579c7); /* statement */ 
if (
            //slither-disable-next-line timestamp
            block.timestamp - _data[address(dao)].rateLimitStart <
            spendLimitPeriod
        ) {c_0xea85b50e(0x78ac9bba64807e809fe5605b2c304dd63467de5c7e594a386fa730089fde9a53); /* branch */ 

c_0xea85b50e(0xb9ec16e0b18bbdf5d7656b92fd290d497d0c7613f45ba9628b72274feb06d08e); /* line */ 
            c_0xea85b50e(0xfbba8263e0f9410539fd90030691cd2fcc3c5d4cc23d72c49396b62d050cdbc1); /* statement */ 
if (spendLimitEth < _data[address(dao)].ethUsed + payback) {c_0xea85b50e(0xe359e80f19eb4fe0a6ba22c5af32aa3c097f40603be75f1717a6e11a58540387); /* branch */ 

c_0xea85b50e(0xb4909995e820180581820675029a43c41b2955cc480b9dd8e64df6535136c25a); /* line */ 
                c_0xea85b50e(0x4a92900d466a60c025fe2e803a24258e72cd7a90071f7adad900c62fe7283bc2); /* statement */ 
return (false, 0);
            }else { c_0xea85b50e(0x220315a89a5e74ce1a45d1d3b7999394f687fd2296a9c48232f005daee09a13d); /* branch */ 
}
        } else {c_0xea85b50e(0x034a835451e5e0a3070de723450be30bd332e98a5862284cd75e27b092d69ecd); /* branch */ 

c_0xea85b50e(0x362d8b2a9de01a3b11f94fcd7b0ccd3ca216094a45f127f4679ceded9d4fe4fc); /* line */ 
            c_0xea85b50e(0x3085915d8ee048dae7c105d4cdff4b567c4538ecdb359675112fd122f5cd96a6); /* statement */ 
if (spendLimitEth < payback) {c_0xea85b50e(0x20df9f334ca47fa6a61e6b85a0a8eb5ca1eb916c258e02eb083839cb86018a8d); /* branch */ 

c_0xea85b50e(0x22ef94db04a51d646bbd0ac0cf2e96bcb60b79ecb3dea5d09120cc7cbe8eeb22); /* line */ 
                c_0xea85b50e(0x48f0cdb6960348b2b423f956ac36b49de426c9db4d54c7d39681395f8eb81663); /* statement */ 
return (false, 0);
            }else { c_0xea85b50e(0x4dcdf875aef80d88bbdb942cf708a5ac4cdbf482c50032df82870423c94d2aa0); /* branch */ 
}
        }

c_0xea85b50e(0xdac54b152f12086c3dff8fe6062ff6604323683a1a9461cbedc4d43e6ae17aad); /* line */ 
        c_0xea85b50e(0xd0a794a35e04bdeef55fea2bc4b68e38b68f018011fcadc65c1009272b5d7530); /* statement */ 
return (true, spendLimitPeriod);
    }

    /**
     * @notice reimburse the transaction
     * @param dao the dao that needs to reimburse
     * @param caller who is the caller (the one who should be reimbursed)
     * @param gasUsage how much gas has been used
     * @param spendLimitPeriod the spend liimt period param read before executing the transaction
     */
    function reimburseTransaction(
        DaoRegistry dao,
        address payable caller,
        uint256 gasUsage,
        uint256 spendLimitPeriod
    ) external override onlyAdapter(dao) {c_0xea85b50e(0x3b49aa679104def699b3f928f177be481faf8e4d6e0e7bdaa90e0cab8cbd466b); /* function */ 

c_0xea85b50e(0x73b259fe5658794eaf81c9f17067a5e402d708ada213f2803aa14ca87d09bdb3); /* line */ 
        c_0xea85b50e(0x98eaefeccbd7a6c8bdf13a863b9a64ba69e80abbd33630007c95bd5fd33b4078); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0xea85b50e(0xc557c2456e2c3e95e5b08fa6a4179d631849d3e8369294d1851730a6b2cf424b); /* line */ 
        c_0xea85b50e(0xd3bc4b8597c094a4c41305e3fa9d957bef684167648250f405181c9121c7daca); /* statement */ 
uint256 payback = gasUsage * tx.gasprice;
c_0xea85b50e(0x9082bc0cb21dd2b526741da5f63ee77d482ae776296c7be3d5bfeb3d9810e1aa); /* line */ 
        c_0xea85b50e(0x13590266d6427186cb92e0bcbd66423e623b5e213f2fce025b0e6413d8e7cb02); /* statement */ 
if (
            //slither-disable-next-line timestamp
            block.timestamp - _data[address(dao)].rateLimitStart <
            spendLimitPeriod
        ) {c_0xea85b50e(0x50854765a82622b7334623f9d9b45c1edf20dcaaf3bdd5c946794c1da3dc01f8); /* branch */ 

c_0xea85b50e(0x326a6b6997cfdebe448e5de56134982440e88c32fafceb7761a8d887b7d1caf3); /* line */ 
            c_0xea85b50e(0xaa074bc4c136c3234a79d0b4e821fb5923df4e33decf3e2c22d2ad05a29447ce); /* statement */ 
_data[address(dao)].ethUsed = _data[address(dao)].ethUsed + payback;
        } else {c_0xea85b50e(0x1ce488704ad636eac62d7c1dd68150e3dad4f7996e8711ff35eca342c6ca1870); /* branch */ 

c_0xea85b50e(0x25295c51a0ff974d1606d05f64e5af8fbc4d6900126b3147dbcea8a35fcb8be1); /* line */ 
            c_0xea85b50e(0x15ad6156724105ae0ef4b7c54e3447bd3777aa8fadeadc0610932177ba2d4aa8); /* statement */ 
_data[address(dao)].rateLimitStart = block.timestamp;
c_0xea85b50e(0x58006a1336261ceddefed0652a3f6ade89ade891115eacd067fb99c2c95192d9); /* line */ 
            c_0xea85b50e(0xfda4cc15512cc26480c939fbedf997c93184bb9d3ce2ac1a9095daec24b84255); /* statement */ 
_data[address(dao)].ethUsed = payback;
        }
        // slither-disable-next-line unused-return
c_0xea85b50e(0xc6ba88e95710060142824e33b188a2b8849099618ea765a737676453fa12268b); /* line */ 
        c_0xea85b50e(0x6a77f9f66b4c631449c9bcd793e254adca413d2d66bfd8ce4a2aca525abf4eb1); /* statement */ 
try bank.supportsInterface(bank.withdrawTo.selector) returns (
            // slither-disable-next-line uninitialized-local,variable-scope
            bool supportsInterface
        ) {
c_0xea85b50e(0x6137c946075d6cfee967b4e690370237527ff406f5baba70be7d3e91db3a928e); /* line */ 
            c_0xea85b50e(0x4df26f99fef73170ef2206944b8bb717e52465b20349402a780c61a61d89afe8); /* statement */ 
if (supportsInterface) {c_0xea85b50e(0x94af5cb11975a4e955110f641c69391c7a211982de03319a146b6ddc71abe519); /* branch */ 

c_0xea85b50e(0x82c54473d46b419c1c0c0d3f474e5cabe0e74589a486d8ff78af6ed4a421d6b9); /* line */ 
                c_0xea85b50e(0xb7cfb79981587f7445191b690f435cdb0a69b0f667fbdd4a6e5e977e92e4bb7f); /* statement */ 
bank.withdrawTo(
                    dao,
                    DaoHelper.GUILD,
                    caller,
                    DaoHelper.ETH_TOKEN,
                    payback
                );
            } else {c_0xea85b50e(0x4e515e0ff7988aba46489e89aad4bb8547a72868499162e1764080c2ba16035f); /* branch */ 

c_0xea85b50e(0x5adc02c317a1d367078a01180cbc06fe2d1b14b93fbe81fe3b93e69efd857a4f); /* line */ 
                c_0xea85b50e(0x11c3c73cf9594e5ae2d9f988e3fcbd4e48c212ae157cdd664f7020a2599c708f); /* statement */ 
bank.internalTransfer(
                    dao,
                    DaoHelper.GUILD,
                    caller,
                    DaoHelper.ETH_TOKEN,
                    payback
                );
c_0xea85b50e(0xe80f5e8d9031eaed31e055a97fc3051bfb401ef7b27e58c423969e3420f3df47); /* line */ 
                c_0xea85b50e(0x801aeae31b687ab5f4628e1bfb19d19e104df630bbc42b4da81b8e69fa7e6190); /* statement */ 
bank.withdraw(dao, caller, DaoHelper.ETH_TOKEN, payback);
            }
        } catch {
            //if supportsInterface reverts ( function does not exist, assume it does not have withdrawTo )
c_0xea85b50e(0xe7d07f54f4b5638b524f41a41f90d55272d3ab8ea9bb3947ea8a1b4cfc6f7a73); /* line */ 
            c_0xea85b50e(0x37634b17114ea9f5fe6a10db3203d8101bce3a2b5a36b27b6e12ab5cff67ed89); /* statement */ 
bank.internalTransfer(
                dao,
                DaoHelper.GUILD,
                caller,
                DaoHelper.ETH_TOKEN,
                payback
            );
c_0xea85b50e(0xc633609cbf5ac331994a86a0395ad841efc108603ca2e210e5e43b4ab08cf5fc); /* line */ 
            c_0xea85b50e(0xcd2ac8a8763a42f71ae1a9543fff199624a8ade5130b6aefda6bc6caa224ea2c); /* statement */ 
bank.withdraw(dao, caller, DaoHelper.ETH_TOKEN, payback);
        }
    }
}
