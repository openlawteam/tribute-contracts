const {
  toBN,
  toWei,
  ETH_TOKEN,
  maximumChunks,
  unitPrice,
  numberOfUnits,
} = require("../utils/ContractUtil.js");

const { deployDao, getNetworkDetails } = require("../utils/DeploymentUtil.js");

require("dotenv").config();

task("deploy", "Deply the list of contracts", async (taskArgs, hre) => {
  const hardhatImports = require("../utils/HardhatUtil.js");
  const accounts = await hre.ethers.getSigners();
  const network = hre.hardhatArguments.network;

  let res;
  const deployFunction = hardhatImports.deployFunctionFactory(hre);
  if (network === "ganache") {
    res = await deployGanacheDao(deployFunction, network, accounts, hardhatImports);
  } else if (network === "rinkeby") {
    res = await deployRinkebyDao(deployFunction, network, hardhatImports);  
  } else if (network === "ropsten") {
    res = await deployRinkebyDao(deployFunction, network, hardhatImports);
  } else if (network === "test" || network === "coverage") {
    res = await deployTestDao(deployFunction, network, accounts,hardhatImports);
  }

  let { dao, extensions, adapters, testContracts, votingHelpers, factories  } = res;
  if (dao) {
    await dao.finalizeDao();
    const finalizeAdapters = formattedOject(adapters, "Adapter");
    const finalizeExtensions = formattedOject(extensions, "Extension");
    const finalizeTestContracts = formattedOject(testContracts, "Contract");
    const finalizeVotingHelpers = formattedOject(votingHelpers, "Contract");
    const finalizeFactories = formattedOject(factories, "Contract");

    console.log("************************ Adapters ************************");
    console.table(finalizeAdapters);

    console.log("************************ Extensions ************************");
    console.table(finalizeExtensions);

    console.log("************************ TestContracts ************************");
    console.table(finalizeTestContracts);

    console.log("************************ VotingHelpers ************************");
    console.table(finalizeVotingHelpers);

    console.log("************************ Factories ************************");
    console.table(finalizeFactories);

    console.log("************************");
    console.log(`DaoRegistry: ${dao.address}`);
    console.log(`BankExtension: ${extensions.bank.address}`);
    console.log(
      `NFTExtension: ${extensions.nft ? extensions.nft.address : ""}`
    );
    console.log(
      `ERC20Extension: ${
        extensions.erc20Ext ? extensions.erc20Ext.address : ""
      }`
    );
    console.log("************************");
  } else {
    console.log("************************");
    console.log("no migration for network " + network);
    console.log("************************");
  }
});

const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

const formattedOject = (object, name) => {
  const array = [];
  for (let key in object) {
    array.push({
      name: capitalize(key) + name,
      address: object[key] ? object[key].address : ""
    });
  }
  return array;
}

async function deployTestDao(deployFunction, network, accounts, hardhatImports) {
  if (!process.env.DAO_NAME) throw Error("Missing env var: DAO_NAME");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");

  return await deployDao({
    ...hardhatImports,
    deployFunction,
    unitPrice: unitPrice,
    nbUnits: numberOfUnits,
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
    maxChunks: maximumChunks,
    votingPeriod: 10, // 10 secs
    gracePeriod: 1, // 1 sec
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: "0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8",
    offchainAdmin: "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
    daoName: process.env.DAO_NAME,
    owner: accounts[0],
  });
}

async function deployRinkebyDao(deployFunction, network, hardhatImports) {
  if (!process.env.DAO_NAME) throw Error("Missing env var: DAO_NAME");
  if (!process.env.DAO_OWNER_ADDR)
    throw Error("Missing env var: DAO_OWNER_ADDR");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");
  if (!process.env.COUPON_CREATOR_ADDR)
    throw Error("Missing env var: COUPON_CREATOR_ADDR");

    console.log('Start Deploy Rinkeby');

  return await deployDao({
    ...hardhatImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")).toString(),
    nbUnits: toBN("100000").toString(),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
    maxChunks: toBN("100000").toString(),
    votingPeriod: 600, // 600 secs = 10 mins
    gracePeriod: 600, // 600 secs = 10 mins
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR,
    daoName: process.env.DAO_NAME,
    owner: process.env.DAO_OWNER_ADDR,
    offchainAdmin: "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
  });
}

async function deployGanacheDao(deployFunction, network, accounts, hardhatImports) {
  if (!process.env.DAO_NAME)
    throw Error("Missing env var: DAO_NAME");
  if (!process.env.COUPON_CREATOR_ADDR)
    throw Error("Missing env var: COUPON_CREATOR_ADDR");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");

  return await deployDao({
    ...hardhatImports,
    deployFunction,
    unitPrice: toBN(toWei("100", "finney")).toString(),
    nbUnits: toBN("100000").toString(),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: process.env.ERC20_TOKEN_NAME,
    erc20TokenSymbol: process.env.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: process.env.ERC20_TOKEN_DECIMALS,
    maxChunks: toBN("100000").toString(),
    votingPeriod: 120, // 120 secs = 2 mins
    gracePeriod: 60, // 60 secs = 1 min
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    finalize: false,
    maxExternalTokens: 100,
    couponCreatorAddress: process.env.COUPON_CREATOR_ADDR,
    daoName: process.env.DAO_NAME,
    owner: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
    offchainAdmin: "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
  });
}
