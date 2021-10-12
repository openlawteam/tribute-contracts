const { sha3 } = require("./ContractUtil");
const { extensionsIdsMap } = require("./dao-ids");

const daoAccessFlagsMap = {
  REPLACE_ADAPTER: "REPLACE_ADAPTER",
  SUBMIT_PROPOSAL: "SUBMIT_PROPOSAL",
  UPDATE_DELEGATE_KEY: "UPDATE_DELEGATE_KEY",
  SET_CONFIGURATION: "SET_CONFIGURATION",
  ADD_EXTENSION: "ADD_EXTENSION",
  REMOVE_EXTENSION: "REMOVE_EXTENSION",
  NEW_MEMBER: "NEW_MEMBER",
};

const daoAccessFlags = Object.values(daoAccessFlagsMap);

const bankExtensionAclFlagsMap = {
  ADD_TO_BALANCE: "ADD_TO_BALANCE",
  SUB_FROM_BALANCE: "SUB_FROM_BALANCE",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
  WITHDRAW: "WITHDRAW",
  REGISTER_NEW_TOKEN: "REGISTER_NEW_TOKEN",
  REGISTER_NEW_INTERNAL_TOKEN: "REGISTER_NEW_INTERNAL_TOKEN",
  UPDATE_TOKEN: "UPDATE_TOKEN",
};

const bankExtensionAclFlags = Object.values(bankExtensionAclFlagsMap);

const erc20ExtensionAclFlagsMap = {};

const erc20ExtensionAclFlags = Object.values(erc20ExtensionAclFlagsMap);

const erc721ExtensionAclFlagsMap = {
  WITHDRAW_NFT: "WITHDRAW_NFT",
  COLLECT_NFT: "COLLECT_NFT",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
};

const erc721ExtensionAclFlags = Object.values(erc721ExtensionAclFlagsMap);

const erc1155ExtensionAclFlagsMap = {
  WITHDRAW_NFT: "WITHDRAW_NFT",
  COLLECT_NFT: "COLLECT_NFT",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
};

const erc1155ExtensionAclFlags = Object.values(erc1155ExtensionAclFlagsMap);

const erc1271ExtensionAclFlagsMap = {
  SIGN: "SIGN",
};
const erc1271ExtensionAclFlags = Object.values(erc1271ExtensionAclFlagsMap);

const executorExtensionAclFlagsMap = {
  EXECUTE: "EXECUTE",
};
const executorExtensionAclFlags = Object.values(executorExtensionAclFlagsMap);

const vestingExtensionAclFlagsMap = {
  NEW_VESTING: "NEW_VESTING",
  REMOVE_VESTING: "REMOVE_VESTING",
};

const vestingExtensionAclFlags = Object.values(vestingExtensionAclFlagsMap);

const parseSelectedFlags = (allAclFlags, selectedFlags, moduleName) => {
  return selectedFlags
    .map((f) => f.toUpperCase())
    .reduce((flags, flag) => {
      if (allAclFlags.includes(flag)) {
        return { ...flags, [flag]: true };
      }
      throw Error(`Invalid ${moduleName} Access Flag: ${flag}`);
    }, {});
};

const entryERC721 = (contract) => {
  const flags = getEnabledExtensionFlags(
    erc721ExtensionAclFlags,
    extensionsIdsMap.ERC721_EXT,
    contract.configs
  );

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: calculateFlagValue(flags),
  };
};

const entryERC1155 = (contract) => {
  const flags = getEnabledExtensionFlags(
    erc1155ExtensionAclFlags,
    extensionsIdsMap.ERC1155_EXT,
    contract.configs
  );

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: calculateFlagValue(flags),
  };
};

const entryERC20 = (contract) => {
  const flags = getEnabledExtensionFlags(
    erc20ExtensionAclFlags,
    extensionsIdsMap.ERC20_EXT,
    contract.configs
  );

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: calculateFlagValue(flags),
  };
};

const entryBank = (contract) => {
  const flags = getEnabledExtensionFlags(
    bankExtensionAclFlags,
    extensionsIdsMap.BANK_EXT,
    contract.configs
  );

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: calculateFlagValue(flags),
  };
};

const entryERC1271 = (contract) => {
  const flags = getEnabledExtensionFlags(
    erc1271ExtensionAclFlags,
    extensionsIdsMap.ERC1271_EXT,
    contract.configs
  );

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: calculateFlagValue(flags),
  };
};

const entryExecutor = (contract) => {
  const flags = getEnabledExtensionFlags(
    executorExtensionAclFlags,
    extensionsIdsMap.EXECUTOR_EXT,
    contract.configs
  );

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: calculateFlagValue(flags),
  };
};

const entryVesting = (contract) => {
  const flags = getEnabledExtensionFlags(
    vestingExtensionAclFlags,
    extensionsIdsMap.VESTING_EXT,
    contract.configs
  );

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: calculateFlagValue(flags),
  };
};

const entryDao = (contract) => {
  const flags = daoAccessFlags.flatMap((flag) => {
    return contract.configs.acls.dao.some((f) => f === flag);
  });

  return {
    id: sha3(contract.configs.id),
    addr: contract.address,
    flags: calculateFlagValue(flags),
  };
};

const getEnabledExtensionFlags = (flags, extensionId, configs) => {
  return flags.flatMap((flag) => {
    const selectedAcls = configs.acls.extensions;
    return (
      selectedAcls &&
      Object.keys(selectedAcls).length > 0 &&
      selectedAcls[extensionId].some((f) => f === flag)
    );
  });
};

const calculateFlagValue = (values) => {
  return values
    .map((v, idx) => (v === true ? 2 ** idx : 0))
    .reduce((a, b) => a + b);
};

module.exports = {
  parseSelectedFlags,
  calculateFlagValue,
  entryBank,
  entryERC20,
  entryERC721,
  entryERC1155,
  entryERC1271,
  entryDao,
  entryExecutor,
  entryVesting,
  daoAccessFlags,
  daoAccessFlagsMap,
  bankExtensionAclFlags,
  bankExtensionAclFlagsMap,
  erc721ExtensionAclFlags,
  erc721ExtensionAclFlagsMap,
  erc1155ExtensionAclFlags,
  erc1155ExtensionAclFlagsMap,
  erc1271ExtensionAclFlags,
  erc1271ExtensionAclFlagsMap,
  executorExtensionAclFlags,
  executorExtensionAclFlagsMap,
  vestingExtensionAclFlags,
  vestingExtensionAclFlagsMap,
  erc20ExtensionAclFlags,
  erc20ExtensionAclFlagsMap,
};
