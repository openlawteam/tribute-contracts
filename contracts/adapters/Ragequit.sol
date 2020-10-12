pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../guards/MemberGuard.sol";
import "./interfaces/IRagequit.sol";
import "../utils/SafeMath.sol";

contract RagequitContract is
    IRagequit,
    DaoConstants,
    MemberGuard
{
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
        // FIXME: we still don't track the index to block the ragequit if member voted YES on a non-processed proposal
        // require(canRagequit(member.highestIndexYesVote), "cannot ragequit until highest index proposal member voted YES on is processed");

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
        require(dao.balanceOf(memberAddr, SHARES) >= sharesToBurn, "insufficient shares");
        require(dao.balanceOf(memberAddr, LOOT) >= lootToBurn, "insufficient loot");

        //TODO: require(canRagequit(member.highestIndexYesVote), "cannot ragequit until highest index proposal member voted YES on is processed");

        uint256 initialTotalSharesAndLoot = dao.balanceOf(TOTAL, SHARES).add(dao.balanceOf(TOTAL, LOOT)).add(dao.balanceOf(TOTAL, LOCKED_LOOT));

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
                dao.internalTransfer(GUILD, memberAddr, token, amountToRagequit);
                //TODO: do we want to emit an event for each token transfer?
                // emit Transfer(GUILD, applicant, token, amount);
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

    // can only ragequit if the latest proposal you voted YES on has been processed
    // function canRagequit(uint256 highestIndexYesVote) public view returns (bool) {
    //     require(highestIndexYesVote < proposalQueue.length, "proposal does not exist");
    //     return proposals[proposalQueue[highestIndexYesVote]].flags[1];
    // }
}
