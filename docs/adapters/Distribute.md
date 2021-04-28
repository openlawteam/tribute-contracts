## Adapter description and scope

The Distribute Adapter provides features in which the DAO members can receive funds from the DAO for any given reason. A good example of that is when the members collectively agree to payout dividends to one or all member of the DAO, when that happens they can submit a proposal for voting, and if the proposal pass the amount is distributed equally to the members.

## Adapter workflow

The token distribution starts when a member submits a proposal to distribute a certain amount of a token for one or all members of the DAO. It is important to mention that the distribution can only happen for 1 member or for all, there is no way to distribute the tokens for a subset of the DAO members.

Once the distribution proposal gets created, it is open for voting, and sponsored by the message sender. The adapter tracks all the distributions that have been executed already by each DAO, and also tracks the current distributions that is in progress - this is done to ensure the distributions are executed sequentially per DAO.

Once the distribution proposal has passed, the other members have to start the actual distribution process (function `processProposal`). In this process the member indicated in the proposal or each member of the DAO will receive, based on the current number of holding units, a token amount in the internal bank account, so it can be withdraw later on. This process does not changes the number of units of the members, it just uses it to calculate the fair amount to distribute for each member. After that, the distribution proposal gets updated to `Completed`.

## Adapter configuration

The member needs to have at least 1 unit to be able to receive funds from a distribution proposal.

DAORegistry Access Flags: `SUBMIT_PROPOSAL`.

Bank Extension Access Flags: `INTERNAL_TRANSFER`.

## Adapter state

- `DistributionStatus`: The distribution status (`Not Started`, `In Progress`, `Done`).
- `Distribution`: State of the proposal.
  - `token`: The distribution token in which the members should receive the funds. Must be supported by the DAO.
  - `amount`: The amount to distribute.
  - `status`: The distribution status.
  - `unitHolderAddr`: The member address that should receive the funds, if 0x0, the funds will be distributed to all members of the DAO.
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
  - checks if the unit holder is actually a member of the DAO.
  - process the distribution proposal.

- Voting

  - starts a new voting for the distribution proposal.
  - checks the voting results.

- FairShareHelper

  - to calculate the amount of funds to be distributed to the member based on the current number of units of the member - taking into account the historical balance of the GUILD.

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
    /**
     * @notice Creates a distribution proposal for one or all members of the DAO, opens it for voting, and sponsors it.
     * @dev Only tokens that are allowed by the Bank are accepted.
     * @dev If the unitHolderAddr is 0x0, then the funds will be distributed to all members of the DAO.
     * @dev Proposal ids can not be reused.
     * @dev The amount must be greater than zero.
     * @param dao The dao address.
     * @param proposalId The distribution proposal id.
     * @param unitHolderAddr The member address that should receive the funds, if 0x0, the funds will be distributed to all members of the DAO.
     * @param token The distribution token in which the members should receive the funds. Must be supported by the DAO.
     * @param amount The amount to distribute.
     * @param data Additional information related to the distribution proposal.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address unitHolderAddr,
        address token,
        int256 amount,
        bytes calldata data
    ) external

```

### \_submitProposal

```solidity
    /**
     * @notice Creates the proposal, starts the voting process and sponsors the proposal.
     * @dev If the unit holder address was provided in the params, the unit holder must have enough units to receive the funds.
     */
    function _submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address unitHolderAddr,
        address token,
        uint256 amount,
        bytes calldata data,
        address submittedBy
    ) internal onlyMember2(dao, submittedBy)
```

### processProposal

```solidity
    /**
     * @notice Process the distribution proposal, calculates the fair amount of funds to distribute to the members based on the units holdings.
     * @dev A distribution proposal must be in progress.
     * @dev Only one proposal per DAO can be executed at time.
     * @dev Only active members can receive funds.
     * @dev Only proposals that passed the voting can be set to In Progress status.
     * @param dao The dao address.
     * @param proposalId The distribution proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external

```

### distribute

```solidity
     /**
     * @notice Transfers the funds from the Guild account to the member's internal accounts.
     * @notice The amount of funds is caculated using the historical number of units of each member.
     * @dev A distribution proposal must be in progress.
     * @dev Only proposals that have passed the voting can be completed.
     * @dev Only active members can receive funds.
     * @param dao The dao address.
     * @param toIndex The index to control the cached for-loop.
     */
    function distribute(DaoRegistry dao, uint256 toIndex) external override

```

## Events

When the distribution process is completed the `Distributed` event is emitted with the `token`, `amount`, and `unitHolder` parameters. If the `unitHolder` is `0x0`, the amount was distributed to **all** members of the DAO, otherwise it was distributed to the unit holder only.
