pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IManaging.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../utils/SafeMath.sol";

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

contract ManagingContract is IManaging, DaoConstants, MemberGuard {
    using SafeMath for uint256;

    struct ProposalDetails {
        address applicant;
        bytes32 moduleId;
        address moduleAddress;
        uint128 flags;
    }

    mapping(uint256 => ProposalDetails) public proposals;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function createModuleChangeRequest(
        DaoRegistry dao,
        bytes32 moduleId,
        address moduleAddress,
        uint256 _flags
    ) external override onlyMember(dao) returns (uint256) {
        require(moduleAddress != address(0x0), "invalid module address");
        require(_flags < type(uint128).max, "flags parameter overflow");
        uint128 flags = uint128(_flags);

        require(
            dao.isNotReservedAddress(moduleAddress),
            "module is using reserved address"
        );

        //is there a way to check if the new module implements the module interface properly?

        uint256 proposalId = dao.submitProposal(msg.sender);

        ProposalDetails storage proposal = proposals[proposalId];
        proposal.applicant = msg.sender;
        proposal.moduleId = moduleId;
        proposal.moduleAddress = moduleAddress;
        proposal.flags = flags;
        return proposalId;
    }

    function sponsorProposal(
        DaoRegistry dao,
        uint256 _proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, _proposalId, data);

        dao.sponsorProposal(_proposalId, msg.sender);
    }

    function processProposal(DaoRegistry dao, uint256 _proposalId)
        external
        override
        onlyMember(dao)
    {
        require(_proposalId < type(uint64).max, "proposalId too big");
        uint64 proposalId = uint64(_proposalId);
        ProposalDetails memory proposal = proposals[_proposalId];
        require(
            !dao.getProposalFlag(proposalId, FlagHelper128.Flag.PROCESSED),
            "proposal already processed"
        );
        require(
            dao.getProposalFlag(proposalId, FlagHelper128.Flag.SPONSORED),
            "proposal not sponsored yet"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, _proposalId) == 2,
            "proposal did not pass yet"
        );

        dao.removeAdapter(proposal.moduleId);
        dao.addAdapter(
            proposal.moduleId,
            proposal.moduleAddress,
            proposal.flags
        );
        dao.processProposal(_proposalId);
    }
}
