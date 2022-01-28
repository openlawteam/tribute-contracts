import Common, { Hardfork } from "@ethereumjs/common";
import {
  FeeMarketEIP1559Transaction,
  FeeMarketEIP1559TxData,
} from "@ethereumjs/tx";
import { toUtf8Bytes } from "@ethersproject/strings";
import { hexlify } from "@ethersproject/bytes";
import { BN, bufferToHex } from "ethereumjs-util";
import { rpcQuantityToBN } from "hardhat/internal/core/jsonrpc/types/base-types";
import { rpcTransactionRequest } from "hardhat/internal/core/jsonrpc/types/input/transactionRequest";
import { validateParams } from "hardhat/internal/core/jsonrpc/types/input/validation";
import { JsonRpcTransactionData } from "hardhat/internal/core/providers/accounts";
import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  DefenderRelayerConfig,
  EIP1193Provider,
  RequestArguments,
} from "hardhat/types";
import {
  Relayer,
  SignedMessagePayload,
  SignMessagePayload,
} from "defender-relay-client";
import { pick } from "lodash";
import { BigNumber } from "ethers";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";

export class DefenderProvider extends ProviderWrapper {
  public relayer: Relayer;
  public ethAddress: string | undefined;
  public chainId: number;
  public signer: DefenderRelaySigner;
  public providerX: DefenderRelayProvider;

  constructor(
    provider: EIP1193Provider,
    config: DefenderRelayerConfig,
    chainId: number
  ) {
    super(provider);
    this.relayer = new Relayer({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });
    this.chainId = chainId;
    this.providerX = new DefenderRelayProvider({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });
    this.signer = new DefenderRelaySigner(
      {
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
      },
      this.providerX,
      { speed: "fast" }
    );
  }

  public async request(args: RequestArguments): Promise<unknown> {
    const method = args.method;
    const params = this._getParams(args);

    if (method === "eth_sendTransaction") {
      const tx: JsonRpcTransactionData = params[0];

      if (tx !== undefined && tx.from === undefined) {
        tx.from = await this._getSender();
      }
      const [txRequest] = validateParams(params, rpcTransactionRequest);

      if (txRequest.nonce === undefined) {
        txRequest.nonce = await this._getNonce(txRequest.from);
      }
      const txOptions = new Common({
        chain: this.chainId,
        hardfork: Hardfork.London,
      });

      const txParams: FeeMarketEIP1559TxData = pick(txRequest, [
        "from",
        "to",
        "value",
        "nonce",
        "data",
        "chainId",
        "maxFeePerGas",
        "maxPriorityFeePerGas",
      ]);
      txParams.gasLimit = txRequest.gas;

      const txf = FeeMarketEIP1559Transaction.fromTxData(txParams, {
        common: txOptions,
      });

      const msg = txf.getMessageToSign().toString("hex");
      const payload: SignMessagePayload = {
        message: msg,
      };

      const txSignature: SignedMessagePayload = await this.relayer.sign(
        payload
      );

      console.log({ txSignature });

      const signedTx: FeeMarketEIP1559Transaction =
        FeeMarketEIP1559Transaction.fromTxData(
          {
            ...txParams,
            ...txSignature,
            r: txSignature.r,
            s: txSignature.s,
            v: txSignature.v,
          },
          {
            common: txOptions,
          }
        );

      const rawTx = `0x${signedTx.serialize().toString("hex")}`;
      return this._wrappedProvider.request({
        method: "eth_sendRawTransaction",
        params: [rawTx],
      });
    } else if (
      args.method === "eth_accounts" ||
      args.method === "eth_requestAccounts"
    ) {
      return [await this._getSender()];
    }

    return this._wrappedProvider.request(args);
  }

  private async _getSender(): Promise<string | undefined> {
    if (!this.ethAddress) {
      const r = await this.relayer.getRelayer();
      this.ethAddress = r.address;
    }
    return this.ethAddress;
  }

  private async _getNonce(address: Buffer): Promise<BN> {
    const response = (await this._wrappedProvider.request({
      method: "eth_getTransactionCount",
      params: [bufferToHex(address), "pending"],
    })) as string;

    return rpcQuantityToBN(response);
  }
}
