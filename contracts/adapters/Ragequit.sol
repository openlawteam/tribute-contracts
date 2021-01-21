pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../extensions/Bank.sol";
import "../guards/MemberGuard.sol";
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

contract RagequitContract is IRagequit, DaoConstants, MemberGuard {

    struct Ragequit {
        uint256 blockNumber;
        uint256 initialTotalSharesAndLoot;
        uint256 sharesAndLootBurnt;
    }

    mapping(address => mapping(address => Ragequit)) public ragequits;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function startRagequit(
        DaoRegistry dao,
        uint256 sharesToBurn,
        uint256 lootToBurn,
        address[] memory tokens
    ) external override onlyMember(dao) {
        address memberAddr = msg.sender;
        // TODO check if member already execute the ragequit based on the dao and ragequit mapping?
        // Ragequit storage ragequit = ragequits[address(dao)][memberAddr];
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        //Burn if member has enough shares and loot
        require(
            bank.balanceOf(memberAddr, SHARES) >= sharesToBurn,
            "insufficient shares"
        );
        require(
            bank.balanceOf(memberAddr, LOOT) >= lootToBurn,
            "insufficient loot"
        );

        _prepareRagequit(dao, memberAddr, sharesToBurn, lootToBurn, tokens);
    }

    function _prepareRagequit(
        DaoRegistry dao,
        address memberAddr,
        uint256 sharesToBurn,
        uint256 lootToBurn,
        address[] memory tokens
    ) internal {
        // burn shares and loot
        Ragequit storage ragequit = ragequits[address(dao)][memberAddr];
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        ragequit.blockNumber = block.number;
        //TODO: make this the sum of all the internal tokens
        uint256 initialTotalSharesAndLoot =
            bank.balanceOf(TOTAL, SHARES) +
            bank.balanceOf(TOTAL, LOOT) +
            bank.balanceOf(TOTAL, LOCKED_LOOT);

         uint256 sharesAndLootBurnt = sharesToBurn + lootToBurn;

        bank.subtractFromBalance(memberAddr, SHARES, sharesToBurn);
        bank.subtractFromBalance(memberAddr, LOOT, lootToBurn);

        _burnShares(dao, memberAddr, sharesAndLootBurnt, initialTotalSharesAndLoot, tokens);

    }

    function _burnShares(
        DaoRegistry dao,
        address memberAddr,
        uint256 sharesAndLootToBurn,
        uint256 initialTotalSharesAndLoot,
        address[] memory tokens
    ) internal {
        // burn shares and loot
        Ragequit storage ragequit = ragequits[address(dao)][memberAddr];

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        //Update internal Guild and Member balances
        
        uint256 blockNumber = block.number;//???
        for (uint256 i = currentIndex; i < tokens.length; i++) {
            address token = tokens[i];
            require(dao.isAllowedToken(token), "token not allowed at " + i);
            uint256 amountToRagequit =
                FairShareHelper.calc(
                    bank.getPriorAmount(GUILD, token, blockNumber),
                    sharesAndLootToBurn,
                    initialTotalSharesAndLoot
                );
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
    }
}
