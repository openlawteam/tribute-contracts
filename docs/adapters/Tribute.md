## Adapter description and scope

The Tribute adapter allows potential and existing DAO members to contribute any amount of ERC-20 tokens to the DAO in exchange for any amount of DAO internal tokens (e.g., SHARE or LOOT tokens already registered with the DAO Bank). If the proposal passes, the requested internal tokens are minted to the applicant and the tokens provided as tribute are transferred to the DAO. In addition, the applicant becomes a member of the DAO (if not already one).

The Tribute adapter is similar to the Onboarding adapter in that both allow for joining the DAO (or increasing a stake in the DAO) through the exchange of contributed assets for DAO internal tokens. However, there are key differences:

- The Onboarding adapter allows both Ether and ERC-20 tokens to be contributed, whereas the Tribute adapter accepts only ERC-20 tokens.

- The Onboarding adapter mints a fixed amount of internal tokens to the applicant based on the amount of assets contributed. In other words, an onboarding proposal does not specify the amount of internal tokens requested. That is calculated from the DAO's configurations and the amount of assets contributed. The Tribute adapter has more open-ended proposal parameters. The proposer can request any amount of internal tokens to be minted in exchange for any amount of any ERC-20 tokens contributed. The worthiness of that transfer proposal for the DAO is left to the vote of its members.

## Adapter workflow

A tribute is made by first submitting a proposal specifying (1) the applicant who wishes to join the DAO (or increase his stake in the DAO), (2) the amount and type of internal tokens the applicant desires (e.g., member SHARE tokens), and (3) the amount and type of ERC-20 tokens the proposer will transfer to the DAO in exchange for those internal tokens. The applicant and proposer can be separate accounts (e.g., proposer is applying and providing tribute on behalf of the applicant). The internal token type requested must be already registered with the DAO Bank and will usually be pre-defined SHARE or LOOT tokens in the DAO. Prior to submitting the proposal, the proposer must first separately `approve` the adapter as spender of the ERC-20 tokens provided as tribute. The proposal submission will transfer the tribute tokens from the proposer to the adapter to be held in escrow.

If the proposal has not been sponsored yet, the proposer can cancel the proposal. Upon cancellation, the proposal is marked as processed and the tribute tokens are refunded to the proposer. Only the proposer can cancel the proposal.

When a DAO member sponsors the proposal, the voting period begins allowing members to vote for or against the proposal. Only a member can sponsor the proposal.

After the voting period is done along with its subsequent grace period, the proposal can be processed. Any account can process the proposal. Upon processing, if the vote has passed, the requested internal tokens are minted to the applicant and the applicant is added as a DAO member (if not already one). The tribute token is registered with the DAO Bank (if not already registered), and the amount of tribute tokens are added to the Guild balance and transferred out of escrow from the adapter to the DAO.

Upon processing, if the vote has failed, the tribute tokens are refunded to the proposer.

## Adapter configuration

A DAO Bank extension must exist and be configured with proper access for this adapter.

The DAO internal tokens to be minted to the applicant must be registered with the DAO Bank.

DAORegistry Access Flags: `SUBMIT_PROPOSAL`, `SPONSOR_PROPOSAL`, `PROCESS_PROPOSAL`, `NEW_MEMBER`.

Bank Extension Access Flags: `ADD_TO_BALANCE`, `REGISTER_NEW_TOKEN`.

## Adapter state

- `proposals`: All tribute proposals handled by each DAO.
- `ProposalDetails`:
  - `id`: The proposal id.
  - `applicant`: The applicant address (who will receive the DAO internal tokens and become a member).
  - `proposer`: The proposer address (who will provide the token tribute).
  - `tokenToMint`: The address of the DAO internal token to be minted to the applicant.
  - `requestAmount`: The amount requested of DAO internal tokens.
  - `token`: The address of the ERC-20 tokens provided as tribute by the proposer.
  - `tributeAmount`: The amount of tribute tokens.

## Dependencies and interactions (internal / external)

- BankExtension

  - Registers DAO internal token to be minted to the applicant in adapter configuration.
  - Checks if tribute token (ERC-20) is registered with the DAO Bank.
  - Registers tribute token for a passed proposal (if not already registered).
  - Adds to the Guild balance the amount of tribute tokens.
  - Checks if the DAO internal token to be minted to the applicant is registered with the DAO Bank.
  - Adds to the applicant balance the amount of requested DAO internal tokens.

- DaoRegistry

  - Gets Bank extension address.
  - Checks if applicant address is not reserved.
  - Gets Voting adapter address.
  - Submits/sponsors/processes the tribute proposal.
  - Checks if proposal flag is `SPONSORED`, `PROCESSED`.
  - Checks if applicant is `JAILED`.
  - Creates a new member entry (if applicant is not already a member).

