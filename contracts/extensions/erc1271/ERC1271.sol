pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../IExtension.sol";
import "../../guards/AdapterGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";

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

/**
 * @dev Signs arbitrary messages and exposes ERC1271 interface
 */
contract ERC1271Extension is AdapterGuard, IExtension, IERC1271 {
    using Address for address payable;

    bool public initialized = false; // internally tracks deployment under eip-1167 proxy pattern
    DaoRegistry public dao;

    enum AclFlag {SIGN}

    struct DAOSignature {
        bytes32 signatureHash;
        bytes4 magicValue;
    }

    mapping(bytes32 => DAOSignature) public signatures; // msgHash => Signature

    /// @notice Clonable contract must have an empty constructor
    constructor() {}

    modifier hasExtensionAccess(AclFlag flag) {
        require(
            address(this) == msg.sender ||
                address(dao) == msg.sender ||
                dao.state() == DaoRegistry.DaoState.CREATION ||
                dao.hasAdapterAccessToExtension(
                    msg.sender,
                    address(this),
                    uint8(flag)
                ),
            "erc1271::accessDenied"
        );
        _;
    }

    /**
     * @notice Initialises the ERC1271 extension to be associated with a DAO
     * @dev Can only be called once
     * @param creator The DAO's creator, who will be an initial member
     */
    function initialize(DaoRegistry _dao, address creator) external override {
        require(!initialized, "erc1271::already initialized");
        require(_dao.isMember(creator), "erc1271::not member");
        initialized = true;
        dao = _dao;
    }

    /**
     * @notice Verifies if exists a signature based on the permissionHash, and checks if the provided signature matches the expected signatureHash.
     * @param permissionHash The digest of the data to be signed.
     * @param signature The signature in bytes to be encoded, hashed and verified.
     * @return The magic number in bytes4 in case the signature is valid, otherwise it reverts.
     */
    function isValidSignature(bytes32 permissionHash, bytes memory signature)
        external
        view
        override
        returns (bytes4)
    {
        DAOSignature memory daoSignature = signatures[permissionHash];
        require(daoSignature.magicValue != 0, "erc1271::invalid signature");
        require(
            daoSignature.signatureHash ==
                keccak256(abi.encodePacked(signature)),
            "erc1271::invalid signature hash"
        );
        return daoSignature.magicValue;
    }

    /**
     * @notice Registers a valid signature in the extension.
     * @dev Only adapters/extensions with `SIGN` ACL can call this function.
     * @param permissionHash The digest of the data to be signed.
     * @param signatureHash The hash of the signature.
     * @param magicValue The value to be returned by the ERC1271 interface upon success.
     */
    function sign(
        bytes32 permissionHash,
        bytes32 signatureHash,
        bytes4 magicValue
    ) external hasExtensionAccess(AclFlag.SIGN) {
        signatures[permissionHash] = DAOSignature({
            signatureHash: signatureHash,
            magicValue: magicValue
        });
    }
}
