pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import '../Registry.sol';
import '../Module.sol';
import '../interfaces/IMember.sol';
import '../interfaces/IVoting.sol';
import '../../helpers/FlagHelper.sol';

contract VotingContract is IVoting, Module {

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

    function registerDao(address dao, uint256 votingPeriod) override external {
        votingConfigs[dao].flags = 1; // mark as exists
        votingConfigs[dao].votingPeriod = votingPeriod;
    }

    /**
    possible results here:
    0: has not started
    1: tie
    2: pass
    3: not pass
    4: in progress
     */
    function voteResult(Registry dao, uint256 proposalId) override external view returns (uint256 state) {
        Voting storage vote = votes[address(dao)][proposalId];
        if(vote.startingTime == 0) {
            return 0;
        }

        if(block.timestamp < vote.startingTime + votingConfigs[address(dao)].votingPeriod) {
            return 4;
        }

        if(vote.nbYes > vote.nbNo) {
            return 2;
        } else if (vote.nbYes < vote.nbNo) {
            return 3;
        } else {
            return 1;
        }
    }
    //voting  data is not used for pure onchain voting
    function startNewVotingForProposal(Registry dao, uint256 proposalId, bytes calldata) override external returns (uint256){
        // compute startingPeriod for proposal
        Voting storage vote = votes[address(dao)][proposalId];
        vote.startingTime = block.timestamp;
    }

    function submitVote(Registry dao, uint256 proposalId, uint256 voteValue) external {
        IMember memberContract = IMember(dao.getAddress(MEMBER_MODULE));
        require(memberContract.isActiveMember(dao, msg.sender), "only active members can vote");
        require(voteValue < 3, "only blank (0), yes (1) and no (2) are possible values");

        Voting storage vote = votes[address(dao)][proposalId];

        require(vote.startingTime > 0, "this proposalId has not vote going on at the moment");
        require(block.timestamp < vote.startingTime + votingConfigs[address(dao)].votingPeriod, "vote has already ended");
        if(voteValue == 1) {
            vote.nbYes = vote.nbYes + 1;
        } else if (voteValue == 2) {
            vote.nbNo = vote.nbNo + 1;
        }
    }
}