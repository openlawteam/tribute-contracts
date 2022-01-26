pragma solidity ^0.8.0;
function c_0x70c2e7d1(bytes32 c__0x70c2e7d1) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
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
abstract contract MemberGuard {
function c_0x5a823063(bytes32 c__0x5a823063) public pure {}

    /**
     * @dev Only members of the DAO are allowed to execute the function call.
     */
    modifier onlyMember(DaoRegistry dao) {c_0x5a823063(0x681704b808db384cde5b60471e0589715bbf44e56c532139bdbabadd99d5db00); /* function */ 

c_0x5a823063(0x7d6b6fdc1e83a8ed7196cc23905dd467ce931e41312076aed067b6356ca31bcb); /* line */ 
        c_0x5a823063(0xd3df71609c13846085649c966c9f537fa0bf3191e180ce644c8a816f4919a702); /* statement */ 
_onlyMember(dao, msg.sender);
c_0x5a823063(0x7f6ac1fb0d33fd96f9cc4ae7233e1e2162e5d8d05f13cf4e1cc80ae6235542a1); /* line */ 
        _;
    }

    modifier onlyMember2(DaoRegistry dao, address _addr) {c_0x5a823063(0xf65417e90e7ff64d242e6d6d33dd70492a812d27e3de7eecc359bd284a3400ee); /* function */ 

c_0x5a823063(0x598dff4da1c18b8048e577c3da56801000852c9604a56693d7bd0c813fb7ef6e); /* line */ 
        c_0x5a823063(0xca596ba823954c34bb755488db5726651c1a9a80a4d10543890b2b8c684b1b26); /* statement */ 
_onlyMember(dao, _addr);
c_0x5a823063(0x4a7b0379cd1879940e4338ba17a61363ad186ddd7691d197e8a6168cfa7e3e80); /* line */ 
        _;
    }

    function _onlyMember(DaoRegistry dao, address _addr) internal view {c_0x5a823063(0x97cc93a56fc43d77fd90ac003a81f128622ed8f71e1eb8a51c7cc350e184d77b); /* function */ 

c_0x5a823063(0x276c9e7c6aa9d176225b9c8afd7587c8e24df380bdbea05a7e32200caedab8f5); /* line */ 
        c_0x5a823063(0x72bbb6fd55b9c7e3ca43e83dd80b4a972d0844bce833d621482abe9626a5ef73); /* requirePre */ 
c_0x5a823063(0xa9bce3abe5036568dea96a0fe1c4ae380a92a5e769bca30b11b2e54f6e9ec6f5); /* statement */ 
require(isActiveMember(dao, _addr), "onlyMember");c_0x5a823063(0x4faa8abb2918b9eb655799a635f1d6399de77610ea2077ad7b518efc66f130ff); /* requirePost */ 

    }

    function isActiveMember(DaoRegistry dao, address _addr)
        public
        view
        returns (bool)
    {c_0x5a823063(0x31c577a3a894e0f06d9444d6a95c773f7ddb6b5112fc33501186a490963bc15e); /* function */ 

c_0x5a823063(0x3f3ed333db2e58fc19c9939e1125c9bcc278d0f04904e7848631397f38213851); /* line */ 
        c_0x5a823063(0x3c2c6850c838ef4784b66e046b3197610ecd77d7118efcdee9ba01ab1d3c6ea5); /* statement */ 
address bankAddress = dao.extensions(DaoHelper.BANK);
c_0x5a823063(0x18197f3f32b121fce9257f7770e22dcf6d95f8aca35341f16e1b90ed151fd0be); /* line */ 
        c_0x5a823063(0x553e5857554dcf7ac959103a92588420f6d5a0a128634588edcf9dbf576efd61); /* statement */ 
if (bankAddress != address(0x0)) {c_0x5a823063(0x6129610aade14c6b4133f2b904bff4db9b4aff1e0c86f536cddcef189b6b247a); /* branch */ 

c_0x5a823063(0x306ffb0f679729f20d7499378a0b2eda5eebbeff6e350ece68c4d44df41ebf1b); /* line */ 
            c_0x5a823063(0xcc19471f96b3babc330f51ca80b76695938043c064c2534f4c6e422ba8cb78de); /* statement */ 
address memberAddr = DaoHelper.msgSender(dao, _addr);
c_0x5a823063(0xdf7028ad41f9d3ca7d97a8c570aac4ed5316d068b851c2b9751c6faf6fe590b6); /* line */ 
            c_0x5a823063(0x4ecb814d60853ecc6e3e8a46d295a3c65f55ac0a7fbd45fa9b77e87b2105f884); /* statement */ 
return
                dao.isMember(_addr) &&
                BankExtension(bankAddress).balanceOf(
                    memberAddr,
                    DaoHelper.UNITS
                ) >
                0;
        }else { c_0x5a823063(0x66d2890af582d0f1f83a4a64f8e714b9ecdb483507e9f69566fad6c21189e85d); /* branch */ 
}

c_0x5a823063(0x17726fba8070afe729f3dd4c97d47fa40eaf7dc18bd2d249109df66b1cc187c0); /* line */ 
        c_0x5a823063(0x296c202698b7e280f51d6a6945c8f8291fda30e4ecef909cbc8291166ebbcab3); /* statement */ 
return dao.isMember(_addr);
    }
}
