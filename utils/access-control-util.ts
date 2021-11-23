const { sha3 } = require("./contract-util.js");
const { extensionsIdsMap } = require("./dao-ids-util");

export type ACLValue = {
  id: string;
  addr: string;
  flags: number;
};

export type SelectedACLs = {
  dao: Array<string>;
  extensions: Record<string, Array<string>>;
};

export type ACLBuilder = (
  contractAddress: string,
  acls: SelectedACLs
) => ACLValue;

export const daoAccessFlagsMap: Record<string, string> = {
  REPLACE_ADAPTER: "REPLACE_ADAPTER",
  SUBMIT_PROPOSAL: "SUBMIT_PROPOSAL",
  UPDATE_DELEGATE_KEY: "UPDATE_DELEGATE_KEY",
  SET_CONFIGURATION: "SET_CONFIGURATION",
  ADD_EXTENSION: "ADD_EXTENSION",
  REMOVE_EXTENSION: "REMOVE_EXTENSION",
  NEW_MEMBER: "NEW_MEMBER",
};

export const daoAccessFlags: Array<string> = Object.values(daoAccessFlagsMap);

export const bankExtensionAclFlagsMap: Record<string, string> = {
  ADD_TO_BALANCE: "ADD_TO_BALANCE",
  SUB_FROM_BALANCE: "SUB_FROM_BALANCE",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
  WITHDRAW: "WITHDRAW",
  REGISTER_NEW_TOKEN: "REGISTER_NEW_TOKEN",
  REGISTER_NEW_INTERNAL_TOKEN: "REGISTER_NEW_INTERNAL_TOKEN",
  UPDATE_TOKEN: "UPDATE_TOKEN",
};

export const bankExtensionAclFlags: Array<string> = Object.values(
  bankExtensionAclFlagsMap
);

export const erc20ExtensionAclFlagsMap: Record<string, string> = {};

export const erc20ExtensionAclFlags: Array<string> = Object.values(
  erc20ExtensionAclFlagsMap
);

export const erc721ExtensionAclFlagsMap: Record<string, string> = {
  WITHDRAW_NFT: "WITHDRAW_NFT",
  COLLECT_NFT: "COLLECT_NFT",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
};

export const erc721ExtensionAclFlags: Array<string> = Object.values(
  erc721ExtensionAclFlagsMap
);

export const erc1155ExtensionAclFlagsMap: Record<string, string> = {
  WITHDRAW_NFT: "WITHDRAW_NFT",
  COLLECT_NFT: "COLLECT_NFT",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
};

export const erc1155ExtensionAclFlags: Array<string> = Object.values(
  erc1155ExtensionAclFlagsMap
);

export const erc1271ExtensionAclFlagsMap: Record<string, string> = {
  SIGN: "SIGN",
};

export const erc1271ExtensionAclFlags: Array<string> = Object.values(
  erc1271ExtensionAclFlagsMap
);

export const executorExtensionAclFlagsMap: Record<string, string> = {
  EXECUTE: "EXECUTE",
};

export const executorExtensionAclFlags: Array<string> = Object.values(
  executorExtensionAclFlagsMap
);

export const vestingExtensionAclFlagsMap: Record<string, string> = {
  NEW_VESTING: "NEW_VESTING",
  REMOVE_VESTING: "REMOVE_VESTING",
};

export const vestingExtensionAclFlags: Array<string> = Object.values(
  vestingExtensionAclFlagsMap
);

export const parseSelectedFlags = (
  allAclFlags: Array<string>,
  selectedFlags: Array<string>,
  moduleName: string
): Record<string, boolean> => {
  return selectedFlags
    .map((f) => f.toUpperCase())
    .reduce((flags, flag) => {
      if (allAclFlags.includes(flag)) {
        return { ...flags, [flag]: true };
      }
      throw Error(`Invalid ${moduleName} Access Flag: ${flag}`);
    }, {});
};

