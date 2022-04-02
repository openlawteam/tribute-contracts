// Whole-script strict mode syntax
"use strict";
const {
  toBN,
  toBNWeb3,
  sha3,
  TOTAL,
  MEMBER_COUNT,
  ZERO_ADDRESS,
  UNITS,
  ERC1155,
} = require("./contract-util");
const { toNumber } = require("web3-utils");
const { MerkleTree } = require("./merkle-tree-util");
const {
  expect,
  advanceTime,
  web3,
  generateMembers,
  encodeProposalData,
} = require("./hardhat-test-util");

const {
  createVote,
  SigUtilSigner,
  prepareVoteResult,
  prepareVoteProposalData,
  buildVoteLeafHashForMerkleTree,
  toStepNode,
} = require("./offchain-voting-util");

const randomInt = (max) => {
  return Math.floor(Math.random() * (parseInt(max) + 1));
};

const checkLastEvent = async (dao, testObject) => {
  let pastEvents = await dao.getPastEvents();
  let returnValues = pastEvents[0].returnValues;

  Object.keys(testObject).forEach((key) =>
    expect(testObject[key], "value mismatch for key " + key).equal(
      returnValues[key]
    )
  );
};

const checkBalance = async (bank, address, token, expectedBalance) => {
  const balance = await bank.balanceOf(address, token);

  expect(balance.toString()).equal(expectedBalance.toString());
};

const checkSignature = async (
  signatureExtension,
  permissionHash,
  signature,
  magicValue
) => {
  const returnedValue = await signatureExtension.isValidSignature(
    permissionHash,
    signature
  );

  expect(returnedValue).equal(magicValue);
};

const encodeDaoInfo = (daoAddress) =>
  web3.eth.abi.encodeParameter(
    {
      DaoInfo: {
        dao: "address",
      },
    },
    {
      dao: daoAddress,
    }
  );

const isMember = async (bank, member) => {
  const units = await bank.balanceOf(member, UNITS);

  return units > toBN("0");
};

const submitNewMemberProposal = async (
  proposalId,
  member,
  onboarding,
  dao,
  newMember,
  unitPrice,
  token,
  desiredUnits = toBN("10")
) => {
  await onboarding.submitProposal(
    dao.address,
    proposalId,
    newMember,
    token,
    unitPrice.mul(desiredUnits),
    [],
    {
      from: member,
      gasPrice: toBN("0"),
    }
  );
};

const onboardingNewMember = async (
  proposalId,
  dao,
  onboarding,
  voting,
  newMember,
  sponsor,
  unitPrice,
  token,
  desiredUnits = toBN("10")
) => {
  await submitNewMemberProposal(
    proposalId,
    sponsor,
    onboarding,
    dao,
    newMember,
    unitPrice,
    token,
    desiredUnits
  );

  //vote and process it
  await voting.submitVote(dao.address, proposalId, 1, {
    from: sponsor,
    gasPrice: toBN("0"),
  });
  await advanceTime(10000);

  await onboarding.processProposal(dao.address, proposalId, {
    from: sponsor,
    value: unitPrice.mul(desiredUnits),
    gasPrice: toBN("0"),
  });
};

const guildKickProposal = async (
  dao,
  guildkickContract,
  memberToKick,
  sender,
  proposalId
) => {
  await guildkickContract.submitProposal(
    dao.address,
    proposalId,
    memberToKick,
    [],
    {
      from: sender,
      gasPrice: toBN("0"),
    }
  );
};

const submitConfigProposal = async (
  dao,
  proposalId,
  sender,
  configuration,
  voting,
  configs
) => {
  //Submit a new configuration proposal
  await configuration.submitProposal(dao.address, proposalId, configs, [], {
    from: sender,
    gasPrice: toBN("0"),
  });

  await voting.submitVote(dao.address, proposalId, 1, {
    from: sender,
    gasPrice: toBN("0"),
  });

  await advanceTime(10000);
  await configuration.processProposal(dao.address, proposalId, {
    from: sender,
    gasPrice: toBN("0"),
  });
};

