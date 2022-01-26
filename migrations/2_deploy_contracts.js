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
} = require("../utils/contract-util");
const { log } = require("../utils/log-util");
const pkgJson = require("../package.json");
const { deployDao } = require("../utils/deployment-util");
const { deployConfigs } = require("../deploy-config");
require("dotenv").config();

module.exports = async (deployer, network, accounts) => {
  const daoOwnerAddr = process.env.DAO_OWNER_ADDR;
  log(`DaoOwner: ${daoOwnerAddr}`);
  log(`Deployment started at: ${new Date().toISOString()}`);
  log(`Deploying tribute-contracts@${pkgJson.version} to ${network} network`);

  const {
    contracts: contractConfigs,
  } = require(`.../configs/networks/${network}.config`);
  const truffleImports = require("../utils/truffle-util")(
    contractConfigs,
    network
  );
  const daoArtifacts = await getOrCreateDaoArtifacts(deployer, truffleImports);

  const deployFunction = truffleImports.deployFunctionFactory(
    deployer,
    daoArtifacts
  );

  const result = await deploy({
    network,
    deployFunction,
    attachFunction: truffleImports.attachFunction,
    truffleImports,
    accounts,
    contractConfigs,
  });

  const { dao, factories, extensions, adapters, testContracts, utilContracts } =
    result;

  if (dao) {
    if (network === "ganache") await dao.finalizeDao();
    else await dao.finalizeDao({ from: daoOwnerAddr });

    log("************************************************");
    log(`DaoOwner: ${daoOwnerAddr}`);
    log(`DaoRegistry: ${dao.address}`);
    const addresses = {};
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
  } else {
    log("************************************************");
    log("no migration for network " + network);
    log("************************************************");
  }
  log(`Deployment completed at: ${new Date().toISOString()}`);
};

