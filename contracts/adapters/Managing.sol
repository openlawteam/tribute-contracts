pragma solidity ^0.8.0;
function c_0xbddfdf62(bytes32 c__0xbddfdf62) pure {}


// SPDX-License-Identifier: MIT

import "./interfaces/IManaging.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";
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

contract ManagingContract is IManaging, AdapterGuard, Reimbursable {
function c_0x348a98d0(bytes32 c__0x348a98d0) public pure {}

    // DAO => (ProposalID => ProposalDetails)
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;
    // DAO => (ProposalId => Configuration[])
    mapping(address => mapping(bytes32 => Configuration[]))
        public configurations;

    /**
     * @notice Creates a proposal to replace, remove or add an adapter.
     * @dev If the adapterAddress is equal to 0x0, the adapterId is removed from the registry if available.
     * @dev If the adapterAddress is a reserved address, it reverts.
     * @dev keys and value must have the same length.
     * @dev proposalId can not be reused.
     * @param dao The dao address.
     * @param proposalId Tproposal details
     * @param proposal The proposal details
     * @param data Additional data to pass to the voting contract and identify the submitter
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        ProposalDetails calldata proposal,
        Configuration[] memory configs,
        bytes calldata data
    ) external override reimbursable(dao) {c_0x348a98d0(0xb622803cb07adc931cc00161451f32c385bd793f14e5eb36d29ca7f7ae1a4aeb); /* function */ 

c_0x348a98d0(0x3f583a0daf2e496bbc57b4d83ba1ced751fc4b7ce9b11066b36a214c28bb4754); /* line */ 
        c_0x348a98d0(0xf07b829ec1e07bb70f09dff0fc44fdb62c70ba94da8dfd65077a41a910cb4c29); /* requirePre */ 
c_0x348a98d0(0x9fe4ce257dbdd59dec84cff983992e52396f5ecbaa93e25ab3165914ba2cb934); /* statement */ 
require(
            proposal.keys.length == proposal.values.length,
            "must be an equal number of config keys and values"
        );c_0x348a98d0(0x22f1d4165167f0b2931defcf0668b80abcde0912e60047e1467d162f90fc49ba); /* requirePost */ 


c_0x348a98d0(0x6cf3c2185bbe0e77c73a80904968696090a77d18a0a729dafbdb060562bbdc34); /* line */ 
        c_0x348a98d0(0x20e16dbe21c6d18bceea42665d19c3111831bdf8711d2b9fefcb59287e55e0df); /* requirePre */ 
c_0x348a98d0(0xa270562212e622652ad7b6c48230b87649adda366d1c4bf546bf02829d8286ab); /* statement */ 
require(
            proposal.extensionAddresses.length ==
                proposal.extensionAclFlags.length,
            "must be an equal number of extension addresses and acl"
        );c_0x348a98d0(0x8fdb00bf1e5b6f9f412983a2c4a6bf4f992568cabeaa7fb5462a3c67cbe061c6); /* requirePost */ 


c_0x348a98d0(0x6b8639cdafd70652dede100f0c13d563c03059e7d77ad8bfeab55b238a79e1a4); /* line */ 
        c_0x348a98d0(0x49d4024edf84cbe908a3be8282740a36357657f3281be885fd32f5b4119ca8ff); /* requirePre */ 
c_0x348a98d0(0xa6a05e25af3a85247a905e1e7053f344efa39300e4089c442e147683f566d306); /* statement */ 
require(
            DaoHelper.isNotReservedAddress(proposal.adapterOrExtensionAddr),
            "address is reserved"
        );c_0x348a98d0(0x379419ee0f115518e45641e17a80ad087409f43e90dc51ca84eeeddfd33fbde1); /* requirePost */ 


c_0x348a98d0(0x56a0646e304ead1dbc76516f1b8b1a684040b5ac4eb2d7cf834ceaef43323662); /* line */ 
        c_0x348a98d0(0x6b238905ad455582e96220c4627fbb2521ba2c26276f0e34e8e870e4232766dd); /* statement */ 
dao.submitProposal(proposalId);

c_0x348a98d0(0x83f6e48399169e12edf0ac476b3e155e72e40b65a4a7e92cc014bc5888f695e0); /* line */ 
        c_0x348a98d0(0x70800d5735f305e63d2da90db3294d9eca1f151c2b10e2220f9b5c676c061bb7); /* statement */ 
proposals[address(dao)][proposalId] = proposal;

c_0x348a98d0(0x2c16f274fc23eb07fd171920b046c1db6f0fd33e122f5491c47545ee04c4bce3); /* line */ 
        c_0x348a98d0(0xd7defe0de929a22f065c8f8799ce3e547f4e1902b4e672cea752446f388cbe2c); /* statement */ 
Configuration[] storage newConfigs = configurations[address(dao)][
            proposalId
        ];
c_0x348a98d0(0x22274689d73ae481569f11cc8a414dcfe3f2f8e712f5955da8c9718e82aed33d); /* line */ 
        c_0x348a98d0(0x65ff6619b6f7b40eafec572539736ef6e19167a64eadf1d1204a5c8a2e92de4d); /* statement */ 
for (uint256 i = 0; i < configs.length; i++) {
c_0x348a98d0(0xba3c6e1034a71263da656b9e49b770eea6369bfdeba0986b146930a317208998); /* line */ 
            c_0x348a98d0(0xf070651944516d149e123ec359d046d9420cf28fe51179a9ff67af960461b895); /* statement */ 
Configuration memory config = configs[i];
c_0x348a98d0(0x326634eb71791a152855c1178d8d7b724fb31da16749d64d3804e00635d829eb); /* line */ 
            c_0x348a98d0(0xfda45b9a3361e8bd7636a83ccd989832cfabae457759a8ba4278f04cd673c547); /* statement */ 
newConfigs.push(
                Configuration({
                    key: config.key,
                    configType: config.configType,
                    numericValue: config.numericValue,
                    addressValue: config.addressValue
                })
            );
        }

c_0x348a98d0(0x960eb666a0f08dab1df18fd3244d04fd5ac8fb3c10d083fdd6f4c0b74f96c07b); /* line */ 
        c_0x348a98d0(0x0e634bd006538fc2cbd53f4268c32916a5e2aa7bbdc2b9377b98c11ccc858a14); /* statement */ 
IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
c_0x348a98d0(0xca8de36a98d186ceb2b3bf817c95d4604e413c8136913ad41433e5c7e2e2f36e); /* line */ 
        c_0x348a98d0(0x87a116b6794899aa72b1090c5fa5e8da11a0b967148a0ae892dcebf23b1e6158); /* statement */ 
address senderAddress = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );

