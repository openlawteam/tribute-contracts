pragma solidity ^0.8.0;
function c_0xdcd4a78d(bytes32 c__0xdcd4a78d) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";

import "../adapters/interfaces/IVoting.sol";

import "../adapters/voting/Voting.sol";

import "../adapters/voting/OffchainVotingHash.sol";

import "../adapters/voting/SnapshotProposalContract.sol";

import "./GovernanceHelper.sol";

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

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
contract OffchainVotingHelperContract {
function c_0x74c34b55(bytes32 c__0x74c34b55) public pure {}

    uint256 private constant NB_CHOICES = 2;
    bytes32 public constant VotingPeriod =
        keccak256("offchainvoting.votingPeriod");
    bytes32 public constant GracePeriod =
        keccak256("offchainvoting.gracePeriod");
    bytes32 public constant FallbackThreshold =
        keccak256("offchainvoting.fallbackThreshold");

    enum BadNodeError {
        OK,
        WRONG_PROPOSAL_ID,
        INVALID_CHOICE,
        AFTER_VOTING_PERIOD,
        BAD_SIGNATURE,
        INDEX_OUT_OF_BOUND,
        VOTE_NOT_ALLOWED
    }

    OffchainVotingHashContract private _ovHash;

    constructor(OffchainVotingHashContract _contract) {c_0x74c34b55(0x90eade70fdbd9cfdf69b246d80ad2591252a73cbdbe6d31990e95a980f0842b2); /* function */ 

c_0x74c34b55(0xae9a5e186d8e3a84532710f86b9dee8af4cf1f1bb1b222b5a9808cb5f69a2d2d); /* line */ 
        c_0x74c34b55(0x3718ebe5494b82c8ddde7b04218f5c6825689cee4ddfcaa7829be945a1600e7e); /* statement */ 
_ovHash = _contract;
    }

    function checkMemberCount(
        DaoRegistry dao,
        uint256 resultIndex,
        uint256 blockNumber
    ) external view returns (uint256 membersCount) {c_0x74c34b55(0xa50d600791ea5e591ec2fefb04f49a27d5608c866bf92df3ef32c0ec39fe91ca); /* function */ 

c_0x74c34b55(0x533574b9dc17396c14eb2eabc200cbf31679637f6c0398572a649622164b39b1); /* line */ 
        c_0x74c34b55(0xad8980c772aea05191e5069414e4434afc40b839390f935ad67fd225b4dc107c); /* statement */ 
membersCount = BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
            .getPriorAmount(
                DaoHelper.TOTAL,
                DaoHelper.MEMBER_COUNT,
                blockNumber
            );
        // slither-disable-next-line timestamp
c_0x74c34b55(0xfa4b3beb42de0cf632923b258fad2914079d9b9512ac30a32c677e665af971cd); /* line */ 
        c_0x74c34b55(0x06f205b6339715b3f20d5786e8fd606d4ceeac6ca71e0cddbea3a4bcd650bb3f); /* requirePre */ 
c_0x74c34b55(0x2cc19a966fdc99c8723a7bad31478205928fc0fa502f8d294beb50c69ca49ca1); /* statement */ 
require(membersCount - 1 == resultIndex, "index:member_count mismatch");c_0x74c34b55(0xc62552a65202172da3e31aa3f33aa479a45bf635c529d74cc602c0015ad30f96); /* requirePost */ 

    }

    function checkBadNodeError(
        DaoRegistry dao,
        bytes32 proposalId,
        bool submitNewVote,
        bytes32 resultRoot,
        uint256 blockNumber,
        uint256 gracePeriodStartingTime,
        uint256 nbMembers,
        OffchainVotingHashContract.VoteResultNode memory node
    ) external view {c_0x74c34b55(0xc294600554ba7c2f78542236baaecc298f047d02ea6cdf355d2ae2c07b12cec4); /* function */ 

c_0x74c34b55(0x4e34ad35ee39c673741a885107d1ad6d2d6be5da2233757e37079292c6180220); /* line */ 
        c_0x74c34b55(0xe3d91c9686cfbe6e79ecae0dde025272fa4fc6bd1678981a94ccecf344657252); /* requirePre */ 
c_0x74c34b55(0x62c4dbb25e9b0503b84e29f8ffbd719c58c55ef1356225fb9aa90b3fb7c6b820); /* statement */ 
require(
            getBadNodeError(
                dao,
                proposalId,
                submitNewVote,
                resultRoot,
                blockNumber,
                gracePeriodStartingTime,
                nbMembers,
                node
            ) == OffchainVotingHelperContract.BadNodeError.OK,
            "bad node"
        );c_0x74c34b55(0x66cb6243835bbb720ae040db6d21f8834df5a998d9571a5beaa694d433822397); /* requirePost */ 

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
    ) public view returns (BadNodeError) {c_0x74c34b55(0xb431b14aa7c7ade9182aa8106c4a58c87c0f9a0e98a68d8b6f404d8a71179c37); /* function */ 

c_0x74c34b55(0x99b9232e88013aaee15bfe5e4addbf00857d6fb63082b72e18feccfb2015bf4e); /* line */ 
        c_0x74c34b55(0x450dd5de66900ce960d92d03329160ac7d2755a6cd31957df9298c9e9985ef34); /* statement */ 
(address actionId, ) = dao.proposals(proposalId);
c_0x74c34b55(0xa1d62f0999eba52f3cdebb59cfa42e235fc976924de1a80c7269a19e707092ac); /* line */ 
        c_0x74c34b55(0xa96ce1f244301a35f0e150208d65a23c26df51db5162bdc0f95228443844f69c); /* requirePre */ 
c_0x74c34b55(0x49d5af88fb6f6825b0818d2db4d0e3813b51549a4522050919a234f0f2d59757); /* statement */ 
require(resultRoot != bytes32(0), "no result available yet!");c_0x74c34b55(0x7010f4544a05b8565d3cffa8b8a6256cc04a3d55c93dc9a7255374fdd65f6eca); /* requirePost */ 

c_0x74c34b55(0x88416f468931796d4d5a93dbcd6582e3d060e8831dd90ff58d2cf45aeaa0478b); /* line */ 
        c_0x74c34b55(0x590c66d44ef723d87554b6828fb5e2899892bfdae545943323c1b23644c2d8da); /* statement */ 
bytes32 hashCurrent = _ovHash.nodeHash(dao, actionId, node);
        //check that the step is indeed part of the result
c_0x74c34b55(0xa015f681d671a7d5f87e7726399bf94949fcf7728de10dc47f464c1ea5905e3a); /* line */ 
        c_0x74c34b55(0x7cccf4b3befa8e2152b7fc6550b09d38ac6443dd4f63e7111e42befde5d5e2de); /* requirePre */ 
c_0x74c34b55(0x57cab4bd0b72ce3a82e7554c631dc87c8bd6936081f1e4f2056f84e7c2ac2c4f); /* statement */ 
require(
            MerkleProof.verify(node.proof, resultRoot, hashCurrent),
            "proof:bad"
        );c_0x74c34b55(0x3650657543e60b57703d3085a1de11452991af4ac0cb67ea2ef8d48f698bf475); /* requirePost */ 

c_0x74c34b55(0x021370e3d3ba4817f61c9ad96846e6250d720c14066ac942b03b5eba0885ae99); /* line */ 
        c_0x74c34b55(0x71fe8b0975f5fd70b34d435c8d2703d83d037cb1b3027dee4db2ec3aed614fee); /* statement */ 
if (node.index >= nbMembers) {c_0x74c34b55(0x4d8d82bbcbaaf6f68c6154b58bd37e8678e65a7b2e17eda9dd5dcffebc65b357); /* branch */ 

c_0x74c34b55(0xf48c5b4b8806aede456888f0c270ac314519715581135c8e3c5efbb35a24ea22); /* line */ 
            c_0x74c34b55(0x81c04c73cb6f05fba38db78e297d5e7d1461d4bcdb0a23585f2146475f621921); /* statement */ 
return BadNodeError.INDEX_OUT_OF_BOUND;
        }else { c_0x74c34b55(0x77fd15f721ad26022a95c36f0ed39a8af64f0e3c2946855368e88b241080f32a); /* branch */ 
}

c_0x74c34b55(0x4ca93542432bf1b410dbcdb56055ed7fdc18f9eb49f09d20fb86196e868f7fba); /* line */ 
        c_0x74c34b55(0x998245919833b355f0e09e57c107aeb96af0ce13374bd8fbf5972e5feef737bc); /* statement */ 
address memberAddr = dao.getMemberAddress(node.index);

        //invalid choice
c_0x74c34b55(0xbb8754ce188fab6ae3873b440ef2531ef85b916bcc4d91e41f2e374b7295b384); /* line */ 
        c_0x74c34b55(0x2e2c9f92217b7bc0be607fb228d20d9832ebc14586e8c01d004055e8bd736498); /* statement */ 
if (
            (node.sig.length == 0 && node.choice != 0) || // no vote
            (node.sig.length > 0 && !isValidChoice(node.choice))
        ) {c_0x74c34b55(0x2e498e65b33c8bc387bb4d338a776482f3276a5fa3c9fa14b4e1a43ff319ab2c); /* branch */ 

c_0x74c34b55(0x8e9064c730d16ce17d470c003169a695a386277541dccfb4be29a0bfeb88e8d1); /* line */ 
            c_0x74c34b55(0xfa6f604910cb258d30c92bb4511913d60847569901059c4dc9e4a020494454dc); /* statement */ 
return BadNodeError.INVALID_CHOICE;
        }else { c_0x74c34b55(0x6c7c74d805f27af119261057fab5c226c46405bc6de615661eb3ad20f000d5fc); /* branch */ 
}

        //invalid proposal hash
c_0x74c34b55(0xf345d050fdbf3647185a20e225df74ff30c07396fd94085a3d781bbfa425996a); /* line */ 
        c_0x74c34b55(0x9002e5c61bbc9afb2891fa90546cf0eb28a942e4e25a3323709898ef52608025); /* statement */ 
if (node.proposalId != proposalId) {c_0x74c34b55(0x916bf0bab81f4b5e0ad6232bb9f368531d5713f4ea061a92a82d247aec0bebbe); /* branch */ 

c_0x74c34b55(0xba53373b6a24e3d92ec0f2a7a75608a29c3c48a2306b76281ef9d2a320892044); /* line */ 
            c_0x74c34b55(0x9ea9198035b999130e0e2de80b7b1be80d8e50d6637b8045ab2ba8816512984e); /* statement */ 
return BadNodeError.WRONG_PROPOSAL_ID;
        }else { c_0x74c34b55(0x49f093783372af7a27462fe43c320fc8229fcaf9d28219aa9721749226f94de2); /* branch */ 
}

        //has voted outside of the voting time
c_0x74c34b55(0x851c9eed88e6771b02ae6a4635cf0135fcadb9e4187139c2399626d914869667); /* line */ 
        c_0x74c34b55(0x06e28bb44810bbcbc59b9d608c6614dbe1293673c0af66d2c6e67b6181b46d7d); /* statement */ 
if (!submitNewVote && node.timestamp > gracePeriodStartingTime) {c_0x74c34b55(0x9d0cbba54dfecb7962174cccbf171e7c7129b1124cd123a903f01436b749e8d1); /* branch */ 

c_0x74c34b55(0x3921f595c8d19a3e071e93a4601865af2a740d4a9371c1e64fbecbad47224aa6); /* line */ 
            c_0x74c34b55(0x414e7613909e0dca11f20d32d1d3e60897b7063273252637767f2cfb8234c52d); /* statement */ 
return BadNodeError.AFTER_VOTING_PERIOD;
        }else { c_0x74c34b55(0xdcb14499cac5b0ca7d7c0bca00849fe1da76b17faeff4f389c5d04aabfe4d735); /* branch */ 
}

        //bad signature
c_0x74c34b55(0x5878ead9fd46db6f6f2fd521690c2bda3dc947ec82fb7d31a1a5e0fa46bd3ad2); /* line */ 
        c_0x74c34b55(0x290e227e38c2656aaedc71801b3d9fccc5fc8441c0b3090ebc6551e148644472); /* statement */ 
if (
            node.sig.length > 0 && // a vote has happened
            !_ovHash.hasVoted(
                dao,
                actionId,
                dao.getPriorDelegateKey(memberAddr, blockNumber),
                node.timestamp,
                node.proposalId,
                node.choice,
                node.sig
            )
        ) {c_0x74c34b55(0xf48b7b85e872f4a145ed59710256776ea5063ee821c9b2bebc3bcd0b2f573215); /* branch */ 

c_0x74c34b55(0x60741ccee92d8f1473542e355c65213fe3299ac09981263933430a8dd336c1bb); /* line */ 
            c_0x74c34b55(0x6c561ce276a18f32ca88d29237236a0f215a8b5ce67325d8cded0b26e14c1402); /* statement */ 
return BadNodeError.BAD_SIGNATURE;
        }else { c_0x74c34b55(0xc9586e28211c35d98c4120218dcadffc76ee3a5269b4f4e03afdabf928740964); /* branch */ 
}

        // If the weight is 0, the member has no permission to vote
c_0x74c34b55(0x38982fc8014dfaf802fcd6b3d59e5b451dd5005efc52fb0c7c91995911f1cf8d); /* line */ 
        c_0x74c34b55(0xe00bbf4a48e431932e0cf020436a1df4bc9021aab48837c369fbbe4000a53966); /* statement */ 
if (
            node.choice != 0 &&
            GovernanceHelper.getVotingWeight(
                dao,
                memberAddr, // always check the weight of the member, not the delegate
                node.proposalId,
                blockNumber
            ) ==
            0
        ) {c_0x74c34b55(0x801be4c1ad98d888e2cbe5d6fe1d8bda6df70fdcfaa856a8ea95c1aab5282b6b); /* branch */ 

c_0x74c34b55(0x11ce39961d2f8f104176ef68bb52970ff6b4e10cb47b5e114ab38ab91ed5f75e); /* line */ 
            c_0x74c34b55(0x9db8b8eaa5b1aa18e56bd8ac4410b4fd085e5d264d1893ac360827698125eb4d); /* statement */ 
return BadNodeError.VOTE_NOT_ALLOWED;
        }else { c_0x74c34b55(0x88fe15130a403a45068fa0e26efb2c6d4d2dbbb43e40868348b429d345175048); /* branch */ 
}

c_0x74c34b55(0xfe6c0a8933d070dc218386a98d64d346d29aa34201f7ecc3d809587274dc4c84); /* line */ 
        c_0x74c34b55(0x17f41930ccce39cc7e573223de21fb46ed35e2d533771f04c2cacb2961e9061f); /* statement */ 
return BadNodeError.OK;
    }

    function getSenderAddress(
        DaoRegistry dao,
        address actionId,
        bytes memory data,
        address,
        SnapshotProposalContract snapshotContract
    ) external view returns (address) {c_0x74c34b55(0x4cb9506504f26f0f037e65a83c7f246b22ef44bddbaa15a4962d8ed496519ac1); /* function */ 

c_0x74c34b55(0xa39a839c09082c074a9e367d0cebf6e059f4b3eb2d8795b828025e797e9e7ddc); /* line */ 
        c_0x74c34b55(0x2d161a23b51baff5b5dcfd8c2fe87090df70b47a40e99aa9eca1f0e7c8f35005); /* statement */ 
SnapshotProposalContract.ProposalMessage memory proposal = abi.decode(
            data,
            (SnapshotProposalContract.ProposalMessage)
        );
c_0x74c34b55(0x3079e2504ffb4e9d9ab7efedbeeb587efb0f94b0c8c70ab47e235c2a64b6931f); /* line */ 
        c_0x74c34b55(0xa16e001007d98279c9a63c03c56c3f77e1a4b91c16c68e9a29d9fcbefc9c2f44); /* requirePre */ 
c_0x74c34b55(0x353801108b65ec160d21cc4c67fa8d3ee82e190a859471baaa7721fd42207540); /* statement */ 
require(
            SignatureChecker.isValidSignatureNow(
                proposal.submitter,
                snapshotContract.hashMessage(dao, actionId, proposal),
                proposal.sig
            ),
            "invalid sig"
        );c_0x74c34b55(0x5938ad74441b8389a71619511677f22e0778459287894975a7e56c35f0d6a99b); /* requirePost */ 


c_0x74c34b55(0x69f67fa6f4d567ea1193e6c4a157404581dbb7b844a4fc7e9bd42eae581f3b23); /* line */ 
        c_0x74c34b55(0xc1a01ebd8f04551c576013df68d376f36c5aee155fe6f21751d41c157451e636); /* statement */ 
return proposal.submitter;
    }

    function isValidChoice(uint256 choice) public pure returns (bool) {c_0x74c34b55(0x3eb470659bd5a1022bce562a1a9afc820af5974b2a65bb86dfa6c124dc91555f); /* function */ 

c_0x74c34b55(0x53e1e65a2d79a1a1fdeddb31a0852211e7de31c83a6648b0195f269b5780348f); /* line */ 
        c_0x74c34b55(0x28e2d10a59f8064ac8381f49733840ad42fcf1b8a13b4815513617e511ddd7fa); /* statement */ 
return choice > 0 && choice < NB_CHOICES + 1;
    }

    function isFallbackVotingActivated(
        DaoRegistry dao,
        uint256 fallbackVotesCount
    ) external view returns (bool) {c_0x74c34b55(0xd413b53ccaf0661e785e0d90efc08f5cf070b218e21e606c7a54b8ada6a86824); /* function */ 

c_0x74c34b55(0x83979bba97a44ba79a325867b1db7d015a20d74ba20d17b3d87865001456e27f); /* line */ 
        c_0x74c34b55(0xa4cdff8316f30f7380aec1959731a73143f564b238ee8fa74a92c12f9e7c44d1); /* statement */ 
return
            fallbackVotesCount >
            (dao.getNbMembers() * dao.getConfiguration(FallbackThreshold)) /
                100;
    }

    function isReadyToSubmitResult(
        DaoRegistry dao,
        bool forceFailed,
        uint256 snapshot,
        uint256 startingTime,
        uint256 votingPeriod,
        uint256 nbYes,
        uint256 nbNo,
        uint256 blockTs
    ) external view returns (bool) {c_0x74c34b55(0xaeb4bc724ba13d0fd88dcd93feb424a96e9d395ca202f3b7be62ce1184fac78e); /* function */ 

c_0x74c34b55(0x783b5c688b64902a6fac7418b48c42c5d3bb31fa2e1093571a3caa55ee102001); /* line */ 
        c_0x74c34b55(0xab794f4c50924ccfd2007a8fe290a4aae55ef93e1875b1001fb4269613c82325); /* statement */ 
if (forceFailed) {c_0x74c34b55(0x0c1cc2ed5554236dc4f85eba5841fae1524328ad2c4668d8b1b3fc58d3860392); /* branch */ 

c_0x74c34b55(0x17c3ae002105b82e509217a438957928e8e20957c4ac80f6f2ab0bfa447b0c8c); /* line */ 
            c_0x74c34b55(0xb85ea809772098cf3ab54b8ff7b3957b267318e484f87ce58d9cedc69d26fb3c); /* statement */ 
return false;
        }else { c_0x74c34b55(0x417ed4c1b7acc89fcac3042f5101dc281ec88d1efd7e92e540502dd38c065df9); /* branch */ 
}

c_0x74c34b55(0x937363947e16415c7c40156dfd54009b1aea5cb86d61008b4d82a7b3a2b41a83); /* line */ 
        c_0x74c34b55(0xe4f608ff2add1151bbf472362ac0c699ba35924e3a9ddd5538d3331cee365b64); /* statement */ 
uint256 diff;
c_0x74c34b55(0x26f416209bd0a6db654306bfcfe44c7320af0eab9b2b2a7ad839e04eda11208a); /* line */ 
        c_0x74c34b55(0x5bf9be408cb5ab819e3f21ca37d4a35799151e961a8b493469eeb61d4f68149f); /* statement */ 
if (nbYes > nbNo) {c_0x74c34b55(0xe29182dde25910b3d97da3a594fbfb971e767c3c3552ada5be44316bf8ade5a7); /* branch */ 

c_0x74c34b55(0x127de89691b04bc831cc2c52aafde4e504b589cbc4e7075abde60e3e9221b083); /* line */ 
            c_0x74c34b55(0xadf7fa065a5b3975dc48e36aa968915017bafb5ab71a015e3f037b9650d168b7); /* statement */ 
diff = nbYes - nbNo;
        } else {c_0x74c34b55(0xdcf124e8e2192125b6a4090b16daffadb297f11847496da443a816246ee88a9e); /* branch */ 

c_0x74c34b55(0x6aadab4be20f7981f1909717472cf352c1f11ddba01bd01975a976e85226f0f8); /* line */ 
            c_0x74c34b55(0xfdd8f76a64dd15a1d1fa419c359301fc82f6c80d11075eccbbf1f4fb8c6e1719); /* statement */ 
diff = nbNo - nbYes;
        }

c_0x74c34b55(0x26b49283371080730c7fdac25e1bf2ec1891a669daea28409797bf005a897126); /* line */ 
        c_0x74c34b55(0xfb69fdf516bd4ff59ad4f6c17a7149923ded8f7fbfc1c246f5a7e2b6ce6d5b9b); /* statement */ 
uint256 totalWeight = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        ).getPriorAmount(DaoHelper.TOTAL, DaoHelper.UNITS, snapshot);
c_0x74c34b55(0xa8de9fbb513942ec7772e3a1a99a349e04c319efb88167cdbd76c1edcc01fd99); /* line */ 
        c_0x74c34b55(0x1d0a66f96712e960bd028bcdbc5ade8be9c934f9cebac0ee1fdac07e4c467724); /* statement */ 
uint256 unvotedWeights = totalWeight - nbYes - nbNo;
c_0x74c34b55(0x3cd7969604b298cb16e27ade40a6f16dd1c0de0ed59eeb7d923f0cb5dbfdbe4f); /* line */ 
        c_0x74c34b55(0xd6a6da16ca40e5f9cf92105cba65373a1cb13b4b1306d00335988d54b0abc5a8); /* statement */ 
if (diff > unvotedWeights) {c_0x74c34b55(0xfd2782403d4efc4d8e97091646e2530cab8afb6293a4e8f21e05c99c8d03b23b); /* branch */ 

c_0x74c34b55(0x54f627ab02b8716ef653db39351aab1549f340337796dae410b237f5cab057d1); /* line */ 
            c_0x74c34b55(0x4efc9432f2139d76fa6770df03e71b6097eadbfd997192a57b8c836399347cd4); /* statement */ 
return true;
        }else { c_0x74c34b55(0x5650a1ea9b939a2ffb4491f28200a01e1d25322db35e60246c2aa888c567bd16); /* branch */ 
}

        // slither-disable-next-line timestamp
c_0x74c34b55(0x9ad1ca24433e2a338e7c7822f61a8a54ae6867e7b59c6e5b4827badf0d4c70c4); /* line */ 
        c_0x74c34b55(0xdfc816bd3a1a983538788a166e49d7effd99c12d43dc6a3bf4d826ea54629845); /* statement */ 
return startingTime + votingPeriod <= blockTs;
    }

    function getVoteResult(
        uint256 startingTime,
        bool forceFailed,
        bool isChallenged,
        uint256 stepRequested,
        uint256 gracePeriodStartingTime,
        uint256 nbYes,
        uint256 nbNo,
        uint256 votingPeriod, // dao.getConfiguration(VotingPeriod)
        uint256 gracePeriod //dao.getConfiguration(GracePeriod)
    ) external view returns (IVoting.VotingState state) {c_0x74c34b55(0x84a200db54e26b5a84fb4ea7cb2708af2aa9f80caa75505fbcb642351eedab3f); /* function */ 

c_0x74c34b55(0x573b48410e700dec09bf4797770f95e84a4a9199bb9078ab32d44c10cfcb152b); /* line */ 
        c_0x74c34b55(0x0c6029e0723b8e7b052123e81cd284ba4fd3b2c7fc4d6b7bfdbb0ecf4269776c); /* statement */ 
if (startingTime == 0) {c_0x74c34b55(0x67328e03e5964058f21ba53131208217108dade1825c204f300afdef8dfbaf75); /* branch */ 

c_0x74c34b55(0x6acdb9ce1446e3cb1fc5b4360371b45b5f6aebee33ae75f4790905fff21613af); /* line */ 
            c_0x74c34b55(0x1404f14dce56836eff824911d85bee95a358365e9623ac9514c777bd775869e2); /* statement */ 
return IVoting.VotingState.NOT_STARTED;
        }else { c_0x74c34b55(0xdc823f1b0fdffb8e0c930a12743b0a9f8bdfe3a8c8b0a2ab9223c06eb22cb7ae); /* branch */ 
}

c_0x74c34b55(0xb201c45c4318c4e214ec8f9f9cb9b9a1556d676d93a91eb3737f1f5429baec8f); /* line */ 
        c_0x74c34b55(0x4c0b7dec69ab8076be660a894311dc1964965b1108aafd5eeaa26661947ec514); /* statement */ 
if (forceFailed) {c_0x74c34b55(0x8eb145665a33320dea70cf90b275a0bae3832e9d6a0c281370316c36c05dcde3); /* branch */ 

c_0x74c34b55(0x57aa40281a76871c7592b6060805c1556ab5ca42c906ce5afc35eb3b7918d811); /* line */ 
            c_0x74c34b55(0xc5bcebd26d171abd33990786ea72d2df2fbc188bd7685d221042f5dd2b486de1); /* statement */ 
return IVoting.VotingState.NOT_PASS;
        }else { c_0x74c34b55(0x89c106c4ddff57f81a285a299c3c7f78645c05f390a3fb08d7b156e4e8a7f08f); /* branch */ 
}

c_0x74c34b55(0x8c866e2d9eac1e20c759cae8eab1f1a519dabe8814180b7d57191b94b586b98d); /* line */ 
        c_0x74c34b55(0x8a11edfb6cd352528b6f7ef991f5656c070ee1e8d1ffce9cdec8fa92bda3cb21); /* statement */ 
if (isChallenged) {c_0x74c34b55(0xae701102243877dda23142c3a54809dadcff26b04ab3217b8c63ba4840f8d4ab); /* branch */ 

c_0x74c34b55(0x7c7885d9e4ba22fcfffdc52872657351a38c5730eb4cf94bbd65df1965ddf719); /* line */ 
            c_0x74c34b55(0xe1199dec11ba0cd4fb72d9e64cfbc096ed71bb0ddbc03a05787a8308c165d15e); /* statement */ 
return IVoting.VotingState.IN_PROGRESS;
        }else { c_0x74c34b55(0x92e68874c781617cd74a4811fe934e8c843d84cfd052bb08b35982f91a463554); /* branch */ 
}

c_0x74c34b55(0x23d55199b58b1b2f6096f6e8c46c4221fdbd17b5d95b8129d45e5d1b3c325466); /* line */ 
        c_0x74c34b55(0xd71bc5e4ad23d16a7fccea48dc81d1623d30b8e1497c8aa50fa1388e4364600a); /* statement */ 
if (stepRequested > 0) {c_0x74c34b55(0x7b347832210030729e05ceaa3adb3bedf0d8e179e18d5c4bc5551163a9996de1); /* branch */ 

c_0x74c34b55(0xd0e353c20fd7018b665748e0b4ae1cbd1ceb2e86ec0493035cb07d441bd93118); /* line */ 
            c_0x74c34b55(0x5e438364ef4e72e8084251c133f88acceed9f0cd9e6b73d4531545ee18c9b785); /* statement */ 
return IVoting.VotingState.IN_PROGRESS;
        }else { c_0x74c34b55(0x62b94138ff2f327899fe281af3c1f1fbc4054bfb47cb1567136fffc6a66a7b0d); /* branch */ 
}

        // If the vote has started but the voting period has not passed yet,
        // it's in progress
        // slither-disable-next-line timestamp
c_0x74c34b55(0x9d2a23519319998796e35a6e1e2e4ec9d969a2c6a05d8b8f043e4dcd8f2cdb95); /* line */ 
        c_0x74c34b55(0xa7a8dfc2fb59491ef6f657345cd874afa455bedbe9ad0bcec836e06250f59361); /* statement */ 
if (block.timestamp < startingTime + votingPeriod) {c_0x74c34b55(0xb2d16e809e4141d6f54897f41b21986f4eb06d0fa119dba1e8ca0cd24f3a020d); /* branch */ 

c_0x74c34b55(0xccfd736e59c97236c6fbd289dfe9b4e5af9bfde9e822aceece55a0a9d0e71f47); /* line */ 
            c_0x74c34b55(0xb34edc5630ea8b676ffe288cd086e680a70ffa92f6081e0993b852df799dca47); /* statement */ 
return IVoting.VotingState.IN_PROGRESS;
        }else { c_0x74c34b55(0x7d30eb7b24559f1d379a0e0f1f8fd62527b09443996c121809eae4cb56994049); /* branch */ 
}

        // If no result have been submitted but we are before grace + voting period,
        // then the proposal is GRACE_PERIOD
        // slither-disable-next-line timestamp
c_0x74c34b55(0x1577087ebfb5f06b3340411458cdf689a98f3761b32214454a07d1cd1b9bf4bb); /* line */ 
        c_0x74c34b55(0xd6574b7898c75deea37872ad59b7734d4556b0c93b63a3a1b9c1f2fed49de9f5); /* statement */ 
if (
            gracePeriodStartingTime == 0 &&
            block.timestamp < startingTime + gracePeriod + votingPeriod
        ) {c_0x74c34b55(0xa210dbc3d8745a1f2c5a68f5a9a0b18bf0b2c8415dcb2d9110b1a208b3344119); /* branch */ 

c_0x74c34b55(0xe762d9c959bc87aa2f2a6b2caa0268323b4029a9a78978c68e66ea11e1a36bb6); /* line */ 
            c_0x74c34b55(0x4de5d0f5ed8591d1e54e1669ec62a034dde33d5d98fdb5353a679fcf9028d3a8); /* statement */ 
return IVoting.VotingState.GRACE_PERIOD;
        }else { c_0x74c34b55(0xd680faf574f5ee5e26fba4edeff00a53836fc5b9d133471f10bab3d29ffa8bac); /* branch */ 
}

        // If the vote has started but the voting period has not passed yet, it's in progress
        // slither-disable-next-line timestamp
c_0x74c34b55(0x168ea655d542ea083ca5a647d71958bd436ef20f443ec1105339a0e1ee281dad); /* line */ 
        c_0x74c34b55(0xcfc6bf46b8a83d55b48ac87a581a3a0dcf215a380e31c73857976190d8954094); /* statement */ 
if (block.timestamp < gracePeriodStartingTime + gracePeriod) {c_0x74c34b55(0x9f229c6c6d8746c6e5fc044e27d9cd3ab658d84b8db654f20e35367183111cfa); /* branch */ 

c_0x74c34b55(0xd436c75d263c144db0488eb56304b666a798e5e9b4671f5bc497f90ddbee0434); /* line */ 
            c_0x74c34b55(0x7f1b81b262d310ef98e40e23882344c9463d994e0666929ab495ff71b3035e14); /* statement */ 
return IVoting.VotingState.GRACE_PERIOD;
        }else { c_0x74c34b55(0xafab86958788b02ec2aec2144912a2b956dff1eca42b150246d96a3eb5fdd139); /* branch */ 
}

c_0x74c34b55(0x1b0b492bb226b01747c3f137c6dcf7b7bf37e550e86ec2847285c0c803b0cb04); /* line */ 
        c_0x74c34b55(0xf59e29ae28c03d77b020aae66a32c31dc91167baa8513863a1bce2b684359796); /* statement */ 
if (nbYes > nbNo) {c_0x74c34b55(0x9b0a0b81cc3181eb08fb5bc28d13c6765bbcd4186c5229968e46b09bcc387ea1); /* branch */ 

c_0x74c34b55(0x76c61c73f1b1371e6ea1d60eb6d2246d9dec4c9960a99814f92c340a6928cb64); /* line */ 
            c_0x74c34b55(0x049d88fb96e4419e1119b0dda066db0c0349b3837579158704bdcdd1f5035ab2); /* statement */ 
return IVoting.VotingState.PASS;
        }else { c_0x74c34b55(0x22e648de92b3878b7e03570f52173c8ad10cd796f91a8b6648badc580ca48c65); /* branch */ 
}
c_0x74c34b55(0x7b2360f6c62e50f7fd2483f935d0cc8fa98562f53ed100ca0c7a09460f2e7fb6); /* line */ 
        c_0x74c34b55(0x8f80ec6a1f6f53bffe96ec1a4ee94b36f263635cec432b7dd008c6e34ea2ea6e); /* statement */ 
if (nbYes < nbNo) {c_0x74c34b55(0x90dc260187c8b6910f8944130e1f0210ed7435a1cb851c379699e9a6fc647bc9); /* branch */ 

c_0x74c34b55(0xea4afbf0a9cff80555d787ffe66b6ce85b165ae9339407baeb5836d6bfd901c7); /* line */ 
            c_0x74c34b55(0x5b25688aa91f458cd456e7a6e482d6cd79213af6072f40086f8c692249b30b33); /* statement */ 
return IVoting.VotingState.NOT_PASS;
        }else { c_0x74c34b55(0xfcfef697f1712e91a6f71faa7d3dcaed0fc7b0593575dbf012b8d7fb12ceafec); /* branch */ 
}

c_0x74c34b55(0x7cb874b8fe591c3764bea0f5445c107f089bc82427eeb4310a582e99290d5d7b); /* line */ 
        c_0x74c34b55(0xe38765a1845a35f8bcc02144254eac4c24ea02225e8dfb25ab42db57d40179e6); /* statement */ 
return IVoting.VotingState.TIE;
    }
}
