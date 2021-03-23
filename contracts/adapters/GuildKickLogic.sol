pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../guards/MemberGuard.sol";
import "./interfaces/IGuildKick.sol";
import "../adapters/interfaces/IVoting.sol";
import "../helpers/FairShareHelper.sol";
import "../extensions/Bank.sol";

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

contract GuildKickLogic is DaoConstants {
    /**
     * @notice Transfers the funds from the Guild account to the kicked member account based on the current kick proposal id.
     * @notice The amount of funds is caculated using the actual balance of the member to make sure the member has not ragequited.
     * @notice The member is released from jail once the funds distribution ends.
     * @dev A kick proposal must be in progress.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only active members can be kicked out.
     * @dev Only proposals that passed the voting process can be completed.
     * @param dao The dao address.
     */
    function rageKick(DaoRegistry dao, address kickedMember) internal {
        // Get the bank extension
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        uint256 nbTokens = bank.nbTokens();
        // Calculates the total shares, loot and locked loot before any internal transfers
        // it considers the locked loot to be able to calculate the fair amount to ragequit,
        // but locked loot can not be burned.
        uint256 initialTotalSharesAndLoot =
            bank.balanceOf(TOTAL, SHARES) + bank.balanceOf(TOTAL, LOOT);

        uint256 sharesToBurn = bank.balanceOf(kickedMember, SHARES);
        uint256 lootToBurn = bank.balanceOf(kickedMember, LOOT);
        uint256 sharesAndLootToBurn = sharesToBurn + lootToBurn;

        // Transfers the funds from the internal Guild account to the internal member's account.
        for (uint256 i = 0; i < nbTokens; i++) {
            address token = bank.getToken(i);
            // Calculates the fair amount of funds to ragequit based on the token, shares and loot.
            // It takes into account the historical guild balance when the kick proposal was created.
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
                    kickedMember,
                    token,
                    amountToRagequit
                );
            }
        }

        bank.subtractFromBalance(kickedMember, SHARES, sharesToBurn);
        bank.subtractFromBalance(kickedMember, LOOT, lootToBurn);
    }
}
