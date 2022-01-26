pragma solidity ^0.8.0;
function c_0x7c81581d(bytes32 c__0x7c81581d) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

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

abstract contract Signatures {
function c_0x26281c64(bytes32 c__0x26281c64) public pure {}

    string public constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,address actionId)";

    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));

    function hashMessage(
        DaoRegistry dao,
        address actionId,
        bytes32 message
    ) public view returns (bytes32) {c_0x26281c64(0x1e13f7c255d7806d3f84835f76a2093c1e69152a589f30aa8c31ccb83dfcbebf); /* function */ 

c_0x26281c64(0x066c9f12cebc71c9ed5275271c8f343db523cae87f37728260e245811e382b97); /* line */ 
        c_0x26281c64(0x4043117766adca393f723995223faf44555a190ef89986c406324e805ef9111d); /* statement */ 
return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    domainSeparator(dao, actionId),
                    message
                )
            );
    }

    function domainSeparator(DaoRegistry dao, address actionId)
        public
        view
        returns (bytes32)
    {c_0x26281c64(0xf3bf58fbded0a1399f8ebd54c4e43bb7b0b19bcfe1d35ee4b32520dc454b8cf2); /* function */ 

c_0x26281c64(0x1be785187d1a971e018f849c6a3ba86d73de5d74a085108b325dc0eadd218994); /* line */ 
        c_0x26281c64(0xbacb7ae553bfd9a011a79d1d1ea6f18abdf469b4d57c09664f43a2d34376ce26); /* statement */ 
return
            keccak256(
                abi.encode(
                    EIP712_DOMAIN_TYPEHASH,
                    keccak256("Snapshot Message"), // string name
                    keccak256("4"), // string version
                    block.chainid, // uint256 chainId
                    address(dao), // address verifyingContract,
                    actionId
                )
            );
    }

    function isValidSignature(
        address signer,
        bytes32 hash,
        bytes memory sig
    ) external view returns (bool) {c_0x26281c64(0x59595e6dd354a21574b9ff8ecfd957dcd824c3718164928f437cb54436f861b8); /* function */ 

c_0x26281c64(0xf5d1ff63d2688da7dfa5a6fbacc605ed265d701eeca751e510943f126fb107c7); /* line */ 
        c_0x26281c64(0x8a6beb4a158a6b9e9fc07d9110314b5973896e7437da9595deed3f3d0ade1e7c); /* statement */ 
return SignatureChecker.isValidSignatureNow(signer, hash, sig);
    }
}