c_0x348a98d0(0x4fd362a3787717f6d81101a57b804e0060b011e080786d3fe31b2deddcd528f0); /* line */ 
        c_0x348a98d0(0x43fc0334e7b22fb0802df3ca8e91fb389e8da164a5c08ee0c6de8098d25df5aa); /* statement */ 
dao.sponsorProposal(proposalId, senderAddress, address(votingContract));
c_0x348a98d0(0xcf80a52f0144dcaf23d4b991aa9a99313ba5b5a4bf820067f38ccbb78564374f); /* line */ 
        c_0x348a98d0(0xf1ebcff8ed65c85240835d668062adb1cb615ca8b9fae9b67a7808c89beeae27); /* statement */ 
votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    /**
     * @notice Processes a proposal that was sponsored.
     * @dev Only members can process a proposal.
     * @dev Only if the voting pass the proposal is processed.
     * @dev Reverts when the adapter address is already in use and it is an adapter addition.
     * @dev Reverts when the extension address is already in use and it is an extension addition.
     * @param dao The dao address.
     * @param proposalId The proposal id.
     */
    // slither-disable-next-line reentrancy-benign
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reimbursable(dao)
    {c_0x348a98d0(0x7e1ccbf57c0b9d942c13084911b8582be845bafb939331e1450924126caf661c); /* function */ 

c_0x348a98d0(0x4cf73435b30ad6994967f24c914b7e8987988f9821e60b75a1e5d4a8f77af17a); /* line */ 
        c_0x348a98d0(0x52e699a949b1c6ef7c3aac280b612f78e3d79856a192c7fe348ed31897c1939b); /* statement */ 
ProposalDetails memory proposal = proposals[address(dao)][proposalId];

c_0x348a98d0(0xb2eff1e6d58c3da013d008465476d005230132d62794d7be2a9484a06c259cb6); /* line */ 
        c_0x348a98d0(0xfd8551df9b7c4f9a4dd17b57968396753b67f57794d831b1d5a7a46f8b8e454c); /* statement */ 
IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
c_0x348a98d0(0xdb6f7445b84a2d897325b747f526549c59534cdba2d4033363f8e052d551f3ba); /* line */ 
        c_0x348a98d0(0xbd3b75b9e64fbd5aa3016a6696f6ef97fc37163152bbf7f748c2e676b55fa396); /* requirePre */ 
c_0x348a98d0(0xa26a9e29241b3be0c13fa7a717740d578ff9fe0398a9cf42ace420fd8e9d7386); /* statement */ 
require(address(votingContract) != address(0), "adapter not found");c_0x348a98d0(0xd25d95c2540abf61202978d9253659153dd73973bd4c674dd1ae3ba24af6fc44); /* requirePost */ 


c_0x348a98d0(0x4c90db0e1802794ba4c910d4ecf1aa2e1a9f80dd4600ebca1c12434d1614e3bf); /* line */ 
        c_0x348a98d0(0xabd8d1584e974f1242c878da5de5157a31721f5a0bf882cebf33c98e647af2d9); /* requirePre */ 
c_0x348a98d0(0xa78841160f66bd3f8daf197c34acc6fb1c38c141bb024eb25ed21b38dc38315e); /* statement */ 
require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal did not pass"
        );c_0x348a98d0(0xf51832bce6f4c31ab27cd2a25925f3f10314889078af869f058070a6750452c6); /* requirePost */ 


