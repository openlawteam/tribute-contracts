pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IOnboarding.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
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

contract BondingCurveContract is
    DaoConstants,
    MemberGuard,
    AdapterGuard
{
    bytes32 constant ChunkSize = keccak256("onboarding.chunkSize");
    bytes32 constant SharesPerChunk = keccak256("onboarding.sharesPerChunk");
    bytes32 constant TokenAddr = keccak256("onboarding.tokenAddr");
    bytes32 constant MaximumChunks = keccak256("onboarding.maximumChunks");

    struct OnboardingDetails {
        uint256 chunkSize;
        uint256 numberOfChunks;
        uint256 sharesPerChunk;
        uint256 amount;
        uint256 sharesRequested;
        uint256 totalShares;
    }

    mapping(address => uint256) public shares;

    function configKey(address tokenAddrToMint, bytes32 key)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(tokenAddrToMint, key));
    }

    function configureDao(
        DaoRegistry dao,
        address tokenAddrToMint,
        uint256 chunkSize,
        uint256 sharesPerChunk,
        uint256 maximumChunks,
        address tokenAddr
    ) external onlyAdapter(dao) {
        require(maximumChunks > 0, "maximumChunks must be higher than 0");
        require(chunkSize > 0, "chunkSize must be higher than 0");
        require(sharesPerChunk > 0, "sharesPerChunk must be higher than 0");

        dao.setConfiguration(
            configKey(tokenAddrToMint, MaximumChunks),
            maximumChunks
        );
        dao.setConfiguration(configKey(tokenAddrToMint, ChunkSize), chunkSize);
        dao.setConfiguration(
            configKey(tokenAddrToMint, SharesPerChunk),
            sharesPerChunk
        );
        dao.setAddressConfiguration(
            configKey(tokenAddrToMint, TokenAddr),
            tokenAddr
        );

        dao.registerPotentialNewInternalToken(tokenAddrToMint);
        dao.registerPotentialNewToken(tokenAddr);
    }

    function contributeCapital(address contributionToken, address tokenToMint, uint256 contribution) override onlyMember(dao) {
        if (tokenAddr == ETH_TOKEN) {
            // ETH contribution
            require(msg.value > 0, "not enough ETH");
            // If the applicant sends ETH to onboard, use the msg.value as default token amount
            tokenAmount = msg.value;
        } else {
            IERC20 token = IERC20(tokenAddr);
            // ERC20 contribution
            require(
                token.allowance(msg.sender, address(this)) >= tokenAmount,
                "ERC20 transfer not allowed"
            );
            require(
                token.transferFrom(msg.sender, address(this), tokenAmount),
                "ERC20 failed transferFrom"
            );
        }
        
        uint256 tokenAmount = curvePrice * dao.balanceOfbalanceOf(TOTAL, tokenToMint);
        dao.addToBalance(msg.sender, tokenToMint, tokenAmount);
        curvePrice++;
    }

    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
    {
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

            address token = proposal.token;
            if (token == ETH_TOKEN) {
                dao.addToBalance{value: proposal.amount}(
                    GUILD,
                    token,
                    proposal.amount
                );
            } else {
                dao.addToBalance(GUILD, token, proposal.amount);

                IERC20 erc20 = IERC20(token);
                erc20.transfer(address(dao), proposal.amount);
            }

            uint256 totalShares =
                shares[proposal.applicant] + proposal.sharesRequested;
            shares[proposal.applicant] = totalShares;
        } else if (voteResult == 3 || voteResult == 1) {
            _refundTribute(proposal.token, proposal.proposer, proposal.amount);
        } else {
            revert("proposal has not been voted on yet");
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
