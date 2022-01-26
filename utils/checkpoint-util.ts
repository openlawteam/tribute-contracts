const fs = require("fs");
const path = require("path");
const {
  ContractType,
  ContractConfig,
} = require("../configs/contracts.config");
const { deployConfigs } = require("../deploy-config");
const checkpointDir = path.resolve(deployConfigs.checkpointDir);
const checkpointPath = path.resolve(
  `${checkpointDir}/%network%-checkpoints.json`
);

const log = (msg: string) => {
  if (process.env.DEBUG === "true") console.log(msg);
};

const save = (checkpoints: JSON, network: string) => {
  fs.writeFileSync(
    checkpointPath.replace("%network%", network),
    JSON.stringify(checkpoints),
    "utf-8"
  );
};

const load = (network: string) => {
  try {
    return JSON.parse(
      fs.readFileSync(checkpointPath.replace("%network%", network), "utf-8")
    );
  } catch (e) {
    return {};
  }
};

export const checkpoint = (contract: any, network: string) => {
  try {
    if (
      contract.configs.type === ContractType.Core ||
      contract.configs.type === ContractType.Factory ||
      contract.configs.type === ContractType.Extension
    ) {
      return contract;
    }

    if (!fs.existsSync(checkpointDir)) {
      fs.mkdirSync(checkpointDir);
    }
    const checkpoints = load(network);
    checkpoints[contract.configs.name] = {
      address: contract.address,
      ts: new Date().getTime(),
    };
    save(checkpoints, network);
    log(`Checkpoint: ${contract.configs.name}:${contract.address}`);
  } catch (e) {
    console.error(e);
  }
  return contract;
};

export const restore = async (
  contractInterface: any,
  contractConfig: typeof ContractConfig,
  attach: Function,
  network: string
) => {
  const checkpoints = load(network);
  const checkpoint = checkpoints[contractConfig.name];
  if (checkpoint) {
    console.log(`
    Contract restored '${contractConfig.name}'
    -------------------------------------------------
     contract address: ${checkpoint.address}`);
    return await attach(contractInterface, checkpoint.address);
  }
  return null;
};
