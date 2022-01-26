pragma solidity ^0.8.0;
function c_0x020c0bf8(bytes32 c__0x020c0bf8) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/bank/Bank.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../interfaces/IVoting.sol";
import "../../helpers/DaoHelper.sol";
import "../modifiers/Reimbursable.sol";
import "../../helpers/GovernanceHelper.sol";

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

contract VotingContract is IVoting, MemberGuard, AdapterGuard, Reimbursable {
function c_0x49a46ecb(bytes32 c__0x49a46ecb) public pure {}

    struct Voting {
        uint256 nbYes;
        uint256 nbNo;
        uint256 startingTime;
        uint256 blockNumber;
        mapping(address => uint256) votes;
    }

    bytes32 constant VotingPeriod = keccak256("voting.votingPeriod");
    bytes32 constant GracePeriod = keccak256("voting.gracePeriod");

    mapping(address => mapping(bytes32 => Voting)) public votes;

    string public constant ADAPTER_NAME = "VotingContract";

    /**
     * @notice returns the adapter name. Useful to identify wich voting adapter is actually configurated in the DAO.
     */
    function getAdapterName() external pure override returns (string memory) {c_0x49a46ecb(0x0fecd8f86a8b8ee92b3bfdfc3fd4b57522bf141759cde96382a2783ce3acafdf); /* function */ 

c_0x49a46ecb(0x26ce4425768de8b449a4885aedeee0e964d5f101a01088cfb4c2fbafff080e8e); /* line */ 
        c_0x49a46ecb(0x20ad436a7ce063e1f1af87c4c9981399b88eb1cf4d97665ae5549a91e4fb0a8a); /* statement */ 
return ADAPTER_NAME;
    }

    /**
     * @notice Configures the DAO with the Voting and Gracing periods.
     * @param votingPeriod The voting period in seconds.
     * @param gracePeriod The grace period in seconds.
     */
    function configureDao(
        DaoRegistry dao,
        uint256 votingPeriod,
        uint256 gracePeriod
    ) external onlyAdapter(dao) {c_0x49a46ecb(0xc15ee8be78832acec444ed4e89aa66280a61dd4cf402b57717daae2dee51d2f5); /* function */ 

c_0x49a46ecb(0x70de42c398c087f7e66ac429319589753a98200cb27de6ff8d3601639488c9cc); /* line */ 
        c_0x49a46ecb(0x54688888f385ad7e570955aa8802c22e626d81d51f2796fd0fb6a482be855b50); /* statement */ 
dao.setConfiguration(VotingPeriod, votingPeriod);
c_0x49a46ecb(0x2f415f0109b0c0f46d4982c52cb31e3d3755321bca6d4f74d6e59c30bfd9a0dc); /* line */ 
        c_0x49a46ecb(0x4a764033fc208f90c6f21b65cfd36f8cba4899ad93c32fe3c281679afc609514); /* statement */ 
dao.setConfiguration(GracePeriod, gracePeriod);
    }

    /**
     * @notice Stats a new voting proposal considering the block time and number.
     * @notice This function is called from an Adapter to compute the voting starting period for a proposal.
     * @param proposalId The proposal id that is being started.
     */
    function startNewVotingForProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes calldata
    ) external override onlyAdapter(dao) {c_0x49a46ecb(0xc36d69d70df174b2b93651f2715ea8a5332b0913c8b8051c693db8e429c2377d); /* function */ 

c_0x49a46ecb(0x828c1f5b9841975ec2858a59b9f19a7ac6747d0d39d2d1d89b49a728294cb8fc); /* line */ 
        c_0x49a46ecb(0x6a367d22d99475f0b16866ceccf984b2d536eae5c535d38802370b065f7c30f3); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];
c_0x49a46ecb(0x11eaee8d40d8ccf602a11a72031992948cde11678d50fb21ffaa56730332465f); /* line */ 
        c_0x49a46ecb(0x3f6f9ca7eb42d091cf4de55990dfbfe427013cf2a988eb1ba4f5fb480ea35878); /* statement */ 
vote.startingTime = block.timestamp;
c_0x49a46ecb(0x61dadc8b174bec1bd455e5ea65c4cedefd1aad27d7788392b0705c389856a792); /* line */ 
        c_0x49a46ecb(0x617d952fb896c0c5b5da3c1fd8dfaffabac5c282f108c0a0580b9d7202b51b97); /* statement */ 
