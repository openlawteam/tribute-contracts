pragma solidity ^0.8.0;
function c_0xbf8c9ed2(bytes32 c__0xbf8c9ed2) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/bank/Bank.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../modifiers/Reimbursable.sol";
import "../interfaces/IVoting.sol";
import "./Voting.sol";
import "./KickBadReporterAdapter.sol";
import "./OffchainVotingHash.sol";
import "./SnapshotProposalContract.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "../../helpers/DaoHelper.sol";
import "../../helpers/GuildKickHelper.sol";
import "../../helpers/OffchainVotingHelper.sol";

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

contract OffchainVotingContract is
    IVoting,
    MemberGuard,
    AdapterGuard,
    Ownable,
    Reimbursable
{
function c_0xd3463488(bytes32 c__0xd3463488) public pure {}

    struct ProposalChallenge {
        address reporter;
        uint256 units;
    }

    struct Voting {
        uint256 snapshot;
        address reporter;
        bytes32 resultRoot;
        uint256 nbYes;
        uint256 nbNo;
        uint64 startingTime;
        uint64 gracePeriodStartingTime;
        bool isChallenged;
        bool forceFailed;
        uint256 nbMembers;
        uint256 stepRequested;
        uint256 fallbackVotesCount;
        mapping(address => bool) fallbackVotes;
    }

    struct VotingDetails {
        uint256 snapshot;
        address reporter;
        bytes32 resultRoot;
        uint256 nbYes;
        uint256 nbNo;
        uint256 startingTime;
        uint256 gracePeriodStartingTime;
        bool isChallenged;
        uint256 stepRequested;
        bool forceFailed;
        uint256 fallbackVotesCount;
    }

    event VoteResultSubmitted(
        address daoAddress,
        bytes32 proposalId,
        uint256 nbNo,
        uint256 nbYes,
        bytes32 resultRoot,
        address memberAddr
    );
    event ResultChallenged(
        address daoAddress,
        bytes32 proposalId,
        bytes32 resultRoot
    );

    bytes32 public constant VotingPeriod =
        keccak256("offchainvoting.votingPeriod");
    bytes32 public constant GracePeriod =
        keccak256("offchainvoting.gracePeriod");
    bytes32 public constant FallbackThreshold =
        keccak256("offchainvoting.fallbackThreshold");

    SnapshotProposalContract private _snapshotContract;
    OffchainVotingHashContract public ovHash;
    OffchainVotingHelperContract private _ovHelper;
    KickBadReporterAdapter private _handleBadReporterAdapter;

    string private constant ADAPTER_NAME = "OffchainVotingContract";

    mapping(bytes32 => mapping(uint256 => uint256)) private retrievedStepsFlags;

    modifier onlyBadReporterAdapter() {c_0xd3463488(0x9ade58740d91b8c2d842792dabdad66260d1c3e4fbc4df28d5f7a752b85f3122); /* function */ 

c_0xd3463488(0xa112c78ceaf2578a71fb063078825713e917bcc1562a26eaa9ccb218a41b6e2c); /* line */ 
        c_0xd3463488(0xc5c791d8e4a237decd054848308562d818aa030362e934859400c3f93cb63cec); /* requirePre */ 
c_0xd3463488(0x99076e0b13e2307251100e8b53bede32fd1a6b3087c218aaf9b91e2800c935fc); /* statement */ 
require(msg.sender == address(_handleBadReporterAdapter), "only:hbra");c_0xd3463488(0x2c9e453997fcc411ffe237bd6bd9bfb22541a55f0eef73501967a552db3d72d2); /* requirePost */ 

c_0xd3463488(0xff99eb1c4caed7cd313ca2070925c977b6b0a32e08d770370ed7ad6ec3aabf2c); /* line */ 
        _;
    }

    VotingContract private fallbackVoting;

    mapping(address => mapping(bytes32 => ProposalChallenge))
        private challengeProposals;
    mapping(address => mapping(bytes32 => Voting)) private votes;

    constructor(
        VotingContract _c,
        OffchainVotingHashContract _ovhc,
        OffchainVotingHelperContract _ovhelper,
        SnapshotProposalContract _spc,
        KickBadReporterAdapter _hbra,
        address _owner
    ) {c_0xd3463488(0x99e9dbd7fa495a09b230224d8df00b287847c221fe071b321a4125543bf51276); /* function */ 

c_0xd3463488(0x32c80e825d2036fb6a9ee6be6f3418a41dbc8b08752553dff305ad031efcdd6d); /* line */ 
        c_0xd3463488(0xe195e9190f5789a6422d72530a6000a2e86387d636d95bb8423337279c272946); /* requirePre */ 
c_0xd3463488(0x75b647cdac84a479ff0e679e8215a8743a4b3a715b46989d64264a1a8201f336); /* statement */ 
require(address(_c) != address(0x0), "voting contract");c_0xd3463488(0xf01a6bd1254f0612b6a57e121c04d6559aea8295de294796b71966872e6f9f4b); /* requirePost */ 

c_0xd3463488(0xc98f727fed6bd49547a62dc267758e6ec25def156fabf018796bed6b6bed887a); /* line */ 
        c_0xd3463488(0x93703624daa6e5343869e453e6938dce631461c774b1e0aa19cfd364803909b2); /* requirePre */ 
c_0xd3463488(0x290a6a2522ef794f825387023c327734d23100d6d5c4a5d73b8498f6a8bc7ca1); /* statement */ 
require(
            address(_ovhc) != address(0x0),
            "offchain voting hash proposal"
        );c_0xd3463488(0x1fa56b40a1ddfab60e5be610272729d21e403bcedb086e0b2e250e366b98d305); /* requirePost */ 

c_0xd3463488(0x1c525fa9c83ee20d986e4c0887b9d3584427c489b0719f5fadd6f16ca207acfd); /* line */ 
        c_0xd3463488(0xa6623420e016e994ed8625a11e9275967d7ba5fb14952c13515abb1a3fec0c94); /* requirePre */ 
c_0xd3463488(0x5a9c35edf15e99ce17e53e96f8c35421969b1420c9be09a185c2fb214b3f93da); /* statement */ 
require(address(_spc) != address(0x0), "snapshot proposal");c_0xd3463488(0x9f6d7043f82c77f3be0e22a2ab23aa9d9db8751d45a869a443284c2941a0ccd6); /* requirePost */ 

c_0xd3463488(0x9e5e14bcd72acaf8e0c2004bc75986044c37d74df0dc890d4e4537f8fc9e2473); /* line */ 
        c_0xd3463488(0x8c8b1ec75a7e277cc5c704d2fb6740ff00de0c580e6785b2cd4b44ffcab382d4); /* requirePre */ 
c_0xd3463488(0x6cf4d118a68901546e80bc6104f0730fcb0700f589d1d192b0a5f21e1a6fe467); /* statement */ 
require(address(_hbra) != address(0x0), "handle bad reporter");c_0xd3463488(0x949c77daf565669863ff7e4efecd65fe7edb4fc7ec9ea065832ee4e9460c8c16); /* requirePost */ 

c_0xd3463488(0x21231791ee44d7b6f50a96ee6c807563dcffaa40a41e8c88e510abfbe9d8ce82); /* line */ 
        c_0xd3463488(0x6709108976a6bba7a79c01928cf8d0405ae9d214df29590aac67974e2f3b8a2f); /* statement */ 
fallbackVoting = _c;
c_0xd3463488(0xc4df3979afab640e25e949fcc6cdc866350ddf18455bf8c59f3ba0868d8b9404); /* line */ 
        c_0xd3463488(0x07b2a0d565c5cf22042ac95e121ad34fa1ec18426708395a87de62bef7afb5e3); /* statement */ 
ovHash = _ovhc;
c_0xd3463488(0xa475e57445b20c629ac5629c23ea363e33ad32fdbfb1f5ba9a04a420cdd4847d); /* line */ 
        c_0xd3463488(0x11d4533352eedd86de41d012fafbde2fe0a75254793289797f95d28c16461b27); /* statement */ 
_handleBadReporterAdapter = _hbra;
c_0xd3463488(0x4d8f4694e95c1d0f1fe520bb456f77710c3681a372a7e389ed6551699650dad2); /* line */ 
        c_0xd3463488(0x2b598e4b39f00041155469bde6a24c7923b01ffaf88ee3d66e77c006c6fc87f0); /* statement */ 
_snapshotContract = _spc;
c_0xd3463488(0xddc4248aa6138688c13c0d2a3a71718bb0e5e9339f61ddce381cdd23defa0c2a); /* line */ 
        c_0xd3463488(0x6bb8b11ef65f6cfab380ee50ec2aa13818875af6e681f8c998fb0fd1f752ca5e); /* statement */ 
_ovHelper = _ovhelper;
c_0xd3463488(0x8a20de24280915ad2137b02d759aca65e7c7714866bd26697ece8d6f61ee781b); /* line */ 
        c_0xd3463488(0x4cf50dbaa1a7531a6d113e2641f6cd6964b390f651928bb12217854137dc514a); /* statement */ 
Ownable(_owner);
    }

    function configureDao(
        DaoRegistry dao,
        uint256 votingPeriod,
        uint256 gracePeriod,
        uint256 fallbackThreshold
    ) external onlyAdapter(dao) {c_0xd3463488(0xb0cb0a7071e288e9852c6d911538a5787829c140623df73c06bca4be5de437f8); /* function */ 

c_0xd3463488(0x7a57cc15e9802c47d4664f0f877f83f0a50ce43a5cb035bbdc81f4332e541111); /* line */ 
        c_0xd3463488(0x176521f2fbfc0c8c28f8e10a5c48db680ad47c721e7b3bdabda05516318ca4a6); /* statement */ 
dao.setConfiguration(VotingPeriod, votingPeriod);
c_0xd3463488(0xa97c528085f4c81c18f3a15215039a8210901a3d622f98392b220d4fcd4320d1); /* line */ 
        c_0xd3463488(0x7c867e8607345877915e3572cdf17d52402fea625fe7b321c6cbfb081afb90b8); /* statement */ 
dao.setConfiguration(GracePeriod, gracePeriod);
c_0xd3463488(0x8fcf752221e39e67373e05c8a145d294a07ebadf03ed84187efd31fab7ee58b3); /* line */ 
        c_0xd3463488(0x93f10c2eec1be1dfbe016429e9c7c63b81c457cb345f0338c2444846a5cd04c4); /* statement */ 
dao.setConfiguration(FallbackThreshold, fallbackThreshold);
    }

    function getVote(DaoRegistry dao, bytes32 proposalId)
        external
        view
        returns (VotingDetails memory)
    {c_0xd3463488(0x7e6d60311d71b3c120a7ea310413895002834a4c2cc56ccb2a6f69e1f31b0489); /* function */ 

c_0xd3463488(0x35c038b0a98a1adf57222be1f57d9c5e07d4f8c44bbe60012374970867bfb5f3); /* line */ 
        c_0xd3463488(0x85e637d178ce92047f1433067c85dee1ac540785b6cea1704edf412403ec76d5); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];

c_0xd3463488(0x7a7d15a516bc401407331bc781efabd5f03872db41272344aa3c04268a339b22); /* line */ 
        c_0xd3463488(0x16a12c8f3270261adfb7e51ce0a6d43084156c6c7f620c6748db33b59e3bf114); /* statement */ 
return
            VotingDetails(
                vote.snapshot,
                vote.reporter,
                vote.resultRoot,
                vote.nbYes,
                vote.nbNo,
                vote.startingTime,
                vote.gracePeriodStartingTime,
                vote.isChallenged,
                vote.stepRequested,
                vote.forceFailed,
                vote.fallbackVotesCount
            );
    }

    // slither-disable-next-line reentrancy-benign
    function adminFailProposal(DaoRegistry dao, bytes32 proposalId)
        external
        onlyOwner
        reentrancyGuard(dao)
    {c_0xd3463488(0xd5fb5d601bcdc4f15f23c1321c18a475878605243142a3e06d435f1ae87c78e6); /* function */ 

c_0xd3463488(0xeb9134acc32559528714b23962323a5b535200e8b42ba662759fe17ff1c1922a); /* line */ 
        c_0xd3463488(0xaa4b6010d31f058b83126d18add32bb5680e8fdb069dfbf963ae193f92a7c29a); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];
