// Whole-script strict mode syntax
'use strict';

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
const { MerkleTree } = require('./merkleTree.js');
const {SHARES} = require('./DaoFactory.js');
const sha3 = web3.utils.sha3;
const sigUtil = require('eth-sig-util');

function getMessageERC712Hash(m, verifyingContract, chainId) {
  const message = prepareMessage(m, verifyingContract, chainId);
  const {DomainType, MessageType} = getDomainType(m, verifyingContract, chainId);
  const msgParams = {
    domain: DomainType,
    message,
    primaryType: 'Message',
    types: MessageType
  };
  return '0x' + sigUtil.TypedDataUtils.sign(msgParams).toString('hex');
}

function getDomainType(message, verifyingContract, chainId) {
  switch(message.type) {
    case "vote":
      return getVoteDomainType(verifyingContract, chainId);
    case "proposal":
      return getProposalDomainType(verifyingContract, chainId);
    default:
      throw new Error("unknown type " + message.type);
  }
 }

 function getMessageDomainType(chainId, verifyingContract) {
  return {
    name: 'Snapshot Message',
    version: '1',
    chainId,
    verifyingContract
  }
 }

function getVoteDomainType(verifyingContract, chainId) {
  const DomainType = getMessageDomainType(chainId, verifyingContract);

  // The named list of all type definitions
  const MessageType = {
      Message: [
        { name: 'timestamp', type: 'uint256' },
        { name: 'spaceHash', type: 'bytes32' },
        { name: 'payload', type: 'MessagePayload' }
      ],
      MessagePayload: [
        { name: 'choice', type: 'uint256' },
        { name: 'proposalHash', type: 'bytes32' }
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ]
  };

  return { DomainType, MessageType}
}

function getProposalDomainType(verifyingContract, chainId) {
  const DomainType = getMessageDomainType(chainId, verifyingContract);

  const MessageType = {
      Message: [
        { name: 'timestamp', type: 'uint256' },
        { name: 'spaceHash', type: 'bytes32' },
        { name: 'payload', type: 'MessagePayload' }
      ],
      MessagePayload: [        
        { name: 'nameHash', type: 'bytes32' },
        { name: 'bodyHash', type: 'bytes32' },
        { name: 'start', type: 'uint256' },
        { name: 'end', type: 'uint256' },
        { name: 'snapshot', type: 'string' }
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ]
  };

  return { DomainType, MessageType}
}

async function signMessage(signer, message, verifyingContract, chainId) {
  return signer(message, verifyingContract, chainId);
}

function validateMessage(message, address, verifyingContract, chainId, signature ) {
  const {DomainType, MessageType} = getDomainType(message, verifyingContract, chainId); 
  
  const msgParams = {
    domain: DomainType,
    message,
    primaryType: 'Message',
    types: MessageType
  };
  
  const recoverAddress = sigUtil.recoverTypedSignature_v4({ data: msgParams, sig: signature })
  return address.toLowerCase() === recoverAddress.toLowerCase();
}

function Web3JsSigner(web3, account) {
  return async function(message, verifyingContract, chainId) {
    const m = prepareMessage(message, verifyingContract, chainId);
    const {DomainType, MessageType} = getDomainType(m, verifyingContract, chainId);
    const msgParams = JSON.stringify({
      domain: DomainType,
      message: m,
      primaryType: 'Message',
      types: MessageType
    });

    const signature = await new Promise((resolve, reject) => {
      web3.currentProvider.send({
        method: 'eth_signTypedData',
        params: [msgParams, account],
        from: account,
      }, function (err, result) {
        if (err) {
          return reject(err);
        }
        return resolve(result);    
      })
    });
    
    console.log(signature);

    return signature;
  }  
}

function Web3Signer(web3) {
  return function(message, verifyingContract, chainId) {
    const m = prepareMessage(message, verifyingContract, chainId);
    const {DomainType, MessageType} = getDomainType(m, verifyingContract, chainId);
    const signer = web3.getSigner();
    
    return signer._signTypedData(DomainType, MessageType, m);
  }
}

function SigUtilSigner(privateKeyStr) {
  return function(message, verifyingContract, chainId) {
    const m = prepareMessage(message, verifyingContract, chainId);
    const privateKey = Buffer.from(privateKeyStr, 'hex');
    const {DomainType, MessageType} = getDomainType(m, verifyingContract, chainId);
    const msgParams = {
      domain: DomainType,
      message: m,
      primaryType: 'Message',
      types: MessageType
    };
    return sigUtil.signTypedData_v4(privateKey, {data: msgParams});
  }
}

function prepareMessage(message, verifyingContract, chainId) {
  switch(message.type) {
    case "vote":
      return prepareVoteMessage(message, verifyingContract, chainId);
    case "proposal":
      return prepareProposalMessage(message);
    default:
      throw new Error("unknown type " + message.type);
  }
}

function prepareVoteMessage(message, verifyingContract, chainId) {
  return Object.assign(message, {
    spaceHash: sha3(message.space),
    payload: prepareVotePayload(message.payload, verifyingContract, chainId)
  });
}

