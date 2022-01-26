pragma solidity ^0.8.0;
function c_0xa8a65068(bytes32 c__0xa8a65068) pure {}


// SPDX-License-Identifier: MIT

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
library FairShareHelper {
function c_0x7ff11e7c(bytes32 c__0x7ff11e7c) public pure {}

    /**
     * @notice calculates the fair unit amount based the total units and current balance.
     */
    function calc(
        uint256 balance,
        uint256 units,
        uint256 totalUnits
    ) internal pure returns (uint256) {c_0x7ff11e7c(0x2cf8261b588e238ab14a4481638c6e2a76c20c2f10205048fcc7a19e85c60d6b); /* function */ 

c_0x7ff11e7c(0x08357d4ea40e64d7c504d71195e39ddafb63a0e6fa6481f7919f69335fae0de3); /* line */ 
        c_0x7ff11e7c(0xc98b9be135115756ce0310d4d7d5471ba0e2cb7f3743535de548f753619dd9d9); /* requirePre */ 
c_0x7ff11e7c(0x0f05defd021ee907d0cb2ddb34645a2f8d7f8bded66a9ccb7b2a0172523587e8); /* statement */ 
require(totalUnits > 0, "totalUnits must be greater than 0");c_0x7ff11e7c(0x490465de8811121ce318e1bc06c071f13b63e0cd7cee396b3de448926ce2dc7b); /* requirePost */ 

c_0x7ff11e7c(0xbecd1b5ce00ff97e2761828568a7c4afa080a6b06dcd4fbb4eb7b687b66a4113); /* line */ 
        c_0x7ff11e7c(0x1a2d5b4f7fdee6db48b6e2de20464b5333b527d36451c868f1ca54a0b09df96f); /* requirePre */ 
c_0x7ff11e7c(0x7af3aaa63592262a242309da5c18e883038c137719edcd0e5372aedc55ea9635); /* statement */ 
require(
            units <= totalUnits,
            "units must be less than or equal to totalUnits"
        );c_0x7ff11e7c(0x30ddd2051e8a4ea849a4149b1454644989caced03869f9507eeffbed27711d88); /* requirePost */ 

c_0x7ff11e7c(0xd926bb4e1945ccc5739ebe5b41561cd142ab7b4f0decdd51a01924979789e1b8); /* line */ 
        c_0x7ff11e7c(0x1b3f213bdeb97e0f049d4b824e923f3992bdf25654dde144b23f7c03d485db51); /* statement */ 
if (balance == 0) {c_0x7ff11e7c(0x3120e004ec2e2f4e9a3a542391a7d83145abee7f371e52a1aea833320e063103); /* branch */ 

c_0x7ff11e7c(0xde0290d538c7b0d0e40824446878611f5780f497e2c01460196f25ee56d5d04f); /* line */ 
            c_0x7ff11e7c(0xc522470d0bf4dd1d79b250b95de9cb2ac38526ee3b3e2e90fc7c1789ca2125c0); /* statement */ 
return 0;
        }else { c_0x7ff11e7c(0x12190e1d722f23e605d10f7f314f603e3b7b26fec3b3276230e4e9a529cb03e4); /* branch */ 
}
        // The balance for Internal and External tokens are limited to 2^64-1 (see Bank.sol:L411-L421)
        // The maximum number of units is limited to 2^64-1 (see ...)
        // Worst case cenario is: balance=2^64-1 * units=2^64-1, no overflows.
c_0x7ff11e7c(0x235efc058f25d3846eaf3a0325f1f570fc91c7d7bd9b119e3a88f685161892de); /* line */ 
        c_0x7ff11e7c(0x020e4d450b962f6305748c1e60f599ab6a0bda766713eb06d03a056ea09b3c60); /* statement */ 
uint256 prod = balance * units;
c_0x7ff11e7c(0xf515aac21ea6be903c48250c7db64aaabf678bbe6efda09b4c0eba720f374fde); /* line */ 
        c_0x7ff11e7c(0xdc3f15a5248b54a86de7424e33bfb78648cdeca0b1156b0030c7533d8def1808); /* statement */ 
return prod / totalUnits;
    }
}
