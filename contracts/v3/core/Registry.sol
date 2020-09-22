pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../utils/Ownable.sol';
import '../adapters/interfaces/IOnboarding.sol';
import './Module.sol';

contract Registry is Ownable, Module {
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

    function execute(address _actionTo, uint256 _actionValue, bytes calldata _actionData) onlyModule external returns (bytes memory)  {
        (bool success, bytes memory retData) = _actionTo.call{value: _actionValue}(_actionData);
        
        if(!success) {
            string memory m = _getRevertMsg(retData);
            revert(m);
        }
        return retData;
    }

    receive() external payable {
        if(!isModule(msg.sender)) {
            IOnboarding onboarding = IOnboarding(registry[ONBOARDING_MODULE]);
            uint256 amount = onboarding.processOnboarding(this, msg.sender, msg.value);
            if (msg.value > amount) {
                msg.sender.transfer(msg.value - amount);
            }
        }
    }

    /// @dev Get the revert message from a call
    /// @notice This is needed in order to get the human-readable revert message from a call
    /// @param _res Response of the call
    /// @return Revert message string
    function _getRevertMsg(bytes memory _res) internal pure returns (string memory) {
        // If the _res length is less than 68, then the transaction failed silently (without a revert message)
        if (_res.length < 68) return 'Transaction reverted silently';
        bytes memory revertData = slice(_res, 4, _res.length - 4); // Remove the selector which is the first 4 bytes
        return abi.decode(revertData, (string)); // All that remains is the revert string
    }

    function slice(
        bytes memory _bytes,
        uint256 _start,
        uint256 _length
    )
        internal
        pure
        returns (bytes memory)
    {
        require(_bytes.length >= (_start + _length), "Read out of bounds");

        bytes memory tempBytes;

        assembly {
            switch iszero(_length)
            case 0 {
                // Get a location of some free memory and store it in tempBytes as
                // Solidity does for memory variables.
                tempBytes := mload(0x40)

                // The first word of the slice result is potentially a partial
                // word read from the original array. To read it, we calculate
                // the length of that partial word and start copying that many
                // bytes into the array. The first word we copy will start with
                // data we don't care about, but the last `lengthmod` bytes will
                // land at the beginning of the contents of the new array. When
                // we're done copying, we overwrite the full first word with
                // the actual length of the slice.
                let lengthmod := and(_length, 31)

                // The multiplication in the next line is necessary
                // because when slicing multiples of 32 bytes (lengthmod == 0)
                // the following copy loop was copying the origin's length
                // and then ending prematurely not copying everything it should.
                let mc := add(add(tempBytes, lengthmod), mul(0x20, iszero(lengthmod)))
                let end := add(mc, _length)

                for {
                    // The multiplication in the next line has the same exact purpose
                    // as the one above.
                    let cc := add(add(add(_bytes, lengthmod), mul(0x20, iszero(lengthmod))), _start)
                } lt(mc, end) {
                    mc := add(mc, 0x20)
                    cc := add(cc, 0x20)
                } {
                    mstore(mc, mload(cc))
                }

                mstore(tempBytes, _length)

                //update free-memory pointer
                //allocating the array padded to 32 bytes like the compiler does now
                mstore(0x40, and(add(mc, 31), not(31)))
            }
            //if we want a zero-length slice let's just return a zero-length array
            default {
                tempBytes := mload(0x40)

                mstore(0x40, add(tempBytes, 0x20))
            }
        }

        return tempBytes;
    }
}