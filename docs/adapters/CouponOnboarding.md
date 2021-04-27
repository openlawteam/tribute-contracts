## Adapter description and scope

The CouponOnboarding adapter provides a way to onboard an initial group of members quickly without requiring multiple proposals.

The DAO creator can produce and sign coupons which allow redemption of a particular number of units by a given address. When the coupon is redeemed
the units are directly issued to the new member.

## Adapter workflow

Redeem coupon request

- check that the coupon has not already been redeemed
- check that the signed hash matches the hash of the redeem arguments
- check that the signer of the coupon matches the configured signer
- mint the configured tokens to the new member
- mark the coupon redeemed

## Adapter configuration

DAORegistry Access Flags: `NEW_MEMBER`.

Bank Extension Access Flags: `ADD_TO_BALANCE`.

### signerAddress

The public address of the signer key used to generate coupons for this adapter.

### tokenAddrToMint

The address of the token that will be created and issued to the address in the redeemed coupons.

## Adapter state

### Coupon

The coupon structure contains the data fields necessary to redeem and add a new member.

#### authorizedMember

The address that this coupon authorized to become a new member.

#### amount

The amount of units that this member will receive.

#### nonce

A unique identifier for this coupon request.

## Dependencies and interactions (internal / external)

## Functions description and assumptions / checks

### function hashCouponMessage(DaoRegistry dao, Coupon memory coupon) public view returns (bytes32)

Hashes the provided coupon as an ERC712 hash.

**dao** is the DAO instance to be configured
**coupon** is the coupon to hash

### function redeemCoupon(DaoRegistry dao, address authorizedMember, uint256 amount, uint256 nonce, bytes memory signature) external

Redeems a coupon to add a new member.

**dao** is the DAO instance to be configured
**authorizedMember** is the address that this coupon authorized to become a new member.
**amount** is the amount of units that this member will receive.
**nonce** is a unique identifier for this coupon request.
