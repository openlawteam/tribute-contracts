pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './interfaces/IOnboarding.sol';
import '../core/Registry.sol';
import '../core/interfaces/IVoting.sol';
import '../core/interfaces/IProposal.sol';
import '../core/interfaces/IBank.sol';
import '../utils/SafeMath.sol';
import '../guards/AdapterGuard.sol';

contract OnboardingContract is IOnboarding, AdapterGuard {
    using SafeMath for uint256;

    struct ProposalDetails {
        uint256 amount;
        uint256 sharesRequested;
        bool processed;
        address applicant;
    }

    Registry dao;
    uint256 public CHUNK_SIZE;
    uint256 public SHARES_PER_CHUNK;
    mapping(uint256 => ProposalDetails) public proposals;

    bytes32 constant BANK_MODULE = keccak256("bank");
    bytes32 constant PROPOSAL_MODULE = keccak256("proposal");
    bytes32 constant VOTING_MODULE = keccak256("voting");

    constructor (address _dao, uint256 _CHUNK_SIZE, uint256 _SHARES_PER_CHUNK) {
        dao = Registry(_dao);
        CHUNK_SIZE = _CHUNK_SIZE;
        SHARES_PER_CHUNK = _SHARES_PER_CHUNK;
    }

    receive() override external payable {
        uint256 numberOfChunks = msg.value.div(CHUNK_SIZE);
        require(numberOfChunks > 0, "amount of ETH sent was not sufficient");
        uint256 amount = numberOfChunks.mul(CHUNK_SIZE);
        uint256 sharesRequested = numberOfChunks.mul(SHARES_PER_CHUNK);

        _submitMembershipProposal(msg.sender, sharesRequested, amount);

        if (msg.value > amount) {
            msg.sender.transfer(msg.value - amount);
        }
    }

    function _submitMembershipProposal(address newMember, uint256 sharesRequested, uint256 amount) internal {
        IProposal proposalContract = IProposal(dao.getAddress(PROPOSAL_MODULE));
        uint256 proposalId = proposalContract.createProposal(dao);
        ProposalDetails storage proposal = proposals[proposalId];
        proposal.amount = amount;
        proposal.sharesRequested = sharesRequested;
        proposal.applicant = newMember;
    }

    function sponsorProposal(uint256 proposalId, bytes calldata data) override external onlyMembers(dao) {
        IProposal proposalContract = IProposal(dao.getAddress(PROPOSAL_MODULE));
        proposalContract.sponsorProposal(dao, proposalId, msg.sender, data);
    }

    function processProposal(uint256 proposalId) override external onlyMembers(dao) {
        IMember memberContract = IMember(dao.getAddress(MEMBER_MODULE));
        require(memberContract.isActiveMember(dao, msg.sender), "only members can sponsor a membership proposal");
        IVoting votingContract = IVoting(dao.getAddress(VOTING_MODULE));
        require(votingContract.voteResult(dao, proposalId) == 2, "proposal need to pass to be processed");
        ProposalDetails storage proposal = proposals[proposalId];
        memberContract.updateMember(dao, proposal.applicant, proposal.sharesRequested);
        IBank bankContract = IBank(dao.getAddress(BANK_MODULE));
        // address 0 represents native ETH
        bankContract.addToGuild(dao, address(0), proposal.amount);
        payable(address(bankContract)).transfer(proposal.amount); 
    }
}