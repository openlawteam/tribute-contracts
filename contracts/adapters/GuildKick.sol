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
    // The kick status
    enum GuildKickStatus {NOT_STARTED, IN_PROGRESS, DONE}

    // State of the guild kick proposal
    struct GuildKick {
        // The address of the member to kick out of the DAO.
        address memberToKick;
        // The kick status.
        GuildKickStatus status;
        // The number of shares of the member that should be burned.
        uint256 tokensToBurn;
        // Current iteration index to control the cached for-loop.
        uint256 currentIndex;
        // The block number in which the guild kick proposal has been created.
        uint256 blockNumber;
    }

    // Keeps track of all the kicks executed per DAO.
    mapping(address => mapping(bytes32 => GuildKick)) public kicks;

    // Keeps track of the latest ongoing kick proposal per DAO to ensure only 1 kick happens at time.
    mapping(address => bytes32) public ongoingKicks;

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
     * @dev Only members that have shares can be kicked out.
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
        // Checks if the sender address is not the same as the member to kick to prevent auto kick.
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        address submittedBy =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );
        require(submittedBy != memberToKick, "you can not kick yourself");
        _submitKickProposal(dao, proposalId, memberToKick, data, submittedBy);
    }

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
        require(sharesToBurn + lootToBurn > 0, "no shares or loot");

        // Saves the state of the guild kick proposal.
        kicks[address(dao)][proposalId] = GuildKick(
            memberToKick,
            GuildKickStatus.NOT_STARTED,
            0,
            0,
            block.number
        );

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
     * @dev Only proposals that passed the voting can be completed.
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
        require(
            kick.status == GuildKickStatus.NOT_STARTED,
            "guild kick already completed or in progress"
        );

        // Checks if there is an ongoing kick proposal, only one kick can be executed at time.
        bytes32 ongoingProposalId = ongoingKicks[address(dao)];
        require(
            ongoingProposalId == bytes32(0) ||
                kicks[ongoingProposalId].status != GuildKickStatus.IN_PROGRESS,
            "another kick already in progress"
        );

        // Checks if the proposal has passed.
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal did not pass"
        );

        // Calculates the total shares, loot of the member.
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        address memberToKick = kick.memberToKick;
        // Gets the number of shares of the member
        uint256 sharesToBurn = bank.balanceOf(memberToKick, SHARES);
        // Burns / subtracts from member's balance the number of shares to burn.
        bank.subtractFromBalance(memberToKick, SHARES, sharesToBurn);
        // Burns / subtracts from member's balance the number of loot to burn.
        // bank.subtractFromBalance(memberToKick, LOOT, kick.lootToBurn);
        bank.addToBalance(memberToKick, LOOT, sharesToBurn);

        uint256 tokensToBurn = bank.balanceOf(memberToKick, LOOT);

        // Member is sent to jail to prevent any actions in the DAO anymore.
        dao.jailMember(memberToKick);

        // Set the kick proposal to done/completed.
        kick.status = GuildKickStatus.IN_PROGRESS;

        kick.blockNumber = block.number;
        kick.tokensToBurn = tokensToBurn;

        // Set the current kick proposal to done/completed.
        ongoingKicks[address(dao)] = proposalId;
    }

    /**
     * @notice Transfers the funds from the Guild account to the kicked member account.
     * @notice The amount of funds is caculated using the historical balance when the proposal was created.
     * @notice loot
     * @notice The kicked member is put in jail, so he can not perform any other action in the DAO.
     * @dev A kick proposal must be in progress.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only active members can be kicked out.
     * @dev Only proposals that passed the voting can be completed.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param toIndex The index to control the cached for-loop.
     */
    function rageKick(DaoRegistry dao, uint256 toIndex) external override {
        //should be open it so the kicked member is able to call this function?
        // Checks if the kick proposal does not exist or is not completed yet
        bytes32 ongoingProposalId = ongoingKicks[address(dao)];
        GuildKick storage kick = kicks[address(dao)][ongoingProposalId];
        uint256 kickBlockNumber = kick.blockNumber;
        require(
            kick.status == GuildKickStatus.IN_PROGRESS,
            "guild kick completed or does not exist"
        );

        // Check if the given index was already processed
        uint256 currentIndex = kick.currentIndex;
        require(currentIndex <= toIndex, "toIndex too low");

        // Get the bank extension
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));

        // Set the max index supported
        uint256 nbTokens = bank.nbTokens();
        uint256 maxIndex = toIndex;
        if (maxIndex > nbTokens) {
            maxIndex = nbTokens;
        }

        // Calculates the total shares, loot and locked loot before any internal transfers
        // it considers the locked loot to be able to calculate the fair amount to ragequit,
        // but locked loot can not be burned.
        uint256 initialTotalSharesAndLoot =
            bank.getPriorAmount(TOTAL, SHARES, kickBlockNumber) +
                bank.getPriorAmount(TOTAL, LOOT, kickBlockNumber) +
                bank.getPriorAmount(TOTAL, LOCKED_LOOT, kickBlockNumber);

        // Get the member address to kick out of the DAO
        address kickedMember = kick.memberToKick;
        // Get amount of shares and loot to burn
        uint256 sharesAndLootToBurn = kick.tokensToBurn;

        // Transfers the funds from the internal Guild account to the internal member's account.
        for (uint256 i = currentIndex; i < maxIndex; i++) {
            address token = bank.getToken(i);
            // Calculates the fair amount of funds to ragequit based on the token, shares and loot.
            // It takes into account the historical guild balance when the kick proposal was created.
            uint256 amountToRagequit =
                FairShareHelper.calc(
                    bank.getPriorAmount(GUILD, token, kickBlockNumber),
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

        kick.currentIndex = maxIndex;
        if (maxIndex == nbTokens) {
            // Burns the Loot+Shares, because the Shares were converted to Loot during the kick process.
            bank.subtractFromBalance(kickedMember, LOOT, sharesAndLootToBurn);
            // Unjail the member once the internal transfer is completed.
            dao.unjailMember(kickedMember);
            kick.status = GuildKickStatus.DONE;
        }
    }
}
