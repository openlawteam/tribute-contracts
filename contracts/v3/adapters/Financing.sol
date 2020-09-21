pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './interfaces/IFinancing.sol';
import '../core/Module.sol';
import '../core/Registry.sol';
import '../adapters/interfaces/IVoting.sol';
import '../core/interfaces/IProposal.sol';
import '../core/interfaces/IBank.sol';
import '../guards/AdapterGuard.sol';
import '../utils/SafeMath.sol';

contract FinancingContract is IFinancing, Module, AdapterGuard  {
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
        revert();
    }

    function createFinancingRequest(Registry dao, address applicant, address token, uint256 amount, bytes32 details) override external returns (uint256) {
        require(amount > 0, "invalid requested amount");
        require(token == address(0x0), "only raw eth token is supported");
        //TODO (fforbeck): check if other types of tokens are supported/allowed

        IBank bankContract = IBank(dao.getAddress(BANK_MODULE));
        require(bankContract.isNotReservedAddress(applicant), "applicant address cannot be reserved");
        
        IProposal proposalContract = IProposal(dao.getAddress(PROPOSAL_MODULE));
        uint256 proposalId = proposalContract.createProposal(dao);

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        proposal.applicant = applicant;
        proposal.amount = amount;
        proposal.details = details;
        proposal.processed = false;
        proposal.token = token;
        return proposalId;
    }

    function sponsorProposal(Registry dao, uint256 proposalId, bytes calldata data) override external onlyMember(dao) {
        IProposal proposalContract = IProposal(dao.getAddress(PROPOSAL_MODULE));
        proposalContract.sponsorProposal(dao, proposalId, msg.sender, data);
    }

    function processProposal(Registry dao, uint256 proposalId) override external onlyMember(dao) {
        ProposalDetails memory proposal = proposals[address(dao)][proposalId];
        require(!proposal.processed, "proposal already processed");

        IVoting votingContract = IVoting(dao.getAddress(VOTING_MODULE));
        require(votingContract.voteResult(dao, proposalId) == 2, "proposal need to pass to be processed");

        IBank bankContract = IBank(dao.getAddress(BANK_MODULE));
        proposals[address(dao)][proposalId].processed = true;
        bankContract.transferFromGuild(dao, proposal.applicant, proposal.token, proposal.amount);
    }
}