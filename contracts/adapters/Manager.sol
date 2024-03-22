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

contract Manager is Reimbursable, AdapterGuard, Signatures {
    enum UpdateType {
        UNKNOWN,
        ADAPTER,
        EXTENSION,
        CONFIGS
    }

    enum ConfigType {
        NUMERIC,
        ADDRESS
    }

    struct Configuration {
        bytes32 key;
        uint256 numericValue;
        address addressValue;
        ConfigType configType;
    }

    struct ProposalDetails {
        bytes32 adapterOrExtensionId;
        address adapterOrExtensionAddr;
        UpdateType updateType;
        uint128 flags;
        bytes32[] keys;
        uint256[] values;
        address[] extensionAddresses;
        uint128[] extensionAclFlags;
    }

    struct ManagingCoupon {
        address daoAddress;
        ProposalDetails proposal;
        Configuration[] configs;
        uint256 nonce;
    }

    mapping(address => uint256) public nonces;

    string public constant MANAGING_COUPON_MESSAGE_TYPE =
        "Message(address daoAddress,ProposalDetails proposal,Configuration[] configs,uint256 nonce)Configuration(bytes32 key,uint256 numericValue,address addressValue,uint8 configType)ProposalDetails(bytes32 adapterOrExtensionId,address adapterOrExtensionAddr,uint8 updateType,uint128 flags,bytes32[] keys,uint256[] values,address[] extensionAddresses,uint128[] extensionAclFlags)";
    bytes32 public constant MANAGING_COUPON_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(MANAGING_COUPON_MESSAGE_TYPE));

    string public constant PROPOSAL_DETAILS_TYPE =
        "ProposalDetails(bytes32 adapterOrExtensionId,address adapterOrExtensionAddr,uint8 updateType,uint128 flags,bytes32[] keys,uint256[] values,address[] extensionAddresses,uint128[] extensionAclFlags)";
    bytes32 public constant PROPOSAL_DETAILS_TYPEHASH =
        keccak256(abi.encodePacked(PROPOSAL_DETAILS_TYPE));

    string public constant CONFIGURATION_DETAILS_TYPE =
        "Configuration(bytes32 key,uint256 numericValue,address addressValue,uint8 configType)";
    bytes32 public constant CONFIGURATION_DETAILS_TYPEHASH =
        keccak256(abi.encodePacked(CONFIGURATION_DETAILS_TYPE));

    bytes32 public constant SignerAddressConfig =
        keccak256("Manager.signerAddress");

    /**
     * @notice Configures the Adapter with the managing signer address.
     * @param signerAddress the address of the managing signer
     */
    function configureDao(
        DaoRegistry dao,
        address signerAddress
    ) external onlyAdapter(dao) {
        dao.setAddressConfiguration(SignerAddressConfig, signerAddress);
    }

    function processSignedProposal(
        DaoRegistry dao,
        ProposalDetails calldata proposal,
        Configuration[] memory configs,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(
            proposal.keys.length == proposal.values.length,
            "must be an equal number of config keys and values"
        );
        require(
            DaoHelper.isNotReservedAddress(proposal.adapterOrExtensionAddr),
            "address is reserved"
        );
        require(nonce > nonces[address(dao)], "coupon already redeemed");
        nonces[address(dao)] = nonce;

        ManagingCoupon memory managingCoupon = ManagingCoupon(
            address(dao),
            proposal,
            configs,
            nonce
        );
        bytes32 hash = hashCouponMessage(dao, managingCoupon);

        require(
            SignatureChecker.isValidSignatureNow(
                dao.getAddressConfiguration(SignerAddressConfig),
                hash,
                signature
            ),
            "invalid sig"
        );

        _submitAndProcessProposal(dao, proposal, configs);
    }

    /**
     * @notice Submits and processes a proposal that was signed by the managing address.
     * @dev Reverts when the adapter address is already in use and it is an adapter addition.
     * @dev Reverts when the extension address is already in use and it is an extension addition.
     * @param dao The dao address.
     * @param proposal The proposal data.
     * @param configs The configurations to be updated.
     */
    // slither-disable-next-line reentrancy-benign
    function _submitAndProcessProposal(
        DaoRegistry dao,
        ProposalDetails calldata proposal,
        Configuration[] memory configs
    ) internal reimbursable(dao) {
        if (proposal.updateType == UpdateType.ADAPTER) {
            dao.replaceAdapter(
                proposal.adapterOrExtensionId,
                proposal.adapterOrExtensionAddr,
                proposal.flags,
                proposal.keys,
                proposal.values
            );

            // Grant new adapter access to extensions.
            for (uint256 i = 0; i < proposal.extensionAclFlags.length; i++) {
                _grantExtensionAccess(
                    dao,
                    proposal.extensionAddresses[i],
                    proposal.adapterOrExtensionAddr,
                    proposal.extensionAclFlags[i]
                );
            }
        } else if (proposal.updateType == UpdateType.EXTENSION) {
            _replaceExtension(dao, proposal);

            // Grant adapters access to new extension.
            for (uint256 i = 0; i < proposal.extensionAclFlags.length; i++) {
                _grantExtensionAccess(
                    dao,
                    proposal.adapterOrExtensionAddr,
                    proposal.extensionAddresses[i], // Adapters.
                    proposal.extensionAclFlags[i]
                );
            }
        } else if (proposal.updateType == UpdateType.CONFIGS) {
            for (uint256 i = 0; i < proposal.extensionAclFlags.length; i++) {
                _grantExtensionAccess(
                    dao,
                    proposal.extensionAddresses[i],
                    proposal.adapterOrExtensionAddr,
                    proposal.extensionAclFlags[i]
                );
            }
        } else {
            revert("unknown update type");
        }
        _saveDaoConfigurations(dao, configs);
    }

    /**
     * @notice If the extension is already registered, it removes the extension from the DAO Registry.
     * @notice If the adapterOrExtensionAddr is provided, the new address is added as a new extension to the DAO Registry.
     */
    function _replaceExtension(
        DaoRegistry dao,
        ProposalDetails memory proposal
    ) internal {
        if (dao.extensions(proposal.adapterOrExtensionId) != address(0x0)) {
            dao.removeExtension(proposal.adapterOrExtensionId);
        }

        if (proposal.adapterOrExtensionAddr != address(0x0)) {
            try
                dao.addExtension(
                    proposal.adapterOrExtensionId,
                    IExtension(proposal.adapterOrExtensionAddr)
                )
            {} catch {
                // v1.0.6 signature
                dao.addExtension(
                    proposal.adapterOrExtensionId,
                    IExtension(proposal.adapterOrExtensionAddr),
                    // The creator of the extension must be set as the DAO owner,
                    // which is stored at index 0 in the members storage.
                    dao.getMemberAddress(0)
                );
            }
        }
    }

    /**
     * @notice Saves to the DAO Registry the ACL Flag that grants the access to the given `extensionAddresses`
     */
    function _grantExtensionAccess(
        DaoRegistry dao,
        address extensionAddr,
        address adapterAddr,
        uint128 acl
    ) internal {
        // It is fine to execute the external call inside the loop
        // because it is calling the correct function in the dao contract
        // it won't be calling a fallback that always revert.
        // slither-disable-next-line calls-loop
        dao.setAclToExtensionForAdapter(
            // It needs to be registered as extension
            extensionAddr,
            // It needs to be registered as adapter
            adapterAddr,
            // Indicate which access level will be granted
            acl
        );
    }

    /**
     * @notice Saves the numeric/address configurations to the DAO registry
     */
    function _saveDaoConfigurations(
        DaoRegistry dao,
        Configuration[] memory configs
    ) internal {
        for (uint256 i = 0; i < configs.length; i++) {
            Configuration memory config = configs[i];
            if (ConfigType.NUMERIC == config.configType) {
                // It is fine to execute the external call inside the loop
                // because it is calling the correct function in the dao contract
                // it won't be calling a fallback that always revert.
                // slither-disable-next-line calls-loop
                dao.setConfiguration(config.key, config.numericValue);
            } else if (ConfigType.ADDRESS == config.configType) {
                // It is fine to execute the external call inside the loop
                // because it is calling the correct function in the dao contract
                // it won't be calling a fallback that always revert.
                // slither-disable-next-line calls-loop
                dao.setAddressConfiguration(config.key, config.addressValue);
            }
        }
    }

    /**
     * @notice Hashes the provided coupon as an ERC712 hash.
     * @param dao is the DAO instance to be configured
     * @param coupon is the coupon to hash
     */
    function hashCouponMessage(
        DaoRegistry dao,
        ManagingCoupon memory coupon
    ) public view returns (bytes32) {
        bytes32 message = keccak256(
            abi.encode(
                MANAGING_COUPON_MESSAGE_TYPEHASH,
                coupon.daoAddress,
                hashProposal(coupon.proposal),
                hashConfigurations(coupon.configs),
                coupon.nonce
            )
        );

        return hashMessage(dao, address(this), message);
    }

    function hashProposal(
        ProposalDetails memory proposal
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    PROPOSAL_DETAILS_TYPEHASH,
                    proposal.adapterOrExtensionId,
                    proposal.adapterOrExtensionAddr,
                    proposal.updateType,
                    proposal.flags,
                    keccak256(abi.encodePacked(proposal.keys)),
                    keccak256(abi.encodePacked(proposal.values)),
                    keccak256(abi.encodePacked(proposal.extensionAddresses)),
                    keccak256(abi.encodePacked(proposal.extensionAclFlags))
                )
            );
    }

    function hashConfigurations(
        Configuration[] memory configs
    ) public pure returns (bytes32) {
        bytes32[] memory result = new bytes32[](configs.length);
        for (uint256 i = 0; i < configs.length; i++) {
            result[i] = keccak256(
                abi.encode(
                    CONFIGURATION_DETAILS_TYPEHASH,
                    configs[i].key,
                    configs[i].numericValue,
                    configs[i].addressValue,
                    configs[i].configType
                )
            );
        }

        return keccak256(abi.encodePacked(result));
    }
}
