pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/nft/NFT.sol";
import "../extensions/erc1155/ERC1155TokenExtension.sol";
import "../extensions/token/erc20/InternalTokenVestingExtension.sol";
import "../adapters/interfaces/IVoting.sol";
import "../helpers/DaoHelper.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";
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

contract LendNFTContract is
    AdapterGuard,
    Reimbursable,
    IERC1155Receiver,
    IERC721Receiver
{
    struct ProcessProposal {
        DaoRegistry dao;
        bytes32 proposalId;
    }

    struct ProposalDetails {
        // The proposal id.
        bytes32 id;
        // The applicant address (who will receive the DAO internal tokens and
        // become a member; this address may be different than the actual owner
        // of the ERC-721 token being provided as tribute).
        address applicant;
        // The address of the ERC-721 or ERC-1155 token that will be transferred to the DAO
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
     * @notice Configures the adapter for a particular DAO.
     * @notice Registers the DAO internal token with the DAO Bank.
     * @dev Only adapters registered to the DAO can execute the function call (or if the DAO is in creation mode).
     * @dev A DAO Bank extension must exist and be configured with proper access for this adapter.
     * @param dao The DAO address.
     * @param token The token address that will be configured as internal token.
     */
    function configureDao(DaoRegistry dao, address token)
        external
        onlyAdapter(dao)
    {
        BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
            .registerPotentialNewInternalToken(dao, token);
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
     * @param requestAmount The amount requested of DAO internal tokens (UNITS).
     * @param data Additional information related to the tribute proposal.
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address nftAddr,
        uint256 nftTokenId,
        uint88 requestAmount,
        uint64 lendingPeriod,
        bytes memory data
    ) external reimbursable(dao) {
        require(
            DaoHelper.isNotReservedAddress(applicant),
            "applicant is reserved address"
        );

        dao.submitProposal(proposalId);
        IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
        address sponsoredBy = votingContract.getSenderAddress(
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
            0,
            requestAmount,
            lendingPeriod,
            false,
            0,
            address(0x0)
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
    // The function can be called only from the _onERC1155Received & _onERC721Received functions
    // Which are protected against reentrancy attacks.
    //slither-disable-next-line reentrancy-no-eth
    function _processProposal(DaoRegistry dao, bytes32 proposalId)
        internal
        returns (
            ProposalDetails storage proposal,
            IVoting.VotingState voteResult
        )
    {
        proposal = proposals[address(dao)][proposalId];
        //slither-disable-next-line timestamp
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

        voteResult = votingContract.voteResult(dao, proposalId);

        dao.processProposal(proposalId);
        //if proposal passes and its an erc721 token - use NFT Extension
        if (voteResult == IVoting.VotingState.PASS) {
            BankExtension bank = BankExtension(
                dao.getExtensionAddress(DaoHelper.BANK)
            );

            require(
                bank.isInternalToken(DaoHelper.UNITS),
                "UNITS token is not an internal token"
            );

            bank.addToBalance(
                dao,
                proposal.applicant,
                DaoHelper.UNITS,
                proposal.requestAmount
            );

            InternalTokenVestingExtension vesting = InternalTokenVestingExtension(
                    dao.getExtensionAddress(
                        DaoHelper.INTERNAL_TOKEN_VESTING_EXT
                    )
                );
            //slither-disable-next-line timestamp
            proposal.lendingStart = uint64(block.timestamp);
            //add vesting here
            vesting.createNewVesting(
                dao,
                proposal.applicant,
                DaoHelper.UNITS,
                proposal.requestAmount,
                proposal.lendingStart + proposal.lendingPeriod
            );

            return (proposal, voteResult);
        } else if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {
            return (proposal, voteResult);
        } else {
            revert("proposal has not been voted on yet");
        }
    }

    /**
     * @notice Sends the NFT back to the original owner.
     */
    // slither-disable-next-line reentrancy-benign
    function sendNFTBack(DaoRegistry dao, bytes32 proposalId)
        external
        reimbursable(dao)
    {
        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        require(proposal.lendingStart > 0, "lending not started");
        require(!proposal.sentBack, "already sent back");
        require(
            msg.sender == proposal.previousOwner,
            "only the previous owner can withdraw the NFT"
        );

        proposal.sentBack = true;
        //slither-disable-next-line timestamp
        uint256 elapsedTime = block.timestamp - proposal.lendingStart;
        //slither-disable-next-line timestamp
        if (elapsedTime < proposal.lendingPeriod) {
            InternalTokenVestingExtension vesting = InternalTokenVestingExtension(
                    dao.getExtensionAddress(
                        DaoHelper.INTERNAL_TOKEN_VESTING_EXT
                    )
                );

            uint256 blockedAmount = vesting.getMinimumBalanceInternal(
                proposal.lendingStart,
                proposal.lendingStart + proposal.lendingPeriod,
                proposal.requestAmount
            );
            BankExtension bank = BankExtension(
                dao.getExtensionAddress(DaoHelper.BANK)
            );

            bank.subtractFromBalance(
                dao,
                proposal.applicant,
                DaoHelper.UNITS,
                blockedAmount
            );
            vesting.removeVesting(
                dao,
                proposal.applicant,
                DaoHelper.UNITS,
                uint88(blockedAmount)
            );
        }

        // Only ERC-721 tokens will contain tributeAmount == 0
        if (proposal.tributeAmount == 0) {
            NFTExtension nftExt = NFTExtension(
                dao.getExtensionAddress(DaoHelper.NFT)
            );

            nftExt.withdrawNFT(
                dao,
                proposal.previousOwner,
                proposal.nftAddr,
                proposal.nftTokenId
            );
        } else {
            ERC1155TokenExtension tokenExt = ERC1155TokenExtension(
                dao.getExtensionAddress(DaoHelper.ERC1155_EXT)
            );
            tokenExt.withdrawNFT(
                dao,
                DaoHelper.GUILD,
                proposal.previousOwner,
                proposal.nftAddr,
                proposal.nftTokenId,
                proposal.tributeAmount
            );
        }
    }

    /**
     *  @notice required function from IERC1155 standard to be able to to receive tokens
     */
    function onERC1155Received(
        address,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        ProcessProposal memory ppS = abi.decode(data, (ProcessProposal));
        return _onERC1155Received(ppS.dao, ppS.proposalId, from, id, value);
    }

    function _onERC1155Received(
        DaoRegistry dao,
        bytes32 proposalId,
        address from,
        uint256 id,
        uint256 value
    ) internal reimbursable(dao) returns (bytes4) {
        (
            ProposalDetails storage proposal,
            IVoting.VotingState voteResult
        ) = _processProposal(dao, proposalId);

        require(proposal.nftTokenId == id, "wrong NFT");
        require(proposal.nftAddr == msg.sender, "wrong NFT addr");
        proposal.tributeAmount = value;
        proposal.previousOwner = from;

        // Strict matching is expect to ensure the vote has passed.
        // slither-disable-next-line incorrect-equality,timestamp
        if (voteResult == IVoting.VotingState.PASS) {
            address erc1155ExtAddr = dao.getExtensionAddress(
                DaoHelper.ERC1155_EXT
            );

            IERC1155 erc1155 = IERC1155(msg.sender);
            erc1155.safeTransferFrom(
                address(this),
                erc1155ExtAddr,
                id,
                value,
                ""
            );
        } else {
            IERC1155 erc1155 = IERC1155(msg.sender);
            erc1155.safeTransferFrom(address(this), from, id, value, "");
        }
        return this.onERC1155Received.selector;
    }

    /**
     *  @notice required function from IERC1155 standard to be able to to batch receive tokens
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        revert("not supported");
    }

    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        ProcessProposal memory ppS = abi.decode(data, (ProcessProposal));
        return _onERC721Received(ppS.dao, ppS.proposalId, from, tokenId);
    }

    function _onERC721Received(
        DaoRegistry dao,
        bytes32 proposalId,
        address from,
        uint256 tokenId
    ) internal reimbursable(dao) returns (bytes4) {
        (
            ProposalDetails storage proposal,
            IVoting.VotingState voteResult
        ) = _processProposal(dao, proposalId);
        require(proposal.nftTokenId == tokenId, "wrong NFT");
        require(proposal.nftAddr == msg.sender, "wrong NFT addr");
        proposal.tributeAmount = 0;
        proposal.previousOwner = from;
        IERC721 erc721 = IERC721(msg.sender);

        // Strict matching is expect to ensure the vote has passed
        // slither-disable-next-line incorrect-equality,timestamp
        if (voteResult == IVoting.VotingState.PASS) {
            NFTExtension nftExt = NFTExtension(
                dao.getExtensionAddress(DaoHelper.NFT)
            );
            erc721.approve(address(nftExt), proposal.nftTokenId);
            nftExt.collect(dao, proposal.nftAddr, proposal.nftTokenId);
        } else {
            erc721.safeTransferFrom(address(this), from, tokenId);
        }

        return this.onERC721Received.selector;
    }

    /**
     * @notice Supports ERC-165 & ERC-1155 interfaces only.
     * @dev https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1155.md
     */
    function supportsInterface(bytes4 interfaceID)
        external
        pure
        override
        returns (bool)
    {
        return
            interfaceID == this.supportsInterface.selector ||
            interfaceID == this.onERC1155Received.selector ||
            interfaceID == this.onERC721Received.selector;
    }
}
