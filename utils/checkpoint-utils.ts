const fs = require("fs");
const path = require("path");
const {
  ContractType,
  ContractConfig,
} = require("../migrations/configs/contracts.config");
const { deployConfigs } = require("../deploy-config");
const checkpointDir = path.resolve(deployConfigs.checkpointDir);
const checkpointPath = path.resolve(`${checkpointDir}/checkpoints.json`);

const log = (msg: string) => {
  if (process.env.DEBUG === "true") console.log(msg);
};

const save = (checkpoints: JSON) => {
  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoints), "utf-8");
};

const load = () => {
  try {
    return JSON.parse(fs.readFileSync(checkpointPath, "utf-8"));
  } catch (e) {
    return {};
  }
};

export const checkpoint = (contract: any) => {
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
    const checkpoints = load();
    checkpoints[contract.configs.name] = {
      address: contract.address,
      ts: new Date().getTime(),
    };
    save(checkpoints);
    log(`Checkpoint: ${contract.configs.name}:${contract.address}`);
  } catch (e) {
    console.error(e);
  }
  return contract;
};

export const restore = async (
  contractInterface: any,
  contractConfigs: typeof ContractConfig
) => {
  const checkpoints = load();
  const checkpoint = checkpoints[contractConfigs.name];
  if (checkpoint) {
    log(`Restored: ${contractConfigs.name}:${checkpoint.address}`);
    return await contractInterface.at(checkpoint.address);
  }
  return null;
};
