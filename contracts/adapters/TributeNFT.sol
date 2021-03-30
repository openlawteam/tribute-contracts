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
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

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
    AdapterGuard,
    IERC721Receiver
{
    using Address for address payable;
    struct ProposalDetails {
        // The proposal id.
        bytes32 id;
        // The applicant address (who will receive the DAO Shares and become a member).
        address applicant;
        // The address of the NFT to be locked in the DAO in exchange for voting power.
        address nftAddr;
        // The nft token identifier.
        uint256 nftTokenId;
        // The amount of shares requested to lock the NFT in exchange of DAO internal tokens.
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

    function configureDao(DaoRegistry dao, address nftToCollect)
        external
        onlyAdapter(dao)
    {
        NFTExtension nftExt = NFTExtension(dao.getExtensionAddress(NFT));
        nftExt.registerPotentialNewNFT(nftToCollect);
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
     * @notice Creates a tribute proposal and escrows received tokens into the adapter.
     * @dev Applicant address must not be reserved.
     * @dev The proposer must first separately `approve` the adapter as spender of the ERC-20 tokens provided as tribute.
     * @param dao The DAO address.
     * @param proposalId The proposal id (managed by the client).
     * @param nftAddr The address of the ERC-721 NFT DAO that will be locked in the DAO in exchange for Shares.
     * @param nftTokenId The NFT token id.
     * @param requestedShares The amount of Shares requested of DAO as voting power.
     */
    function provideTributeNFT(
        DaoRegistry dao,
        bytes32 proposalId,
        address nftAddr,
        uint256 nftTokenId,
        uint256 requestedShares
    ) external override {
        address applicant = msg.sender;
        require(
            isNotReservedAddress(applicant),
            "applicant is reserved address"
        );

        NFTExtension nftExt = NFTExtension(dao.getExtensionAddress(NFT));
        require(nftExt.isNFTAllowed(nftAddr), "nft not allowed");

        dao.submitProposal(proposalId);

        // Transfers the NFT to the Escrow Adapter, and checks if the NFT is supported/valid.
        IERC721 erc721 = IERC721(nftAddr);
        erc721.safeTransferFrom(applicant, address(this), nftTokenId);

        proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            applicant,
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
    ) external override {
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        address sponsoredBy =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );
        dao.sponsorProposal(proposalId, sponsoredBy);
        votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    /**
     * @notice Cancels a tribute proposal which marks it as processed and returns the NFT to the original ow.
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
            proposal.applicant == msg.sender,
            "only the applicant can cancel a proposal"
        );

        dao.processProposal(proposalId);

        // Transfers the NFT to back to the original owner.
        IERC721 erc721 = IERC721(proposal.nftAddr);
        erc721.safeTransferFrom(
            address(this),
            proposal.applicant,
            proposal.nftTokenId
        );
    }

    /**
     * @notice Processes the proposal to handle minting and exchange of DAO internal tokens for tribute tokens (passed vote) or the return the NFT to the original owner (failed vote).
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been processed are accepted.
     * @dev Only sponsored proposals with completed voting are accepted.
     * @dev ERC-721 tribute tokens must be registered with the DAO Bank.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
    {
        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        require(proposal.id == proposalId, "proposal does not exist");

        dao.processProposal(proposalId);

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        IVoting.VotingState voteResult =
            votingContract.voteResult(dao, proposalId);

        IERC721 erc721 = IERC721(proposal.nftAddr);

        if (voteResult == IVoting.VotingState.PASS) {
            _mintSharesToNewMember(
                dao,
                proposal.applicant,
                proposal.nftAddr,
                proposal.nftTokenId,
                proposal.requestedShares
            );

            NFTExtension nftExt = NFTExtension(dao.getExtensionAddress(NFT));
            // Approve the Ext Address to move the asset
            erc721.approve(address(nftExt), proposal.nftTokenId);
            // Transfers the asset to the DAO Collection, and checks if the NFT is supported/valid.
            nftExt.transferFrom(
                address(this),
                proposal.nftAddr,
                proposal.nftTokenId
            );
        } else if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {
            // Transfers the asset to back to the original owner.
            erc721.safeTransferFrom(
                address(this),
                proposal.applicant,
                proposal.nftTokenId
            );
        } else {
            revert("proposal has not been voted on");
        }
    }

    function _mintSharesToNewMember(
        DaoRegistry dao,
        address applicant,
        address nftAddr,
        uint256 nftTokenId,
        uint256 requestedShares
    ) internal {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(
            bank.isInternalToken(SHARES),
            "SHARES token is not an internal token"
        );

        dao.potentialNewMember(applicant);

        // Overflow risk may cause this to fail in which case the tribute tokens
        // are refunded to the proposer.
        try bank.addToBalance(applicant, SHARES, requestedShares) {
            // do nothing
        } catch {
            // Transfers the NFT to back to the original owner.
            IERC721 erc721 = IERC721(nftAddr);
            erc721.safeTransferFrom(address(this), applicant, nftTokenId);
        }
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
