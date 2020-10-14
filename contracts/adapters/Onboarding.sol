pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IOnboarding.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../utils/SafeMath.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "../guards/DaoGuard.sol";

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

contract OnboardingContract is
    IOnboarding,
    DaoConstants,
    MemberGuard,
    AdapterGuard,
    DaoGuard
{
    using SafeMath for uint256;

    struct ProposalDetails {
        uint256 id;
        address tokenToMint;
        uint256 amount;
        uint256 sharesRequested;
        address token;
        bool processed;
        address applicant;
    }

    struct OnboardingConfig {
        uint256 chunkSize;
        uint256 sharesPerChunk;
        address tokenAddr;
    }

    mapping(address => mapping(address => OnboardingConfig)) public configs;
    mapping(address => mapping(uint256 => ProposalDetails)) public proposals;

    function configureDao(
        DaoRegistry dao,
        address tokenAddrToMint,
        uint256 chunkSize,
        uint256 sharesPerChunk,
        address tokenAddr
    ) external onlyAdapter(dao) {
        require(chunkSize > 0, "chunkSize must be higher than 0");
        require(sharesPerChunk > 0, "sharesPerChunk must be higher than 0");
        configs[address(dao)][tokenAddrToMint].chunkSize = chunkSize;
        configs[address(dao)][tokenAddrToMint].sharesPerChunk = sharesPerChunk;
        configs[address(dao)][tokenAddrToMint].tokenAddr = tokenAddr;
    }

    function _submitMembershipProposal(
        DaoRegistry dao,
        address tokenToMint,
        address applicant,
        uint256 value,
        address token
    ) internal returns (uint256) {
        OnboardingConfig storage config = configs[address(dao)][tokenToMint];
        require(config.chunkSize > 0, "config missing");

        uint256 numberOfChunks = value.div(config.chunkSize);
        require(numberOfChunks > 0, "not sufficient funds");

        uint256 amount = numberOfChunks.mul(config.chunkSize);
        uint256 sharesRequested = numberOfChunks.mul(config.sharesPerChunk);

        _submitMembershipProposalInternal(
            dao,
            tokenToMint,
            applicant,
            sharesRequested,
            amount,
            token
        );

        return amount;
    }

    function onboard(
        DaoRegistry dao,
        address tokenToMint,
        uint256 tokenAmount
    ) external override payable {
        address tokenAddr = configs[address(dao)][tokenToMint].tokenAddr;
        if (tokenAddr == ETH_TOKEN) {
            // ETH onboarding
            require(msg.value > 0, "not enough ETH");
            // If the applicant sends ETH to onboard, use the msg.value as default token amount
            tokenAmount = msg.value;
        } else {
            IERC20 token = IERC20(tokenAddr);
            // ERC20 onboarding
            require(
                token.allowance(msg.sender, address(this)) >= tokenAmount,
                "ERC20 transfer not allowed"
            );
            require(
                token.transferFrom(msg.sender, address(this), tokenAmount),
                "ERC20 failed transferFrom"
            );
        }

        uint256 amountUsed = _submitMembershipProposal(
            dao,
            tokenToMint,
            msg.sender,
            tokenAmount,
            tokenAddr
        );

        if (amountUsed < tokenAmount) {
            uint256 amount = tokenAmount - amountUsed;
            if (tokenAddr == ETH_TOKEN) {
                msg.sender.transfer(amount);
            } else {
                IERC20 token = IERC20(tokenAddr);
                require(
                    token.transfer(msg.sender, amount),
                    "ERC20 failed transfer"
                );
            }
        }
    }

    function updateDelegateKey(DaoRegistry dao, address delegateKey) external {
        dao.updateDelegateKey(msg.sender, delegateKey);
    }

    function _submitMembershipProposalInternal(
        DaoRegistry dao,
        address tokenToMint,
        address newMember,
        uint256 sharesRequested,
        uint256 amount,
        address token
    ) internal {
        uint256 proposalId = dao.submitProposal(msg.sender);
        ProposalDetails memory p = ProposalDetails(
            proposalId,
            tokenToMint,
            amount,
            sharesRequested,
            token,
            false,
            newMember
        );
        proposals[address(dao)][proposalId] = p;
    }

    function sponsorProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        require(
            proposals[address(dao)][proposalId].id == proposalId,
            "proposal does not exist"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);

        dao.sponsorProposal(proposalId, msg.sender);
    }

    function processProposal(DaoRegistry dao, uint256 proposalId)
        external
        override
        onlyMember(dao)
    {
        require(
            proposals[address(dao)][proposalId].id == proposalId,
            "proposal does not exist"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        //TODO: we might need to process even if the vote has failed but just differently
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal need to pass"
        );

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];

        _mintTokensToMember(
            dao,
            proposal.tokenToMint,
            proposal.applicant,
            proposal.sharesRequested
        );

        dao.addToBalance(GUILD, ETH_TOKEN, proposal.amount);
        dao.processProposal(proposalId);
    }

    function _mintTokensToMember(
        DaoRegistry dao,
        address tokenToMint,
        address memberAddr,
        uint256 tokenAmount
    ) internal {
        require(
            dao.isInternalToken(tokenToMint),
            "it can only mint internal tokens"
        );
        dao.addToBalance(memberAddr, tokenToMint, tokenAmount);
    }
}
