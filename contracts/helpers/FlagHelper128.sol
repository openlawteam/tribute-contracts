pragma solidity ^0.7.0;

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
library FlagHelper128 {
    //helper
    function getFlag(uint128 flags, uint8 pos) public pure returns (bool) {
        require(
            pos < 128,
            "position overflow. Position should be between 0 and 255"
        );
        return (flags >> pos) % 2 == 1;
    }

    function setFlag(
        uint128 flags,
        uint8 pos,
        bool value
    ) public pure returns (uint128) {
        require(
            pos < 128,
            "position overflow. Position should be between 0 and 127"
        );

        if (getFlag(flags, pos) != value) {
            if (value) {
                return flags + uint128((2**pos));
            } else {
                return flags - uint128((2**pos));
            }
        }
    }

    function exists(uint128 flags) public pure returns (bool) {
        return getFlag(flags, 0);
    }

    function setExists(uint128 flags, bool value)
        public
        pure
        returns (uint128)
    {
        return setFlag(flags, 0, value);
    }

    function isSponsored(uint128 flags) public pure returns (bool) {
        return getFlag(flags, 1);
    }

    function setSponsored(uint128 flags, bool value)
        public
        pure
        returns (uint128)
    {
        return setFlag(flags, 1, value);
    }

    function isProcessed(uint128 flags) public pure returns (bool) {
        return getFlag(flags, 2);
    }

    function setProcessed(uint128 flags, bool value)
        public
        pure
        returns (uint128)
    {
        return setFlag(flags, 2, value);
    }

    function hasPassed(uint128 flags) public pure returns (bool) {
        return getFlag(flags, 3);
    }

    function setHasPassed(uint128 flags, bool value)
        public
        pure
        returns (uint128)
    {
        return setFlag(flags, 3, value);
    }

    function isCancelled(uint128 flags) public pure returns (bool) {
        return getFlag(flags, 4);
    }

    function setCancelled(uint128 flags, bool value)
        public
        pure
        returns (uint128)
    {
        return setFlag(flags, 4, value);
    }

    function isJailed(uint128 flags) public pure returns (bool) {
        return getFlag(flags, 5);
    }

    function setJailed(uint128 flags, bool value)
        public
        pure
        returns (uint128)
    {
        return setFlag(flags, 5, value);
    }

    function isPass(uint128 flags) public pure returns (bool) {
        return getFlag(flags, 6);
    }

    function setPass(uint128 flags, bool value) public pure returns (uint128) {
        return setFlag(flags, 6, value);
    }
}