c_0xd3463488(0x9c65cfb5609a995e23fefa7d59aeeb4a37c649d30444776d9576a72e72e2078c); /* line */ 
        c_0xd3463488(0xbbf987fbd6859ce7936c294a2843106dcf055955a0dfd401096c0e6dabbb729e); /* requirePre */ 
c_0xd3463488(0x6c29b5d92dc1efffe2d725c4a19b70d7f504104ddde0cb3ed26ee4ef25d44d2b); /* statement */ 
require(vote.startingTime > 0, "proposal has not started yet");c_0xd3463488(0x8d5843f40b6466322efb3e41b73979eca652399a51e977999584c3317147a838); /* requirePost */ 


c_0xd3463488(0x7e7e29937dfbcee44635821a1bdbc2db6baa020c26911c27c9c38ba060818c8c); /* line */ 
        c_0xd3463488(0xb1714c9fbbadca8c8b3a7bc1c1282b20139453efe31388ca8a55e017d1a97914); /* statement */ 
vote.forceFailed = true;
    }

    function getAdapterName() external pure override returns (string memory) {c_0xd3463488(0xbce8c4ffccbe7236f4643453bbdccbca187e1e4428420cf6f466d476a208030d); /* function */ 

c_0xd3463488(0xf02f66e67a3e6d932a5baa4f34077a7f8949219e45286dd0b4a255e488188333); /* line */ 
        c_0xd3463488(0x983782d32f013348457e3bfb871e62f0ee2490e8752f12d9676f6ae32978ee6f); /* statement */ 
return ADAPTER_NAME;
    }

    function getChallengeDetails(DaoRegistry dao, bytes32 proposalId)
        external
        view
        returns (uint256, address)
    {c_0xd3463488(0x4f0604080151391230ad93f1ba3fb0646fe0e5a9502aa94ac94ef845157056ff); /* function */ 

c_0xd3463488(0x80da2e39f4d1af42eabb6cb4337a9e689f3ae0d6b1b44a17177be23faa498543); /* line */ 
        c_0xd3463488(0xa2ac5701e16ea861e38688361f7c72bd7c7d2c66c616fc291444d4cc3395229c); /* statement */ 
return (
            challengeProposals[address(dao)][proposalId].units,
            challengeProposals[address(dao)][proposalId].reporter
        );
    }

    function getSenderAddress(
        DaoRegistry dao,
        address actionId,
        bytes memory data,
        address addr
    ) external view override returns (address) {c_0xd3463488(0xb607cae87b9de3c30f322e791b4a2a9683362b03b0e456141917d4d2f718b192); /* function */ 

c_0xd3463488(0x860ab29c8e19f42b8c12e3f29e93b75e0e57cc6cc36d8a51a6b0ab29f1e5cbab); /* line */ 
        c_0xd3463488(0x433847d421d2ac1441fd34fb0d9f017589bb9f186e01c14f9976dfdbdb8809a6); /* statement */ 
return
            _ovHelper.getSenderAddress(
                dao,
                actionId,
                data,
                addr,
                _snapshotContract
            );
    }

    /*
     * @notice Returns the voting result of a given proposal.
     * possible results:
     * 0: has not started
     * 1: tie
     * 2: pass
     * 3: not pass
     * 4: in progress
     */
    function voteResult(DaoRegistry dao, bytes32 proposalId)
        public
        view
        override
        returns (VotingState state)
    {c_0xd3463488(0x02ee098b18692201cba732ee2b630b1801c8a73658ca7b8eec80f6f7799dfc0f); /* function */ 

c_0xd3463488(0xdc8a6e330cfd645c02997a59d828ee964b2e65fb7faa351cfaf7b7f807cf1c3e); /* line */ 
        c_0xd3463488(0x80cd4c9b081ae25f0313f1cd9f4e23e9a25ade9f15b75aaf5dfdfc8ff1b3692b); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];
c_0xd3463488(0xc2b0b46d527f3026c60f79d91437dcd835376aecfa976ef4acd8e168a85f8365); /* line */ 
        c_0xd3463488(0x2fbba754c310cd0c0c677a224cec3706e4e4903175c50259351d577cec5b77a3); /* statement */ 
if (_ovHelper.isFallbackVotingActivated(dao, vote.fallbackVotesCount)) {c_0xd3463488(0xcc466e303a0ccaec2fde17d63899ce8fc5665ef994e2469eee1c4a32057237a1); /* branch */ 

c_0xd3463488(0x1f359493a02f9bc0cff5d88df5a657851fe0a69cda661c7a10a98f3aca9e66d5); /* line */ 
            c_0xd3463488(0x7e2b57ebb663be591ced302be624371e1e23cc287621a72a589f8524f84a84b6); /* statement */ 
return fallbackVoting.voteResult(dao, proposalId);
        }else { c_0xd3463488(0x1a9149419b9b65409290cbdeb3b5329dccd75985e94e9474ca38c0724d6ebcb9); /* branch */ 
}

c_0xd3463488(0xcd9fe53c2843667ed42c103fb3837b08007dc7fb7c9919d543df276f5ae21395); /* line */ 
        c_0xd3463488(0x33a719f27b5dcf0284f06e354fbdc16a9aeecc827ae81fb480a9ce52c257f5ea); /* statement */ 
