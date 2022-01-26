pragma solidity ^0.8.0;
function c_0xe0b60795(bytes32 c__0xe0b60795) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../core/CloneFactory.sol";
import "../IFactory.sol";
import "./Executor.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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

contract ExecutorExtensionFactory is IFactory, CloneFactory, ReentrancyGuard {
function c_0xee430be3(bytes32 c__0xee430be3) public pure {}

    address public identityAddress;

    event ExecutorCreated(address daoAddress, address extensionAddress);

    mapping(address => address) private _extensions;

    constructor(address _identityAddress) {c_0xee430be3(0x5b60583b3d4a0d6d2d3012e8af807cb9b110d106d172ea89dd2450d3fea4b722); /* function */ 

c_0xee430be3(0xdf0127ea96bb2c7b4cae13073707e4cd7df7a246697eec4c604114074eadc3fd); /* line */ 
        c_0xee430be3(0xf4d6b02003d13cce61a412e63ffad17634f5dcee2c08e669d221f5c642aee86b); /* requirePre */ 
c_0xee430be3(0xe0f41b9619253d5bef730fcabc4d6d5c757eb0beb7d78abb32a6a0e242d69fb3); /* statement */ 
require(_identityAddress != address(0x0), "invalid addr");c_0xee430be3(0xb2c162689fa9c7f856adbb55be1a0c377bbfca192bd5617c4f6049d71075e24b); /* requirePost */ 

c_0xee430be3(0x422f4f66a1c2866b7719cce56286730567559073d244d72e2e50df93db9e1b4c); /* line */ 
        c_0xee430be3(0x165060cacd51b776a38ce85d584d905c02c88593ea3ac1c9acc65f1529cb19aa); /* statement */ 
identityAddress = _identityAddress;
    }

    /**
     * @notice Create and initialize a new Executor Extension
     */
    function create(address dao) external nonReentrant {c_0xee430be3(0x93cc3bd013b7a0c26b15614d61a14f734a21cc9fce3cfcc7a45677a108bc7d2b); /* function */ 

c_0xee430be3(0xca392a26f9bec7d8cf2dfbd67b7cab30b6ec789b97b1172ccbda5821cda8a215); /* line */ 
        c_0xee430be3(0xf0090351924419e47ba72079d938be3a73dd204766782e17247994a914ee1f16); /* requirePre */ 
c_0xee430be3(0x27a183f0fa3c6ca0bf531664e9c45ad223916332d2bd5ee15a36c2dd69849336); /* statement */ 
require(dao != address(0x0), "invalid dao addr");c_0xee430be3(0xbdd3fc4a50e413aaf0a74d7e2a6a132053bb9c3a67bed2184ea46ad973241415); /* requirePost */ 

c_0xee430be3(0x311996c8c643f68533f3dd1a1445747e7c443ff3b8329d0c25ed73d256716953); /* line */ 
        c_0xee430be3(0x9ac1a855dac02bb0ba4dc17f57c8f31b74a590696496bc763b893f8b547a2a66); /* statement */ 
address payable extensionAddr = _createClone(identityAddress);
c_0xee430be3(0xc826d1138864442293eea9c5410d11cd492d5298be80af072d1f2f7098d496ec); /* line */ 
        c_0xee430be3(0xd61ba67d47069ce36a31ac872ddaad8cdc6425dc3382813396d34dada0eec204); /* statement */ 
_extensions[dao] = extensionAddr;
c_0xee430be3(0x671a5a1d66804320e1481898003e678be0858a78d6581939ebb2f86533236c9c); /* line */ 
        c_0xee430be3(0x2a481ed3232bd0cd01c6948faf9ad1c1e8ef4114f279b195b7fd9b2caa4d88ae); /* statement */ 
ExecutorExtension exec = ExecutorExtension(extensionAddr);
c_0xee430be3(0x7a4ccfb0b70705763566dfd863ea3f79855686e49b030899985c9d7e85b854d4); /* line */ 
        c_0xee430be3(0x02a9b069f7b94691d799931b3ad08c6e912b7d61703081ad4db5a80978d8014e); /* statement */ 
emit ExecutorCreated(dao, address(exec));
    }

    /**
     * @notice Returns the extension address created for that DAO, or 0x0... if it does not exist.
     */
    function getExtensionAddress(address dao)
        external
        view
        override
        returns (address)
    {c_0xee430be3(0x1912f88892a3d9e9606cdb6b7a7ce0733e651594ecdaa2e41011020adb17b977); /* function */ 

c_0xee430be3(0x82dfef9123336bf8419655fc54b3a02007267c18da846d5e084721d75ef4124d); /* line */ 
        c_0xee430be3(0x03ec21dea6f97f2d65074b05f9359cb8b4d8af6bea1c2b6877fbd44382b17175); /* statement */ 
return _extensions[dao];
    }
}
