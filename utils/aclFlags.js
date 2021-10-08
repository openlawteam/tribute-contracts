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
  EXECUTE: "EXECUTE",
  REGISTER_NEW_TOKEN: "REGISTER_NEW_TOKEN",
  REGISTER_NEW_INTERNAL_TOKEN: "REGISTER_NEW_INTERNAL_TOKEN",
  UPDATE_TOKEN: "UPDATE_TOKEN",
};

const bankExtensionAclFlags = Object.values(bankExtensionAclFlagsMap);

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

module.exports = {
  parseSelectedFlags,
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
};
