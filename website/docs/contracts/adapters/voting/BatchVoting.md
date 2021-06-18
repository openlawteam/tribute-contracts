---
id: batch-voting-adapter
title: Batch
---

The Batch Voting adapter uses the same format used in **[OffchainVoting](/docs/contracts/adapters/voting/offchain-voting-adapter)**, but instead of computing the result offchain it does the computation on chain.

:::caution
The gas cost is O(nb votes), however it does not requires any voting challenge mechanism as offchain voting does.
:::

## Workflow

The workflow is the same as for Offchain voting minus the voting challenge part.

The function `startNewVotingForProposal` starts a new voting session, then all the votes happen offchain in snapshot. Once the votes are done, the client prepares a list of all the votes and sends it using the function `submitVoteResult`.

While processing the votes the adapter verifies:

- if the signature is correct
- if the vote was for correct proposal
- if the members addresses are in order and with no duplicate

From there, the vote enters into a grace period if potential new votes could change the result and just resolves the vote otherwise.

Available configurations:

1. `voting.votingPeriod`: How long after the starting time is the voting valid (seconds).
2. `voting.gracePeriod`: How long after the end of the voting period is the result settled (seconds).

## Access Flags

- No access flags required.

## Dependencies

### DaoRegistry

### BankExtension

## Structs

### Voting

- `snapshot`: what snapshot (block number) is used for this vote.
- `nbYes`: how many yes votes have been reported.
- `nbNo`: how many no votes have been reported.
- `actionId`: which actionId (adapter address) has created the vote session.
- `proposalHash`: the proposal hash.
- `startingTime`: when did the vote start.
- `gracePeriodStartingTime`: when did we enter the grace period.

### VoteEntry

- `vote`: the snapshot vote message structure from SnapshotProposalContract.sol.
- `memberAddress`: the member address that has voted.
- `sig`: the voting signature.

## Storage

### votingSessions

Tracks each voting session for each dao & proposalId.

## Functions

### getAdapterName

```solidity
    /**
     * @notice returns the adapter name. Useful to identify wich voting adapter is actually configurated in the DAO.
     */
    function getAdapterName() external pure override returns (string memory)

```

### configuraDao

```solidity
    /**
     * @notice Configures the DAO with the Voting and Gracing periods.
     * @param votingPeriod The voting period in seconds.
     * @param gracePeriod The grace period in seconds.
     */
    function configureDao(
        DaoRegistry dao,
        uint256 votingPeriod,
        uint256 gracePeriod
    ) external onlyAdapter(dao)
```

### startNewVotingForProposal

Starts a new voting session. It first decode the proposal data, then builds the proposal hash. From there, it checks that the signature is for this hash and from an active member. It also checks that the block number is not 0 and is not in the future. If all checks out, we write the actionId (msg.sender), startingTime (block.timestamp), snapshot and proposal hash into the voting session struct.

```solidity
    /**
     * @notice Stats a new voting proposal considering the block time and number.
     * @notice This function is called from an Adapter to compute the voting starting period for a proposal.
     * @param proposalId The proposal id that is being started.
     * @param data The proposal signed payload.
     */
    function startNewVotingForProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) public override onlyAdapter(dao)
```

### getSenderAddress

```solidity
    /**
     * @notice Returns the sender address based on the signed proposal data.
     * @param actionId The address of the msg.sender.
     * @param data Proposal signed data.
     */
    function getSenderAddress(
        DaoRegistry dao,
        address actionId,
        bytes memory data,
        address
    ) external view override returns (address)
```

### submitVoteResult

Submits a vote result for a certain proposal.

- It first processes the votes
- If the result has more weight than the previous one and the vote is still going on, update the result
- If the result has changed from before (pass -> fail or fail -> pass), update the start of grace period to now

```solidity
   /**
     * @notice Since the voting happens offchain, the results must be submitted through this function.
     * @param dao The DAO address.
     * @param proposalId The proposal needs to be sponsored, and not processed.
     * @param votes The vote results computed offchain.
     * What needs to be checked before submitting a vote result
     * - if the grace period has ended, do nothing
     * - if it's the first result, is this a right time to submit it?
     *  * is the diff between nbYes and nbNo +50% of the votes ?
     *  * is this after the voting period ?
     * - if we already have a result that has been challenged
     *  * same as if there were no result yet
     * - if we already have a result that has not been challenged
     *  * is the new one heavier than the previous one ?
     */
    function submitVoteResult(
        DaoRegistry dao,
        bytes32 proposalId,
        VoteEntry[] memory votes
    ) external
```

### processVotes

Process all the votes.

For each entry, it validates the vote and then computes the result.

```solidity
    /**
     * @notice Computes the votes based on the proposal.
     * @param proposalId The proposal id.
     * @param entries The votes.
     * @return nbYes Total of YES votes.
     * @return nbNo Total of NO votes.
     */
    function processVotes(
        DaoRegistry dao,
        bytes32 proposalId,
        VoteEntry[] memory entries
    ) public view returns (uint256 nbYes, uint256 nbNo)

```

### validateVote

It validates the vote entry.
It does the following checks:

- checks that the memberAddress is the one who signed the vote (or its delegate key)
- checks that the previous member address is "before" (hex order) the current one
- checks that the vote is actually for this proposal

If it is all good, returns the amount of units the member has at that point in time.

```solidity
    /**
     * @notice Validates the votes based on the sender, proposal, and snapshot data.
     * @notice Checks that the memberAddress is the one who signed the vote (or its delegate key).
     * @notice Checks that the previous member address is "before" (hex order) the current one.
     * @notice Checks that the vote is actually for this proposal.
     * @param actionId The msg.sender.
     * @param snapshot The snapshot id.
     * @param proposalId The proposal id.
     * @param previousAddress The previous member address that has voted on.
     * @return number of units of the member when the snapshot was taken.
     */
    function validateVote(
        DaoRegistry dao,
        BankExtension bank,
        address actionId,
        uint256 snapshot,
        bytes32 proposalId,
        address previousAddress,
        VoteEntry memory entry
    ) public view returns (uint256)
```

### voteResult

Returns the vote status.

```solidity
    /**
     * @notice Computes the votes results of a proposal.
     * @notice Checks that the vote is actually for this proposal.
     * @param proposalId The proposal id.
     * @return state The voting state:
     * 0: has not started
     * 1: tie
     * 2: pass
     * 3: not pass
     * 4: in progress
     */
    function voteResult(DaoRegistry dao, bytes32 proposalId)
        external
        view
        override
        returns (VotingState state)
```

### \_stringToUnit

```solidity
    /**
     * @notice Convents a string value into a unit256.
     * @return success The boolean indicating if the conversion succeeded.
     * @return result The unit256 result if converted, otherwise 0.
     */
    function _stringToUint(string memory s)
        internal
        pure
        returns (bool success, uint256 result)

```

## Events

### NewVoteResult

When a new vote result has been submitted.

- `event NewVoteResult( address dao, address actionId, uint256 nbYes, uint256 nbNo );`
