const Web3 = require('web3-utils');
const FlagHelperLib = artifacts.require('./v3/FlagHelper');
const DaoFactory = artifacts.require('./v3/DaoFactory');
const ModuleRegistry = artifacts.require('./v3/ModuleRegistry');
const MemberContract = artifacts.require('./v3/MemberContract');
const BankContract = artifacts.require('./v3/BankContract');
const VotingContract = artifacts.require('./v3/VotingContract');
const ProposalContract = artifacts.require('./v3/ProposalContract');
const OffchainVotingContract = artifacts.require('./v3/OffchainVotingContract');
const OnboardingContract = artifacts.require('./v3/OnboardingContract');
const FinancingContract = artifacts.require('./v3/FinancingContract');

// https://github.com/raiden-network/raiden/blob/master/raiden/mtree.py
// Create a merkle root from a list of elements
// Elements are assumed to be 32 bytes hashes (Buffers)
//  (but may be expressed as 0x prefixed hex strings of length 66)
// The bottom layer of the tree (leaf nodes) are the elements
// All layers above are combined hashes of the element pairs

// Two strategies for creating tree and checking proofs (preserveOrder flag)
// 1. raiden - sort the leaves of the tree, and also sort each pair of
//    pre-images, which allows you to verify the proof without the index
// 2. storj - preserve the order of the leaves and pairs of pre-images, and use
//    the index to verify the proof

// The MerkleTree is a 2d array of layers
// [ elements, combinedHashes1, combinedHashes2, ... root]
// root is a length 1 array

const sha3 = web3.utils.sha3;
const ep = web3.eth.abi.encodeParameters;

// Expects elements to be Buffers of length 32
// Empty string elements will be removed prior to the buffer check
// by default, order is not preserved
function MerkleTree(elements, preserveOrder) {
  if (!(this instanceof MerkleTree)) {
    return new MerkleTree(elements, preserveOrder)
  }

  // remove empty strings
  this.elements = elements
  .filter(a => a)
  .map(a => {
    if(typeof a === "string" && a.startsWith('0x')) {
      return Buffer.from(a.slice(2), 'hex');
    } else if(typeof a === "string") {
      return Buffer.from(a, 'hex');
    } else {
      return a;
    }
  });

  // check buffers
  
  if (this.elements.some((e) => !(Buffer.isBuffer(e)))) {
    throw new Error('elements must be byte buffers');
  }

  if (this.elements.some((e) => !(e.length == 32))) {
    throw new Error('elements must be 32 length.' + this.elements.map(e => e.length));
  }

  // if we are not preserving order, dedup and sort
  this.preserveOrder = !!preserveOrder
  if (!this.preserveOrder) {
    this.elements = bufDedup(this.elements)
    this.elements.sort(Buffer.compare)
  }

  this.layers = getLayers(this.elements, this.preserveOrder)
};

MerkleTree.prototype.getRoot = function() {
  return this.layers[this.layers.length - 1][0]
};

MerkleTree.prototype.getProof = function(element, hex) {
  const index = getBufIndex(element, this.elements)
  if (index == -1) {
    throw new Error('element not found in merkle tree')
  }
  return getProof(index, this.layers, hex)
};

// Expects 1-n index, converts it to 0-n index internally
MerkleTree.prototype.getProofOrdered = function(element, index, hex) {
  if (!(element.equals(this.elements[index - 1]))) {
    throw new Error('element does not match leaf at index in tree')
  }
  return getProof(index - 1, this.layers, hex)
};

const checkProofOrdered = function(proof, root, element, index) {
  // use the index to determine the node ordering
  // index ranges 1 to n

  let tempHash = element

  for (let i = 0; i < proof.length; i++) {
    let remaining = proof.length - i

    // we don't assume that the tree is padded to a power of 2
    // if the index is odd then the proof will start with a hash at a higher
    // layer, so we have to adjust the index to be the index at that layer
    while (remaining && index % 2 === 1 && index > Math.pow(2, remaining)) {
      index = Math.round(index / 2)
    }

    if (index % 2 === 0) {
      tempHash = combinedHash(proof[i], tempHash, true)
    } else {
      tempHash = combinedHash(tempHash, proof[i], true)
    }
    index = Math.round(index / 2)
  }

  return tempHash.equals(root)
};

