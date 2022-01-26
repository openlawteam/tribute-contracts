pragma solidity ^0.8.0;
function c_0xfbe47e8b(bytes32 c__0xfbe47e8b) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";
import "./interfaces/IGuildKick.sol";
import "../helpers/GuildKickHelper.sol";
import "../adapters/interfaces/IVoting.sol";
import "../helpers/FairShareHelper.sol";
import "../extensions/bank/Bank.sol";

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

contract GuildKickContract is IGuildKick, AdapterGuard, Reimbursable {
function c_0x51c99b7b(bytes32 c__0x51c99b7b) public pure {}

    // State of the guild kick proposal
    struct GuildKick {
        // The address of the member to kick out of the DAO.
        address memberToKick;
    }

    // Keeps track of all the kicks executed per DAO.
    mapping(address => mapping(bytes32 => GuildKick)) public kicks;

    /**
     * @notice Creates a guild kick proposal, opens it for voting, and sponsors it.
     * @dev A member can not kick himself.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only members that have units or loot can be kicked out.
     * @dev Proposal ids can not be reused.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     * @param memberToKick The member address that should be kicked out of the DAO.
     * @param data Additional information related to the kick proposal.
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address memberToKick,
        bytes calldata data
    ) external override reimbursable(dao) {c_0x51c99b7b(0xab452b383792eaaee2b40637612df2f94405486d34aef850cb4332c74835be72); /* function */ 

c_0x51c99b7b(0xd1881485fa72ef9945d3d9bd5a44676f7af936530d2103c472351c7d27ff4571); /* line */ 
        c_0x51c99b7b(0xc99b820dceb22ca6ab819fcdfbb7f0b55bb3409909ed51e76a5e14992289b949); /* statement */ 
IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
c_0x51c99b7b(0xa09f58334a6177f7704365915e71176711abd8109e5cae1efcb4f3cf2c4e0226); /* line */ 
        c_0x51c99b7b(0x024c730ae50d7a9fa8f0f8957687ca5e5da978dd191b744b2f2226bd2ff52a34); /* statement */ 
address submittedBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );
        // Checks if the sender address is not the same as the member to kick to prevent auto kick.
c_0x51c99b7b(0x8a0c55bdb2bb3f3b05bdf814789a058509f5faebdcb23a9f863ccc7884f24cbe); /* line */ 
        c_0x51c99b7b(0xb7dd3924d229f6193084712695606c4a30b134c2fce94363b79822fabe3260f5); /* requirePre */ 
c_0x51c99b7b(0x2b7ac6ef9cfc8a3004c07f80186e9de3726ada0adb76c28c1fd7e5846f0372a0); /* statement */ 
require(submittedBy != memberToKick, "use ragequit");c_0x51c99b7b(0x2f2dc4e88bdfce171081564399fd6b669b9d158c003052e7833f9825558efbc8); /* requirePost */ 


        // Creates a guild kick proposal.
c_0x51c99b7b(0x4259ac534b9cc59decc40963552f5bbd082837dd327107d1e6a9e4c4db64c88f); /* line */ 
        c_0x51c99b7b(0x8207b70af70820a829c37ce3d867a4774a8a6cbf4befa068441df744fa80ba90); /* statement */ 
dao.submitProposal(proposalId);

c_0x51c99b7b(0x920a82924cc52ae26d5e9137c9ea9ec78358ba0316b305d235a7590779431efc); /* line */ 
        c_0x51c99b7b(0x2dfcc37bd374f6f8d96ac449bea590f96f4b88131f95c7dee0f4063de1ca4af3); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
        // Gets the number of units of the member
c_0x51c99b7b(0xde19046294a31b15a7f6df020bfcce85493265ecf41032d7924416f1237bbe7e); /* line */ 
        c_0x51c99b7b(0x9c54c527e644b660bed070223dc08d0e14edab6a4995b9f4dd88198202a42ced); /* statement */ 
uint256 unitsToBurn = bank.balanceOf(memberToKick, DaoHelper.UNITS);

        // Gets the number of loot of the member
