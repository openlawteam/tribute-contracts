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

abstract contract DaoConstants {
    // Adapters
    bytes32 public constant VOTING = keccak256("voting");
    bytes32 public constant ONBOARDING = keccak256("onboarding");
    bytes32 public constant NONVOTING_ONBOARDING =
        keccak256("nonvoting-onboarding");
    bytes32 public constant FINANCING = keccak256("financing");
    bytes32 public constant MANAGING = keccak256("managing");
    bytes32 public constant RAGEQUIT = keccak256("ragequit");
    bytes32 public constant GUILDKICK = keccak256("guildkick");

    /// @notice The reserved address for Guild bank account
    address public constant GUILD = address(0xdead);
    /// @notice The reserved address for Total funds bank account
    address public constant TOTAL = address(0xbabe);
    address public constant SHARES = address(0xFF1CE);
    address public constant LOOT = address(0xB105F00D);
    address public constant LOCKED_LOOT = address(0xBAAAAAAD);
    address public constant ETH_TOKEN = address(0x0);
}