const deployRinkebyDao = async ({
  deployFunction,
  truffleImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...truffleImports,
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
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(1000)),
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

const deployMainnetDao = async ({
  deployFunction,
  truffleImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...truffleImports,
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
    couponCreatorAddress: getEnvVar("COUPON_CREATOR_ADDR"),
    kycSignerAddress: getEnvVar("KYC_SIGNER_ADDR"),
    kycMaxMembers: getEnvVar("KYC_MAX_MEMBERS"),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getEnvVar("OFFCHAIN_ADMIN_ADDR"),
    weth: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getEnvVar("GELATO_ADDR"),
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployGanacheDao = async ({
  deployFunction,
  accounts,
  truffleImports,
  contractConfigs,
}) => {
  const daoOwnerAddress = accounts[0];

  const { WETH } = truffleImports;
  const weth = await deployFunction(WETH);

  return await deployDao({
    ...truffleImports,
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
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      daoOwnerAddress
    ),
    kycSignerAddress: getOptionalEnvVar("KYC_SIGNER_ADDR", daoOwnerAddress),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(1000)),
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
  truffleImports,
  contractConfigs,
}) => {
  const daoOwnerAddress = accounts[0];
  const { WETH } = truffleImports;

  const weth = await deployFunction(WETH);

  return await deployDao({
    ...truffleImports,
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
    couponCreatorAddress: daoOwnerAddress,
    kycSignerAddress: daoOwnerAddress,
    kycMaxMembers: toBN("1000"),
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
  truffleImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...truffleImports,
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
    couponCreatorAddress: getEnvVar("COUPON_CREATOR_ADDR"),
    kycSignerAddress: getEnvVar("KYC_SIGNER_ADDR"),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(99)),
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
  truffleImports,
  contractConfigs,
}) => {
  const { WETH } = truffleImports;
  const weth = await deployFunction(WETH);
  return await deployDao({
    ...truffleImports,
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
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(1000)),
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
  truffleImports,
  contractConfigs,
}) => {
  return await deployDao({
    ...truffleImports,
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
    couponCreatorAddress: getEnvVar("COUPON_CREATOR_ADDR"),
    kycSignerAddress: getEnvVar("KYC_SIGNER_ADDR"),
    kycMaxMembers: getEnvVar("KYC_MAX_MEMBERS"),
    kycFundTargetAddress: getOptionalEnvVar(
      "KYC_MULTISIG_FUND_ADDR",
      ZERO_ADDRESS
    ),
    daoName: getEnvVar("DAO_NAME"),
    owner: getEnvVar("DAO_OWNER_ADDR"),
    offchainAdmin: getEnvVar("OFFCHAIN_ADMIN_ADDR"),
    weth: getEnvVar("WRAPPED_ETH_ADDR"),
    gasPriceLimit: getOptionalEnvVar("GAS_PRICE_LIMIT", 0 /* disabled */),
    spendLimitPeriod: getOptionalEnvVar("SPEND_LIMIT_PERIOD", 0 /* disabled */),
    spendLimitEth: getOptionalEnvVar("SPEND_LIMIT_ETH", 0 /* disabled */),
    gelato: getEnvVar("GELATO_ADDR"),
    maintainerTokenAddress: getOptionalEnvVar("MAINTAINER_TOKEN_ADDR", UNITS),
  });
};

const deployPolygonTestDao = async ({
  deployFunction,
  truffleImports,
  contractConfigs,
}) => {
  const { WETH } = truffleImports;

  const weth = await deployFunction(WETH);

  return await deployDao({
    ...truffleImports,
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
    couponCreatorAddress: getOptionalEnvVar(
      "COUPON_CREATOR_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycSignerAddress: getOptionalEnvVar(
      "KYC_SIGNER_ADDR",
      getEnvVar("DAO_OWNER_ADDR")
    ),
    kycMaxMembers: getOptionalEnvVar("KYC_MAX_MEMBERS", toBN(1000)),
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

const deploy = async (opts) => {
  const action = DeploymentActions[opts.network];
  if (action) {
    return action(opts);
  }
  throw new Error(`Unsupported operation ${opts.network}`);
};

const getOrCreateDaoArtifacts = async (deployer, truffleImports) => {
  const DaoArtifacts = truffleImports.DaoArtifacts;
  let daoArtifacts;
  if (process.env.DAO_ARTIFACTS_CONTRACT_ADDR) {
    log(`Attach to existing DaoArtifacts contract`);
    daoArtifacts = await DaoArtifacts.at(
      process.env.DAO_ARTIFACTS_CONTRACT_ADDR
    );
  } else {
    log(`Creating new DaoArtifacts contract`);
    await deployer.deploy(DaoArtifacts);
    daoArtifacts = await DaoArtifacts.deployed();
  }
  log(`DaoArtifacts: ${daoArtifacts.address}`);
  return daoArtifacts;
};

const getEnvVar = (name) => {
  if (!process.env[name]) throw Error(`Missing env var: ${name}`);
  return process.env[name];
};

const getOptionalEnvVar = (name, defaultValue) => {
  const envVar = process.env[name];
  return envVar ? envVar : defaultValue;
};

const saveDeployedContracts = (network, addresses) => {
  const now = new Date().toISOString();
  const dir = path.resolve(deployConfigs.deployedContractsDir);
  const file = `${dir}/contracts-${network}-${now}.json`;
  fs.writeFileSync(`${file}`, JSON.stringify(addresses), "utf8");
  log("************************************************");
  log(`\nDeployed contracts: ${file}\n`);
};

const DeploymentActions = {
  mainnet: deployMainnetDao,
  ganache: deployGanacheDao,
  harmony: deployHarmonyDao,
  harmonytest: deployHarmonyTestDao,
  polygon: deployPolygonDao,
  polygontest: deployPolygonTestDao,
  // Goerli and Rinkeby should be treated the same
  goerli: deployRinkebyDao,
  rinkeby: deployRinkebyDao,
  // Test and Coverage should be treated the same
  test: deployTestDao,
  coverage: deployTestDao,
};
