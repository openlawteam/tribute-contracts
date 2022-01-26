pragma solidity ^0.8.0;
function c_0x29156085(bytes32 c__0x29156085) pure {}


// SPDX-License-Identifier: MIT

import "./interfaces/ISignatures.sol";
import "../core/DaoRegistry.sol";
import "../extensions/erc1271/ERC1271.sol";
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

contract SignaturesContract is ISignatures, AdapterGuard, Reimbursable {
function c_0x6ca2ae50(bytes32 c__0x6ca2ae50) public pure {}

    struct ProposalDetails {
        bytes32 permissionHash;
        bytes32 signatureHash;
        bytes4 magicValue;
    }

    // keeps track of all signature proposals handled by each dao
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /**
     * @notice Creates and sponsors a signature proposal.
     * @dev Only members of the DAO can sponsor a signature proposal.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     * @param permissionHash The hash of the data to be signed
     * @param signatureHash The hash of the signature to be marked as valid
     * @param magicValue The value to return when a signature is valid
     * @param data Additional details about the signature proposal.
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes32 permissionHash,
        bytes32 signatureHash,
        bytes4 magicValue,
        bytes memory data
    ) external override reimbursable(dao) {c_0x6ca2ae50(0xde1382d7ae4227dc99641cb1849cc4224a859480c9414fad4fb077ab073f79fc); /* function */ 

c_0x6ca2ae50(0x32e928c0a256c8bb28bc62c647e2d02787ab46181263b5f207f88905aa991915); /* line */ 
        c_0x6ca2ae50(0x63e15528af05bae90106a60f1322e118b8b8ab088608335717b886223fd8de73); /* statement */ 
dao.submitProposal(proposalId);

c_0x6ca2ae50(0xe91778f9573e0b26ed1a8bfcc8aced74d10566cb7aa0ef7b813ff809f4a2c9bd); /* line */ 
        c_0x6ca2ae50(0xa0ce1c582161cb8ca134ec4f5424641a0d4144bd951d711af7f8cd38110aeabf); /* statement */ 
ProposalDetails storage proposal = proposals[address(dao)][proposalId];
c_0x6ca2ae50(0x3d2bdc90cb57cb531050057809bef3541c2fbf7f5045337ad8463a08399db165); /* line */ 
        c_0x6ca2ae50(0x0c90e09fd7c0b1f8992c6d3f182259e4b53d00c288ed8e1a27fb87d1f37523af); /* statement */ 
proposal.permissionHash = permissionHash;
c_0x6ca2ae50(0x2a105f3d07f4eecd567be4224b1ae661ee12f604769cb747ed5846fb72e5dd3f); /* line */ 
        c_0x6ca2ae50(0xc0e6a10e968db4f2268909832e129379a7e8f7ef28cfcbe98b913936d8736b13); /* statement */ 
proposal.signatureHash = signatureHash;
c_0x6ca2ae50(0xb88c5a448ae8e2b334b5eb9d553bc67ff4f7e6885e97880f49d1701cd8e9ef04); /* line */ 
        c_0x6ca2ae50(0x0ef6160ac187f8fa8bf58d6676b8904663d8f1dabce808ee88b8efbeeb503bbf); /* statement */ 
proposal.magicValue = magicValue;

c_0x6ca2ae50(0xa1d6cb018893ffff8f3c0ebc2744871393adfc4a28e509a5c3f057b5f7563293); /* line */ 
        c_0x6ca2ae50(0xd065e6dfd6fefe63ca17bfa94bd1fbb9791cba1f3f0cd577e80363cf354eb732); /* statement */ 
IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
c_0x6ca2ae50(0x1dae3adf337695343869e09b6a71b10fe461b1c889a354f17244a75cf8983940); /* line */ 
        c_0x6ca2ae50(0x4de2913c4e22ef5dd328b695b8fc64ca8410fff20eeecdcc58017c39ec7f8468); /* statement */ 
address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );

c_0x6ca2ae50(0x479b7ed17611b1fd98cedcb1f785959276e05a0205dd6f2f446bec0158652d1c); /* line */ 
        c_0x6ca2ae50(0x70ac0a4f42390ff1dfa12b9610fb0f811eebce8216b53bf84d7b024c7362c21b); /* statement */ 
dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
c_0x6ca2ae50(0x5be6f66bb3a4acb73389a18557f0918bce25db092ba1bcb0ebd8566ad9f70e65); /* line */ 
        c_0x6ca2ae50(0xf6a59f7643ac98bf6d912c355e86f906791e5b5cc6c58ca7c1b37018ec50a623); /* statement */ 
votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    /**
     * @notice Processing a signature proposal to mark the data as valid
     * @dev Only proposals that were not processed are accepted.
     * @dev Only proposals that were sponsored are accepted.
     * @dev Only proposals that passed can get processed
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reimbursable(dao)
    {c_0x6ca2ae50(0xf24239ae406995841535a330377268be3665e5f6022facb3a6f80f81346baafb); /* function */ 

c_0x6ca2ae50(0x23d2a04d969b24f6d420dd2b5cb6fe8610cd611e8b872e7a681373bcea78a33f); /* line */ 
        c_0x6ca2ae50(0x2d5a4d4d8c59ce5898427dd5d3995558cd3119ea088ef63a10a1b7ecb7f95568); /* statement */ 
ProposalDetails memory details = proposals[address(dao)][proposalId];

c_0x6ca2ae50(0xbe4e2ee468217b1261139b156f1a99365a426f05b94cf8013715087cab22e4f0); /* line */ 
        c_0x6ca2ae50(0x1a724861906c538e3e9208bd8d0abfe06565706d54c6ea50aeccabf51ac006d5); /* statement */ 
IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
c_0x6ca2ae50(0xa2c1535b4af6f82055bd553c8b80bfc2caa429038ecb64eafe10dbfa492d4e54); /* line */ 
        c_0x6ca2ae50(0x5b7de087d547c1091a5fc53ae1817bc1ca747fea7e7ac18294390c1e7ce1db8f); /* requirePre */ 
c_0x6ca2ae50(0x61326d48624aaf5519ecc15c8bb70033b67e668b9163160658c56bc7630a0597); /* statement */ 
require(address(votingContract) != address(0), "adapter not found");c_0x6ca2ae50(0xfccaaf6137c184031543cd366b4e8bd503bdd3fefb826f2bb43668b4cf8f3f08); /* requirePost */ 


c_0x6ca2ae50(0xaf5205df2d8ab8de49c820d123b12f59afecc093458191c3393095e81af82667); /* line */ 
        c_0x6ca2ae50(0xb449cd7ceebf71df0f0b3575c91ae4fdda26869559a75a3c7f8a9565ec79864e); /* requirePre */ 
c_0x6ca2ae50(0xbfa681b620bf0c3da5391f263013ac3d96c9e47fac2e36377bee7633d5e766df); /* statement */ 
require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal needs to pass"
        );c_0x6ca2ae50(0xedb1feafd18bc786046744bee0354d2e9aa0b8551f06ba81b226899377409b55); /* requirePost */ 

c_0x6ca2ae50(0x66fbe8f587700036c5a626f27b90a8a354d22fd3f11c29fb78f9a3c59b20b1fa); /* line */ 
        c_0x6ca2ae50(0x81d11e81bb92b2b3385f6e863e1e3cf2dafd170b865ae281a4ec500b1f7f4725); /* statement */ 
dao.processProposal(proposalId);
c_0x6ca2ae50(0x2d7822b3f749104ec95784857ec40f195459a3438e427f43e0169a0613f2fdf6); /* line */ 
        c_0x6ca2ae50(0x5562892647afb4c6b2a4ff651698587d799a1e11600c22a057f84d6bd391e739); /* statement */ 
ERC1271Extension erc1271 = ERC1271Extension(
            dao.getExtensionAddress(DaoHelper.ERC1271)
        );

c_0x6ca2ae50(0x29f2ba5680ddbaa7100eb10f04a618d5cbe7f98cfbf5335116d2c833158c2df0); /* line */ 
        c_0x6ca2ae50(0xe20afec831c4e6d66ec520b93a5aaa017b508192c4d8d590cc0adb6bd8b8e328); /* statement */ 
erc1271.sign(
            dao,
            details.permissionHash,
            details.signatureHash,
            details.magicValue
        );
    }
}
