pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../guards/MemberGuard.sol";
import "../guards/ReentrancyGuard.sol";
import "./interfaces/IRagequit.sol";

contract RagequitContract is
    IRagequit,
    DaoConstants,
    MemberGuard,
    ReentrancyGuard
{
    event Ragequit(address indexed member, uint256 burnedShares, uint256 lootToBurn);

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function ragequit(DaoRegistry dao, uint256 sharesToBurn, uint256 lootToBurn)
        external
        override
        nonReentrant
        onlyMember(dao)
    {
        // FIXME: we still don't track the index to block the ragequit if member voted YES on a non-processed proposal
        // require(canRagequit(member.highestIndexYesVote), "cannot ragequit until highest index proposal member voted YES on is processed");

        dao.burnShares(msg.sender, sharesToBurn, lootToBurn);

        emit Ragequit(msg.sender, sharesToBurn, lootToBurn);
    }

    // can only ragequit if the latest proposal you voted YES on has been processed
    // function canRagequit(uint256 highestIndexYesVote) public view returns (bool) {
    //     require(highestIndexYesVote < proposalQueue.length, "proposal does not exist");
    //     return proposals[proposalQueue[highestIndexYesVote]].flags[1];
    // }
}
