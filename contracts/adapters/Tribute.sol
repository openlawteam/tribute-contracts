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
        bytes32 id;
        address applicant;
        address proposer;
        address tokenToMint;
        uint256 requestAmount;
        address token;
        uint256 tributeAmount;
    }

    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function configureDao(DaoRegistry dao, address tokenAddrToMint)
        external
        onlyAdapter(dao)
    {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        bank.registerPotentialNewInternalToken(tokenAddrToMint);
    }

    function provideTributeAndSponsor(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address tokenToMint,
        uint256 requestAmount,
        address tokenAddr,
        uint256 tributeAmount,
        bytes calldata data
    ) external {
        provideTribute(
            dao,
            proposalId,
            applicant,
            tokenToMint,
            requestAmount,
            tokenAddr,
            tributeAmount
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        try
            votingContract.startNewVotingForProposal(dao, proposalId, data)
        {} catch Error(string memory reason) {
            revert(reason);
        } catch (
            bytes memory /*lowLevelData*/
        ) {
            revert("system error from voting");
        }

        address submittedBy =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );

        dao.sponsorProposal(proposalId, submittedBy);
    }

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

    function sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        dao.sponsorProposal(proposalId, msg.sender);

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

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
        uint256 voteResult = votingContract.voteResult(dao, proposalId);

        dao.processProposal(proposalId);

        if (voteResult == 2) {
            BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
            _mintTokensToMember(
                dao,
                proposal.tokenToMint,
                proposal.applicant,
                proposal.requestAmount
            );

            address token = proposal.token;
            if (!bank.isTokenAllowed(token)) {
                bank.registerPotentialNewToken(token);
            }
            bank.addToBalance(GUILD, token, proposal.tributeAmount);
            IERC20 erc20 = IERC20(token);
            erc20.safeTransfer(address(dao), proposal.tributeAmount);
        } else if (voteResult == 3 || voteResult == 1) {
            _refundTribute(
                proposal.token,
                proposal.proposer,
                proposal.tributeAmount
            );
        } else {
            revert("proposal has not been voted on yet");
        }
    }

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

    function _refundTribute(
        address tokenAddr,
        address proposer,
        uint256 amount
    ) internal {
        IERC20 token = IERC20(tokenAddr);
        token.safeTransfer(proposer, amount);
    }

    function _mintTokensToMember(
        DaoRegistry dao,
        address tokenToMint,
        address memberAddr,
        uint256 tokenAmount
    ) internal {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(
            bank.isInternalToken(tokenToMint),
            "it can only mint internal tokens"
        );
        require(
            !dao.getMemberFlag(memberAddr, DaoRegistry.MemberFlag.JAILED),
            "cannot process jailed member"
        );

        dao.potentialNewMember(memberAddr);

        bank.addToBalance(memberAddr, tokenToMint, tokenAmount);
    }
}
