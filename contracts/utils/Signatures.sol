pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "./SafeCast.sol";

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

library Signatures {

    string public constant EIP712_DOMAIN =
      "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,address actionId)";

    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
      keccak256(abi.encodePacked(EIP712_DOMAIN));


    function hashMessage(
        DaoRegistry dao,
        uint256 chainId,
        address actionId,
        bytes32 message
    ) public pure returns (bytes32) {
        return
        keccak256(
            abi.encodePacked(
                "\x19\x01",
                domainSeparator(dao, chainId, actionId),
                message
            )
        );
    }

    function domainSeparator(DaoRegistry dao, uint256 chainId, address actionId)
    public
    pure
    returns (bytes32)
    {
        return
        keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256("Snapshot Message"), // string name
                keccak256("4"), // string version
                chainId, // uint256 chainId
                address(dao), // address verifyingContract,
                actionId
            )
        );
    }

    /**
     * @dev Recover signer address from a message by using his signature
     * @param hash bytes32 message, the hash is the ERC-712 hash of the input message. What is recovered is the signer address.
     * @param sig bytes signature, the signed message hash, generated using web3.eth.sign()
     */
    function recover(bytes32 hash, bytes memory sig)
    public
    pure
    returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;

        //Check the signature length
        if (sig.length != 65) {
            return (address(0));
        }

        // Divide the signature in r, s and v variables
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }

        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return (address(0));
        }
        return ecrecover(hash, v, r, s);
    }

}