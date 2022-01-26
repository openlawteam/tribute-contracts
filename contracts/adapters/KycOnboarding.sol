pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../guards/AdapterGuard.sol";
import "../utils/Signatures.sol";
import "../helpers/WETH.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./modifiers/Reimbursable.sol";

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
    AdapterGuard,
    MemberGuard,
    Signatures,
    Reimbursable
{
    using Address for address payable;
    using SafeERC20 for IERC20;

    event Onboarded(DaoRegistry dao, address member, uint256 units);
    struct Coupon {
        address kycedMember;
    }

    struct OnboardingDetails {
        uint88 chunkSize;
        uint88 numberOfChunks;
        uint88 unitsPerChunk;
        uint88 unitsRequested;
        uint88 maximumTotalUnits;
        uint160 amount;
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
    bytes32 constant TokensToMint = keccak256("kyc-onboarding.tokensToMint");

    WETH private _weth;
    IERC20 private _weth20;

    mapping(DaoRegistry => mapping(address => uint256)) public totalUnits;

    constructor(address payable weth) {
        _weth = WETH(weth);
        _weth20 = IERC20(weth);
    }

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

        require(
            DaoHelper.isNotZeroAddress(signerAddress),
            "signer address is nil!"
        );

        require(
            DaoHelper.isNotZeroAddress(internalTokensToMint),
            "null internal token address"
        );

        dao.setAddressConfiguration(
            _configKey(tokenAddr, SignerAddressConfig),
            signerAddress
        );
        dao.setAddressConfiguration(
            _configKey(tokenAddr, FundTargetAddress),
            fundTargetAddress
        );
        dao.setConfiguration(_configKey(tokenAddr, ChunkSize), chunkSize);
        dao.setConfiguration(
            _configKey(tokenAddr, UnitsPerChunk),
            unitsPerChunk
        );
        dao.setConfiguration(
            _configKey(tokenAddr, MaximumChunks),
            maximumChunks
        );
        dao.setConfiguration(_configKey(tokenAddr, MaximumUnits), maxUnits);
        dao.setConfiguration(_configKey(tokenAddr, MaxMembers), maxMembers);
        dao.setAddressConfiguration(
            _configKey(tokenAddr, TokensToMint),
            internalTokensToMint
        );

        BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
        bank.registerPotentialNewInternalToken(dao, DaoHelper.UNITS);
        bank.registerPotentialNewToken(dao, tokenAddr);
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

        return hashMessage(dao, address(this), message);
    }

    /**
     * @notice Starts the onboarding propocess of a kyc member that is using ETH to join the DAO.
     * @param kycedMember The address of the kyced member that wants to join the DAO.
     * @param signature The signature that will be verified to redeem the coupon.
     */
    function onboardEth(
        DaoRegistry dao,
        address kycedMember,
        bytes memory signature
    ) external payable {
        _onboard(dao, kycedMember, DaoHelper.ETH_TOKEN, msg.value, signature);
    }

    /**
     * @notice Starts the onboarding propocess of a kyc member that is any ERC20 token to join the DAO.
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
    ) external {
        _onboard(dao, kycedMember, tokenAddr, amount, signature);
    }

    /**
     * @notice Redeems a coupon to add a new member
     * @param dao is the DAO instance to be configured
     * @param kycedMember is the address that this coupon authorized to become a new member
     * @param tokenAddr is the address the ETH address(0) or an ERC20 Token address
     * @param signature is message signature for verification
     */
    // The function is protected against reentrancy with the reentrancyGuard(dao)
    // so it is fine to change some state after the reentrancyGuard(dao) external call
    // because it calls the dao contract to lock the session/transaction flow.
    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function _onboard(
        DaoRegistry dao,
        address kycedMember,
        address tokenAddr,
        uint256 amount,
        bytes memory signature
    ) internal reimbursable(dao) {
        require(
            !isActiveMember(dao, dao.getCurrentDelegateKey(kycedMember)),
            "already member"
        );
        uint256 maxMembers = dao.getConfiguration(
            _configKey(tokenAddr, MaxMembers)
        );
        require(maxMembers > 0, "token not configured");
        require(dao.getNbMembers() < maxMembers, "the DAO is full");

        _checkKycCoupon(dao, kycedMember, tokenAddr, signature);

        OnboardingDetails memory details = _checkData(dao, tokenAddr, amount);
        totalUnits[dao][tokenAddr] += details.unitsRequested;

        BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
        DaoHelper.potentialNewMember(kycedMember, dao, bank);

        address payable multisigAddress = payable(
            dao.getAddressConfiguration(
                _configKey(tokenAddr, FundTargetAddress)
            )
        );
        if (multisigAddress == address(0x0)) {
            if (tokenAddr == DaoHelper.ETH_TOKEN) {
                // The bank address is loaded from the DAO registry,
                // hence even if we change that, it belongs to the DAO,
                // so it is fine to send eth to it.
                // slither-disable-next-line arbitrary-send
                bank.addToBalance{value: details.amount}(
                    dao,
                    DaoHelper.GUILD,
                    DaoHelper.ETH_TOKEN,
                    details.amount
                );
            } else {
                bank.addToBalance(
                    dao,
                    DaoHelper.GUILD,
                    tokenAddr,
                    details.amount
                );
                IERC20 erc20 = IERC20(tokenAddr);
                erc20.safeTransferFrom(
                    msg.sender,
                    address(bank),
                    details.amount
                );
            }
        } else {
            if (tokenAddr == DaoHelper.ETH_TOKEN) {
                // The _weth address is defined during the deployment of the contract
                // There is no way to change it once it has been deployed,
                // so it is fine to send eth to it.
                // slither-disable-next-line arbitrary-send
                _weth.deposit{value: details.amount}();
                _weth20.safeTransferFrom(
                    address(this),
                    multisigAddress,
                    details.amount
                );
            } else {
                IERC20 erc20 = IERC20(tokenAddr);
                erc20.safeTransferFrom(
                    msg.sender,
                    multisigAddress,
                    details.amount
                );
            }
        }

        bank.addToBalance(
            dao,
            kycedMember,
            DaoHelper.UNITS,
            details.unitsRequested
        );

        if (amount > details.amount && tokenAddr == DaoHelper.ETH_TOKEN) {
            payable(msg.sender).sendValue(msg.value - details.amount);
        }

        emit Onboarded(dao, kycedMember, details.unitsRequested);
    }

    /**
     * @notice Verifies if the given amount is enough to join the DAO
     */
    function _checkData(
        DaoRegistry dao,
        address tokenAddr,
        uint256 amount
    ) internal view returns (OnboardingDetails memory details) {
        details.chunkSize = uint88(
            dao.getConfiguration(_configKey(tokenAddr, ChunkSize))
        );
        require(details.chunkSize > 0, "config chunkSize missing");
        details.numberOfChunks = uint88(amount / details.chunkSize);
        require(details.numberOfChunks > 0, "insufficient funds");
        require(
            details.numberOfChunks <=
                dao.getConfiguration(_configKey(tokenAddr, MaximumChunks)),
            "too much funds"
        );

        details.unitsPerChunk = uint88(
            dao.getConfiguration(_configKey(tokenAddr, UnitsPerChunk))
        );

        require(details.unitsPerChunk > 0, "config unitsPerChunk missing");
        details.amount = details.numberOfChunks * details.chunkSize;
        details.unitsRequested = details.numberOfChunks * details.unitsPerChunk;
        details.maximumTotalUnits = uint88(
            dao.getConfiguration(_configKey(tokenAddr, MaximumUnits))
        );

        require(
            details.unitsRequested + totalUnits[dao][tokenAddr] <=
                details.maximumTotalUnits,
            "over max total units"
        );
    }

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
    ) internal view {
        require(
            ECDSA.recover(
                hashCouponMessage(dao, Coupon(kycedMember)),
                signature
            ) ==
                dao.getAddressConfiguration(
                    _configKey(tokenAddr, SignerAddressConfig)
                ),
            "invalid sig"
        );
    }

    /**
     * @notice Builds the configuration key by encoding an address with a string key.
     * @param tokenAddrToMint The address to encode.
     * @param key The key to encode.
     */
    function _configKey(address tokenAddrToMint, bytes32 key)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(tokenAddrToMint, key));
    }
}