return
            _ovHelper.getVoteResult(
                vote.startingTime,
                vote.forceFailed,
                vote.isChallenged,
                vote.stepRequested,
                vote.gracePeriodStartingTime,
                vote.nbYes,
                vote.nbNo,
                dao.getConfiguration(VotingPeriod),
                dao.getConfiguration(GracePeriod)
            );
    }

    function getBadNodeError(
        DaoRegistry dao,
        bytes32 proposalId,
        bool submitNewVote,
        bytes32 resultRoot,
        uint256 blockNumber,
        uint256 gracePeriodStartingTime,
        uint256 nbMembers,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external view returns (OffchainVotingHelperContract.BadNodeError) {c_0xd3463488(0x123781a251f0c00ef4be285bdff626ab0c34900ada9c468925d02a118f07e967); /* function */ 

c_0xd3463488(0xa8f080d86ebd77ceae0fc2d48ab1059e73d15773594331ca36ba251aff093e3e); /* line */ 
        c_0xd3463488(0x627258ff4296dbb7e36a6d24fdd4a48cb07d8f41c80b194b7e688573df8619a2); /* statement */ 
return
            _ovHelper.getBadNodeError(
                dao,
                proposalId,
                submitNewVote,
                resultRoot,
                blockNumber,
                gracePeriodStartingTime,
                nbMembers,
                node
            );
    }

    /*
     * Saves the vote result to the storage if resultNode (vote) is valid.
     * A valid vote node must satisfy all the conditions in the function,
     * so it can be stored.
     * What needs to be checked before submitting a vote result:
     * - if the grace period has ended, do nothing
     * - if it's the first result (vote), is this a right time to submit it?
     * - is the diff between nbYes and nbNo +50% of the votes ?
     * - is this after the voting period ?
     * - if we already have a result that has been challenged
     *   - same as if there were no result yet
     * - if we already have a result that has not been challenged
     *   - is the new one heavier than the previous one?
     */
    // The function is protected against reentrancy with the reentrancyGuard
    // slither-disable-next-line reentrancy-events,reentrancy-benign,reentrancy-no-eth
    function submitVoteResult(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes32 resultRoot,
        address reporter,
        OffchainVotingHashContract.VoteResultNode memory result,
        bytes memory rootSig
    ) external reimbursable(dao) {c_0xd3463488(0x31aa0866395d41e6b06995a74036b0bb4786cb205ba98e822a1241f93cc041a8); /* function */ 

c_0xd3463488(0xc7d6fa5c77f64b0da0a788d80103d2e9adf64930b92bff50d62822fbf7965d0c); /* line */ 
        c_0xd3463488(0x5c03a87f70b4bb512a202d2bd0a7e001a49e9ca9e0665f67c4428453814bde17); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];
        // slither-disable-next-line timestamp
c_0xd3463488(0x6e6b6428c56fb88376a1ac2471697a1b1183497bfb305115ad3fe0fee8da6065); /* line */ 
        c_0xd3463488(0x435ff190123a254dbdb7f3333e77f2a3b5f831893177f6df0537df233693377f); /* requirePre */ 
c_0xd3463488(0x5d6a795b0fc37e25ceea89ea9fc90c012d5766a6e138d12f63f3e58cd62d5f83); /* statement */ 
require(vote.snapshot > 0, "vote:not started");c_0xd3463488(0x4473aaadd0386df0ab4a7c2b5f72c23f69a07ba5cf7d640d4176a908a12d7e77); /* requirePost */ 


c_0xd3463488(0x10c711014abeb28dc1b3f76cd76b853ae146bb72322b43134f6ebc220f398966); /* line */ 
        c_0xd3463488(0xc06b1a0fdc80fbc34140aecc005179b8a3c38f6fdd07c640ad54d61e4a756db2); /* statement */ 
if (vote.resultRoot == bytes32(0) || vote.isChallenged) {c_0xd3463488(0x3de65a2627402e3224491568c85a84f382e829a5fa87314ef879f5849bf07111); /* branch */ 

c_0xd3463488(0x39970485c0e23b297cfe7da268b6fd0a33339052b18df334dfd30f0d9afd938b); /* line */ 
            c_0xd3463488(0x28d30498fa7a6dd25eabf2e875f18a3a5493bfac1164b8aa0604d3e45e3e99d5); /* requirePre */ 
c_0xd3463488(0xf674ad48f6c08f427ed95a36ec350f75daf90694f5c57eb39254e7256edb446f); /* statement */ 
require(
                _ovHelper.isReadyToSubmitResult(
                    dao,
                    vote.forceFailed,
                    vote.snapshot,
                    vote.startingTime,
                    dao.getConfiguration(VotingPeriod),
                    result.nbYes,
                    result.nbNo,
                    block.timestamp
                ),
                "vote:notReadyToSubmitResult"
            );c_0xd3463488(0x7d53f42deee7d22002400553fc6f4e754ccf382624f127a6d0f7410f78e134e6); /* requirePost */ 

        }else { c_0xd3463488(0x48293b6da2b181b77a5f844bf6af975609626568811924e5b2b5428a8b751b1d); /* branch */ 
}

c_0xd3463488(0xefcc834c75dbd55cb04b46e22552badfc9f4c91545dd3219e96566bc466c61aa); /* line */ 
        c_0xd3463488(0x65179066d98cb16fb6fa050cc10bfb27beb97adfc7e21f8342760b19f1ade541); /* requirePre */ 
c_0xd3463488(0x6122a380b333afd9c3a0d8467503d59be4eb83a6d3ac84b51726a5b299e49fc8); /* statement */ 
require(
            vote.gracePeriodStartingTime == 0 ||
                vote.gracePeriodStartingTime +
                    dao.getConfiguration(VotingPeriod) <=
                block.timestamp,
            "graceperiod finished!"
        );c_0xd3463488(0xbf5852f1c535103125a14490d3e48a0e2e638c009190918d877787ae545bc7d0); /* requirePost */ 


c_0xd3463488(0xf21432f6141b451759f9aef95c6efddf9e9afd25329180870980b6c01a8f7215); /* line */ 
        c_0xd3463488(0x002ce63b7ebc357d7d82e3a01aaa1a9b55662cdc0a0e7efbffba5a21e78a2126); /* requirePre */ 
c_0xd3463488(0x5376bd6cc73bb723f247a68a7d47ba62a70eec451b38cbdf9545376dbd1a5170); /* statement */ 
require(isActiveMember(dao, reporter), "not active member");c_0xd3463488(0xba9c368892cdc2900ddb62f95b805103ab4c245396181a9f26c7bdd7094699d2); /* requirePost */ 


c_0xd3463488(0xb8942df96da465aae24523de75b51eb4f7b654515c00f528fddd55044af9d107); /* line */ 
        c_0xd3463488(0x2dd0291f9cd70ffd5df87db0ab53842604ab0b1295fb321393e769ae2c9dff7c); /* statement */ 
uint256 membersCount = _ovHelper.checkMemberCount(
            dao,
            result.index,
            vote.snapshot
        );

c_0xd3463488(0xd12e24a2111c7a11d5b041d387c2e794e3a623e8b617a1a47e732566968b4a41); /* line */ 
        c_0xd3463488(0xba0b6fb12e4c67a8d3b4bbc3356168af9f0b765ec050726049af422db5419687); /* statement */ 
_ovHelper.checkBadNodeError(
            dao,
            proposalId,
            true,
            resultRoot,
            vote.snapshot,
            0,
            membersCount,
            result
        );

c_0xd3463488(0x9ecf4fa223d0bcda50e6ec440a2e8718d059976c853b2ac59ca1af0d6cd24726); /* line */ 
        c_0xd3463488(0x2593af743f2d9ef5b80caca0ccef32c603aaf1a787ee8a0eb42635281ff8ce02); /* statement */ 
(address adapterAddress, ) = dao.proposals(proposalId);
c_0xd3463488(0xdf34e851bda72be879c0771453c6168124cd3e9114c0fd750fd1fda361a8d6f1); /* line */ 
        c_0xd3463488(0x276ea80b835a99d22c97d170627c82f844ae55da8e09af62aadf4380908058d5); /* requirePre */ 
c_0xd3463488(0x4a148a63ceca40d5c4a7ac782644f3bafdd3a7940c7f2553944cc19f8e215317); /* statement */ 
require(
            SignatureChecker.isValidSignatureNow(
                reporter,
                ovHash.hashResultRoot(dao, adapterAddress, resultRoot),
                rootSig
            ),
            "invalid sig"
        );c_0xd3463488(0x1a578c03592028001c0733c254fb3921cfad6c0fffbd3d3a4d87d40190d3ebcc); /* requirePost */ 


c_0xd3463488(0x5759a293dbc512b6e5667cd4fc25d94f337735453baf75011e1af7886434968e); /* line */ 
        c_0xd3463488(0x9d815d07cf08f833e755913c49782b991a5b95e25d1981e6727dd264b517656a); /* statement */ 
_verifyNode(dao, adapterAddress, result, resultRoot);

        // slither-disable-next-line timestamp
c_0xd3463488(0x6bf03bf196beb8744ae2aca8a87d712dd04b1251c74a3c684504d4b22346da3b); /* line */ 
        c_0xd3463488(0xe5be0b7c0763d5ab637ff4927d4558c9620e69a2f5956bb3eafca086d68e9328); /* requirePre */ 
c_0xd3463488(0x185ac1b94dc45951a45e18f283803b1061968560eab48c9046f7632c123f7e48); /* statement */ 
require(
            vote.nbYes + vote.nbNo < result.nbYes + result.nbNo,
            "result weight too low"
        );c_0xd3463488(0xa6c648a113b62f5f1f740a20b1631bef4e5fffa0bead336213ae1fd4c0baeb11); /* requirePost */ 


c_0xd3463488(0xc2bba8f53d86171a7a40b1f4c903275232923abf6dc9eba91234c363822e8d24); /* line */ 
        c_0xd3463488(0xa84cd1bbfbb22dc71150faa3c1b6980e091833027d2510b2a6bdbed8fe07f668); /* statement */ 
if (
            vote.gracePeriodStartingTime == 0 ||
            // check whether the new result changes the outcome
            vote.nbNo > vote.nbYes != result.nbNo > result.nbYes
        ) {c_0xd3463488(0x0c95c22cb02e927000454d951dcfbeab9d93e0b6244b4c080bb2c53a2ae94003); /* branch */ 

c_0xd3463488(0xb90ce579e3957f1c8bff912d58bc5aecb66dd615dc8535c4a2dfe58e80925aec); /* line */ 
            c_0xd3463488(0x10d8ec6320e852ad4d6fe0c484b7c9d5e02d43e4e7e5a719afccbe73faf312e0); /* statement */ 
vote.gracePeriodStartingTime = uint64(block.timestamp);
        }else { c_0xd3463488(0xd3ace0303bd78481ac6f37514d4839f2f7f477f727795713041c653939b12cb1); /* branch */ 
}
c_0xd3463488(0xac0f6c212c4b3b9d5d19a7986b3a08c3b4467ba17282355b838ee5894b125642); /* line */ 
        c_0xd3463488(0x03eb4956bce31e03bfb62a0655831a98039509d6089c17614b4e3d37f565a62b); /* statement */ 
vote.nbNo = result.nbNo;
c_0xd3463488(0x8c7d937f0671097780dab3abd2eb2f47b31651e8f3757f8d3b1a061c56167aa6); /* line */ 
        c_0xd3463488(0x66b3925cdc2da1a8f123cb280fe9b6b84a2c2ec18e5dae51c242584afb5d1c32); /* statement */ 
vote.nbYes = result.nbYes;
c_0xd3463488(0x7769a44eaff3a92c9dd68083c5c40474993a61d828d01dad165e7a03e17f0890); /* line */ 
        c_0xd3463488(0x1541799dd5f7288c5ecd8eff0f8306136e9c45da70c27c66b78df584213f7c2b); /* statement */ 
vote.resultRoot = resultRoot;
c_0xd3463488(0xc06f8df81b0b9d03abeed130723a75b4beba6e1887c4f3804e09cc1ad74cc434); /* line */ 
        c_0xd3463488(0xf8b1f7fd9c9e9151661d630709bbb957205589cdeccf5530634d556e2070a01f); /* statement */ 
vote.reporter = dao.getAddressIfDelegated(reporter);
c_0xd3463488(0xf5db782a56e3b1981093e3ed1a4535f48bb79d2e453414c67a38088958bf08b7); /* line */ 
        c_0xd3463488(0x656e8c15049f9536da79d284e5c7c94ad4b378e9cf8ca0f6415c0f98d98b24f0); /* statement */ 
vote.isChallenged = false;
c_0xd3463488(0x69a93d07287e8df4034bf4d8b49d08f94b29ebd17b3f4002d2fce6a10e40a138); /* line */ 
        c_0xd3463488(0x41fa68ea7f1bd7d77ebabea0e570d21398f316cb783fe01d689bc40c1ff3d288); /* statement */ 
vote.nbMembers = membersCount;

c_0xd3463488(0xc150f1428b50e47f89b4afafe953b209d01273daf3d589af179eae8497e0a2b1); /* line */ 
        c_0xd3463488(0xee7441f7d3325975376919b19b3426af517a66c3cbdb4387cb546dbcedb94b51); /* statement */ 
emit VoteResultSubmitted(
            address(dao),
            proposalId,
            result.nbNo,
            result.nbYes,
            resultRoot,
            vote.reporter
        );
    }

    // slither-disable-next-line reentrancy-benign
    function requestStep(
        DaoRegistry dao,
        bytes32 proposalId,
        uint256 index
    ) external reimbursable(dao) onlyMember(dao) {c_0xd3463488(0xab243858372212165ee87b648f87acb3d0c188a2d565bde0957539d3a2f58f6e); /* function */ 

c_0xd3463488(0xcb042b62bc28ede46b5a8cf944a99725f168d40d41ac0ea33ebf43e6fc159d78); /* line */ 
        c_0xd3463488(0x65feeb27e83a37dd63744bec66a202b760211156db7c47d5fd92258029e5f6da); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];
