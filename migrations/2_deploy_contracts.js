const {
  toBN,
  toWei,
  maximumChunks,
  unitPrice,
  numberOfUnits,
} = require("../utils/ContractUtil.js");

const { deployDao, getNetworkDetails } = require("../utils/DeploymentUtil.js");

const truffleImports = require("../utils/TruffleUtil.js");

require("dotenv").config();

module.exports = async (deployer, network, accounts) => {
  let res;
  const deployFunction = truffleImports.deployFunctionFactory(deployer);
  if (network === "ganache") {
    res = await deployGanacheDao(deployFunction, network, accounts);
  } else if (network === "goerli") {
    res = await deployGoerliDao(deployFunction, network);
  } else if (network === "mainnet") {
    res = await deployMainnetDao(deployFunction, network);
  } else if (network === "test" || network === "coverage") {
    res = await deployTestDao(deployFunction, network, accounts);
  }
  let { dao, extensions } = res;
  if (dao) {
    await dao.finalizeDao();
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
};

async function deployTestDao(deployFunction, network, accounts) {
  if (!process.env.DAO_NAME) throw Error("Missing env var: DAO_NAME");
  if (!process.env.ERC20_TOKEN_NAME)
    throw Error("Missing env var: ERC20_TOKEN_NAME");
  if (!process.env.ERC20_TOKEN_SYMBOL)
    throw Error("Missing env var: ERC20_TOKEN_SYMBOL");
  if (!process.env.ERC20_TOKEN_DECIMALS)
    throw Error("Missing env var: ERC20_TOKEN_DECIMALS");

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: unitPrice,
    nbUnits: numberOfUnits,
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
    fundTargetAddress: "0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05",
    offchainAdmin: "0xedC10CFA90A135C41538325DD57FDB4c7b88faf7",
    daoName: process.env.DAO_NAME,
    owner: accounts[0],
  });
}

async function deployGoerliDao(deployFunction, network) {
  const envVariables = checkEnvVariable(
    "DAO_NAME",
    "DAO_OWNER_ADDR",
    "ERC20_TOKEN_NAME",
    "ERC20_TOKEN_SYMBOL",
    "ERC20_TOKEN_DECIMALS",
    "COUPON_CREATOR_ADDR",
    "FUND_TARGET_ADDR",
    "VOTING_PERIOD_SECONDS",
    "GRACE_PERIOD_SECONDS",
    "OFFCHAIN_ADMIN_ADDR",
    "CHUNK_PRICE",
    "UNITS_PER_CHUNK",
    "MAX_CHUNKS",
    "MAX_MEMBERS",
    "MAX_UNITS",
    "KYC_PAYMENT_TOKEN",
    "MANAGER_COUPON_SIGNER_ADDR"
  );

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: envVariables.CHUNK_PRICE,
    nbUnits: envVariables.UNITS_PER_CHUNK,
    erc20TokenName: envVariables.ERC20_TOKEN_NAME,
    erc20TokenSymbol: envVariables.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: envVariables.ERC20_TOKEN_DECIMALS,
    maxChunks: envVariables.MAX_CHUNKS,
    votingPeriod: envVariables.VOTING_PERIOD_SECONDS,
    gracePeriod: envVariables.GRACE_PERIOD_SECONDS,
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: true,
    maxExternalTokens: 100,
    couponCreatorAddress: envVariables.COUPON_CREATOR_ADDR,
    fundTargetAddress: envVariables.FUND_TARGET_ADDR,
    managerSignerAddress: envVariables.MANAGER_COUPON_SIGNER_ADDR,
    daoName: envVariables.DAO_NAME,
    owner: envVariables.DAO_OWNER_ADDR,
    offchainAdmin: envVariables.OFFCHAIN_ADMIN_ADDR,
    maxMembers: envVariables.MAX_MEMBERS,
    maxUnits: envVariables.MAX_UNITS,
    wethAddress: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    kycPaymentToken: envVariables.KYC_PAYMENT_TOKEN,
  });
}

function checkEnvVariable(...names) {
  let envVariables = {};
  Array.from(names).forEach((name) => {
    if (!process.env[name]) throw Error("Missing env var: " + name);
    envVariables[name] = process.env[name];
  });

  return envVariables;
}

