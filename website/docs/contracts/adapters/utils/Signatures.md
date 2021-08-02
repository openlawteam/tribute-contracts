---
id: signature-adapter
title: Signatures
---

Signatures enable DAOs to sign arbitrary messages or typed data through the configured governance options. Smart contracts can not natively sign messages like an EOA can, so this adapter uses the ERC1271 standard for smart contract signatures.

The main goal is to enable DAOs to interact with applications that rely on signatures for authentication and order book management, among other use cases.

## Workflow

In order for the DAO to sign a message, a member must calculate the signature data externally then submit the permission hash, signature hash, and magic value to the DAO for a proposal.

## Access Flags

### DaoRegistry

- `SUBMIT_PROPOSAL`

### ERC1271Extension

- `SIGN`

## Dependencies

### DaoRegistry

### ERC1271Extension

### Voting

## Structs

### ProposalDetails

- `permissionHash`: the hash of the data to be signed
- `signature`: the hash fo the signature to be marked as valid if passed
- `magicValue`: the value to return if the signature is valid

## Storage

### proposals

All signature proposals handled by each DAO.

## Functions

### receive

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable
```

### submitProposal

```solidity
    /**
     * @notice Creates and sponsors a signature proposal.
     * @dev Only members of the DAO can sponsor a signature proposal.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     * @param permissionHash The hash of the data to be signed
     * @param signatureHash The hash of the signature to be marked as valid
     * @param magicValue The value to return when a signature is valid
     * @param data Additional details about the signature proposal.
     */
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes32 permissionHash,
        bytes32 signatureHash,
        bytes4 magicValue,
        bytes memory data
    ) external override reentrancyGuard(dao)
```

### processProposal

```solidity
    /**
     * @notice Processing a signature proposal to mark the signature as valid
     * @dev Only proposals that were not processed are accepted.
     * @dev Only proposals that were sponsored are accepted.
     * @dev Only proposals that passed can get processed
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reentrancyGuard(dao)
```

## Events

- No events are emitted.