c_0xd3463488(0xaeee71161ea22550ba4c764fe470cb8962040f245615b03d1a5143a7f313c4b4); /* line */ 
        c_0xd3463488(0xaebbc220da1a9af35d3cb7b6e5e74cf0ae187e8e73cc2a2b77554e3ed43588c4); /* requirePre */ 
c_0xd3463488(0xbdf4e327a3f81da0379212fab84f3e784d18c0fee160fa84288b762dff2cd148); /* statement */ 
require(index < vote.nbMembers, "index out of bound");c_0xd3463488(0xc4226a25790bb6d582a4d4be7ab8cba196dbe7493855286a8cc083882ab871e7); /* requirePost */ 

c_0xd3463488(0x044bfb23ebecb238f4b7065f8587fe038a0d063d0d914ef6670a75324bcb1be7); /* line */ 
        c_0xd3463488(0x94527ed15d9b836060452fb0f1496494c0bd9e3592b549516a58d4dc65840267); /* statement */ 
uint256 currentFlag = retrievedStepsFlags[vote.resultRoot][index / 256];
c_0xd3463488(0xca58ccddd436ffb919c8aec9caf172e9425432858f05ec11cf5523e6e429b8c7); /* line */ 
        c_0xd3463488(0x104ac1d9db4eb7f3da1c973e536871082f33ad4e9a9ffb1b419cfb5ba7b4c677); /* requirePre */ 
c_0xd3463488(0x5fc211f7215fd402e66462eb02bb7e369b5b04c5f28daccff7e17efaefc170e2); /* statement */ 
require(
            DaoHelper.getFlag(currentFlag, index % 256) == false,
            "step already requested"
        );c_0xd3463488(0x36a67b50ad368b5b16532fc6a73999444bbcdc85270293d51281537636c57d50); /* requirePost */ 


c_0xd3463488(0x12783e5a430571cd04d42dbf89c5f0f9ae6ff584b1b64764fdca4e021126ffbe); /* line */ 
        c_0xd3463488(0x56c923827c88c74813b96b5240a29aca940c98ab3a20a45754261e37dd1f4dfb); /* statement */ 
retrievedStepsFlags[vote.resultRoot][index / 256] = DaoHelper.setFlag(
            currentFlag,
            index % 256,
            true
        );
        // slither-disable-next-line timestamp
c_0xd3463488(0x72add6cb3606e3a527e2be3753ceeb52e06d46f5620387a060170cb6128e7a10); /* line */ 
        c_0xd3463488(0x5582a4b9b70627734efa7c25546ddce63bb63f09c6ecdfedd95d3c5703e0604e); /* requirePre */ 
c_0xd3463488(0xd807655962653b89bc0aa08abfadd30d3159e86a1ca1299230942bf406cf6749); /* statement */ 
require(vote.stepRequested == 0, "other step already requested");c_0xd3463488(0x890cf3e0306fbadc98691e061cd0eb4721183fac3eb81d326778b73d4415b963); /* requirePost */ 

c_0xd3463488(0xbad0e1bd8895b2e06111fbe0268819eace410a43a6401e9aea5cc09186e53749); /* line */ 
        c_0xd3463488(0xb24e871fc2ae9c70431cce349774e12aef09930ef9f092a53cabf0ea81fea308); /* requirePre */ 
