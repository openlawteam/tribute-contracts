pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/BankV1.sol";
import "../guards/AdapterGuard.sol";
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

contract CouponV1OnboardingContract is
    AdapterGuard,
    Signatures
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

    bytes32 constant SignerAddressConfig =
        keccak256("coupon-onboarding.signerAddress");
    bytes32 constant TokenAddrToMint =
        keccak256("coupon-onboarding.tokenAddrToMint");

    mapping(address => mapping(uint256 => uint256)) flags;

    event CouponRedeemed(
        address daoAddress,
        uint256 nonce,
        address authorizedMember,
        uint256 amount
    );

    function configureDao(
        DaoRegistry dao,
        address signerAddress,
        address tokenAddrToMint
    ) external onlyAdapter(dao) {
        dao.setAddressConfiguration(SignerAddressConfig, signerAddress);
        dao.setAddressConfiguration(TokenAddrToMint, tokenAddrToMint);

        BankV1Extension bank = BankV1Extension(dao.getExtensionAddress(DaoHelper.BANK));
        bank.registerPotentialNewInternalToken(tokenAddrToMint);
    }

    function hashCouponMessage(DaoRegistry dao, Coupon memory coupon)
        public
        view
        returns (bytes32)
    {
        bytes32 message =
            keccak256(
                abi.encode(
                    COUPON_MESSAGE_TYPEHASH,
                    coupon.authorizedMember,
                    coupon.amount,
                    coupon.nonce
                )
            );

        return hashMessage(dao, address(this), message);
    }

    function redeemCoupon(
        DaoRegistry dao,
        address authorizedMember,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external reentrancyGuard(dao) {
        uint256 currentFlag = flags[address(dao)][nonce / 256];
        require(
            DaoHelper.getFlag(currentFlag, nonce % 256) == false,
            "coupon has already been redeemed"
        );

        address signerAddress =
            dao.getAddressConfiguration(SignerAddressConfig);

        Coupon memory coupon = Coupon(authorizedMember, amount, nonce);
        bytes32 hash = hashCouponMessage(dao, coupon);

        address recoveredKey = ECDSA.recover(hash, signature);

        require(recoveredKey == signerAddress, "invalid sig");

        flags[address(dao)][nonce / 256] = DaoHelper.setFlag(
            currentFlag,
            nonce % 256,
            true
        );

        address tokenAddrToMint =
            address(dao.getAddressConfiguration(TokenAddrToMint));

        BankV1Extension bank = BankV1Extension(dao.getExtensionAddress(DaoHelper.BANK));

        bank.addToBalance(authorizedMember, tokenAddrToMint, amount);
        // address needs to be added to the members mappings
        dao.potentialNewMember(authorizedMember);
        require(authorizedMember != address(0x0), "invalid member address");
        if (address(bank) != address(0x0)) {
            if (bank.balanceOf(authorizedMember, DaoHelper.MEMBER_COUNT) == 0) {
                bank.addToBalance(authorizedMember, DaoHelper.MEMBER_COUNT, 1);
            }
        }
        emit CouponRedeemed(address(dao), nonce, authorizedMember, amount);
    }
}
