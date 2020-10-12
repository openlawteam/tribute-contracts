pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

abstract contract DaoConstants {
    // Adapters
    bytes32 public constant VOTING = keccak256("voting");
    bytes32 public constant ONBOARDING = keccak256("onboarding");
    bytes32 public constant NONVOTING_ONBOARDING = keccak256(
        "nonvoting-onboarding"
    );
    bytes32 public constant FINANCING = keccak256("financing");
    bytes32 public constant MANAGING = keccak256("managing");
    bytes32 public constant RAGEQUIT = keccak256("ragequit");

    /// @notice The reserved address for Guild bank account
    address public constant GUILD = address(0xdead);
    /// @notice The reserved address for Escrow bank account
    address public constant ESCROW = address(0xbeef);
    /// @notice The reserved address for Total funds bank account
    address public constant TOTAL = address(0xbabe);
    address public constant SHARES = address(0xFF1CE);
    address public constant LOOT = address(0xB105F00D);
    address public constant LOCKED_LOOT = address(0xBAAAAAAD);
    address public constant ETH_TOKEN = address(0x0);
}
