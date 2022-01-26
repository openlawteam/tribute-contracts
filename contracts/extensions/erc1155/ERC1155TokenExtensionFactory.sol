pragma solidity ^0.8.0;
function c_0xa3655d6e(bytes32 c__0xa3655d6e) pure {}

// SPDX-License-Identifier: MIT
import "../../core/DaoRegistry.sol";
import "../../core/CloneFactory.sol";
import "../IFactory.sol";
import "./ERC1155TokenExtension.sol";
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

contract ERC1155TokenCollectionFactory is
    IFactory,
    CloneFactory,
    ReentrancyGuard
{
function c_0x7aff1367(bytes32 c__0x7aff1367) public pure {}

    address public identityAddress;

    event ERC1155CollectionCreated(
        address daoAddress,
        address extensionAddress
    );

    mapping(address => address) private _extensions;

    constructor(address _identityAddress) {c_0x7aff1367(0x40dadfbfffd57802843d9077612e4f979725ad07675d8437e8792128fd6c6dd4); /* function */ 

c_0x7aff1367(0xb215fc5dc8a6ecf2e064312c41b04d08144ebf9ead4da27af6fe484d4df993b5); /* line */ 
        c_0x7aff1367(0xb263933067e8551c7f71a93a40d99a444f2abdb44cfe84788c3c4d18169273b5); /* requirePre */ 
c_0x7aff1367(0x567c27fe9cb1d0587289083e50e031df5a400b762b47b5f5d9604046ab5871ba); /* statement */ 
require(_identityAddress != address(0x0), "invalid addr");c_0x7aff1367(0x9275bed425a7aaa135599ea3ee8e23bfd4c7f7b2244be0998516017efb6e55df); /* requirePost */ 

c_0x7aff1367(0x72c4f7e4e2e1427c02e1d38eea4e90339e3287ba1b6b6a42d61c784d2837d835); /* line */ 
        c_0x7aff1367(0xeebcfba5589db6b8e33431e40d686ede99f989a0643244869644239a80a5c865); /* statement */ 
identityAddress = _identityAddress;
    }

    /**
     * @notice Create and initialize a new Standard NFT Extension which is based on ERC1155
     */
    function create(address dao) external nonReentrant {c_0x7aff1367(0x5211b0fb697e27f6fb3cfdf1e8d213e248b0043a3734091a06759a688773b43a); /* function */ 

c_0x7aff1367(0xc37bb60bc766404dcb7babcce5eb8dc78436deca947842eca33259374497cc4e); /* line */ 
        c_0x7aff1367(0xa29b3ceade95b1c51bf730b27a79a53ee323863c643edbf33a240da5feecaa99); /* requirePre */ 
c_0x7aff1367(0xde0bc732eac056a22bd316f587de6cbb7d6b2e8edfefa6ab6438511642c27007); /* statement */ 
require(dao != address(0x0), "invalid dao addr");c_0x7aff1367(0xef4e6a8fd1dd1a053a87a219f02508f8492fc5047d037a646a3a36a78d6dc924); /* requirePost */ 

c_0x7aff1367(0x2884b425eb72512d0ad120499fc2557c85159b33b587ac7da4f23dfc2fd03ee0); /* line */ 
        c_0x7aff1367(0xcd8eed2bc25fbba932bba2016b5794839e9573b4945173c0af24dd9a3123b85d); /* statement */ 
address extensionAddr = _createClone(identityAddress);
c_0x7aff1367(0x0a47b37d4a493199a2e3a148c7124c5ca3703f9fc9094c4ddd07e8460dc708aa); /* line */ 
        c_0x7aff1367(0xdf15f756699e3efb2f0ca44e8f9c5d96aac6bddb899b5b2131c7156a4dcfc235); /* statement */ 
_extensions[dao] = extensionAddr;
c_0x7aff1367(0x2a9104d016b01f578bc43b6f580b82ec9190cba2a1b64d0af963a55267286b42); /* line */ 
        c_0x7aff1367(0x7332cf65aea1db8a578d139620d1483bc47007eccd12932810603046e60aeac8); /* statement */ 
ERC1155TokenExtension extension = ERC1155TokenExtension(extensionAddr);
c_0x7aff1367(0x2cc8655ca4d0805b35f3d31669742dbdfb94191f9d9362caafd01704e8d5abd7); /* line */ 
        c_0x7aff1367(0x47e4d30927f7a4500619c7de86e486e43913f18cbf3f95742618a0a035166c57); /* statement */ 
emit ERC1155CollectionCreated(dao, address(extension));
    }

    /**
     * @notice Returns the extension address created for that DAO, or 0x0... if it does not exist.
     */
    function getExtensionAddress(address dao)
        external
        view
        override
        returns (address)
    {c_0x7aff1367(0x888653ae67f7cba256a670a2011c283dd74db7a10aa521537d61c1c2b54970e6); /* function */ 

c_0x7aff1367(0x22464c84e07a9b183466401fb488d0914a165a7f54bd672d41450522a6b4ca63); /* line */ 
        c_0x7aff1367(0xa686dd1591fe29ffe8ea7e0a4b98d7486cb6d65f72e7520b514267a7a2d0cb08); /* statement */ 
return _extensions[dao];
    }
}
