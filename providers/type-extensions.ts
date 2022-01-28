import "hardhat/types/config";

declare module "hardhat/types/config" {
  export type RelayerConfig = {
    id: string;
  };

  export type DefenderRelayerConfig = RelayerConfig & {
    apiKey: string;
    apiSecret: string;
  };

  export interface HttpNetworkUserConfig {
    relayer?: RelayerConfig;
  }

  export interface HardhatNetworkUserConfig {
    relayer?: RelayerConfig;
  }
  export interface HttpNetworkConfig {
    relayer?: RelayerConfig;
  }
  export interface HardhatNetworkConfig {
    relayer?: RelayerConfig;
  }
}
