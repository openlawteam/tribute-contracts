const fs = require("fs");
const path = require("path");

const {
  toBN,
  toWei,
  ETH_TOKEN,
  ZERO_ADDRESS,
  UNITS,
  maximumChunks,
  unitPrice,
  numberOfUnits,
  maxAmount,
  maxUnits,
  waitTx,
} = require("../utils/contract-util");
const pkgJson = require("../package.json");
const { deployDao } = require("../utils/deployment-util");
const { log, info } = require("../utils/log-util");
const { deployConfigs } = require("../deploy-config");
require("dotenv").config({ path: "../.env" });

task("deploy", "Deploy the list of contracts", async (args, hre) => {
  const { network } = hre.hardhatArguments;

  log(`Deployment started at ${new Date().toISOString()}`);
  log(`Deploying tribute-contracts@${pkgJson.version} to ${network} network`);

  const {
    contracts: contractConfigs,
  } = require(`../configs/networks/${network}.config`);
  const hardhatImports = await require("../utils/hardhat-util.js")(
    contractConfigs,
    network
  );

  const daoArtifacts = await getOrCreateDaoArtifacts(hre, hardhatImports);
  const deployFunction = await hardhatImports.deployFunctionFactory(
    hre,
    daoArtifacts
  );
  const accounts = await hre.ethers.getSigners();
  info(
    `\nAvailable Accounts\n-----------------------------------------------------------`
  );
  accounts.map((a, i) => log(`  Account ${i}: ${a.address}`));
  info(`-----------------------------------------------------------`);

  info(`\n Deploying contracts...\n`);
  const result = await deploy({
    network,
    deployFunction,
    attachFunction: hardhatImports.attachFunction,
    contractImports: hardhatImports,
    contractConfigs,
    accounts,
  });

  const {
    dao,
    factories,
    extensions,
    adapters,
    testContracts,
    utilContracts,
    owner,
  } = result;

  if (dao) {
    info(`\n Finalize DAO creation...\n`);
    const tx = await waitTx(dao.finalizeDao());
    info(`\n DAO finalized @ blockNumber: ${tx.blockNumber}\n`);

    info(`\n Deployment completed with success.\n`);
    const addresses = {
      // The addresses of all identity contracts
      identities: {
        DaoRegistry: dao.identity.address,
      },
      DaoRegistry: dao.address,
    };

    info(
      `\nIdentity Contracts\n-----------------------------------------------------------`
    );
    log(`DaoRegistry: ${addresses.identities.DaoRegistry}`);
    Object.values(extensions)
      .filter((f) => f.identity)
      .forEach((c) => {
        log(`${c.configs.name}: ${c.identity.address}`);
        addresses.identities[c.configs.name] = c.identity.address;
      });

    info(
      `\nDAO Contracts\n-----------------------------------------------------------`
    );
    log(`DaoOwner: ${owner}`);
    log(`DaoRegistry: ${dao.address}`);
    Object.values(factories)
      .concat(Object.values(extensions))
      .concat(Object.values(adapters))
      .concat(Object.values(testContracts))
      .concat(Object.values(utilContracts))
      .forEach((c) => {
        log(`${c.configs.name}: ${c.address}`);
        addresses[c.configs.name] = c.address;
      });

    saveDeployedContracts(network, addresses);
    log(
      `Deployment to ${network} network was completed at ${new Date().toISOString()}`
    );
  } else {
    log("-------------------------------------------------");
    log(`There is no deployment script for ${network} network`);
    log("-------------------------------------------------");
  }
});

