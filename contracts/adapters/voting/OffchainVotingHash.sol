pragma solidity ^0.8.0;
function c_0x9c0082f9(bytes32 c__0x9c0082f9) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/bank/Bank.sol";
import "../../extensions/token/erc20/ERC20TokenExtension.sol";
import "../../utils/Signatures.sol";
import "../interfaces/IVoting.sol";
import "./Voting.sol";
import "./KickBadReporterAdapter.sol";
import "./SnapshotProposalContract.sol";
import "../../helpers/DaoHelper.sol";
import "../../helpers/GovernanceHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
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

contract OffchainVotingHashContract {
function c_0x4f74b545(bytes32 c__0x4f74b545) public pure {}

    string public constant VOTE_RESULT_NODE_TYPE =
        "Message(uint64 timestamp,uint88 nbYes,uint88 nbNo,uint32 index,uint32 choice,bytes32 proposalId)";
    string public constant VOTE_RESULT_ROOT_TYPE = "Message(bytes32 root)";
    bytes32 public constant VOTE_RESULT_NODE_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_RESULT_NODE_TYPE));
    bytes32 public constant VOTE_RESULT_ROOT_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_RESULT_ROOT_TYPE));

    bytes32 constant VotingPeriod = keccak256("offchainvoting.votingPeriod");
    bytes32 constant GracePeriod = keccak256("offchainvoting.gracePeriod");
    bytes32 constant FallbackThreshold =
        keccak256("offchainvoting.fallbackThreshold");

    mapping(address => mapping(bytes32 => mapping(uint256 => uint256))) flags;

    SnapshotProposalContract public snapshotContract;

    struct VoteStepParams {
        uint256 previousYes;
        uint256 previousNo;
        bytes32 proposalId;
    }

    struct VoteResultNode {
        uint32 choice;
        uint64 index;
        uint64 timestamp;
        uint88 nbNo;
        uint88 nbYes;
        bytes sig;
        bytes32 proposalId;
        bytes32[] proof;
    }

    constructor(SnapshotProposalContract _spc) {c_0x4f74b545(0x7176b871d2185aa4dcb9bb2a6dc6f28474ba6d0077e2847300e22f614c9fb651); /* function */ 

c_0x4f74b545(0x80899767def86695a6cd70514768d5b94fa0030ed4b4200c7185e52e1ee58b87); /* line */ 
        c_0x4f74b545(0xe2f25644d7c86f86cd4df829cce14407b4b1c2d4659ae93d39c26de7b7cd4dbd); /* requirePre */ 
c_0x4f74b545(0x68ba7c1848da8f50d4d683e2cf50a850b43226863d70e690f318639c7b9706c6); /* statement */ 
require(address(_spc) != address(0x0), "snapshot proposal");c_0x4f74b545(0xdfe584db8b741dc903ba165b84dae2e760965bee72de86f29ef88425757706f7); /* requirePost */ 

c_0x4f74b545(0xd9db2a4f50b7b16c0ad4702fbf3d21afad9c0be49999b1a17d91f2f99ff50cf6); /* line */ 
        c_0x4f74b545(0x50679d5964d2a1cf152cac1d44080fcfbed776370992a40ab1a20c1559e0059e); /* statement */ 
snapshotContract = _spc;
    }

    function hashResultRoot(
        DaoRegistry dao,
        address actionId,
        bytes32 resultRoot
    ) external view returns (bytes32) {c_0x4f74b545(0x6634636be0b3f9c26083142cddad2e72a9e7c356378f2b0cc9ca821c8b6989ee); /* function */ 

c_0x4f74b545(0xaec671fc41c7e91c01b199d8881f33bb00dff6eace9608d16d2168fcfc7b0cf8); /* line */ 
        c_0x4f74b545(0x410f1555139db9d8add04f195840e9822c5b575fa72b917048aa85739b57e3c8); /* statement */ 
return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    snapshotContract.DOMAIN_SEPARATOR(dao, actionId),
                    keccak256(abi.encode(VOTE_RESULT_ROOT_TYPEHASH, resultRoot))
                )
            );
    }

    function hashVotingResultNode(VoteResultNode memory node)
        public
        pure
        returns (bytes32)
    {c_0x4f74b545(0xbcfd5b833d12bd158deb27de8b9a07b5b0159f43074ebee2cd5f2e4f84fd16fc); /* function */ 

c_0x4f74b545(0xea64cb05c7175319b930ce290a47af70e19ce43f0ed263b2aabc44615e31186c); /* line */ 
        c_0x4f74b545(0x2c5763966203999e16898b943a40c2b4022070a14f80df2718a9b8c010cd7c89); /* statement */ 
return
            keccak256(
                abi.encode(
                    VOTE_RESULT_NODE_TYPEHASH,
                    node.timestamp,
                    node.nbYes,
                    node.nbNo,
                    node.index,
                    node.choice,
                    node.proposalId
                )
            );
    }

    function nodeHash(
        DaoRegistry dao,
        address actionId,
        VoteResultNode memory node
    ) external view returns (bytes32) {c_0x4f74b545(0x04f045637b6a0d9e644d9348dc627cc90963aac81543c02bf006d021b909cbfe); /* function */ 

c_0x4f74b545(0x2cd777a30d33583d6f936f7cdafeb60cd59530dc54532d4320ca55359c785a89); /* line */ 
        c_0x4f74b545(0x0418d807392c661520c8f4bfd2d482926e8dbd2264ffa60a1095c8add0ea8ec0); /* statement */ 
return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    snapshotContract.DOMAIN_SEPARATOR(dao, actionId),
                    hashVotingResultNode(node)
                )
            );
    }

    function hasVoted(
        DaoRegistry dao,
        address actionId,
        address voter,
        uint64 timestamp,
        bytes32 proposalId,
        uint32 choiceIdx,
        bytes memory sig
    ) public view returns (bool) {c_0x4f74b545(0xdf9740ae14c0f2bf698535d86f4de2c905c698bff0019abf0027cbce6ebe4cbd); /* function */ 

c_0x4f74b545(0x16b753b0c94ac60f290c315c9c0d6ced6ccabf56f5dff79900701daa441a124f); /* line */ 
        c_0x4f74b545(0x3d4893060f609ad8a4a21cecf7263c70789d1fe87cec8e1f8a9ecbb71f589001); /* statement */ 
bytes32 voteHash = snapshotContract.hashVote(
            dao,
            actionId,
            SnapshotProposalContract.VoteMessage(
                timestamp,
                SnapshotProposalContract.VotePayload(choiceIdx, proposalId)
            )
        );

c_0x4f74b545(0xa5444c5e2f27c4fde99d0f1cfb7298a388506dd8d7fae7b573de0897fce8d5da); /* line */ 
        c_0x4f74b545(0xdf30e81dffbda6f7f18538be76b9341632b709e72de269c33275c95807dd7972); /* statement */ 
return SignatureChecker.isValidSignatureNow(voter, voteHash, sig);
    }

    function stringToUint(string memory s)
        external
        pure
        returns (bool success, uint256 result)
    {c_0x4f74b545(0xd984156babe383a31f2b09bdf7ead1bee66eff1dc324fdd0946d542d6e9796d5); /* function */ 

c_0x4f74b545(0x01744d1ab6bb448f8d74a41f1bda3c378292507af0c435e8c9d15aac84821c51); /* line */ 
        c_0x4f74b545(0x11fb8989bd9a56c3a357d26b58ac9a2f8a619a007b30cf9ba8524c4dc28ef435); /* statement */ 
bytes memory b = bytes(s);
c_0x4f74b545(0x9e34de382b5aa1bfc8ca94202ccefecb148e5c341eed09efb50a9eb890a03a5d); /* line */ 
        c_0x4f74b545(0x51452453bd31ed1ceb9d9df533d176a666b218d578b9f15e60f26b0d38fd11d6); /* statement */ 
result = 0;
c_0x4f74b545(0x1f0d0aa8fd583999205459829669d58142678b71211fabd2724bfeba5121f51f); /* line */ 
        c_0x4f74b545(0xc5d21a71e8e7939ebe98f804fdb1df59f37318bfc858664f17b3f66d459bf1b4); /* statement */ 
success = false;
c_0x4f74b545(0xe3f833f8e86b1d14d73695b73b0a1008b69c8b2a1827281959e80cff98a4be99); /* line */ 
        c_0x4f74b545(0x0ba5dc618dbe8e36215139b6549152f73cc6f4c98043e7a069ad4a450916dac9); /* statement */ 
for (uint256 i = 0; i < b.length; i++) {
c_0x4f74b545(0x48f360a8f15504e68cee1213858f2d27046c448e0738f2efd01ff55ecdd8da4d); /* line */ 
            c_0x4f74b545(0xdc32d5abb31eba51aa9043b5488ab90bed8fc11c96ab391635b14bd4061de4fd); /* statement */ 
if (uint8(b[i]) >= 48 && uint8(b[i]) <= 57) {c_0x4f74b545(0x25e842557aebb7374a61ca9046ad0fb4f8b2d60c77741415f62f68d835f9d4e4); /* branch */ 

c_0x4f74b545(0xe07966ca8bf05624d443d8bf66c83557257eeaab8e74144a83769c72f617a346); /* line */ 
                c_0x4f74b545(0x16116d3fe3eab66048469279ba1ea579ce90d008c754641ab081544a87b949c5); /* statement */ 
result = result * 10 + (uint8(b[i]) - 48);
c_0x4f74b545(0xc4d1a37bc1fbecbe30053548ca3ae72a7b1486777d202227917219eec6f93de6); /* line */ 
                c_0x4f74b545(0xafb758fd40553a021a7d3a0d3e0f340f1ebf8ffe478a4dd131a51f316bac6787); /* statement */ 
success = true;
            } else {c_0x4f74b545(0x08b0e1656c206337aedbdc6213f15a244844f73ad9d0adeaadd528c0b86728dd); /* branch */ 

c_0x4f74b545(0x9092b026707b33e772af7afb38e3e9f6a5739a4a538390e8717628602b664693); /* line */ 
                c_0x4f74b545(0xca8c3c4383b811392732eacb528e66d221b3def16f97e92226927f579b7aae21); /* statement */ 
result = 0;
c_0x4f74b545(0x822ff843b709c8d1d3f4ff24ec861f5c536061b6d93170bb8e02aebbc8dc30c8); /* line */ 
                c_0x4f74b545(0x657a577b06f7ff08e75af2b91e2a6311c698642ebea138863912aec85ff3e2bc); /* statement */ 
success = false;
c_0x4f74b545(0x1b7af570948362dacc753e604e59c87f880a07676a46d821a86097d857c3e2f5); /* line */ 
                break;
            }
        }
c_0x4f74b545(0x61c641149edf907ff9e521e2024c379382efbdfea230b860afef7643eea30441); /* line */ 
        c_0x4f74b545(0xf0ea704b7a689f6902d6cdb8ffa7d8fe15effdc2b0e9daf4adcef52ebc240ee3); /* statement */ 
return (success, result);
    }

    function checkStep(
        DaoRegistry dao,
        address actionId,
        OffchainVotingHashContract.VoteResultNode memory node,
        uint256 snapshot,
        VoteStepParams memory params
    ) external view returns (bool) {c_0x4f74b545(0x4689f92b1372e08159cab1ade1657d836f58cd84fa36ade81f01d53adbf07a1a); /* function */ 

c_0x4f74b545(0x07e12fe5ccde7999d935fcd3c8cf83d33a6ff570090f13cf72e6bfd67d74ea08); /* line */ 
        c_0x4f74b545(0xf66a7720ff2259524e5ae24303b64519e7350656b3963fdfb97d25c6164598be); /* statement */ 
address voter = dao.getPriorDelegateKey(
            dao.getMemberAddress(node.index),
            snapshot
        );
c_0x4f74b545(0x08a64b99d5dba4a850fd0277daadfa7b1efe15edaa0ccf15c412329b647563ac); /* line */ 
        c_0x4f74b545(0x201b0c5785d6ca4701c2170eab400293da8e7ba801bb144fc66f63ed13ac6694); /* statement */ 
uint256 weight = GovernanceHelper.getVotingWeight(
            dao,
            voter,
            node.proposalId,
            snapshot
        );

c_0x4f74b545(0x0f376fca27afdf0abf064217e1e21edb44ad99f2d97e1e1671f4053df533c20f); /* line */ 
        c_0x4f74b545(0x21f2c10c2322185b47c02e672154a93d1eeac049a4a52160754001d889e6f810); /* statement */ 
if (node.choice == 0) {c_0x4f74b545(0xe1a40c3fab6bece83170886e04540f7ae41ce4229cdfd471812c9b192b658cca); /* branch */ 

c_0x4f74b545(0xdcd1b6dd4f4712014f4c9d19dca503e104b523f795b520a29a38cd9d9a7bbde7); /* line */ 
            c_0x4f74b545(0x978193c359a0f68ba374b96bb4ee3c1f5d546dda453b12c7bae61bc325030317); /* statement */ 
if (params.previousYes != node.nbYes) {c_0x4f74b545(0x5bb1f17d1fb00ac3a11f8b992a689e6defba7bc0fe1979d1c1a89fd78ff6088b); /* branch */ 

c_0x4f74b545(0xf14d834e3312d3cad8860f068a6a8ef460681ef44e02be74c3d3c0ce46dee006); /* line */ 
                c_0x4f74b545(0xd617bb70ddf8177e5cee12e334e60e004570b51f9c3fbf5d47245244cde5a67b); /* statement */ 
return true;
            } else {c_0x4f74b545(0x2a4a1720818b82eea5f587a9f2bb54f88d32b25803303703520c7d6e14a4de4c); /* statement */ 
c_0x4f74b545(0x39efe24a004a9c6749492842722145cd0001940afe735753e8eb30b03036b82f); /* branch */ 
if (params.previousNo != node.nbNo) {c_0x4f74b545(0x66303d93f15869a3cd31c3e2529b08a03b02a2e966d42c3ef1f552461b1ad89f); /* branch */ 

c_0x4f74b545(0xe8f5b7abd377bf28febda5dcec1ff6eeec129101ff204da52ed7467bfdfc4a95); /* line */ 
                c_0x4f74b545(0x9351efead8b21dc1a6dcbf16697f21f5f528b2e166d514b09a81568951039364); /* statement */ 
return true;
            }else { c_0x4f74b545(0xc8f6270d61948485f8dc63514b295788d2c6ed79e6fa24cca46a83d565d7285b); /* branch */ 
}}
        }else { c_0x4f74b545(0xa12ce457d8e6c8b3183cfc04cba8e36365b3c3c40406e46a6b5bd398d978a167); /* branch */ 
}

c_0x4f74b545(0x576aefe16e43e7774397f573066400de97b68d10bae1cab6c638ae4545baadd7); /* line */ 
        c_0x4f74b545(0xaefab25b7f907318dbdc13ebb13a0fa3f6a8acbf2645d2ee41507034c0bba127); /* statement */ 
if (
            hasVoted(
                dao,
                actionId,
                voter,
                node.timestamp,
                node.proposalId,
                1,
                node.sig
            )
        ) {c_0x4f74b545(0xfaabb7f3f79d62be9f1c962df01b8a772efe2122d10427133647a003d3d8b293); /* branch */ 

c_0x4f74b545(0x8bc15b367c01b69b64606e832b4049991cd73b141f31a3c2837a9d3e5702ac06); /* line */ 
            c_0x4f74b545(0xac39edfea2067b17f6ab04dd1cb3145e701e8b340350e031e34af91cf2cf749b); /* statement */ 
if (params.previousYes + weight != node.nbYes) {c_0x4f74b545(0xe4a9e3c594c755ac46e851724433371a00f616ab67ce3df69c737fabb01b8dbc); /* branch */ 

c_0x4f74b545(0xe3984657a08aeccb4bd3ec9dba506b082bd98a0515d8e82bf66ff7e71932e441); /* line */ 
                c_0x4f74b545(0xaa49dd052f0c740398d346e7e19066ca4f33b788b03bf4b2ec85aabd21c6f840); /* statement */ 
return true;
            } else {c_0x4f74b545(0x2f9ba5c07dcfb99fb260d27e9b004a1460a1e2b549c1d57bcfffbb33832f2069); /* statement */ 
c_0x4f74b545(0x8ccd6714874d9faedc989d0a97589649541ac99d54a88273444d6e4437a0bf2b); /* branch */ 
if (params.previousNo != node.nbNo) {c_0x4f74b545(0x85c3c4b426467e3e409ff277f26f4f211e32063f078e660949cbee5c1a564dd5); /* branch */ 

c_0x4f74b545(0xc844edfe29a393a1786213bc3ebedb1678d10b0be159701de9c9caa917a0df97); /* line */ 
                c_0x4f74b545(0x0d180ac1a852a7ef389a2455edfd79731bb3e8a3b225bd9b64c24af867b88564); /* statement */ 
return true;
            }else { c_0x4f74b545(0x82ea34b93ae8734a9d92ba0ab7f651a4abb343e29dd42af1cb80959d4fb0ed86); /* branch */ 
}}
        }else { c_0x4f74b545(0xfa837e5f1889f5165900f2876add1c2485172eaf86e7a34a840cf14880e97840); /* branch */ 
}
c_0x4f74b545(0x6e841670a984896bdb2e0eed8c5de7ecef7c6aaf9ccae4a420039113d86bdd19); /* line */ 
        c_0x4f74b545(0x8764951c8f5049f3ce9e10353a06ce5a8288f44f2abacc61688a52afe7948c2e); /* statement */ 
if (
            hasVoted(
                dao,
                actionId,
                voter,
                node.timestamp,
                node.proposalId,
                2,
                node.sig
            )
        ) {c_0x4f74b545(0xd268bae1646221e3e5f82cd9c112f667d33408625e3026458998e1692a159c0d); /* branch */ 

c_0x4f74b545(0x7f4b483c83c31f30da9299b60d9feead01f2721f5a32a94712795f48be46c4cd); /* line */ 
            c_0x4f74b545(0x8238cfbe9658e20fb4fd1e8a4787966bc601ffc3d485b339e2186d837b782b75); /* statement */ 
if (params.previousYes != node.nbYes) {c_0x4f74b545(0xb666e5a8f97917ab834149fa7d1158cfaa3e3422e840e5840d8a81175f68714d); /* branch */ 

c_0x4f74b545(0x79f6c7ddf8eba40a084c57b7c6e61725faca8b47c0ad1e8d66d7c704823395d3); /* line */ 
                c_0x4f74b545(0x1ef758a8e1fa015fc39b690d23314289a749db12ce7411821220872306982958); /* statement */ 
return true;
            } else {c_0x4f74b545(0x3749980dfaa9cce9bfee8a400d5695ec7eb92558207bd790c8982496e95f5ee7); /* statement */ 
c_0x4f74b545(0xfa97ede9b06caa791fd65319fd5b7568127d6772cf14d29495356db34fff145c); /* branch */ 
if (params.previousNo + weight != node.nbNo) {c_0x4f74b545(0xf931c9c460b0393f63ee8f6a9dae6769b917a0cd337630cfea50926341cebad0); /* branch */ 

c_0x4f74b545(0x9e04047488d05ec260e69868b6b1cb58c5e4f175e21660acc4402cd75521a3f4); /* line */ 
                c_0x4f74b545(0xc276794a2ecdfb0d2bd233db9762f363fe77024425275083ca9d31bcb74ebbb2); /* statement */ 
return true;
            }else { c_0x4f74b545(0x0a867d84a705021717c656b66315fa4d19b85618d367da614ff19d913677ada4); /* branch */ 
}}
        }else { c_0x4f74b545(0xf44a057d68de199b1d398128768c3506e693fca880c35710c388f4a50e2df2b1); /* branch */ 
}

c_0x4f74b545(0x0d81491e7c59c827d2766a07e6437c10631e7deefd093d2e95d9af9555577db8); /* line */ 
        c_0x4f74b545(0x15ad79187b3f1c2b3b4492def4c3cd8c10b00fc18bbb2ac598dafab9b7941076); /* statement */ 
return false;
    }
}
