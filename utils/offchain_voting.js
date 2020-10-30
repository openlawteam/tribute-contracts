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

Object.assign(exports, {
    addVote,
    prepareVoteResult,
    toStepNode,
    buildVoteLeafHashForMerkleTree
  })