const { getContract } = require("../utils/contract");
const { sha3 } = require("../../../utils/ContractUtil");

const getDAOConfig = async (configKey, daoAddress, network) => {
  const { contract } = getContract("DaoRegistry", network, daoAddress);
  return await contract.getConfiguration(sha3(configKey));
};

module.exports = { getDAOConfig };
