---
id: basic-voting-adapter
title: Basic
---

The Voting adapter provides the on chain no quorum simple majority voting system. You can customize the voting and grace period of the adapter, by setting the following configurations:

1. `voting.votingPeriod`: How long after the starting time is the voting valid (seconds).
2. `voting.gracePeriod`: How long after the end of the voting period is the result settled (seconds).

## Workflow

A voting process is started by any adapter that is based on proposals, the proposal is stored in the DAO Registry, so the voting adapter can verify if the proposal was sponsored, and not processed to allow members to vote on that proposal.

The votes are submitted through the function `submitVote`, and the results are computed through the function `voteResult`.

## Access Flags

- No access flags required.

## Dependencies

### DaoRegistry

### BankExtension

## Structs

### Voting

- `nbYes`: how many yes have been casted
- `nbNo`: how many no have been casted
- `startingTime`: starting time of the voting process
- `blockNumber`:
- `votes`: map of member and vote to keep track of everybody's vote and know if they have already voted or not.

## Storage

### votes

Map of proposalId and the voting state where voting state.

## Functions

### getAdapterName

```solidity
    /**
     * @notice returns the adapter name. Useful to identify wich voting adapter is actually configurated in the DAO.
     */
    function getAdapterName() external pure override returns (string memory)

```

### configureDao

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

This is called every time a proposal is being sponsored. This starts the voting process.

We assume here that the adapter uses `dao.sponsorProposal()` to make sure it is not called multiple times on the same proposal.

```solidity
   /**
     * @notice Stats a new voting proposal considering the block time and number.
     * @notice This function is called from DaoRegistry to compute startingPeriod for proposal
     * @param proposalId The proposal id that is being started.
     */
    function startNewVotingForProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes calldata
    ) external override onlyAdapter(dao)
```

### getSenderAddress

This function allows the voting adapter determine who is signing the message based on the data sent.
In the case of Voting, it's always `msg.sender`. But for other implementations, signed data could be used to determine it and let a relayer do the call.

```solidity
   /**
     * @notice Returns the sender address.
     * @notice This funcion is required by the IVoting, usually offchain voting have different rules to identify the sender, but it is not the case here, so we just return the fallback argument: sender.
     * @param sender The fallback sender address that should be return in case no other is found.
     */
    function getSenderAddress(
        DaoRegistry,
        address,
        bytes memory,
        address sender
    ) external pure override returns (address)
```

### submitVote

Casts a vote. Only a member can submit a vote.

We check that:

- The proposal has been sponsored
- The proposal has not been processed yet
- The vote has started (startingTime > 0)
- The vote has not ended yet
- The member has not voted yet
- The vote is valid (only either yes or no)

```solidity
    /**
     * @notice Submits a vote to the DAO Registry.
     * @notice Vote has to be submitted after the starting time defined in startNewVotingForProposal.
     * @notice The vote needs to be submitted within the voting period.
     * @notice A member can not vote twice or more.
     * @param dao The DAO address.
     * @param proposalId The proposal needs to be sponsored, and not processed.
     * @param voteValue Only Yes (1) and No (2) votes are allowed.
     */
    function submitVote(
        DaoRegistry dao,
        bytes32 proposalId,
        uint256 voteValue
    ) external onlyMember(dao)
```

### voteResult

Gets back the vote result for a certain proposal.
If the vote has not started yet, return `NOT_STARTED`. If the vote is still on going (after starting time but before startingTime + voting period) return `IN_PROGRESS`. If the vote has ended but is still in grace period, return `GRACE_PERIOD`. If none of the above and more yes votes than no votes, return `PASS`. If more no votes than yes votes, return `NOT_PASS`. If yes votes equals no votes, return `TIE`.

```solidity
    /**
     * @notice Computes the voting result based on a proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal that needs to have the votes computed.
     * @return state
     * The possible results are:
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

## Events

- No events are emitted.
