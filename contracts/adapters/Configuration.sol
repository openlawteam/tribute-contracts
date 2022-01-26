pragma solidity ^0.8.0;
function c_0x4a44a0bb(bytes32 c__0x4a44a0bb) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";
import "./interfaces/IConfiguration.sol";
import "../adapters/interfaces/IVoting.sol";
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

contract ConfigurationContract is IConfiguration, AdapterGuard, Reimbursable {
function c_0xce3d5df9(bytes32 c__0xce3d5df9) public pure {}

    mapping(address => mapping(bytes32 => Configuration[]))
        private _configurations;

    /**
     * @notice Creates and sponsors a configuration proposal.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     * @param configs The keys, type, numeric and address config values.
     * @param data Additional details about the financing proposal.
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        Configuration[] calldata configs,
        bytes calldata data
    ) external override reimbursable(dao) {c_0xce3d5df9(0xf5920e43040a1557ff52460ed44ba6112b76e59b6e4eb3b63d979d5be1e34a89); /* function */ 

c_0xce3d5df9(0x4373274c47c6b58f8a6660b2cae669e42f6591145524e006b4170e389316930d); /* line */ 
        c_0xce3d5df9(0xd5813d001b07fcca83f5305fb8f8c2ec6585b2450bbe292acbe023ea027b7a0e); /* requirePre */ 
c_0xce3d5df9(0xcfd684f185d54be95bb8190607b5fdbd8d646bef8e34329bbccd47af97847ed6); /* statement */ 
require(configs.length > 0, "missing configs");c_0xce3d5df9(0x3e88456894f144c287308aad7fd7efdfad4022ae040b9bd3a6873c876b7b031f); /* requirePost */ 


c_0xce3d5df9(0x859b1fd51d088e3ad32fbbb072d53eff1704cfc312c20be091b3f8e12c7ec424); /* line */ 
        c_0xce3d5df9(0xe4fd9b8a14090b4de1c57eed061fa7e644407709bd5fe84168eff292b7989856); /* statement */ 
dao.submitProposal(proposalId);

c_0xce3d5df9(0xda0b09591c174a867395da1752cc11a4369ebe1327cec7a0ae4bbe5021895c03); /* line */ 
        c_0xce3d5df9(0xa558000c03df29b6c8af74e8c584ef11f721dc6ec6e147f0a154dc52a90ded38); /* statement */ 
Configuration[] storage newConfigs = _configurations[address(dao)][
            proposalId
        ];
c_0xce3d5df9(0xdf6467ce48b4ff1c8adb819d5abcdd19e4b0222fdbb893ec0e0ec8a7be8f9b7d); /* line */ 
        c_0xce3d5df9(0xd71dc8da9c9b0e8b505da20b9cebc348f64fd8e813232b85eec2597f40663b49); /* statement */ 
for (uint256 i = 0; i < configs.length; i++) {
c_0xce3d5df9(0xbd28170058f404c9605ea32ca95d21ba18ffc8374e76a41335ba6b69f5eb7609); /* line */ 
            c_0xce3d5df9(0xa1ce2c5a4f57bb1b24d9b074f66b5f148ab72ff4f9b4ee8eff2ac3bc112f49e5); /* statement */ 
Configuration memory config = configs[i];
c_0xce3d5df9(0x377fb466b1b9699ef406be03a466ee423804bcec454b37dcfd8db04d7b8f4730); /* line */ 
            c_0xce3d5df9(0x20f1b3981f6392b847f6ee6d0f809f5779798d43e0531cda80137567a9400433); /* statement */ 
newConfigs.push(
                Configuration({
                    key: config.key,
                    configType: config.configType,
                    numericValue: config.numericValue,
                    addressValue: config.addressValue
                })
            );
        }

c_0xce3d5df9(0xff5574ba1f52b30acecc03163f1288749c6dbaec10bec2dcedeb7a773f42796f); /* line */ 
        c_0xce3d5df9(0x46319dd727ae8968002aafe98d094becef8c5b620ac792a710c1deefac92c428); /* statement */ 
IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
c_0xce3d5df9(0x7ca41870f7d3f9bb3c95ec0f6222e3efac1948ba2ad7ffd128d44ceda697a1d6); /* line */ 
        c_0xce3d5df9(0xa24b13201798ba043a8044893316f04a767992c66d1640483127e10c73d96c76); /* statement */ 
address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );

c_0xce3d5df9(0xba96b5c2bc3b4e4492e4c8b073db597ecf3313e9aa8b53d4a6ada54523846aed); /* line */ 
        c_0xce3d5df9(0xd62808669ba629b7da3e929ae237ee45548ce0d2e73c986496601846ebaccea7); /* statement */ 
dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
c_0xce3d5df9(0x37d96dc2f58f167a812a22c97fce2f736f218fe7ab8726005cd5a1f969c898fe); /* line */ 
        c_0xce3d5df9(0x9f778d437f3c6ff88209d797c8663018df78c39d4dc4880ca54c987a165e3458); /* statement */ 
votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    /**
     * @notice Processing a configuration proposal to update the DAO state.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     */
    // slither-disable-next-line reentrancy-benign
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reimbursable(dao)
    {c_0xce3d5df9(0x56de7ed4e11f326ba8ef061c93e595323df25fc57aedb54896745f810b0512c9); /* function */ 

c_0xce3d5df9(0x828a4cd38073a0d3e3981ef47567ec0354003017b6fff7cc144ab38c08eed3e8); /* line */ 
        c_0xce3d5df9(0xeafb8bbf49efc5ffdb914b766e6226aae5e46d6117603638acf4743e143d52d8); /* statement */ 
dao.processProposal(proposalId);

c_0xce3d5df9(0x8042bdb9789cf54343858e6198c1a4eb688cf6bafbd445800d7b876c785b3a2c); /* line */ 
        c_0xce3d5df9(0xced4be594a675254444ca915f57bd8a93e9ac6c5a63d7228e57c6ffa052c323d); /* statement */ 
IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
c_0xce3d5df9(0x2c664732dc19816831d0d2c8672c61dcaeb7a649903c6f9c48dd205f929c8b47); /* line */ 
        c_0xce3d5df9(0x6d13b120d041fe0fc41c0b3b804cc83184dd679bd641a85c62981c4e6628cd71); /* requirePre */ 
c_0xce3d5df9(0xcde3cc757604f16fb1ac8c183f78e57863cfd03702511811820d0b99be4a7a6c); /* statement */ 
require(address(votingContract) != address(0), "adapter not found");c_0xce3d5df9(0x3c375152a23f241a1837168440d3f7499b078be17531149bfe389801c2da3c0d); /* requirePost */ 

c_0xce3d5df9(0x92b9c1559a7a4c000de0120fe53aa94fc46bb785c7b49b1b4cfb120059ab49df); /* line */ 
        c_0xce3d5df9(0x11f8674767faf668d9956b2aeb7d2aa3b8e2bdd11ceca8c248ab53334be60b6e); /* requirePre */ 
c_0xce3d5df9(0xc7136bdd83f05ac17b10ccdcacac8edc9310dc5d72775e5ed606ea566c3da9c9); /* statement */ 
require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal did not pass"
        );c_0xce3d5df9(0x9ef3c5becd80f3785f50182a28c130776d5c5e5480e205a73f0d972d6f5b8754); /* requirePost */ 


c_0xce3d5df9(0x0dcfb3a7c47cef17f9e51fb664d441ca11a244b9c8da704f34a4e86bd1d0f004); /* line */ 
        c_0xce3d5df9(0xa3ac10153d88828836260242cfda2616448318d96bbeab254b16bd6ad70379ba); /* statement */ 
Configuration[] memory configs = _configurations[address(dao)][
            proposalId
        ];
c_0xce3d5df9(0xdae793073a9d694d7a4a75e0d9dcdf244345726a340c507691d7adf774bf7e11); /* line */ 
        c_0xce3d5df9(0x6de4e4be6f7e0188e2a1e9850efad5466ccb646a51f3707345fa9a4aaa6327be); /* statement */ 
for (uint256 i = 0; i < configs.length; i++) {
c_0xce3d5df9(0x0e105571cdd36e5b874404fbaf0fd1478aa53b042ebe1cbd18b365bc2cb90695); /* line */ 
            c_0xce3d5df9(0x0677d3ea025c3cc9cf4de6209cd3d5db9951656d5bfa2722502abf48db087028); /* statement */ 
Configuration memory config = configs[i];
c_0xce3d5df9(0xb8c5f3b687bdabe13708154a662c97f04f6fc2f4295c92fee8990b4615ac24a9); /* line */ 
            c_0xce3d5df9(0xa7434ef5a650653df8f94d1526c99d11a74fe726d83bdb0986621361756ec3e6); /* statement */ 
if (ConfigType.NUMERIC == config.configType) {c_0xce3d5df9(0x4484ca218e9d88012cd28f4a6a5eb764cf353e24f964cd5353d273978174af6c); /* branch */ 

                //slither-disable-next-line calls-loop
c_0xce3d5df9(0x8367265d768642cd18cb88e15500bb08fcefcde7437dae020bc231b08ecd128d); /* line */ 
                c_0xce3d5df9(0xc76a18d9f077492d41e4b69486eb4aca5e5246e9f4b408696d7ffbf46fcbde4b); /* statement */ 
dao.setConfiguration(config.key, config.numericValue);
            } else {c_0xce3d5df9(0x66422d93858c0958575f5d0d9cf3caa2ae4ab76236e4b3efe2807f491f24a583); /* statement */ 
c_0xce3d5df9(0xedfdd3f63fcadd6ca9e100f01ffa2bee2700706c6af820c2c734c449b16fc943); /* branch */ 
if (ConfigType.ADDRESS == config.configType) {c_0xce3d5df9(0x6edbe5e4b6b2064fe3ec082b0c4291f850f884e6e4f96d86b55b1b3f364197e0); /* branch */ 

                //slither-disable-next-line calls-loop
c_0xce3d5df9(0x3bb99c3140057d7b7cb60f739af2ac877ba8828dd4c111b5a221f3e47f001330); /* line */ 
                c_0xce3d5df9(0xb878dcb4a5db433ede6cc6c44747404cb505e8b1e926d4ddb8b54c1eb896c32b); /* statement */ 
dao.setAddressConfiguration(config.key, config.addressValue);
            }else { c_0xce3d5df9(0x3df15674a8b3e96ca96a3d5589a83c80c5bb14767044debb552bff9df6555647); /* branch */ 
}}
        }
    }
}