vote.blockNumber = block.number;
    }

    /**
     * @notice Returns the sender address.
     * @notice This funcion is required by the IVoting, usually offchain voting have different rules to identify the sender, but it is not the case here, so we just return the fallback argument: sender.
     * @param sender The fallback sender address that should be return in case no other is found.
     */
    function getSenderAddress(
        DaoRegistry,
        address,
        bytes memory,
        address sender
    ) external pure override returns (address) {c_0x49a46ecb(0xb32bd21d2fe1ffe83c1cfb2a9ac84785cf6b7f40f36c3124e429afda26ae4316); /* function */ 

c_0x49a46ecb(0x433132edce52b89a5a6d5358da67e1b25b4cbee104924e269da68c214fcb3114); /* line */ 
        c_0x49a46ecb(0x47b8e8ba90746e2eeb67ce90381eb6ba3ff4153e319b4ee680d70848fbfe3eaf); /* statement */ 
return sender;
    }

    /**
     * @notice Submits a vote to the DAO Registry.
     * @notice Vote has to be submitted after the starting time defined in startNewVotingForProposal.
     * @notice The vote needs to be submitted within the voting period.
     * @notice A member can not vote twice or more.
     * @param dao The DAO address.
     * @param proposalId The proposal needs to be sponsored, and not processed.
     * @param voteValue Only Yes (1) and No (2) votes are allowed.
     */
    // The function is protected against reentrancy with the reimbursable modifier
    //slither-disable-next-line reentrancy-no-eth,reentrancy-benign
    function submitVote(
        DaoRegistry dao,
        bytes32 proposalId,
        uint256 voteValue
    ) external onlyMember(dao) reimbursable(dao) {c_0x49a46ecb(0xafd7ece54d5e4033a404f8eabb5f2dbec021080cd251895e0ab81ead22b0c35f); /* function */ 

c_0x49a46ecb(0xb31fd48509e6631fc198255fcc53a75bb34600ccb25fd288b3ad27f6e9222679); /* line */ 
        c_0x49a46ecb(0x9ce03fe56e8de29cc16e934e411351f9852a3a37a191b4ca6bb9d4c0bb321e88); /* requirePre */ 
c_0x49a46ecb(0x8a6c231814597078fc16e00ea24914cda35f5300c4431eeea3514e97f4c63b7e); /* statement */ 
require(
            dao.getProposalFlag(proposalId, DaoRegistry.ProposalFlag.SPONSORED),
            "the proposal has not been sponsored yet"
        );c_0x49a46ecb(0x63ba9bc29065ce08f07d2c57245b043a5f5c714c9d690635bbcc813abbfdc13e); /* requirePost */ 


c_0x49a46ecb(0xd1340c59a0e1aa23d74af3709562e0b7c08795ab20b92104c8fdedfcc8acd317); /* line */ 
        c_0x49a46ecb(0xcf30a69fd428de646b34c5c54d3b80a84bc9f631a4fd687a9dc0de2b9abe0023); /* requirePre */ 
c_0x49a46ecb(0x5a18986e83c96edf86c2c4da773843700c30b8bf3a9f72965304b1164540692d); /* statement */ 
require(
            !dao.getProposalFlag(
                proposalId,
                DaoRegistry.ProposalFlag.PROCESSED
            ),
            "the proposal has already been processed"
        );c_0x49a46ecb(0x4572d75f5803e6815b427dcc10ed9ceda3652b9ff968a29fa7a14cb1e07fb56d); /* requirePost */ 


c_0x49a46ecb(0x876f157a088dc16ac0128f75c1eeec9714c12dc66ce1e138390c55bd67861cb4); /* line */ 
        c_0x49a46ecb(0x28ca8f631b6f6e50def387398ad74101304aec9ffb80353672e9904508f15f36); /* requirePre */ 
c_0x49a46ecb(0x893a7b2ec7059ab0c63bfe16dc92836faaa9c974ddcf1fc34f4574d9b840aa07); /* statement */ 
require(
            voteValue < 3 && voteValue > 0,
            "only yes (1) and no (2) are possible values"
        );c_0x49a46ecb(0xc3a0bffb0680acc85b4a07b3a4deedf602588c341ddbbf73db56031b638baee7); /* requirePost */ 


c_0x49a46ecb(0xab8944638e8eb61ead982411cc3c90b7d785823815e417e4e462a2a250698399); /* line */ 
        c_0x49a46ecb(0x69fc572821fbc97ff1e5c44260af30e5b9e2b13eceb05fed3f0924e83939f08a); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];
        // slither-disable-next-line timestamp