const lendERC721NFT = async (
  dao,
  proposalId,
  pixelNFT,
  voting,
  lendNFT,
  nftExtension,
  bank,
  daoOwner,
  nftOwner,
  lendingPeriod = 10000
) => {
  // Mint the ERC721 NFT
  await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });

  let pastEvents = await pixelNFT.getPastEvents();
  const { tokenId } = pastEvents[1].returnValues;

  // Create the Lend Proposal
  await lendNFT.submitProposal(
    dao.address,
    proposalId,
    nftOwner,
    pixelNFT.address,
    tokenId,
    10000, // requested units
    lendingPeriod, // lending period (10 seconds)
    [],
    { from: daoOwner, gasPrice: toBN("0") }
  );

  // Vote Yes on the proposal
  await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });
  await advanceTime(10000);

  // Approve the NFT to move to the NFT extension
  await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
    nftOwner,
    lendNFT.address,
    tokenId,
    encodeProposalData(dao, proposalId),
    {
      from: nftOwner,
    }
  );

  let unitBalance = await bank.balanceOf(nftOwner, UNITS);
  expect(unitBalance.toString()).equal("10000");
  expect(await pixelNFT.ownerOf(tokenId)).equal(nftExtension.address);

  return { proposalId };
};

const lendERC1155NFT = async (
  dao,
  proposalId,
  tokenId,
  erc1155Token,
  voting,
  lendNFT,
  bank,
  daoOwner,
  nftOwner
) => {
  // Mint the ERC1155 NFT
  await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });

  // Create a proposal
  await lendNFT.submitProposal(
    dao.address,
    proposalId,
    nftOwner,
    erc1155Token.address,
    tokenId,
    25000, // requested units
    10000, // lending period
    [],
    { from: daoOwner, gasPrice: toBN("0") }
  );

  // Submit a vote (YES)
  await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });

  await advanceTime(10000);

  // Send the ERC1155 NFT to the LendNFT adapter
  await erc1155Token.safeTransferFrom(
    nftOwner,
    lendNFT.address,
    tokenId,
    1,
    encodeProposalData(dao, proposalId),
    { from: nftOwner }
  );

  const erc1155ExtAddr = await dao.getExtensionAddress(ERC1155);
  const balanceOf = await erc1155Token.balanceOf(erc1155ExtAddr, tokenId);
  expect(balanceOf.toString()).equal("1");

  let unitBalance = await bank.balanceOf(nftOwner, UNITS);
  expect(toNumber(unitBalance.toString())).to.be.closeTo(25000, 5);
};

/***
 * Offchain Voting Test Utils
 */

const VotingStrategies = {
  AllVotesYes: "AllVotesYes",
  AllVotesNo: "AllVotesNo",
  NoBodyVotes: "NoBodyVotes",
  SingleYesVote: "SingleYesVote",
  SingleNoVote: "SingleNoVote",
  TieVote: "TieVote",
  MajorityVotesYes: "MajorityVotesYes",
  MajorityVotesNo: "MajorityVotesNo",
};

const testMembers = generateMembers(10);

const findMember = (addr) =>
  testMembers.find((member) => member.address === addr);

const buildProposal = async (
  dao,
  actionId,
  submitter,
  blockNumber,
  chainId,
  name = "some proposal",
  body = "this is my proposal",
  space = "tribute"
) => {
  const proposalPayload = {
    name,
    body,
    choices: ["yes", "no"],
    start: Math.floor(new Date().getTime() / 1000),
    end: Math.floor(new Date().getTime() / 1000) + 10000,
    snapshot: blockNumber.toString(),
  };

  const startingTime = Math.floor(new Date().getTime() / 1000);
  const proposalData = {
    type: "proposal",
    timestamp: startingTime,
    space,
    payload: proposalPayload,
    submitter: submitter.address,
  };

  const signer = SigUtilSigner(submitter.privateKey);
  proposalData.sig = await signer(proposalData, dao.address, actionId, chainId);
  return { proposalData };
};

