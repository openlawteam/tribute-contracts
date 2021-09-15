const daoAccessFlags = [
  "REPLACE_ADAPTER",
  "SUBMIT_PROPOSAL",
  "UPDATE_DELEGATE_KEY",
  "SET_CONFIGURATION",
  "ADD_EXTENSION",
  "REMOVE_EXTENSION",
  "NEW_MEMBER",
];

const bankExtensionAclFlags = [
  "ADD_TO_BALANCE",
  "SUB_FROM_BALANCE",
  "INTERNAL_TRANSFER",
  "WITHDRAW",
  "EXECUTE",
  "REGISTER_NEW_TOKEN",
  "REGISTER_NEW_INTERNAL_TOKEN",
  "UPDATE_TOKEN",
];

const erc721ExtensionAclFlags = [
  "WITHDRAW_NFT",
  "COLLECT_NFT",
  "INTERNAL_TRANSFER",
];

const erc1155ExtensionAclFlags = [
  "WITHDRAW_NFT",
  "COLLECT_NFT",
  "INTERNAL_TRANSFER",
];

const erc1271ExtensionAclFlags = ["SIGN"];

const executorExtensionAclFlags = ["EXECUTE"];

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
  bankExtensionAclFlags,
  erc721ExtensionAclFlags,
  erc1155ExtensionAclFlags,
  erc1271ExtensionAclFlags,
  executorExtensionAclFlags,
};
