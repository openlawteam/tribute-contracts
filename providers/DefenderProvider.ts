import Common, { Hardfork } from "@ethereumjs/common";
import {
  FeeMarketEIP1559Transaction,
  FeeMarketEIP1559TxData,
} from "@ethereumjs/tx";
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
import { ethers } from "ethers";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";
import { arrayify, hashMessage, hexlify, toUtf8Bytes } from "ethers/lib/utils";

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

      const txf: FeeMarketEIP1559Transaction =
        FeeMarketEIP1559Transaction.fromTxData(txParams, {
          common: txOptions,
        });

      const rawMessageBuffer: Buffer = txf.getMessageToSign(false); // raw message
      const message: string = bufferToHex(rawMessageBuffer);
      console.log({ message });
      const payload: SignMessagePayload = {
        message: message,
      };

      const txSignature: SignedMessagePayload = await this.relayer.sign(
        payload
      );
      console.log({ txSignature });

      const txData = {
        ...txParams,
        ...txSignature,
        // get signature_y_parity
        v: this._determineCorrectV(message, txSignature.r, txSignature.s),
      };

      console.log({ txData });

      const signedTx: FeeMarketEIP1559Transaction =
        FeeMarketEIP1559Transaction.fromTxData(txData, {
          common: txOptions,
        });

      console.log({ sender: this.ethAddress });

      const rawTx = `0x${signedTx.serialize().toString("hex")}`;
      console.log({ rawTx });
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

  private _determineCorrectV = (msg: string, r: string, s: string) => {
    let v = 27;
    let pubKey = ethers.utils.recoverAddress(msg, {
      r,
      s,
      v,
    });
    console.log({ recoveredAddress1: pubKey });
    if (pubKey !== this.ethAddress) {
      v = 28;
      pubKey = ethers.utils.recoverAddress(msg, {
        r,
        s,
        v,
      });
      console.log({ recoveredAddress2: pubKey });
    }
    return new BN(v - 27);
  };
}
