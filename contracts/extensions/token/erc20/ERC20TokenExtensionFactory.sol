pragma solidity ^0.8.0;
function c_0x8cdf5814(bytes32 c__0x8cdf5814) pure {}


// SPDX-License-Identifier: MIT
import "../../../core/DaoRegistry.sol";
import "../../../core/CloneFactory.sol";
import "../../IFactory.sol";
import "./ERC20TokenExtension.sol";
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

contract ERC20TokenExtensionFactory is IFactory, CloneFactory, ReentrancyGuard {
function c_0xa054d3fc(bytes32 c__0xa054d3fc) public pure {}

    address public identityAddress;

    event ERC20TokenExtensionCreated(
        address daoAddress,
        address extensionAddress
    );

    mapping(address => address) private _extensions;

    constructor(address _identityAddress) {c_0xa054d3fc(0x37f10741cf231bfaa61ab50d1051c9b0b49526aef009be032d9811bbb0bf7b5f); /* function */ 

c_0xa054d3fc(0x77769a6c859c82cf82badbf7e190a6e1d78d75f1aa6fb5708c8ad26d827fc8c1); /* line */ 
        c_0xa054d3fc(0xfe7cc3d815f35f7b18e5af124e9e3f62169fd2ef97f619ad0ceb097e163ff96e); /* requirePre */ 
c_0xa054d3fc(0x123193e465ba43428f420388fcf10c98c319f5a2b27151658db2710eb9fdb1ab); /* statement */ 
require(_identityAddress != address(0x0), "invalid addr");c_0xa054d3fc(0x6b7114a9fe5be94b723c22f331962a0caab2160389647bbfc7fc5317b3afc0bf); /* requirePost */ 

c_0xa054d3fc(0x312d4148ac5a5f13fe9f631437d97eb399514bf57e1dbb7caa00bf0eb2e099e5); /* line */ 
        c_0xa054d3fc(0xbb88e5352531df9528f4f29b069cf1e024bde0ca85cbe7b514fab12e70b0a76e); /* statement */ 
identityAddress = _identityAddress;
    }

    /**
     * @notice Creates a clone of the ERC20 Token Extension.
     */
    // slither-disable-next-line reentrancy-events
    function create(
        address dao,
        string calldata tokenName,
        address tokenAddress,
        string calldata tokenSymbol,
        uint8 decimals
    ) external nonReentrant {c_0xa054d3fc(0xdfceabd060b8da5ca6286f1421b70461316512bd93f865cf2b8eefff58ff342b); /* function */ 

c_0xa054d3fc(0x078f8cbc64bd4fcbaaade4171e2978ee692ff782c4b83323c2187524c5e64448); /* line */ 
        c_0xa054d3fc(0x29ab1ca4ab4c1ce387e7163524212a2d1ec9dfdca4ce5ec2fddc0e029cc607ee); /* requirePre */ 
c_0xa054d3fc(0xcad3162322213892490e86296d36f123accddeb4cf5fbb2db67702a12ffb123a); /* statement */ 
require(dao != address(0x0), "invalid dao addr");c_0xa054d3fc(0xf298113283908f14c12b6c10cd9aa82fd04d53fb5fb10279d653791e711ba720); /* requirePost */ 

c_0xa054d3fc(0xa649b6d2624ba85ad8c1a0054d2636d774248ad1a682065b6f9d139c699e474b); /* line */ 
        c_0xa054d3fc(0xf2dca9a3f7bd4a4ff6b73cd5cf13fc69a94ed110c889e180907bfd7367afe2a1); /* statement */ 
address payable extensionAddr = _createClone(identityAddress);
c_0xa054d3fc(0x1a344ac57dbcdf947052f9af2faf83481c00ebeeaf97637b850e65553e68d717); /* line */ 
        c_0xa054d3fc(0x9f3ba87a6f3beda6949877d3c33cd68d10cb7fa53f3d5c1cef6c3d2d5e538ff6); /* statement */ 
_extensions[dao] = extensionAddr;
c_0xa054d3fc(0x4869804852c81bed4ad40cf329272cba44bb2e80239a7b77e0c2d15e7957cfc9); /* line */ 
        c_0xa054d3fc(0xcb6568ff13eada3b1a82695ae572def405a1883f7cad38f6342eb4134b0b55ad); /* statement */ 
ERC20Extension ext = ERC20Extension(extensionAddr);
c_0xa054d3fc(0x3b8849cd53edfe1bcd7cbb154422baed6263f655a6a0dcda9a3252a8dbe29e46); /* line */ 
        c_0xa054d3fc(0x3ad534e4d0c9b83bf1ba9d3a2aa5291c67d628a4b1fcea3f0cd421063cf5feb0); /* statement */ 
ext.setName(tokenName);
c_0xa054d3fc(0x3b9adf9672f05007f2fbada39ae5d54ebe95f689aec33e9836b409cb6b94652f); /* line */ 
        c_0xa054d3fc(0x1b450aefbc9aab54ff4e0963f914ff7d47045c2a25b4296708316157606404f7); /* statement */ 
ext.setToken(tokenAddress);
c_0xa054d3fc(0x018495f1425d8fee55806d7e66564d80309d683d87cf5722f0c142b821db3a83); /* line */ 
        c_0xa054d3fc(0x6a4f08278b590d4d240e4a9d8bda55eb0e2df303d76baff9b60a67163e38d8c4); /* statement */ 
ext.setSymbol(tokenSymbol);
c_0xa054d3fc(0x153b9643ce06feba28fcec0ec5802482b2a75318e5d09e7bdc39c80110a4c445); /* line */ 
        c_0xa054d3fc(0x5ecac508a0d8c84fce1c7bd1da578fb24f005b78e6e2e9a62427488f282440ed); /* statement */ 
ext.setDecimals(decimals);
c_0xa054d3fc(0xc80a4e52316a2b9aac0eac5242ab7605a17fe685e73ad3f13ad6f2890f196a6e); /* line */ 
        c_0xa054d3fc(0xf8591c4e03df6bad5ea1507a49fc395e691c36c845516ef47d9612ad27da700b); /* statement */ 
emit ERC20TokenExtensionCreated(dao, address(ext));
    }

    /**
     * @notice Returns the extension address created for that DAO, or 0x0... if it does not exist.
     */
    function getExtensionAddress(address dao)
        external
        view
        override
        returns (address)
    {c_0xa054d3fc(0xc15395f525b1c0db93780431976b625a80c4c7097a7c9a1bafe902ddbb577521); /* function */ 

c_0xa054d3fc(0xc38afffc47c09f84924bcd8d0736bc8b595d0c63233cd8c9e7568dbd9f43b15c); /* line */ 
        c_0xa054d3fc(0xd636633bd23c53ad83d5782e29e5fb779cdf616a3e9e266c42bdd20dd30ec270); /* statement */ 
return _extensions[dao];
    }
}
