pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "../helpers/FlagHelper.sol";
import "../utils/SafeCast.sol";

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
    using SafeCast for uint256;

    struct Coupon {
        address authorizedMember;
        uint256 amount;
        uint256 nonce;
    }

	bytes32 publicKey;
	mapping (address => mapping(uint256 => uint256)) flags;

    function redeemCoupon(DaoRegistry dao, address authorizedMember, uint256 amount, uint256 nonce, bytes32 signature) external {
        Coupon memory coupon = Coupon(authorizedMember, amount, nonce);
        bytes32 signature = sigUtils

        uint256 currentFlag = flags[dao][nonce / 256];
        setFlag(currentFlag, nonce % 256, true);
    }
}
