pragma solidity ^0.8.0;
function c_0x1bf7102c(bytes32 c__0x1bf7102c) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../IExtension.sol";
import "../../helpers/DaoHelper.sol";
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
contract ERC1271Extension is IExtension, IERC1271 {
function c_0xdd473d39(bytes32 c__0xdd473d39) public pure {}

    bool public initialized = false; // internally tracks deployment under eip-1167 proxy pattern
    DaoRegistry public dao;

    enum AclFlag {
        SIGN
    }

    struct DAOSignature {
        bytes32 signatureHash;
        bytes4 magicValue;
    }

    mapping(bytes32 => DAOSignature) public signatures; // msgHash => Signature

    /// @notice Clonable contract must have an empty constructor
    constructor() {c_0xdd473d39(0x976db099d59e5a90f9ace4795e3c25c3bd417bf370c2acfca93a9adbaecc1513); /* function */ 
}

    modifier hasExtensionAccess(DaoRegistry _dao, AclFlag flag) {c_0xdd473d39(0xb7256f2b17bc3ff17ea67ed688c7a65d415354e32915a8a8e382a4ed80e287b8); /* function */ 

c_0xdd473d39(0x3f37a2b4898768bd894510555fe36542ae7426022803baf216808bbf30ad2d98); /* line */ 
        c_0xdd473d39(0x05a9da9ed988c55d90629a061a3aa4f3ed63b9241bf512d653109c16a9103ee9); /* requirePre */ 
c_0xdd473d39(0x6c6ef503c75469a00d15a6974862cedec59fa6b9ca941f8eb09d79379f79a784); /* statement */ 
require(
            dao == _dao &&
                (address(this) == msg.sender ||
                    address(dao) == msg.sender ||
                    DaoHelper.isInCreationModeAndHasAccess(dao) ||
                    dao.hasAdapterAccessToExtension(
                        msg.sender,
                        address(this),
                        uint8(flag)
                    )),
            "erc1271::accessDenied"
        );c_0xdd473d39(0xd539f933df13b8fb24953b88035a20659147b14a0fb5570c9a9de7efb716a0b4); /* requirePost */ 

c_0xdd473d39(0x2eb1470d59392ee7e529c9a94f78cef792b3b4ef87e77647dd8047c3efa2006a); /* line */ 
        _;
    }

    /**
     * @notice Initialises the ERC1271 extension to be associated with a DAO
     * @dev Can only be called once
     * @param creator The DAO's creator, who will be an initial member
     */
    function initialize(DaoRegistry _dao, address creator) external override {c_0xdd473d39(0x77da2ed57f5493b247db24cee2942523c7fefcaf8d36b29c6eeadb66a23b35a5); /* function */ 

c_0xdd473d39(0x9552c738d524e28a86b2f1ba7d23785b35f3fea8401645c8578a1d995e7383bb); /* line */ 
        c_0xdd473d39(0xfbeff4b731d230f34b131e2e3ca79aac570dfc6fd9d7d451261eca4260e0d71f); /* requirePre */ 
c_0xdd473d39(0x965c87d758ff3c1dcbca9272b7e19fe6e49e1e8124d5af25ba93ab466483cc92); /* statement */ 
require(!initialized, "erc1271::already initialized");c_0xdd473d39(0x64f4bb6c3a665e224f445584a865e936f3a9c7432600e3de914332e0178f49b9); /* requirePost */ 

c_0xdd473d39(0x73e39fcdcb7dd6213da2945f0cdec17cd00a5412b111d6b2b101e807a49b97c8); /* line */ 
        c_0xdd473d39(0x85a265098184a975db2e8fe8cada6b6343983a471b81d642e6c5d91a15ba77a5); /* requirePre */ 
c_0xdd473d39(0x1aca8fbd9039b567421d24e8b9f9d5afc49595ce442ff5893c094cb83c4701aa); /* statement */ 
require(_dao.isMember(creator), "erc1271::not member");c_0xdd473d39(0x19a61a0dbcc4fde33b9487dc9f83c349e850d630fed08f890faf94b68f0e46be); /* requirePost */ 

c_0xdd473d39(0x2b9eb800c88fbd31974a651f41fa9b1a1befe0d792984f8c271b6fc5b9924482); /* line */ 
        c_0xdd473d39(0xaaa9d2e74779e5daa472b4b1dad3f94e272a5f0461e1a2e09b94d6b8f257e068); /* statement */ 
initialized = true;
c_0xdd473d39(0xc3b0a4ba547b50f642c6937838e942dd201945f2a06ab8e75df3739ecced3e59); /* line */ 
        c_0xdd473d39(0x6b19954a035ef0556cc45e5dad5a48c063be0f9f6554257bc5c07e03dad39a5e); /* statement */ 
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
    {c_0xdd473d39(0xe1225a171ded1dedfe2a5fe07e41d3171fb5469b6f83bb095442b926ca307908); /* function */ 

c_0xdd473d39(0x77341a376073ed70a1e06679de8b83931140a8f1b2f0fd6b6c12df80577ca27f); /* line */ 
        c_0xdd473d39(0x8a15b0f10e0b6425a582c6f35ebe1abea675c65f50bffa6babe9cf247b7a38c7); /* statement */ 
DAOSignature memory daoSignature = signatures[permissionHash];
c_0xdd473d39(0x45d56e52752de364038f9dde910cbd42770762fd9107751996fb38103e798435); /* line */ 
        c_0xdd473d39(0xafaddd3545a1ca95b35c31cc9f40b04cd8d2ebea6331781534fc939701a2945c); /* requirePre */ 
c_0xdd473d39(0x61f0a9d53aa5e1dbc2c2f6b093911472e13178abc9ccda4115126ae2e46fc38a); /* statement */ 
require(daoSignature.magicValue != 0, "erc1271::invalid signature");c_0xdd473d39(0xc7e9e7a18b661930af32b0153141567c3b46f202a4da48bcc5439da9854e939c); /* requirePost */ 

c_0xdd473d39(0xc78ba4a3cfec0142eda11a8fb2cf9037353a5c1db066e1419f04b2479a85ca22); /* line */ 
        c_0xdd473d39(0x082f765052cb924d34b6d0ca7fbff1cb0f7f5e71a2fce818c8735ddd23fb0d67); /* requirePre */ 
c_0xdd473d39(0xe1de657637027790f84b9f9343f43f9904e270cbadb5a7ebb6cdd7a27531ca14); /* statement */ 
require(
            daoSignature.signatureHash ==
                keccak256(abi.encodePacked(signature)),
            "erc1271::invalid signature hash"
        );c_0xdd473d39(0xd58d0d1d4b8a1a9db75b2d7a3fba406a81e18ad8fb2e570b303e4874579922c1); /* requirePost */ 

c_0xdd473d39(0x35d9dc580ed74698f14ba0c168e1c9cae88e8c685df5ba6c3dbcfe6c485b84bc); /* line */ 
        c_0xdd473d39(0x1d065339145e7f60add8371fe55e36e82602476f1ae954ecac2961f6316eac8e); /* statement */ 
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
        DaoRegistry _dao,
        bytes32 permissionHash,
        bytes32 signatureHash,
        bytes4 magicValue
    ) external hasExtensionAccess(_dao, AclFlag.SIGN) {c_0xdd473d39(0x7dd2255f5705f6253779652d7dfd7e2614ffcde2b5a49a2b5c6fc4c871aa67d9); /* function */ 

c_0xdd473d39(0x7dc986bf20d6772b8795e11c9ffc4b9d15f838e4c1247c1d210e9e5fc3d8d282); /* line */ 
        c_0xdd473d39(0x751499916085bb9656966e63974ef3fac96c68fdf2387bfadb9a8ca075fd2a26); /* statement */ 
signatures[permissionHash] = DAOSignature({
            signatureHash: signatureHash,
            magicValue: magicValue
        });
    }
}
