pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './interfaces/IFinancing.sol';
import '../core/Module.sol';
import '../core/Registry.sol';
import '../core/interfaces/IVoting.sol';
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

    mapping(uint256 => ProposalDetails) public proposals;

    Registry dao;

    constructor (address _dao) {
        dao = Registry(_dao);
    }

    /* 
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert();
    }

    function createFinancingRequest(address applicant, address token, uint256 amount, bytes32 details) override external returns (uint256) {
        require(amount > 0, "invalid requested amount");
        require(token == address(0x0), "only raw eth token is supported");
        //TODO (fforbeck): check if other types of tokens are supported/allowed

        IBank bankContract = IBank(dao.getAddress(BANK_MODULE));
        require(bankContract.isNotReservedAddress(applicant), "applicant address cannot be reserved");
        
        IProposal proposalContract = IProposal(dao.getAddress(PROPOSAL_MODULE));
        uint256 proposalId = proposalContract.createProposal(dao);

        ProposalDetails storage proposal = proposals[proposalId];
        proposal.applicant = applicant;
        proposal.amount = amount;
        proposal.details = details;
        proposal.processed = false;
        proposal.token = token;
        return proposalId;
    }

    function sponsorProposal(uint256 proposalId, bytes calldata data) override external onlyMembers(dao) {
        IProposal proposalContract = IProposal(dao.getAddress(PROPOSAL_MODULE));
        proposalContract.sponsorProposal(dao, proposalId, msg.sender, data);
    }

    function processProposal(uint256 proposalId) override external onlyMembers(dao) {
        ProposalDetails memory proposal = proposals[proposalId];
        require(!proposal.processed, "proposal already processed");

        IVoting votingContract = IVoting(dao.getAddress(VOTING_MODULE));
        require(votingContract.voteResult(dao, proposalId) == 2, "proposal need to pass to be processed");

        IBank bankContract = IBank(dao.getAddress(BANK_MODULE));
        proposals[proposalId].processed = true;
        bankContract.transferFromGuild(proposal.applicant, proposal.token, proposal.amount);
    }
}