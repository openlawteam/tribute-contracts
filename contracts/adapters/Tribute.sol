pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../utils/PotentialNewMember.sol";
import "../extensions/bank/Bank.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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

contract TributeContract is
    DaoConstants,
    MemberGuard,
    AdapterGuard,
    PotentialNewMember
{
    using Address for address;
    using SafeERC20 for IERC20;

    struct ProposalDetails {
        // The proposal id.
        bytes32 id;
        // The applicant address (who will receive the DAO internal tokens and
        // become a member; this address may be different than the actual owner
        // of the ERC-20 tokens being provided as tribute).
        address applicant;
        // The address of the DAO internal token to be minted to the applicant.
        address tokenToMint;
        // The amount requested of DAO internal tokens.
        uint256 requestAmount;
        // The address of the ERC-20 tokens that will be transferred to the DAO
        // in exchange for DAO internal tokens.
        address token;
        // The amount of tribute tokens.
        uint256 tributeAmount;
        // The owner of the ERC-20 tokens being provided as tribute.
        address tributeTokenOwner;
    }

    // Keeps track of all tribute proposals handled by each DAO.
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable {
        revert("fallback revert");
    }

    /**
     * @notice Configures the adapter for a particular DAO.
     * @notice Registers the DAO internal token with the DAO Bank.
     * @dev Only adapters registered to the DAO can execute the function call (or if the DAO is in creation mode).
     * @dev A DAO Bank extension must exist and be configured with proper access for this adapter.
     * @param dao The DAO address.
     * @param tokenAddrToMint The internal token address to be registered with the DAO Bank.
     */
    function configureDao(DaoRegistry dao, address tokenAddrToMint)
        external
        onlyAdapter(dao)
    {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        bank.registerPotentialNewInternalToken(tokenAddrToMint);
    }

    /**
     * @notice Creates and sponsors a tribute proposal to start the voting process.
     * @dev Applicant address must not be reserved.
     * @dev Only members of the DAO can sponsor a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id (managed by the client).
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param tokenToMint The address of the DAO internal token to be minted to the applicant.
     * @param requestAmount The amount requested of DAO internal tokens.
     * @param tokenAddr The address of the ERC-20 tokens that will be transferred to the DAO in exchange for DAO internal tokens.
     * @param tributeAmount The amount of tribute tokens.
     * @param tributeTokenOwner The owner of the ERC-20 tokens being provided as tribute.
     * @param data Additional information related to the tribute proposal.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address tokenToMint,
        uint256 requestAmount,
        address tokenAddr,
        uint256 tributeAmount,
        address tributeTokenOwner,
        bytes memory data
    ) external reentrancyGuard(dao) {
        require(
            isNotReservedAddress(applicant),
            "applicant is reserved address"
        );

        dao.submitProposal(proposalId);
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );

        dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
        potentialNewMember(
            applicant,
            dao,
            BankExtension(dao.getExtensionAddress(BANK))
        );

        votingContract.startNewVotingForProposal(dao, proposalId, data);

        proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            applicant,
            tokenToMint,
            requestAmount,
            tokenAddr,
            tributeAmount,
            tributeTokenOwner
        );
    }

    /**
     * @notice Processes a tribute proposal to handle minting and exchange of DAO internal tokens for tribute tokens (passed vote).
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been processed are accepted.
     * @dev Only sponsored proposals with completed voting are accepted.
     * @dev The owner of the ERC-20 tokens provided as tribute must first separately `approve` the adapter as spender of those tokens (so the tokens can be transferred for a passed vote).
     * @dev ERC-20 tribute tokens must be registered with the DAO Bank (a passed proposal will check and register the token if needed).
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        reentrancyGuard(dao)
    {
        ProposalDetails memory proposal = proposals[address(dao)][proposalId];
        require(proposal.id == proposalId, "proposal does not exist");
        require(
            !dao.getProposalFlag(
                proposalId,
                DaoRegistry.ProposalFlag.PROCESSED
            ),
            "proposal already processed"
        );

        IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
        require(address(votingContract) != address(0), "adapter not found");

        IVoting.VotingState voteResult = votingContract.voteResult(
            dao,
            proposalId
        );

        dao.processProposal(proposalId);

        if (voteResult == IVoting.VotingState.PASS) {
            BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
            address tokenToMint = proposal.tokenToMint;
            address applicant = proposal.applicant;
            uint256 tributeAmount = proposal.tributeAmount;
            address tributeTokenOwner = proposal.tributeTokenOwner;
            require(
                bank.isInternalToken(tokenToMint),
                "it can only mint internal tokens"
            );

            if (!bank.isTokenAllowed(proposal.token)) {
                bank.registerPotentialNewToken(proposal.token);
            }
            IERC20 erc20 = IERC20(proposal.token);
            erc20.safeTransferFrom(
                tributeTokenOwner,
                address(bank),
                tributeAmount
            );

            bank.addToBalance(applicant, tokenToMint, proposal.requestAmount);
            bank.addToBalance(GUILD, proposal.token, tributeAmount);
        } else if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {
            //do nothing
        } else {
            revert("proposal has not been voted on yet");
        }
    }
}
