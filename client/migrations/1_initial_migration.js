const Migrations = artifacts.require("Migrations");
const DaoFactory = artifacts.require("./core/DaoFactory");
const DaoRegistry = artifacts.require("./core/DaoRegistry");
const FlagHelperLib = artifacts.require("./helpers/FlagHelper");
const VotingContract = artifacts.require("./adapters/VotingContract");
const ConfigurationContract = artifacts.require(
  "./adapter/ConfigurationContract"
);
const ManagingContract = artifacts.require("./adapter/ManagingContract");
const FinancingContract = artifacts.require("./adapter/FinancingContract");
const RagequitContract = artifacts.require("./adapters/RagequitContract");
const GuildKickContract = artifacts.require("./adapters/GuildKickContract");
const OnboardingContract = artifacts.require("./adapters/OnboardingContract");

const fs = require("fs");

module.exports = async (deployer, network, accounts) => {
  if (network !== "local") {
    throw Error("Invalid network");
  }
  const owner = accounts[0];
  console.log("Starting deployment....");
  console.log("Owner: " + owner);

  const contracts = {
    daoFactory: "",
    identityDao: "",
    flagHelperLib: "",
    adapters: {
      voting: "",
      onboarding: "",
      financing: "",
      managing: "",
      ragequit: "",
      guildkick: "",
      configuration: "",
    },
  };

  await deployer
    .deploy(FlagHelperLib, { from: owner })
    .then((flagHelperLib) => (contracts.flagHelperLib = flagHelperLib.address));

  deployer.link(FlagHelperLib, DaoRegistry);

  await deployer.deploy(DaoRegistry, { from: owner }).then((daoRegistry) => {
    contracts.identityDao = daoRegistry.address;
  });

  await deployer
    .deploy(DaoFactory, contracts.identityDao, { from: owner })
    .then((daoFactory) => {
      contracts.daoFactory = daoFactory.address;
    });

  await deployer.deploy(VotingContract, { from: owner }).then((voting) => {
    contracts.adapters.voting = voting.address;
  });

  await deployer
    .deploy(ConfigurationContract, { from: owner })
    .then((config) => {
      contracts.adapters.configuration = config.address;
    });

  await deployer.deploy(RagequitContract, { from: owner }).then((ragequit) => {
    contracts.adapters.ragequit = ragequit.address;
  });

  await deployer.deploy(ManagingContract, { from: owner }).then((managing) => {
    contracts.adapters.managing = managing.address;
  });

  await deployer
    .deploy(FinancingContract, { from: owner })
    .then((financing) => {
      contracts.adapters.financing = financing.address;
    });

  await deployer
    .deploy(OnboardingContract, { from: owner })
    .then((onboarding) => {
      contracts.adapters.onboarding = onboarding.address;
    });

  await deployer
    .deploy(GuildKickContract, { from: owner })
    .then((guildkick) => {
      contracts.adapters.guildkick = guildkick.address;
    });

  await deployer
    .deploy(GuildKickContract, { from: owner })
    .then((guildkick) => {
      contracts.adapters.guildkick = guildkick.address;
    });

  await deployer.deploy(Migrations);

  console.log("==================== Deployed contracts ====================");
  console.log(contracts);
  console.log("============================================================");

  // Save deployed contracts to file in order to read it from client app
  fs.writeFileSync(
    __dirname + "/deployed-contracts.json",
    JSON.stringify(contracts)
  );
};
