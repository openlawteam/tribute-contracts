---
id: kyc-onboarding-adapter
title: KYC ERC20/ETH
---

The KYC Onboarding adapter is a mix between Coupon onboarding and Onboarding adapter.

- Like with Coupon Onboarding, there is no proposals involved in the onboarding process.
- Like with Coupon Onboarding, an attestation (in this case, that you have been KYCed) has to be provided.
- Like with Onboarding, the number of internal tokens minted is linked to the amount contributed.

The only difference between Kyc Onboarding and the two others is that if configured, the funds won't go to the bank but instead directly to an external address.

## Workflow

To join the DAO, any member needs to first get KYCed and then contribute the right amount to get his UNITS.
A member can use KYCOnboarding only once, i.e. if he is already a member he cannot use it.

There is no proposal involved here, i.e. if you are eligible to become a member you can join automatically.

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

### Coupon

- `kycedMember`: The address of the member that has been verified, and is allowed to redeem a coupon to join the DAO.

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
     * @notice Configures the Adapter with the coupon signer address and token to mint.
     * @param dao the dao to configure
     * @param signerAddress is the DAO instance to be configured
     * @param chunkSize how many wei per chunk
     * @param unitsPerChunk how many units do we get per chunk
     * @param maximumChunks maximum number of chunks allowed
     * @param maxUnits how many internal tokens can be minted
     * @param maxMembers maximum number of members allowed to join
     * @param fundTargetAddress multisig address to transfer the money from, set it to address(0) if you dont want to use a multisig
     * @param tokenAddr the token in which the onboarding can take place
     * @param internalTokensToMint the token that will be minted when the member joins the DAO
     */
    function configureDao(
        DaoRegistry dao,
        address signerAddress,
        uint256 chunkSize,
        uint256 unitsPerChunk,
        uint256 maximumChunks,
        uint256 maxUnits,
        uint256 maxMembers,
        address fundTargetAddress,
        address tokenAddr,
        address internalTokensToMint
    ) external onlyAdapter(dao)
```

### hashCouponMessage

```solidity
/**
     * @notice Hashes the provided coupon as an ERC712 hash.
     * @param dao is the DAO instance to be configured
     * @param coupon is the coupon to hash
     */
    function hashCouponMessage(DaoRegistry dao, Coupon memory coupon)
        public
        view
        returns (bytes32)
```

### onboardEth

```solidity
    /**
     * @notice Starts the onboarding propocess of a kyc member that is using ETH to join the DAO.
     * @param kycedMember The address of the kyced member that wants to join the DAO.
     * @param signature The signature that will be verified to redeem the coupon.
     */
    function onboardEth(
        DaoRegistry dao,
        address kycedMember,
        bytes memory signature
    ) external payable
```

### onboard

```solidity
    /**
     * @notice Starts the onboarding process of a kyc member that is any ERC20 token to join the DAO.
     * @param kycedMember The address of the kyced member that wants to join the DAO.
     * @param tokenAddr The address of the ERC20 token that contains that funds of the kycedMember.
     * @param amount The amount in ERC20 that will be contributed to the DAO in exchange for the DAO units.
     * @param signature The signature that will be verified to redeem the coupon.
     */
    function onboard(
        DaoRegistry dao,
        address kycedMember,
        address tokenAddr,
        uint256 amount,
        bytes memory signature
    ) external
```

### \_onboard

```solidity
/**
     * @notice Redeems a coupon to add a new member
     * @param dao is the DAO instance to be configured
     * @param kycedMember is the address that this coupon authorized to become a new member
     * @param tokenAddr is the address the ETH address(0) or an ERC20 Token address
     * @param signature is message signature for verification
     */
    function _onboard(
        DaoRegistry dao,
        address kycedMember,
        address tokenAddr,
        uint256 amount,
        bytes memory signature
    ) internal reentrancyGuard(dao)
```

### \_checkData

```solidity
/**
     * @notice Verifies if the given amount is enough to join the DAO
     */
    function _checkData(
        DaoRegistry dao,
        address tokenAddr,
        uint256 amount
    ) internal view returns (OnboardingDetails memory details)
```

### \_checkKycCoupon

```solidity
/**
     * @notice Checks if the given signature is valid, if so the member is allowed to reedem the coupon and join the DAO.
     * @param kycedMember is the address that this coupon authorized to become a new member
     * @param tokenAddr is the address the ETH address(0) or an ERC20 Token address.
     * @param signature is message signature for verification
     */
    function _checkKycCoupon(
        DaoRegistry dao,
        address kycedMember,
        address tokenAddr,
        bytes memory signature
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
        returns (bytes32)
```

### Events

### Onboarded

When the onboarding process is completed the `Onboarded` event is emitted with the `dao` and `member` addresses, and `amount` of units minted to the new member.

- `event Onboarded(DaoRegistry dao, address member, uint256 units);`
