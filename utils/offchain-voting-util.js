// Whole-script strict mode syntax
"use strict";

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
const { MerkleTree } = require("./merkle-tree-util");
const {
  toBN,
  sha3,
  toBNWeb3,
  TOTAL,
  MEMBER_COUNT,
  UNITS,
} = require("./contract-util");
const sigUtil = require("eth-sig-util");

const { advanceTime, generateMembers } = require("./hardhat-test-util");

const BadNodeError = {
  0: "OK",
  1: "WRONG_PROPOSAL_ID",
  2: "INVALID_CHOICE",
  3: "AFTER_VOTING_PERIOD",
  4: "BAD_SIGNATURE",
  5: "INDEX_OUT_OF_BOUND",
  6: "VOTE_NOT_ALLOWED",
};

const VotingState = {
  0: "NOT_STARTED",
  1: "TIE",
  2: "PASS",
  3: "NOT_PASS",
  4: "IN_PROGRESS",
  5: "GRACE_PERIOD",
};

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
  for (let i = 0; i < totalVotes; i++) {
    const memberAddress = await dao.getMemberAddress(i);
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

function getMessageERC712Hash(m, verifyingContract, actionId, chainId) {
  const message = prepareMessage(m);
  const { domain, types } = getDomainDefinition(
    m,
    verifyingContract,
    actionId,
    chainId
  );
  const msgParams = {
    domain,
    message,
    primaryType: "Message",
    types,
  };
  return "0x" + sigUtil.TypedDataUtils.sign(msgParams).toString("hex");
}

function getDomainDefinition(message, verifyingContract, actionId, chainId) {
  switch (message.type) {
    case "vote":
      return getVoteDomainDefinition(verifyingContract, actionId, chainId);
    case "proposal":
      return getProposalDomainDefinition(verifyingContract, actionId, chainId);
    case "draft":
      return getDraftDomainDefinition(verifyingContract, actionId, chainId);
    case "result":
      return getVoteResultRootDomainDefinition(
        verifyingContract,
        actionId,
        chainId
      );
    case "coupon":
      return getCouponDomainDefinition(verifyingContract, actionId, chainId);
    case "coupon-kyc":
      return getCouponKycDomainDefinition(verifyingContract, actionId, chainId);
    default:
      throw new Error("unknown type '" + message.type + "'");
  }
}

function getCouponKycDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [{ name: "kycedMember", type: "address" }],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getMessageDomainType(chainId, verifyingContract, actionId) {
  return {
    name: "Snapshot Message",
    version: "4",
    chainId,
    verifyingContract,
    actionId,
  };
}

function getVoteDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  // The named list of all type definitions
  const types = {
    Message: [
      { name: "timestamp", type: "uint64" },
      { name: "payload", type: "MessagePayload" },
    ],
    MessagePayload: [
      { name: "choice", type: "uint32" },
      { name: "proposalId", type: "bytes32" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getVoteStepDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  // The named list of all type definitions
  const types = {
    Message: [
      { name: "timestamp", type: "uint64" },
      { name: "nbYes", type: "uint88" },
      { name: "nbNo", type: "uint88" },
      { name: "index", type: "uint32" },
      { name: "choice", type: "uint32" },
      { name: "proposalId", type: "bytes32" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getProposalDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: "timestamp", type: "uint64" },
      { name: "spaceHash", type: "bytes32" },
      { name: "payload", type: "MessagePayload" },
    ],
    MessagePayload: [
      { name: "nameHash", type: "bytes32" },
      { name: "bodyHash", type: "bytes32" },
      { name: "choices", type: "string[]" },
      { name: "start", type: "uint64" },
      { name: "end", type: "uint64" },
      { name: "snapshot", type: "string" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getDraftDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: "timestamp", type: "uint64" },
      { name: "spaceHash", type: "bytes32" },
      { name: "payload", type: "MessagePayload" },
    ],
    MessagePayload: [
      { name: "nameHash", type: "bytes32" },
      { name: "bodyHash", type: "bytes32" },
      { name: "choices", type: "string[]" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getVoteResultRootDomainDefinition(
  verifyingContract,
  actionId,
  chainId
) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [{ name: "root", type: "bytes32" }],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getCouponDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: "authorizedMember", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getDomainType() {
  return [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
    { name: "actionId", type: "address" },
  ];
}

async function signMessage(signer, message, verifyingContract, chainId) {
  return signer(message, verifyingContract, chainId);
}

function validateMessage(
  message,
  address,
  verifyingContract,
  actionId,
  chainId,
  signature
) {
  const { domain, types } = getDomainDefinition(
    message,
    verifyingContract,
    actionId,
    chainId
  );

  const msgParams = {
    domain,
    message,
    primaryType: "Message",
    types,
  };

  const recoverAddress = sigUtil.recoverTypedSignature_v4({
    data: msgParams,
    sig: signature,
  });
  return address.toLowerCase() === recoverAddress.toLowerCase();
}

function Web3JsSigner(web3, account) {
  return async function (m, verifyingContract, actionId, chainId) {
    const message = prepareMessage(m);
    const { domain, types } = getDomainDefinition(
      message,
      verifyingContract,
      actionId,
      chainId
    );
    const msgParams = JSON.stringify({
      domain,
      message,
      primaryType: "Message",
      types,
    });
    const signature = await new Promise((resolve, reject) => {
      web3.currentProvider.send(
        {
          method: "eth_signTypedData_v4",
          params: [msgParams, account],
          from: account,
        },
        function (err, result) {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        }
      );
    });

    return signature;
  };
}

function Web3Signer(ethers, account) {
  return function (m, verifyingContract, actionId, chainId) {
    const message = prepareMessage(m);
    const { domain, types } = getDomainDefinition(
      message,
      verifyingContract,
      actionId,
      chainId
    );
    const signer = ethers.getSigner(account);
    return signer._signTypedData(domain, types, message);
  };
}

function SigUtilSigner(privateKeyStr) {
  return function (m, verifyingContract, actionId, chainId) {
    const message = prepareMessage(m);
    if (privateKeyStr.indexOf("0x") === 0) {
      privateKeyStr = privateKeyStr.slice(2);
    }
    const privateKey = Buffer.from(privateKeyStr, "hex");
    const { domain, types } = getDomainDefinition(
      message,
      verifyingContract,
      actionId,
      chainId
    );
    const msgParams = {
      domain,
      message,
      primaryType: "Message",
      types,
    };
    return sigUtil.signTypedData_v4(privateKey, { data: msgParams });
  };
}

function prepareMessage(message) {
  switch (message.type) {
    case "vote":
      return prepareVoteMessage(message);
    case "proposal":
      return prepareProposalMessage(message);
    case "result":
      return message;
    case "coupon":
      return message;
    case "coupon-kyc":
      return message;
    default:
      throw new Error("unknown type " + message.type);
  }
}

function prepareVoteMessage(message) {
  return Object.assign(message, {
    timestamp: message.timestamp,
    payload: prepareVotePayload(message.payload),
  });
}

function prepareVotePayload(payload) {
  return Object.assign(payload, {
    proposalId: payload.proposalId,
    choice: payload.choice,
  });
}

function prepareProposalMessage(message) {
  return Object.assign(message, {
    timestamp: message.timestamp,
    spaceHash: sha3(message.space),
    payload: prepareProposalPayload(message.payload),
    submitter: message.submitter,
  });
}

function prepareProposalPayload(payload) {
  return Object.assign(payload, {
    nameHash: sha3(payload.name),
    bodyHash: sha3(payload.body),
    snapshot: payload.snapshot,
    start: payload.start,
    end: payload.end,
  });
}
/**
     * {      
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
    nbNo: step.nbNo,
    nbYes: step.nbYes,
    index: step.index,
    choice: step.choice,
    sig: step.sig,
    timestamp: step.timestamp,
    proposalId: step.proposalId,
    proof: merkleTree.getHexProof(
      buildVoteLeafHashForMerkleTree(step, verifyingContract, actionId, chainId)
    ),
  };
}

async function createVote(proposalId, weight, choice) {
  const payload = {
    choice,
    proposalId,
    weight: toBNWeb3(weight),
  };
  const vote = {
    type: "vote",
    timestamp: Math.floor(new Date().getTime() / 1000),
    payload,
  };

  if (weight.toString() === "0") {
    payload.choice = 0;
  }

  return vote;
}

function buildVoteLeafHashForMerkleTree(
  leaf,
  verifyingContract,
  actionId,
  chainId
) {
  const { domain, types } = getVoteStepDomainDefinition(
    verifyingContract,
    actionId,
    chainId
  );
  const msgParams = {
    domain,
    message: leaf,
    primaryType: "Message",
    types,
  };
  return "0x" + sigUtil.TypedDataUtils.sign(msgParams).toString("hex");
}

async function prepareVoteResult(votes, dao, actionId, chainId) {
  votes.forEach((vote, idx) => {
    vote.choice = vote.choice || vote.payload.choice;
    vote.nbYes = vote.choice === 1 ? vote.payload.weight : toBNWeb3(0);
    vote.nbNo = vote.choice !== 1 ? vote.payload.weight : toBNWeb3(0);
    vote.proposalId = vote.payload.proposalId;
    if (idx > 0) {
      const previousVote = votes[idx - 1];
      vote.nbYes = vote.nbYes.add(toBNWeb3(previousVote.nbYes)).toString();
      vote.nbNo = vote.nbNo.add(toBNWeb3(previousVote.nbNo)).toString();
    }

    vote.index = idx;
  });

  const tree = new MerkleTree(
    votes.map((vote) =>
      buildVoteLeafHashForMerkleTree(vote, dao.address, actionId, chainId)
    )
  );

  const result = votes.map((vote) =>
    toStepNode(vote, dao.address, actionId, chainId, tree)
  );

  return { voteResultTree: tree, result };
}

/**
 * 
 struct ProposalMessage {
        uint256 timestamp;
        bytes32 spaceHash;
        address submitter;
        ProposalPayload payload;
        bytes sig;
    }
 */
function prepareVoteProposalData(data, web3) {
  return web3.eth.abi.encodeParameter(
    {
      ProposalMessage: {
        timestamp: "uint64",
        spaceHash: "bytes32",
        submitter: "address",
        payload: {
          nameHash: "bytes32",
          bodyHash: "bytes32",
          choices: "string[]",
          start: "uint64",
          end: "uint64",
          snapshot: "string",
        },
        sig: "bytes",
      },
    },
    {
      timestamp: data.timestamp,
      spaceHash: sha3(data.space),
      payload: prepareVoteProposalPayload(data.payload),
      sig: data.sig || "0x",
      submitter: data.submitter,
    }
  );
}

function prepareVoteProposalPayload(payload) {
  return {
    nameHash: sha3(payload.name),
    bodyHash: sha3(payload.body),
    choices: payload.choices,
    start: payload.start,
    end: payload.end,
    snapshot: payload.snapshot,
  };
}

Object.assign(exports, {
  createVote,
  prepareVoteResult,
  toStepNode,
  buildVoteLeafHashForMerkleTree,
  buildProposal,
  buildVoteTree,
  buildVotes,
  vote,
  emptyVote,
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
  TypedDataUtils: sigUtil.TypedDataUtils,
  BadNodeError,
  VotingState,
  testMembers,
  VotingStrategies,
});
