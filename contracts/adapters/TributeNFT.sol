pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/ITribute.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../extensions/nft/NFT.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

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

contract TributeNFTContract is
    ITribute,
    DaoConstants,
    MemberGuard,
    AdapterGuard
{
    using Address for address payable;
    struct ProposalDetails {
        // The proposal id.
        bytes32 id;
        // The applicant address (who will receive the DAO Shares and become a member; this address may be different than the actual proposer).
        address applicant;
        // The proposer address (who will provide the NFT tribute).
        address proposer;
        // The address of the NFT to be locked in the DAO in exchange for voting power.
        address nftAddr;
        // The nft token identifier.
        uint256 nftTokenId;
        // The amount requested of DAO internal tokens (SHARES).
        uint256 requestedShares;
    }

    // Keeps track of all nft tribute proposals handled by each DAO.
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable {
        revert("fallback revert");
    }

    /**
     * @notice Configures the adapter for a particular DAO.
     * @notice Registers the DAO internal token SHARES with the DAO Bank.
     * @dev Only adapters registered to the DAO can execute the function call (or if the DAO is in creation mode).
     * @dev A DAO Bank extension must exist and be configured with proper access for this adapter.
     * @param dao The DAO address.
     */
    function configureDao(DaoRegistry dao) external onlyAdapter(dao) {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        bank.registerPotentialNewInternalToken(SHARES);
    }

    function provideTribute(
        DaoRegistry,
        bytes32,
        address,
        address,
        uint256,
        address,
        uint256
    ) external pure override {
        revert("not supported operation");
    }

    /**
     * @notice Creates a tribute proposal.
     * @dev Applicant address must not be reserved.
     * @param dao The DAO address.
     * @param proposalId The proposal id (managed by the client).
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param nftAddr The address of the ERC-721 token that will be transferred to the DAO in exchange for Shares.
     * @param nftTokenId The NFT token id.
     * @param requestedShares The amount requested of DAO internal tokens (SHARES).
     */
    function provideTributeNFT(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address nftAddr,
        uint256 nftTokenId,
        uint256 requestedShares
    ) external override reentrancyGuard(dao) {
        require(
            isNotReservedAddress(applicant),
            "applicant is reserved address"
        );

        dao.submitProposal(proposalId);

        proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            applicant,
            msg.sender,
            nftAddr,
            nftTokenId,
            requestedShares
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
    ) external override reentrancyGuard(dao) {
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        address sponsoredBy =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );
        dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    /**
     * @notice Cancels a tribute proposal which marks it as processed.
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been sponsored can be cancelled.
     * @dev Only proposer can cancel a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function cancelProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reentrancyGuard(dao)
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
            "only the proposer can cancel a proposal"
        );

        dao.processProposal(proposalId);
    }

    /**
     * @notice Processes the proposal to handle minting and exchange of DAO internal tokens for tribute token (passed vote).
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been processed are accepted.
     * @dev Only sponsored proposals with completed voting are accepted.
     * @dev The proposer must first separately `approve` the NFT extension as spender of the ERC-721 token provided as tribute (so the NFT can be transferred for a passed vote).
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reentrancyGuard(dao)
    {
        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        require(proposal.id == proposalId, "proposal does not exist");

        dao.processProposal(proposalId);

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        IVoting.VotingState voteResult =
            votingContract.voteResult(dao, proposalId);

        if (voteResult == IVoting.VotingState.PASS) {
            NFTExtension nftExt = NFTExtension(dao.getExtensionAddress(NFT));
            

            // Transfers the asset to the DAO Collection, and checks if the NFT is supported/valid. (The proposer must first separately `approve` the NFT extension as spender of the ERC-721 token.)
            try nftExt.collect(proposal.nftAddr, proposal.nftTokenId) {
                // shares should be minted only if the transfer to the DAO collection is successful
                _mintSharesToNewMember(
                    dao,
                    proposal.applicant,
                    proposal.proposer,
                    proposal.nftAddr,
                    proposal.nftTokenId,
                    proposal.requestedShares
                );
            } catch {
                // do nothing
            }
        } else if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {
            // do nothing
        } else {
            revert("proposal has not been voted on");
        }
    }

    /**
     * @notice Adds DAO internal tokens (SHARES) to applicant's balance and creates a new member entry (if applicant is not already a member).
     * @dev Internal tokens to be minted to the applicant must be registered with the DAO Bank.
     * @param dao The DAO address.
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param nftAddr The address of the ERC-721 tribute token.
     * @param nftTokenId The NFT token id.
     * @param requestedShares The amount requested of DAO internal tokens (SHARES).
     */
    function _mintSharesToNewMember(
        DaoRegistry dao,
        address applicant,
        address proposer,
        address nftAddr,
        uint256 nftTokenId,
        uint256 requestedShares
    ) internal {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(
            bank.isInternalToken(SHARES),
            "SHARES token is not an internal token"
        );

        // Overflow risk may cause this to fail in which case the tribute token
        // is refunded to the proposer.
        try bank.addToBalance(applicant, SHARES, requestedShares) {
            dao.potentialNewMember(applicant);
        } catch {
            // Transfers the NFT to back to the original proposer.
            NFTExtension nftExt = NFTExtension(dao.getExtensionAddress(NFT));
            nftExt.withdrawNFT(proposer, nftAddr, nftTokenId);
        }
    }
}