function prepareVotePayload(payload, verifyingContract, chainId) {
  return Object.assign(payload, {
      proposalHash: getMessageERC712Hash(payload.proposal, verifyingContract, chainId)
  });
}

function prepareProposalMessage(message) {
  return Object.assign(message, {
    timestamp: message.timestamp,
    spaceHash: sha3(message.space),
    payload: prepareProposalPayload(message.payload)
  });
}

function prepareProposalPayload(payload) {
  return Object.assign(payload, {
      nameHash: sha3(payload.name),
      bodyHash: sha3(payload.body),
      snapshot: payload.snapshot,
      start: payload.start,
      end: payload.end
  });
}

function toStepNode(step, merkleTree) {
  return {member: step.address,      
    nbNo: step.nbNo,
    nbYes: step.nbYes,
    weight: step.weight,
    index: step.index,
    sig: step.vote,
    proof: merkleTree.getHexProof(buildVoteLeafHashForMerkleTree(step))
  };
}

async function addVote(votes, blockNumber, dao, proposalId, account, voteYes) {
  const proposalHash = sha3(web3.eth.abi.encodeParameters(
    ['uint256', 'address', 'uint256'], 
    [blockNumber.toString(), dao.address, proposalId]));    
  
  const memberWeight = await dao.balanceOf(account, SHARES);

  const vote = {
    address : account.toString(),
    weight: memberWeight.toString(),
    signature : await generateVote(account, proposalHash, voteYes),
    voteResult : voteYes ? 1 : 2
  };
  votes.push(vote);
  return votes;
}

async function generateVote(account, proposalHash, voteYes) {
  const voteHash = sha3(web3.eth.abi.encodeParameters( ['bytes32', 'uint256'], [proposalHash, voteYes ? "1" : "2"]));
  return await web3.eth.sign(voteHash, account);
}


function buildVoteLeafDataForMerkleTree(leaf) {
  const weightStr = leaf.weight.toString();
  const voteStr = leaf.vote.toString();
  const nbYesStr = leaf.nbYes.toString();
  const nbNoStr = leaf.nbNo.toString();
  const indexStr = leaf.index.toString();
  return web3.eth.abi.encodeParameters(
    ['address', 'uint256', 'bytes', 'uint256', 'uint256', 'uint256'], 
    [leaf.address, weightStr, voteStr, nbYesStr , nbNoStr, indexStr]);
}

function buildVoteLeafHashForMerkleTree(leaf) {
  return sha3(buildVoteLeafDataForMerkleTree(leaf));
}

function prepareVoteResult(votes) {
  const sortedVotes = votes.sort((a,b) => a.address > b.address);
  const leaves = sortedVotes.map((vote) => {
    return {
      address: vote.address,
      weight: vote.weight,
      vote: vote.signature,
      voteResult: vote.voteResult
    }
  });

  leaves.forEach((leaf, idx) => {
    leaf.nbYes = leaf.voteResult === 1 ? 1 : 0;
    leaf.nbNo = leaf.voteResult !== 1 ? 1 : 0;
    if(idx > 0) {
      const previousLeaf = leaves[idx - 1];
      leaf.nbYes = leaf.nbYes + previousLeaf.nbYes;
      leaf.nbNo = leaf.nbNo + previousLeaf.nbNo;
    } 
    
    leaf.index = idx;
  });

  const tree = new MerkleTree(leaves.map(vote => buildVoteLeafHashForMerkleTree(vote)));
  return {voteResultTree: tree, votes: leaves};
}

function prepareVoteProposalData(data) {
  return web3.eth.abi.encodeParameter({
    "ProposalMessage": {
      "timestamp": 'uint256',
      "spaceHash": 'bytes32',
      "payload": {
        "nameHash": 'bytes32',
        "bodyHash": 'bytes32',
        "start": 'uint256',
        "end": 'uint256',
        "snapshot": "string",
      },
      "sig": "bytes"
    }
  }, {
    "timestamp": data.timestamp,
    "spaceHash": sha3(data.space),
    "payload": prepareVoteProposalPayload(data.payload),
    "sig" : data.sig || '0x',
  });
}

function prepareVoteProposalPayload(payload) {
  return {
    "nameHash": sha3(payload.name),
    "bodyHash": sha3(payload.body),
    "start": payload.start,
    "end": payload.end,
    "snapshot": payload.snapshot
  };
}

Object.assign(exports, {
    addVote,
    prepareVoteResult,
    toStepNode,
    buildVoteLeafHashForMerkleTree,
    validateMessage,
    getDomainType,
    signMessage,
    Web3Signer,
    SigUtilSigner,
    Web3JsSigner,
    prepareProposalPayload,
    prepareVoteProposalData,
    prepareProposalMessage,
    getMessageERC712Hash,
    getProposalDomainType,
    TypedDataUtils: sigUtil.TypedDataUtils
  })