pragma solidity ^0.8.0;
function c_0x6e01bf29(bytes32 c__0x6e01bf29) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../core/CloneFactory.sol";
import "../IFactory.sol";
import "./ERC1271.sol";
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

contract ERC1271ExtensionFactory is IFactory, CloneFactory, ReentrancyGuard {
function c_0x9becaa7a(bytes32 c__0x9becaa7a) public pure {}

    address public identityAddress;

    event ERC1271Created(address daoAddress, address extensionAddress);

    mapping(address => address) private _extensions;

    constructor(address _identityAddress) {c_0x9becaa7a(0x6c1d2838aea04c9efba5bc2a4817220fd18788ea755a5fc544a993af6d884f04); /* function */ 

c_0x9becaa7a(0x3c869395750452f8e0cd66365f5707ea456cfd4400180cf76898a1af4dfa4ad3); /* line */ 
        c_0x9becaa7a(0x397a84d2950c77770e231a8269faf72da15818a533f2159f1cc506e0b72105f8); /* requirePre */ 
c_0x9becaa7a(0x376fc49d6a8db4126bbfb78688beddbbecf98852c3d7cc77d0a8bcc8e598b256); /* statement */ 
require(_identityAddress != address(0x0), "invalid addr");c_0x9becaa7a(0x0c91b43f0e6532671df59f114a82d9f88429c70d469b27c4fcc1f160ed7d8536); /* requirePost */ 

c_0x9becaa7a(0x83fed40e175dfd901eb4b28c714409eb16a7efb3bec620b082f37dae031cb11c); /* line */ 
        c_0x9becaa7a(0xe1912cb5953213f6cef59745a0bf5576f8caabdd94b769d93183a652108e820b); /* statement */ 
identityAddress = _identityAddress;
    }

    /**
     * @notice Create and initialize a new Executor Extension
     */
    function create(address dao) external nonReentrant {c_0x9becaa7a(0xb785009253847f599abe299495dba4cbdc0b38d26262c14de7c90d85d74d3d64); /* function */ 

c_0x9becaa7a(0xda5b152f844a87006e96f890b244df298c4ce5f013f2d6be07a33b501ac2a816); /* line */ 
        c_0x9becaa7a(0x2bb7bca69ceac118bdad1601e93917bf3ea14d188153f9574045ac361aa4334d); /* requirePre */ 
c_0x9becaa7a(0x89c75ac5d4ec3cb533dac78416ef279be15f497d3d1354e27f0508857095a2c9); /* statement */ 
require(dao != address(0x0), "invalid dao addr");c_0x9becaa7a(0x5aef0fd07d65b78dc7943132dcd03ec18c8e5ff3aad35d2158ee1a017d5d4e6b); /* requirePost */ 

c_0x9becaa7a(0x0cebbb2b49a80146718e839189b1c2404844b5928c1f06c8a08b19f1a21b4402); /* line */ 
        c_0x9becaa7a(0xe2800c12c6b3eb82612de66bd4661f5b12554a2aadc4d2007da9cfc3f69e11b9); /* statement */ 
address extensionAddr = _createClone(identityAddress);
c_0x9becaa7a(0x74dca1ccbce9250150cb0350ed412d4830f1890aa53575d8b23ee3740a885c3e); /* line */ 
        c_0x9becaa7a(0x9751c819e4bb56b1fb42f073896807cacf9e05e2bd99c9fa6e561f72faa71c07); /* statement */ 
_extensions[dao] = extensionAddr;
c_0x9becaa7a(0xbc4af87b3836c07f38d0fc5792b91f76f352ddd320ed9ed6c40f36f7ab8e29ad); /* line */ 
        c_0x9becaa7a(0x76af9b379a7198f177ffe85435a79c662cf1dae916be6ab5dbb1a4797fd18256); /* statement */ 
ERC1271Extension erc1271 = ERC1271Extension(extensionAddr);
c_0x9becaa7a(0x572f0a6b711a92c577e2493cac4b19f1e39cee9c34ec421a2755f5113caa23b3); /* line */ 
        c_0x9becaa7a(0xefdf5bac4bce1bb90dade0d2ed1ba6c2514e843c9acc554787c2c6c37c90f710); /* statement */ 
emit ERC1271Created(dao, address(erc1271));
    }

    /**
     * @notice Returns the extension address created for that DAO, or 0x0... if it does not exist.
     */
    function getExtensionAddress(address dao)
        external
        view
        override
        returns (address)
    {c_0x9becaa7a(0xec375de4d70d3138c50eb731acfbdfd98e6f05b99c444dca6210a63d6984b808); /* function */ 

c_0x9becaa7a(0xa6bd2dd7bb0d2762430662999d53a4e9bff4254aad64f96daea5ba9ca9ebbc9f); /* line */ 
        c_0x9becaa7a(0xbe87cf741f6c754df7c11613d907fc209645b6573eab5d688a1b548dc0245725); /* statement */ 
return _extensions[dao];
    }
}