c_0x49a46ecb(0x2ba11f52e030572586b5244209939c78009f86c9f33ba94b709d34fce0eee454); /* line */ 
        c_0x49a46ecb(0xbe4f1a8582163d5e1e2686cf2d0ba114ef081261810e8b96e7454b728b350781); /* requirePre */ 
c_0x49a46ecb(0x9ec2b605ddc0a03e4aeb82bcd4530f9a16d358d826271f91bc380759f1c77c1a); /* statement */ 
require(
            vote.startingTime > 0,
            "this proposalId has no vote going on at the moment"
        );c_0x49a46ecb(0xf27cde40955acf92b7956e12f70006a4ed3ddefa605d56e1fad9c78ce6493b94); /* requirePost */ 

        // slither-disable-next-line timestamp
c_0x49a46ecb(0xc857ebfbb2f096783607e1daae7782a7eac9ebb6ab9f5eeed48f3c4e6e7e5774); /* line */ 
        c_0x49a46ecb(0xe264ed219252ec4c09ec4d65b803bba94da30756f0d1bfb25fb4ad4348824491); /* requirePre */ 
c_0x49a46ecb(0x35c91235c646afcce4b4af10b3e80738b1bb7e29dd3500a058a935d2bab2a160); /* statement */ 
require(
            block.timestamp <
                vote.startingTime + dao.getConfiguration(VotingPeriod),
            "vote has already ended"
        );c_0x49a46ecb(0x4a65fc729586d5d00fdce1848241afa394131a7fad86d17fe0241dc627ba85f2); /* requirePost */ 


c_0x49a46ecb(0x95d2de66ef0870a7d3a9a3f88f3268aebbb42f05f0063fd4dc5e88940851f994); /* line */ 
        c_0x49a46ecb(0x3877ec8a75e85652977717143a26caf2e73f04c42154115170d36b72e57bb00c); /* statement */ 
address memberAddr = DaoHelper.msgSender(dao, msg.sender);

c_0x49a46ecb(0x6618714c13cc9ddf83afd4705b46734dfdf426da3ff905837e392b5152ac9277); /* line */ 
        c_0x49a46ecb(0x6e5363bf7daf1261cf2d61d1611802c514b9a59e9992c2bb1412fa7d65462961); /* requirePre */ 
c_0x49a46ecb(0xf313fb552d2284c43d1e3c3a318053a0d8117e1bc261f4bf7538fe666d84d61e); /* statement */ 
require(vote.votes[memberAddr] == 0, "member has already voted");c_0x49a46ecb(0xf4e2edbc60836f281c23b0b55fe57e99dea7c564525e1992c497fc2baa1afc46); /* requirePost */ 

c_0x49a46ecb(0xda0f2c6afbff54ddb4e4b6bf6e4e575c80d7262f131f48b3a11aaa3763a88782); /* line */ 
        c_0x49a46ecb(0x2a3d9632af695be8adbe744386da9d9e61b024e21902c6032f30bf1d878a1a7a); /* statement */ 
uint256 votingWeight = GovernanceHelper.getVotingWeight(
            dao,
            memberAddr,
            proposalId,
            vote.blockNumber
        );
c_0x49a46ecb(0xfa56eeb96853a76d36dba07c7278417d36cfc12d19303e5e9b79ac8d6256cf41); /* line */ 
        c_0x49a46ecb(0xf1c5dde0e96f0fcbcf24d9920f39a566ac28b6c8216e4962ec2951d17bbb6b06); /* statement */ 
if (votingWeight == 0) {c_0x49a46ecb(0x63138edfa012d5ed1ec58e365b0bfd62e15dbff1c02b5494ee9f0bb7e44f8f2e); /* statement */ 
c_0x49a46ecb(0xddfd7ea57a535801690dbe45f99d8c4e6ccade996be06074f0b3c9e49992443e); /* branch */ 
revert("vote not allowed");}else { c_0x49a46ecb(0xce71bea2575099312e945a5bb39ea5f67062af7051eeca3fb7b13818e2fad76b); /* branch */ 
}

