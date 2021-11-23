pragma solidity ^0.8.0;
import "../extensions/bank/Bank.sol";
import "../core/DaoRegistry.sol";

// SPDX-License-Identifier: MIT

/**
MIT License

Copyright (c) 2021 Openlaw

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
library DaoHelper {
    /*
     * Adapters Ids
     */
    bytes32 internal constant VOTING = keccak256("voting");
    bytes32 internal constant ONBOARDING = keccak256("onboarding");
    bytes32 internal constant NONVOTING_ONBOARDING =
        keccak256("nonvoting-onboarding");
    bytes32 internal constant TRIBUTE = keccak256("tribute");
    bytes32 internal constant FINANCING = keccak256("financing");
    bytes32 internal constant MANAGING = keccak256("managing");
    bytes32 internal constant RAGEQUIT = keccak256("ragequit");
    bytes32 internal constant GUILDKICK = keccak256("guildkick");
    bytes32 internal constant CONFIGURATION = keccak256("configuration");
    bytes32 internal constant DISTRIBUTE = keccak256("distribute");
    bytes32 internal constant TRIBUTE_NFT = keccak256("tribute-nft");
    bytes32 internal constant TRANSFER_STRATEGY =
        keccak256("erc20-transfer-strategy");
    bytes32 internal constant DAO_REGISTRY_ADAPT = keccak256("daoRegistry");
    bytes32 internal constant BANK_ADAPT = keccak256("bank");
    bytes32 internal constant ERC721_ADAPT = keccak256("nft");
    bytes32 internal constant ERC1155_ADAPT = keccak256("erc1155-adpt");
    bytes32 internal constant ERC1271_ADAPT = keccak256("signatures");
    bytes32 internal constant SNAPSHOT_PROPOSAL_ADPT =
        keccak256("snapshot-proposal-adpt");
    bytes32 internal constant VOTING_HASH_ADPT = keccak256("voting-hash-adpt");
    bytes32 internal constant KICK_BAD_REPORTER_ADPT =
        keccak256("kick-bad-reporter-adpt");
    bytes32 internal constant COUPON_ONBOARDING_ADPT =
        keccak256("coupon-onboarding");
    bytes32 internal constant LEND_NFT_ADPT = keccak256("coupon-onboarding");
    bytes32 internal constant ERC20_TRANSFER_STRATEGY_ADPT =
        keccak256("erc20-transfer-strategy");

    /*
     * Extensions Ids
     */
    bytes32 internal constant BANK = keccak256("bank");
    bytes32 internal constant ERC1271 = keccak256("erc1271");
    bytes32 internal constant NFT = keccak256("nft");
    bytes32 internal constant EXECUTOR_EXT = keccak256("executor-ext");
    bytes32 internal constant INTERNAL_TOKEN_VESTING_EXT =
        keccak256("internal-token-vesting-ext");
    bytes32 internal constant ERC1155_EXT = keccak256("erc1155-ext");
    bytes32 internal constant ERC20_EXT = keccak256("erc20-ext");

    /*
     * Reserved Addresses
     */
    address internal constant GUILD = address(0xdead);
    address internal constant ESCROW = address(0x4bec);
    address internal constant TOTAL = address(0xbabe);
    address internal constant UNITS = address(0xFF1CE);
    address internal constant LOCKED_UNITS = address(0xFFF1CE);
    address internal constant LOOT = address(0xB105F00D);
    address internal constant LOCKED_LOOT = address(0xBB105F00D);
    address internal constant ETH_TOKEN = address(0x0);
    address internal constant MEMBER_COUNT = address(0xDECAFBAD);

    /*
     * Global Constants
     */

    // The maximum number of tokens supported in the Guild Bank.
    uint8 internal constant MAX_TOKENS_GUILD_BANK = 200;

    /*
     * Governor Config Roles
     */
    // Indicates the name of the dao config that must be read to get the token
    // address that grants the access to the Configuration Adapter.
    bytes32 internal constant CONFIGURATION_GOVERNOR =
        keccak256("governor.role.configuration");

    // Indicates the name of the dao config that must be read to get the token
    // address that grants the access to the Managing Adapter.
    bytes32 internal constant MANAGING_GOVERNOR =
        keccak256("governor.role.managing");

    function totalTokens(BankExtension bank) internal view returns (uint256) {
        return memberTokens(bank, TOTAL) - memberTokens(bank, GUILD); //GUILD is accounted for twice otherwise
    }

    /**
     * @notice calculates the total number of units.
     */
    function priorTotalTokens(BankExtension bank, uint256 at)
        internal
        view
        returns (uint256)
    {
        return
            priorMemberTokens(bank, TOTAL, at) -
            priorMemberTokens(bank, GUILD, at);
    }

    function memberTokens(BankExtension bank, address member)
        internal
        view
        returns (uint256)
    {
        return
            bank.balanceOf(member, UNITS) +
            bank.balanceOf(member, LOCKED_UNITS) +
            bank.balanceOf(member, LOOT) +
            bank.balanceOf(member, LOCKED_LOOT);
    }

    /**
     * @notice calculates the total number of units.
     */
    function priorMemberTokens(
        BankExtension bank,
        address member,
        uint256 at
    ) internal view returns (uint256) {
        return
            bank.getPriorAmount(member, UNITS, at) +
            bank.getPriorAmount(member, LOCKED_UNITS, at) +
            bank.getPriorAmount(member, LOOT, at) +
            bank.getPriorAmount(member, LOCKED_LOOT, at);
    }

    //helper
    function getFlag(uint256 flags, uint256 flag) internal pure returns (bool) {
        return (flags >> uint8(flag)) % 2 == 1;
    }

    function setFlag(
        uint256 flags,
        uint256 flag,
        bool value
    ) internal pure returns (uint256) {
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
    function isNotReservedAddress(address addr) internal pure returns (bool) {
        return addr != GUILD && addr != TOTAL && addr != ESCROW;
    }

    /**
     * @notice Checks if a given address is zeroed.
     */
    function isNotZeroAddress(address addr) internal pure returns (bool) {
        return addr != address(0x0);
    }

    function potentialNewMember(
        address memberAddress,
        DaoRegistry dao,
        BankExtension bank
    ) internal {
        dao.potentialNewMember(memberAddress);
        require(memberAddress != address(0x0), "invalid member address");
        if (address(bank) != address(0x0)) {
            if (bank.balanceOf(memberAddress, MEMBER_COUNT) == 0) {
                bank.addToBalance(memberAddress, MEMBER_COUNT, 1);
            }
        }
    }
}
