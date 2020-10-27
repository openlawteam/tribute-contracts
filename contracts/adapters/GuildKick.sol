pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../guards/MemberGuard.sol";
import "./interfaces/IGuildKick.sol";
import "../utils/SafeMath.sol";
import "../adapters/interfaces/IVoting.sol";

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

contract GuildKickContract is IGuildKick, DaoConstants, MemberGuard {
    using SafeMath for uint256;
    enum GuildKickStatus {IN_PROGRESS, DONE}

    struct GuildKick {
        uint64 proposalId;
        GuildKickStatus status;
        bytes data;
    }

    mapping(address => GuildKick) public kicks;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function submitKickProposal(
        DaoRegistry dao,
        address memberToKick,
        bytes calldata data
    ) external override onlyMember(dao) returns (uint256) {
        // A kick proposal is created and needs to be voted
        uint64 proposalId = dao.submitProposal(msg.sender);

        GuildKick storage guildKick = kicks[memberToKick];
        guildKick.proposalId = proposalId;
        guildKick.status = GuildKickStatus.IN_PROGRESS;
        guildKick.data = data;

        // start the voting process for the guild kick proposal
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
        dao.sponsorProposal(proposalId, msg.sender);

        return proposalId;
    }

    function kick(
        DaoRegistry dao,
        address memberToKick,
        uint64 proposalId
    ) external override onlyMember(dao) {
        GuildKick storage guildKick = kicks[memberToKick];
        // If status is empty or DONE we expect it to fail
        require(
            guildKick.status == GuildKickStatus.IN_PROGRESS,
            "guild kick already completed"
        );

        // Only active members should be able to call the kick
        require(
            dao.isActiveMember(memberToKick),
            "memberToKick is not active"
        );

        // If the proposal id does not match the storage one, we expect it to fail
        require(
            guildKick.proposalId == proposalId,
            "wrong kick proposal"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal did not pass yet"
        );

        // Member needs to have enough voting shares to be kicked
        uint256 sharesToLock = dao.balanceOf(memberToKick, SHARES);
        require(sharesToLock > 0, "insufficient shares");

        // send to jail and convert all voting shares into loot to remove the voting power
        dao.subtractFromBalance(memberToKick, SHARES, sharesToLock);
        dao.addToBalance(memberToKick, LOOT, sharesToLock);
        dao.jailMember(memberToKick);
        guildKick.status = GuildKickStatus.DONE;

        dao.processProposal(proposalId);
    }
    
}
