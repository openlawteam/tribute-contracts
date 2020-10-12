pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IFinancing.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../utils/SafeMath.sol";

contract FinancingContract is IFinancing, DaoConstants, MemberGuard {
    using SafeMath for uint256;

    struct ProposalDetails {
        address applicant;
        uint256 amount;
        address token;
        bytes32 details;
        bool processed;
    }

    mapping(address => mapping(uint256 => ProposalDetails)) public proposals;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function createFinancingRequest(
        DaoRegistry dao,
        address applicant,
        address token,
        uint256 amount,
        bytes32 details
    ) external override returns (uint256) {
        require(amount > 0, "invalid requested amount");
        require(token == address(0x0), "only raw eth token is supported");
        //TODO (fforbeck): check if other types of tokens are supported/allowed
        require(
            dao.isNotReservedAddress(applicant),
            "applicant using reserved address"
        );

        uint256 proposalId = dao.submitProposal(msg.sender);

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        proposal.applicant = applicant;
        proposal.amount = amount;
        proposal.details = details;
        proposal.processed = false;
        proposal.token = token;
        return proposalId;
    }

    function sponsorProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        dao.sponsorProposal(proposalId, msg.sender, data);
    }

    function processProposal(DaoRegistry dao, uint256 proposalId)
        external
        override
        onlyMember(dao)
    {
        ProposalDetails memory proposal = proposals[address(dao)][proposalId];
        require(!proposal.processed, "proposal already processed");

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal did not pass yet"
        );

        proposals[address(dao)][proposalId].processed = true;
        
        dao.subtractFromBalance(GUILD, proposal.token, proposal.amount);
        dao.addToBalance(proposal.applicant, proposal.token, proposal.amount);
        dao.processProposal(proposalId);
    }
}
