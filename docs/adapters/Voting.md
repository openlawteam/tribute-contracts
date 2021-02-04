## Adapter description and scope

This adapter manages on chain "simple" voting.

## Adapter state

```solidity
struct Voting {
  uint256 nbYes;
  uint256 nbNo;
  uint256 startingTime;
  uint256 blockNumber;
  mapping(address => uint256) votes;
}

```

- nbYes: how many yes have been casted
- nbNo: how many no have been casted
- startingTime: starting time of the voting process
- mapping of member => vote to keep track of everybody's vote and know if they have already voted or not

`mapping(address => mapping(bytes32 => Voting)) public votes;`
mapping for each adapter of proposalId => voting state where voting state is

## Adapter configuration

Two configurations are possible for the voting adapter:

### VotingPeriod = keccak256("voting.votingPeriod")

How long after the starting time is the voting valid

### GracePeriod = keccak256("voting.gracePeriod")

How long after the end of the voting period is the result settled

## Functions description, assumptions, checks, dependencies, interactions and access control

### function startNewVotingForProposal(DaoRegistry dao, bytes32 proposalId, bytes calldata)

This is called every time a proposal is being sponsored. This starts the voting process.

We assume here that the adapter uses `dao.sponsorProposal()` to make sure it is not called multiple times on the same proposal.

### function getSenderAddress(DaoRegistry, address, bytes memory, address sender) returns (address)

This function allows the voting adapter determine who is signing the message based on the data sent.
In the case of Voting, it's always `msg.sender`. But for other implementations, signed data could be used to determine it and let a relayer do the call.

### function submitVote(DaoRegistry dao, bytes32 proposalId, uint256 voteValue)

Casts a vote. Only a member can submit a vote.

We check that:

- The proposal has been sponsored
- The proposal has not been processed yet
- The vote has started (startingTime > 0)
- The vote has not ended yet
- The member has not voted yet
- The vote is valid (only either yes or no)

### function voteResult(DaoRegistry dao, bytes32 proposalId) returns (VotingState state)

Gets back the vote result for a certain proposal.
If the vote has not started yet, return `NOT_STARTED`.
If the vote is still on going (after starting time but before startingTime + voting period) return `IN_PROGRESS`.
If the vote has ended but is still in grace period, return `GRACE_PERIOD`.
If none of the above and more yes votes than no votes, return `PASS`.
If more no votes than yes votes, return `NOT_PASS`.
If yes votes equals no votes, return `TIE`.
