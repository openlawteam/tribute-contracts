pragma solidity ^0.8.0;
function c_0x4fc05263(bytes32 c__0x4fc05263) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
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
abstract contract AdapterGuard {
function c_0x0ca4f75a(bytes32 c__0x0ca4f75a) public pure {}

    /**
     * @dev Only registered adapters are allowed to execute the function call.
     */
    modifier onlyAdapter(DaoRegistry dao) {c_0x0ca4f75a(0xb7af7624000962d6b38d5c8286a0952851fb448097b286ef979fadca2fa694af); /* function */ 

c_0x0ca4f75a(0x99fa67efd43155122917a7484ecefaddd2a66f8144276f74f7f4c87d1d28fcc1); /* line */ 
        c_0x0ca4f75a(0xc25e83ea44ecbc0c2498b41e7022d7582ba0afbd34de84103ba7d9c6b1f53609); /* requirePre */ 
c_0x0ca4f75a(0xc1d0617f7c1ddf1c0908abd317005a6713e056c19eed6a92dd10f926726f8233); /* statement */ 
require(
            dao.isAdapter(msg.sender) ||
                DaoHelper.isInCreationModeAndHasAccess(dao),
            "onlyAdapter"
        );c_0x0ca4f75a(0xf36c729177ed38c720ba1052ca0959d662abf44ec41f53157d84a26253d6568c); /* requirePost */ 

c_0x0ca4f75a(0xd25f2dfe232860aca8807771889a3b3988185c2508d9d3a2b9f26307c8b089a9); /* line */ 
        _;
    }

    modifier reentrancyGuard(DaoRegistry dao) {c_0x0ca4f75a(0x9dd602d0f9c6b9b2c2ef3dc2cf55d07fdd2c037a55a27d9d5df6b5ff50e5b6f0); /* function */ 

c_0x0ca4f75a(0xd78b70e448763924ec3625ddf9cd4ab00636eb80d5d2989460ed0c7bedb7532d); /* line */ 
        c_0x0ca4f75a(0x720cea7cc74ea0a927e80f20b29431171b5d816a617371190ba20f48aeda473f); /* requirePre */ 
c_0x0ca4f75a(0x6f86032669373d482951b0eb19cb60ac61a28ffa5ffa887a2394229335465b9a); /* statement */ 
require(dao.lockedAt() != block.number, "reentrancy guard");c_0x0ca4f75a(0x51b1fb39f8ce10889b3635815c3e6dd6dae9d475b3bfef7e7878052cecb2157b); /* requirePost */ 

c_0x0ca4f75a(0x50fad5022d6330e783a70d4341f08b6a9ceb8280730a051fe64a2c76dee2aad5); /* line */ 
        c_0x0ca4f75a(0xfb433110eb02956298bb6589446b2d1d701dfe158aab1ec2965bebaaa3fb4994); /* statement */ 
dao.lockSession();
c_0x0ca4f75a(0x96bcbcb1065b31c28f9ae3709c6de08f4ee0982c6049c5dc08aab6db2916f218); /* line */ 
        _;
c_0x0ca4f75a(0x6b11c544780499890c3bc80848da74d63b4d9cc915ede9e034e1e9986bd4f749); /* line */ 
        c_0x0ca4f75a(0xa43b907c3221fca8c1f7c32e5a675eea2fae4f7342fe593e5bb430249f910963); /* statement */ 
dao.unlockSession();
    }

    modifier executorFunc(DaoRegistry dao) {c_0x0ca4f75a(0x24e934d76cc91b295262b3612eec9ea067e1a43ce3f83074249b2dbab3c63931); /* function */ 

c_0x0ca4f75a(0x836484cbd601170a5cccea1b922807b6064b4ccd95f492e09a648819baf27f74); /* line */ 
        c_0x0ca4f75a(0x520bd4fe0152fac3dab81f0b2d614c366989d0e6912fca30b5fe0039b7e5fc24); /* statement */ 
address executorAddr = dao.getExtensionAddress(
            keccak256("executor-ext")
        );
c_0x0ca4f75a(0x855d0723995df5fcf58bbf2bc4a17e7f51f9a9c8c25df9ecacb6f465ed0cc6d5); /* line */ 
        c_0x0ca4f75a(0x53ae26ff1783c1328853616a98715f985c7b65b78f9e03e8702b74891c9a222a); /* requirePre */ 
c_0x0ca4f75a(0xe58ea89c19be77e443bf40937c9f84566c7645afd7e0681e1d03766faedabf17); /* statement */ 
require(address(this) == executorAddr, "only callable by the executor");c_0x0ca4f75a(0xbb2402883c48c6d21e246033d2cf0cdb43df6b857739a63ccb1b6a360febd5a0); /* requirePost */ 

c_0x0ca4f75a(0xb57c70cef3ca8a5f733ac325d1b7f139bf52c7bec7ff8ae3ca96f6f1dbe3d5bc); /* line */ 
        _;
    }

    modifier hasAccess(DaoRegistry dao, DaoRegistry.AclFlag flag) {c_0x0ca4f75a(0x22453229516d8963c574c0a9421a5c914c48448780e34f827be5300979b171c8); /* function */ 

c_0x0ca4f75a(0x74159e4180bc10160c257212a1c75e165d7342f70786545ce4f3bfcfc21d7301); /* line */ 
        c_0x0ca4f75a(0x1790ab810488a5fff40f8042e96313c36e3ceb442c3224ba79a5265e630e5a01); /* requirePre */ 
c_0x0ca4f75a(0x308a0af0680a4195952903497e686aed8b3b4f81de39a15396b5f9811d6990f4); /* statement */ 
require(
            DaoHelper.isInCreationModeAndHasAccess(dao) ||
                dao.hasAdapterAccess(msg.sender, flag),
            "accessDenied"
        );c_0x0ca4f75a(0x2245322788ecbc9c68ac781fe1f4cd49550ad1e5ff38a0bf90e3a5da40960d2d); /* requirePost */ 

c_0x0ca4f75a(0x35f130b2bb11d873decec8f230cc878ebe0b2f0dfb940ec5ef212c126597ca1f); /* line */ 
        _;
    }
}