c_0x49a46ecb(0xddb66e608f6b8b480e1be6372848219eee808e486a90dbf3c5d851acf07c1067); /* line */ 
        c_0x49a46ecb(0xe82ec21d23c250b4be33be8e7e58e4cd197f747c2e8817bd5224969994942586); /* statement */ 
vote.votes[memberAddr] = voteValue;

c_0x49a46ecb(0x0cba52f58a716b5b1881766e00da939cf825c2050ae818db04a3a1bc7b43e985); /* line */ 
        c_0x49a46ecb(0x9709e2504c3db546139c19cb1998d8af011820cbb3516524840127ee3d0357e2); /* statement */ 
if (voteValue == 1) {c_0x49a46ecb(0x43bc2bdddd931951541dc085056510db5ecaefd4f2355ea9635bcb22b9b96c51); /* branch */ 

c_0x49a46ecb(0x095070ac6a2ac9aa5e043285d9251930e3ffec45759fcd93a6b37b7c94cfb49b); /* line */ 
            c_0x49a46ecb(0x6b0af87f8c58c5cd6f994049b342a715a03af7d200c40355886a830169c9eff8); /* statement */ 
vote.nbYes = vote.nbYes + votingWeight;
        } else {c_0x49a46ecb(0x88505d595a346a55759b94b49ac4e1eed27fdd74b107de51c6edd3dea11f04f7); /* statement */ 
c_0x49a46ecb(0x7bcde57042bf71414001c50af2abef81c85881edc5d22a382d3b64d7dbe07b72); /* branch */ 
if (voteValue == 2) {c_0x49a46ecb(0x0808b2490a95fad20d79694a304a2c80e3a159d9781a065c49898de6a205da5c); /* branch */ 

c_0x49a46ecb(0xc0d8fff32d52fb68682034048bf288fd7b3e2d2eaadedd263425919f4863014d); /* line */ 
            c_0x49a46ecb(0x865e2f3284515229ae6585d75a700187e69d484b684cdd9d0755b91060056ff3); /* statement */ 
vote.nbNo = vote.nbNo + votingWeight;
        }else { c_0x49a46ecb(0x2f94667113f098e3fe304aa4145247d9590c20e44433a9f1fb881b64acd3b801); /* branch */ 
}}
    }

    /**
     * @notice Computes the voting result based on a proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal that needs to have the votes computed.
     * @return state
     * The possible results are:
     * 0: has not started
     * 1: tie
     * 2: pass
     * 3: not pass
     * 4: in progress
     */
    function voteResult(DaoRegistry dao, bytes32 proposalId)
        external
        view
        override
        returns (VotingState state)
    {c_0x49a46ecb(0x7caf098df1f3bca6c9c144fc4679c0b33bb4a68eca644e6f6cad87a141fe1548); /* function */ 

c_0x49a46ecb(0xbf398aecb229f22b731bd1f2970116921881a5f13d3a9743fbf1362affcf78f3); /* line */ 
        c_0x49a46ecb(0x5f2350c12ea3bc7b7120c5c4d8136e67e88886474170fc494426f8435c576e65); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];
c_0x49a46ecb(0x5b23672586e5d533d972751d97acaf9fbeb109727fa468c7663145435f4a09f9); /* line */ 
        c_0x49a46ecb(0xacb41f67e9800e442b2c9a16ef6a60aaa8946ebae86ebc17d41c4608dc3d7e8f); /* statement */ 
if (vote.startingTime == 0) {c_0x49a46ecb(0x5d5e9ffa3cfd8d7f2443b57e672e3b1726fbe67aeb5ff42e0fe6867cf4a90207); /* branch */ 

c_0x49a46ecb(0x975b0596569eeccc82e17a498a8ba41bedc4cb9629e2eaf12da71048a8d6c948); /* line */ 
            c_0x49a46ecb(0xa54d6476d16a610886362407dfb7becafa3498ed69e244db8b4626820e790496); /* statement */ 
return VotingState.NOT_STARTED;
        }else { c_0x49a46ecb(0x622f4f02834ac970a81af95c70b1c3476bb3831dcae36c42bcefe179427becd1); /* branch */ 
}

c_0x49a46ecb(0xe1f06be8ae682ea9a19af682d252800224f34c96b3ab12e2b4025c71cb51d609); /* line */ 
        c_0x49a46ecb(0x67aab81e0832f92c77eabe0766a4b697e0249c5b7daaad0a11b8ae226e104f55); /* statement */ 