c_0x51c99b7b(0x513e7e5d6526b2f9c14eaf3b44f36637c174f13648a72761de5b47a3a9d7ed0a); /* line */ 
        c_0x51c99b7b(0x3f7ebe67e61d4f8e98c50e41c9c63bbdfbc8b8604749ac62f863945ee25a0c7e); /* statement */ 
uint256 lootToBurn = bank.balanceOf(memberToKick, DaoHelper.LOOT);

        // Checks if the member has enough units to be converted to loot.
        // Overflow is not possible because max value for each var is 2^64
        // See bank._createNewAmountCheckpoint function
c_0x51c99b7b(0xbd825a63bbd3972515aeccab2ac20b6f9bcc62d073db424a60a92feef5e80c06); /* line */ 
        c_0x51c99b7b(0x29316eb7d3b3fdc9c6920480e2da150458ac47f9a32acc89c9c235b0b863d09e); /* requirePre */ 
c_0x51c99b7b(0xeca1af31a41037e01d7fe164cd6baa68d5ddfb6d5fd83ef9c86ea46b79512068); /* statement */ 
require(unitsToBurn + lootToBurn > 0, "no units or loot");c_0x51c99b7b(0x54190f4b0ba90e3c48a7158e3c78da0770c9ad9bb9aac4d207bfa9aef9b5ae96); /* requirePost */ 


        // Saves the state of the guild kick proposal.
c_0x51c99b7b(0x352e27f787fd78f7760aa16520e4254b8005f5fd380fe856461ebff630762666); /* line */ 
        c_0x51c99b7b(0x744d64c76a30e6e013db5fec62e1571a50142c99b0818fae6ccb528b3ff6e066); /* statement */ 
kicks[address(dao)][proposalId] = GuildKick(memberToKick);

        // Starts the voting process for the guild kick proposal.
c_0x51c99b7b(0x26915d8e2fffe1763988062b54d1a00fba36c3e57a118449c979fc8d59000ddb); /* line */ 
        c_0x51c99b7b(0xf6192f589bb2923838c007f745957b17d9a5ff1e7a130e3fd1f93d9c36193c31); /* statement */ 
votingContract.startNewVotingForProposal(dao, proposalId, data);

c_0x51c99b7b(0x27a80591dba622947b9e70135fc45e41894bc6f6696b2ebd37e6c9717ab711e6); /* line */ 
        c_0x51c99b7b(0x09bf9c881a456661ec15882c789c731e1be640ceddb11331308b1a06ea7c49e2); /* statement */ 
GuildKickHelper.lockMemberTokens(
            dao,
            kicks[address(dao)][proposalId].memberToKick
        );

        // Sponsors the guild kick proposal.
c_0x51c99b7b(0x2a310111cbac689d1db9e3de4ebe90295e60d539fffd14f301488649f51dbbeb); /* line */ 
        c_0x51c99b7b(0xb3410d13cb0d4b46205366d9a677177c421a11f78aec33459a2f2cbcd1396d5f); /* statement */ 
dao.sponsorProposal(proposalId, submittedBy, address(votingContract));
    }

    /**
     * @notice Process the guild kick proposal
     * @dev Only active members can be kicked out.
     * @param dao The dao address.
     * @param proposalId The guild kick proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reimbursable(dao)
    {c_0x51c99b7b(0x08a478a6a98a1abcbd897830053b05b8b18652ca2ba5c4ccc93ace320d344777); /* function */ 

c_0x51c99b7b(0xf61439da30c8850b531bf0112eaba33a8d32e1128a47410e36163971874f3d17); /* line */ 
        c_0x51c99b7b(0x357d033e77b0e6cdc4c1fd3c71ef386a861be3fbc3acd1c15b58f2b40c464df5); /* statement */ 
dao.processProposal(proposalId);

        // Checks if the proposal has passed.
