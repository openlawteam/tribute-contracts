## Adapter description and scope

This adapter manages offchain voting using a merkle tree to commit to a result that can be challenge during the grace period if necessary.

There are also two fallback solutions implemented:

- fallback voting that falls back to simple onchain voting if something is wrong
- admin force fail proposal to mark a proposal as failed by an admin if necessary. This is present until a more formal verfication of the system is done

### General concept

The idea is to use a merkle tree to commit to a computation (calculate the result) and have a way to challenge a result if anyone sees an issue in the computation.

The approach assumes data availability.

Each leaf in the merkle tree is a "step" in computing the vote result. The last leaf is the result (and the leaf submitted).

This works with a modified version of snapshot that uses ERC-712 for hashing / signing proposals and votes

## Adapter configuration

### VotingPeriod = keccak256("voting.votingPeriod")

How long does a vote occur.

### GracePeriod = keccak256("voting.gracePeriod")

How long does anyeone have to challenge a result if an issue is spotted.

### FallbackThreshold = keccak256("offchainvoting.fallbackThreshold")

What threshold ( in % ) of members need to request a fallback voting for it to kick in.

## Functions description, assumptions, checks, dependencies, interactions and access control

### function adminFailProposal(DaoRegistry dao, bytes32 proposalId)

Admin function (only owner can call it) to fail a proposal. Used as a failsafe if anything goes wrong since the adapter is still new

### function submitVoteResult(DaoRegistry dao, bytes32 proposalId, bytes32 resultRoot, VoteResultNode memory result) external

Submits a new vote result for a specific dao / proposalId.
result is the last step that contains the vote result.
resultRoot is the merkle root of the computation merkle tree.

If a result has been already published, it checks whether this one has more steps (index is higher) or if the vote is already finished.

If the voting period is not done yet but the result cannot be changed anymore (50+% have voted either yes or no), the grace period starts right away

### function voteResult(DaoRegistry dao, bytes32 proposalId) returns (VotingState state)

Returns the status of a vote session.

### function challengeBadNode(DaoRegistry dao, bytes32 proposalId, VoteResultNode memory nodeCurrent) external

Checks and marks a result as bad if a specific node has bad data.
The checks are:

- bad signature
- invalid choice
- bad proposalHash
- vote timestamp is after the current grace period started

### function \_isValidChoice(uint256 choice) internal pure returns (bool)

function defining what a valid choice is

### function challengeBadStep(DaoRegistry dao, bytes32 proposalId, VoteResultNode memory nodePrevious, VoteResultNode memory nodeCurrent) external

Checks that the step from a node to another is correct or not
let's define a step function S(state, choice) that creates a new state based on a previous one and a choice
We check that S(previousState, currentChoice) = currentState
If not, we challenge the result

### function requestFallback(DaoRegistry dao, bytes32 proposalId) external onlyMember(dao)

If something is wrong with the vote but it is not possible to challenge it, members can request a fallback

### function sponsorChallengeProposal(DaoRegistry dao, bytes32 proposalId, address sponsoredBy)

If a result has been challenged, it is needed to vote on the faith of the reporter. Should he continue being a member or should he be banned.

### function processChallengeProposal(DaoRegistry dao, bytes32 proposalId)

Process the vote for the faith of a bad reporter
