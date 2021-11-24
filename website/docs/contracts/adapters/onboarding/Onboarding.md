---
id: onboarding-adapter
title: ERC20/ETH
---

The Onboarding adapter allows potential and existing DAO members to contribute Ether or ERC-20 tokens to the DAO in exchange for a fixed amount of internal tokens (e.g., UNITS or LOOT tokens already registered with the DAO Bank) based on the amount of assets contributed. If the proposal passes, the internal tokens are minted to the applicant (which effectively makes the applicant a member of the DAO if not already one) and the tokens provided as tribute are transferred to the Bank extension.

:::tip
You can mint any internal tokens but it is usually to mint either UNITS or LOOT tokens. The onboarding process supports raw Ether and ERC-20 tokens as tribute. The ERC-20 token must be allowed/supported by the Bank.
:::

## Workflow

An onboarding proposal is made by a member first submitting a proposal specifying (1) the applicant who wishes to join the DAO (or increase his stake in the DAO), (2) the type of internal tokens the applicant desires (e.g., member UNITS), and (3) the amount of Ether or ERC-20 tokens that will transfer to the DAO in exchange for those internal tokens. The applicant and actual owner of the ERC-20 tokens can be separate accounts (e.g., the token owner is providing tribute on behalf of the applicant). The internal token type requested must be already registered with the DAO Bank and will usually be pre-defined UNITS or LOOT tokens in the DAO. The proposal submission does not actually transfer the Ether or ERC-20 tokens from its owner. That occurs only after the proposal passes and is processed.

The proposal is also sponsored in the same transaction when it is submitted. When a DAO member sponsors the proposal, the voting period begins allowing members to vote for or against the proposal. Only a member can sponsor the proposal.

After the voting period is done along with its subsequent grace period, the proposal can be processed. Any account can process a failed proposal. However, only the original proposer (owner of the assets being transferred to the DAO) can process a passed proposal. Prior to processing a passed proposal involving ERC-20 tribute tokens, the owner of those tokens must first separately `approve` the Onboarding adapter as spender of the tokens provided as tribute. Upon processing, if the vote has passed, the internal tokens are minted to the applicant (which effectively makes the applicant a member of the DAO if not already one). The amount of Ether or ERC-20 tokens provided as tribute are added to the Guild balance and transferred from the token owner to the Bank extension.

Upon processing, if the vote has failed (i.e., more NO votes then YES votes or a tie), no further action is taken (the owner of the Ether or ERC-20 tokens still retains ownership of the assets).

## Access Flags

### DaoRegistry

- `SUBMIT_PROPOSAL`
- `UPDATE_DELEGATE_KEY`
- `NEW_MEMBER`

### BankExtension

- `ADD_TO_BALANCE`

## Dependencies

### DaoRegistry

### BankExtension

### Voting

### IERC20

### PotentialNewMember

### ERC20

## Structs

### ProposalDetails

- `id`: The proposalId (provided offchain).
- `unitsToMint`: Which token needs to be minted if the proposal passes.
- `amount`: The amount sent by the proposer.
- `unitsRequested`: The amount of internal tokens that needs to be minted to the applicant if the proposal passes.
- `token`: What currency has been used in the onboarding process. We keep this information even though it is part of the configuration to handle the case where the configuration changes while a proposal has been created but not processed yet.
- `applicant`: The applicant address.

### OnboardingDetails

- `chunkSize`: How many tokens need to be minted per chunk bought.
- `unitsPerChunk`: How many units (tokens from tokenAddr) are being minted per chunk.
- `tokenAddr`: In which currency (tokenAddr) should the onboarding take place.
- `maximumChunks`: How many chunks can someone buy max. This helps force decentralization of token holders.

## Storage

### proposals

The proposals are organized by DAO address and then by proposal id.

### units

Accounting to see the amount of a particular internal token that has been minted for a particular applicant. This is then checked against the maxChunks configuration to determine if the onboarding proposal is allowed or not.

## Functions

### configureDao

Configures the adapter for a particular DAO. The modifier is adapterOnly which means that only if the sender is either a registered adapter of the DAO or if it is in creation mode can it be called. The function checks that chunkSize, unitsPerChunks and maximumChunks cannot be 0.

```solidity
   /**
     * @notice Updates the DAO registry with the new configurations if valid.
     * @notice Updated the Bank extension with the new potential tokens if valid.
     * @param unitsToMint Which token needs to be minted if the proposal passes, it is whitelisted in the Bank.
     * @param chunkSize How many tokens need to be minted per chunk bought.
     * @param unitsPerChunk How many units (tokens from tokenAddr) are being minted per chunk.
     * @param maximumChunks How many chunks can someone buy max. This helps force decentralization of token holders.
     * @param tokenAddr In which currency (tokenAddr) should the onboarding take place.
     */
    function configureDao(
        DaoRegistry dao,
        address unitsToMint,
        uint256 chunkSize,
        uint256 unitsPerChunk,
        uint256 maximumChunks,
        address tokenAddr
    ) external onlyAdapter(dao)
```

### submitProposal

Submits and sponsors the proposal. Only members can call this function.

Uses **\_submitMembershipProposal** to create the proposal.

Uses **\_sponsorProposal** to sponsor the proposal.

```solidity
    /**
     * @notice Submits and sponsors the proposal. Only members can call this function.
     * @param proposalId The proposal id to submit to the DAO Registry.
     * @param applicant The applicant address.
     * @param tokenToMint The token to be minted if the proposal pass.
     * @param tokenAmount The amount of token to mint.
     * @param data Additional proposal information.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address payable applicant,
        address tokenToMint,
        uint256 tokenAmount,
        bytes memory data
    ) public override reentrancyGuard(dao)
```

### processProposal

Once the vote on a proposal is finished, it is time to process it. Anybody can call this function.

The function checks that there is a vote in progress for this proposalId and that it has not been processed yet.
If the vote is a success (`PASS`), then we process it by minting the internal tokens and moving the tokens from the adapter to the bank extension.

If the vote is a tie (`TIE`) or failed (`NOT_PASS`), then the funds are returned to the proposer.

Otherwise, the state is invalid and the transaction is reverted (if the vote does not exist or if it is in progress).

```solidity
    /**
     * @notice Once the vote on a proposal is finished, it is time to process it. Anybody can call this function.
     * @param proposalId The proposal id to be processed. It needs to exist in the DAO Registry.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        payable
        override
        reentrancyGuard(dao)
```

### \_sponsorProposal

Starts a vote on the proposal to onboard a new member.

**dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract))** checks already that the proposal has not been sponsored yet

**voting.startNewVotingForProposal(dao, proposalId, data)** starts the vote process

### \_submitMembershipProposal

```solidity
    /**
     * @notice Marks the proposalId as submitted in the DAO and saves the information in the internal adapter state.
     * @notice Updates the total of units issued in the DAO, and checks if it is within the limits.
     */
    function _submitMembershipProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address tokenToMint,
        address payable applicant,
        uint256 value,
        address token
    ) internal
```

### \_getUnits

```solidity
    /**
     * @notice Gets the current number of units.
     * @param daoAddress The DAO Address that contains the units.
     * @param token The Token Address in which the Unit were minted.
     * @param applicant The Applicant Address which holds the units.
     */
     function _getUnits(
        address daoAddress,
        address token,
        address applicant
    ) internal view
```

### \_configKey

```solidity
    /**
     * @notice Builds the configuration key by encoding an address with a string key.
     * @param tokenAddrToMint The address to encode.
     * @param key The key to encode.
     */
    function _configKey(address tokenAddrToMint, bytes32 key)
        internal
        pure
```

### Events

No events are emitted.
