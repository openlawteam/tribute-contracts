pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../extensions/Bank.sol";
import "./interfaces/IRagequit.sol";
import "../helpers/FairShareHelper.sol";

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

contract RagequitContract is IRagequit, DaoConstants {
    /**
     * @notice Event emitted when a member of the DAO executes a ragequit with all or parts of the member's shares/loot.
     */
    event MemberRagequit(
        address memberAddr,
        uint256 burnedShares,
        uint256 burnedLoot,
        uint256 initialTotalSharesAndLoot
    );

    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable {
        revert("fallback revert");
    }

    /**
     * @notice Allows a member or advisor of the DAO to opt out by burning the proportional amount of shares/loot of the member.
     * @notice Anyone is allowed to call this function, but only members and advisors that have shares are able to execute the entire ragequit process.
     * @dev The sum of sharesToBurn and lootToBurn have to be greater than zero.
     * @dev The member can not be in jail to execute a ragequit.
     * @dev The member becomes an inactive member of the DAO once all the shares/loot are burned.
     * @dev If the member provides an invalid/not allowed token, the entire processed is reverted.
     * @param dao The dao address that the member is part of.
     * @param sharesToBurn The amount of shares of the member that must be converted into funds.
     * @param lootToBurn The amount of loot of the member that must be converted into funds.
     * @param tokens The array of tokens that the funds should be sent to.
     */
    function ragequit(
        DaoRegistry dao,
        uint256 sharesToBurn,
        uint256 lootToBurn,
        address[] memory tokens
    ) external override {
        // Checks if the are enough shares and/or loot to burn
        require(sharesToBurn + lootToBurn > 0, "insufficient shares/loot");
        // Gets the delegated address, otherwise returns the sender address.
        address memberAddr = dao.getAddressIfDelegated(msg.sender);

        // Checks if the member is not in jail
        require(
            !dao.getMemberFlag(memberAddr, DaoRegistry.MemberFlag.JAILED),
            "jailed member can not ragequit"
        );

        // Instantiates the Bank extension to handle the internal balance checks and transfers.
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        // Check if member has enough shares to burn.
        require(
            bank.balanceOf(memberAddr, SHARES) >= sharesToBurn,
            "insufficient shares"
        );
        // Check if the member has enough loot to burn.
        require(
            bank.balanceOf(memberAddr, LOOT) >= lootToBurn,
            "insufficient loot"
        );

        // Start the ragequit process by updating the member's internal account balances.
        _prepareRagequit(memberAddr, sharesToBurn, lootToBurn, tokens, bank);
    }

    /**
     * @notice Subtracts from the internal member's account the proportional shares and/or loot.
     * @param memberAddr The member address that wants to burn the shares and/or loot.
     * @param sharesToBurn The amount of shares of the member that must be converted into funds.
     * @param lootToBurn The amount of loot of the member that must be converted into funds.
     * @param tokens The array of tokens that the funds should be sent to.
     * @param bank The bank extension.
     */
    function _prepareRagequit(
        address memberAddr,
        uint256 sharesToBurn,
        uint256 lootToBurn,
        address[] memory tokens,
        BankExtension bank
    ) internal {
        // Calculates the total shares, loot and locked loot before any internal transfers
        // it considers the locked loot to be able to calculate the fair amount to ragequit,
        // but locked loot can not be burned.
        uint256 initialTotalSharesAndLoot =
            bank.balanceOf(TOTAL, SHARES) +
                bank.balanceOf(TOTAL, LOOT) +
                bank.balanceOf(TOTAL, LOCKED_LOOT);

        // Burns / subtracts from member's balance the number of shares to burn.
        bank.subtractFromBalance(memberAddr, SHARES, sharesToBurn);
        // Burns / subtracts from member's balance the number of loot to burn.
        bank.subtractFromBalance(memberAddr, LOOT, lootToBurn);

        // Completes the ragequit process by updating the GUILD internal balance based on each provided token.
        _burnShares(
            memberAddr,
            sharesToBurn,
            lootToBurn,
            initialTotalSharesAndLoot,
            tokens,
            bank
        );
    }

    /**
     * @notice Subtracts from the bank's account the proportional shares and/or loot,
     * @notice and transfers the funds to the member's internal account based on the provided tokens.
     * @param memberAddr The member address that wants to burn the shares and/or loot.
     * @param sharesToBurn The amount of shares of the member that must be converted into funds.
     * @param lootToBurn The amount of loot of the member that must be converted into funds.
     * @param initialTotalSharesAndLoot The sum of shares and loot before internal transfers.
     * @param tokens The array of tokens that the funds should be sent to.
     * @param bank The bank extension.
     */
    function _burnShares(
        address memberAddr,
        uint256 sharesToBurn,
        uint256 lootToBurn,
        uint256 initialTotalSharesAndLoot,
        address[] memory tokens,
        BankExtension bank
    ) internal {
        // Calculates the total amount of shares and loot to burn
        uint256 sharesAndLootToBurn = sharesToBurn + lootToBurn;

        // Transfers the funds from the internal Guild account to the internal member's account based on each token provided by the member.
        // The provided token must be supported/allowed by the Guild Bank, otherwise it reverts the entire transaction.
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            // Checks if the token is supported by the Guild Bank.
            require(bank.isTokenAllowed(token), "token not allowed");

            // Calculates the fair amount of funds to ragequit based on the token, shares and loot
            uint256 amountToRagequit =
                FairShareHelper.calc(
                    bank.balanceOf(GUILD, token),
                    sharesAndLootToBurn,
                    initialTotalSharesAndLoot
                );

            // Ony execute the internal transfer if the user has enough funds to receive.
            if (amountToRagequit > 0) {
                // gas optimization to allow a higher maximum token limit
                // deliberately not using safemath here to keep overflows from preventing the function execution
                // (which would break ragekicks) if a token overflows,
                // it is because the supply was artificially inflated to oblivion, so we probably don"t care about it anyways
                bank.internalTransfer(
                    GUILD,
                    memberAddr,
                    token,
                    amountToRagequit
                );
            }
        }

        // Once the shares and loot were burned, and the transfers completed, emit an event to indicate a successfull operation.
        emit MemberRagequit(
            memberAddr,
            sharesToBurn,
            lootToBurn,
            initialTotalSharesAndLoot
        );
    }
}
