const { MerkleTree } = require('./merkleTree.js');
const sha3 = web3.utils.sha3;

async function addVote(votes, blockNumber, daoAddress, proposalId, account, memberWeight, voteYes) {
  const proposalHash = sha3(web3.eth.abi.encodeParameters(
    ['uint256', 'address', 'uint256'], 
    [blockNumber.toString(), daoAddress, proposalId]));    
  const vote = {
    address : account.toString(),
    weight: memberWeight,
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
    buildVoteLeafHashForMerkleTree
  })