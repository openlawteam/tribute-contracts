pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";
import "./interfaces/IGuildKick.sol";
import "../helpers/GuildKickHelper.sol";
import "../adapters/interfaces/IVoting.sol";
import "../helpers/FairShareHelper.sol";
import "../extensions/bank/Bank.sol";

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

contract GuildKickContract is IGuildKick, AdapterGuard, Reimbursable {
    // State of the guild kick proposal
    struct GuildKick {
        // The address of the member to kick out of the DAO.
        address memberToKick;
    }

    // Keeps track of all the kicks executed per DAO.
    mapping(address => mapping(bytes32 => GuildKick)) public kicks;

    /**
     * @notice Creates a guild kick proposal, opens it for voting, and sponsors it.
     * @dev A member can not kick himself.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only members that have units or loot can be kicked out.
     * @dev Proposal ids can not be reused.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param memberToKick The member address that should be kicked out of the DAO.
     * @param data Additional information related to the kick proposal.
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address memberToKick,
        bytes calldata data
    ) external override reimbursable(dao) {
        IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
        address submittedBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );
        // Checks if the sender address is not the same as the member to kick to prevent auto kick.
        require(submittedBy != memberToKick, "use ragequit");

        // Creates a guild kick proposal.
        dao.submitProposal(proposalId);

        BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
        // Gets the number of units of the member
        uint256 unitsToBurn = bank.balanceOf(memberToKick, DaoHelper.UNITS);

        // Gets the number of loot of the member
        uint256 lootToBurn = bank.balanceOf(memberToKick, DaoHelper.LOOT);

        // Checks if the member has enough units to be converted to loot.
        // Overflow is not possible because max value for each var is 2^64
        // See bank._createNewAmountCheckpoint function
        require(unitsToBurn + lootToBurn > 0, "no units or loot");

        // Saves the state of the guild kick proposal.
        kicks[address(dao)][proposalId] = GuildKick(memberToKick);

        // Starts the voting process for the guild kick proposal.
        votingContract.startNewVotingForProposal(dao, proposalId, data);

        GuildKickHelper.lockMemberTokens(
            dao,
            kicks[address(dao)][proposalId].memberToKick
        );

        // Sponsors the guild kick proposal.
        dao.sponsorProposal(proposalId, submittedBy, address(votingContract));
    }

    /**
     * @notice Process the guild kick proposal
     * @dev Only active members can be kicked out.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reimbursable(dao)
    {
        dao.processProposal(proposalId);

        // Checks if the proposal has passed.
        IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
        require(address(votingContract) != address(0), "adapter not found");
        IVoting.VotingState votingState = votingContract.voteResult(
            dao,
            proposalId
        );
        if (votingState == IVoting.VotingState.PASS) {
            GuildKickHelper.rageKick(
                dao,
                kicks[address(dao)][proposalId].memberToKick
            );
        } else if (
            votingState == IVoting.VotingState.NOT_PASS ||
            votingState == IVoting.VotingState.TIE
        ) {
            GuildKickHelper.unlockMemberTokens(
                dao,
                kicks[address(dao)][proposalId].memberToKick
            );
        } else {
            revert("voting is still in progress");
        }
    }
}
