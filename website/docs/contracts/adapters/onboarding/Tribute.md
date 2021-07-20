---
id: tribute-adapter
title: ERC20 Tribute
---

The Tribute adapter allows potential and existing DAO members to contribute any amount of ERC-20 tokens to the DAO in exchange for any amount of DAO internal tokens (e.g., UNITS or LOOT tokens already registered with the DAO Bank). If the proposal passes, the requested internal tokens are minted to the applicant (which effectively makes the applicant a member of the DAO if not already one) and the tokens provided as tribute are transferred to the Bank extension.

The Tribute adapter is similar to the Onboarding adapter in that both allow for joining the DAO (or increasing a stake in the DAO) through the exchange of contributed assets for DAO internal tokens. However, there are key differences:

- The Onboarding adapter allows both Ether and ERC-20 tokens to be contributed. The Tribute adapter accepts only ERC-20 tokens.

- The Onboarding adapter mints a fixed amount of internal tokens to the applicant based on the amount of assets contributed. In other words, an onboarding proposal does not specify the amount of internal tokens requested. That is calculated from the DAO's configurations and the amount of assets contributed. The Tribute adapter has more open-ended proposal parameters. The proposer can request any amount of internal tokens to be minted in exchange for any amount of any ERC-20 tokens contributed. The worthiness of that transfer proposal for the DAO is left to the vote of its members.

## Workflow

A tribute is made by a member first submitting a proposal specifying (1) the applicant who wishes to join the DAO (or increase his stake in the DAO), (2) the amount and type of internal tokens the applicant desires (e.g., member UNITS), and (3) the amount, type, and owner of ERC-20 tokens that will transfer to the DAO in exchange for those internal tokens. The applicant and actual owner of the ERC-20 tokens can be separate accounts (e.g., the token owner is providing tribute on behalf of the applicant). The internal token type requested must be already registered with the DAO Bank and will usually be pre-defined UNITS or LOOT tokens in the DAO. The proposal submission does not actually transfer the ERC-20 tokens from its owner. That occurs only after the proposal passes and is processed.

The proposal is also sponsored in the same transaction when it is submitted. When a DAO member sponsors the proposal, the voting period begins allowing members to vote for or against the proposal. Only a member can sponsor the proposal.

After the voting period is done along with its subsequent grace period, the proposal can be processed. Any account can process the proposal. However, prior to processing a passed proposal, the owner of the ERC-20 tribute tokens must first separately `approve` the Tribute adapter as spender of the tokens provided as tribute. Upon processing, if the vote has passed, the requested internal tokens are minted to the applicant (which effectively makes the applicant a member of the DAO if not already one). The tribute token is registered with the DAO Bank (if not already registered), and the amount of tribute tokens are added to the Guild balance and transferred from the token owner to the Bank extension.

Upon processing, if the vote has failed (i.e., more NO votes then YES votes or a tie), no further action is taken (the owner of the ERC-20 tribute tokens still retains ownership of the tokens).

## Access Flags

### DaoRegistry

- `SUBMIT_PROPOSAL`
- `NEW_MEMBER`

### BankExtension

- `ADD_TO_BALANCE`
- `REGISTER_NEW_TOKEN`

## Dependencies

### DaoRegistry

### BankExtension

### Voting

### ERC20

### PotentialNewMember

## Structs

### ProposalDetails

- `id`: The proposal id.
- `applicant`: The applicant address (who will receive the DAO internal tokens and become a member; this address may be different than the actual owner of the ERC-20 tokens being provided as tribute).
- `tokenToMint`: The address of the DAO internal token to be minted to the applicant.
- `requestAmount`: The amount requested of DAO internal tokens.
- `token`: The address of the ERC-20 tokens that will be transferred to the DAO in exchange for DAO internal tokens.
- `tributeAmount`: The amount of tribute tokens.
- `tributeTokenOwner`: The owner of the ERC-20 tokens being provided as tribute.

## Storage

### proposals

All tribute proposals handled by each DAO.

## Functions

### receive

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable
```

### configureDao

```solidity
    /**
     * @notice Configures the adapter for a particular DAO.
     * @notice Registers the DAO internal token with the DAO Bank.
     * @dev Only adapters registered to the DAO can execute the function call (or if the DAO is in creation mode).
     * @dev A DAO Bank extension must exist and be configured with proper access for this adapter.
     * @param dao The DAO address.
     * @param tokenAddrToMint The internal token address to be registered with the DAO Bank.
     */
    function configureDao(DaoRegistry dao, address tokenAddrToMint)
        external
        onlyAdapter(dao)
```

### submitProposal

```solidity
    /**
     * @notice Creates and sponsors a tribute proposal to start the voting process.
     * @dev Applicant address must not be reserved.
     * @dev Only members of the DAO can sponsor a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id (managed by the client).
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param tokenToMint The address of the DAO internal token to be minted to the applicant.
     * @param requestAmount The amount requested of DAO internal tokens.
     * @param tokenAddr The address of the ERC-20 tokens that will be transferred to the DAO in exchange for DAO internal tokens.
     * @param tributeAmount The amount of tribute tokens.
     * @param tributeTokenOwner The owner of the ERC-20 tokens being provided as tribute.
     * @param data Additional information related to the tribute proposal.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address tokenToMint,
        uint256 requestAmount,
        address tokenAddr,
        uint256 tributeAmount,
        address tributeTokenOwner,
        bytes memory data
    ) external reentrancyGuard(dao)
```

### processProposal

```solidity
    /**
     * @notice Processes a tribute proposal to handle minting and exchange of DAO internal tokens for tribute tokens (passed vote).
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been processed are accepted.
     * @dev Only sponsored proposals with completed voting are accepted.
     * @dev The owner of the ERC-20 tokens provided as tribute must first separately `approve` the adapter as spender of those tokens (so the tokens can be transferred for a passed vote).
     * @dev ERC-20 tribute tokens must be registered with the DAO Bank (a passed proposal will check and register the token if needed).
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        reentrancyGuard(dao)
```

## Events

- No events are emitted.
