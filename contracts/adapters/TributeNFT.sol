pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/nft/NFT.sol";
import "../extensions/erc1155/ERC1155TokenExtension.sol";
import "../extensions/bank/Bank.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";

import "../helpers/DaoHelper.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
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

contract TributeNFTContract is MemberGuard, AdapterGuard {
    using Address for address payable;
    struct ProposalDetails {
        // The proposal id.
        bytes32 id;
        // The applicant address (who will receive the DAO internal tokens and
        // become a member; this address may be different than the actual owner
        // of the ERC-721 token being provided as tribute).
        address applicant;
        // The address of the ERC-721 token that will be transferred to the DAO
        // in exchange for DAO internal tokens.
        address nftAddr;
        // The nft token identifier.
        uint256 nftTokenId;
        //amount of nftTokenId offered for tribute
        uint256 tributeAmount;
        // The amount requested of DAO internal tokens (UNITS).
        uint256 requestAmount;
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
     * @notice Registers the DAO internal token UNITS with the DAO Bank.
     * @dev Only adapters registered to the DAO can execute the function call (or if the DAO is in creation mode).
     * @dev A DAO Bank extension must exist and be configured with proper access for this adapter.
     * @param dao The DAO address.
     */
    function configureDao(DaoRegistry dao) external onlyAdapter(dao) {
        BankExtension bank =
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK));
        bank.registerPotentialNewInternalToken(DaoHelper.UNITS);
    }

    /**
     * @notice Creates and sponsors a tribute proposal to start the voting process.
     * @dev Applicant address must not be reserved.
     * @dev Only members of the DAO can sponsor a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id (managed by the client).
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param nftAddr The address of the ERC-721 or ERC 1155 token that will be transferred to the DAO in exchange for DAO internal tokens.
     * @param nftTokenId The NFT token id.
     * @param tributeAmount The amount of nftTokenId for ERC1155 tokens, if 0, it is an ERC721
     * @param requestAmount The amount requested of DAO internal tokens (UNITS).
     * @param data Additional information related to the tribute proposal.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address nftAddr,
        uint256 nftTokenId,
        uint256 tributeAmount,
        uint256 requestAmount,
        bytes memory data
    ) external reentrancyGuard(dao) {
        require(
            DaoHelper.isNotReservedAddress(applicant),
            "applicant is reserved address"
        );
        if (tributeAmount > 0) {
            require(
                _hasERC1155TokenBalance(
                    applicant,
                    nftAddr,
                    nftTokenId,
                    tributeAmount
                ),
                "erc1155: invalid token balance"
            );
        } else {
            require(
                _hasERC721Token(applicant, nftAddr, nftTokenId),
                "erc721: invalid owner"
            );
        }

        dao.submitProposal(proposalId);
        IVoting votingContract =
            IVoting(dao.getAdapterAddress(DaoHelper.VOTING));
        address sponsoredBy =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );
        dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
        DaoHelper.potentialNewMember(
            applicant,
            dao,
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
        );

        votingContract.startNewVotingForProposal(dao, proposalId, data);

        proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            applicant,
            nftAddr,
            nftTokenId,
            tributeAmount,
            requestAmount
        );
    }

    /**
     * @notice Processes the proposal to handle minting and exchange of DAO internal tokens for tribute token (passed vote).
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been processed are accepted.
     * @dev Only sponsored proposals with completed voting are accepted.
     * @dev The owner of the ERC-721 or ERC-1155 token provided as tribute must first separately `approve` the NFT extension as spender of that token (so the NFT can be transferred for a passed vote).
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        reentrancyGuard(dao)
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

        IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
        require(address(votingContract) != address(0), "adapter not found");

        IVoting.VotingState voteResult =
            votingContract.voteResult(dao, proposalId);

        dao.processProposal(proposalId);
        //if proposal passes and its an erc721 token - use NFT Extension
        if (voteResult == IVoting.VotingState.PASS) {
            BankExtension bank =
                BankExtension(dao.getExtensionAddress(DaoHelper.BANK));
            require(
                bank.isInternalToken(DaoHelper.UNITS),
                "UNITS token is not an internal token"
            );

            if (proposal.tributeAmount > 0) {
                ERC1155TokenExtension erc1155Ext =
                    ERC1155TokenExtension(
                        dao.getExtensionAddress(DaoHelper.ERC1155_EXT)
                    );
                erc1155Ext.collect(
                    proposal.applicant,
                    proposal.nftAddr,
                    proposal.nftTokenId,
                    proposal.tributeAmount
                );
            } else {
                NFTExtension nftExt =
                    NFTExtension(dao.getExtensionAddress(DaoHelper.NFT));
                nftExt.collect(proposal.nftAddr, proposal.nftTokenId);
            }

            bank.addToBalance(
                proposal.applicant,
                DaoHelper.UNITS,
                proposal.requestAmount
            );
        } else if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {
            // do nothing
        } else {
            revert("proposal has not been voted on yet");
        }
    }

    /**
     * @notice Validates the balance of the ERC1155 token
     */
    function _hasERC1155TokenBalance(
        address owner,
        address token,
        uint256 tokenId,
        uint256 balance
    ) internal view returns (bool) {
        // If the token is not an ERC1155, it will revert
        IERC1155 erc1155 = IERC1155(token);
        uint256 currentBalance = erc1155.balanceOf(owner, tokenId);
        return currentBalance > 0 && currentBalance >= balance;
    }

    /**
     * @notice Validates the owner of the ERC721 token
     */
    function _hasERC721Token(
        address owner,
        address token,
        uint256 tokenId
    ) internal view returns (bool) {
        // If the token is not an ERC721, it will revert
        IERC721 erc721 = IERC721(token);
        return erc721.ownerOf(tokenId) == owner;
    }
}