const vote = async (
  dao,
  bank,
  proposalId,
  member,
  choice,
  actionId,
  chainId,
  votingWeight = undefined,
  signature = undefined
) => {
  const voteSigner = SigUtilSigner(member.privateKey);
  const weight = await bank.balanceOf(member.address, UNITS);
  const voteEntry = await createVote(
    proposalId,
    votingWeight ? toBN(votingWeight) : weight,
    choice
  );
  voteEntry.sig = signature
    ? signature
    : voteSigner(voteEntry, dao.address, actionId, chainId);
  return voteEntry;
};

const emptyVote = async (proposalId, choice = 2 /*no*/, signature = "0x") => {
  const voteEntry = await createVote(proposalId, toBN("0"), choice);
  voteEntry.sig = signature;
  return voteEntry;
};

const buildVotes = async (
  dao,
  bank,
  proposalId,
  submitter,
  blockNumber,
  chainId,
  actionId,
  voteStrategy,
  votingWeight = undefined,
  voteChoice = undefined,
  signature = undefined
) => {
  const membersCount = await bank.getPriorAmount(
    TOTAL,
    MEMBER_COUNT,
    blockNumber
  );
  const voteEntries = [];
  const totalVotes = parseInt(membersCount.toString());
  for (let index = 0; index < totalVotes; index++) {
    const memberAddress = await dao.getMemberAddress(index);
    const member = findMember(memberAddress);
    let voteEntry;

    if (!member) {
      voteEntry = await emptyVote(proposalId, 2, signature);
      voteEntries.push(voteEntry);
      continue;
    }

    switch (voteStrategy) {
      case VotingStrategies.SingleYesVote &&
        memberAddress === submitter.address:
        voteEntry = await vote(
          dao,
          bank,
          proposalId,
          member,
          voteChoice ? voteChoice : 1,
          actionId,
          chainId,
          votingWeight,
          signature
        );
        break;
      case VotingStrategies.SingleNoVote && memberAddress === submitter.address:
        voteEntry = await vote(
          dao,
          bank,
          proposalId,
          member,
          voteChoice ? voteChoice : 2,
          actionId,
          chainId,
          votingWeight,
          signature
        );
        break;
      case VotingStrategies.AllVotesYes:
        voteEntry = await vote(
          dao,
          bank,
          proposalId,
          member,
          voteChoice ? voteChoice : 1,
          actionId,
          chainId,
          votingWeight,
          signature
        );
        break;
      case VotingStrategies.AllVotesNo:
        voteEntry = await vote(
          dao,
          bank,
          proposalId,
          member,
          voteChoice ? voteChoice : 2,
          actionId,
          chainId,
          votingWeight,
          signature
        );
        break;
      case VotingStrategies.TieVote:
        voteEntry = await vote(
          dao,
          bank,
          proposalId,
          member,
          i < parseInt(totalVotes / 2) ? 1 : 2,
          actionId,
          chainId,
          votingWeight,
          signature
        );
        break;
      case VotingStrategies.NoBodyVotes:
      default:
        voteEntry = await emptyVote(proposalId, 2, signature);
        break;
    }
    voteEntries.push(voteEntry);
  }
  return voteEntries;
};

const buildVoteTree = async (
  dao,
  bank,
  proposalId,
  submitter,
  blockNumber,
  chainId,
  actionId,
  votingStrategy = VotingStrategies.AllVotesYes,
  votes = undefined,
  moveBlockTime = true
) => {
  const membersCount = await bank.getPriorAmount(
    TOTAL,
    MEMBER_COUNT,
    blockNumber
  );

  const voteEntries = votes
    ? votes
    : await buildVotes(
        dao,
        bank,
        proposalId,
        submitter,
        blockNumber,
        chainId,
        actionId,
        votingStrategy
      );

  if (moveBlockTime) await advanceTime(10000);

  const { voteResultTree, result } = await prepareVoteResult(
    voteEntries,
    dao,
    actionId,
    chainId
  );

  const signer = SigUtilSigner(submitter.privateKey);
  const rootSig = signer(
    { root: voteResultTree.getHexRoot(), type: "result" },
    dao.address,
    actionId,
    chainId
  );

  const lastResult = result[result.length - 1];
  lastResult.nbYes = lastResult.nbYes.toString();
  lastResult.nbNo = lastResult.nbNo.toString();
  return {
    voteResultTree,
    votesResults: result,
    rootSig,
    lastVoteResult: lastResult,
    membersCount,
    resultHash: voteResultTree.getHexRoot(),
  };
};