- Voting

  - Gets address that sent the sponsorProposal transaction.
  - Starts new voting for the tribute proposal.
  - Checks the voting results.

## Functions description and assumptions / checks

### receive() external payable

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable
```

### function configureDao

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

### function provideTribute

```solidity
    /**
     * @notice Creates a tribute proposal and escrows received tokens into the adapter.
     * @dev Applicant address must not be reserved.
     * @dev The proposer must first separately `approve` the adapter as spender of the ERC-20 tokens provided as tribute.
     * @param dao The DAO address.
     * @param proposalId The proposal id (managed by the client).
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param tokenToMint The address of the DAO internal token to be minted to the applicant.
     * @param requestAmount The amount requested of DAO internal tokens.
     * @param tokenAddr The address of the ERC-20 tokens provided as tribute by the proposer.
     * @param tributeAmount The amount of tribute tokens.
     */
    function provideTribute(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address tokenToMint,
        uint256 requestAmount,
        address tokenAddr,
        uint256 tributeAmount
    ) public override
```

### function sponsorProposal

```solidity
    /**
     * @notice Sponsors a tribute proposal to start the voting process.
     * @dev Only members of the DAO can sponsor a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     * @param data Additional details about the proposal.
     */
    function sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) external override
```

### function \_sponsorProposal

```solidity
    /**
     * @notice Sponsors a tribute proposal to start the voting process.
     * @dev Only members of the DAO can sponsor a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     * @param data Additional details about the proposal.
     * @param sponsoredBy The address of the sponsoring member.
     * @param votingContract The voting contract used by the DAO.
     */
    function _sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data,
        address sponsoredBy,
        IVoting votingContract
    ) internal
```

### function cancelProposal

```solidity
    /**
     * @notice Cancels a tribute proposal which marks it as processed and initiates refund of the tribute tokens to the proposer.
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been sponsored can be cancelled.
     * @dev Only proposer can cancel a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function cancelProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
```

### function processProposal

```solidity
    /**
     * @notice Processes a tribute proposal to handle minting and exchange of DAO internal tokens for tribute tokens (passed vote) or the refund of tribute tokens (failed vote).
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been processed are accepted.
     * @dev Only sponsored proposals with completed voting are accepted.
     * @dev ERC-20 tribute tokens must be registered with the DAO Bank (a passed proposal will check and register the token if needed).
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
```

### function \_submitTributeProposal

```solidity
    /**
     * @notice Submits a tribute proposal to the DAO.
     * @dev Proposal ids must be valid and cannot be reused.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param proposer The proposer address (who will provide the token tribute).
     * @param tokenToMint The address of the DAO internal token to be minted to the applicant.
     * @param requestAmount The amount requested of DAO internal tokens.
     * @param tokenAddr The address of the ERC-20 tokens provided as tribute by the proposer.
     * @param tributeAmount The amount of tribute tokens.
     */
    function _submitTributeProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address proposer,
        address tokenToMint,
        uint256 requestAmount,
        address tokenAddr,
        uint256 tributeAmount
    ) internal
```

### function \_refundTribute

```solidity
    /**
     * @notice Refunds tribute tokens to the proposer.
     * @param tokenAddr The address of the ERC-20 tokens provided as tribute by the proposer.
     * @param proposer The proposer address (who will receive back the tribute tokens).
     * @param amount The amount of tribute tokens to be refunded.
     */
    function _refundTribute(
        address tokenAddr,
        address proposer,
        uint256 amount
    ) internal
```

### function \_mintTokensToMember

```solidity
    /**
     * @notice Adds DAO internal tokens to applicant's balance and creates a new member entry (if applicant is not already a member).
     * @dev Internal tokens to be minted to the applicant must be registered with the DAO Bank.
     * @dev The applicant member cannot be jailed.
     * @param dao The DAO address.
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param proposer The proposer address (who will be refunded the tribute tokens if the minting of internal tokens fails).
     * @param tokenToMint The address of the DAO internal token to be minted to the applicant.
     * @param requestAmount The amount requested of DAO internal tokens.
     * @param token The address of the ERC-20 tokens provided as tribute by the proposer.
     * @param tributeAmount The amount of tribute tokens to be refunded if the minting of internal tokens fails.
     */
    function _mintTokensToMember(
        DaoRegistry dao,
        address applicant,
        address proposer,
        address tokenToMint,
        uint256 requestAmount,
        address token,
        uint256 tributeAmount
    ) internal
```

## Events

No events are emitted from this adapter.