c_0xd3463488(0xf3e09b4cd088fb5e21e5674dcfba3081c28861709756dc34fd1d9d569ab7138c); /* statement */ 
require(
            voteResult(dao, proposalId) == VotingState.GRACE_PERIOD,
            "should be grace period"
        );c_0xd3463488(0x822841f2e57783ddfdc6bb0e05cbaf5057ac08593c8ba06ca0d1ad7da0b65ce3); /* requirePost */ 

c_0xd3463488(0x7d4f0e0aabcb3e6fe08514ee3661e556e04b2b9e072f3cbe68f93e489170046a); /* line */ 
        c_0xd3463488(0x3b699a398e42b5c46084c4365c3cb3d17d8468fae76e44e54a3d6c3e3fbb1f53); /* statement */ 
vote.stepRequested = index;
c_0xd3463488(0x715aae2aab0bee8fb0288032acc217a2621495a001a93aa1301ec1da863d684d); /* line */ 
        c_0xd3463488(0xe91543d9beeb4b734b3b6244b13a905bae142bfcdf942cf7907d1bba6244f944); /* statement */ 
vote.gracePeriodStartingTime = uint64(block.timestamp);
    }

    /*
     * @notice This function marks the proposal as challenged if a step requested by a member never came.
     * @notice The rule is, if a step has been requested and we are after the grace period, then challenge it
     */
    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function challengeMissingStep(DaoRegistry dao, bytes32 proposalId)
        external
        reimbursable(dao)
    {c_0xd3463488(0x34b1f2acaeee271ff372df18fb70de731d6de8a7bde7a10e3e17f19c3c2c71c6); /* function */ 

c_0xd3463488(0xa2e42d7dfd44666b7addb60a5fc99b56b824b281a74519ebc0fe8dc71e18dde3); /* line */ 
        c_0xd3463488(0x85b768e53dd40c3efe98d82925767b3b3f19d044026544d4e9c6fe6a7769555d); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];
c_0xd3463488(0x1ffa3085971da1c3c73a470e07f765623a827299a7c9cf5df46b66716ea7c05c); /* line */ 
        c_0xd3463488(0x9a16bc0b4772cd4135cc56220e19231c2a8260dbb7360c69eb615fb745fc29c5); /* statement */ 
uint256 gracePeriod = dao.getConfiguration(GracePeriod);
        //if the vote has started but the voting period has not passed yet, it's in progress
c_0xd3463488(0x06e0e43ea86d991c11496ea5f2acd3f7bdfc09ac32342d517ecba612b7769f93); /* line */ 
        c_0xd3463488(0x386bb8f41d4dceb9c4aedf138c1dc29163515ef90959bcb069f24612aac43493); /* requirePre */ 
c_0xd3463488(0xc4e41793aee5e1b92411f881f2986cf22f0a825cac6ab72cd9470f7cb95b4130); /* statement */ 
require(vote.stepRequested > 0, "no step request");c_0xd3463488(0x011b379a941d7cfed6cf24fc5c81b84c6b1ef209e1b40a92ad8ee0d27452b845); /* requirePost */ 

        // slither-disable-next-line timestamp
c_0xd3463488(0x59b96b6b87faec510141460a06060af596517f90ea1f6f80e8c728c91c835980); /* line */ 
        c_0xd3463488(0x23a225e2c60f07f6dcebe35b4d7f099e127c8dcd987482b60ee6fdbcecc74981); /* requirePre */ 
c_0xd3463488(0x09f6268138f5c1711d39319914ef1044bd617aa00735f881f153e961dc7e8f19); /* statement */ 
require(
            block.timestamp >= vote.gracePeriodStartingTime + gracePeriod,
            "grace period"
        );c_0xd3463488(0x4acc8c80ab96beeedccdffb55606f768163dcf2d89ff7268ae78a413701956d1); /* requirePost */ 


c_0xd3463488(0x41317186c0c88c876ee0ea71636336c1721b84d39f9f55d771913626512a026d); /* line */ 
        c_0xd3463488(0xd422b5c143c73522d6a413238019bd65586ad2fd7c1d9dc2ced42a005fc416a6); /* statement */ 
