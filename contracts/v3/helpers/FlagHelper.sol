pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

library FlagHelper {
    //helper
    function getFlag(uint256 flags, uint256 pos) public pure returns (bool) {
        require(
            pos < 256,
            "position overflow. Position should be between 0 and 255"
        );
        return (flags >> pos) % 2 == 1;
    }

    function setFlag(
        uint256 flags,
        uint256 pos,
        bool value
    ) public pure returns (uint256) {
        require(
            pos < 256,
            "position overflow. Position should be between 0 and 255"
        );

        if (getFlag(flags, pos) != value) {
            if (value) {
                return flags + (2**pos);
            } else {
                return flags - (2**pos);
            }
        }
    }

    //[sponsored, processed, didPass, cancelled]
    function exists(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 0);
    }

    function isSponsored(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 1);
    }

    function isProcessed(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 2);
    }

    function hasPassed(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 3);
    }

    function isCancelled(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 4);
    }

    function isJailed(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 5);
    }

    function isPass(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 6);
    }
}
