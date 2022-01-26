pragma solidity ^0.8.0;
function c_0x985b0cc2(bytes32 c__0x985b0cc2) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/bank/Bank.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../interfaces/IVoting.sol";
import "./Voting.sol";

/**
MIT License

Copyright (c) 2021 Openlaw

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

contract SnapshotProposalContract {
function c_0xc692737b(bytes32 c__0xc692737b) public pure {}

    string public constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,address actionId)";
    string public constant PROPOSAL_MESSAGE_TYPE =
        "Message(uint64 timestamp,bytes32 spaceHash,MessagePayload payload)MessagePayload(bytes32 nameHash,bytes32 bodyHash,string[] choices,uint64 start,uint64 end,string snapshot)";
    string public constant PROPOSAL_PAYLOAD_TYPE =
        "MessagePayload(bytes32 nameHash,bytes32 bodyHash,string[] choices,uint64 start,uint64 end,string snapshot)";
    string public constant VOTE_MESSAGE_TYPE =
        "Message(uint64 timestamp,MessagePayload payload)MessagePayload(uint32 choice,bytes32 proposalId)";
    string public constant VOTE_PAYLOAD_TYPE =
        "MessagePayload(uint32 choice,bytes32 proposalId)";

    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));
    bytes32 public constant PROPOSAL_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(PROPOSAL_MESSAGE_TYPE));
    bytes32 public constant PROPOSAL_PAYLOAD_TYPEHASH =
        keccak256(abi.encodePacked(PROPOSAL_PAYLOAD_TYPE));
    bytes32 public constant VOTE_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_MESSAGE_TYPE));
    bytes32 public constant VOTE_PAYLOAD_TYPEHASH =
        keccak256(abi.encodePacked(VOTE_PAYLOAD_TYPE));

    struct ProposalMessage {
        uint256 timestamp;
        bytes32 spaceHash;
        address submitter;
        ProposalPayload payload;
        bytes sig;
    }

    struct ProposalPayload {
        bytes32 nameHash;
        bytes32 bodyHash;
        string[] choices;
        uint256 start;
        uint256 end;
        string snapshot;
    }

    struct VoteMessage {
        uint256 timestamp;
        VotePayload payload;
    }

    struct VotePayload {
        uint32 choice;
        bytes32 proposalId;
    }

    function DOMAIN_SEPARATOR(DaoRegistry dao, address actionId)
        public
        view
        returns (bytes32)
    {c_0xc692737b(0xe3c0f012bc9137f6aa617ae3d1e9d4806cc0dfea8a9a66884124e4fe29b173b2); /* function */ 

c_0xc692737b(0xee67fb5df785ec4de231b50ee71be9e11bb3545625e5a9bc20432635bbfeff83); /* line */ 
        c_0xc692737b(0xb7f3ccd21c327c88bb072683519ce26d52e2fc41ae4673bd44c35e8b80522d32); /* statement */ 
