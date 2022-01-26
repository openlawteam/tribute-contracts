pragma solidity ^0.8.0;
function c_0xd9d7f802(bytes32 c__0xd9d7f802) pure {}


// SPDX-License-Identifier: MIT

import "./interfaces/IFinancing.sol";
import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
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

contract FinancingContract is IFinancing, AdapterGuard, Reimbursable {
function c_0xec6f88dc(bytes32 c__0xec6f88dc) public pure {}

    struct ProposalDetails {
        address applicant; // the proposal applicant address, can not be a reserved address
        uint256 amount; // the amount requested for funding
        address token; // the token address in which the funding must be sent to
    }

    // keeps track of all financing proposals handled by each dao
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /**
     * @notice Creates and sponsors a financing proposal.
     * @dev Applicant address must not be reserved.
     * @dev Token address must be allowed/supported by the DAO Bank.
     * @dev Requested amount must be greater than zero.
     * @dev Only members of the DAO can sponsor a financing proposal.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     * @param applicant The applicant address.
     * @param token The token to receive the funds.
     * @param amount The desired amount.
     * @param data Additional details about the financing proposal.
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address token,
        uint256 amount,
        bytes memory data
    ) external override reimbursable(dao) {c_0xec6f88dc(0xd6deac521a7baef42699774b13f19258fe22e54dc31a45ae1266e4ff936a8dd8); /* function */ 

c_0xec6f88dc(0x70e35adb3ca7fe7a3167fdb631fe5149461ddd8709f8118962be571715a308f2); /* line */ 
        c_0xec6f88dc(0x277282fde5df344c38837b1b604976a0a357949e540073ab14fdc9b52d3e8faa); /* requirePre */ 
c_0xec6f88dc(0x9ebb9f60869a91a784ff86495e5ddc3954ce297d22b1662872c919bca9310267); /* statement */ 
require(amount > 0, "invalid requested amount");c_0xec6f88dc(0xe6e7fa0c4133c48b0419af6eb778fded670b3a3d0cb65396c42d5a63512898e9); /* requirePost */ 

c_0xec6f88dc(0x4890053e7c02d0aa9c5e56e9afe10fb2a81cd554ac9eca321c7359d9ac826718); /* line */ 
        c_0xec6f88dc(0x20ad505bfffba4b80afdca7b11599d80285d77b9007c3afc1faf5f1a3391a73b); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0xec6f88dc(0x3b0ae6fa7ad45494032b3e531db79fa8dbbb03eca91d344a8ca25ee359cd629a); /* line */ 
        c_0xec6f88dc(0xbf7dafb133b6c30659568e5fdf53b6dd805e1f0f135408878607a478a97aac0e); /* requirePre */ 
c_0xec6f88dc(0x3ef22ae698790ea29609c563b062f922a1943c15ee4b36dc32021f7c85cb78c3); /* statement */ 
require(bank.isTokenAllowed(token), "token not allowed");c_0xec6f88dc(0xc7752c1136fff81e721c9a22536fd122c39a619e012045030e4bcb449222f43a); /* requirePost */ 

c_0xec6f88dc(0x6dd08b04028b6e963d43544f814a7aac43d2859894582d131abc8fcf3c4d3c31); /* line */ 
        c_0xec6f88dc(0x9c3cc5d001d815be30c0038baf1df9b5ff78209b1636f4e28c78205d394533e6); /* requirePre */ 
c_0xec6f88dc(0xde87ff4908c51b9af3c36aa3c36b18c84c99d158477bbce06ed3d8b4816839de); /* statement */ 
require(
            DaoHelper.isNotReservedAddress(applicant),
            "applicant using reserved address"
        );c_0xec6f88dc(0xf7e418a938800dca95bb5adc7e22aa2e2c4e848a30f4fcf3e91bc740e83e9884); /* requirePost */ 

c_0xec6f88dc(0x059623ccb95c7a5f7eca027a64a49524d5781e99c80fb63e981b03ecfcae695a); /* line */ 
        c_0xec6f88dc(0x50dc8b021fb983ee6ea6ab617db5da98822b7396e04bdb4c875c08279a510611); /* statement */ 
dao.submitProposal(proposalId);

c_0xec6f88dc(0x479a36329fd518130bf83dbd60fc13b3309a30676225e5573d17759d9ae72713); /* line */ 
        c_0xec6f88dc(0x9f43a1817353801fbfc35caa7da0c83b69d0b5a048a630aab251a48fb0d6e4be); /* statement */ 
ProposalDetails storage proposal = proposals[address(dao)][proposalId];
c_0xec6f88dc(0x1a7a0b7af2dc791935ae1a3189110e9fc748c7c301e36f9a7a0e74748a8a9951); /* line */ 
        c_0xec6f88dc(0xabe498e47be60202d24f9b6a91fe58dcd0313104df55d9b95740866152f98918); /* statement */ 
proposal.applicant = applicant;
c_0xec6f88dc(0x8e2c3da9c0ac9c62b121a4e37b9fbc4bdde3bb54e1fc517fb74160169e06c14e); /* line */ 
        c_0xec6f88dc(0xe763aff72a8d805ead631235311d2f05dbba49b6dd9ce62fc0dc6206fe935a7b); /* statement */ 
proposal.amount = amount;
c_0xec6f88dc(0x3a993509eb59f35114c77bc12adb0820b2cf549bd31058e8c7b5c792cea74106); /* line */ 
        c_0xec6f88dc(0x27df1e3f16b03dd1d1b96958815489fc8e029fdfc6054cbdad783752a26b0493); /* statement */ 
proposal.token = token;

c_0xec6f88dc(0x3983bdf06976e5f9a8d04a6e615a06aaf7115f0bda5a79173acdf2e576e73d30); /* line */ 
        c_0xec6f88dc(0x2d91f6bbcd452448a458c35c993dbb29103eb2c7b295be0bd8bb19115fbc56de); /* statement */ 
IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
c_0xec6f88dc(0x56e1fb7672dc3696c0ab24e42ff807ff2a43cc8343d8dfdfaf78d21efd9904f8); /* line */ 
        c_0xec6f88dc(0xea9455c493f1e4d63000e8766aead4549cc6e93ebef81c6138b6740f3be429c4); /* statement */ 
address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );

c_0xec6f88dc(0xa0e0a5de499b6e70f5397c35a22ed1caffc49cb95ff6e95bb550347c52b8f688); /* line */ 
        c_0xec6f88dc(0xd6ba47965319dd58f5a30f8050a6dedc31b8c943334b86439dda1f80dab605d4); /* statement */ 
dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
c_0xec6f88dc(0x08fe7de3fcf0a1f85d5e896c49d8bd14892b86a012ad1de558128591782320c4); /* line */ 
        c_0xec6f88dc(0x2f97b7c8a73345e0f25ec357b83a03014f290c93e0d18943c28dcefacc8d2918); /* statement */ 
votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    /**
     * @notice Processing a financing proposal to grant the requested funds.
     * @dev Only proposals that were not processed are accepted.
     * @dev Only proposals that were sponsored are accepted.
     * @dev Only proposals that passed can get processed and have the funds released.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     */
    // slither-disable-next-line reentrancy-benign
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reimbursable(dao)
    {c_0xec6f88dc(0xb15f8218c3e6b3aa8d6249b9a99e83b60ff846d7cda2d01fcd5703c87f81dfdc); /* function */ 

c_0xec6f88dc(0xf55d44119fd5c02ddee59907714a9ca2b1b332099b586ae9d62356ac63a53338); /* line */ 
        c_0xec6f88dc(0x0ffba07a5c30777f4813c286ac2e457c64b86724f86f1e4c0eb058d16b162340); /* statement */ 
ProposalDetails memory details = proposals[address(dao)][proposalId];

c_0xec6f88dc(0x1c27957d59081067c541f5e526088c63c8adb9ff727f7b539ba40c066f6e015c); /* line */ 
        c_0xec6f88dc(0x36e95f4cf3d237798d84f5569d7b11a618d870f905acd4f2fbacfeeca1b21472); /* statement */ 
IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
c_0xec6f88dc(0xb9fd5599952f84e103d4019262b7acd0f3aa6a7cde1bb2cfa30f7ce8589e0b34); /* line */ 
        c_0xec6f88dc(0x2702b6a4fb24217448ae823e015716c54cd100c78a98a63f50ba468c8063fa89); /* requirePre */ 
c_0xec6f88dc(0x986ae575af1e7bb56a2524517053980daec53199468daa6539b540452994f2eb); /* statement */ 
require(address(votingContract) != address(0), "adapter not found");c_0xec6f88dc(0x9c3e0bcd73e5fcc2d63453fab90751a3ce9e031cec5d869d3f8e5e345eb67ae4); /* requirePost */ 


c_0xec6f88dc(0xbe710df7d8d6da2f4fdc2f2116ce8e6bd4eaf184627c29f38a9d2a6c9a849202); /* line */ 
        c_0xec6f88dc(0xe35fc4f9db36db08245ed0a9eaf0d85c49b879c202884a576aaec2c463c4c307); /* requirePre */ 
c_0xec6f88dc(0xa4b6e52df29e3eabaf7fc60933b4dad51d4912d8dc28c9197e4d43f0eb5d2576); /* statement */ 
require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal needs to pass"
        );c_0xec6f88dc(0xd3d537a50940a7e2a004ec2144635e703e15177e7d38e0fff5c8334f3f6d73ae); /* requirePost */ 

c_0xec6f88dc(0x870285c75f161a2bd756a6e90ec37d817c0aec04998180c71d6ab88070f1eae7); /* line */ 
        c_0xec6f88dc(0xdf3b2ecedaba73a7d0ea320b92ae88e65bc534b57bd47379de33ea55d6622fa8); /* statement */ 
dao.processProposal(proposalId);
c_0xec6f88dc(0xf22fed2f9614f005cff4255770c48d95716360b44d507b7597ae6641e3d8b9cd); /* line */ 
        c_0xec6f88dc(0xbeb6878a52187ab6afe5ed1f8e143ab76daf3c3250980ffe5cd5e3a254936f39); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );

c_0xec6f88dc(0xfb60289d31fcced618665297a80e491f68de71a6c9dbe8d29d2650a3c8303336); /* line */ 
        c_0xec6f88dc(0xa1cf9d6cd6cdb9e8dc659cd99ce876e42c29f10ac912fe1bee390906934823fd); /* statement */ 
bank.subtractFromBalance(
            dao,
            DaoHelper.GUILD,
            details.token,
            details.amount
        );
c_0xec6f88dc(0x2ccbce0ebf4fb78090640d5278d2aa41f221a9e792e79e334ba147131a46c442); /* line */ 
        c_0xec6f88dc(0xf6c315cefaa71fceff08fcc802dc20c7d40aaf0056145029469499485bba046e); /* statement */ 
bank.addToBalance(
            dao,
            details.applicant,
            details.token,
            details.amount
        );
    }
}
