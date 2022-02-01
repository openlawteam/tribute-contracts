import { extendConfig, extendEnvironment } from "hardhat/config";
import { BackwardsCompatibilityProviderAdapter } from "hardhat/internal/core/providers/backwards-compatibility";
import {
  AutomaticGasPriceProvider,
  AutomaticGasProvider,
} from "hardhat/internal/core/providers/gas-providers";
import { HttpProvider } from "hardhat/internal/core/providers/http";
import {
  DefenderSignerConfig,
  GcpKmsSignerConfig,
  SignerConfig,
  HardhatConfig,
  HardhatUserConfig,
  HttpNetworkUserConfig,
  EIP1193Provider,
} from "hardhat/types";
import "./type-extensions";
import { DefenderSignerProvider } from "./DefenderSignerProvider";
import { GcpKmsSignerProvider } from "./GcpKmsSignerProvider";
import { log } from "../utils/log-util";

const buildSignerProvider = (
  eip1193Provider: EIP1193Provider,
  signerConfig: SignerConfig,
  chainId: number
) => {
  switch (signerConfig.id) {
    case "defender":
      log(`Signer: ${signerConfig.id}`);
      return new DefenderSignerProvider(
        eip1193Provider,
        signerConfig as DefenderSignerConfig,
        chainId
      );
    case "googleKms":
      log(`Signer: ${signerConfig.id}`);
      return new GcpKmsSignerProvider(
        eip1193Provider,
        signerConfig as GcpKmsSignerConfig,
        chainId
      );
    default:
      throw new Error(`Relayer ${signerConfig.id} not supported`);
  }
};

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    const userNetworks = userConfig.networks;
    if (userNetworks === undefined) {
      return;
    }
    for (const networkName in userNetworks) {
      if (networkName === "hardhat") {
        continue;
      }

      const network = userNetworks[networkName]!;
      if (network.signerId) {
        config.networks[networkName].signerId = network.signerId;
      }
    }

    config.signers = userConfig.signers;
  }
);

extendEnvironment((hre) => {
  if (hre.network.config.signerId && hre.config.signers) {
    const signerId = hre.network.config.signerId;
    const signers = hre.config.signers;
    const signer = Object.entries(signers)
      .filter((r) => r[0].toLowerCase() === signerId.toLowerCase())
      .filter((r) => r[1].enabled)
      .map((r) => r[1] as SignerConfig)[0];

    // There are no signers enabled in the hardhat.config file.
    if (!signer) {
      log(
        `The [${signerId}] signer is configured for network ${hre.network.name}, but not enabled in the hardhat.config file`
      );
      process.exit(1);
    }

    const httpNetConfig = hre.network.config as HttpNetworkUserConfig;
    const eip1193Provider = new HttpProvider(
      httpNetConfig.url!,
      hre.network.name,
      httpNetConfig.httpHeaders,
      httpNetConfig.timeout
    );

    let wrappedProvider: EIP1193Provider = buildSignerProvider(
      eip1193Provider,
      { ...signer, id: signerId },
      hre.network.config.chainId!
    );

    wrappedProvider = new AutomaticGasProvider(
      wrappedProvider,
      hre.network.config.gasMultiplier
    );

    wrappedProvider = new AutomaticGasPriceProvider(wrappedProvider);
    hre.network.provider = new BackwardsCompatibilityProviderAdapter(
      wrappedProvider
    );
  }
});
