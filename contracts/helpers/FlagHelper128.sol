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
    enum Flag {
        EXISTS,
        SPONSORED,
        PROCESSED,
        PASSED,
        CANCELLED,
        JAILED,
        ADD_ADAPTER,
        REMOVE_ADAPTER,
        JAIL_MEMBER,
        UNJAIL_MEMBER,
        EXECUTE,
        CANCEL_PROPOSAL,
        SUBMIT_PROPOSAL,
        SPONSOR_PROPOSAL,
        PROCESS_PROPOSAL,
        UPDATE_DELEGATE_KEY,
        REGISTER_NEW_TOKEN,
        REGISTER_NEW_INTERNAL_TOKEN,
        ADD_TO_BALANCE,
        SUB_FROM_BALANCE,
        INTERNAL_TRANSFER,
				WITHDRAW_PROPOSAL,
        WITHDRAWN
    }

    //helper
    function getFlag(uint128 flags, Flag flag) public pure returns (bool) {
        uint8 pos = uint8(flag);
        require(
            pos < 128,
            "position overflow. Position should be between 0 and 255"
        );
        return (flags >> pos) % 2 == 1;
    }

    function setFlag(
        uint128 flags,
        Flag flag,
        bool value
    ) public pure returns (uint128) {
        uint8 pos = uint8(flag);

        if (getFlag(flags, flag) != value) {
            if (value) {
                return flags + uint128((2**pos));
            } else {
                return flags - uint128((2**pos));
            }
        }
    }
}
