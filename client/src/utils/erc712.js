import { keccakFromString } from "ethereumjs-util";
import { recoverTypedSignature_v4, TypedDataUtils } from "eth-sig-util";

//FIXME: This is a copy of ERC12 Signature Verification https://github.com/openlawteam/laoland/commits/vote-erc712
//FIXME: once snapshot.js gets published with ERC712 validation we should replace this class with the new library.

const getProposalDomainType = (verifyingContract, chainId) => {
  const DomainType = {
    name: "Snapshot Message",
    version: "1",
    chainId,
    verifyingContract,
  };

  const MessageType = {
    Message: [
      { name: "versionHash", type: "string" },
      { name: "timestamp", type: "uint256" },
      { name: "spaceHash", type: "string" },
      { name: "payload", type: "MessagePayload" },
      { name: "token", type: "string" },
      { name: "type", type: "string" },
    ],
    MessagePayload: [
      { name: "nameHash", type: "string" },
      { name: "bodyHash", type: "string" },
      { name: "choices", type: "string[]" },
      { name: "start", type: "uint256" },
      { name: "end", type: "uint256" },
      { name: "snapshot", type: "uint256" },
      { name: "metadataHash", type: "string" },
    ],
  };

  return { DomainType, MessageType };
};

const getVoteDomainType = (verifyingContract, chainId) => {
  const DomainType = {
    name: "Snapshot Message",
    version: "1",
    chainId,
    verifyingContract,
  };

  // The named list of all type definitions
  const MessageType = {
    Message: [
      { name: "versionHash", type: "string" },
      { name: "timestamp", type: "uint256" },
      { name: "spaceHash", type: "string" },
      { name: "payload", type: "MessagePayload" },
      { name: "token", type: "string" },
      { name: "type", type: "string" },
    ],
    MessagePayload: [
      { name: "choice", type: "uint256" },
      { name: "proposal", type: "string" },
      { name: "metadataHash", type: "string" },
    ],
  };

  return { DomainType, MessageType };
};

export const getDomainType = (message, verifyingContract, chainId) => {
  switch (message.type) {
    case "vote":
      return getVoteDomainType(verifyingContract, chainId);
    case "proposal":
      return getProposalDomainType(verifyingContract, chainId);
    default:
      throw new Error("unknown type " + message.type);
  }
};

export const verifySignature = (
  message,
  address,
  verifyingContract,
  chainId,
  signature
) => {
  const { DomainType, MessageType } = getDomainType(
    message,
    verifyingContract,
    chainId
  );

  const msgParams = {
    domain: DomainType,
    message: message,
    primaryType: "Message",
    types: MessageType,
  };

  const recoverAddress = recoverTypedSignature_v4({
    data: msgParams,
    sig: signature,
  });

  return address.toLowerCase() === recoverAddress.toLowerCase();
};

const hexKeccak = (obj) => {
  return keccakFromString(obj).toString("hex");
};

const prepareProposalPayload = (payload) => {
  return Object.assign(payload, {
    nameHash: hexKeccak(payload.name),
    bodyHash: hexKeccak(payload.body),
    metadataHash: hexKeccak(JSON.stringify(payload.metadata)),
  });
};

const prepareProposalMessage = (message) => {
  return Object.assign(message, {
    versionHash: hexKeccak(message.version),
    spaceHash: hexKeccak(message.space),
    payload: prepareProposalPayload(message.payload),
  });
};

const prepareVotePayload = (payload) => {
  return Object.assign(payload, {
    metadataHash: hexKeccak(JSON.stringify(payload.metadata)),
  });
};

const prepareVoteMessage = (message) => {
  return Object.assign(message, {
    versionHash: hexKeccak(message.version),
    spaceHash: hexKeccak(message.space),
    payload: prepareVotePayload(message.payload),
  });
};

export const prepareMessage = (message) => {
  switch (message.type) {
    case "vote":
      return prepareVoteMessage(message);
    case "proposal":
      return prepareProposalMessage(message);
    default:
      throw new Error("unknown type " + message.type);
  }
};

export const getMessageERC712Hash = (message, verifyingContract, chainId) => {
  const m = prepareMessage(message);
  const { DomainType, MessageType } = getDomainType(
    m,
    verifyingContract,
    chainId
  );
  const msgParams = {
    domain: DomainType,
    message: m,
    primaryType: "Message",
    types: MessageType,
  };
  return "0x" + TypedDataUtils.sign(msgParams).toString("hex");
};
