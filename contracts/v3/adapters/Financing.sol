pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './interfaces/IFinancing.sol';
import '../core/Registry.sol';
import '../core/Proposal.sol';
import '../core/Voting.sol';
import '../core/Bank.sol';
import '../guards/AdapterGuard.sol';
import '../utils/SafeMath.sol';

contract FinancingContract is IFinancing, AdapterGuard  {
    using SafeMath for uint256;

    struct ProposalDetails {
        address applicant;
        uint256 amount;
        address token;
        bytes32 details;
        bool processed;
    }

    mapping(uint256 => ProposalDetails) public proposals;

    bytes32 constant BANK_MODULE = keccak256("bank");
    bytes32 constant VOTING_MODULE = keccak256("voting");
    bytes32 constant PROPOSAL_MODULE = keccak256("proposal");

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

    function createFinancingRequest(address daoAddress, address applicant, address token, uint256 amount, bytes32 details) override external returns (uint256) {
        require(daoAddress != address(0x0), "dao address can not be empty");
        require(amount > 0, "invalid requested amount");
        require(token == address(0x0), "only raw eth token is supported");
        //TODO (fforbeck): check if other types of tokens are supported/allowed

        Registry selectedDAO = Registry(daoAddress);
        IBankContract bankContract = IBankContract(selectedDAO.getAddress(BANK_MODULE));
        require(bankContract.isReservedAddress(applicant), "applicant address cannot be reserved");
        
        IProposalContract proposalContract = IProposalContract(selectedDAO.getAddress(PROPOSAL_MODULE));
        uint256 proposalId = proposalContract.createProposal(selectedDAO);

        ProposalDetails storage proposal = proposals[proposalId];
        proposal.applicant = applicant;
        proposal.amount = amount;
        proposal.details = details;
        proposal.processed = false;
        proposal.token = token;
        return proposalId;
    }

    function sponsorProposal(uint256 proposalId, bytes calldata data) override external onlyMembers(dao) {
        IProposalContract proposalContract = IProposalContract(dao.getAddress(PROPOSAL_MODULE));
        proposalContract.sponsorProposal(dao, proposalId, msg.sender, data);
    }

    function processProposal(uint256 proposalId) override external onlyMembers(dao) {
        ProposalDetails memory proposal = proposals[proposalId];
        require(!proposal.processed, "proposal already processed");

        IVotingContract votingContract = IVotingContract(dao.getAddress(VOTING_MODULE));
        require(votingContract.voteResult(dao, proposalId) == 2, "proposal need to pass to be processed");

        IBankContract bankContract = IBankContract(dao.getAddress(BANK_MODULE));
        proposals[proposalId].processed = true;
        bankContract.transferFromGuild(dao, proposal.applicant, proposal.token, proposal.amount);
    }
}