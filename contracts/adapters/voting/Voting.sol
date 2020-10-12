pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../core/DaoConstants.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../interfaces/IVoting.sol";

contract VotingContract is IVoting, DaoConstants, MemberGuard, AdapterGuard {
    struct VotingConfig {
        uint256 votingPeriod;
        uint256 gracePeriod;
    }
    struct Voting {
        uint256 nbYes;
        uint256 nbNo;
        uint256 startingTime;
    }

    mapping(address => mapping(uint256 => Voting)) public votes;
    mapping(address => VotingConfig) public votingConfigs;

    function configureDao(
        DaoRegistry dao,
        uint256 votingPeriod,
        uint256 gracePeriod
    ) external onlyAdapter(dao) {
        votingConfigs[address(dao)].votingPeriod = votingPeriod;
        votingConfigs[address(dao)].gracePeriod = gracePeriod;
    }

    //voting  data is not used for pure onchain voting
    function startNewVotingForProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata /*onlyAdapter(dao)*/
    ) external override {
        //it is called from Registry
        // compute startingPeriod for proposal
        Voting storage vote = votes[address(dao)][proposalId];
        vote.startingTime = block.timestamp;
    }

    function submitVote(
        DaoRegistry dao,
        uint256 proposalId,
        uint256 voteValue
    ) external onlyMember(dao) {
        require(dao.isActiveMember(msg.sender), "only active members can vote");
        require(
            voteValue < 3,
            "only blank (0), yes (1) and no (2) are possible values"
        );

        Voting storage vote = votes[address(dao)][proposalId];

        require(
            vote.startingTime > 0,
            "this proposalId has not vote going on at the moment"
        );
        require(
            block.timestamp <
                vote.startingTime + votingConfigs[address(dao)].votingPeriod,
            "vote has already ended"
        );
        if (voteValue == 1) {
            vote.nbYes = vote.nbYes + 1;
        } else if (voteValue == 2) {
            vote.nbNo = vote.nbNo + 1;
        }
    }

    //Public Functions
    /**
    possible results here:
    0: has not started
    1: tie
    2: pass
    3: not pass
    4: in progress
     */
    function voteResult(DaoRegistry dao, uint256 proposalId)
        external
        override
        view
        returns (uint256 state)
    {
        Voting storage vote = votes[address(dao)][proposalId];
        if (vote.startingTime == 0) {
            return 0;
        }

        if (
            block.timestamp <
            vote.startingTime + votingConfigs[address(dao)].votingPeriod
        ) {
            return 4;
        }

        if (vote.nbYes > vote.nbNo) {
            return 2;
        } else if (vote.nbYes < vote.nbNo) {
            return 3;
        } else {
            return 1;
        }
    }
}
