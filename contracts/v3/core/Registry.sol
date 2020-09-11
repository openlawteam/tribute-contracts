pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../utils/Ownable.sol';

contract Registry is Ownable {
    mapping(bytes32 => address) registry;
    mapping(address => bytes32) inverseRegistry;

    constructor() {
        bytes32 ownerId = keccak256("owner");
        registry[ownerId] = msg.sender;
        inverseRegistry[msg.sender] = ownerId;
    }

    modifier onlyModule {
        require(inverseRegistry[msg.sender] != bytes32(0), "only a registered module is allowed to call this function");
        _;
    }

    function isModule(address module) public view returns (bool) {
        return inverseRegistry[module] != bytes32(0);
    }

    function addModule(bytes32 moduleId, address moduleAddress) onlyModule external {
        require(moduleId != bytes32(0), "moduleId must not be empty");
        require(moduleAddress != address(0x0), "moduleAddress must not be empty");
        registry[moduleId] = moduleAddress;
        inverseRegistry[moduleAddress] = moduleId;
    }

    function removeModule(bytes32 moduleId) onlyModule external {
        require(moduleId != bytes32(0), "moduleId must not be empty");
        require(registry[moduleId] != address(0x0), "moduleId not registered");
        delete inverseRegistry[registry[moduleId]];
        delete registry[moduleId];
    }

    //TODO - do we need an Adapter for that?
    function getAddress(bytes32 moduleId) view external returns(address) {
        return registry[moduleId];
    }
}