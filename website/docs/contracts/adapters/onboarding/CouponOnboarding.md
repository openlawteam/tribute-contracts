---
id: coupon-onboarding-adapter
title: Coupon
---

The CouponOnboarding adapter provides a way to onboard an initial group of members quickly without requiring multiple proposals.

The DAO creator can produce and sign coupons which allow redemption of a particular number of units by a given address. When the coupon is redeemed the units are directly issued to the new member.

## Workflow

Redeem coupon request

- check that the coupon has not already been redeemed
- check that the signed hash matches the hash of the redeem arguments
- check that the signer of the coupon matches the configured signer
- mint the configured tokens to the new member
- mark the coupon redeemed

## Access Flags

### DaoRegistry

- `NEW_MEMBER`

### BankExtension

- `ADD_TO_BALANCE`

## Dependencies

### DaoRegistry

### BankExtension

### Signatures

## Structs

### Coupon

The coupon structure contains the data fields necessary to redeem and add a new member.

- `authorizedMember`: The address that this coupon authorized to become a new member.
- `amount`: The amount of units that this member will receive.
- `nonce`: A unique identifier for this coupon request.

### PotentialNewMember

## Storage

### \_chainId

The chain id in which it has been deployed, which is used to hash the coupon message.

### \_flags

Tracks all the coupons that were redeemed per DAO.

### signerAddress

The public address of the signer key used to generate coupons for this adapter.

### tokenAddrToMint

The address of the token that will be created and issued to the address in the redeemed coupons.

## Functions

### receive

```solidity
/**
 * @notice default fallback function to prevent from sending ether to the contract
 */
receive() external payable {
  revert("fallback revert");
}

```

### configure

```solidity
   /**
    * @notice Configures the Adapter with the coupon signer address and token to mint.
    * @param signerAddress is the DAO instance to be configured
    * @param tokenAddrToMint is the coupon to hash
    */
    function configureDao(
        DaoRegistry dao,
        address signerAddress,
        address tokenAddrToMint
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

### redeemCoupon

```solidity
    /**
     * @notice Redeems a coupon to add a new member.
     * @param dao is the DAO instance to be configured
     * @param authorizedMember is the address that this coupon authorized to become a new member
     * @param amount is the amount of units that this member will receive
     * @param nonce is a unique identifier for this coupon request
     * @param signature is message signature for verification
     */
    function redeemCoupon(
        DaoRegistry dao,
        address authorizedMember,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external reentrancyGuard(dao)
```

## Events

### CouponRedeemed

- `event CouponRedeemed( address daoAddress, uint256 nonce, address authorizedMember, uint256 amount );`
