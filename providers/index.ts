import { extendConfig, extendEnvironment } from "hardhat/config";
import { BackwardsCompatibilityProviderAdapter } from "hardhat/internal/core/providers/backwards-compatibility";
import {
  AutomaticGasPriceProvider,
  AutomaticGasProvider,
} from "hardhat/internal/core/providers/gas-providers";
import { HttpProvider } from "hardhat/internal/core/providers/http";
import {
  DefenderRelayerConfig,
  EIP1193Provider,
  HardhatConfig,
  HardhatUserConfig,
  HttpNetworkUserConfig,
  RelayerConfig,
} from "hardhat/types";
import "./type-extensions";
import { DefenderProvider } from "./DefenderProvider";

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
      if (network.relayer) {
        config.networks[networkName].relayer = network.relayer;
      }
    }
  }
);

const buildRelayerProvider = (
  eip1193Provider: EIP1193Provider,
  relayerConfig: RelayerConfig,
  chainId: number
) => {
  switch (relayerConfig.id) {
    case "defender":
      return new DefenderProvider(
        eip1193Provider,
        relayerConfig as DefenderRelayerConfig,
        chainId
      );
    default:
      throw new Error(`Relayer ${relayerConfig.id} not supported`);
  }
};

extendEnvironment((hre) => {
  if (hre.network.config.relayer) {
    const httpNetConfig = hre.network.config as HttpNetworkUserConfig;
    const eip1193Provider = new HttpProvider(
      httpNetConfig.url!,
      hre.network.name,
      httpNetConfig.httpHeaders,
      httpNetConfig.timeout
    );

    let wrappedProvider: EIP1193Provider = buildRelayerProvider(
      eip1193Provider,
      hre.network.config.relayer,
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
