pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/bank/Bank.sol";
import "../../helpers/GuildKickHelper.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../interfaces/IVoting.sol";
import "./OffchainVoting.sol";
import "../../utils/Signatures.sol";

/**
MIT License

Copyright (c) 2021 Openlaw

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

contract KickBadReporterAdapter is MemberGuard {
    function sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes calldata data
    ) external {
        OffchainVotingContract votingContract = _getVotingContract(dao);
        address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );
        votingContract.sponsorChallengeProposal(dao, proposalId, sponsoredBy);
        votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    function processProposal(DaoRegistry dao, bytes32 proposalId) external {
        OffchainVotingContract votingContract = _getVotingContract(dao);
        votingContract.processChallengeProposal(dao, proposalId);

        IVoting.VotingState votingState = votingContract.voteResult(
            dao,
            proposalId
        );
        // the person has been kicked out
        if (votingState == IVoting.VotingState.PASS) {
            //slither-disable-next-line variable-scope
            (, address challengeAddress) = votingContract.getChallengeDetails(
                dao,
                proposalId
            );
            GuildKickHelper.rageKick(dao, challengeAddress);
        } else if (
            votingState == IVoting.VotingState.NOT_PASS ||
            votingState == IVoting.VotingState.TIE
        ) {
            //slither-disable-next-line uninitialized-local,variable-scope
            (uint256 units, address challengeAddress) = votingContract
                .getChallengeDetails(dao, proposalId);
            BankExtension bank = BankExtension(
                dao.getExtensionAddress(DaoHelper.BANK)
            );

            bank.subtractFromBalance(challengeAddress, DaoHelper.LOOT, units);
            bank.addToBalance(challengeAddress, DaoHelper.UNITS, units);
        } else {
            revert("vote not finished yet");
        }
    }

    function _getVotingContract(DaoRegistry dao)
        internal
        view
        returns (OffchainVotingContract)
    {
        address addr = dao.getAdapterAddress(DaoHelper.VOTING);
        return OffchainVotingContract(payable(addr));
    }
}
