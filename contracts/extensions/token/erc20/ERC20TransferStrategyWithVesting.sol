pragma solidity ^0.8.0;
function c_0x4f39e830(bytes32 c__0x4f39e830) pure {}


// SPDX-License-Identifier: MIT
import "../../../core/DaoRegistry.sol";
import "../../../helpers/DaoHelper.sol";
import "../../bank/Bank.sol";
import "./IERC20TransferStrategy.sol";
import "./InternalTokenVestingExtension.sol";

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
contract ERC20TransferStrategy is IERC20TransferStrategy {
function c_0xb96662be(bytes32 c__0xb96662be) public pure {}

    bytes32 public constant ERC20_EXT_TRANSFER_TYPE =
        keccak256("erc20.transfer.type");

    /// @notice Clonable contract must have an empty constructor
    // constructor() {}

    function hasBankAccess(DaoRegistry dao, address caller)
        public
        view
        returns (bool)
    {c_0xb96662be(0x98f6e3b3d404e3af9ca59136364ca00333a4c2e97ff111d7cd7db564ed9b080b); /* function */ 

c_0xb96662be(0x73d27856f7b0b01d98e43e272cd0c2e444b9d1e38b917f1d8ff2c640fd61f5bd); /* line */ 
        c_0xb96662be(0xbb63c7d21b364d55ee87f35da7ae717bf050b3ea711c9e6fcc2369984f382e2c); /* statement */ 
return
            dao.hasAdapterAccessToExtension(
                caller,
                dao.getExtensionAddress(DaoHelper.BANK),
                uint8(BankExtension.AclFlag.INTERNAL_TRANSFER)
            );
    }

    function evaluateTransfer(
        DaoRegistry dao,
        address tokenAddr,
        address from,
        address to,
        uint256 amount,
        address caller
    ) external view override returns (ApprovalType, uint256) {c_0xb96662be(0x9f6db7b2e3878d20246ac5951c93f3749c7017e0f7037b4032be1bd4badd8384); /* function */ 

        //if the transfer is an internal transfer, then make it unlimited
c_0xb96662be(0x25a95a243cf6e699d2e311b1f2059807ba9a0019c06f18b1c7878f34c6a934a4); /* line */ 
        c_0xb96662be(0xaffd2f8b0ebef71c967b666546837c93e7f4144b53a43adb59f118b3d29ce366); /* statement */ 
if (hasBankAccess(dao, caller)) {c_0xb96662be(0xe3c17f3e5f0f1a391632bc0c0e148ae1a92f7bdc85585181c7e32e12afca03c0); /* branch */ 

c_0xb96662be(0xd7a17c87dbb237ff74c83bec2a8fa74ff81890427308604ce09530cb032be5cd); /* line */ 
            c_0xb96662be(0x6ffc41d1471ea8d17054ac6d7c0fa3a0d48bd32d98dd5396aadd7a589ca04854); /* statement */ 
return (ApprovalType.SPECIAL, amount);
        }else { c_0xb96662be(0x7a4e3f1980670429397f45b0f6066ab4dfc363a409e74d39793d7ca646f67eda); /* branch */ 
}

c_0xb96662be(0x5c3f53638734d7ce1005457add65369febf1477134294a8a3103a4ed6927e286); /* line */ 
        c_0xb96662be(0x1bfc9c142d12cb6f8baecdd124ba3f0ab4659b3c49d23e2cac4e6ba18069bbcd); /* statement */ 
uint256 transferType = dao.getConfiguration(ERC20_EXT_TRANSFER_TYPE);
        // member only
c_0xb96662be(0x8b98e301a474aa225578ced052deecd9dc83cb313432109308a4f93649002a13); /* line */ 
        c_0xb96662be(0xeae22488c89ec3c0e2858a1c46f3876861fbccdb3b2188bbbb6273d44540f852); /* statement */ 
if (transferType == 0 && dao.isMember(to)) {c_0xb96662be(0xff0be317a4e4bc4c463f1e3dc0368b3cc9dc611215fba4df7984c46a93ba38e1); /* branch */ 

            // members only transfer
c_0xb96662be(0xb97d2680cb62181db0837b483cd2a00a2c7143cfcd0f9323da6f458965531621); /* line */ 
            c_0xb96662be(0x24011d21ed734d7798d538abb95c880c1ba29e7577cf2888ca81bbf3712f39cb); /* statement */ 
return (
                ApprovalType.STANDARD,
                evaluateStandardTransfer(dao, from, tokenAddr)
            );
            // open transfer
        } else {c_0xb96662be(0x4477bea5e3152f6568af9fc338db1201001523ca19dd8583ed6b34f0108efb44); /* statement */ 
c_0xb96662be(0x53bf396aa54c9004cf99e4a2602defbf5c4591442525ba9be8f7ac52fdf39d83); /* branch */ 
if (transferType == 1) {c_0xb96662be(0x8e6ab06f764772158a5d7d418f27dddbf1a5aeed663353e28ff5c8bd82c6d158); /* branch */ 

c_0xb96662be(0x40031ae5e92082b8fc4bdb9db11cd9651fb545a89febeb8b20b716baa236349b); /* line */ 
            c_0xb96662be(0x26a7f45490b9c3fdc03b05a6eb506ee9e56f59a1bb8ac81abd35b0ed342c8271); /* statement */ 
return (
                ApprovalType.STANDARD,
                evaluateStandardTransfer(dao, from, tokenAddr)
            );
        }else { c_0xb96662be(0xd618af1b13b96321d56c588c41a30a675c9c7bd32d77dcc20535d34a0cd3c4a7); /* branch */ 
}}
        //transfer not allowed
c_0xb96662be(0x15051533b307664e63c35df05a017045b3f1a0ecc05fab047c35bf8a0576e4e5); /* line */ 
        c_0xb96662be(0x01a51f272414eff71f8af881c75bb7f9ddbf81d8742c91afc6592422842d6f9d); /* statement */ 
return (ApprovalType.NONE, 0);
    }

    function evaluateStandardTransfer(
        DaoRegistry dao,
        address from,
        address tokenAddr
    ) public view returns (uint160) {c_0xb96662be(0xd6437af2ff374df769ca2d2919b9e13817df4013216ea9c15ec33c75f56f93d7); /* function */ 

c_0xb96662be(0x61d90cf23dfc5ae626c08fefd5a787e9d458b2ac5a358f3776bd680814741a67); /* line */ 
        c_0xb96662be(0x7ae5d12498ca4e0d65973a03890ecbcb8c6838871deb04999ec63d5d9ce1ae29); /* statement */ 
InternalTokenVestingExtension vesting = InternalTokenVestingExtension(
            dao.getExtensionAddress(DaoHelper.INTERNAL_TOKEN_VESTING_EXT)
        );
c_0xb96662be(0x35560f291e322af8ab5f65e6fb2c59bf1aa5fc6a5f24ae34618bc73093aa131f); /* line */ 
        c_0xb96662be(0x2815123ee7e31ee0de36362a8305f79e2c26bc7c521dcb24e6efd424109ceca6); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );

c_0xb96662be(0x9dbe0a0f3f390d44bc50a515d8839113118d39773d6859d4c83c081096b0231e); /* line */ 
        c_0xb96662be(0x67b4a2af02de161381fab36e1a127b530eea2ec1a5b835912640d59dd067f9c4); /* statement */ 
uint88 minBalance = vesting.getMinimumBalance(from, tokenAddr);
c_0xb96662be(0xde0057461f441a3b57162744e385a5234f2af90b4e48cef2eaef2c782792eb3d); /* line */ 
        c_0xb96662be(0x39335afee56e6384382b3d20304b9234f062c36f41224cf49996a648da0e69f6); /* statement */ 
uint160 balance = bank.balanceOf(from, tokenAddr);

c_0xb96662be(0x4bc0c909e494066ec2df7bf70465e011dc0d7b877b7653eed21f6e69748adaf0); /* line */ 
        c_0xb96662be(0x498de1f6f210a5124fb7def86129c3ceb5e10585c27bd370135b66058c552d73); /* statement */ 
if (minBalance > balance) {c_0xb96662be(0x7a160a4761adbefbd67fe441c8a93a825a72a337714d317d4a4c314da81cbce2); /* branch */ 

c_0xb96662be(0x46eb4f27becd8376651f3b94c5164f71ac6f62cd2e1bdc0539d6b005013dc687); /* line */ 
            c_0xb96662be(0xc2ba1749e48d270e6ecc3c913c92c5c2b20858f7590362010f7fb11f8f64d763); /* statement */ 
return 0;
        }else { c_0xb96662be(0x55860f42ce07335b9fa394dc8c456e467cad7c371ff90a1dc9127efd044c83d7); /* branch */ 
}

c_0xb96662be(0x12d7a766521c8cab90dd2b46ab0eb75fce563513a73415b49fccde275feb6d04); /* line */ 
        c_0xb96662be(0xcf19093233c1d2ef184fbd04b748af547a50886fc8f0041970d2ee51ec90799e); /* statement */ 
return uint160(balance - minBalance);
    }
}
