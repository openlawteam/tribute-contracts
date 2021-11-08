pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

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

contract DaoArtifacts {
    enum ArtifactType {
        ADAPTER,
        EXTENSION
    }

    // Mapping from Artifact Name => (Owner Address => (Version => Adapters Address))
    mapping(bytes32 => mapping(address => mapping(bytes32 => address)))
        public adapters;

    // Mapping from Artifact Name => (Owner Address => (Version => ExtensionsAddress))
    mapping(bytes32 => mapping(address => mapping(bytes32 => address)))
        public extensionsFactories;

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
     */
    function addAdapter(
        bytes32 _id,
        bytes32 _version,
        address _address
    ) external {
        address _owner = msg.sender;
        adapters[_id][_owner][_version] = _address;
        emit NewArtifact(_id, _owner, _version, _address, ArtifactType.ADAPTER);
    }

    /**
     * @notice Adds the extension factory address to the storage.
     * @param _id The id of the extension factory (sha3).
     * @param _version The version of the extension factory.
     * @param _address The address of the extension factory to be stored.
     */
    function addExtensionFactory(
        bytes32 _id,
        bytes32 _version,
        address _address
    ) external {
        address _owner = msg.sender;
        extensionsFactories[_id][_owner][_version] = _address;
        emit NewArtifact(
            _id,
            _owner,
            _version,
            _address,
            ArtifactType.EXTENSION
        );
    }

    /**
     * @notice Retrieves the adapter/extension factory address from the storage.
     * @param _id The id of the adapter/extension factory (sha3).
     * @param _owner The address of the owner of the adapter/extension factory.
     * @param _version The version of the adapter/extension factory.
     * @param _type The type of the artifact, 0 = Adapter, 1 = Extension Factory.
     * @return The address of the adapter/extension factory if any.
     */
    function getArtifactAddress(
        bytes32 _id,
        address _owner,
        bytes32 _version,
        ArtifactType _type
    ) external view returns (address) {
        if (_type == ArtifactType.ADAPTER) {
            return adapters[_id][_owner][_version];
        }
        if (_type == ArtifactType.EXTENSION) {
            return extensionsFactories[_id][_owner][_version];
        }
        return address(0x0);
    }
}
