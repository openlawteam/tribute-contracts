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

    function exists(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 0);
    }

    function setExists(uint256 flags, bool value)
        public
        pure
        returns (uint256)
    {
        return setFlag(flags, 0, value);
    }

    function isSponsored(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 1);
    }

    function setSponsored(uint256 flags, bool value)
        public
        pure
        returns (uint256)
    {
        return setFlag(flags, 1, value);
    }

    function isProcessed(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 2);
    }

    function setProcessed(uint256 flags, bool value)
        public
        pure
        returns (uint256)
    {
        return setFlag(flags, 2, value);
    }

    function hasPassed(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 3);
    }

    function setHasPassed(uint256 flags, bool value)
        public
        pure
        returns (uint256)
    {
        return setFlag(flags, 3, value);
    }

    function isCancelled(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 4);
    }

    function setCancelled(uint256 flags, bool value)
        public
        pure
        returns (uint256)
    {
        return setFlag(flags, 4, value);
    }

    function isJailed(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 5);
    }

    function setJailed(uint256 flags, bool value)
        public
        pure
        returns (uint256)
    {
        return setFlag(flags, 5, value);
    }

    function isPass(uint256 flags) public pure returns (bool) {
        return getFlag(flags, 6);
    }

    function setPass(uint256 flags, bool value) public pure returns (uint256) {
        return setFlag(flags, 6, value);
    }
}
