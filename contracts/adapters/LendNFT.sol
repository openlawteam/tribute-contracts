pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/nft/NFT.sol";
import "../extensions/erc1155/ERC1155TokenExtension.sol";
import "../extensions/token/erc20/InternalTokenVestingExtension.sol";
import "../adapters/interfaces/IVoting.sol";
import "../helpers/DaoHelper.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

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

contract LendNFTContract is MemberGuard, AdapterGuard {
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
        uint256 tributeAmount;
        // The amount requested of DAO internal tokens (UNITS).
        uint88 requestAmount;
        uint64 lendingPeriod;
        bool sentBack;
        uint64 lendingStart;
        address previousOwner;
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
     * @param nftAddr The address of the ERC-721 token that will be transferred to the DAO in exchange for DAO internal tokens.
     * @param nftTokenId The NFT token id.
     * @param tributeAmount used to send an ERC-1155 (0 means ERC-721)
     * @param owner the expected owner of the NFT
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
        address owner,
        uint88 requestAmount,
        uint64 lendingPeriod,
        bytes memory data
    ) external reentrancyGuard(dao) {
        require(
            DaoHelper.isNotReservedAddress(applicant),
            "applicant is reserved address"
        );

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
            requestAmount,
            lendingPeriod,
            false,
            0,
            owner
        );
    }

    /**
     * @notice Processes the proposal to handle minting and exchange of DAO internal tokens for tribute token (passed vote).
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been processed are accepted.
     * @dev Only sponsored proposals with completed voting are accepted.
     * @dev The owner of the ERC-721 token provided as tribute must first separately `approve` the NFT extension as spender of that token (so the NFT can be transferred for a passed vote).
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

        if (voteResult == IVoting.VotingState.PASS) {
            BankExtension bank =
                BankExtension(dao.getExtensionAddress(DaoHelper.BANK));

            uint256 tributeAmount = proposal.tributeAmount;
            
            if (tributeAmount > 0) {

                IERC1155 erc1155 = IERC1155(proposal.nftAddr);
                require(erc1155.balanceOf(proposal.previousOwner, proposal.nftTokenId) > 0, "previous owner not owner");

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

                IERC721 erc721 = IERC721(proposal.nftAddr);
                require(proposal.previousOwner == erc721.ownerOf(proposal.nftTokenId), "wrong owner");

                NFTExtension nftExt =
                    NFTExtension(dao.getExtensionAddress(DaoHelper.NFT));
                nftExt.collect(proposal.nftAddr, proposal.nftTokenId);
            }

            InternalTokenVestingExtension vesting =
                InternalTokenVestingExtension(
                    dao.getExtensionAddress(
                        DaoHelper.INTERNAL_TOKEN_VESTING_EXT
                    )
                );

            require(
                bank.isInternalToken(DaoHelper.UNITS),
                "UNITS token is not an internal token"
            );

            proposal.lendingStart = uint64(block.timestamp);

            bank.addToBalance(
                proposal.applicant,
                DaoHelper.UNITS,
                proposal.requestAmount
            );

            //add vesting here
            vesting.createNewVesting(
                proposal.applicant,
                DaoHelper.UNITS,
                proposal.requestAmount,
                proposal.lendingStart + proposal.lendingPeriod
            );
            proposals[address(dao)][proposalId].lendingStart = uint64(block.timestamp);            
        } else if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {
            // do nothing
        } else {
            revert("proposal has not been voted on yet");
        }
    }

    function sendNFTBack(DaoRegistry dao, bytes32 proposalId)
        public
        reentrancyGuard(dao)
    {
        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        require(proposal.lendingStart > 0, "lending not started");
        require(!proposal.sentBack, "already sent back");
        require(
            msg.sender == proposal.previousOwner,
            "only the previous owner can withdraw the NFT"
        );
        NFTExtension nftExt =
            NFTExtension(dao.getExtensionAddress(DaoHelper.NFT));
        BankExtension bank =
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK));

        nftExt.withdrawNFT(
            proposal.previousOwner,
            proposal.nftAddr,
            proposal.nftTokenId
        );

        InternalTokenVestingExtension vesting =
            InternalTokenVestingExtension(
                dao.getExtensionAddress(DaoHelper.INTERNAL_TOKEN_VESTING_EXT)
            );

        uint256 elapsedTime = block.timestamp - proposal.lendingStart;

        if (elapsedTime < proposal.lendingPeriod) {
            uint256 blockedAmount =
                vesting.getMinimumBalanceInternal(
                    proposal.lendingStart,
                    proposal.lendingStart + proposal.lendingPeriod,
                    proposal.requestAmount
                );
            bank.subtractFromBalance(
                proposal.applicant,
                DaoHelper.UNITS,
                blockedAmount
            );
            vesting.removeVesting(
                proposal.applicant,
                DaoHelper.UNITS,
                uint64(proposal.lendingPeriod - elapsedTime)
            );
        }

        proposal.sentBack = true;
    }
}
