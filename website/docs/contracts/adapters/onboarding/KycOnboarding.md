---
id: kyc-onboarding-adapter
title: ERC20/ETH
---

The KYC Onboarding adapter is a mix between Coupon onboarding and Onboarding adapter.

- Like with Coupon Onboarding, there is no proposals involved in the onboarding process.
- Like with Coupon Onboarding, an attestation (in this case, that you have been KYCed) has to be provided.
- Like with Onboarding, the number of internal tokens minted is linked to the amount contributed.

The only difference between Kyc Onboarding and the two others is that if configured, the funds won't go to the bank but instead directly to an external address.

## Workflow

To join the DAO, any member needs to first get KYCed and then contribute the right amount to get his UNITS.
A member can use KYCOnboarding only once, i.e. if he is already a member he cannot use it.

There is no proposal involved here, i.e. if you are elligible to become a member you can join automatically.

## Access Flags

### DaoRegistry

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

### OnboardingDetails

- `chunkSize`: How many tokens need to be minted per chunk bought.
- `numberOfChunks`: How many chunks need to be created based on the contribution.
- `unitsPerChunk`: How many units (tokens from tokenAddr) are being minted per chunk.
- `unitsRequested`: which internal token to mint
- `amount`: the amount of internal tokens minted
- `maximumTotalUnits`: How many internal tokens can be minted

## Storage

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

### \_onboardEth

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

### \_onboard

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

## Events

- No events are emitted.
