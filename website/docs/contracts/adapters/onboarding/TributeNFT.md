---
id: tribute-nft-adapter
title: ERC721/1155 Tribute
---

The Tribute NFT adapter allows potential and existing DAO members to contribute any ERC-721 and ERC-1155 tokens to the DAO in exchange for any amount of DAO internal tokens (in this case it mints UNITS always). If the proposal passes, the requested internal tokens are minted to the applicant (which effectively makes the applicant a member of the DAO if not already one) and the ERC-721/1155 asset provided as tribute is transferred to the NFT extension.

The Tribute NFT adapter is similar to the Onboarding adapter in that both allow for joining the DAO (or increasing a stake in the DAO) through the exchange of contributed assets for DAO internal tokens. However, there are key differences:

- The Onboarding adapter allows both Ether and ERC-20 tokens to be contributed. The Tribute NFT adapter accepts only ERC-721 and/or ERC-1155 tokens.

- The Onboarding adapter mints a fixed amount of internal tokens to the applicant based on the amount of assets contributed. In other words, an onboarding proposal does not specify the amount of internal tokens requested. That is calculated from the DAO's configurations and the amount of assets contributed. The Tribute NFT adapter has more open-ended proposal parameters. The proposer can request any amount of internal tokens to be minted in exchange for an ERC-721/1155 token contributed. The worthiness of that transfer proposal for the DAO is left to the vote of its members.

## Workflow

A tribute is made by a member first submitting a proposal specifying (1) the applicant who wishes to join the DAO (or increase his stake in the DAO), (2) the amount of internal tokens (UNITS) the applicant desires, and (3) the ERC-721/1155 address and token id of the NFT that will transfer to the DAO in exchange for those internal tokens. If the applicant wants to join using an ERC-712, the `tributeAmount` must be set to `0` - always, anything greater than `0` is considered an ERC-1155 token, and the asset will get stored in the ERC-1155 extension - if it is a valid token, and the proposal processed.

The proposal submission does not actually transfer the ERC-721/1155 token from its owner. That occurs only after the proposal passes and is processed.

The proposal is also sponsored in the same transaction when it is submitted. When a DAO member sponsors the proposal, the voting period begins allowing members to vote for or against the proposal. Only a member can sponsor the proposal.

After the voting period is done along with its subsequent grace period, the proposal can be processed. Any account can process the proposal. However, prior to processing a passed proposal, the ERC-721 token owner must first separately `approve` the `NFT ERC721 extension` as spender of the token provided as tribute, or if it is an ERC-1155 token, the token owner needs to call the `setApprovalForAll` to approve the `ERC1155TokenExtension` as spender.

Upon processing, if the vote has passed, the requested internal tokens are minted to the applicant (which effectively makes the applicant a member of the DAO if not already one). The tribute token is transferred from the token owner to the NFT extension.

Upon processing, if the vote has failed (i.e., more NO votes then YES votes or a tie), no further action is taken (the ERC-721/1155 token owner still retains ownership of the token).

## Access Flags

### DaoRegistry

- `SUBMIT_PROPOSAL`
- `NEW_MEMBER`

### NFTExtension

- `COLLECT_NFT`

### BankExtension

- `ADD_TO_BALANCE`

## Dependencies

### BankExtension

### NFTExtension

### ERC1155TokenExtension

### DaoRegistry

### Voting

### PotentialNewMember

### IERC721

### IERC1155

## Storage

## Structs

### ProposalDetails

- `id`: The proposal id.
- `applicant`: The applicant address (who will receive the DAO internal tokens and become a member; this address may be different than the actual owner of the ERC-721 token being provided as tribute).
- `nftAddr`: The address of the ERC-721 token that will be transferred to the DAO in exchange for DAO internal tokens.
- `nftTokenId`: The NFT token identifier.
- `tributeAmount`: The amount of nftTokenId for ERC1155 tokens, if 0, it is an ERC721.
- `requestAmount`: The amount requested of DAO internal tokens (UNITS).

### ProcessProposal

This struct is used to pass as data when we send the NFT or ERC1155 token to the adapter

- `dao`the dao registry address
- `proposalId` the proposal Id

### proposals

All tribute NFT proposals handled by each DAO.

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
     * @notice Registers the DAO internal token UNITS with the DAO Bank.
     * @dev Only adapters registered to the DAO can execute the function call (or if the DAO is in creation mode).
     * @dev A DAO Bank extension must exist and be configured with proper access for this adapter.
     * @param dao The DAO address.
     */
    function configureDao(DaoRegistry dao) external onlyAdapter(dao)
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
     * @param nftAddr The address of the ERC-721 or ERC 1155 token that will be transferred to the DAO in exchange for DAO internal tokens.
     * @param nftTokenId The NFT token id.
     * @param tributeAmount The amount of nftTokenId for ERC1155 tokens, if 0, it is an ERC721
     * @param requestAmount The amount requested of DAO internal tokens (UNITS).
     * @param data Additional information related to the tribute proposal.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address nftAddr,
        uint256 nftTokenId,
        uint256 tributeAmount,
        uint256 requestAmount,
        bytes memory data
    ) external reentrancyGuard(dao)
```

### onERC721Received

```solidity
function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    )
```

This function is called by the ERC-721 smart contract after an NFT has been transfered to the adapter. It is used to process the proposal.
in data, you need to pass the encoded version of the struct ProcessProposal

### onERC1155Received

```solidity
function onERC1155Received(
        address operator,
        address from,
        uint256 tokenId,
        uint256 value,
        bytes calldata data
    )
```

This function is called by the ERC-1155 smart contract after an NFT has been transfered to the adapter. It is used to process the proposal.
in data, you need to pass the encoded version of the struct ProcessProposal

## Events

- No events are emitted.
