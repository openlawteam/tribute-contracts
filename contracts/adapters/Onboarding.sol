pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IOnboarding.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../utils/SafeMath.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";

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
    AdapterGuard
{
    using SafeMath for uint256;

    bytes32 constant ChunkSize = keccak256("onboarding.chunkSize");
    bytes32 constant SharesPerChunk = keccak256("onboarding.sharesPerChunk");
    bytes32 constant TokenAddr = keccak256("onboarding.tokenAddr");

    struct ProposalDetails {
        uint256 id;
        address tokenToMint;
        uint256 amount;
        uint256 sharesRequested;
        address token;
        address payable applicant;
        address payable proposer;
    }

    struct OnboardingConfig {
        uint256 chunkSize;
        uint256 sharesPerChunk;
        address tokenAddr;
    }

    mapping(address => mapping(uint256 => ProposalDetails)) public proposals;

    function configKey(address tokenAddrToMint, bytes32 key)
        internal
        returns (bytes32)
    {
        return keccak256(abi.encode(tokenAddrToMint, key));
    }

    function configureDao(
        DaoRegistry dao,
        address tokenAddrToMint,
        uint256 chunkSize,
        uint256 sharesPerChunk,
        address tokenAddr
    ) external onlyAdapter(dao) {
        require(chunkSize > 0, "chunkSize must be higher than 0");
        require(sharesPerChunk > 0, "sharesPerChunk must be higher than 0");

        dao.setConfiguration(configKey(tokenAddrToMint, ChunkSize), chunkSize);
        dao.setConfiguration(
            configKey(tokenAddrToMint, SharesPerChunk),
            sharesPerChunk
        );
        dao.setConfiguration(
            configKey(tokenAddrToMint, TokenAddr),
            uint256(tokenAddr)
        );

        dao.registerPotentialNewInternalToken(tokenAddrToMint);
        dao.registerPotentialNewToken(ETH_TOKEN);
    }

    function _submitMembershipProposal(
        DaoRegistry dao,
        address tokenToMint,
        address payable applicant,
        address payable proposer,
        uint256 value,
        address token
    ) internal returns (uint256) {
        uint256 chunkSize = dao.getConfiguration(
            configKey(tokenToMint, ChunkSize)
        );
        require(chunkSize > 0, "config missing");

        uint256 numberOfChunks = value.div(chunkSize);
        require(numberOfChunks > 0, "not sufficient funds");

        uint256 amount = numberOfChunks.mul(chunkSize);
        uint256 sharesRequested = numberOfChunks.mul(
            dao.getConfiguration(configKey(tokenToMint, SharesPerChunk))
        );

        _submitMembershipProposalInternal(
            dao,
            tokenToMint,
            applicant,
            proposer,
            sharesRequested,
            amount,
            token
        );

        return amount;
    }

    function onboard(
        DaoRegistry dao,
        address payable applicant,
        address tokenToMint,
        uint256 tokenAmount
    ) external override payable {
        address tokenAddr = address(
            dao.getConfiguration(configKey(tokenToMint, TokenAddr))
        );
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
            applicant,
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
        address payable newMember,
        address payable proposer,
        uint256 sharesRequested,
        uint256 amount,
        address token
    ) internal {
        uint256 proposalId = dao.submitProposal();
        proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            tokenToMint,
            amount,
            sharesRequested,
            token,
            newMember,
            proposer
        );
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

    function cancelProposal(DaoRegistry dao, uint256 _proposalId)
        external
        override
        onlyMember(dao)
    {
        require(_proposalId < type(uint64).max, "proposalId too big");
        uint64 proposalId = uint64(_proposalId);

        require(
            proposals[address(dao)][proposalId].id == proposalId,
            "proposal does not exist"
        );

        require(
            !dao.getProposalFlag(proposalId, FlagHelper.Flag.SPONSORED),
            "proposal already sponsored"
        );

        dao.processProposal(proposalId);

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        _refundTribute(proposal.token, proposal.proposer, proposal.amount);
    }

    function processProposal(DaoRegistry dao, uint256 _proposalId)
        external
        override
        onlyMember(dao)
    {
        require(_proposalId < type(uint64).max, "proposalId too big");
        uint64 proposalId = uint64(_proposalId);
        require(
            proposals[address(dao)][proposalId].id == proposalId,
            "proposal does not exist"
        );
        require(
            !dao.getProposalFlag(proposalId, FlagHelper.Flag.PROCESSED),
            "proposal already processed"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        uint256 voteResult = votingContract.voteResult(dao, proposalId);

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        if (voteResult == 2) {
            _mintTokensToMember(
                dao,
                proposal.tokenToMint,
                proposal.applicant,
                proposal.sharesRequested
            );

            dao.addToBalance(GUILD, ETH_TOKEN, proposal.amount);
        } else if (voteResult == 3) {
            _refundTribute(proposal.token, proposal.proposer, proposal.amount);
        } else {
            revert("proposal has not been voted on yet");
        }

        dao.processProposal(proposalId);
    }

    function _refundTribute(
        address tokenAddr,
        address payable proposer,
        uint256 amount
    ) internal {
        if (tokenAddr == ETH_TOKEN) {
            proposer.transfer(amount);
        } else {
            IERC20 token = IERC20(tokenAddr);
            require(
                token.transferFrom(address(this), proposer, amount),
                "ERC20 failed transferFrom"
            );
        }
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
