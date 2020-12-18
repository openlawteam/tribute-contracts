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

function getMessageERC712Hash(m, verifyingContract, actionId, chainId) {
  const message = prepareMessage(m);
  const {domain, types} = getDomainDefinition(m, verifyingContract, actionId, chainId);
  const msgParams = {
    domain,
    message,
    primaryType: 'Message',
    types
  };
  return '0x' + sigUtil.TypedDataUtils.sign(msgParams).toString('hex');
}

function getDomainDefinition(message, verifyingContract, actionId, chainId) {
  switch(message.type) {
    case "vote":
      return getVoteDomainDefinition(verifyingContract, actionId, chainId);
    case "proposal":
      return getProposalDomainDefinition(verifyingContract, actionId, chainId);
    case "result":
      return getVoteResultRootDomainDefinition(verifyingContract, actionId, chainId);
    default:
      throw new Error("unknown type '" + message.type + "'");
  }
 }

 function getMessageDomainType(chainId, verifyingContract, actionId) {
  return {
    name: 'Snapshot Message',
    version: '4',
    chainId,
    verifyingContract,
    actionId
  }
 }

function getVoteDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  // The named list of all type definitions
  const types = {
      Message: [
        { name: 'timestamp', type: 'uint256' },
        { name: 'payload', type: 'MessagePayload' }
      ],
      MessagePayload: [
        { name: 'choice', type: 'uint256' },
        { name: 'proposalHash', type: 'bytes32' }
      ],
      EIP712Domain: getDomainType()
  };

  return { domain, types}
}

function getVoteStepDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  // The named list of all type definitions
  const types = {
      Message: [
        { name: 'account', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'nbYes', type: 'uint256' },
        { name: 'nbNo', type: 'uint256' },
        { name: 'index', type: 'uint256' },
        { name: 'choice', type: 'uint256' },
        { name: 'proposalHash', type: 'bytes32' }
      ],
      EIP712Domain: getDomainType()
  };

  return { domain, types}
}

function getProposalDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
      Message: [
        { name: 'timestamp', type: 'uint256' },
        { name: 'spaceHash', type: 'bytes32' },
        { name: 'payload', type: 'MessagePayload' }
      ],
      MessagePayload: [        
        { name: 'nameHash', type: 'bytes32' },
        { name: 'bodyHash', type: 'bytes32' },
        { name: 'choices', type: 'string[]' },
        { name: 'start', type: 'uint256' },
        { name: 'end', type: 'uint256' },
        { name: 'snapshot', type: 'string' }
      ],
      EIP712Domain: getDomainType()
  };

  return { domain, types}
}

function getVoteResultRootDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
      Message: [
        { name: 'root', type: 'bytes32' },
      ],
      EIP712Domain: getDomainType()
  };

  return { domain, types}
}

function getDomainType() {
  return [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
    { name: 'actionId', type: 'address' },
  ];
}

async function signMessage(signer, message, verifyingContract, chainId) {
  return signer(message, verifyingContract, chainId);
}

function validateMessage(message, address, verifyingContract, actionId, chainId, signature ) {
  const {domain, types} = getDomainDefinition(message, verifyingContract, actionId, chainId); 
  
  const msgParams = {
    domain,
    message,
    primaryType: 'Message',
    types
  };
  
  const recoverAddress = sigUtil.recoverTypedSignature_v4({ data: msgParams, sig: signature })
  return address.toLowerCase() === recoverAddress.toLowerCase();
}

