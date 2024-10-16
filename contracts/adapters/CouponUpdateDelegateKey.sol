pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";
import "../utils/Signatures.sol";
import "../helpers/DaoHelper.sol";

/**
MIT License

Copyright (c) 2024 Openlaw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

contract CouponUpdateDelegateKeyContract is
    Reimbursable,
    AdapterGuard,
    Signatures
{
    struct Coupon {
        address authorizedMember;
        address newDelegateKey;
        uint256 nonce;
    }

    using SafeERC20 for IERC20;

    string public constant COUPON_MESSAGE_TYPE =
        "Message(address authorizedMember,address newDelegateKey,uint256 nonce)";

    bytes32 public constant COUPON_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(COUPON_MESSAGE_TYPE));

    bytes32 constant SignerAddressConfig =
        keccak256("coupon-update-delegate-key.signerAddress");

    mapping(address => mapping(uint256 => uint256)) private _flags;

    event CouponRedeemed(
        address daoAddress,
        uint256 nonce,
        address authorizedMember,
        address newDelegateKey
    );

    /**
     * @notice Configures the Adapter with the coupon signer address.
     * @param signerAddress the address of the coupon signer
     */
    function configureDao(
        DaoRegistry dao,
        address signerAddress
    ) external onlyAdapter(dao) {
        dao.setAddressConfiguration(SignerAddressConfig, signerAddress);
    }

    /**
     * @notice Hashes the provided coupon as an ERC712 hash.
     * @param dao is the DAO instance to be configured
     * @param coupon is the coupon to hash
     */
    function hashCouponMessage(
        DaoRegistry dao,
        Coupon memory coupon
    ) public view returns (bytes32) {
        bytes32 message = keccak256(
            abi.encode(
                COUPON_MESSAGE_TYPEHASH,
                coupon.authorizedMember,
                coupon.newDelegateKey,
                coupon.nonce
            )
        );

        return hashMessage(dao, address(this), message);
    }

    /**
     * @notice Redeems a coupon to update the delegate key
     * @param dao is the DAO instance to be configured
     * @param authorizedMember is the member that this coupon authorized to update the delegate key
     * @param newDelegateKey is the new delegate key for the member
     * @param nonce is a unique identifier for this coupon request
     * @param signature is message signature for verification
     */
    // function is protected against reentrancy attack with the reentrancyGuard(dao)
    // slither-disable-next-line reentrancy-benign
    function redeemCoupon(
        DaoRegistry dao,
        address authorizedMember,
        address newDelegateKey,
        uint256 nonce,
        bytes memory signature
    ) external reimbursable(dao) {
        {
            uint256 currentFlag = _flags[address(dao)][nonce / 256];
            _flags[address(dao)][nonce / 256] = DaoHelper.setFlag(
                currentFlag,
                nonce % 256,
                true
            );

            require(
                DaoHelper.getFlag(currentFlag, nonce % 256) == false,
                "coupon already redeemed"
            );
        }

        Coupon memory coupon = Coupon(authorizedMember, newDelegateKey, nonce);
        bytes32 hash = hashCouponMessage(dao, coupon);

        require(
            SignatureChecker.isValidSignatureNow(
                dao.getAddressConfiguration(SignerAddressConfig),
                hash,
                signature
            ),
            "invalid sig"
        );
        dao.updateDelegateKey(authorizedMember, newDelegateKey);

        //slither-disable-next-line reentrancy-events
        emit CouponRedeemed(
            address(dao),
            nonce,
            authorizedMember,
            newDelegateKey
        );
    }
}
