import { extendConfig, extendEnvironment } from "hardhat/config";
import { BackwardsCompatibilityProviderAdapter } from "hardhat/internal/core/providers/backwards-compatibility";
import {
  AutomaticGasPriceProvider,
  AutomaticGasProvider,
} from "hardhat/internal/core/providers/gas-providers";
import { HttpProvider } from "hardhat/internal/core/providers/http";
import {
  DefenderProviderConfig,
  EIP1193Provider,
  GcpKmsProviderConfig,
  HardhatConfig,
  HardhatUserConfig,
  HttpNetworkUserConfig,
  RelayerConfig,
} from "hardhat/types";
import "./type-extensions";
import { DefenderProvider } from "./DefenderProvider";
import { GcpKmsProvider } from "./GcpKmsProvider";
import { log } from "../utils/log-util";

const buildRelayerProvider = (
  eip1193Provider: EIP1193Provider,
  relayerConfig: RelayerConfig,
  chainId: number
) => {
  switch (relayerConfig.id) {
    case "defender":
      log(`Relayer/Signer: ${relayerConfig.id}`);
      return new DefenderProvider(
        eip1193Provider,
        relayerConfig as DefenderProviderConfig,
        chainId
      );
    case "googleKms":
      log(`Relayer/Signer: ${relayerConfig.id}`);
      return new GcpKmsProvider(
        eip1193Provider,
        relayerConfig as GcpKmsProviderConfig,
        chainId
      );
    default:
      throw new Error(`Relayer ${relayerConfig.id} not supported`);
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
      if (network.relayerId) {
        config.networks[networkName].relayerId = network.relayerId;
      }
    }

    config.relayers = userConfig.relayers;
  }
);

extendEnvironment((hre) => {
  if (hre.network.config.relayerId && hre.config.relayers) {
    const relayerId = hre.network.config.relayerId;
    const relayers = hre.config.relayers;

    const relayer = Object.entries(relayers)
      .filter((r) => r[0].toLowerCase() === relayerId.toLowerCase())
      .filter((r) => r[1].enabled)
      .map((r) => r[1] as RelayerConfig)[0];

    // There are no relayers enabled in the hardhat.config file.
    if (!relayer) {
      log(
        `The [${relayerId}] relayer is configured for network ${hre.network.name}, but not enabled in the hardhat.config file`
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

    let wrappedProvider: EIP1193Provider = buildRelayerProvider(
      eip1193Provider,
      { ...relayer, id: relayerId },
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