function Web3JsSigner(web3, account) {
  return async function(m, verifyingContract, actionId, chainId) {
    const message = prepareMessage(m);
    const {domain, types} = getDomainDefinition(message, verifyingContract, actionId, chainId);
    const msgParams = JSON.stringify({
      domain,
      message,
      primaryType: 'Message',
      types
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
    
    return signature;
  }  
}

function Web3Signer(ethers, account) {
  return function(m, verifyingContract, actionId, chainId) {
    const message = prepareMessage(m);
    const {domain, types} = getDomainDefinition(message, verifyingContract, actionId, chainId);
    const signer = ethers.getSigner(account);
    return signer._signTypedData(domain, types, message);
  }
}

function SigUtilSigner(privateKeyStr) {
  return function(m, verifyingContract, actionId, chainId) {
    const message = prepareMessage(m);
    const privateKey = Buffer.from(privateKeyStr, 'hex');
    const {domain, types} = getDomainDefinition(message, verifyingContract, actionId, chainId);
    const msgParams = {
      domain,
      message,
      primaryType: 'Message',
      types
    };
    return sigUtil.signTypedData_v4(privateKey, {data: msgParams});
  }
}

function prepareMessage(message) {
  switch(message.type) {
    case "vote":
      return prepareVoteMessage(message);
    case "proposal":
      return prepareProposalMessage(message);
    case "result":
        return message;
    default:
      throw new Error("unknown type " + message.type);
  }
}

function prepareVoteMessage(message) {
  return Object.assign(message, {
    timestamp: message.timestamp,
    payload: prepareVotePayload(message.payload)
  });
}

function prepareVotePayload(payload) {
  return Object.assign(payload, {
      proposalHash: payload.proposalHash,
      choice: payload.choice
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
/**
     * {
      member: undefined,
      nbNo: 1,
      nbYes: 0,
      weight: BN {
        negative: 0,
        words: [ 1, <1 empty item> ],
        length: 1,
        red: null
      },
      index: 0,
      sig: undefined,
      proof: []
    }*/

function toStepNode(step, verifyingContract, actionId, chainId, merkleTree) {
  return {
    account: step.account,      
    nbNo: step.nbNo,
    nbYes: step.nbYes,
    index: step.index,
    choice: step.choice,
    sig: step.sig,
    timestamp: step.timestamp,
    proposalHash: step.proposalHash,
    proof: merkleTree.getHexProof(buildVoteLeafHashForMerkleTree(step, verifyingContract, actionId, chainId))
  };
}

async function createVote(proposalHash, account, voteYes) {
  const payload = {
    choice: voteYes ? 1 : 2,
    account,
    proposalHash
  };
  const vote = {
    type: 'vote',
    timestamp: Math.floor(new Date().getTime() / 1000),
    payload
  };
  
  return vote;
}

function buildVoteLeafHashForMerkleTree(leaf, verifyingContract, actionId, chainId) {
  const {domain, types} = getVoteStepDomainDefinition(verifyingContract, actionId, chainId);
  const msgParams = {
    domain,
    message: leaf,
    primaryType: 'Message',
    types
  };
  return '0x' + sigUtil.TypedDataUtils.sign(msgParams).toString('hex');
}

async function prepareVoteResult(votes, dao, actionId, chainId, snapshot) {
  const sortedVotes = votes.sort((a,b) => a.account > b.account);
  const leaves = await Promise.all(sortedVotes.map(async (vote) => {
    const weight = await dao.getPriorAmount(vote.payload.account, SHARES, snapshot);
    return Object.assign(vote, {weight});
  }));

  leaves.forEach((leaf, idx) => {
    leaf.nbYes = leaf.voteResult === 1 ? 1 : 0;
    leaf.nbNo = leaf.voteResult !== 1 ? 1 : 0;
    leaf.account = leaf.payload.account;
    leaf.choice = leaf.payload.choice;
    leaf.proposalHash = leaf.payload.proposalHash;
    if(idx > 0) {
      const previousLeaf = leaves[idx - 1];
      leaf.nbYes = leaf.nbYes + previousLeaf.nbYes;
      leaf.nbNo = leaf.nbNo + previousLeaf.nbNo;
    } 
    
    leaf.index = idx;
  });

  const tree = new MerkleTree(leaves.map(vote => buildVoteLeafHashForMerkleTree(vote, dao.address, actionId, chainId)));
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
        "choices": 'string[]',
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
    "choices": payload.choices,
    "start": payload.start,
    "end": payload.end,
    "snapshot": payload.snapshot
  };
}

Object.assign(exports, {
    createVote,
    prepareVoteResult,
    toStepNode,
    buildVoteLeafHashForMerkleTree,
    validateMessage,
    getDomainDefinition,
    signMessage,
    Web3Signer,
    SigUtilSigner,
    Web3JsSigner,
    prepareProposalPayload,
    prepareVoteProposalData,
    prepareProposalMessage,
    getMessageERC712Hash,
    getProposalDomainDefinition,
    getVoteDomainDefinition,
    getVoteStepDomainDefinition,
    getVoteResultRootDomainDefinition,
    TypedDataUtils: sigUtil.TypedDataUtils
  })