return
            keccak256(
                abi.encode(
                    EIP712_DOMAIN_TYPEHASH,
                    keccak256("Snapshot Message"), // string name
                    keccak256("4"), // string version
                    block.chainid, // uint256 chainId
                    address(dao), // address verifyingContract,
                    actionId
                )
            );
    }

    function hashMessage(
        DaoRegistry dao,
        address actionId,
        ProposalMessage memory message
    ) external view returns (bytes32) {c_0xc692737b(0xae692badc7380e6328845d651907a96dcc499e43d8f93bd4c7f7a8bc69f76345); /* function */ 

c_0xc692737b(0xc0afd6913997906635a0fffe4cdd5ba05f0b05155b79441142ac2110e21679f0); /* line */ 
        c_0xc692737b(0x6149c24180bfa07a55d57bed6e8208aff20fdf50e48feb480a0990db8ba9564a); /* statement */ 
return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    DOMAIN_SEPARATOR(dao, actionId),
                    hashProposalMessage(message)
                )
            );
    }

    function hashProposalMessage(ProposalMessage memory message)
        public
        pure
        returns (bytes32)
    {c_0xc692737b(0x662fe7b40bbe698c89931a2da833d6e91b83d4393f8e2fd593b8770172e25c21); /* function */ 

c_0xc692737b(0xae09b17984616f0b91c9c78e9eb2996b0d3e56349a7bce882354eab71546aa66); /* line */ 
        c_0xc692737b(0x675665f1b6b497594b1d7ba59b0cebea0f691ef6a256d24cd84db48d12d04928); /* statement */ 
return
            keccak256(
                abi.encode(
                    PROPOSAL_MESSAGE_TYPEHASH,
                    message.timestamp,
                    message.spaceHash,
                    hashProposalPayload(message.payload)
                )
            );
    }

    function hashProposalPayload(ProposalPayload memory payload)
        public
        pure
        returns (bytes32)
    {c_0xc692737b(0x5869872970dece40eace599b393c2600ef5f22a006dd4882075ff81d85a401fd); /* function */ 

c_0xc692737b(0xffbaab33a1c9328238271cd08fce5b185f7a34a67ffcc02f31683e327a85e437); /* line */ 
        c_0xc692737b(0x0edcf95fc5b724551ddc8c8b1c06f05790159e8dfb0311b2037e92c450af3b9b); /* statement */ 
return
            keccak256(
                abi.encode(
                    PROPOSAL_PAYLOAD_TYPEHASH,
                    payload.nameHash,
                    payload.bodyHash,
                    keccak256(abi.encodePacked(toHashArray(payload.choices))),
                    payload.start,
                    payload.end,
                    keccak256(abi.encodePacked(payload.snapshot))
                )
            );
    }

    function hashVote(
        DaoRegistry dao,
        address actionId,
        VoteMessage memory message
    ) external view returns (bytes32) {c_0xc692737b(0xd3b3ced85f3eeee2e74c6dff0052b72b8f8b6ce98f06987dc98d7b91b0b3ee05); /* function */ 

c_0xc692737b(0xb242f49856b7af45c0bb382f01e247721f81b2308a2649ea0064e1ab2b73e3f0); /* line */ 
        c_0xc692737b(0x63db4464ac224f869234c5cd8969a6f4dd9ce254a463afbb04fe54642f2bba18); /* statement */ 
return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    DOMAIN_SEPARATOR(dao, actionId),
                    hashVoteInternal(message)
                )
            );
    }

    function hashVoteInternal(VoteMessage memory message)
        public
        pure
        returns (bytes32)
    {c_0xc692737b(0x20f64ce25540bf6688be578d6529cb796323c8c52923b83364ecf9fdd372bf9c); /* function */ 

c_0xc692737b(0x2aafc85b1bf3c3c614dbbde3e97419039672fb646c4d75e8dc4a650208cacae8); /* line */ 
        c_0xc692737b(0xd0e98aea5f0a388f207b80b60b89a53ecc4577092916399bdeba2a2231c64080); /* statement */ 
return
            keccak256(
                abi.encode(
                    VOTE_MESSAGE_TYPEHASH,
                    message.timestamp,
                    hashVotePayload(message.payload)
                )
            );
    }

    function hashVotePayload(VotePayload memory payload)
        public
        pure
        returns (bytes32)
    {c_0xc692737b(0x7e14906f5ccb337ab45321558ceedd4acd50da33dc772c0acbaad96e3f093e0f); /* function */ 

c_0xc692737b(0xc1c313d5f211edb0cc20c213862fcd55c71dad72aee4a45f8e0238d4672883cd); /* line */ 
        c_0xc692737b(0xfa997206b950951bb139f758de0e6e8f67390937ff1df38f758a64d3f991e34f); /* statement */ 
return
            keccak256(
                abi.encode(
                    VOTE_PAYLOAD_TYPEHASH,
                    payload.choice,
                    payload.proposalId
                )
            );
    }

    function toHashArray(string[] memory arr)
        internal
        pure
        returns (bytes32[] memory result)
    {c_0xc692737b(0xc649b2dd03611ce9ccae95a92e59aece2a46bbaf77e63ba3f907af0d81f01328); /* function */ 

c_0xc692737b(0xdb00e342f1037d2591201f5e9ed490fbc680e118a2ed2aa5cd54810a9739afc5); /* line */ 
        c_0xc692737b(0xb06cd3827064161910bf035a966e81de7c672bc91bb47d8752afc6f9380cf564); /* statement */ 
result = new bytes32[](arr.length);
c_0xc692737b(0x53f7eb13cd453cd80c2861a17a58cc6f84cdd06a350ee051663cdc68c4adb3fe); /* line */ 
        c_0xc692737b(0xbb797a8e0fb74529cdf95051727863f2ad2db0f019efd4beeb13c26196eced5a); /* statement */ 
for (uint256 i = 0; i < arr.length; i++) {
c_0xc692737b(0x9778292a8429f1a11861f47566a475533872e38a2daea505055b0859e861941c); /* line */ 
            c_0xc692737b(0xc20ff450ce6e78cb042c59e80f82c4447be914f26cbed6b4afea70bf5ddf7315); /* statement */ 
result[i] = keccak256(abi.encodePacked(arr[i]));
        }
    }
}
