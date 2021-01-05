pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
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
    enum RagequitStatus {NOT_STARTED, IN_PROGRESS, DONE}

    struct Ragequit {
        uint256 blockNumber;
        RagequitStatus status;
        uint256 initialTotalSharesAndLoot;
        uint256 sharesAndLootBurnt;
        uint256 currentIndex;
    }

    mapping(address => Ragequit) public ragequits;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function startRagequit(
        DaoRegistry dao,
        uint256 sharesToBurn,
        uint256 lootToBurn
    ) external override onlyMember(dao) {
        address memberAddr = msg.sender;

        require(
            ragequits[memberAddr].status != RagequitStatus.IN_PROGRESS,
            "rage quit already in progress"
        );
        //Burn if member has enough shares and loot
        require(
            dao.balanceOf(memberAddr, SHARES) >= sharesToBurn,
            "insufficient shares"
        );
        require(
            dao.balanceOf(memberAddr, LOOT) >= lootToBurn,
            "insufficient loot"
        );

        _prepareRagequit(dao, memberAddr, sharesToBurn, lootToBurn);
    }

    function _prepareRagequit(
        DaoRegistry dao,
        address memberAddr,
        uint256 sharesToBurn,
        uint256 lootToBurn
    ) internal {
        // burn shares and loot

        Ragequit storage ragequit = ragequits[memberAddr];

        ragequit.status = RagequitStatus.IN_PROGRESS;
        ragequit.blockNumber = block.number;
        //TODO: make this the sum of all the internal tokens
        ragequit.initialTotalSharesAndLoot =
            dao.balanceOf(TOTAL, SHARES) +
            dao.balanceOf(TOTAL, LOOT) +
            dao.balanceOf(TOTAL, LOCKED_LOOT);

        ragequit.sharesAndLootBurnt = sharesToBurn + lootToBurn;
        ragequit.currentIndex = 0;

        dao.subtractFromBalance(memberAddr, SHARES, sharesToBurn);
        dao.subtractFromBalance(memberAddr, LOOT, lootToBurn);

        dao.jailMember(memberAddr);
    }

    function burnShares(
        DaoRegistry dao,
        address memberAddr,
        uint256 toIndex
    ) external override {
        // burn shares and loot
        Ragequit storage ragequit = ragequits[memberAddr];
        require(
            ragequit.status == RagequitStatus.IN_PROGRESS,
            "ragequit not in progress"
        );
        uint256 currentIndex = ragequit.currentIndex;
        require(currentIndex <= toIndex, "toIndex too low");
        uint256 sharesAndLootToBurn = ragequit.sharesAndLootBurnt;
        uint256 initialTotalSharesAndLoot = ragequit.initialTotalSharesAndLoot;

        //Update internal Guild and Member balances
        uint256 tokenLength = dao.nbTokens();
        uint256 maxIndex = toIndex;
        if (maxIndex > tokenLength) {
            maxIndex = tokenLength;
        }
        uint256 blockNumber = ragequit.blockNumber;
        for (uint256 i = currentIndex; i < maxIndex; i++) {
            address token = dao.getToken(i);
            uint256 amountToRagequit =
                FairShareHelper.calc(
                    dao.getPriorAmount(GUILD, token, blockNumber),
                    sharesAndLootToBurn,
                    initialTotalSharesAndLoot
                );
            if (amountToRagequit > 0) {
                // gas optimization to allow a higher maximum token limit
                // deliberately not using safemath here to keep overflows from preventing the function execution
                // (which would break ragekicks) if a token overflows,
                // it is because the supply was artificially inflated to oblivion, so we probably don"t care about it anyways
                dao.internalTransfer(
                    GUILD,
                    memberAddr,
                    token,
                    amountToRagequit
                );
            }
        }

        ragequit.currentIndex = maxIndex;
        if (maxIndex == tokenLength) {
            ragequit.status = RagequitStatus.DONE;
            dao.unjailMember(memberAddr);
        }
    }
}
