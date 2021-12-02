/**
 * The roles defined here are matching the roles available in the GovernanceHelper.sol,
 * otherwise the roles won't work.
 */
export const governanceRoles: Record<string, string> = {
  ONLY_GOVERNOR: "governance.role.$contractAddress",
};
