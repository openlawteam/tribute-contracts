/**
 * @notice the ids defined in this file must match the ids added to DaoHelper.sol.
 */

/** Adapters */
export const adaptersIdsMap: Record<string, string> = {
  VOTING_ADAPTER: "voting",
  ONBOARDING_ADAPTER: "onboarding",
  NONVOTING_ONBOARDING_ADAPTER: "nonvoting-onboarding",
  TRIBUTE_ADAPTER: "tribute",
  FINANCING_ADAPTER: "financing",
  MANAGING_ADAPTER: "managing",
  RAGEQUIT_ADAPTER: "ragequit",
  GUILDKICK_ADAPTER: "guildkick",
  CONFIGURATION_ADAPTER: "configuration",
  DISTRIBUTE_ADAPTER: "distribute",
  TRIBUTE_NFT_ADAPTER: "tribute-nft",
  TRANSFER_STRATEGY_ADAPTER: "erc20-transfer-strategy",
  DAO_REGISTRY_ADAPTER: "daoRegistry",
  BANK_ADAPTER: "bank",
  ERC721_ADAPTER: "nft",
  ERC1155_ADAPTER: "erc1155-adpt",
  ERC1271_ADAPTER: "signatures",
  SNAPSHOT_PROPOSAL_ADAPTER: "snapshot-proposal-adpt",
  VOTING_HASH_ADAPTER: "voting-hash-adpt",
  KICK_BAD_REPORTER_ADAPTER: "kick-bad-reporter-adpt",
  COUPON_ONBOARDING_ADAPTER: "coupon-onboarding",
  LEND_NFT_ADAPTER: "lend-nft",
  ERC20_TRANSFER_STRATEGY_ADAPTER: "erc20-transfer-strategy",
};

/** Extensions */
export const extensionsIdsMap: Record<string, string> = {
  BANK_EXT: "bank",
  ERC1271_EXT: "erc1271",
  ERC721_EXT: "nft",
  EXECUTOR_EXT: "executor-ext",
  VESTING_EXT: "internal-token-vesting-ext",
  ERC1155_EXT: "erc1155-ext",
  ERC20_EXT: "erc20-ext",
};
