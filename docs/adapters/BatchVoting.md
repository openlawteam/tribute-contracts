## BatchVoting description and scope

This is another voting adapter that uses the same format used in OffchainVoting but instead of computing the result offchain is doing all the work on chain.

This means that the gas cost is O(nb votes) but does not need any challenge mechanism.

## Adapter workflow

The workflow is the same as for Offchain voting minus the challenge part.

startNewVotingForProposal starts a voting session
Then all the votes happen offchain in snapshot
Once the votes are done, the client prepares a list of all the votes and sends it to submitVoteResult

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
- how many shares does the member have
- is the member jailed or not

## Functions description and assumptions / checks

Describe the public and private functions signatures with proper documentation and clearly explain what each function does. Specify what are expected the arguments and pre-conditions to execute the functions. Also, provide what is the expected outcome.

Examples:

### receive() external payable

### function submitKickProposal

```solidity
    /**
     * @notice Creates a guild kick proposal, opens it for voting, and sponsors it.
     * @dev A member can not kick himself.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only members that have shares can be kicked out.
     * @dev Proposal ids can not be reused.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param memberToKick The member address that should be kicked out of the DAO.
     * @param data Additional information related to the kick proposal.
     */
    function submitKickProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address memberToKick,
        bytes calldata data
    ) external override onlyMember(dao)
```

## Events

List all the events that are emitted by the function in this Adapter implementation.
