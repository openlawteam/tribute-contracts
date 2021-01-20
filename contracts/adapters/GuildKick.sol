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
    enum GuildKickStatus {NOT_STARTED, IN_PROGRESS, DONE}

    struct GuildKick {
        address memberToKick;
        GuildKickStatus status;
        uint256 sharesToBurn;
        uint256 initialTotalShares;
        bytes data;
        uint256 currentIndex;
        uint256 blockNumber;
    }

    mapping(bytes32 => GuildKick) public kicks;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function submitKickProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address memberToKick,
        bytes calldata data
    ) external override onlyMember(dao) {
        // A kick proposal is created and needs to be voted
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        dao.submitProposal(proposalId);
        kicks[proposalId] = GuildKick(
            memberToKick,
            GuildKickStatus.IN_PROGRESS,
            bank.balanceOf(memberToKick, SHARES),
            bank.balanceOf(TOTAL, SHARES),
            data,
            0,
            block.number
        );

        // start the voting process for the guild kick proposal
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
        dao.sponsorProposal(proposalId, msg.sender);
    }

    function guildKick(DaoRegistry dao, bytes32 proposalId)
        external
        override
        onlyMember(dao)
    {
        GuildKick storage kick = kicks[proposalId];
        // If it does not exist or is not in progress we expect it to fail
        require(
            kick.status == GuildKickStatus.IN_PROGRESS,
            "guild kick already completed or does not exist"
        );

        // Only active members can be kicked out, which means the member is in jail already
        address memberToKick = kick.memberToKick;
        require(dao.isActiveMember(memberToKick), "memberToKick is not active");

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal did not pass yet"
        );

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));

        // Member needs to have enough voting shares to be kicked
        uint256 sharesToLock = bank.balanceOf(memberToKick, SHARES);
        require(sharesToLock > 0, "insufficient shares");

        // send to jail and convert all voting shares into loot to remove the voting power
        bank.subtractFromBalance(memberToKick, SHARES, sharesToLock);
        bank.addToBalance(memberToKick, LOOT, sharesToLock);
        dao.jailMember(memberToKick);
        kick.status = GuildKickStatus.DONE;

        dao.processProposal(proposalId);
    }

    function rageKick(
        DaoRegistry dao,
        bytes32 proposalId,
        uint256 toIndex
    ) external override onlyMember(dao) {
        GuildKick storage kick = kicks[proposalId];
        // If does not exist or is not DONE we expect it to fail
        require(
            kick.status == GuildKickStatus.DONE,
            "guild kick not completed or does not exist"
        );

        // Check if the given index was already processed
        uint256 currentIndex = kick.currentIndex;
        require(currentIndex <= toIndex, "toIndex too low");

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        // Set the max index supported
        uint256 tokenLength = bank.nbTokens();
        uint256 maxIndex = toIndex;
        if (maxIndex > tokenLength) {
            maxIndex = tokenLength;
        }

        //Update internal Guild and Member balances
        address kickedMember = kick.memberToKick;
        uint256 initialTotalShares = kick.initialTotalShares;
        for (uint256 i = currentIndex; i < maxIndex; i++) {
            address token = bank.getToken(i);
            uint256 amountToRagequit =
                FairShareHelper.calc(
                    bank.balanceOf(GUILD, token),
                    kick.sharesToBurn,
                    initialTotalShares
                );
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
        if (maxIndex == tokenLength) {
            bank.subtractFromBalance(kickedMember, LOOT, kick.sharesToBurn); //should we subtract at each iteration or only here at end?
            dao.unjailMember(kickedMember);
        }
    }
}