if (
            // slither-disable-next-line timestamp
            block.timestamp <
            vote.startingTime + dao.getConfiguration(VotingPeriod)
        ) {c_0x49a46ecb(0xa7c2904617bc7e8a55807fc2aaffdce87db9a3627d4afdf9f06808fc61d4eadb); /* branch */ 

c_0x49a46ecb(0xa885c281c51aff6af028cbfa87d2b8ca3f8ea2349011f2c1632d5c34d786df87); /* line */ 
            c_0x49a46ecb(0x377ee7aca1d1ba8f8ea6b3e50fede8e1cd076f0562e5494b5711c4c1cbcb11a5); /* statement */ 
return VotingState.IN_PROGRESS;
        }else { c_0x49a46ecb(0x325f626a79c6f5bfc4eed14437bc4ff6e18a99b4dfa9bc33d7dfda08f2964fd1); /* branch */ 
}

c_0x49a46ecb(0x2a0ab907d1b1856b2629f0363054a1de5c9eae55f768a1837edf1f515fb00f54); /* line */ 
        c_0x49a46ecb(0x535a85b556366d25d41c885f1a5777be7b2fc020841939a52b46aac1df3cbc60); /* statement */ 
if (
            // slither-disable-next-line timestamp
            block.timestamp <
            vote.startingTime +
                dao.getConfiguration(VotingPeriod) +
                dao.getConfiguration(GracePeriod)
        ) {c_0x49a46ecb(0x240454bbb88e0f0622529166ebd1b986e33de933c5eb8f4007e6784085c87679); /* branch */ 

c_0x49a46ecb(0x049dedee6e34363e801d60b2236d72c4f04f80c81f2a0eb245ea7a3d86650ea5); /* line */ 
            c_0x49a46ecb(0x8aa44ca4a13091d9028a14b8fdabb5293c70e94239ec75376565216609a821f1); /* statement */ 
return VotingState.GRACE_PERIOD;
        }else { c_0x49a46ecb(0x9f62e94c0c57b5c3a64e32292e8a5b37851b8fad7d0af02a6485aee4d00a4b78); /* branch */ 
}

c_0x49a46ecb(0x853f79b3776e83e012718d1c4a25a5df4117befa56a279d09ec3cb639d735e70); /* line */ 
        c_0x49a46ecb(0x288177c6dd26ce172444a921c036f5f6a58af9270d27ec151ed6adfcb071a4a8); /* statement */ 
if (vote.nbYes > vote.nbNo) {c_0x49a46ecb(0x3995b4ddc5aa00a581ef32324b4bd9122034413edc1be25fd26a626b9a06421a); /* branch */ 

c_0x49a46ecb(0x48fdfcdbf79a2dd855238cd1da068f16e11adcbf4d5c05c44b08101c929d9cbb); /* line */ 
            c_0x49a46ecb(0x2b429a1cfb4245d1f605a2e71651c9593e07f2af8edb5a30fa745334429cc96b); /* statement */ 
return VotingState.PASS;
        } else {c_0x49a46ecb(0x6a19d85805e97e6e43da71ed8cdfcb63e23084976630107f77ab8f785848aebc); /* statement */ 
c_0x49a46ecb(0xa76122c9986c40e0a4a43720b7dc1a260a221096f2e86918a3f8d9594044dd5a); /* branch */ 
if (vote.nbYes < vote.nbNo) {c_0x49a46ecb(0x72f820e92f6cd85b50cb3810842b707df542f3b7a5e5c25b0dc2cc033e658db9); /* branch */ 

c_0x49a46ecb(0x5db739843d500a9ef0ca03345042c69c93c3abe252a4fcb05c424c9a208c298f); /* line */ 
            c_0x49a46ecb(0xa32fce773c356412e14f12c8b7f466ea719e49ad5000f3f56b10b53a3f0a1b15); /* statement */ 
return VotingState.NOT_PASS;
        } else {c_0x49a46ecb(0x3c1dc24a0229da88ca746c13ff430595b9167bb36c4f9f703825afc89775cba6); /* branch */ 

c_0x49a46ecb(0x1e0cb64810ee461b480c0f179679634e0d0291b7984b699d8051aa8aa92f2093); /* line */ 
            c_0x49a46ecb(0xa5ba4bb460a4b7037e5feec2db68e8098553bd8c09814e7b00947db0b0e39550); /* statement */ 
return VotingState.TIE;
        }}
    }
}
