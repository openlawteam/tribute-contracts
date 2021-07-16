const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { getNetworkDetails } = require("../../../utils/DeploymentUtil");

if (!process.env.TRUFFLE_MNEMONIC)
  throw Error("Missing env var: <TRUFFLE_MNEMONIC>");

const openWallet = (provider) => {
  // The Wallet class inherits Signer and can sign transactions
  // and messages using a private key as a standard Externally Owned Account (EOA).
  const wallet = ethers.Wallet.fromMnemonic(process.env.TRUFFLE_MNEMONIC);
  return wallet.connect(provider);
};

const getProvider = (network) => {
  if (network === "ganache") {
    // Using the same network config as truffle-config.js
    return new ethers.providers.JsonRpcProvider({
      url: "http://localhost:7545",
      network: {
        chainId: getNetworkDetails(network).chainId,
        name: network,
      },
    });
  }
  return ethers.getDefaultProvider(network, {
    infura: process.env.INFURA_KEY,
    alchemy: process.env.ALCHEMY_KEY,
  });
};

const getABI = (contractName) => {
  const contract = JSON.parse(
    fs.readFileSync(
      path.resolve(`../../build/contracts/${contractName}.json`),
      "utf8"
    )
  );
  return contract.abi;
};

const attachContract = (address, abi, wallet) => {
  const contract = new ethers.Contract(address, abi, wallet);
  return contract.connect(wallet);
};

const getContract = (name, network, address) => {
  const provider = getProvider(network);
  const wallet = openWallet(provider);
  return {
    contract: attachContract(address, getABI(name), wallet),
    provider,
    wallet,
  };
};

module.exports = { attachContract, getContract };
