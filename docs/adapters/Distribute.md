## Adapter description and scope

The Distribute Adapter provides features in which the DAO members can receive funds from the DAO for any given reason. A good example of that is when the members collectively agree to payout dividends to one or all member of the DAO, when that happens they can submit a proposal for voting, and if the proposal pass the amount is distributed equally to the members.

## Adapter workflow

The token distribution starts when a member submits a proposal to distribute a certain amount of a token for one or all members of the DAO. It is important to mention that the distribution can only happen for 1 member or for all, there is no way to distribute the tokens for a subset of the DAO members.

Once the distribution proposal gets created, it is open for voting, and sponsored by the message sender. The adapter tracks all the distributions that have been executed already by each DAO, and also tracks the current distributions that is in progress - this is done to ensure the distributions are executed sequentially per DAO.

Once the distribution proposal has passed, the other members have to start the actual distribution process (function `processProposal`). In this process the member indicated in the proposal or each member of the DAO will receive, based on the current number of holding shares, a token amount in the internal bank account, so it can be withdraw later on. This process does not changes the number of shares of the members, it just uses it to calculate the fair amount to distribute for each member. After that, the distribution proposal gets updated to `Completed`.

## Adapter configuration

The member needs to have at least 1 share to be able to receive funds from a distribution proposal.

DAORegistry Access Flags: `SUBMIT_PROPOSAL`, `SPONSOR_PROPOSAL`, `PROCESS_PROPOSAL`.

Bank Extension Access Flags: `INTERNAL_TRANSFER`, `ADD_TO_BALANCE`.

## Adapter state

- `DistributionStatus`: The distribution status (`Not Started`, `In Progress`, `Done`).
- `Distribution`: State of the proposal.
  - `token`: The distribution token in which the members should receive the funds.
  - `status`: The distribution status.
  - `memberAddr`: The member address that should receive the funds, if 0x0, the funds will be distributed to all members of the DAO.
  - `currentIndex`: Current iteration index to control the cached for-loop.
  - `blockNumber`: The block number in which the proposal has been created.
- `distributions`: Keeps track of all the distributions executed per DAO.
- `ongoingDistributions`: Keeps track of the latest ongoing distribution proposal per DAO to ensure only 1 proposal can be processed at a time.

## Dependencies and interactions (internal / external)

- BankExtension

  - transfers the funds from the DAO account to the member's account.
  - gets the available tokens.
  - gets the historical balance of the guild account.

- DaoRegistry

  - checks if the message sender is actually a member of the DAO.
  - checks if the share holder is actually a member of the DAO.
  - process the distribution proposal.

- Voting

  - starts a new voting for the distribution proposal.
  - checks the voting results.

- FairShareHelper

  - to calculate the amount of funds to be distributed to the member based on the current number of shares of the member - taking into account the historical balance of the GUILD.

## Functions description and assumptions / checks

### receive() external payable

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable
```

### function submitProposal

```solidity

```

### \_submitKickProposal

```solidity

```

## Events

TODO emit distribution event
