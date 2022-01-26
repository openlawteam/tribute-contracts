pragma solidity ^0.8.0;
function c_0x785f53f4(bytes32 c__0x785f53f4) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../core/CloneFactory.sol";
import "../IFactory.sol";
import "./NFT.sol";
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

contract NFTCollectionFactory is IFactory, CloneFactory, ReentrancyGuard {
function c_0x9628c2e5(bytes32 c__0x9628c2e5) public pure {}

    address public identityAddress;

    event NFTCollectionCreated(address daoAddress, address extensionAddress);

    mapping(address => address) private _extensions;

    constructor(address _identityAddress) {c_0x9628c2e5(0xf184bf1de9d33f6fa46bec746a778e3b49db0a14bfe907cef8b8fd30661077bf); /* function */ 

c_0x9628c2e5(0xc2c0511c372f29bb30be663d031a53553883cb14ab0bbc259c7684c575d0df0f); /* line */ 
        c_0x9628c2e5(0xd163e1d6c5354291914d60de0d0ca244fb5b2e2fa468a596f41f649498c802cc); /* requirePre */ 
c_0x9628c2e5(0xe9c3d4718b25e344930ae46e58b3315accb1611b1bd3846a26084f4cd8fb94ba); /* statement */ 
require(_identityAddress != address(0x0), "invalid addr");c_0x9628c2e5(0x8ae4a84c71f3ef5e702687173e6f9dc055a91a1032e1fab17f228a060f895f6c); /* requirePost */ 

c_0x9628c2e5(0x489f37c82df0fc29492a100a631ee2da637a52a3f9152ad0b54d8032eb27b3b0); /* line */ 
        c_0x9628c2e5(0x4e8f63ddecc58d60f6484fdd71182c747f7f21efa8980ad45bce03f3e91b3463); /* statement */ 
identityAddress = _identityAddress;
    }

    /**
     * @notice Create and initialize a new Standard NFT Extension which is based on ERC712
     */
    function create(address dao) external nonReentrant {c_0x9628c2e5(0xe3ef26e5ece738b4be28ac2037135637c8a2c2773903089bb2f2a4343b68f2c1); /* function */ 

c_0x9628c2e5(0x01176bd4c908fed6c5ac1fb9570c9d43e1ea41eb25e27a4c0ac585da4d75b3e3); /* line */ 
        c_0x9628c2e5(0x2cd90ac50fffe5d0ee0634ded90bd7c677d1311d5ed4a97da6e7cde9f6d210d9); /* requirePre */ 
c_0x9628c2e5(0x58619a1c735a1544dee89afd05ef31408fb11f18d47f5942cfa100e1cd01eec9); /* statement */ 
require(dao != address(0x0), "invalid dao addr");c_0x9628c2e5(0xb4c84666d8c0bb3bb67556d72b95862aef2ef63889cc3c645e125e8444b7ce8d); /* requirePost */ 

c_0x9628c2e5(0xa48a1aceaa5fe49bd5594ab629b1d027a7ef5eddd01a6e52c8a1d505da6bbccc); /* line */ 
        c_0x9628c2e5(0x3141e30f3996272a7d3b79df92a8ed82cc92ccbe22adb2f879a783d6fd1e0a8c); /* statement */ 
address payable extensionAddr = _createClone(identityAddress);
c_0x9628c2e5(0xe643d182b077de125165149ce60fc093c23d896ccdd62b683721a1b72678f357); /* line */ 
        c_0x9628c2e5(0x2fda9510e23ee455c958639e6f16206ad89cc945e5b28ed9b28fe225fe2dacf2); /* statement */ 
_extensions[dao] = extensionAddr;
c_0x9628c2e5(0xb6ee82a54c16e125a9f2f8be65dea7be4819a7518be4a1297604af7fdbc6880b); /* line */ 
        c_0x9628c2e5(0xf77735c618092cf45f4f4f99c93ae306a1452dda28c4a81732b9678369066a37); /* statement */ 
NFTExtension extension = NFTExtension(extensionAddr);
c_0x9628c2e5(0x8d362b14513402eaf08b895f4498fe230f9faf44e9ce395bec947c30399a4ff0); /* line */ 
        c_0x9628c2e5(0x81ca59d733a34fb8dcfd5aa4b40fc9e3ccd5276cf5876cf43a020e6dc34117cd); /* statement */ 
emit NFTCollectionCreated(dao, address(extension));
    }

    /**
     * @notice Returns the extension address created for that DAO, or 0x0... if it does not exist.
     */
    function getExtensionAddress(address dao)
        external
        view
        override
        returns (address)
    {c_0x9628c2e5(0x1fc0c8d1162d8abbddbbce7473cc7abc6bae9e6a74cc9cdd1a9c168f3c0d5b41); /* function */ 

c_0x9628c2e5(0x2235aaec1de92c37cf45513b732b24497db46c3dd739a4139e6cd0e1938cbe1e); /* line */ 
        c_0x9628c2e5(0x8df4b51523347547d698653ffdd974695413bfa014721edf219c10f6e345af82); /* statement */ 
return _extensions[dao];
    }
}
