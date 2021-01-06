pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// SPDX-License-Identifier: MIT

import "./DaoConstants.sol";
import "./DaoRegistry.sol";
import "./CloneFactory.sol";
import "../adapters/Onboarding.sol";

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

contract DaoFactory is CloneFactory, DaoConstants {
    struct Adapter {
        bytes32 id;
        address addr;
        uint256 flags;
    }

    // daoAddr => hashedName
    mapping(address => bytes32) public daos;
    // hashedName => daoAddr
    mapping(bytes32 => address) public addresses;

    address public identityAddress;

    event DAOCreated(address _address, string _name);

    constructor(address _identityAddress) {
        identityAddress = _identityAddress;
    }

    /**
     * @notice Create, initialize and configure a new DaoRegistry
     * @param daoName The name of the dao which, after being hashed, is used to access the address
     * @param keys DAO's configuration keys
     * @param values DAO's configuration values
     * @param finalizeDao If true, call DaoRegistry.finalizeDao()
     */
    function createDao(
        string calldata daoName,
        bytes32[] calldata keys,
        uint256[] calldata values,
        bool finalizeDao
    ) external {
        DaoRegistry dao = DaoRegistry(_createClone(identityAddress));
        address daoAddr = address(dao);
        dao.initialize(msg.sender);

        bytes32 hashedName = keccak256(abi.encode(daoName));
        addresses[hashedName] = daoAddr;
        daos[daoAddr] = hashedName;

        _configure(dao, keys, values, finalizeDao);

        emit DAOCreated(daoAddr, daoName);
    }

    /**
     * @notice Sets a DAO's configuration key-value pairs and finalizes it if requested
     * @param daoAddr Address of the DAO being configured
     * @param keys Configuration keys for the DAO
     * @param values Configuration values for the DAO
     * @param finalizeDao If true, call DaoRegistry.finalizeDao()
     */
    function configureDao(
        address daoAddr,
        bytes32[] calldata keys,
        uint256[] calldata values,
        bool finalizeDao
    ) external {
        require(daos[daoAddr] != bytes32(0), "dao not found");

        DaoRegistry dao = DaoRegistry(payable(daoAddr));
        _configure(dao, keys, values, finalizeDao);
    }

    /**
     * @return The address of a DAO, given its name
     * @param daoName Name of the DAO to be searched
     */
    function getDaoAddress(string calldata daoName)
        public
        view
        returns (address)
    {
        return addresses[keccak256(abi.encode(daoName))];
    }

    /**
     * @dev A new DAO is instantiated with only the Core Modules enabled, to reduce the call cost.
     *       Another call must be made to enable the default Adapters, see registerDefaultAdapters.
     * @param dao DaoRegistry to have adapters added to
     * @param adapters Adapter structs to be added to the dao
     */
    function addAdapters(DaoRegistry dao, Adapter[] calldata adapters)
        external
    {
        //Registring Adapters
        require(
            dao.state() == DaoRegistry.DaoState.CREATION,
            "this DAO has already been setup"
        );

        for (uint256 i = 0; i < adapters.length; i++) {
            dao.addAdapter(adapters[i].id, adapters[i].addr, adapters[i].flags);
        }
    }

    /**
     * @dev Removes an adapter with a given ID from a DAO, and add a new one of the same ID
     * @param dao DAO to be updated
     * @param adapter Adapter that will be replacing the currently-existing adapter of the same ID
     */
    function updateAdapter(DaoRegistry dao, Adapter calldata adapter) external {
        require(
            dao.state() == DaoRegistry.DaoState.CREATION,
            "this DAO has already been setup"
        );

        dao.removeAdapter(adapter.id);
        dao.addAdapter(adapter.id, adapter.addr, adapter.flags);
    }

    /**
     * @notice Sets the configuration key-value pairs for a DaoRegistry
     * @param dao To configure
     * @param keys Configuration keys
     * @param values Configuration values
     * @param finalizeDao Whether or not to call DaoRegistry.finalizeDao after configuration
     */
    function _configure(
        DaoRegistry dao,
        bytes32[] calldata keys,
        uint256[] calldata values,
        bool finalizeDao
    ) internal {
        require(keys.length == values.length, "invalid keys and values");
        for (uint256 i = 0; i < keys.length; i++) {
            dao.setConfiguration(keys[i], values[i]);
        }
        if (finalizeDao) {
            dao.finalizeDao();
        }
    }
}
