pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './interfaces/IManaging.sol';
import '../core/Module.sol';
import '../core/Registry.sol';
import '../core/interfaces/IVoting.sol';
import '../core/interfaces/IProposal.sol';
import '../core/interfaces/IBank.sol';
import '../guards/AdapterGuard.sol';
import '../utils/SafeMath.sol';

contract ManagingContract is IManaging, Module, AdapterGuard {
    
    using SafeMath for uint256;

    struct ProposalDetails {
        address applicant;
        bytes32 moduleId;
        address moduleAddress;
        bool processed;
    }

    mapping(uint256 => ProposalDetails) public proposals;

    /* 
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert();
    }

    function createModuleChangeRequest(Registry dao, address applicant, bytes32 moduleId, address moduleAddress) override external returns (uint256) {
        require(moduleAddress != address(0x0), "invalid module address");

        IBank bankContract = IBank(dao.getAddress(BANK_MODULE));
        require(bankContract.isNotReservedAddress(applicant), "applicant address cannot be reserved");
        require(bankContract.isNotReservedAddress(moduleAddress), "module address cannot be reserved");

        //FIXME: is there a way to check if the new module implements the module interface properly?
        
        IProposal proposalContract = IProposal(dao.getAddress(PROPOSAL_MODULE));
        uint256 proposalId = proposalContract.createProposal(dao);

        ProposalDetails storage proposal = proposals[proposalId];
        proposal.applicant = applicant;
        proposal.moduleId = moduleId;
        proposal.moduleAddress = moduleAddress;
        proposal.processed = false;
        return proposalId;
    }

    function sponsorProposal(Registry dao, uint256 proposalId, bytes calldata data) override external onlyMembers(dao) {
        IProposal proposalContract = IProposal(dao.getAddress(PROPOSAL_MODULE));
        proposalContract.sponsorProposal(dao, proposalId, msg.sender, data);
    }

    function processProposal(Registry dao, uint256 proposalId) override external onlyMembers(dao) {
        ProposalDetails memory proposal = proposals[proposalId];
        require(!proposal.processed, "proposal already processed");

        IVoting votingContract = IVoting(dao.getAddress(VOTING_MODULE));
        require(votingContract.voteResult(dao, proposalId) == 2, "proposal need to pass to be processed");

        dao.removeModule(proposal.moduleId);
        dao.addModule(proposal.moduleId, proposal.moduleAddress);
        proposals[proposalId].processed = true;
    }
}