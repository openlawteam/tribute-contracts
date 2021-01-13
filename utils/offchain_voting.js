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
const { MerkleTree } = require("./merkleTree.js");
const { SHARES } = require("./DaoFactory.js");
const sha3 = web3.utils.sha3;
const sigUtil = require("eth-sig-util");

function getVoteDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  // The named list of all type definitions
  const types = {
    Message: [
      { name: "timestamp", type: "uint256" },
      { name: "payload", type: "MessagePayload" },
    ],
    MessagePayload: [
      { name: "choice", type: "uint256" },
      { name: "proposalHash", type: "bytes32" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

Object.assign(exports, {
  getVoteDomainDefinition,
  TypedDataUtils: sigUtil.TypedDataUtils,
});
