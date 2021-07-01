---
id: offchain-voting-adapter
title: Offchain
---

:::caution
The Offchain adapter is under development, this documentation is not up to date.
:::

The Offchain Voting Adapter manages offchain voting using a merkle tree to commit to a result that can be challenge during the grace period if necessary.

There are also two fallback solutions implemented:

- fallback voting that falls back to simple onchain voting if something is wrong
- admin force fail proposal to mark a proposal as failed by an admin if necessary. This is present until a more formal verfication of the system is done

## Workflow

The idea is to use a merkle tree to commit to a computation (calculate the result) and have a way to challenge a result if anyone sees an issue in the computation. The approach assumes data availability.

Each leaf in the merkle tree is a "step" in computing the vote result. The last leaf is the result (and the leaf submitted). This works with a modified version of snapshot that uses ERC-712 for hashing / signing proposals and votes.

Available configurations:

1. `voting.votingPeriod`: How long after the starting time is the voting valid (seconds).
2. `voting.gracePeriod`: How long after the end of the voting period is the result settled (seconds).
3. `offchainvoting.fallbackThreshold`: The threshold ( in % ) of members needed to request a fallback voting for it to kick in.

## Access Flags

### BankExtension

- `ADD_TO_BALANCE`
- `SUB_FROM_BALANCE`
- `INTERNAL_TRANSFER`

## Dependencies

### DaoRegistry

### BankExtension

### Signatures

### KickBadReporterAdapter

### OnchainVoting

### SnapshotProposalContract

### MerkleProof

## Structs

### ProposalChallenge

### VoteStepParams

### Voting

### VoteResultNode

## Storage

### fallbackVoting

### challengeProposals

### votes

### \_snapshotContract

### \_handleBadReporterAdapter

## Functions

### adminFailProposal

Admin function (only owner can call it) to fail a proposal. Used as a failsafe if anything goes wrong since the adapter is still new

### submitVoteResult

Submits a new vote result for a specific dao / proposalId.
result is the last step that contains the vote result.
resultRoot is the merkle root of the computation merkle tree.

If a result has been already published, it checks whether this one has more steps (index is higher) or if the vote is already finished.

If the voting period is not done yet but the result cannot be changed anymore (50+% have voted either yes or no), the grace period starts right away

### voteResult

Returns the status of a vote session.

### challengeBadNode

Checks and marks a result as bad if a specific node has bad data.
The checks are:

- bad signature
- invalid choice
- bad proposalHash
- vote timestamp is after the current grace period started

### \_isValidChoice

function defining what a valid choice is

### challengeBadStep

Checks that the step from a node to another is correct or not
let's define a step function S(state, choice) that creates a new state based on a previous one and a choice
We check that S(previousState, currentChoice) = currentState
If not, we challenge the result

### requestFallback

If something is wrong with the vote but it is not possible to challenge it, members can request a fallback

### sponsorChallengeProposal

If a result has been challenged, it is needed to vote on the faith of the reporter. Should he continue being a member or should he be banned.

### processChallengeProposal

Process the vote for the faith of a bad reporter

## Events

- No event are emitted.
