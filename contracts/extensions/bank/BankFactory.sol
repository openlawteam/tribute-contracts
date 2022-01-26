pragma solidity ^0.8.0;
function c_0x0796bfff(bytes32 c__0x0796bfff) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../core/CloneFactory.sol";
import "../IFactory.sol";
import "./Bank.sol";
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

contract BankFactory is IFactory, CloneFactory, ReentrancyGuard {
function c_0x1fbf281a(bytes32 c__0x1fbf281a) public pure {}

    address public identityAddress;

    event BankCreated(address daoAddress, address extensionAddress);

    mapping(address => address) private _extensions;

    constructor(address _identityAddress) {c_0x1fbf281a(0x06128e52213e80cfb237b2c4200a2c3cb924ac10f2b6216427434e73b9256405); /* function */ 

c_0x1fbf281a(0x039737b77cea886817b50804bdb45aa872811d565c06705fe51a4745ccb5725d); /* line */ 
        c_0x1fbf281a(0x234de08c7786f29f7bea03d46d0890c25b2b12af133870e9c71fef0bf699a9c0); /* requirePre */ 
c_0x1fbf281a(0x9855c41997d981a16814ae6480429ed33c040ad875014bd05e5b962871f2fbd2); /* statement */ 
require(_identityAddress != address(0x0), "invalid addr");c_0x1fbf281a(0x68263b75cf1dc3c683f8f8d9ead0db8e16e32a7f3c331eb14fa2f93b1f5b14db); /* requirePost */ 

c_0x1fbf281a(0x326ba2835b231c8277610415f2b4c11d0b0aa6e6f5ddc5ab80805b6017e01ffb); /* line */ 
        c_0x1fbf281a(0xf3cc14aa72d521c64e98c8fb995f9f3b07c578156891c2398110ad2b4db5f473); /* statement */ 
identityAddress = _identityAddress;
    }

    /**
     * @notice Create and initialize a new BankExtension
     * @param maxExternalTokens The maximum number of external tokens stored in the Bank
     */
    // slither-disable-next-line reentrancy-events
    function create(address dao, uint8 maxExternalTokens)
        external
        nonReentrant
    {c_0x1fbf281a(0xee13ad225b78ecf2f9704553a713d88d32323679062931e3eb8f36b84051c352); /* function */ 

c_0x1fbf281a(0x0989ff2d990907a42ee1cb7ea07556fdf7c3b8cc2ae4eab93f52517bbb78aa96); /* line */ 
        c_0x1fbf281a(0xaa5a7d1b75a010fd77d566a65d9a51a9685f7ec23845178a027816b4b2548fac); /* requirePre */ 
c_0x1fbf281a(0x523609843205fb019882a7c09c49488e67b040f0eb94e92ecdb7db813450a977); /* statement */ 
require(dao != address(0x0), "invalid dao addr");c_0x1fbf281a(0xb55deb894302c0dc6b26668a5d58b8f2877df2b7dea1669ef34be0413ddd0089); /* requirePost */ 

c_0x1fbf281a(0x70a35b75df2fdfddf66710c71ea15cea41a58d1166f62275e32161a0d456264c); /* line */ 
        c_0x1fbf281a(0x5e83b7eb1a951df4127dfe98145d487c90ca13a3912ab3efd03414dbada6570a); /* statement */ 
address extensionAddr = _createClone(identityAddress);
c_0x1fbf281a(0x9bccc5b3b8c02659f5e6074e4ff7db2c6ccad24a520c9d7ce95b92179669bb4a); /* line */ 
        c_0x1fbf281a(0x7f81a7f617bd9d4efdca50f70587a339e6fb9abf39edb5466ba4df2ed53e7cc3); /* statement */ 
_extensions[dao] = extensionAddr;
c_0x1fbf281a(0x36abcbbb885d6fcaac6141ea7f882c1b1641a2156bae9b2eca690db2607d45b6); /* line */ 
        c_0x1fbf281a(0x5ce60c641eb9e33bc3563b1acbd9f18cbf440c24e57d7498247f8b3d7693f4a8); /* statement */ 
BankExtension bank = BankExtension(extensionAddr);
c_0x1fbf281a(0x8162c09e6d8d3ea41f0cfafbc69e1ce9bb844a5f3e9113d7490536133beb3928); /* line */ 
        c_0x1fbf281a(0x50756288fb824f307d10cc642231c681d8ee63e5012a82c1d3475b0243ffec00); /* statement */ 
bank.setMaxExternalTokens(maxExternalTokens);
c_0x1fbf281a(0x0246f76f9185b2722fc4fb3bb27279bb0ea667d710630e4fbd5afd252c477747); /* line */ 
        c_0x1fbf281a(0x91b93f3800eef423229c5e74125e4fd5d85f5b70ed6be67ef0e725db313eef7c); /* statement */ 
emit BankCreated(dao, address(bank));
    }

    /**
     * @notice Returns the extension address created for that DAO, or 0x0... if it does not exist.
     */
    function getExtensionAddress(address dao)
        external
        view
        override
        returns (address)
    {c_0x1fbf281a(0x0ba800c59ede43766522766ca299409eb8cfa51619a689d154073e3e6110fecd); /* function */ 

c_0x1fbf281a(0x2efef752ec3c3dd532d2a5664173f96541b1faee62e62b363c84b594d2ba6d5b); /* line */ 
        c_0x1fbf281a(0xc946c3a98a99d74ccdf68ada3d5f6b1e694b55df53136f3204cf88495c22de0c); /* statement */ 
return _extensions[dao];
    }
}