async function deployMainnetDao(deployFunction, network) {
  const envVariables = checkEnvVariable(
    "DAO_NAME",
    "DAO_OWNER_ADDR",
    "ERC20_TOKEN_NAME",
    "ERC20_TOKEN_SYMBOL",
    "ERC20_TOKEN_DECIMALS",
    "COUPON_CREATOR_ADDR",
    "FUND_TARGET_ADDR",
    "VOTING_PERIOD_SECONDS",
    "GRACE_PERIOD_SECONDS",
    "OFFCHAIN_ADMIN_ADDR",
    "CHUNK_PRICE",
    "UNITS_PER_CHUNK",
    "MAX_CHUNKS",
    "MAX_MEMBERS",
    "MAX_UNITS",
    "KYC_PAYMENT_TOKEN",
    "MANAGER_COUPON_SIGNER_ADDR"
  );

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: envVariables.CHUNK_PRICE,
    nbUnits: envVariables.UNITS_PER_CHUNK,
    erc20TokenName: envVariables.ERC20_TOKEN_NAME,
    erc20TokenSymbol: envVariables.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: envVariables.ERC20_TOKEN_DECIMALS,
    maxChunks: envVariables.MAX_CHUNKS,
    votingPeriod: envVariables.VOTING_PERIOD_SECONDS,
    gracePeriod: envVariables.GRACE_PERIOD_SECONDS,
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: false,
    finalize: true,
    maxExternalTokens: 100,
    couponCreatorAddress: envVariables.COUPON_CREATOR_ADDR,
    fundTargetAddress: envVariables.FUND_TARGET_ADDR,
    managerSignerAddress: envVariables.MANAGER_COUPON_SIGNER_ADDR,
    daoName: envVariables.DAO_NAME,
    owner: envVariables.DAO_OWNER_ADDR,
    offchainAdmin: envVariables.OFFCHAIN_ADMIN_ADDR,
    maxMembers: envVariables.MAX_MEMBERS,
    maxUnits: envVariables.MAX_UNITS,
    wethAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    kycPaymentToken: envVariables.KYC_PAYMENT_TOKEN,
  });
}

async function deployGanacheDao(deployFunction, network, accounts) {
  const envVariables = checkEnvVariable(
    "DAO_NAME",
    "DAO_OWNER_ADDR",
    "ERC20_TOKEN_NAME",
    "ERC20_TOKEN_SYMBOL",
    "ERC20_TOKEN_DECIMALS",
    "COUPON_CREATOR_ADDR",
    "FUND_TARGET_ADDR",
    "VOTING_PERIOD_SECONDS",
    "GRACE_PERIOD_SECONDS",
    "OFFCHAIN_ADMIN_ADDR",
    "CHUNK_PRICE",
    "UNITS_PER_CHUNK",
    "MAX_CHUNKS",
    "MAX_MEMBERS",
    "MAX_UNITS",
    "KYC_PAYMENT_TOKEN",
    "MANAGER_COUPON_SIGNER_ADDR"
  );

  return await deployDao({
    ...truffleImports,
    deployFunction,
    unitPrice: envVariables.CHUNK_PRICE,
    nbUnits: envVariables.UNITS_PER_CHUNK,
    erc20TokenName: envVariables.ERC20_TOKEN_NAME,
    erc20TokenSymbol: envVariables.ERC20_TOKEN_SYMBOL,
    erc20TokenDecimals: envVariables.ERC20_TOKEN_DECIMALS,
    maxChunks: envVariables.MAX_CHUNKS,
    votingPeriod: envVariables.VOTING_PERIOD_SECONDS,
    gracePeriod: envVariables.GRACE_PERIOD_SECONDS,
    offchainVoting: true,
    chainId: getNetworkDetails(network).chainId,
    deployTestTokens: true,
    // deployTestTokens: false,
    finalize: true,
    maxExternalTokens: 100,
    couponCreatorAddress: envVariables.COUPON_CREATOR_ADDR,
    fundTargetAddress: envVariables.FUND_TARGET_ADDR,
    managerSignerAddress: envVariables.MANAGER_COUPON_SIGNER_ADDR,
    daoName: envVariables.DAO_NAME,
    owner: envVariables.DAO_OWNER_ADDR,
    offchainAdmin: envVariables.OFFCHAIN_ADMIN_ADDR,
    maxMembers: envVariables.MAX_MEMBERS,
    maxUnits: envVariables.MAX_UNITS,
    wethAddress: "0x2589D644549D794ed63bC3C051D72FDcDC1a875A",
    kycPaymentToken: envVariables.KYC_PAYMENT_TOKEN,
  });
}