export const entryERC721 = (
  contractAddress: string,
  selectedAcls: SelectedACLs
): ACLValue => {
  return getEnabledExtensionFlags(
    erc721ExtensionAclFlags,
    extensionsIdsMap.ERC721_EXT,
    contractAddress,
    selectedAcls
  );
};

export const entryERC1155 = (
  contractAddress: string,
  selectedAcls: SelectedACLs
): ACLValue => {
  return getEnabledExtensionFlags(
    erc1155ExtensionAclFlags,
    extensionsIdsMap.ERC1155_EXT,
    contractAddress,
    selectedAcls
  );
};

export const entryERC20 = (
  contractAddress: string,
  selectedAcls: SelectedACLs
): ACLValue => {
  return getEnabledExtensionFlags(
    erc20ExtensionAclFlags,
    extensionsIdsMap.ERC20_EXT,
    contractAddress,
    selectedAcls
  );
};

export const entryBank = (
  contractAddress: string,
  selectedAcls: SelectedACLs
): ACLValue => {
  return getEnabledExtensionFlags(
    bankExtensionAclFlags,
    extensionsIdsMap.BANK_EXT,
    contractAddress,
    selectedAcls
  );
};

export const entryERC1271 = (
  contractAddress: string,
  selectedAcls: SelectedACLs
): ACLValue => {
  return getEnabledExtensionFlags(
    erc1271ExtensionAclFlags,
    extensionsIdsMap.ERC1271_EXT,
    contractAddress,
    selectedAcls
  );
};

export const entryExecutor = (
  contractAddress: string,
  selectedAcls: SelectedACLs
): ACLValue => {
  return getEnabledExtensionFlags(
    executorExtensionAclFlags,
    extensionsIdsMap.EXECUTOR_EXT,
    contractAddress,
    selectedAcls
  );
};

export const entryVesting = (
  contractAddress: string,
  selectedAcls: SelectedACLs
): ACLValue => {
  return getEnabledExtensionFlags(
    vestingExtensionAclFlags,
    extensionsIdsMap.VESTING_EXT,
    contractAddress,
    selectedAcls
  );
};

export const entryDao = (
  contractId: string,
  contractAddress: string,
  selectedAcls: SelectedACLs
): ACLValue => {
  const flags = daoAccessFlags.flatMap((flag) => {
    return selectedAcls.dao.some((f) => f === flag);
  });

  return {
    id: sha3(contractId) as string,
    addr: contractAddress,
    flags: calculateFlagValue(flags),
  };
};

export const getEnabledExtensionFlags = (
  acls: Array<string>,
  extensionId: string,
  contractAddress: string,
  selectedAcls: SelectedACLs
): ACLValue => {
  const enabledFlags = acls.flatMap((flag: string) => {
    const extensionsAcls = selectedAcls.extensions;
    return (
      extensionsAcls &&
      Object.keys(extensionsAcls).length > 0 &&
      extensionsAcls[extensionId].some((f) => f === flag)
    );
  });

  return {
    id: sha3(extensionId) as string,
    addr: contractAddress,
    flags: calculateFlagValue(enabledFlags),
  };
};

/**
 * Each position in the array represents a flag, if its true it means the flag is enabled, hence
 * the access should be granted.
 * To grant the access it calculates the integer value that represents that tag in the 2**68 space.
 * @param values An array of boolean which indicate the flags that are enabled.
 * @returns a value
 */
export const calculateFlagValue = (values: Array<boolean>): number => {
  return values
    .map((v, idx) => (v === true ? 2 ** idx : 0))
    .reduce((a, b) => a + b);
};

/**
 * The roles defined here are matching the roles available in the DaoHelper.sol,
 * otherwise the roles won't work.
 */
export const governanceRoles: Record<string, string> = {
  CONFIGURATION_GOVERNOR: "governor.role.configuration",
  MANAGING_GOVERNOR: "governor.role.managing",
};