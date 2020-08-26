pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './ModuleRegistry.sol';
import './Voting.sol';

interface IProposalContract {
    function createProposal(ModuleRegistry dao, address applicant, bytes calldata data) external;
    function sponsorProposal(ModuleRegistry dao, uint256 proposalId) external;
}

contract ProposalContract is IProposalContract {
    using FlagHelper for uint256;

    bytes32 constant memberModuleId = keccak256("member");
    bytes32 constant votingModuleId = keccak256("voting");

    event SponsorProposal(address indexed delegateKey, address indexed memberAddress, uint256 proposalId, uint256 proposalIndex, uint256 startingTime);
    struct Proposal {
        uint256 flags; // using bit function to read the flag. That means that we have up to 256 slots for flags
        address applicant;
        address sponsor;
        bytes data;
    }

    mapping(address => uint256) public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    function createProposal(ModuleRegistry dao, address applicant, bytes calldata data) override external {
        uint256 counter = proposalCount[address(dao)];
        IMemberContract memberContract = IMemberContract(dao.getAddress(memberModuleId));
        proposals[counter++] = Proposal(1, applicant, address(0), data);
        proposalCount[address(dao)] = counter;
    }

    function sponsorProposal(ModuleRegistry dao, uint256 proposalId) override  external {
        address daoAddress = address(dao);

        IMemberContract memberContract = IMemberContract(dao.getAddress(memberModuleId));
        
        Proposal memory proposal = proposals[proposalId];
        require(proposal.flags.exists(), "proposal does not exist for this dao");
        require(!proposal.flags.isSponsored(), "the proposal has already been sponsored");
        require(!proposal.flags.isCancelled(), "the proposal has been cancelled");
        require(memberContract.isActiveMember(dao, proposal.applicant), "proposal applicant must be active");
        IVoting votingContract = IVoting(dao.getAddress(votingModuleId));
        uint256 votingId = votingContract.startNewVotingForProposal(dao, proposalId);
        
        emit SponsorProposal(msg.sender, memberContract.memberAddress(dao, proposal.applicant), proposalId, votingId, block.timestamp);
    }
}