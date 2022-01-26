pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/AdapterGuard.sol";
import "../utils/Signatures.sol";
import "../utils/PotentialNewMember.sol";
import "../helpers/WETH.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
MIT License
Copyright (c) 2021 Openlaw
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

contract KycOnboardingContract is
    DaoConstants,
    AdapterGuard,
    Signatures,
    PotentialNewMember
{
    using Address for address payable;
    using SafeERC20 for IERC20;

    event Onboarded(DaoRegistry dao, address member, uint256 units);

    struct Coupon {
        address kycedMember;
    }

    string public constant COUPON_MESSAGE_TYPE = "Message(address kycedMember)";
    bytes32 public constant COUPON_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(COUPON_MESSAGE_TYPE));

    bytes32 constant SignerAddressConfig =
        keccak256("kyc-onboarding.signerAddress");

    bytes32 constant ChunkSize = keccak256("kyc-onboarding.chunkSize");
    bytes32 constant UnitsPerChunk = keccak256("kyc-onboarding.unitsPerChunk");
    bytes32 constant MaximumChunks = keccak256("kyc-onboarding.maximumChunks");
    bytes32 constant MaximumUnits =
        keccak256("kyc-onboarding.maximumTotalUnits");
    bytes32 constant MaxMembers = keccak256("kyc-onboarding.maxMembers");
    bytes32 constant FundTargetAddress =
        keccak256("kyc-onboarding.fundTargetAddress");

    WETH private _weth;
    IERC20 private _weth20;

    event CouponRedeemed(
        address daoAddress,
        uint256 nonce,
        address authorizedMember,
        uint256 amount
    );

    struct OnboardingDetails {
        uint88 chunkSize;
        uint88 numberOfChunks;
        uint88 unitsPerChunk;
        uint88 unitsRequested;
        uint88 maximumTotalUnits;
        uint160 amount;
    }

    mapping(DaoRegistry => uint256) public totalUnits;

    constructor(address payable weth) {
        _weth = WETH(weth);
        _weth20 = IERC20(weth);
    }

    /**
     * @notice default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    /**
     * @notice Configures the Adapter with the coupon signer address and token to mint.
     * @param dao the dao to configure
     * @param signerAddress is the DAO instance to be configured
     * @param chunkSize how many wei per chunk
     * @param unitsPerChunk how many units do we get per chunk
     * @param maximumChunks  how many chunks can you get at most
     */
    function configureDao(
        DaoRegistry dao,
        address signerAddress,
        uint256 chunkSize,
        uint256 unitsPerChunk,
        uint256 maximumChunks,
        uint256 maxUnits,
        uint256 maxMembers,
        address fundTargetAddress
    ) external onlyAdapter(dao) {
        require(
            chunkSize > 0 && chunkSize < type(uint88).max,
            "chunkSize::invalid"
        );
        require(
            maxMembers > 0 && maxMembers < type(uint88).max,
            "maxMembers::invalid"
        );
        require(
            maximumChunks > 0 && maximumChunks < type(uint88).max,
            "maximumChunks::invalid"
        );
        require(
            maxUnits > 0 && maxUnits < type(uint88).max,
            "maxUnits::invalid"
        );
        require(
            unitsPerChunk > 0 && unitsPerChunk < type(uint88).max,
            "unitsPerChunk::invalid"
        );
        require(
            maximumChunks * unitsPerChunk < type(uint88).max,
            "potential overflow"
        );

        require(signerAddress != address(0x0), "signer address is nil!");

        dao.setAddressConfiguration(SignerAddressConfig, signerAddress);
        dao.setAddressConfiguration(FundTargetAddress, fundTargetAddress);
        dao.setConfiguration(ChunkSize, chunkSize);
        dao.setConfiguration(UnitsPerChunk, unitsPerChunk);
        dao.setConfiguration(MaximumChunks, maximumChunks);
        dao.setConfiguration(MaximumUnits, maxUnits);
        dao.setConfiguration(MaxMembers, maxMembers);

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        bank.registerPotentialNewInternalToken(UNITS);
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
            abi.encode(COUPON_MESSAGE_TYPEHASH, coupon.kycedMember)
        );

        return hashMessage(dao, block.chainid, address(this), message);
    }

    function _checkKycCoupon(
        DaoRegistry dao,
        address kycedMember,
        bytes memory signature
    ) internal view {
        require(
            ECDSA.recover(
                hashCouponMessage(dao, Coupon(kycedMember)),
                signature
            ) == dao.getAddressConfiguration(SignerAddressConfig),
            "invalid sig"
        );
    }

    /**
     * @notice Redeems a coupon to add a new member.
     * @param dao is the DAO instance to be configured
     * @param kycedMember is the address that this coupon authorized to become a new member
     * @param signature is message signature for verification
     */
    function onboard(
        DaoRegistry dao,
        address kycedMember,
        bytes memory signature
    ) external payable reentrancyGuard(dao) {
        require(!dao.isActiveMember(dao, kycedMember), "already member");
        require(
            dao.getNbMembers() < dao.getConfiguration(MaxMembers),
            "the DAO is full"
        );
        _checkKycCoupon(dao, kycedMember, signature);
        OnboardingDetails memory details = _checkData(dao);

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(bank.dao() == dao, "wrong dao");
        potentialNewMember(kycedMember, dao, bank);
        totalUnits[dao] += details.unitsRequested;
        address payable multisigAddress = payable(
            dao.getAddressConfiguration(FundTargetAddress)
        );
        if (multisigAddress == address(0x0)) {
            bank.addToBalance{value: details.amount}(
                GUILD,
                ETH_TOKEN,
                details.amount
            );
        } else {
            _weth.deposit{value: details.amount}();
            _weth20.safeTransferFrom(
                address(this),
                multisigAddress,
                details.amount
            );
        }

        bank.addToBalance(kycedMember, UNITS, details.unitsRequested);

        if (msg.value > details.amount) {
            payable(msg.sender).sendValue(msg.value - details.amount);
        }

        emit Onboarded(dao, kycedMember, details.unitsRequested);
    }

    function _checkData(DaoRegistry dao)
        internal
        view
        returns (OnboardingDetails memory details)
    {
        details.chunkSize = uint88(dao.getConfiguration(ChunkSize));
        require(details.chunkSize > 0, "config chunkSize missing");
        details.numberOfChunks = uint88(msg.value / details.chunkSize);
        require(details.numberOfChunks > 0, "insufficient funds");
        require(
            details.numberOfChunks <= dao.getConfiguration(MaximumChunks),
            "too much funds"
        );

        details.unitsPerChunk = uint88(dao.getConfiguration(UnitsPerChunk));

        require(details.unitsPerChunk > 0, "config unitsPerChunk missing");
        details.amount = details.numberOfChunks * details.chunkSize;
        details.unitsRequested = details.numberOfChunks * details.unitsPerChunk;
        details.maximumTotalUnits = uint88(dao.getConfiguration(MaximumUnits));

        require(
            details.unitsRequested + totalUnits[dao] <=
                details.maximumTotalUnits,
            "over max total units"
        );
    }
}
