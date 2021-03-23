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

contract GuildKickContract is IGuildKick, DaoConstants, MemberGuard {
    // State of the guild kick proposal
    struct GuildKick {
        // The address of the member to kick out of the DAO.
        address memberToKick;
    }

    // Keeps track of all the kicks executed per DAO.
    mapping(address => mapping(bytes32 => GuildKick)) public kicks;

    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable {
        revert("fallback revert");
    }

    /**
     * @notice Creates a guild kick proposal, opens it for voting, and sponsors it.
     * @dev A member can not kick himself.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only members that have shares or loot can be kicked out.
     * @dev Proposal ids can not be reused.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param memberToKick The member address that should be kicked out of the DAO.
     * @param data Additional information related to the kick proposal.
     */
    function submitKickProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address memberToKick,
        bytes calldata data
    ) external override {
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        address submittedBy =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );
        // Checks if the sender address is not the same as the member to kick to prevent auto kick.
        require(submittedBy != memberToKick, "use ragequit");

        _submitKickProposal(dao, proposalId, memberToKick, data, submittedBy);
    }

    /**
     * @notice Converts the shares into loot to remove the voting power, and sponsors the kick proposal.
     * @dev Only members that have shares or loot can be kicked out.
     * @dev Proposal ids can not be reused.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param memberToKick The member address that should be kicked out of the DAO.
     * @param data Additional information related to the kick proposal.
     * @param submittedBy The address of the individual that created the kick proposal.
     */
    function _submitKickProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address memberToKick,
        bytes calldata data,
        address submittedBy
    ) internal onlyMember2(dao, submittedBy) {
        // Creates a guild kick proposal.
        dao.submitProposal(proposalId);

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        // Gets the number of shares of the member
        uint256 sharesToBurn = bank.balanceOf(memberToKick, SHARES);

        // Gets the number of loot of the member
        uint256 lootToBurn = bank.balanceOf(memberToKick, LOOT);

        // Checks if the member has enough shares to be converted to loot.
        // Overflow is not possible because max value for each var is 2^64
        // See bank._createNewAmountCheckpoint function
        require(sharesToBurn + lootToBurn > 0, "no shares or loot");

        // Saves the state of the guild kick proposal.
        kicks[address(dao)][proposalId] = GuildKick(memberToKick);

        // Starts the voting process for the guild kick proposal.
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);

        // Sponsors the guild kick proposal.

        dao.sponsorProposal(proposalId, submittedBy);
    }

    /**
     * @notice Process the guild kick proposal, converts the member's shares into loot.
     * @notice The kicked member is put in jail, so he can not perform any other action in the DAO.
     * @dev A kick proposal must be in progress.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only active members can be kicked out.
     * @dev Only proposals that passed the voting can be set to In Progress status.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
    {
        dao.processProposal(proposalId);
        // Checks if the proposal exists or is not in progress yet.
        GuildKick storage kick = kicks[address(dao)][proposalId];

        // Checks if the proposal has passed.
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal did not pass"
        );

        _rageKick(dao, proposalId);
    }

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
    function _rageKick(DaoRegistry dao, bytes32 proposalId) internal {
        GuildKick storage kick = kicks[address(dao)][proposalId];

        // Get the bank extension
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        uint256 nbTokens = bank.nbTokens();
        address kickedMember = kick.memberToKick;
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