const deployGoerliDao = async ({
  deployFunction,
  attachFunction,
  contractImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    attachFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: getOptionalEnvVar("UNIT_PRICE", toWei("0.1")),
    nbUnits: getOptionalEnvVar("UNITS_PER_CHUNK", toBN("100000")),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    tokenAddr: getOptionalEnvVar("PAYMENT_TOKEN_ADDR", ETH_TOKEN),
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: getOptionalEnvVar("MAX_CHUNKS", maximumChunks),
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 300), // 300 secs = 5 min
    offchainVoting: true,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: getOptionalEnvVar(
      "MANAGER_COUPON_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(1000)),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    deployTestTokens: false,
    supplyTestToken1: 1000000,
    supplyTestToken2: 1000000,
    supplyPixelNFT: 100,
    supplyOLToken: toBN("1000000000000000000000000"),
    erc1155TestTokenUri: "1155 test token",
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar(
      "GELATO_ADDR",
      "0xDe6ab16a4015c680daab58021815D09ddB57db8E"
    ),
    weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deploySepoliaDao = async ({
  deployFunction,
  attachFunction,
  contractImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    attachFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: getOptionalEnvVar("UNIT_PRICE", toWei("0.1")),
    nbUnits: getOptionalEnvVar("UNITS_PER_CHUNK", toBN("100000")),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    tokenAddr: getOptionalEnvVar("PAYMENT_TOKEN_ADDR", ETH_TOKEN),
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: getOptionalEnvVar("MAX_CHUNKS", maximumChunks),
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 300), // 300 secs = 5 min
    offchainVoting: true,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: getOptionalEnvVar(
      "MANAGER_COUPON_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(1000)),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    deployTestTokens: false,
    supplyTestToken1: 1000000,
    supplyTestToken2: 1000000,
    supplyPixelNFT: 100,
    supplyOLToken: toBN("1000000000000000000000000"),
    erc1155TestTokenUri: "1155 test token",
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar(
      "GELATO_ADDR",
      "0xDe6ab16a4015c680daab58021815D09ddB57db8E"
    ),
    weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployMainnetDao = async ({
  deployFunction,
  contractImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: getOptionalEnvVar("UNIT_PRICE", toWei("0.1")),
    nbUnits: getOptionalEnvVar("UNITS_PER_CHUNK", toBN("100000")),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    tokenAddr: getOptionalEnvVar("PAYMENT_TOKEN_ADDR", ETH_TOKEN),
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 300), // 300 secs = 5 min
    offchainVoting: true,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: getOptionalEnvVar(
      "MANAGER_COUPON_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN("100")),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    maxChunks: getOptionalEnvVar("MAX_CHUNKS", maximumChunks),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    weth: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar(
      "GELATO_ADDR",
      "0xDe6ab16a4015c680daab58021815D09ddB57db8E"
    ),
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployGnosisDao = async ({
  deployFunction,
  contractImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: getOptionalEnvVar("UNIT_PRICE", toWei("0.1")),
    nbUnits: getOptionalEnvVar("UNITS_PER_CHUNK", toBN("100000")),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    tokenAddr: getOptionalEnvVar("PAYMENT_TOKEN_ADDR", ETH_TOKEN),
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 300), // 300 secs = 5 min
    offchainVoting: true,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: getOptionalEnvVar(
      "MANAGER_COUPON_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN("100")),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    maxChunks: getOptionalEnvVar("MAX_CHUNKS", maximumChunks),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    weth: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", // wrapped xdai
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar(
      "GELATO_ADDR",
      "0xDe6ab16a4015c680daab58021815D09ddB57db8E"
    ),
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployGanacheDao = async ({
  deployFunction,
  accounts,
  contractImports,
  contractConfigs,
}) => {
  const daoOwnerAddress = accounts[0].address;
  const { WETH } = contractImports;
  const factory = await hre.ethers.getContractFactory(WETH.contractName);
  const res = await factory.deploy();
  const weth = await res.deployed();

  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: toWei("0.1"),
    nbUnits: toBN("100000"),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: getOptionalEnvVar("MAX_CHUNKS", maximumChunks),
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 120), // 120 secs = 2 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 60), // 600 secs = 1 min
    offchainVoting: true,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: getOptionalEnvVar(
      "MANAGER_COUPON_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      daoOwnerAddress
    ),
    kycSignerAddress: getOptionalEnvVar("KYC_SIGNER_ADDR", daoOwnerAddress),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(1000)),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: daoOwnerAddress,
    offchainAdmin: getOptionalEnvVar("OFFCHAIN_ADMIN_ADDR", daoOwnerAddress),
    deployTestTokens: true,
    supplyTestToken1: 1000000,
    supplyTestToken2: 1000000,
    supplyPixelNFT: 100,
    supplyOLToken: toBN("1000000000000000000000000"),
    erc1155TestTokenUri: "1155 test token",
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar(
      "GELATO_ADDR",
      "0xDe6ab16a4015c680daab58021815D09ddB57db8E"
    ),
    weth: weth.address,
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployTestDao = async ({
  deployFunction,
  accounts,
  contractImports,
  contractConfigs,
}) => {
  const daoOwnerAddress = accounts[0];
  const { WETH } = contractImports;

  const weth = await deployFunction(WETH);

  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: unitPrice,
    nbUnits: numberOfUnits,
    maxUnits: numberOfUnits,
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: maximumChunks,
    votingPeriod: 10, // 10 secs
    gracePeriod: 1, // 1 sec
    offchainVoting: true,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: daoOwnerAddress,
    couponCreatorAddress: daoOwnerAddress,
    kycSignerAddress: daoOwnerAddress,
    kycMaxMembers: toBN("1000"),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    offchainAdmin: daoOwnerAddress,
    daoName: getEnvVar("DAO_NAME"),
    owner: accounts[0],
    weth: weth.address,
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar(
      "GELATO_ADDR",
      "0xDe6ab16a4015c680daab58021815D09ddB57db8E"
    ),
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployHarmonyDao = async ({
  deployFunction,
  contractImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: toWei("0.1"),
    nbUnits: toBN("100000"),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: getOptionalEnvVar("MAX_CHUNKS", maximumChunks),
    votingPeriod: parseInt(getEnvVar("VOTING_PERIOD_SECONDS")),
    gracePeriod: parseInt(getEnvVar("GRACE_PERIOD_SECONDS")),
    offchainVoting: true,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: getEnvVar("MANAGER_COUPON_SIGNER_ADDR"),
    couponCreatorAddress: getEnvVar("COUPON_CREATOR_ADDR"),
    kycSignerAddress: getEnvVar("KYC_SIGNER_ADDR"),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(99)),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getEnvVar("OFFCHAIN_ADMIN_ADDR"),
    weth: getEnvVar("WETH_ADDR"),
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar(
      "GELATO_ADDR",
      "0xDe6ab16a4015c680daab58021815D09ddB57db8E"
    ),
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployHarmonyTestDao = async ({
  deployFunction,
  contractImports,
  contractConfigs,
}) => {
  const { WETH } = contractImports;
  const weth = await deployFunction(WETH);
  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: toWei("0.1"),
    nbUnits: toBN("100000"),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: getOptionalEnvVar("MAX_CHUNKS", maximumChunks),
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 600), // 600 secs = 10 min
    offchainVoting: true,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: getOptionalEnvVar(
      "MANAGER_COUPON_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(1000)),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    deployTestTokens: true,
    supplyTestToken1: 1000000,
    supplyTestToken2: 1000000,
    supplyPixelNFT: 100,
    supplyOLToken: toBN("1000000000000000000000000"),
    erc1155TestTokenUri: "1155 test token",
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar("GELATO_ADDR", ZERO_ADDRESS),
    weth: weth.address,
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployPolygonDao = async ({
  deployFunction,
  contractImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: getOptionalEnvVar("UNIT_PRICE", toWei("0.1")),
    nbUnits: getOptionalEnvVar("UNITS_PER_CHUNK", toBN("100000")),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    tokenAddr: getOptionalEnvVar("PAYMENT_TOKEN_ADDR", ETH_TOKEN),
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 300), // 300 secs = 5 min
    offchainVoting: true,
    deployTestTokens: false,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: getOptionalEnvVar(
      "MANAGER_COUPON_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN("100")),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    maxChunks: getOptionalEnvVar("MAX_CHUNKS", maximumChunks),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    weth: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270" /* WMATIC */,
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar(
      "GELATO_ADDR",
      "0xDe6ab16a4015c680daab58021815D09ddB57db8E"
    ),
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployPolygonTestDao = async ({
  deployFunction,
  contractImports,
  contractConfigs,
}) => {
  const { WETH } = contractImports;

  const weth = await deployFunction(WETH);

  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: toWei("0.1"),
    nbUnits: toBN("100000"),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: getOptionalEnvVar("MAX_CHUNKS", maximumChunks),
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 600), // 600 secs = 10 min
    offchainVoting: true,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: getOptionalEnvVar(
      "MANAGER_COUPON_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(1000)),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    deployTestTokens: true,
    supplyTestToken1: 1000000,
    supplyTestToken2: 1000000,
    supplyPixelNFT: 100,
    supplyOLToken: toBN("1000000000000000000000000"),
    erc1155TestTokenUri: "1155 test token",
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar("GELATO_ADDR", ZERO_ADDRESS),
    weth: weth.address,
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployAvalancheTestDao = async ({
  deployFunction,
  attachFunction,
  contractImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    attachFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: toWei("0.1"),
    nbUnits: toBN("100000"),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: getOptionalEnvVar("MAX_CHUNKS", maximumChunks),
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 600), // 600 secs = 10 min
    offchainVoting: true,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: getOptionalEnvVar(
      "MANAGER_COUPON_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(1000)),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    deployTestTokens: true,
    supplyTestToken1: 1000000,
    supplyTestToken2: 1000000,
    supplyPixelNFT: 100,
    supplyOLToken: toBN("1000000000000000000000000"),
    erc1155TestTokenUri: "1155 test token",
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar(
      "GELATO_ADDR",
      "0xDe6ab16a4015c680daab58021815D09ddB57db8E"
    ),
    weth: "0xc778417e063141139fce010982780140aa0cd5ab",
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployAvalancheDao = async ({
  deployFunction,
  attachFunction,
  contractImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...contractImports,
    contractConfigs,
    deployFunction,
    attachFunction,
    maxAmount: getOptionalEnvVar("MAX_AMOUNT", maxAmount),
    unitPrice: toWei("0.1"),
    nbUnits: toBN("100000"),
    maxUnits: getOptionalEnvVar("MAX_UNITS", maxUnits),
    tokenAddr: ETH_TOKEN,
    erc20TokenName: getEnvVar("ERC20_TOKEN_NAME"),
    erc20TokenSymbol: getEnvVar("ERC20_TOKEN_SYMBOL"),
    erc20TokenDecimals: getEnvVar("ERC20_TOKEN_DECIMALS"),
    erc20TokenAddress: UNITS,
    maxChunks: getOptionalEnvVar("MAX_CHUNKS", maximumChunks),
    votingPeriod: getOptionalEnvVar("VOTING_PERIOD_SECONDS", 600), // 600 secs = 10 min
    gracePeriod: getOptionalEnvVar("GRACE_PERIOD_SECONDS", 600), // 600 secs = 10 min
    offchainVoting: true,
    finalize: false,
    maxExternalTokens: 100,
    managerSignerAddress: getOptionalEnvVar(
      "MANAGER_COUPON_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(1000)),
    kycCanTopUp: getOptionalEnvVar("KYC_CAN_TOP_UP", 0),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getOptionalEnvVar(
      "OFFCHAIN_ADMIN_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    deployTestTokens: true,
    supplyTestToken1: 1000000,
    supplyTestToken2: 1000000,
    supplyPixelNFT: 100,
    supplyOLToken: toBN("1000000000000000000000000"),
    erc1155TestTokenUri: "1155 test token",
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getOptionalEnvVar(
      "GELATO_ADDR",
      "0xDe6ab16a4015c680daab58021815D09ddB57db8E"
    ),
    weth: "0xc778417e063141139fce010982780140aa0cd5ab",
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deploy = async (opts) => {
  const action = DeploymentActions[opts.network];
  if (action) {
    return action(opts);
  }
  throw new Error(`Unsupported operation ${opts.network}`);
};

const getOrCreateDaoArtifacts = async (hre, hardHatImports) => {
  const DaoArtifacts = hardHatImports.DaoArtifacts;
  let daoArtifacts;
  const factory = await hre.ethers.getContractFactory(
    DaoArtifacts.contractName
  );
  if (process.env.DAO_ARTIFACTS_CONTRACT_ADDR) {
    log("Attach to existing DaoArtifacts contract");
    daoArtifacts = await factory.attach(
      process.env.DAO_ARTIFACTS_CONTRACT_ADDR
    );
  } else {
    log("Creating new DaoArtifacts contract");
    const daoArtifact = await factory.deploy();
    daoArtifacts = await daoArtifact.deployed();
  }
  log(`DaoArtifacts: ${daoArtifacts.address}`);
  return daoArtifacts;
};

const getEnvVar = (name) => {
  if (!process.env[name]) {
    throw Error(`Missing env var: ${name}`);
  }
  return process.env[name];
};

const getOptionalEnvVar = (name, defaultValue) => {
  const envVar = process.env[name];
  return envVar ? envVar : defaultValue;
};

const saveDeployedContracts = (network, addresses) => {
  const now = new Date().toISOString();
  const dir = path.resolve(deployConfigs.deployedContractsDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const file = `${dir}/contracts-${network}-${now}.json`;
  fs.writeFileSync(`${file}`, JSON.stringify(addresses), "utf8");
  log(`\nDeployed contracts: ${file}\n`);
};

const DeploymentActions = {
  mainnet: deployMainnetDao,
  gnosis: deployGnosisDao,
  goerli: deployGoerliDao,
  sepolia: deploySepoliaDao,
  ganache: deployGanacheDao,
  harmony: deployHarmonyDao,
  harmonytest: deployHarmonyTestDao,
  polygon: deployPolygonDao,
  polygontest: deployPolygonTestDao,
  avalanchetest: deployAvalancheTestDao,
  avalanche: deployAvalancheDao,

  // Test and Coverage should be treated the same
  test: deployTestDao,
  coverage: deployTestDao,
};
