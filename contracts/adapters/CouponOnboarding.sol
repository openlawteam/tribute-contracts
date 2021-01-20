pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "../helpers/FlagHelper.sol";
import "../utils/Signatures.sol";

/**
MIT License

Copyright (c) 2020 Openlaw

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

contract CouponOnboardingContract is
    DaoConstants,
    MemberGuard,
    AdapterGuard
{

    struct Coupon {
        address authorizedMember;
        uint256 amount;
        uint256 nonce;
    }

    string public constant COUPON_MESSAGE_TYPE =
      "Message(address authorizedMember,uint256 amount,uint256 nonce)";
    bytes32 public constant COUPON_MESSAGE_TYPEHASH =
      keccak256(abi.encodePacked(COUPON_MESSAGE_TYPE));

    uint256 chainId;
    address publicKey;
	mapping (address => mapping(uint256 => uint256)) flags;

    function hashCouponMessage(DaoRegistry dao, address actionId, Coupon memory coupon)
    public
    view
    returns (bytes32)
    {
        bytes32 message = keccak256(
            abi.encode(
                COUPON_MESSAGE_TYPEHASH,
                coupon.authorizedMember,
                coupon.amount,
                coupon.nonce
            )
        );

    return
        Signatures.hashMessage(dao, chainId, actionId, message);
    }

    function redeemCoupon(DaoRegistry dao, address authorizedMember, uint256 amount, uint256 nonce, bytes memory signature) external {
        uint256 currentFlag = flags[address(dao)][nonce / 256];
        require (
            _getFlag(currentFlag, nonce % 256) == false,
            "coupon has already been redeemed"
        );

        Coupon memory coupon = Coupon(authorizedMember, amount, nonce);
        bytes32 hash = hashCouponMessage(dao, msg.sender, coupon);
        address recoveredKey = Signatures.recover(hash, signature);

        require (
            recoveredKey == publicKey,
            "coupon signature is invalid"
        );

        flags[address(dao)][nonce / 256] = _setFlag(currentFlag, nonce % 256, true);

        dao.addToBalance(authorizedMember, tokenToMint, tokenAmount);
        // shares accounting in onboarding adapter?
    }

    function _getFlag(uint256 _flags, uint256 flag) internal pure returns (bool) {
        return (_flags >> uint8(flag)) % 2 == 1;
    }

    function _setFlag(
        uint256 _flags,
        uint256 flag,
        bool value
    ) public pure returns (uint256) {
        if (_getFlag(_flags, flag) != value) {
            if (value) {
                return _flags + 2**uint256(flag);
            } else {
                return _flags - 2**uint256(flag);
            }
        } else {
            return _flags;
        }
    }
}
