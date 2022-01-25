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

// Web3.js Utils
const web3 = require("web3");
const Web3Utils = require("web3-utils");
const sha3 = Web3Utils.sha3;
const soliditySha3 = Web3Utils.soliditySha3;
const encodePacked = Web3Utils.encodePacked;
const fromUtf8 = Web3Utils.fromUtf8;
const hexToBytes = Web3Utils.hexToBytes;
const toAscii = Web3Utils.toAscii;
const fromAscii = Web3Utils.fromAscii;
const toBNWeb3 = Web3Utils.toBN;

// Ethers.js utils
const { ethers } = require("ethers");
const toUtf8 = ethers.utils.toUtf8String;
const toBytes32 = ethers.utils.formatBytes32String;
const toHex = ethers.utils.hexValue;
const toWei = ethers.utils.parseEther;
const toBN = ethers.BigNumber.from;
const getAddress = ethers.utils.getAddress;

// Dao Constants
const GUILD = "0x000000000000000000000000000000000000dead";
const TOTAL = "0x000000000000000000000000000000000000babe";
const ESCROW = "0x0000000000000000000000000000000000004bec";
const MEMBER_COUNT = "0x00000000000000000000000000000000decafbad";
const UNITS = "0x00000000000000000000000000000000000ff1ce";
const LOOT = "0x00000000000000000000000000000000b105f00d";
const ETH_TOKEN = "0x0000000000000000000000000000000000000000";
const DAI_TOKEN = "0x95b58a6bff3d14b7db2f5cb5f0ad413dc2940658";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const BANK = sha3("bank");
const ERC1271 = sha3("erc1271");
const NFT = sha3("nft");
const ERC1155 = sha3("erc1155-ext");

const numberOfUnits = toBN("1000000000000000");
const unitPrice = toWei("0.12");
const remaining = unitPrice.sub(toBN("50000000000000"));
const maximumChunks = toBN("11");
const maxAmount = toBN("10000000000000000000");
const maxUnits = toBN("10000000000000000000");

const waitTx = async (p) => {
  const res = await p;
  if (res && res.wait) {
    await res.wait();
  }
  return res;
};

const embedConfigs = (contractInstance, name, configs) => {
  return {
    ...contractInstance,
    configs: configs.find((c) => c.name === name),
  };
};

module.exports = {
  sha3,
  soliditySha3,
  toBN,
  toBNWeb3,
  toWei,
  hexToBytes,
  fromUtf8,
  toAscii,
  fromAscii,
  toUtf8,
  toBytes32,
  toHex,
  embedConfigs,
  encodePacked,
  getAddress,
  waitTx,
  maximumChunks,
  maxAmount,
  maxUnits,
  numberOfUnits,
  unitPrice,
  remaining,
  GUILD,
  TOTAL,
  ESCROW,
  DAI_TOKEN,
  UNITS,
  MEMBER_COUNT,
  LOOT,
  ETH_TOKEN,
  ZERO_ADDRESS,
  BANK,
  NFT,
  ERC1271,
  ERC1155,
};
