pragma solidity ^0.8.0;
function c_0x4c51d707(bytes32 c__0x4c51d707) pure {}


// SPDX-License-Identifier: MIT
import "../../../core/DaoRegistry.sol";
import "../../../core/CloneFactory.sol";
import "../../IFactory.sol";
import "./InternalTokenVestingExtension.sol";

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

contract InternalTokenVestingExtensionFactory is
    IFactory,
    CloneFactory,
    ReentrancyGuard
{
function c_0x1f7faa0a(bytes32 c__0x1f7faa0a) public pure {}

    address public identityAddress;

    event InternalTokenVestingExtensionCreated(
        address daoAddress,
        address extensionAddress
    );

    mapping(address => address) private _extensions;

    constructor(address _identityAddress) {c_0x1f7faa0a(0x73fff05e02b7f62af4ab7ff7d9e6dc96d1b1499242343b5b1bcd0e81866b8898); /* function */ 

c_0x1f7faa0a(0x4f90fd17ae1525c2850b33b115472bbac608f41c637a3734f700454270f2a3dd); /* line */ 
        c_0x1f7faa0a(0xbd21c1875cc8c253298e092f14cedde1c0dff8eca75418c52d4b5fb4300873f7); /* requirePre */ 
c_0x1f7faa0a(0x9c062a3388eb86ee5d1fff2079dbdeba8909e4df600b4b14efa679b135962e53); /* statement */ 
require(_identityAddress != address(0x0), "invalid addr");c_0x1f7faa0a(0x017bc68ea53a1775dd9da54c98a999c9556f2ca77b139c19747da67b7a53047b); /* requirePost */ 

c_0x1f7faa0a(0x056d20fa06d123803d0445b6ef6438da480c7b9e6945714bca49102dd6f24c8e); /* line */ 
        c_0x1f7faa0a(0xb4973decd34494362cdb6030fef383f0652ebe2fccbc088720cea8f5779acec2); /* statement */ 
identityAddress = _identityAddress;
    }

    /**
     * @notice Creates a clone of the ERC20 Token Extension.
     */
    function create(address dao) external nonReentrant {c_0x1f7faa0a(0x49952ac3515925d6b124f7d67738bbca2eaac4ac3949b4e2118af850f74d30fd); /* function */ 

c_0x1f7faa0a(0x71d23fccab19ee948c60c2103e778b92a89eba3ed66c7065eb2e7f0430e86202); /* line */ 
        c_0x1f7faa0a(0x39cc8b528902e03eb73cb18535f1074686a6bb9231fd42d1c7605a0e107d17e2); /* requirePre */ 
c_0x1f7faa0a(0x62087a41ac1144532a39e5c6f80d477d9a33145fd68a0325bd945bf0feb8c67f); /* statement */ 
require(dao != address(0x0), "invalid dao addr");c_0x1f7faa0a(0xf27f6c96c1f969f10680685ccdd418747d7b2972c68fe48361586b6b74deff1e); /* requirePost */ 

c_0x1f7faa0a(0xd9aec5bdb4b280e2da40b752f39150f6813a78aad44bfd0974b3077515f6a4b3); /* line */ 
        c_0x1f7faa0a(0xa4af8e5093b4654ba05809fdd24b720f29814efaa779db0baa5fa19f257c6c92); /* statement */ 
address payable extensionAddr = _createClone(identityAddress);
c_0x1f7faa0a(0x61f7bd74bfced1c6009d6863df469380ebf7ea2fcef047b684e7cc3be6956afb); /* line */ 
        c_0x1f7faa0a(0xf7d4cc7da71ed7786d245f22426395f8fcc452ed6ba46f99b8676f888b84abd7); /* statement */ 
_extensions[dao] = extensionAddr;

c_0x1f7faa0a(0xfa783c7e38eec12f5059be1c5aee90987b7addf59a4b42703af9e13de9d13a0c); /* line */ 
        c_0x1f7faa0a(0xa1f68942a59d0a59fcea8d64796ab3760a82d6f5d56ddbe79c5144e6bad3d774); /* statement */ 
InternalTokenVestingExtension ext = InternalTokenVestingExtension(
            extensionAddr
        );
c_0x1f7faa0a(0x6db8d77e26ac6e86c49643b08e88d22949784052b37f140c107edac942d7f6ee); /* line */ 
        c_0x1f7faa0a(0xfc7c001a13e16255e13c312e194638e68c58fc4d5a9c924ee8e14fc46d7718fa); /* statement */ 
emit InternalTokenVestingExtensionCreated(dao, address(ext));
    }

    /**
     * @notice Returns the extension address created for that DAO, or 0x0... if it does not exist.
     */
    function getExtensionAddress(address dao)
        external
        view
        override
        returns (address)
    {c_0x1f7faa0a(0x6518116f5b00969c2f500932fb46c3cea9fdab9714756a77a92ff36ce51946e0); /* function */ 

c_0x1f7faa0a(0xdaf78f3808189ea2b0aefae29091a342fb1178e4cb98b6e5f8376dd2d3026dfe); /* line */ 
        c_0x1f7faa0a(0x900dc6b06281c685c2da6ba88d0a4163af29e68aeff768fb39f37e0a3abe76a4); /* statement */ 
return _extensions[dao];
    }
}
