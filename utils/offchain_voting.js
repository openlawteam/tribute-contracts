const { MerkleTree } = require('./merkleTree.js');
const sha3 = web3.utils.sha3;

async function addVote(votes, snapshotRoot, daoAddress, proposalId, account, memberWeight, voteYes) {
  const proposalHash = sha3(web3.eth.abi.encodeParameters(
    ['bytes32', 'address', 'uint256'], 
    [snapshotRoot.toString(), daoAddress, proposalId]));
  const vote = {
    address : account.toString(),
    weight: memberWeight,
    signature : await generateVote(account, proposalHash, voteYes),
    voteResult : voteYes ? 1 : 2
  };
  votes.push(vote);
  return votes;
}

async function generateVote(account, proposalRoot, voteYes) {
  const voteHash = sha3(web3.eth.abi.encodeParameters( ['bytes32', 'uint256'], [proposalRoot.toString('hex'), voteYes ? "1" : "2"]));
  return await web3.eth.sign(voteHash.toString('hex'), account);
}

async function prepareSnapshot(dao, member, accounts) {
  const shares = await Promise.all(accounts.map(async (account) => {
    const nbShares = await member.nbShares(dao.address, account);
    return {account, nbShares};
  }));

  const cleanShares =  shares.filter(({nbShares}) => nbShares.toString() !== '0');

  const elements = cleanShares
  .sort((a, b) => a.account > b.account)
  .map(({account, nbShares}) => sha3(web3.eth.abi.encodeParameters(['address', 'uint256'], [account, nbShares.toString()])));
  const weights = cleanShares.reduce((o, elem) => Object.assign(o, {[elem.account]: elem.nbShares}), {});
  if(!Number.isInteger(getBaseLog(2, elements.length))) {

  }
  const tree = new MerkleTree(elements);

  return {snapshotTree: tree, weights};
}

function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

function buildVoteLeafHashForMerkleTreeData(leaf) {
  const weightStr = leaf.weight.toString();
  const voteStr = leaf.vote.toString();
  const nbYesStr = leaf.nbYes.toString();
  const nbNoStr = leaf.nbNo.toString();
  return web3.eth.abi.encodeParameters(
    ['address', 'uint256', 'bytes', 'uint256', 'uint256'], 
    [leaf.address, weightStr, voteStr, nbYesStr , nbNoStr]);
}

function buildVoteLeafHashForMerkleTree(leaf) {
  return sha3(buildVoteLeafHashForMerkleTreeData(leaf));
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
    
  });

  const tree = new MerkleTree(leaves.map(vote => buildVoteLeafHashForMerkleTree(vote)));
  return {voteResultTree: tree, votes: leaves};
}

Object.assign(exports, {
    prepareSnapshot,
    addVote,
    prepareVoteResult,
    buildVoteLeafHashForMerkleTree
  })