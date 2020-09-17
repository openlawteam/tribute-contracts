pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../utils/Ownable.sol';
import '../adapters/interfaces/IOnboarding.sol';
import './Module.sol';

contract Registry is Ownable, Module{
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

    function addModule(bytes32 moduleId, address moduleAddress) onlyModule external {
        require(moduleId != bytes32(0), "module id must not be empty");
        require(moduleAddress != address(0x0), "module address must not be empty");
        require(registry[moduleId] == address(0x0), "module id already in use");
        registry[moduleId] = moduleAddress;
        inverseRegistry[moduleAddress] = moduleId;
    }

    function removeModule(bytes32 moduleId) onlyModule external {
        require(moduleId != bytes32(0), "module id must not be empty");
        require(registry[moduleId] != address(0x0), "module not registered");
        delete inverseRegistry[registry[moduleId]];
        delete registry[moduleId];
    }

    function isModule(address module) public view returns (bool) {
        return inverseRegistry[module] != bytes32(0);
    }

    function getAddress(bytes32 moduleId) view external returns(address) {
        return registry[moduleId];
    }

    receive() external payable {
        IOnboarding onboarding = IOnboarding(registry[ONBOARDING_MODULE]);
        onboarding.processOnboarding{value: msg.value}(this, msg.sender);
    }
}