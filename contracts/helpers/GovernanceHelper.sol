pragma solidity ^0.8.0;
function c_0xa71a12a0(bytes32 c__0xa71a12a0) pure {}


// SPDX-License-Identifier: MIT

import "../helpers/DaoHelper.sol";
import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../extensions/token/erc20/ERC20TokenExtension.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
library GovernanceHelper {
function c_0xed67f99a(bytes32 c__0xed67f99a) public pure {}

    string public constant ROLE_PREFIX = "governance.role.";
    bytes32 public constant DEFAULT_GOV_TOKEN_CFG =
        keccak256(abi.encodePacked(ROLE_PREFIX, "default"));

    /*
     * @dev Checks if the member address holds enough funds to be considered a governor.
     * @param dao The DAO Address.
     * @param memberAddr The message sender to be verified as governor.
     * @param proposalId The proposal id to retrieve the governance token address if configured.
     * @param snapshot The snapshot id to check the balance of the governance token for that member configured.
     */
    function getVotingWeight(
        DaoRegistry dao,
        address voterAddr,
        bytes32 proposalId,
        uint256 snapshot
    ) internal view returns (uint256) {c_0xed67f99a(0x8efddb4471f3807b1c2b5d02fec6f856a0c880999c2afdbbbb11a281bd69cfbd); /* function */ 

c_0xed67f99a(0xa7c8c1af66c18481c6bef5502618bce2c08a7ffe94eee7cfc0ba34cfd44323e7); /* line */ 
        c_0xed67f99a(0x8bf24453794a2e0cd89c5cacf47227e093796a9a82959fa1d9d1e93c43e4e3ec); /* statement */ 
(address adapterAddress, ) = dao.proposals(proposalId);

        // 1st - if there is any governance token configuration
        // for the adapter address, then read the voting weight based on that token.
c_0xed67f99a(0x092193f321d1de9c3ab2f4b03267f922278a1499bd77d85050275c377798bf9a); /* line */ 
        c_0xed67f99a(0x842fd6986b3540356efe837135925efcfa5e346240ae4def4eee3e71b839c85c); /* statement */ 
address governanceToken = dao.getAddressConfiguration(
            keccak256(abi.encodePacked(ROLE_PREFIX, adapterAddress))
        );
c_0xed67f99a(0xa1da08f6685936cdf0a9d1b3adc62dd32f5aacb816e831ba85cd9889ac1d10a8); /* line */ 
        c_0xed67f99a(0x0d33056adf1e18e2c59d96bcb74b8a47a33e24cca1342e0f5235d541567d9a68); /* statement */ 
if (DaoHelper.isNotZeroAddress(governanceToken)) {c_0xed67f99a(0xdf23ac11b0d565c1db55ccb3c0b24b27a945ed095482a4c75dd3f6f78aacdc42); /* branch */ 

c_0xed67f99a(0xc0fde033a08a41b1a24530313a18f73836cdee7039bc6912b4f4e11982b1c774); /* line */ 
            c_0xed67f99a(0x0338020903370014a08ebe1c0139edb8e7000d185628706670e0c48922a245e1); /* statement */ 
return getVotingWeight(dao, governanceToken, voterAddr, snapshot);
        }else { c_0xed67f99a(0xd3e191a2602b0ea15a4e10a3a56b9eaf4fc44deae106d828653d9068fd97b877); /* branch */ 
}

        // 2nd - if there is no governance token configured for the adapter,
        // then check if exists a default governance token.
        // If so, then read the voting weight based on that token.
c_0xed67f99a(0xdf26b9aceaaa53adb85a119a2e7a3574d4bf37cf7d80305e6b769e29666d81f3); /* line */ 
        c_0xed67f99a(0xa295eb0ff65f42f9b75da962f573955bf3e31b862a48938a806e9f76bd35d579); /* statement */ 
governanceToken = dao.getAddressConfiguration(DEFAULT_GOV_TOKEN_CFG);
c_0xed67f99a(0xd9a454d6fc526354b68b325e2ecb036b18b01224f6258fee1e1b4672383f3096); /* line */ 
        c_0xed67f99a(0x84746db3403957d4385266e874a749fd6b4e3c9965cde61b69faf0cf347ca0b0); /* statement */ 
if (DaoHelper.isNotZeroAddress(governanceToken)) {c_0xed67f99a(0x40652847b694b553566bd386703366847898883af52eadc87623f64fccf8a94b); /* branch */ 

c_0xed67f99a(0x0444100d57432cd95dccdb62ca9710982d1033d2533d47040b6c5d1ef14e0ba5); /* line */ 
            c_0xed67f99a(0x9f4b5569a45af73ea411eb680dcd058aa14c343bf4b54263b5be9630bc0d9ea4); /* statement */ 
return getVotingWeight(dao, governanceToken, voterAddr, snapshot);
        }else { c_0xed67f99a(0xc08f0520fd9f8a0ca058c46ef079d3ae7a2796572a15ec789f52a47b6b0411bb); /* branch */ 
}

        // 3rd - if none of the previous options are available, assume the
        // governance token is UNITS, then read the voting weight based on that token.
c_0xed67f99a(0x65689d336c390ce19bbce18a3cf3cbdb41e31b5131e4d3030e61c42ec3a9122e); /* line */ 
        c_0xed67f99a(0x115699e580dc8c193be20cb8bbbe803d524c1188bba59e52a3fd882cf65cf943); /* statement */ 
return
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
                .getPriorAmount(voterAddr, DaoHelper.UNITS, snapshot);
    }

    function getVotingWeight(
        DaoRegistry dao,
        address governanceToken,
        address voterAddr,
        uint256 snapshot
    ) internal view returns (uint256) {c_0xed67f99a(0x5dd1cb51d1ec12c3f0e7ff22ccb43f9422e33a861eb4aefb2e701b262875fe43); /* function */ 

c_0xed67f99a(0xa1491cf7cfb1a78da5e465728a40537b8d9d5e15c5f92f1e5c7d853b74e7e282); /* line */ 
        c_0xed67f99a(0xc2b9ca89737a45e1f4049cac22263cdda7135bbb8371b6127d1adfcf533f476a); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0xed67f99a(0xb85ca42de90a24f40adbf3e89cb6a68c409ab46811f249a7232103bf4a1c251b); /* line */ 
        c_0xed67f99a(0xfe4f28e8907b9207e48ca8967cede753c53d8518ca61739faa1868f305c77db3); /* statement */ 
if (bank.isInternalToken(governanceToken)) {c_0xed67f99a(0xa02e1e88b391b1eae948651d7c04a2d71664f594a5dfe0b05f26f022a0888efa); /* branch */ 

c_0xed67f99a(0x0899016aa68f3bd9b1133eed36e53fc5f3b15c05255e349d50f47bd45ddaa55d); /* line */ 
            c_0xed67f99a(0x02371c31b25d71447c7b7475f50710bac45e7c70130480535eac2f6292985aeb); /* statement */ 
return bank.getPriorAmount(voterAddr, governanceToken, snapshot);
        }else { c_0xed67f99a(0x31b5678e8fe8bb249d787ae335fa4171b5fcb5a12ade61223211b8d846b5eb6b); /* branch */ 
}

        // The external token must implement the getPriorAmount function,
        // otherwise this call will fail and revert the voting process.
        // The actual revert does not show a clear reason, so we catch the error
        // and revert with a better error message.
        // slither-disable-next-line unused-return
c_0xed67f99a(0xd8bb28ef28ab4f04daf48b4e55d73563fae0efbe90ae97827f139492b9b6af86); /* line */ 
        c_0xed67f99a(0x90c47668a5f19c62f66aa8f2c55e6722041c5caf9285dfbb56e306d5bf4c4904); /* statement */ 
try
            ERC20Extension(governanceToken).getPriorAmount(voterAddr, snapshot)
        returns (
            // slither-disable-next-line uninitialized-local,variable-scope
            uint256 votingWeight
        ) {
c_0xed67f99a(0x85ceb4312ba05b664c963f913bba0c346623d31f96cc46c469ed520c73a53c4b); /* line */ 
            c_0xed67f99a(0xa7054747ff3466a9ffd32d68ea10441fa5af0471f129de3cfc9b690ebf15ac71); /* statement */ 
return votingWeight;
        } catch {
c_0xed67f99a(0x2e306af4087bf43d6dda59759a1423f75cd235af6bdcf6bbb206150dc3aa69fa); /* line */ 
            c_0xed67f99a(0x4a7a34a6bf857dc8b515e300fee32b4be9a9431cdb2399ef3e2877ebcfa6741c); /* statement */ 
revert("getPriorAmount not implemented");
        }
    }
}
