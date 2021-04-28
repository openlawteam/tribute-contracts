## Adapter description and scope

Financing is the process in which an applicant, member or a non-member of the DAO, submits a proposal asking for funds. If the proposal passes, the funds are released to the applicant.

The main goal is to allow individuals and/or organizations to request funds to finance their projects, and the members of the DAO have the power to vote and decide which projects should be funded.

## Adapter workflow

In order to request funds from the DAO, the applicant must submit a proposal in which one must specify the desired amount and the token address to receive the funds.

The applicant address cannot be a reserved address, which means the address is already reserved for the DAO internal usage. Also, the token address must be allowed/supported by the DAO Bank. If these two conditions are not met, the funding proposal is not created.

## Adapter configuration

Tokens that are provided by the member have to be allowed/supported by the DAO.

The member needs to have enough units and/or loot in order to convert it to funds.

DAORegistry Access Flags: `SUBMIT_PROPOSAL`.

Bank Extension Access Flags: `ADD_TO_BALANCE`, `SUB_FROM_BALANCE`.

## Adapter state

- `proposals`: all financing proposals handled by each DAO.
- `ProposalDetails`:
  - `applicant`: the proposal applicant address, cannot be a reserved address.
  - `amount`: the amount requested for funding.
  - `token`: the token address in which the funding is made to the applicant, needs to be allowed/supported by the DAO Bank.

## Dependencies and interactions (internal / external)

- BankExtension

  - checks if the provided token is allowed/supported by the Bank.
  - subtracts from Guild balance the requested amount based on the provided token.
  - adds to the applicant account the subtracted amount based on the provided token.

- DaoRegistry

  - gets Bank extension address.
  - checks if member address is not reserved.
  - submits/sponsors/processes the financing proposal.
  - gets Voting adapter address.

- Voting

  - gets address that sent the sponsorProposal transaction.
  - starts new voting for the financing proposal.
  - checks the voting results.

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
     * @notice Creates and sponsors a financing proposal.
     * @dev Applicant address must not be reserved.
     * @dev Token address must be allowed/supported by the DAO Bank.
     * @dev Requested amount must be greater than zero.
     * @dev Only members of the DAO can sponsor a financing proposal.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     * @param applicant The applicant address.
     * @param token The token to receive the funds.
     * @param amount The desired amount.
     * @param details Additional detais about the financing proposal.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address token,
        uint256 amount,
        bytes memory data
    ) external override
```

### function processProposal

```solidity
    /**
     * @notice Processing a financing proposal to grant the requested funds.
     * @dev Only proposals that were not processed are accepted.
     * @dev Only proposals that were sponsored are accepted.
     * @dev Only proposals that passed can get processed and have the funds released.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
```

## Events

No events are emitted from this adapter.
