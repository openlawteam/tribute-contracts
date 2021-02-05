## Adapter description and scope

This is a template for the documentation of an Adapter.

Here you can provide a brief description of the adapter and what is the use-case covered by the implementation. It is also good to add the goal of the Adapter and what value it brings to the DAO.

## Adapter workflow

An overview of the entire process executed by Adapter functions, the main interactions and routines covered/executed.

## Adapter configuration

Specify which additional configurations are required to make this adapter work. For instance: needs access to the DAO members, needs access to the DAO Bank, relies on Adapter X, Y and Extension Z.

DAORegistry Access Flags: `SUBMIT_PROPOSAL`, `SPONSOR_PROPOSAL`, `PROCESS_PROPOSAL`, `NEW_MEMBER`.

Bank Extension Access Flags: `ADD_TO_BALANCE`, `REGISTER_NEW_TOKEN`.

## Adapter state

Describe each variable public and private of the adapter and what is the purpose of that variable.

## Dependencies and interactions (internal / external)

Add the information about all the interactions that are triggered by this DAO, which contracts it depends on, and which functions it calls.

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