const checkProof = function(proof, root, element) {
  return root.equals(proof.reduce((hash, pair) => {
    return combinedHash(hash, pair)
  }, element))
};

const merkleRoot = function(elements, preserveOrder) {
  return (new MerkleTree(elements, preserveOrder)).getRoot()
};

// converts buffers from MerkleRoot functions into hex strings
// merkleProof is the contract abstraction for MerkleProof.sol
const checkProofSolidityFactory = function(checkProofContractMethod) {
  return function(proof, root, hash) {
    proof = '0x' + proof.map(e => e.toString('hex')).join('')
    root = bufToHex(root)
    hash = bufToHex(hash)
    return checkProofContractMethod(proof, root, hash)
  }
};

const checkProofOrderedSolidityFactory = function(checkProofOrderedContractMethod) {
  return function(proof, root, hash, index) {
    proof = '0x' + proof.map(e => e.toString('hex')).join('')
    root = bufToHex(root)
    hash = bufToHex(hash)
    return checkProofOrderedContractMethod(proof, root, hash, index)
  }
};

function combinedHash(first, second, preserveOrder) {
  if (!second) { return first }
  if (!first) { return second }
  if (preserveOrder) {
    return sha3(bufJoin(first, second))
  } else {
    return sha3(bufSortJoin(first, second))
  }
}

function getNextLayer(elements, preserveOrder) {
  return elements.reduce((layer, element, index, arr) => {
    if (index % 2 == 0) { layer.push(combinedHash(element, arr[index + 1], preserveOrder)) }
    return layer
  }, [])
}

function getLayers(elements, preserveOrder) {
  if (elements.length == 0) {
    return [['']]
  }
  const layers = []
  layers.push(elements)
  while (layers[layers.length - 1].length > 1) {
    layers.push(getNextLayer(layers[layers.length - 1], preserveOrder))
  }
  return layers
}

function getProof(index, layers, hex) {
  const proof = layers.reduce((proof, layer) => {
    let pair = getPair(index, layer)
    if (pair) { proof.push(pair) }
    index = Math.floor(index / 2)
    return proof
  }, [])
  if (hex) {
    return '0x' + proof.map(e => e.toString('hex')).join('')
  } else {
    return proof
  }
}

function getPair(index, layer) {
  let pairIndex = index % 2 ? index - 1 : index + 1
  if (pairIndex < layer.length) {
    return layer[pairIndex]
  } else {
    return null
  }
}

function getBufIndex(element, array) {
  for (let i = 0; i < array.length; i++) {
    if (element.equals(array[i])) { return i }
  }
  return -1
}

function bufToHex(element) {
  return Buffer.isBuffer(element) ? '0x' + element.toString('hex') : element
}

function bufJoin(...args) {
  return Buffer.concat([...args])
}

function bufSortJoin(...args) {
  return Buffer.concat([...args].sort(Buffer.compare))
}

function bufDedup(buffers) {
  return buffers.filter((buffer, i) => {
    return getBufIndex(buffer, buffers) == i
  })
}

async function advanceTime(time) {
  await new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [time],
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    })
  });

  await new Promise((resolve, reject) => {
      web3.currentProvider.send({
          jsonrpc: '2.0',
          method: 'evm_mine',
          id: new Date().getTime()
      }, (err, result) => {
        if (err) { return reject(err) }
        return resolve(result)
      })
    });
}

