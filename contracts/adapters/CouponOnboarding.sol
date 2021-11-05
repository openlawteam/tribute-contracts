pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/AdapterGuard.sol";
import "../utils/Signatures.sol";
import "../helpers/DaoHelper.sol";

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

contract CouponOnboardingContract is AdapterGuard, Signatures {
    struct Coupon {
        address authorizedMember;
        uint256 amount;
        uint256 nonce;
    }

    using SafeERC20 for IERC20;

    string public constant COUPON_MESSAGE_TYPE =
        "Message(address authorizedMember,uint256 amount,uint256 nonce)";
    bytes32 public constant COUPON_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(COUPON_MESSAGE_TYPE));

    bytes32 constant SignerAddressConfig =
        keccak256("coupon-onboarding.signerAddress");
    bytes32 constant TokenAddrToMint =
        keccak256("coupon-onboarding.tokenAddrToMint");

    bytes32 constant ERC20InternalTokenAddr =
        keccak256("coupon-onboarding.erc20.internal.token.address");

    uint256 private _chainId;

    mapping(address => mapping(uint256 => uint256)) private _flags;

    event CouponRedeemed(
        address daoAddress,
        uint256 nonce,
        address authorizedMember,
        uint256 amount
    );

    /**
     * @notice Configures the Adapter with the coupon signer address and token to mint.
     * @param signerAddress the address of the coupon signer
     * @param erc20 the address of the internal ERC20 token to issue shares
     * @param tokenAddrToMint the address of the token to mint the coupon
     * @param maxAmount max amount of coupons to mint
     * @param chainId the chain id in which it will be minted, and is used as part of the hash
     */
    function configureDao(
        DaoRegistry dao,
        address signerAddress,
        address erc20,
        address tokenAddrToMint,
        uint88 maxAmount,
        uint256 chainId
    ) external onlyAdapter(dao) {
        dao.setAddressConfiguration(SignerAddressConfig, signerAddress);
        dao.setAddressConfiguration(ERC20InternalTokenAddr, erc20);
        dao.setAddressConfiguration(TokenAddrToMint, tokenAddrToMint);

        BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
        bank.registerPotentialNewInternalToken(tokenAddrToMint);
        uint160 currentBalance = bank.balanceOf(
            DaoHelper.TOTAL,
            tokenAddrToMint
        );
        if (currentBalance < maxAmount) {
            bank.addToBalance(
                DaoHelper.GUILD,
                tokenAddrToMint,
                maxAmount - currentBalance
            );
        }
        _chainId = chainId;
    }

    /**
     * @notice Hashes the provided coupon as an ERC712 hash.
     * @param dao is the DAO instance to be configured
     * @param coupon is the coupon to hash
     */
    function hashCouponMessage(DaoRegistry dao, Coupon memory coupon)
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

        return hashMessage(dao, _chainId, address(this), message);
    }

    /**
     * @notice Redeems a coupon to add a new member.
     * @param dao is the DAO instance to be configured
     * @param authorizedMember is the address that this coupon authorized to become a new member
     * @param amount is the amount of units that this member will receive
     * @param nonce is a unique identifier for this coupon request
     * @param signature is message signature for verification
     */
    // slither-disable-next-line reentrancy-benign
    function redeemCoupon(
        DaoRegistry dao,
        address authorizedMember,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external reentrancyGuard(dao) {
        uint256 currentFlag = _flags[address(dao)][nonce / 256];
        require(
            DaoHelper.getFlag(currentFlag, nonce % 256) == false,
            "coupon already redeemed"
        );

        Coupon memory coupon = Coupon(authorizedMember, amount, nonce);
        bytes32 hash = hashCouponMessage(dao, coupon);

        require(
            SignatureChecker.isValidSignatureNow(
                dao.getAddressConfiguration(SignerAddressConfig),
                hash,
                signature
            ),
            "invalid sig"
        );

        _flags[address(dao)][nonce / 256] = DaoHelper.setFlag(
            currentFlag,
            nonce % 256,
            true
        );

        IERC20 erc20 = IERC20(
            dao.getAddressConfiguration(ERC20InternalTokenAddr)
        );
        BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
        if (address(erc20) == address(0x0)) {
            address tokenAddressToMint = dao.getAddressConfiguration(
                TokenAddrToMint
            );
            bank.internalTransfer(
                DaoHelper.GUILD,
                authorizedMember,
                tokenAddressToMint,
                amount
            );
            // address needs to be added to the members mappings. ERC20 is doing it for us so no need to do it twice
            DaoHelper.potentialNewMember(authorizedMember, dao, bank);
        } else {
            erc20.safeTransferFrom(DaoHelper.GUILD, authorizedMember, amount);
        }
        //slither-disable-next-line reentrancy-events
        emit CouponRedeemed(address(dao), nonce, authorizedMember, amount);
    }
}