c_0x348a98d0(0x58e2a2bf4fbae00fcce4192a4eeda26e9454f03941d7167d77483f4c5d45838c); /* line */ 
        c_0x348a98d0(0xeb5f3a9fba9fbbacde976c9524e35ed2b66d8dc4d0e582970b3b4880cd500d4e); /* statement */ 
dao.processProposal(proposalId);
c_0x348a98d0(0x421e2bd2a0ba31e61af9a09c9c08670f3de6c7f5ca7371d785ae828585bad243); /* line */ 
        c_0x348a98d0(0x0596896cdb38dcd107b12f59b8f3454561a3cdfa8cb6257ac48e4c7234d70458); /* statement */ 
if (proposal.updateType == UpdateType.ADAPTER) {c_0x348a98d0(0xd3d9b4169b5cd04c1935adc7dcece675f3f84ffd7d2e2b8009c22e3090d1e674); /* branch */ 

c_0x348a98d0(0x4e77fea4e39de5fd60305cf353b824c31f87b5cc894608ee378ec1eff26570d6); /* line */ 
            c_0x348a98d0(0x1eafcf1287a3e2146d6d7610613b2a1da7c062f36cf6e6d388a0f4ed2bfdcca6); /* statement */ 
dao.replaceAdapter(
                proposal.adapterOrExtensionId,
                proposal.adapterOrExtensionAddr,
                proposal.flags,
                proposal.keys,
                proposal.values
            );
        } else {c_0x348a98d0(0x0f325e7c3d68eb37ab6f4cc437786a5b86b351ef6846a4cc4b5d6a6ce5373ec7); /* statement */ 
c_0x348a98d0(0xdc421fdd5c7c91eeaf24352393374a2b8ae864144d7550361b090c34b0624127); /* branch */ 
if (proposal.updateType == UpdateType.EXTENSION) {c_0x348a98d0(0x6489dcfbc8d1952b8e62fd2b3a80a7dd183e00ce1ff14fa5a96b7828ea14768b); /* branch */ 

c_0x348a98d0(0xf840fd3cabcf77a933d27ce1a7722b88be7ca144588814ee73e1ba54f21ce506); /* line */ 
            c_0x348a98d0(0x47e5ce628c44b4a63bb7b3a75d660e8873fbe9c82f27654846b3fbb8dbc42c43); /* statement */ 
_replaceExtension(dao, proposal);
        } else {c_0x348a98d0(0x1eee4007cee89ef511d978b4b906fd37ce79d318c16a08e1e3e23411b96b790d); /* branch */ 

c_0x348a98d0(0x423962bdb1e12f404de6d82db0207b5eee01faeae42fa46fdbc67d53d6d9eade); /* line */ 
            c_0x348a98d0(0x8b60369eeeb8bf9d403a4831d70decc302f7cc945c9d86ddbe2581b90b831b00); /* statement */ 
revert("unknown update type");
        }}
c_0x348a98d0(0x7120d41849b13c74bb616b653ff760c8090f1991ddaef0f7dfd4dc811f45a0e5); /* line */ 
        c_0x348a98d0(0x97a31a920e10f7bd8b7ea2c00a21a90454efdacc3f69cf23a8c95bebcf283551); /* statement */ 