c_0x51c99b7b(0xf0d1e01b5f6184e57db18c5dadbcc6cd68a71607a44cb1329529d5199f3fecfe); /* line */ 
        c_0x51c99b7b(0x62841ae7b41b9bc74462a332c5499488e9cfdec766183e4b454fcd0669716391); /* statement */ 
IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
c_0x51c99b7b(0x22c7c6e9af204c75e09840cab6e03acfaae8397b4bfbd8a913a40948b3a77bab); /* line */ 
        c_0x51c99b7b(0xa47cf30a771158bee1fb460c45086e03e5bb6c9fbc009e8dd7c0e1e396953ba0); /* requirePre */ 
c_0x51c99b7b(0xbebedcf8bb5b4fa5e76c36ab4715356ee3969756dffdadf12561f363ce5c432c); /* statement */ 
require(address(votingContract) != address(0), "adapter not found");c_0x51c99b7b(0x7a01b83e20c542dbf2f04ca2ffbbe54f153a0eb16ede7e7ce5f5e6dd76d62a11); /* requirePost */ 

c_0x51c99b7b(0x8cc51c0be24366a6779110a4d25d60e31379a7c801e160105952926b54d047cb); /* line */ 
        c_0x51c99b7b(0x389951f9c527cfdc852c870f960de280cb85b95b0771068b0b0c3d68abaf3500); /* statement */ 
IVoting.VotingState votingState = votingContract.voteResult(
            dao,
            proposalId
        );
c_0x51c99b7b(0x60c25cc0f6999acc375f47e2543ef001cab25e6207ff1614462e28ce1a4dea4c); /* line */ 
        c_0x51c99b7b(0xc75a1a7f7f4996163a393f4474a6ce564c3f75667c67c1df75281cadeab17c20); /* statement */ 
if (votingState == IVoting.VotingState.PASS) {c_0x51c99b7b(0xbed3b20cbe0205e701ad6e56111be973a05923e2f3e4e3d70cafc07d2579c23f); /* branch */ 

c_0x51c99b7b(0xf3f43d006ae80eb5cc68354720d5a9653e08adc9b50f7ebcbd2159484babd734); /* line */ 
            c_0x51c99b7b(0x427b948b79ea26927585dfe6b5cd45494ae86df703b6c71bcefb5b29ceefc523); /* statement */ 
GuildKickHelper.rageKick(
                dao,
                kicks[address(dao)][proposalId].memberToKick
            );
        } else {c_0x51c99b7b(0xeda1d7636033210f65450cdbab3ba6131105f63e8749f0e3f957a0137f447263); /* statement */ 
c_0x51c99b7b(0x24dc3fae746446f21542aa9a92ba00545d3ab0a00a2f90ac42b81efeb6879cc2); /* branch */ 
if (
            votingState == IVoting.VotingState.NOT_PASS ||
            votingState == IVoting.VotingState.TIE
        ) {c_0x51c99b7b(0x34be80be2be18dcc5f6cba6ff27c04b4a681b14d7964e7283e3ecf33b653f57c); /* branch */ 

c_0x51c99b7b(0x9a43e0959ccd55331bf1189bb9dbc4eab8fd33684a8531975eda30e1247dc7a3); /* line */ 
            c_0x51c99b7b(0x4f93b8cb12303f6560dd367c885c123b6847b7557d00244b312abb5a87958cbe); /* statement */ 
GuildKickHelper.unlockMemberTokens(
                dao,
                kicks[address(dao)][proposalId].memberToKick
            );
        } else {c_0x51c99b7b(0x8400a4dc9b10e0cc2dbb38ed60ed6628d8a3485e0c1a60d9d91265c808bd0bcf); /* branch */ 

c_0x51c99b7b(0x5328812448d121304d766b5a0e78f6cc2b0868545015dcdaa8ebf7c5ff8afaca); /* line */ 
            c_0x51c99b7b(0x4a4de0e4d7799d21c8298cdaffc5d36d9585e71f6539db04a47ae5285d05b818); /* statement */ 
revert("voting is still in progress");
        }}
    }
}