_challengeResult(dao, proposalId);
    }

    // slither-disable-next-line reentrancy-benign
    function provideStep(
        DaoRegistry dao,
        address adapterAddress,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external reimbursable(dao) {c_0xd3463488(0x691db8ad254ff6b8fae4121a736c1eafbffea91d472db952765e78d93edb7ad3); /* function */ 

c_0xd3463488(0xa6c807fc9910c7f1b0de5870ccf76a31296107b70d49223a74c0a02f49570c97); /* line */ 
        c_0xd3463488(0x69b67995eb0a3f006e59f31288b9d718f576c83c3c09b9a9cb3fe7ed30aaa4b9); /* statement */ 
Voting storage vote = votes[address(dao)][node.proposalId];
        // slither-disable-next-line timestamp
c_0xd3463488(0xbc7d7e1c1f58ed45120f569be66e1baf9d1078718731bac2ce57a85e0743a274); /* line */ 
        c_0xd3463488(0x70343971b1db8adf11d51303b6aef7fa94b68960a4d45d43227bc9c68502869d); /* requirePre */ 
c_0xd3463488(0xfe6b0f903fd2d6b9ac7da8193b9326b0dded19d937c1baf64b119d8fd70f2f33); /* statement */ 
require(vote.stepRequested == node.index, "wrong step provided");c_0xd3463488(0x7920d09725a17bd8c91cd05f30836070b2df068b6a8965c4c0380f72147163a5); /* requirePost */ 


c_0xd3463488(0x221fa70f34a10ad15a99e1e7709faa4399082ed55eed5f111a93448fde435616); /* line */ 
        c_0xd3463488(0xac5164dc0e8b5ea8d56ed33a259935fc1562c6de9fd5a2951df653dac2f072a3); /* statement */ 
_verifyNode(dao, adapterAddress, node, vote.resultRoot);

c_0xd3463488(0xed42e1139fe78b54f0a1d1c1d8451b229450079bcb296751388bd4cc5cf049b1); /* line */ 
        c_0xd3463488(0x2e9055c5857bfd2e321f8d705f559f3fe30af8848b8227cc02247451b1068a2f); /* statement */ 
vote.stepRequested = 0;
c_0xd3463488(0x3c8486823cca97613833692677c31e62387877dcfaf0af8f4b630d6006ef4bc4); /* line */ 
        c_0xd3463488(0xf66f0c6e3746bead3b3690bdfc7be0d1a4c58c393dd245ff3d71515a42b60ded); /* statement */ 
vote.gracePeriodStartingTime = uint64(block.timestamp);
    }

    // slither-disable-next-line reentrancy-benign
    function startNewVotingForProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) external override onlyAdapter(dao) {c_0xd3463488(0x843f9acc1f3a0907f711c69f2334664a989a0107b399a0746d4050a1505a75de); /* function */ 

c_0xd3463488(0xe219c062696c6bdc69239842d9f96a4af92095f7c6ccf9c341966274334f8f60); /* line */ 
        c_0xd3463488(0x1d22305b1b79ef52a3b28fc6ad69a4404c24ced97e7bd0acb23180e3da1bcff9); /* statement */ 
SnapshotProposalContract.ProposalMessage memory proposal = abi.decode(
            data,
            (SnapshotProposalContract.ProposalMessage)
        );
c_0xd3463488(0xe6e719dba8c1e0907e842b69a12a709a01cd6f347629d9310aece90f91cad20b); /* line */ 
        c_0xd3463488(0x7f65c105db998a96f15190f4c3b8271ee50f47431514dde0347d081166258423); /* statement */ 
(bool success, uint256 blockNumber) = ovHash.stringToUint(
            proposal.payload.snapshot
        );
c_0xd3463488(0x6dc378a5dc2163b2409024ecf0babc013f703cb777278122ef353d64bc02872c); /* line */ 
        c_0xd3463488(0xb36001d9c1d5880d96d24e70c6ac1194928c19c917ec8f1bb6c30cd29296dae4); /* requirePre */ 
c_0xd3463488(0x4c918c940d1757d7baa92694676abcdb9a89f047e4cc0abef5e270c212a3f59b); /* statement */ 
require(success, "snapshot conversion error");c_0xd3463488(0x4c794d4264e3e46115f9082fd9c34da131ebce824fac417cd1fa4b1b4912d678); /* requirePost */ 

c_0xd3463488(0x64f9c1914dc937b8e2eba29d0bdcfb48defc86c49fa4b26947ed1076ed58b1c6); /* line */ 
        c_0xd3463488(0xaeb4aaa3ac35966e071603d731e59c272d6116e5cca9bba1a62b1676b11ee04f); /* requirePre */ 
c_0xd3463488(0x7063ad8e371ef4e13cbf27b08f5fe1fa8261ac84726cdf3aada5263aa34b5650); /* statement */ 
require(blockNumber <= block.number, "snapshot block in future");c_0xd3463488(0x8309854572be03dd941927d35c32eaf63da3fd6035ad9544be902cb1cf5f5304); /* requirePost */ 

c_0xd3463488(0x144c8e58beee9ec72de00b65d004b1c37574c46cf0a884c11d3f58a800248ba9); /* line */ 
        c_0xd3463488(0xd7130e1ccc846a9c433ebc634267f4eb87df18b7a2eab4482afc16f30687dfe2); /* requirePre */ 
c_0xd3463488(0x618bfb2868748f4de6232d06a47c99406bdaeb8337e5c901eb44b2c5b8038356); /* statement */ 
require(blockNumber > 0, "block number cannot be 0");c_0xd3463488(0xda8f9046671b41b8d9acd521937164a10920b182bdf54804f8714624e0783c90); /* requirePost */ 


c_0xd3463488(0x28baaf4ebb645374314cead022bc4a4128e47c4a6b772d81091e1e95259a86da); /* line */ 
        c_0xd3463488(0xfe4ea5fbd3cb2625420bcddb775f6f4ce56f4894bb6c23bb6bad501fc684e446); /* statement */ 
votes[address(dao)][proposalId].startingTime = uint64(block.timestamp);
c_0xd3463488(0x2a0f94ba993937f3524cf1d5bb25b8a02321a2e3d7a93f3cfc5e702e0579c204); /* line */ 
        c_0xd3463488(0xfe59e2568da5377e77450e61ab7b3100c904ae3219de5591dce50f30079afa23); /* statement */ 
votes[address(dao)][proposalId].snapshot = blockNumber;

c_0xd3463488(0xab0f59b1119cec5c7b8100d80a7303b6792cd7387726782a63c81fcdfdd54f78); /* line */ 
        c_0xd3463488(0x1e1a93a8744b16d07fd484e729a76f099ef536eef7caecc217719e4d13dd5e26); /* requirePre */ 
c_0xd3463488(0x978e4713900c810e4fae37b15a9e2b2f639e5f9a537740902e318d1677f77f47); /* statement */ 
require(
            _getBank(dao).balanceOf(
                dao.getAddressIfDelegated(proposal.submitter),
                DaoHelper.UNITS
            ) > 0,
            "noActiveMember"
        );c_0xd3463488(0x970052b6644dcb30c92339eee0afd73f4d6abef41f0c23dc71c905934e89e7aa); /* requirePost */ 


c_0xd3463488(0xe5349fbfa01418a9e92326b852ad7e5dd9efcc956e4935b221dc38863e5e55b9); /* line */ 
        c_0xd3463488(0x1fb30140af8d08340663642b966ab3e8648eaa0627a852ff5341b9430f8ccbb5); /* requirePre */ 
c_0xd3463488(0xc4d469e11629921d45c137ec68ac1c963b5fe17a9b618772be723a7de4db67a8); /* statement */ 
require(
            SignatureChecker.isValidSignatureNow(
                proposal.submitter,
                _snapshotContract.hashMessage(dao, msg.sender, proposal),
                proposal.sig
            ),
            "invalid sig"
        );c_0xd3463488(0x40623aadf6e374381200e8e2c5fcca819cf9d47228e13c50ad1e4ddc7bd4bdb8); /* requirePost */ 

    }

    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function challengeBadFirstNode(
        DaoRegistry dao,
        bytes32 proposalId,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external reimbursable(dao) {c_0xd3463488(0xe33fecb2b3750b0298b77122f5a4c0f47e6a03bddd21640b9fba2a203138a5ae); /* function */ 

c_0xd3463488(0x42d838ac6b9756b7bf1860dc7749b8d5e74b56796b4e9b6306ee96dd29fe9ffc); /* line */ 
        c_0xd3463488(0xcec57f85efbd7e878edbf3da054b4dafa85331db3a7f134a550003a147f1a724); /* requirePre */ 
c_0xd3463488(0x2ae2a2e564c4f608a6f07d155590e26e8584641c8bee63db16045daee70f998c); /* statement */ 
require(node.index == 0, "only first node");c_0xd3463488(0x0a73d9c264382a81576d2a383362df268f4d24c93cac1e91afef4dc036a6b61c); /* requirePost */ 


c_0xd3463488(0xc9b0ce5cc02f7f989f9a32e477f8fc66a6370078a8f8e73dca8bd746fbb637cd); /* line */ 
        c_0xd3463488(0x74b492b58c06e8feaa8f7d57d31e252291215ca6e79970ac763052dbc1818484); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];
c_0xd3463488(0x43292ad348708d7ce763b824ee0f9c2f67492232af804d30bc0baec71f16ce54); /* line */ 
        c_0xd3463488(0x085a389622c6c78e7cc59c0cdd99a9b7162115b23073213715b71c7bda821a9b); /* requirePre */ 
c_0xd3463488(0xc125e92bb8a4598ba6fcd545d896db84b16bbb3b771d1abd1505dc7420dd9c37); /* statement */ 
require(vote.resultRoot != bytes32(0), "no result available yet!");c_0xd3463488(0xe6b36707f2c7e829cd03466e16e38faa33dfeb5f373a66ca9266cff74a791ab7); /* requirePost */ 

c_0xd3463488(0x85a3eafb08594b44cb3ed39d1f8fe284e84fb56d7c54908ddf42222bee647187); /* line */ 
        c_0xd3463488(0xc9f765e47107504da67a43d85c95877dca1c9707805e542fae35d6c8e8ea6f04); /* statement */ 
(address actionId, ) = dao.proposals(proposalId);
c_0xd3463488(0x523d6a0f46f69758c2144ddf9ac2976e8ab04ce17546a556e7e900eec85214f5); /* line */ 
        c_0xd3463488(0x83029556209055843e65ff42a62cb4fcb708aadb75b99e0b7f9c089e2186f954); /* statement */ 
_verifyNode(dao, actionId, node, vote.resultRoot);

c_0xd3463488(0x55008b85e9686018f2adf30df31075bfd4ebb1fecc2291e61ad0871c204bd707); /* line */ 
        c_0xd3463488(0x32b45b3fefead50359efb9ecb4d60c7203b20e21066def2a1bc5a0b2db217389); /* statement */ 
if (
            ovHash.checkStep(
                dao,
                actionId,
                node,
                vote.snapshot,
                OffchainVotingHashContract.VoteStepParams(0, 0, proposalId)
            )
        ) {c_0xd3463488(0x9fba54ecd1844eca9f8cc1939233a1e6270796cdb3563e891cda6f02e9242ef3); /* branch */ 

c_0xd3463488(0x07934eb7bb155ba1fc299e0299c5ad24e45002c8e6b5ccfcc1019921c4d51619); /* line */ 
            c_0xd3463488(0xa6f955fccd83d1efce0b093d9c0fc8d8c4976cca678d4236c723c4c0c2d8392b); /* statement */ 
_challengeResult(dao, proposalId);
        } else {c_0xd3463488(0xf535f0e68150513e825c9c368b50623c712437f37c2daa3bb408df542022efc7); /* branch */ 

c_0xd3463488(0xe9de1fd5a73b750ff26931cc26f26698a2da6ba53fda5771b8f8ee6a744c15e3); /* line */ 
            c_0xd3463488(0x72cc8b678e0460c344691dcd117b1c4ac7487d66e91fe06721a09f31b4561b58); /* statement */ 
revert("nothing to challenge");
        }
    }

    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function challengeBadNode(
        DaoRegistry dao,
        bytes32 proposalId,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external reimbursable(dao) {c_0xd3463488(0x1d29f53efcf4360f576a0275f881148b1b4ef6e37551ae438a7aa26934c9e340); /* function */ 

c_0xd3463488(0xc6b9a21ba42b201484a3bb3be8ecadcf73d897f2e74ebeed0ccef8addf66c55e); /* line */ 
        c_0xd3463488(0xb2d0a2a555dff60c70d2e160e5be03549702699e356b2ffba513409f2fb7428a); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];
c_0xd3463488(0xd359cc99d7bb97afb7b5f819edf901766ef5be120f44b22aa9c6a6aadb9b75ff); /* line */ 
        c_0xd3463488(0x3e7e3b27d7fa205c2cd9cd3b0e465ca6f0ffbc791c679a60590ae09872969093); /* statement */ 
if (
            _ovHelper.getBadNodeError(
                dao,
                proposalId,
                false,
                vote.resultRoot,
                vote.snapshot,
                vote.gracePeriodStartingTime,
                _getBank(dao).getPriorAmount(
                    DaoHelper.TOTAL,
                    DaoHelper.MEMBER_COUNT,
                    vote.snapshot
                ),
                node
            ) != OffchainVotingHelperContract.BadNodeError.OK
        ) {c_0xd3463488(0x0958d5d554551627c86241365730e85954a69633df566e76c26d10818c2ccbc3); /* branch */ 

c_0xd3463488(0xbe7f2c4d1b09d8748995fec4bbf1ff8717b9cb7e850a7cdd3094858108a05bb9); /* line */ 
            c_0xd3463488(0x2c361547819417e1e688770fcd1ed9aac2682a184394b42b9b4f3f81de13bbe0); /* statement */ 
_challengeResult(dao, proposalId);
        } else {c_0xd3463488(0x0039b30e245869a9da135f01930cb1a93387c3e81337398fb61ea6c47930d38d); /* branch */ 

c_0xd3463488(0x6a1978a6923b129597d46f0ceaf289639868621cbd98a3d4c74cd8ac1be9e756); /* line */ 
            c_0xd3463488(0x7665f525cb19554b78e6d9885e8b63f6ac8c40aeb2c2ca27ee48efae40f52b25); /* statement */ 
revert("nothing to challenge");
        }
    }

    // slither-disable-next-line reentrancy-benign,reentrancy-events
    function challengeBadStep(
        DaoRegistry dao,
        bytes32 proposalId,
        OffchainVotingHashContract.VoteResultNode memory nodePrevious,
        OffchainVotingHashContract.VoteResultNode memory nodeCurrent
    ) external reimbursable(dao) {c_0xd3463488(0xfad75b6bea188c535058fde6c2b393bb7b25c4e865506293bab32b9f63cbb0ff); /* function */ 

c_0xd3463488(0xe7e6fdc2e316257697d2666abb8a07712437828b74bd0acd33bcb7d1c9c0770c); /* line */ 
        c_0xd3463488(0x6aa64cb3a8c4931cffaf2b3b6d42f445606b6184622299cad74b747d124ad884); /* statement */ 
Voting storage vote = votes[address(dao)][proposalId];
c_0xd3463488(0xfe867d4321aaa9ac21511107838e969108147675314a1786bf23ce6f115ed6b5); /* line */ 
        c_0xd3463488(0x44c31b95bd386ee429ed6d0e85abdc5b9b580af807273cdc9ad76f79909b99a0); /* statement */ 
bytes32 resultRoot = vote.resultRoot;

c_0xd3463488(0x0b64a4713972f43535183871fe08533658239167dc9118c2e21752e037e19276); /* line */ 
        c_0xd3463488(0x1d65ef12fa8ccec28511bc68d6f88bfdebc809e0d7a80541ab108d632073ba45); /* statement */ 
(address actionId, ) = dao.proposals(proposalId);

c_0xd3463488(0x8d07bef74ffe4e8745642442484d07791754323467e6a1be1339fe0075e1447d); /* line */ 
        c_0xd3463488(0x97b6077d11ec277d5106f03486361c03ef84e06d4e32b99fcde95bef7a19505c); /* requirePre */ 
c_0xd3463488(0xe68c451314fc37b10336e710fa0759d35415607a0a7ec23d7a44ef531e9395c3); /* statement */ 
require(resultRoot != bytes32(0), "no result!");c_0xd3463488(0xd0854aa3d6eeff8ac9b985a059a12dece6f2dc1701006f2a5bef7886e923ac23); /* requirePost */ 

c_0xd3463488(0x35067af75c9e5fe49d0de02297b569505d36a8290308bf606e51b8d148b709a5); /* line */ 
        c_0xd3463488(0x68b21f762650711289b4514002b68eaa71bfbf12fd36aa6f02d5e1a42e4c3e02); /* requirePre */ 
c_0xd3463488(0x06a515cec14f939787fd5f50f07d60f382567b9ae3bed504f1f6de6a0bf30153); /* statement */ 
require(nodeCurrent.index == nodePrevious.index + 1, "not consecutive");c_0xd3463488(0x417273d26f4ecdf55b28240e1f51fc7def0678ac38ebce6c3da801268afdc39f); /* requirePost */ 


c_0xd3463488(0xfd9845974555a2b46aaab580212d9f876be9fc1106410a73f37357216224007f); /* line */ 
        c_0xd3463488(0x48083a230ae7b4322f03946b9747606f2c54180f38bb4c0bb603f48f0e8a3506); /* statement */ 
_verifyNode(dao, actionId, nodeCurrent, vote.resultRoot);
c_0xd3463488(0xdbbcb70ca24815e211c24617d84f9d6f509821162d8d574c49de32fe79abd932); /* line */ 
        c_0xd3463488(0x5ddef89714430ed92a0bce325a0165fb8d2e274e0e1bb64ec7ff5cdd2b0a9a7d); /* statement */ 
_verifyNode(dao, actionId, nodePrevious, vote.resultRoot);

c_0xd3463488(0x643a98657c8c38464f86abdd64fe871ff5b1d818b89f51c78072c8115e83fe38); /* line */ 
        c_0xd3463488(0x47cd3a0a1a025a99520214205ecede90bc8b07921221db800dbf8695635b6d76); /* statement */ 
OffchainVotingHashContract.VoteStepParams
            memory params = OffchainVotingHashContract.VoteStepParams(
                nodePrevious.nbYes,
                nodePrevious.nbNo,
                proposalId
            );
c_0xd3463488(0x06ad8594bb6d46b9396c387d86e9217ae980c875fad456bd79905bfa38bca87e); /* line */ 
        c_0xd3463488(0x2c35a4c6052394927a0955a273eb1c74ffecccd3741c91ff7386d3d97db53f0c); /* statement */ 
if (
            ovHash.checkStep(dao, actionId, nodeCurrent, vote.snapshot, params)
        ) {c_0xd3463488(0x2d71aa5f7e8c75c4279e4825081cacda0b60caafc3c2fc9c4082bd66b3b6c0db); /* branch */ 

c_0xd3463488(0xa7d4ed20d38f555f729503333fca4eee6dfce91913ce0277a88a3c51966a00cb); /* line */ 
            c_0xd3463488(0x1c25c3a52eeb0949dbf978d385c76a623464136d06600b2857325dc426c6f657); /* statement */ 
_challengeResult(dao, proposalId);
        } else {c_0xd3463488(0xa1f16cb016164817ab28323e66dfa8e7cd6fd7e5a73127da75f59c4c4528d5ad); /* branch */ 

c_0xd3463488(0x31f65fef85d9f58e1791a8f28c4d575da0bbd66f117a91ea5958332dbacdb369); /* line */ 
            c_0xd3463488(0x8de622cfd74f5ac77cff2ce23ea01b8243be5596fc655ae44aece3567b6faee0); /* statement */ 
revert("nothing to challenge");
        }
    }

    // slither-disable-next-line reentrancy-benign
    function requestFallback(DaoRegistry dao, bytes32 proposalId)
        external
        reentrancyGuard(dao)
        onlyMember(dao)
    {c_0xd3463488(0x2fa91443794e674a98449bc8e4e4480c78d2dd5b0a4a994a36656269620e5bb3); /* function */ 

c_0xd3463488(0x67181975f434c482033b330f2a9033d43171d927b42f24faf708ab55c8c6d22f); /* line */ 
        c_0xd3463488(0x73742adf7b905fa4e64a59c6ab916995f2acf951b880dc3f66d582e7b6b01a23); /* statement */ 
VotingState state = voteResult(dao, proposalId);
c_0xd3463488(0x12163d93033d6f38bcf180566fa8c66a5964d8626fc6009e927c731fff417429); /* line */ 
        c_0xd3463488(0x3e0eaabb59b8b22aaccaef7e28eac0ad0643bd66b88d457bd085b8f3dea425e6); /* requirePre */ 
c_0xd3463488(0xf4eb32560f513ea2c138ae707aff7a2e095f611ad4b3d421b0f6e729c7b89125); /* statement */ 
require(
            state != VotingState.PASS &&
                state != VotingState.NOT_PASS &&
                state != VotingState.TIE,
            "voting ended"
        );c_0xd3463488(0xcd5ba6c2be740b7c96da948cdd4e764466ae6896b7b29f05d5c9f5400d44ed00); /* requirePost */ 


c_0xd3463488(0x985259abcd38ad638f86a592b8fd16458ac0e4bbfbb5b3729fcab5c55554787f); /* line */ 
        c_0xd3463488(0x06d7614700ab7b192c7eb69a7d6afe17c3af7f43e77d7e0555c633b6aa3361cf); /* statement */ 
address memberAddr = dao.getAddressIfDelegated(msg.sender);
        // slither-disable-next-line timestamp,incorrect-equality
c_0xd3463488(0x65b520818807d0cba9171ac1bf42ebb46c900d568a9d2007356715ee4364da1c); /* line */ 
        c_0xd3463488(0x065210f44310238078c3d800e8743ce3e4a2c2197459683f7d72b2af6270b2e0); /* requirePre */ 
c_0xd3463488(0x72306bbc203a5853b8465ff7be2ce6b418f204d3eb36e00d871c8648229c6e79); /* statement */ 
require(
            votes[address(dao)][proposalId].fallbackVotes[memberAddr] == false,
            "fallback vote duplicate"
        );c_0xd3463488(0xda9ce10c4c08521a1a9783907dbd3e92d4b1d8bffcd60d19f252cab608d9e20b); /* requirePost */ 

c_0xd3463488(0x0713c1efdf356e868306358ad7f1bf6633330681e2aaccd52e467faedf568a27); /* line */ 
        c_0xd3463488(0x26e7f3c8a57ba4b30e1e9d2e3e6a90e89257f5d7a0d3c901bd90b15e12b0a45e); /* statement */ 
votes[address(dao)][proposalId].fallbackVotes[memberAddr] = true;
c_0xd3463488(0x8d17b3e82a21eef02ebb32cefb72e201ed2dfed16e331aa6f9372257f0372ae4); /* line */ 
        c_0xd3463488(0xe363af86b58cd28a0c3353c8132c52b1654589c8095f0a1b8a647a2cf45bc090); /* statement */ 
votes[address(dao)][proposalId].fallbackVotesCount += 1;

c_0xd3463488(0x8e25aa872541db1b8c4a6d5cc72396f6c4f326b5f9a93c39d4ef91c6d1c56254); /* line */ 
        c_0xd3463488(0x5445e8bb31b7c6f2e7afbb172e31946e90f33c7172cbad541068babe06aa220c); /* statement */ 
if (
            _ovHelper.isFallbackVotingActivated(
                dao,
                votes[address(dao)][proposalId].fallbackVotesCount
            )
        ) {c_0xd3463488(0xa41c084456a6d5829ff99cb27ffd2b679ecb9d9eb7ca05e1485bed5df5c44503); /* branch */ 

c_0xd3463488(0xdf84b6c679f92d27e437ae7eb6d9257edc54a1e28aa7fad59dea98b3d4a406a3); /* line */ 
            c_0xd3463488(0x1490e59be106b33ac6b835f1b7797735598da2d3e82198e51bf2544d1f967294); /* statement */ 
fallbackVoting.startNewVotingForProposal(dao, proposalId, "");
        }else { c_0xd3463488(0x63ebb7381c1e13a28069a6fada7ddc8a9225fb7b8be797fe137109cc6ebbeaec); /* branch */ 
}
    }

    function sponsorChallengeProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address sponsoredBy
    ) external reentrancyGuard(dao) onlyBadReporterAdapter {c_0xd3463488(0xdf624bfd07409c767e6f646dd226789df6a16e79eb417fb7aff72708353d88a2); /* function */ 

c_0xd3463488(0xcaf913108856624fe701afa3e5d58785e2cd86701f5d61a10e8e257bbd6e9d88); /* line */ 
        c_0xd3463488(0x6d6d8fd627c9f399ca0ad7100c481e6384ed6e0d5e13ebc494bc568a9d58d9c4); /* statement */ 
dao.sponsorProposal(proposalId, sponsoredBy, address(this));
    }

    function processChallengeProposal(DaoRegistry dao, bytes32 proposalId)
        external
        reentrancyGuard(dao)
        onlyBadReporterAdapter
    {c_0xd3463488(0xdb9b67558efb229e4febff5ce8972d1542c05277aa0616f92a3b4cabbdcd5dd3); /* function */ 

c_0xd3463488(0xfb92bbc8645c073419eb81c11e8fbf59d415f617c4eec64356b986e75e42d342); /* line */ 
        c_0xd3463488(0x7bac8c0cafd3b8c000cb7306f24bb1ad9ff9e1c02bfb1b8a0856b924ff759333); /* statement */ 
dao.processProposal(proposalId);
    }

    // slither-disable-next-line reentrancy-events,reentrancy-benign
    function _challengeResult(DaoRegistry dao, bytes32 proposalId) internal {c_0xd3463488(0xeeab0349bc5a6ac0dfff9f1ba94a7f1ce328b02631d8b6e501a6bb0ce896a277); /* function */ 

c_0xd3463488(0xef172bff74ec5b9b298b1fe2570bcf726e9f9ce5a66bc5ac2e15cbc26b11e474); /* line */ 
        c_0xd3463488(0x66b8b2777b2d9f3794141527c4d03926c3cfb4609112dbe3da12e558d244355b); /* statement */ 
votes[address(dao)][proposalId].isChallenged = true;
c_0xd3463488(0x9cdbae43244028b168d363e452f0ea193a16257ba940ae2c0c5418019498146f); /* line */ 
        c_0xd3463488(0x82c0544fcd869dc3d6df80f261205d82a09df2a3bd468e00d9e908645ee9a2cf); /* statement */ 
address challengedReporter = votes[address(dao)][proposalId].reporter;
c_0xd3463488(0xadc4d7da25c60db8d45e4c29be0ee10867d66eacd08ce085635dd529f8466657); /* line */ 
        c_0xd3463488(0x703e06ede259407af0b6dc0874d74b6e378c05d2feff16146de40cf6f6e2be48); /* statement */ 
bytes32 challengeProposalId = keccak256(
            abi.encodePacked(
                proposalId,
                votes[address(dao)][proposalId].resultRoot
            )
        );

c_0xd3463488(0x4cf796d2c4d77968330aab1f8d27ed6110018b3d5c69eb3df2f7183c47312432); /* line */ 
        c_0xd3463488(0xe359229c7f8b79c2f524fd15c211cd38c160922f864f32ff1921a0e4606e9198); /* statement */ 
challengeProposals[address(dao)][
            challengeProposalId
        ] = ProposalChallenge(
            challengedReporter,
            _getBank(dao).balanceOf(challengedReporter, DaoHelper.UNITS)
        );

c_0xd3463488(0x1ade947ac195b3e397ca95b6cb7beec56e866a2d27575396b1518b87e7012c1f); /* line */ 
        c_0xd3463488(0x32b2fb0ce11a54398c443d10415bd247649e4d0dcebec91cd3f2a53fb9ef355a); /* statement */ 
GuildKickHelper.lockMemberTokens(dao, challengedReporter);

c_0xd3463488(0x562e56a5757d8b03b30bbc645da4f98a610ed2bff727b6165ce291af74a13bb4); /* line */ 
        c_0xd3463488(0x1d69f83b44740f124cd0d37a7bb07fa60aa88dd5a9b11d190277e427e326e27e); /* statement */ 
dao.submitProposal(challengeProposalId);

c_0xd3463488(0x5625e4f79b64e6afe49831c6265e9a2634c10ac7ee47358e8d1c677d7af15e20); /* line */ 
        c_0xd3463488(0xe27db97360ebf118d952968113f010e4aa7af367838ca22eb1a8ee4879d1ae95); /* statement */ 
emit ResultChallenged(
            address(dao),
            proposalId,
            votes[address(dao)][proposalId].resultRoot
        );
    }

    function _verifyNode(
        DaoRegistry dao,
        address adapterAddress,
        OffchainVotingHashContract.VoteResultNode memory node,
        bytes32 root
    ) internal view {c_0xd3463488(0xb7304ae2fe5cbbd5d20964b4e0c3f2ae7db87279d12508dedc842bf9dc6dfc93); /* function */ 

c_0xd3463488(0x5163714c5971f9f7a4826d0e318aef701eec91940fe29d9200be60bf5c93290f); /* line */ 
        c_0xd3463488(0x9cab6bb25686f578d8654ecad1d04783d71b1d37e5c2ae61a6b71604d2b24e19); /* requirePre */ 
c_0xd3463488(0x50d9bfd7bd90d8c844ee0833df296f1d935aea4d0e67df9d96edf127407f92fc); /* statement */ 
require(
            MerkleProof.verify(
                node.proof,
                root,
                ovHash.nodeHash(dao, adapterAddress, node)
            ),
            "proof:bad"
        );c_0xd3463488(0x53859a20f60fa4f207052077865c2d10a4f72dc23e61dfdf956f225273700ba1); /* requirePost */ 

    }

    function _getBank(DaoRegistry dao) internal view returns (BankExtension) {c_0xd3463488(0x734ec493621d03c635609640361e476c18927e88aa5f7b0fbf90b7e5c87d05c4); /* function */ 

c_0xd3463488(0xe807f3b8f960592d5a4678f5eb38e496e2714fb6e100d9209ada10b1c7fb67bd); /* line */ 
        c_0xd3463488(0x8edf42d2805db7b50062b8d92efe639610d2b89b673ec90a555dbcc3d79391c6); /* statement */ 
return BankExtension(dao.getExtensionAddress(DaoHelper.BANK));
    }
}
