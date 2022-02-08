import "hardhat/types/config";

declare module "hardhat/types/config" {
  export type SignerId = "defender" | "googleKms";

  export type SignerConfig = {
    id: SignerId;
    enabled: Boolean;
  };

  export type DefenderSignerConfig = SignerConfig & {
    apiKey: string;
    apiSecret: string;
  };

  export type GcpKmsSignerConfig = SignerConfig & {
    projectId: string; // the project id in gcp
    locationId: string; // the location where the key ring was created
    keyRingId: string; // the id of the key ring
    keyId: string; // the name/id of the key in the key ring
    keyVersion: string; // the key version in the key
  };

  export interface HttpNetworkUserConfig {
    signerId?: SignerId;
  }

  export interface HardhatNetworkUserConfig {
    signerId?: SignerId;
  }
  export interface HttpNetworkConfig {
    signerId?: SignerId;
  }
  export interface HardhatNetworkConfig {
    signerId?: SignerId;
  }

  export interface HardhatUserConfig {
    signers?: Record<string, SignerConfig>;
  }

  export interface HardhatConfig {
    signers?: Record<string, SignerConfig>;
  }
}