const buildVoteTreeWithBadNodes = async (
  daoOwner,
  dao,
  bank,
  configuration,
  proposalId,
  blockNumber,
  submitter,
  chainId,
  actionId,
  badWeight,
  votingStrategy = VotingStrategies.AllVotesYes,
  moveBlockTime = true
) => {
  const { proposalData } = await buildProposal(
    dao,
    actionId,
    submitter,
    blockNumber,
    chainId
  );

  await configuration.submitProposal(
    dao.address,
    proposalId,
    [
      {
        key: sha3("config1"),
        numericValue: "10",
        addressValue: ZERO_ADDRESS,
        configType: 0,
      },
    ],
    prepareVoteProposalData(proposalData, web3),
    {
      from: daoOwner,
      gasPrice: toBN("0"),
    }
  );

  const votes = await buildVotes(
    dao,
    bank,
    proposalId,
    submitter,
    blockNumber,
    chainId,
    actionId,
    votingStrategy
  );

  // Calculate the correct voting weights for the vote result
  votes.forEach((vote, idx) => {
    const stepIndex = idx + 1;
    vote.choice = vote.choice || vote.payload.choice;
    vote.nbYes = vote.choice === 1 ? vote.payload.weight.toString() : "0";
    vote.nbNo = vote.choice !== 1 ? vote.payload.weight.toString() : "0";
    vote.proposalId = vote.payload.proposalId;

    if (stepIndex > 1) {
      const previousVote = votes[stepIndex - 1];
      vote.nbYes = toBNWeb3(vote.nbYes)
        .add(toBNWeb3(previousVote.nbYes ? previousVote.nbYes : "0"))
        .toString();
      vote.nbNo = toBNWeb3(vote.nbNo)
        .add(toBNWeb3(previousVote.nbNo ? previousVote.nbNo : "0"))
        .toString();
    }

    vote.index = stepIndex;
  });

  // Set invalid voting weights and choices before creating the vote steps
  votes.forEach((v, idx) => {
    // Ignore the last vote, because it is the vote result
    if (idx < votes.length - 1) {
      v.nbYes = randomInt(badWeight).toString();
      v.nbNo = randomInt(badWeight).toString();
      v.payload.weight = toBNWeb3(badWeight.toString());
    }
  });

  const voteResultTree = new MerkleTree(
    votes.map((vote) =>
      buildVoteLeafHashForMerkleTree(vote, dao.address, actionId, chainId)
    )
  );

  const resultSteps = votes.map((vote) =>
    toStepNode(vote, dao.address, actionId, chainId, voteResultTree)
  );

  const signer = SigUtilSigner(submitter.privateKey);
  const rootSig = signer(
    { root: voteResultTree.getHexRoot(), type: "result" },
    dao.address,
    actionId,
    chainId
  );

  const lastVoteResult = resultSteps[resultSteps.length - 1];
  lastVoteResult.nbYes = lastVoteResult.nbYes.toString();
  lastVoteResult.nbNo = lastVoteResult.nbNo.toString();

  if (moveBlockTime) await advanceTime(10); // ends the voting period

  return {
    proposalId,
    voteResultTree,
    resultSteps,
    signer,
    rootSig,
    lastVoteResult,
  };
};

module.exports = {
  checkLastEvent,
  checkBalance,
  checkSignature,
  submitNewMemberProposal,
  onboardingNewMember,
  guildKickProposal,
  submitConfigProposal,
  lendERC721NFT,
  lendERC1155NFT,
  isMember,
  encodeDaoInfo,
  testMembers,
  VotingStrategies,
  findMember,
  buildProposal,
  vote,
  emptyVote,
  buildVotes,
  buildVoteTree,
  buildVoteTreeWithBadNodes,
};
