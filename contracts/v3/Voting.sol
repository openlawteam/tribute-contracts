pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './ModuleRegistry.sol';
import './Proposal.sol';
import './Member.sol';
import './HelperMoloch.sol';

interface IVoting {
    function startNewVotingForProposal(ModuleRegistry dao, uint256 proposalId) external returns (uint256);
    function voteResult(ModuleRegistry dao, uint256 proposalId) external returns (uint256 state);
    function registerDao(address dao) external;
}

contract VotingContract is IVoting {

    using FlagHelper for uint256;

    struct VotingConfig {
        uint256 flags;
        uint256 votingPeriod;
        uint256 votingCount;
    }
    struct Voting {
        uint256 nbYes;
        uint256 nbNo;
        uint256 startingTime;
    }
    
    mapping(address => mapping(uint256 => Voting)) votes;
    mapping(address => VotingConfig) votingConfigs;

    function registerDao(address dao) override external {
        votingConfigs[dao].flags = 1; // mark as exists
    }

    function voteResult(ModuleRegistry dao, uint256 proposalId) override external returns (uint256 state) {

    }

    function startNewVotingForProposal(ModuleRegistry dao, uint256 proposalId) override external returns (uint256){
        // compute startingPeriod for proposal
        Voting storage vote = votes[address(dao)][proposalId];
        vote.startingTime = block.timestamp;
    }
}