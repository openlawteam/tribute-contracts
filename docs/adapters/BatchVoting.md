## BatchVoting description and scope

This is another voting adapter that uses the same format used in OffchainVoting but instead of computing the result offchain is doing all the work on chain.

This means that the gas cost is O(nb votes) but does not need any challenge mechanism.

## Adapter workflow

The workflow is the same as for Offchain voting minus the challenge part.

startNewVotingForProposal starts a voting session
Then all the votes happen offchain in snapshot
Once the votes are done, the client prepares a list of all the votes and sends it to submitVoteResult

While processing the votes we check that:

- the signature is correct
- the vote was for this particular proposal
- the member addresses are in order and with no duplicate

From there, the vote enters grace period if potential new votes could change the result and just resolves the vote otherwise.

## Adapter configuration

the two configurations for BatchVoting are `Voting period` & `Grace period`

## Adapter state

The adapter keeps track of each vote "session" for each dao & proposalId.
The session has the following properties:
`uint256 snapshot` what snapshot (block number) is used for this vote
`uint256 nbYes` how many yes votes have been reported
`uint256 nbNo` how many no votes have been reported
`address actionId` which actionId (adapter address) has created the vote session
`bytes32 proposalHash` the proposal hash
`uint256 startingTime` when did the vote start
`uint256 gracePeriodStartingTime` when did we enter the grace period

## Dependencies and interactions (internal / external)

BatchVoting interacts with Bank extension and DaoRegistry to get information about the member voting.
The info is:

- its delegate key at the time of voting
- how many units does the member have

## Functions description and assumptions / checks

Describe the public and private functions signatures with proper documentation and clearly explain what each function does. Specify what are expected the arguments and pre-conditions to execute the functions. Also, provide what is the expected outcome.

Examples:

### function submitVoteResult(DaoRegistry dao, bytes32 proposalId, VoteEntry[] memory votes)

this function submits a vote result for a certain proposal.

- It first processes the votes
- If the result has more weight than the previous one and the vote is still going on, update the result
- If the result has changed from before (pass -> fail or fail -> pass), update the start of grace period to now

### function getAdapterName()

returns the voting adapter name "BatchVotingContract"

### function processVotes(DaoRegistry dao, bytes32 proposalId, VoteEntry[] memory entries)

Process all the votes.

For each entry, it validates the vote and then computes the result.

### function validateVote(DaoRegistry dao, BankExtension bank, address actionId, uint256 snapshot, bytes32 proposalHash, address previousAddress, VoteEntry memory entry)

It validates the vote entry.
It does the following checks:

- checks that the memberAddress is the one who signed the vote (or its delegate key)
- checks that the previous member address is "before" (hex order) the current one
- checks that the vote is actually for this proposal

If it is all good, returns the amount of units the member has at that point in time

### function getSenderAddress(DaoRegistry dao, address actionId, bytes memory data,address)

returns the address that has signed the proposal hash

### function startNewVotingForProposal(DaoRegistry dao, bytes32 proposalId, bytes memory data)

Starts a new voting session.
It first decode the proposal data, then builds the proposal hash.
From there, it checks that the signature is for this hash and from an active member.
It also checks that the block number is not 0 and is not in the future

if all checks out, we write the actionId (msg.sender), startingTime (block.timestamp), snapshot and proposal hash into the voting session struct

### function voteResult(DaoRegistry dao, bytes32 proposalId)

returns the vote status.

## Events

### NewVoteResult(address dao, address actionId, uint256 nbYes, uint256 nbNo)

is emitted when a new vote result has been submitted
