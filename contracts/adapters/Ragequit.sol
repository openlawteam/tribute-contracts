pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../guards/MemberGuard.sol";
import "./interfaces/IRagequit.sol";
import "../utils/SafeMath.sol";

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
    using SafeMath for uint256;

    event Ragequit(
        address indexed member,
        uint256 burnedShares,
        uint256 burnedLoot
    );

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function ragequit(
        DaoRegistry dao,
        uint256 sharesToBurn,
        uint256 lootToBurn
    ) external override onlyMember(dao) {
        _burnShares(dao, msg.sender, sharesToBurn, lootToBurn);
        emit Ragequit(msg.sender, sharesToBurn, lootToBurn);
    }

    function _burnShares(
        DaoRegistry dao,
        address memberAddr,
        uint256 sharesToBurn,
        uint256 lootToBurn
    ) internal {
        //Burn if member has enough shares and loot
        require(
            dao.balanceOf(memberAddr, SHARES) >= sharesToBurn,
            "insufficient shares"
        );
        require(
            dao.balanceOf(memberAddr, LOOT) >= lootToBurn,
            "insufficient loot"
        );

        uint256 initialTotalSharesAndLoot = dao
            .balanceOf(TOTAL, SHARES)
            .add(dao.balanceOf(TOTAL, LOOT))
            .add(dao.balanceOf(TOTAL, LOCKED_LOOT));

        // burn shares and loot
        uint256 sharesAndLootToBurn = sharesToBurn.add(lootToBurn);
        dao.subtractFromBalance(memberAddr, SHARES, sharesToBurn);
        dao.subtractFromBalance(memberAddr, LOOT, lootToBurn);

        //Update internal Guild and Member balances
        address[] memory tokens = dao.tokens();
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 amountToRagequit = _fairShare(
                dao.balanceOf(GUILD, token),
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
    }

    function _fairShare(
        uint256 balance,
        uint256 shares,
        uint256 _totalShares
    ) internal pure returns (uint256) {
        require(_totalShares != 0, "total shares should not be 0");
        if (balance == 0) {
            return 0;
        }
        uint256 prod = balance * shares;
        if (prod / balance == shares) {
            // no overflow in multiplication above?
            return prod / _totalShares;
        }
        return (balance / _totalShares) * shares;
    }
}
