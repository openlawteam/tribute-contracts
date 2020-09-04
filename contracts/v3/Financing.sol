pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './ModuleRegistry.sol';
import './Proposal.sol';
import './Voting.sol';
import './Bank.sol';
import '../SafeMath.sol';

interface IFinancingContract {
    function createFinancingRequest(address daoAddress, address applicant, uint256 amount, bytes32 details) external returns (uint256);    
    function processProposal(uint256 proposalId) external;
}

contract FinancingContract is IFinancingContract {
    using SafeMath for uint256;

    struct ProposalDetails {
        address applicant;
        uint256 amount;
        bytes32 details;
        bool processed;
    }

    mapping(uint256 => ProposalDetails) public proposals;

    bytes32 constant BANK_MODULE = keccak256("bank");
    bytes32 constant PROPOSAL_MODULE = keccak256("proposal");
    bytes32 constant VOTING_MODULE = keccak256("voting");

    ModuleRegistry dao;

    constructor (address _dao) {
        dao = ModuleRegistry(_dao);
    }

    /* 
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert();
    }

    function createFinancingRequest(address daoAddress, address applicant, uint256 amount, bytes32 details) override external returns (uint256) {
        require(daoAddress != address(0x0), "dao address can not be empty");
        require(applicant != address(0x0), "applicant address can not be empty");
        require(daoAddress != address(0x0), "dao address can not be empty");
        require(amount > 0, "invalid requested amount");

        IBankContract bankContract = IBankContract(dao.getAddress(BANK_MODULE));
        require(bankContract.isReservedAddress(applicant), "applicant address cannot be reserved");
        
        IProposalContract proposalContract = IProposalContract(dao.getAddress(PROPOSAL_MODULE));
        uint256 proposalId = proposalContract.createProposal(dao);

        ProposalDetails storage proposal = proposals[proposalId];
        proposal.applicant = applicant;
        proposal.amount = amount;
        proposal.details = details;
        proposal.processed = false;
        return proposalId;
    }

    function processProposal(uint256 proposalId) override external {
        require(proposalId != 0, "invalid proposal identifier");
        ProposalDetails memory proposal = proposals[proposalId];

        //TODO is it required to be a member to ask for financing?
        IVotingContract votingContract = IVotingContract(dao.getAddress(VOTING_MODULE));
        require(votingContract.voteResult(dao, proposalId) == 2, "proposal need to pass to be processed");

        // memberContract.updateMember(dao, proposal.applicant, proposal.sharesRequested);
        //TODO update banking contract and set processed=true?
    }
}