_grantExtensionAccess(dao, proposal);
c_0x348a98d0(0xfbac55b75b401bdc0a46c7b1c171117b63ffb1f8cfc4d8d5d39476b16ba5f4ec); /* line */ 
        c_0x348a98d0(0x04b3aa3a62b66590a5ee38f6b60493bb1031cb6d11448fb93d27f33a5acaec93); /* statement */ 
_saveDaoConfigurations(dao, proposalId);
    }

    /**
     * @notice If the extension is already registered, it removes the extension from the DAO Registry.
     * @notice If the adapterOrExtensionAddr is provided, the new address is added as a new extension to the DAO Registry.
     */
    function _replaceExtension(DaoRegistry dao, ProposalDetails memory proposal)
        internal
    {c_0x348a98d0(0x7d0b766993c0e4fd1212c656a7af276ec845af2f24595b48d38fb7055dfb56bb); /* function */ 

c_0x348a98d0(0x10b339ea9cdcd3b60bd577c43cf1ccfcdd29b931b7ad85f6622c7656e18207ea); /* line */ 
        c_0x348a98d0(0xeadba2e325ab7abcc6f1e177058bb6d32ddee412000c6dc4085319958b36961d); /* statement */ 
if (dao.extensions(proposal.adapterOrExtensionId) != address(0x0)) {c_0x348a98d0(0x8635b74d7a2fccc2b36dd569cca1968ef8ae53fd937dda26e66b368dbd0aea39); /* branch */ 

c_0x348a98d0(0x366215e4e4f896f01d166a1ad0a941b6d9ca66e489489f9fca7b9fb5cb67dec3); /* line */ 
            c_0x348a98d0(0x090788641c94666abb655f24d3d667851d9e4af8fe2302ab47dea6a3ffbedfda); /* statement */ 
dao.removeExtension(proposal.adapterOrExtensionId);
        }else { c_0x348a98d0(0x845551c4ffe22d103dc9f08198f45331211ac8ab294e2f78f99fa11afc566662); /* branch */ 
}

c_0x348a98d0(0xed3f4d0aeba8c20047977212f2385614974d4f33e233014b6ed1d0589872f519); /* line */ 
        c_0x348a98d0(0x2ed25073ac55baa58e4ff0408a20b3f5babf4e5f62dc6a7c50e87f8c0fef5bfc); /* statement */ 
if (proposal.adapterOrExtensionAddr != address(0x0)) {c_0x348a98d0(0x1c268ec91b0f8dfc95c28a16ec514121e4918c1298a5826f2a9a5bf194ba0b1b); /* branch */ 

c_0x348a98d0(0x9ea68334e7e071c8ec3fbeab6b107cf0f9664577ab52c8cd2af89b46ab9ee78e); /* line */ 
            c_0x348a98d0(0x3c63eb2afa292de99315ef5a9178e0ed258d3da42f9d8c8447ecadfd3bbc4633); /* statement */ 
dao.addExtension(
                proposal.adapterOrExtensionId,
                IExtension(proposal.adapterOrExtensionAddr),
                // The creator of the extension must be set as the DAO owner,
                // which is stored at index 0 in the members storage.
                dao.getMemberAddress(0)
            );
        }else { c_0x348a98d0(0x97bdd022793697d02d3ae8aeec1f06c8a4e5fa2081d7af01120650df037b8069); /* branch */ 
}
    }

    /**
     * @notice Saves to the DAO Registry the ACL Flag that grants the access to the given `extensionAddresses`
     */
    function _grantExtensionAccess(
        DaoRegistry dao,
        ProposalDetails memory proposal
    ) internal {c_0x348a98d0(0x7f99376b7839c7e761b3b6768b2ab427e7e6b8104a09671b0291e9fa07ef5f93); /* function */ 

c_0x348a98d0(0xb1b7ae52d99bf2f8d87c7b3bb9fa059f1f55354a92dc485d8ec69ecaf240f3e2); /* line */ 
        c_0x348a98d0(0x5acc0d27dc85c19115d532d6be469fbfb71db8458656ee9165b1c28b0a9d5cec); /* statement */ 
for (uint256 i = 0; i < proposal.extensionAclFlags.length; i++) {
            // It is fine to execute the external call inside the loop
            // because it is calling the correct function in the dao contract
            // it won't be calling a fallback that always revert.
            // slither-disable-next-line calls-loop
c_0x348a98d0(0x433810bbd82c3a147a7239c34d3b7063747b5cf3c4c0503931482de92b3c9b66); /* line */ 
            c_0x348a98d0(0x6a53c4690ac5cd1f82fd15c8f0e0618f17d5d1f191f3f5375411f0427b271757); /* statement */ 
dao.setAclToExtensionForAdapter(
                // It needs to be registered as extension
                proposal.extensionAddresses[i],
                // It needs to be registered as adapter
                proposal.adapterOrExtensionAddr,
                // Indicate which access level will be granted
                proposal.extensionAclFlags[i]
            );
        }
    }

    /**
     * @notice Saves the numeric/address configurations to the DAO registry
     */
    function _saveDaoConfigurations(DaoRegistry dao, bytes32 proposalId)
        internal
    {c_0x348a98d0(0x6cc387641d4d2cc657baad11d51f59376ff04432ce53b5335033a59e1836bb29); /* function */ 

c_0x348a98d0(0xcf2f743dcad8b3a0e0068374ddad314eeaa624fb799cb7daa0db5d9ab7e4f204); /* line */ 
        c_0x348a98d0(0x22fd91a628dfdf2d475a030d5fdace75615afe5df63a6c5a79d822a50e6dcba6); /* statement */ 
Configuration[] memory configs = configurations[address(dao)][
            proposalId
        ];

c_0x348a98d0(0xb7880bfb9533f26bb1c968f2cd71791494e0d0f9be28da3945eea11fb6dfce74); /* line */ 
        c_0x348a98d0(0xb6f8bd932a698bf272ed17e961732fb8fa39ca0a4c3fdacc665b3d8d201da86c); /* statement */ 
for (uint256 i = 0; i < configs.length; i++) {
c_0x348a98d0(0xa65ffe9ecdccd31ca15f48be2f48e27d6fdd320513e2374541f1ef1643398205); /* line */ 
            c_0x348a98d0(0x579f2b616ee3f12079273c15d99e9d7b1257d36dd86d582c48833120768c11d7); /* statement */ 
Configuration memory config = configs[i];
c_0x348a98d0(0x16bac107578e8247585566460d1b8d72a358f6acef966cb55f9243cfa66a9dfd); /* line */ 
            c_0x348a98d0(0x70608ebc81ea5ce3c5d155a8b1205cf296101c8d0e2c7c557e91f0c6f0763006); /* statement */ 
if (ConfigType.NUMERIC == config.configType) {c_0x348a98d0(0x8364a14bba336345022004e53e6722f4d66461859de9329ceb2a5c2f4f84596d); /* branch */ 

                // It is fine to execute the external call inside the loop
                // because it is calling the correct function in the dao contract
                // it won't be calling a fallback that always revert.
                // slither-disable-next-line calls-loop
c_0x348a98d0(0xe88c93a7ac817c9dca37f5f0920da021270ea53126732b89d6deec3a4647038b); /* line */ 
                c_0x348a98d0(0xd17bdb8239fe5e54c6642b67a8234822526359c5eaf00b82a88a05591254e97f); /* statement */ 
dao.setConfiguration(config.key, config.numericValue);
            } else {c_0x348a98d0(0x410a628d4a7d4db116a2d9997045fcacccba321da4588423f9f93243e14c7ed0); /* statement */ 
c_0x348a98d0(0x0cfbc7033ac474550c9d72f5b840e9d8cd11913c2f346a6519ae35278e90f1a2); /* branch */ 
if (ConfigType.ADDRESS == config.configType) {c_0x348a98d0(0x32b4af00f07c98fab3e597b7d50f508465caaf5465638f40289c1ef4ade8aa50); /* branch */ 

                // It is fine to execute the external call inside the loop
                // because it is calling the correct function in the dao contract
                // it won't be calling a fallback that always revert.
                // slither-disable-next-line calls-loop
c_0x348a98d0(0x7c748216e141ab3689fef3fa4dcf6f82cfae4ed7571b74452f06a0d31f81e023); /* line */ 
                c_0x348a98d0(0x3b39132c30f9b5dec0fc16221f938ce3288363524a41ebe2eb6d28fc67aa6c80); /* statement */ 
dao.setAddressConfiguration(config.key, config.addressValue);
            }else { c_0x348a98d0(0xc1579e6b103b85724f733a19ff7825101df42d6d5b55b61ca5600a1f56fc3888); /* branch */ 
}}
        }
    }
}
