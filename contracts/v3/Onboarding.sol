pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './ModuleRegistry.sol';
import './Proposal.sol';
import './Voting.sol';
import '../SafeMath.sol';

contract OnboardingContract {
    using SafeMath for uint256;

    struct ProposalDetails {
        uint256 amount;
        uint256 sharesRequested;
        bool processed;
    }

    ModuleRegistry dao;
    uint256 public CHUNK_SIZE;
    uint256 public SHARES_PER_CHUNK;
    mapping(uint256 => ProposalDetails) public proposals;

    bytes32 constant BANK_MODULE = keccak256("bank");
    bytes32 constant MEMBER_MODULE = keccak256("member");
    bytes32 constant PROPOSAL_MODULE = keccak256("proposal");
    bytes32 constant VOTING_MODULE = keccak256("voting");

    constructor (address _dao, uint256 _CHUNK_SIZE, uint256 _SHARES_PER_CHUNK) {
        dao = ModuleRegistry(_dao);
        CHUNK_SIZE = _CHUNK_SIZE;
        SHARES_PER_CHUNK = _SHARES_PER_CHUNK;
    }

    receive() external payable {
        uint256 numberOfChunks = msg.value.div(CHUNK_SIZE);
        require(numberOfChunks > 0, "amount of ETH sent was not sufficient");
        uint256 amount = numberOfChunks.mul(CHUNK_SIZE);
        uint256 sharesRequested = numberOfChunks.mul(SHARES_PER_CHUNK);

        _submitMembershipProposal(msg.sender, sharesRequested, amount);

        if(msg.value > amount) {
            msg.sender.transfer(msg.value - amount);
        }
    }

    function _submitMembershipProposal(address newMember, uint256 sharesRequested, uint256 amount) internal {
        IProposalContract proposalContract = IProposalContract(dao.getAddress(PROPOSAL_MODULE));
        uint256 proposalId = proposalContract.createProposal(dao, newMember);
        ProposalDetails storage proposal = proposals[proposalId];
        proposal.amount = amount;
        proposal.sharesRequested = sharesRequested;
    }

    function processProposal(uint256 proposalId) external {
        IMemberContract memberContract = IMemberContract(dao.getAddress(MEMBER_MODULE));
        require(memberContract.isActiveMember(dao, msg.sender), "only members can sponsor a membership proposal");
        IProposalContract proposalContract = IProposalContract(dao.getAddress(PROPOSAL_MODULE));
        require(proposalContract.didPass(dao, proposalId), "proposal need to pass to be processed");
    }
}