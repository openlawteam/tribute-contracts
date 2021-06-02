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
    bytes32 internal constant VOTING = keccak256("voting");
    bytes32 internal constant ONBOARDING = keccak256("onboarding");
    bytes32 internal constant NONVOTING_ONBOARDING =
        keccak256("nonvoting-onboarding");
    bytes32 internal constant TRIBUTE = keccak256("tribute");
    bytes32 internal constant FINANCING = keccak256("financing");
    bytes32 internal constant MANAGING = keccak256("managing");
    bytes32 internal constant RAGEQUIT = keccak256("ragequit");
    bytes32 internal constant GUILDKICK = keccak256("guildkick");
    bytes32 internal constant EXECUTION = keccak256("execution");
    bytes32 internal constant CONFIGURATION = keccak256("configuration");
    bytes32 internal constant DISTRIBUTE = keccak256("distribute");
    bytes32 internal constant TRIBUTE_NFT = keccak256("tribute-nft");

    // Extensions
    bytes32 internal constant BANK = keccak256("bank");
    bytes32 internal constant NFT = keccak256("nft");
    bytes32 internal constant ERC20_EXT = keccak256("erc20-ext");

    // Reserved Addresses
    address internal constant GUILD = address(0xdead);
    address internal constant TOTAL = address(0xbabe);
    address internal constant ESCROW = address(0x4bec);
    address internal constant UNITS = address(0xFF1CE);
    address internal constant LOOT = address(0xB105F00D);
    address internal constant ETH_TOKEN = address(0x0);
    address internal constant MEMBER_COUNT = address(0xDECAFBAD);

    uint8 internal constant MAX_TOKENS_GUILD_BANK = 200;

    //helper
    function getFlag(uint256 flags, uint256 flag) public pure returns (bool) {
        return (flags >> uint8(flag)) % 2 == 1;
    }

    function setFlag(
        uint256 flags,
        uint256 flag,
        bool value
    ) public pure returns (uint256) {
        if (getFlag(flags, flag) != value) {
            if (value) {
                return flags + 2**flag;
            } else {
                return flags - 2**flag;
            }
        } else {
            return flags;
        }
    }

    /**
     * @notice Checks if a given address is reserved.
     */
    function isNotReservedAddress(address addr) public pure returns (bool) {
        return addr != GUILD && addr != TOTAL && addr != ESCROW;
    }

    /**
     * @notice Checks if a given address is zeroed.
     */
    function isNotZeroAddress(address addr) public pure returns (bool) {
        return addr != address(0x0);
    }
}