contract('MolochV3', async accounts => {

  it("should not be possible to create a dao with an invalid module id", async () => {
    let moduleId = Web3.fromUtf8("");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let contract = await ModuleRegistry.new();
    try {
      await contract.updateRegistry(moduleId, moduleAddress);
    } catch (err) {
      assert.equal(err.reason, "moduleId must not be empty");
    }
  });

  it("should not be possible to remove a module from dao if the module was not registered", async () => {
    let moduleId = Web3.fromUtf8("1");
    let contract = await ModuleRegistry.new();
    try {
      await contract.removeRegistry(moduleId);
    } catch (err) {
      assert.equal(err.reason, "moduleId not registered");
    }
  });

  it("should not be possible to create a dao with an invalid module address", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "";
    let contract = await ModuleRegistry.new();
    try {
      await contract.updateRegistry(moduleId, moduleAddress);
    } catch (err) {
      assert.equal(err.reason, "invalid address");
    }
  });

  it("should not be possible to create a dao with an empty module address", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "0x0";
    let contract = await ModuleRegistry.new();
    try {
      await contract.updateRegistry(moduleId, moduleAddress);
    } catch (err) {
      assert.equal(err.reason, "invalid address");
    }
  });

  it("should be possible to create a dao and register at least one module to it", async () => {
    let moduleId = Web3.fromUtf8("1");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let contract = await ModuleRegistry.new();
    await contract.updateRegistry(moduleId, moduleAddress);
    let address = await contract.getAddress(moduleId);
    assert.equal(address, moduleAddress);
  });

  it("should be possible to remove a module from the dao", async () => {
    let moduleId = Web3.fromUtf8("2");
    let moduleAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
    let contract = await ModuleRegistry.new();
    await contract.updateRegistry(moduleId, moduleAddress);
    let address = await contract.getAddress(moduleId);
    assert.equal(address, moduleAddress);
    await contract.removeRegistry(moduleId);
    address = await contract.getAddress(moduleId);
    assert.equal(address, "0x0000000000000000000000000000000000000000");
  });

  const numberOfShares = Web3.toBN('1000000000000000');
  const sharePrice = Web3.toBN(Web3.toWei("120", 'finney'));
  const remaining = sharePrice.sub(Web3.toBN('50000000000000'))
  const GUILD = "0x000000000000000000000000000000000000dead";
  const ESCROW = "0x000000000000000000000000000000000000beef";
  const TOTAL = "0x000000000000000000000000000000000000babe";

  async function prepareSmartContracts() {
    let lib = await FlagHelperLib.new();
    let bank = await BankContract.new();
    await MemberContract.link("FlagHelper", lib.address);
    await ProposalContract.link("FlagHelper", lib.address);
    let member = await MemberContract.new();
    let proposal = await ProposalContract.new();
    let voting = await VotingContract.new();
    return { voting, proposal, member, bank};
  }

  async function prepareSmartContracts2() {
    let lib = await FlagHelperLib.new();
    let bank = await BankContract.new();
    await MemberContract.link("FlagHelper", lib.address);
    await ProposalContract.link("FlagHelper", lib.address);
    let member = await MemberContract.new();
    let proposal = await ProposalContract.new();
    let voting = await OffchainVotingContract.new();
    return {voting, proposal, member, bank};
  }

  async function addVote(votes, proposalRoot, account, memberWeight, voteYes) {
    const vote = {
      address : account.toString(),
      weight: memberWeight,
      signature : await generateVote(account, proposalRoot, voteYes),
      voteResult : voteYes ? '1' : '2'
    };
    votes.push(vote);
    return votes;
  }

  async function generateVote(account, proposalRoot, voteYes) {
    const voteHash = sha3(web3.eth.abi.encodeParameters( ['bytes32', 'uint256'], [proposalRoot, voteYes ? "1" : "2"]));
    return await web3.eth.sign(voteHash, account);
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

    return {snapshotTree: new MerkleTree(elements, true), weights};
  }

  function buildVoteLeafHashForMerkleTreeData(leaf) {
    return web3.eth.abi.encodeParameters(
      ['address', 'uint256', 'bytes', 'uint256', 'uint256'], 
      [leaf.address, leaf.weight.toString(), leaf.vote.toString(), leaf.nbYes.toString(), leaf.nbNo.toString()]);
  }

  function buildVoteLeafHashForMerkleTree(leaf) {
    return sha3(buildVoteLeafHashForMerkleTreeData(leaf));
  }

  function prepareVoteResult(votes, weights) {
    const sortedVotes = votes.sort((a,b) => a.address > b.address);
    const leaves = sortedVotes.map((vote) => {
      return {
        address: vote.address,
        weight: weights[vote.address],
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

    leaves.forEach((leaf) => {
      leaf.nbYes = leaf.voteResult === 1 ? 1 : 0;
      leaf.nbNo = leaf.voteResult !== 1 ? 1 : 0;
    });

    const voteResultTree = new MerkleTree(leaves.map(vote => buildVoteLeafHashForMerkleTree(vote), true));

    return {voteResultTree, votes: leaves};
  }

  it("should be possible to join a DAO", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const nonMemberAccount = accounts[3];
    const {voting, member, bank, proposal} = await prepareSmartContracts();

    let daoFactory = await DaoFactory.new(bank.address, member.address, proposal.address, voting.address, 
      { from: myAccount, gasPrice: Web3.toBN("0") });

    await daoFactory.newDao(sharePrice, numberOfShares, 1000, {from: myAccount, gasPrice: Web3.toBN("0")});
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    const onboardingAddress = await dao.getAddress(Web3.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);

    await onboarding.sendTransaction({from:otherAccount,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    await onboarding.sponsorProposal(0, [], {from: myAccount, gasPrice: web3.utils.toBN("0")});

    await voting.submitVote(dao.address, 0, 1, {from: myAccount, gasPrice: Web3.toBN("0")});
    try {
      await onboarding.processProposal(0, {from: myAccount, gasPrice: Web3.toBN("0")});
    } catch(err) {
      assert.equal(err.reason, "proposal need to pass to be processed");
    }
    
    await advanceTime(10000);
    await onboarding.processProposal(0, {from: myAccount, gasPrice: Web3.toBN("0")});
    
    const myAccountShares = await member.nbShares(dao.address, myAccount);
    const otherAccountShares = await member.nbShares(dao.address, otherAccount);
    const nonMemberAccountShares = await member.nbShares(dao.address, nonMemberAccount);
    assert.equal(myAccountShares.toString(), "1");
    assert.equal(otherAccountShares.toString(), numberOfShares.mul(Web3.toBN("3")));
    assert.equal(nonMemberAccountShares.toString(), "0");

    const guildBalance = await bank.balanceOf(dao.address, GUILD, "0x0000000000000000000000000000000000000000");
    assert.equal(guildBalance.toString(), sharePrice.mul(Web3.toBN("3")).toString());
  })

  it("should be possible to any individual to request financing", async () => {
    const myAccount = accounts[1];
    const applicant = accounts[2];
    const newMember = accounts[3];
    const token = "0x0000000000000000000000000000000000000000"; //0x0 indicates it is Native ETH
    const { voting, member, bank, proposal } = await prepareSmartContracts();

    let daoFactory = await DaoFactory.new(bank.address, member.address, proposal.address, voting.address, 
      { from: myAccount, gasPrice: Web3.toBN("0") });

    await daoFactory.newDao(sharePrice, numberOfShares, 1000, { from: myAccount, gasPrice: Web3.toBN("0") });
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    //Add funds to the Guild Bank after sposoring a member to join the Guild
    const onboardingAddress = await dao.getAddress(Web3.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    await onboarding.sendTransaction({ from: newMember, value: sharePrice.mul(Web3.toBN(10)).add(remaining), gasPrice: Web3.toBN("0") });
    //Get the new proposal id
    pastEvents = await proposal.getPastEvents();
    let { proposalId }  = pastEvents[0].returnValues;

    //Sponsor the new proposal, vote and process it 
    await onboarding.sponsorProposal(proposalId, [], { from: myAccount, gasPrice: Web3.toBN("0") });
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: Web3.toBN("0") });
    await advanceTime(10000);
    await onboarding.processProposal(proposalId, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Check Guild Bank Balance
    let guildBalance = await bank.balanceOf(dao.address, GUILD, token);
    let expectedGuildBalance = Web3.toBN("1200000000000000000");
    assert.equal(Web3.toBN(guildBalance).toString(), expectedGuildBalance.toString());

    //Create Financing Request
    let requestedAmount = Web3.toBN(50000);
    let financingAddress = await dao.getAddress(Web3.sha3('financing'));
    let financingContract = await FinancingContract.at(financingAddress);
    await financingContract.createFinancingRequest(daoAddress, applicant, token, requestedAmount, Web3.fromUtf8(""));
    
    //Get the new proposalId from event log
    pastEvents = await proposal.getPastEvents();
    proposalId = pastEvents[0].returnValues.proposalId;
    assert.equal(proposalId, 1);

    //Member sponsors the Financing proposal
    await financingContract.sponsorProposal(proposalId, [], { from: myAccount, gasPrice: Web3.toBN("0") });

    //Member votes on the Financing proposal
    await voting.submitVote(dao.address, proposalId, 1, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Check applicant balance before Financing proposal is processed
    let applicantBalance = await bank.balanceOf(dao.address, applicant, token);
    assert.equal(Web3.toBN(applicantBalance).toString(), "0".toString());
    
    //Process Financing proposal after voting
    await advanceTime(10000);
    await financingContract.processProposal(proposalId, { from: myAccount, gasPrice: Web3.toBN("0") });

    //Check Guild Bank balance to make sure the transfer has happened
    guildBalance = await bank.balanceOf(dao.address, GUILD, token);
    assert.equal(Web3.toBN(guildBalance).toString(), expectedGuildBalance.sub(requestedAmount).toString());

    //Check the applicant token balance to make sure the funds are available in the bank for the applicant account
    applicantBalance = await bank.balanceOf(dao.address, applicant, token);
    assert.equal(Web3.toBN(applicantBalance).toString(), requestedAmount.toString());
  })

  it("should be possible to vote offchain", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const {voting, member, bank, proposal} = await prepareSmartContracts2();

    let daoFactory = await DaoFactory.new(bank.address, member.address, proposal.address, voting.address, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await daoFactory.newDao(sharePrice, numberOfShares, 1000, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    const onboardingAddress = await dao.getAddress(web3.utils.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    await onboarding.sendTransaction({from:otherAccount,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    const {snapshotTree} = await prepareSnapshot(dao, member, accounts);
    await onboarding.sponsorProposal(0, snapshotTree.getRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await voting.submitVoteResult(dao.address, 0, 1, 0, snapshotTree.getRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await advanceTime(10000);
    await onboarding.processProposal(0, {from: myAccount, gasPrice: web3.utils.toBN("0")});
  });

  it("should be possible to invalidate vote if the total is wrong", async () => {
    const myAccount = accounts[1];
    const otherAccount = accounts[2];
    const {voting, member, bank, proposal} = await prepareSmartContracts2();

    let daoFactory = await DaoFactory.new(bank.address, member.address, proposal.address, voting.address, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    await daoFactory.newDao(sharePrice, numberOfShares, 1000, {from: myAccount, gasPrice: web3.utils.toBN("0")});
    let pastEvents = await daoFactory.getPastEvents();
    let daoAddress = pastEvents[0].returnValues.dao;
    let dao = await ModuleRegistry.at(daoAddress);

    const onboardingAddress = await dao.getAddress(web3.utils.sha3('onboarding'));
    const onboarding = await OnboardingContract.at(onboardingAddress);
    await onboarding.sendTransaction({from:otherAccount,value:sharePrice.mul(web3.utils.toBN(3)).add(remaining), gasPrice: web3.utils.toBN("0")});
    const {snapshotTree, weights} = await prepareSnapshot(dao, member, accounts);
    await onboarding.sponsorProposal(0, snapshotTree.getRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});

    const voteElements = await addVote([], snapshotTree.getRoot(), myAccount, 1, true);
    const {voteResultTree, votes} = prepareVoteResult(voteElements, weights);
    await voting.submitVoteResult(dao.address, 0, 10, 0, voteResultTree.getRoot(), {from: myAccount, gasPrice: web3.utils.toBN("0")});
    const elementIndex = votes.length - 1;
    const lastVoteElement = voteResultTree.elements[elementIndex];
    const lastVote = votes[elementIndex];
    const proof = voteResultTree.getProofOrdered(lastVoteElement, elementIndex + 1);
    await voting.fixResult(dao.address, 0, lastVote.address, lastVote.weight, lastVote.nbYes, lastVote.nbNo, lastVote.vote, proof , votes.length - 1);
    await advanceTime(10000);
    await onboarding.processProposal(0, {from: myAccount, gasPrice: web3.utils.toBN("0")});
  });
});