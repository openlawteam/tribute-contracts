## Adapter description and scope

This adapter manages offchain voting using a merkle tree to commit to a result that can be challenge during the grace period if necessary.

There are also two fallback solutions implemented:

- fallback voting that falls back to simple onchain voting if something is wrong
- admin force fail proposal to mark a proposal as failed by an admin if necessary. This is present until a more formal verfication of the system is done

### General concept
## Adapter configuration

### VotingPeriod = keccak256("voting.votingPeriod")

### GracePeriod = keccak256("voting.gracePeriod")

## Functions description, assumptions, checks, dependencies, interactions and access control

### function startNewVotingForProposal(DaoRegistry dao, bytes32 proposalId, bytes calldata)

### function getSenderAddress(DaoRegistry, address, bytes memory, address sender) returns (address)

### function voteResult(DaoRegistry dao, bytes32 proposalId) returns (VotingState state)
