pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IFinancing.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../helpers/FlagHelper.sol";

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

contract FinancingContract is IFinancing, DaoConstants, MemberGuard {
    struct ProposalDetails {
        address applicant;
        uint256 amount;
        address token;
        bytes32 details;
    }

    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function createFinancingRequest(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address token,
        uint256 amount,
        bytes32 details
    ) external override {
        require(amount > 0, "invalid requested amount");
        require(dao.isTokenAllowed(token), "token not allowed");
        require(
            dao.isNotReservedAddress(applicant),
            "applicant using reserved address"
        );

        dao.submitProposal(proposalId);

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        proposal.applicant = applicant;
        proposal.amount = amount;
        proposal.details = details;
        proposal.token = token;
    }

    function sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
        dao.sponsorProposal(proposalId, msg.sender);
    }

    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        onlyMember(dao)
    {
        ProposalDetails memory details = proposals[address(dao)][proposalId];

        require(
            !dao.getProposalFlag(proposalId, FlagHelper.Flag.PROCESSED),
            "proposal already processed"
        );
        require(
            dao.getProposalFlag(proposalId, FlagHelper.Flag.SPONSORED),
            "proposal not sponsored yet"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal needs to pass"
        );

        dao.subtractFromBalance(GUILD, details.token, details.amount);
        dao.addToBalance(details.applicant, details.token, details.amount);
        dao.processProposal(proposalId);
    }
}
