pragma solidity ^0.8.0;
function c_0xff9611fd(bytes32 c__0xff9611fd) pure {}


// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/access/Ownable.sol";

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

contract DaoArtifacts is Ownable {
function c_0xcc424856(bytes32 c__0xcc424856) public pure {}

    // Types of artifacts that can be stored in this contract
    enum ArtifactType {
        CORE,
        FACTORY,
        EXTENSION,
        ADAPTER,
        UTIL
    }

    // Mapping from Artifact Name => (Owner Address => (Type => (Version => Adapters Address)))
    mapping(bytes32 => mapping(address => mapping(ArtifactType => mapping(bytes32 => address))))
        public artifacts;

    struct Artifact {
        bytes32 _id;
        address _owner;
        bytes32 _version;
        address _address;
        ArtifactType _type;
    }

    event NewArtifact(
        bytes32 _id,
        address _owner,
        bytes32 _version,
        address _address,
        ArtifactType _type
    );

    /**
     * @notice Adds the adapter address to the storage
     * @param _id The id of the adapter (sha3).
     * @param _version The version of the adapter.
     * @param _address The address of the adapter to be stored.
     * @param _type The artifact type: 0 = Core, 1 = Factory, 2 = Extension, 3 = Adapter, 4 = Util.
     */
    function addArtifact(
        bytes32 _id,
        bytes32 _version,
        address _address,
        ArtifactType _type
    ) external {c_0xcc424856(0xc42a1d3e46b9d56bba4a1ff8956a0b85bef41542a2e0bc3e380bce3829bbf33b); /* function */ 

c_0xcc424856(0xfb3962758d64ee887789b1fd4839c83e4783b8c03844dd09c11a970828813436); /* line */ 
        c_0xcc424856(0x0d39de9fd26b0c93ee0fd68e00760a2173260e2850bbc87ae082648cd4beecc8); /* statement */ 
address _owner = msg.sender;
c_0xcc424856(0x6437c1f0ac1774c80e4f171d9ece3ab2c8f6fe7d0d9ccd6c03a2802805cfc7d5); /* line */ 
        c_0xcc424856(0xa993ff7755b8d03afc0304701767d216f0a2d51b4a86b861b0b1bebaf59c6168); /* statement */ 
artifacts[_id][_owner][_type][_version] = _address;
c_0xcc424856(0x4227ced12b03446b81a7736ebcbcb7ea8b7dacd1a98b1b6bb9b229675384516e); /* line */ 
        c_0xcc424856(0x36126d75f6d669aab375565090f78c00ad9e2ae361ac21b3502954aefa4269a4); /* statement */ 
emit NewArtifact(_id, _owner, _version, _address, _type);
    }

    /**
     * @notice Retrieves the adapter/extension factory addresses from the storage.
     * @param _id The id of the adapter/extension factory (sha3).
     * @param _owner The address of the owner of the adapter/extension factory.
     * @param _version The version of the adapter/extension factory.
     * @param _type The type of the artifact: 0 = Core, 1 = Factory, 2 = Extension, 3 = Adapter, 4 = Util.
     * @return The address of the adapter/extension factory if any.
     */
    function getArtifactAddress(
        bytes32 _id,
        address _owner,
        bytes32 _version,
        ArtifactType _type
    ) external view returns (address) {c_0xcc424856(0x4542189fbddcba231c16060bdb5cb7cd8355e6d6474fb466beb693d49d47704a); /* function */ 

c_0xcc424856(0xf0d8272aee828f32e6d456832df6407acca4566d1e85e5918f32c22158e86fa8); /* line */ 
        c_0xcc424856(0xfc53ca3104cebf1c0a7f019a549bcb56e223e1a19902f6811d76f9354a6596dd); /* statement */ 
return artifacts[_id][_owner][_type][_version];
    }

    /**
     * @notice Updates the adapter/extension factory addresses in the storage.
     * @notice Updates up to 20 artifacts per transaction.
     * @notice Only the owner of the contract is allowed to execute batch updates.
     * @param _artifacts The array of artifacts to be updated.
     */
    function updateArtifacts(Artifact[] memory _artifacts) external onlyOwner {c_0xcc424856(0x0c07da81bb52b42120a115a15c31e34840c04dc4e57088df3c806661ab683ccf); /* function */ 

c_0xcc424856(0x2d7b3f689397059e732950a6c8a0ad915ded35d407ba371ff61b2bff82c3b200); /* line */ 
        c_0xcc424856(0x29a2a09b4179a82c179b91b633b6c19861bf62ebfe61f38ea7a365d74c9849cc); /* requirePre */ 
c_0xcc424856(0xeb0fde93e0e0ef20c0c15ef979364d73140611e3e4b5521f009176d8caed845d); /* statement */ 
require(_artifacts.length <= 20, "Maximum artifacts limit exceeded");c_0xcc424856(0xc68c9a657b35bdae673a6ae60e0553516da61a0477a1776a50940ad0a6ac73b4); /* requirePost */ 


c_0xcc424856(0x02a61d3886a82fd441e50fb8ad00fdb94db233c877c0050ea9bcb33c887bd9bc); /* line */ 
        c_0xcc424856(0xd54630c29c642679deaa56a09252ef15a18fafa079cc6c9aececd03f1fd4b334); /* statement */ 
for (uint256 i = 0; i < _artifacts.length; i++) {
c_0xcc424856(0x097b6a9727b9020117a13132297da3b27b1c4bbc3dc8c9052b2751384425d146); /* line */ 
            c_0xcc424856(0x55b17c460d25398c76fab24589d23151711a74a50861a25805f9e49375291938); /* statement */ 
Artifact memory a = _artifacts[i];
c_0xcc424856(0x1cf03c0bf2f7a4f21509ef1a19009e59ace3bb374d790241fd5b8e94da471a38); /* line */ 
            c_0xcc424856(0x4ad2b0bbe558367af8b4a4fb58f2988617d1d62293b71cfbc1f77fb9628eddb2); /* statement */ 
artifacts[a._id][a._owner][a._type][a._version] = a._address;
        }
    }
}
