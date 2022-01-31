import "hardhat/types/config";

declare module "hardhat/types/config" {
  export type RelayerId = "defender" | "googleKms";

  export type RelayerConfig = {
    id: RelayerId;
    enabled: Boolean;
  };

  export type DefenderProviderConfig = RelayerConfig & {
    apiKey: string;
    apiSecret: string;
  };

  export type GcpKmsProviderConfig = RelayerConfig & {
    projectId: string; // the project id in gcp
    locationId: string; // the location where the key ring was created
    keyRingId: string; // the id of the key ring
    keyId: string; // the name/id of the key in the key ring
    keyVersion: string; // the key version in the key
  };

  export interface HttpNetworkUserConfig {
    relayerId?: RelayerId;
  }

  export interface HardhatNetworkUserConfig {
    relayerId?: RelayerId;
  }
  export interface HttpNetworkConfig {
    relayerId?: RelayerId;
  }
  export interface HardhatNetworkConfig {
    relayerId?: RelayerId;
  }

  export interface HardhatUserConfig {
    relayers?: Record<string, RelayerConfig>;
  }

  export interface HardhatConfig {
    relayers?: Record<string, RelayerConfig>;
  }
}
