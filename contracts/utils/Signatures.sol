pragma solidity ^0.8.0;

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
    string public constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,address actionId)";

    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));

    function hashMessage(
        DaoRegistry dao,
        address actionId,
        bytes32 message
    ) public view returns (bytes32) {
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
    {
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
    ) external view returns (bool) {
        return SignatureChecker.isValidSignatureNow(signer, hash, sig);
    }
}
