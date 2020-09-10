pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../Registry.sol';
import '../interfaces/IMember.sol';
import '../interfaces/IProposal.sol';
import '../interfaces/IVoting.sol';
import '../../helpers/FlagHelper.sol';
import '../../guards/ModuleGuard.sol';

contract ProposalContract is IProposal, ModuleGuard {
    using FlagHelper for uint256;

    bytes32 constant memberModuleId = keccak256("member");
    bytes32 constant votingModuleId = keccak256("voting");

    event SponsorProposal(uint256 proposalId, uint256 proposalIndex, uint256 startingTime);
    event NewProposal(uint256 proposalId, uint256 proposalIndex);

    struct Proposal {
        uint256 flags; // using bit function to read the flag. That means that we have up to 256 slots for flags
    }

    mapping(address => uint256) public proposalCount;
    mapping(address => mapping(uint256 => Proposal)) public proposals;

    function createProposal(Registry dao) override external returns(uint256) {
        uint256 counter = proposalCount[address(dao)];
        proposals[address(dao)][counter++] = Proposal(1);
        proposalCount[address(dao)] = counter;
        uint256 proposalId = counter - 1;

        emit NewProposal(proposalId, counter);
        
        return proposalId;
    }

    function sponsorProposal(Registry dao, uint256 proposalId, address sponsoringMember, bytes calldata votingData) override external onlyModule(dao) {
        Proposal memory proposal = proposals[address(dao)][proposalId];
        require(proposal.flags.exists(), "proposal does not exist for this dao");
        require(!proposal.flags.isSponsored(), "the proposal has already been sponsored");
        require(!proposal.flags.isCancelled(), "the proposal has been cancelled");

        IMember memberContract = IMember(dao.getAddress(memberModuleId));
        require(memberContract.isActiveMember(dao, sponsoringMember), "only active members can sponsor someone joining");

        IVoting votingContract = IVoting(dao.getAddress(votingModuleId));
        uint256 votingId = votingContract.startNewVotingForProposal(dao, proposalId, votingData);
        
        emit SponsorProposal(proposalId, votingId, block.timestamp);
    }
}