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
import { sha3 } from "web3-utils";
import encodeParameter from "web3-utils";
import sigUtil from "eth-sig-util";
import MerkleTree from "./merkleTree";

export const getDomainDefinition = (
  message,
  verifyingContract,
  actionId,
  chainId
) => {
  switch (message.type) {
    case "draft":
      return getDraftDomainDefinition(verifyingContract, actionId, chainId);
    case "vote":
      return getVoteDomainDefinition(verifyingContract, actionId, chainId);
    case "proposal":
      return getProposalDomainDefinition(verifyingContract, actionId, chainId);
    default:
      throw new Error("unknown type " + message.type);
  }
};

const getMessageDomainType = (chainId, verifyingContract, actionId) => {
  return {
    name: "Snapshot Message",
    version: "4",
    chainId,
    verifyingContract,
    actionId,
  };
};

const getVoteDomainDefinition = (verifyingContract, actionId, chainId) => {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  // The named list of all type definitions
  const types = {
    Message: [
      { name: "timestamp", type: "uint256" },
      { name: "token", type: "string" },
      { name: "type", type: "string" },
      { name: "space", type: "string" },
      { name: "payload", type: "MessagePayload" },
    ],
    MessagePayload: [
      { name: "choice", type: "uint256" },
      { name: "proposalIpfsHash", type: "string" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
};

const getVoteStepDomainDefinition = (verifyingContract, actionId, chainId) => {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  // The named list of all type definitions
  const types = {
    Message: [
      { name: "account", type: "address" },
      { name: "timestamp", type: "uint256" },
      { name: "nbYes", type: "uint256" },
      { name: "nbNo", type: "uint256" },
      { name: "index", type: "uint256" },
      { name: "choice", type: "uint256" },
      { name: "proposalIpfsHash", type: "bytes32" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
};

const getProposalDomainDefinition = (verifyingContract, actionId, chainId) => {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: "timestamp", type: "uint256" },
      { name: "space", type: "string" },
      { name: "payload", type: "MessagePayload" },
    ],
    MessagePayload: [
      { name: "name", type: "string" },
      { name: "body", type: "string" },
      { name: "choices", type: "string[]" },
      { name: "start", type: "uint256" },
      { name: "end", type: "uint256" },
      { name: "snapshot", type: "string" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
};

const getDraftDomainDefinition = (verifyingContract, actionId, chainId) => {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: "timestamp", type: "uint256" },
      { name: "space", type: "string" },
      { name: "payload", type: "MessagePayload" },
    ],
    MessagePayload: [
      { name: "name", type: "string" },
      { name: "body", type: "string" },
      { name: "choices", type: "string[]" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
};

export const getDomainType = () => {
  return [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
    { name: "actionId", type: "address" },
  ];
};

export const prepareMessage = (message) => {
  switch (message.type) {
    case "draft":
      return prepareDraftMessage(message);
    case "vote":
      return prepareVoteMessage(message);
    case "proposal":
      return prepareProposalMessage(message);
    default:
      throw new Error("unknown type " + message.type);
  }
};

const prepareVoteMessage = (message) => {
  return Object.assign(message, {
    timestamp: message.timestamp,
    payload: prepareVotePayload(message.payload),
    spaceHash: sha3(message.space),
  });
};

const prepareVotePayload = (payload) => {
  return Object.assign(payload, {
    proposalHash: payload.proposalHash,
    choice: payload.choice,
  });
};

const prepareProposalMessage = (message) => {
  return Object.assign(message, {
    timestamp: message.timestamp,
    spaceHash: sha3(message.space),
    payload: prepareProposalPayload(message.payload),
  });
};

const prepareProposalPayload = (payload) => {
  return Object.assign(payload, {
    nameHash: sha3(payload.name),
    bodyHash: sha3(payload.body),
    snapshot: payload.snapshot,
    start: payload.start,
    end: payload.end,
  });
};

const prepareDraftMessage = (message) => {
  return Object.assign(message, {
    timestamp: message.timestamp,
    spaceHash: sha3(message.space),
    payload: prepareDraftPayload(message.payload),
  });
};

const prepareDraftPayload = (payload) => {
  return Object.assign(payload, {
    nameHash: sha3(payload.name),
    bodyHash: sha3(payload.body),
  });
};

const toStepNode = (step, verifyingContract, actionId, chainId, merkleTree) => {
  return {
    account: step.account,
    nbNo: step.nbNo,
    nbYes: step.nbYes,
    index: step.index,
    choice: step.choice,
    sig: step.sig,
    timestamp: step.timestamp,
    proposalHash: step.proposalHash,
    proof: merkleTree.getHexProof(
      buildVoteLeafHashForMerkleTree(step, verifyingContract, actionId, chainId)
    ),
  };
};

const createVote = (proposalHash, account, voteYes) => {
  const payload = {
    choice: voteYes ? 1 : 2,
    account,
    proposalHash,
  };
  const vote = {
    type: "vote",
    timestamp: Math.floor(new Date().getTime() / 1000),
    payload,
  };

  return vote;
};

const buildVoteLeafHashForMerkleTree = (
  leaf,
  verifyingContract,
  actionId,
  chainId
) => {
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
};

const prepareVoteResult = async (
  votes,
  dao,
  actionId,
  chainId,
  snapshot,
  shares
) => {
  const sortedVotes = votes.sort((a, b) => a.account > b.account);
  const leaves = await Promise.all(
    sortedVotes.map(async (vote) => {
      const weight = await dao.getPriorAmount(
        vote.payload.account,
        shares,
        snapshot
      );
      return Object.assign(vote, { weight });
    })
  );

  leaves.forEach((leaf, idx) => {
    leaf.nbYes = leaf.voteResult === 1 ? 1 : 0;
    leaf.nbNo = leaf.voteResult !== 1 ? 1 : 0;
    leaf.account = leaf.payload.account;
    leaf.choice = leaf.payload.choice;
    leaf.proposalHash = leaf.payload.proposalHash;
    if (idx > 0) {
      const previousLeaf = leaves[idx - 1];
      leaf.nbYes = leaf.nbYes + previousLeaf.nbYes;
      leaf.nbNo = leaf.nbNo + previousLeaf.nbNo;
    }

    leaf.index = idx;
  });

  const tree = new MerkleTree(
    leaves.map((vote) =>
      buildVoteLeafHashForMerkleTree(vote, dao.address, actionId, chainId)
    )
  );
  return { voteResultTree: tree, votes: leaves };
};

const prepareVoteProposalData = (data) => {
  return encodeParameter(
    {
      ProposalMessage: {
        timestamp: "uint256",
        space: "string",
        payload: {
          name: "string",
          body: "string",
          choices: "string[]",
          start: "uint256",
          end: "uint256",
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
    }
  );
};

const prepareVoteProposalPayload = (payload) => {
  return {
    nameHash: sha3(payload.name),
    bodyHash: sha3(payload.body),
    choices: payload.choices,
    start: payload.start,
    end: payload.end,
    snapshot: payload.snapshot,
  };
};
