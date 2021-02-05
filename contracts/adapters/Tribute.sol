pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/ITribute.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../extensions/Bank.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "../utils/IERC20.sol";
import "../helpers/AddressLib.sol";
import "../helpers/SafeERC20.sol";

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

contract TributeContract is ITribute, DaoConstants, MemberGuard, AdapterGuard {
    using Address for address;
    using SafeERC20 for IERC20;

    struct ProposalDetails {
        // The proposal id.
        bytes32 id;
        // The applicant address (who will receive the DAO internal tokens and become a member).
        address applicant;
        // The proposer address (who will provide the token tribute).
        address proposer;
        // The address of the DAO internal token to be minted to the applicant.
        address tokenToMint;
        // The amount requested of DAO internal tokens.
        uint256 requestAmount;
        // The address of the ERC-20 tokens provided as tribute by the proposer.
        address token;
        // The amount of tribute tokens.
        uint256 tributeAmount;
    }

    // keeps track of all tribute proposals handled by each DAO
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
     * @notice Creates a tribute proposal and escrows received tokens into the adapter.
     * @dev Applicant address must not be reserved.
     * @dev The proposer must first separately `approve` the adapter as spender of the ERC-20 tokens provided as tribute.
     * @param dao The DAO address.
     * @param proposalId The proposal id (managed by the client).
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param tokenToMint The address of the DAO internal token to be minted to the applicant.
     * @param requestAmount The amount requested of DAO internal tokens.
     * @param tokenAddr The address of the ERC-20 tokens provided as tribute by the proposer.
     * @param tributeAmount The amount of tribute tokens.
     */
    function provideTribute(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address tokenToMint,
        uint256 requestAmount,
        address tokenAddr,
        uint256 tributeAmount
    ) public override {
        require(
            dao.isNotReservedAddress(applicant),
            "applicant is reserved address"
        );
        IERC20 token = IERC20(tokenAddr);
        token.safeTransferFrom(msg.sender, address(this), tributeAmount);

        _submitTributeProposal(
            dao,
            proposalId,
            applicant,
            msg.sender,
            tokenToMint,
            requestAmount,
            tokenAddr,
            tributeAmount
        );
    }

    /**
     * @notice Sponsors a tribute proposal to start the voting process.
     * @dev Only members of the DAO can sponsor a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     * @param data Additional details about the proposal.
     */
    function sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) external override {
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        address sponsoredBy =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );
        _sponsorProposal(dao, proposalId, data, sponsoredBy, votingContract);
    }

    /**
     * @notice Sponsors a tribute proposal to start the voting process.
     * @dev Only members of the DAO can sponsor a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     * @param data Additional details about the proposal.
     * @param sponsoredBy The address of the sponsoring member.
     * @param votingContract The voting contract used by the DAO.
     */
    function _sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data,
        address sponsoredBy,
        IVoting votingContract
    ) internal {
        dao.sponsorProposal(proposalId, sponsoredBy);
        votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    /**
     * @notice Cancels a tribute proposal which marks it as processed and initiates refund of the tribute tokens to the proposer.
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been sponsored can be cancelled.
     * @dev Only proposer can cancel a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function cancelProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
    {
        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        require(proposal.id == proposalId, "proposal does not exist");
        require(
            !dao.getProposalFlag(
                proposalId,
                DaoRegistry.ProposalFlag.SPONSORED
            ),
            "proposal already sponsored"
        );
        require(
            proposal.proposer == msg.sender,
            "only proposer can cancel a proposal"
        );

        dao.processProposal(proposalId);

        _refundTribute(
            proposal.token,
            proposal.proposer,
            proposal.tributeAmount
        );
    }

    /**
     * @notice Processes a tribute proposal to handle minting and exchange of DAO internal tokens for tribute tokens (passed vote) or the refund of tribute tokens (failed vote).
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been processed are accepted.
     * @dev Only sponsored proposals with completed voting are accepted.
     * @dev ERC-20 tribute tokens must be registered with the DAO Bank (a passed proposal will check and register the token if needed).
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
    {
        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        require(proposal.id == proposalId, "proposal does not exist");
        require(
            !dao.getProposalFlag(
                proposalId,
                DaoRegistry.ProposalFlag.PROCESSED
            ),
            "proposal already processed"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        IVoting.VotingState voteResult =
            votingContract.voteResult(dao, proposalId);

        dao.processProposal(proposalId);

        if (voteResult == IVoting.VotingState.PASS) {
            BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
            _mintTokensToMember(
                dao,
                proposal.applicant,
                proposal.proposer,
                proposal.tokenToMint,
                proposal.requestAmount,
                proposal.token,
                proposal.tributeAmount
            );

            address token = proposal.token;
            if (!bank.isTokenAllowed(token)) {
                bank.registerPotentialNewToken(token);
            }
            bank.addToBalance(GUILD, token, proposal.tributeAmount);
            IERC20 erc20 = IERC20(token);
            erc20.safeTransfer(address(dao), proposal.tributeAmount);
        } else if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {
            _refundTribute(
                proposal.token,
                proposal.proposer,
                proposal.tributeAmount
            );
        } else {
            revert("proposal has not been voted on yet");
        }
    }

    /**
     * @notice Submits a tribute proposal to the DAO.
     * @dev Proposal ids must be valid and cannot be reused.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param proposer The proposer address (who will provide the token tribute).
     * @param tokenToMint The address of the DAO internal token to be minted to the applicant.
     * @param requestAmount The amount requested of DAO internal tokens.
     * @param tokenAddr The address of the ERC-20 tokens provided as tribute by the proposer.
     * @param tributeAmount The amount of tribute tokens.
     */
    function _submitTributeProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address proposer,
        address tokenToMint,
        uint256 requestAmount,
        address tokenAddr,
        uint256 tributeAmount
    ) internal {
        dao.submitProposal(proposalId);
        proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            applicant,
            proposer,
            tokenToMint,
            requestAmount,
            tokenAddr,
            tributeAmount
        );
    }

    /**
     * @notice Refunds tribute tokens to the proposer.
     * @param tokenAddr The address of the ERC-20 tokens provided as tribute by the proposer.
     * @param proposer The proposer address (who will receive back the tribute tokens).
     * @param amount The amount of tribute tokens to be refunded.
     */
    function _refundTribute(
        address tokenAddr,
        address proposer,
        uint256 amount
    ) internal {
        IERC20 token = IERC20(tokenAddr);
        token.safeTransfer(proposer, amount);
    }

    /**
     * @notice Adds DAO internal tokens to applicant's balance and creates a new member entry (if applicant is not already a member).
     * @dev Internal tokens to be minted to the applicant must be registered with the DAO Bank.
     * @dev The applicant member cannot be jailed.
     * @param dao The DAO address.
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param proposer The proposer address (who will be refunded the tribute tokens if the minting of internal tokens fails).
     * @param tokenToMint The address of the DAO internal token to be minted to the applicant.
     * @param requestAmount The amount requested of DAO internal tokens.
     * @param token The address of the ERC-20 tokens provided as tribute by the proposer.
     * @param tributeAmount The amount of tribute tokens to be refunded if the minting of internal tokens fails.
     */
    function _mintTokensToMember(
        DaoRegistry dao,
        address applicant,
        address proposer,
        address tokenToMint,
        uint256 requestAmount,
        address token,
        uint256 tributeAmount
    ) internal {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(
            bank.isInternalToken(tokenToMint),
            "it can only mint internal tokens"
        );
        require(
            !dao.getMemberFlag(applicant, DaoRegistry.MemberFlag.JAILED),
            "cannot process jailed member"
        );

        dao.potentialNewMember(applicant);

        try bank.addToBalance(applicant, tokenToMint, requestAmount) {
            // do nothing
        } catch {
            _refundTribute(token, proposer, tributeAmount);
        }
    }
}
