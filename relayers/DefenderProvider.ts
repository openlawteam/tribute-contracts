import { BN, bufferToHex } from "ethereumjs-util";
import { rpcQuantityToBN } from "hardhat/internal/core/jsonrpc/types/base-types";
import { rpcTransactionRequest } from "hardhat/internal/core/jsonrpc/types/input/transactionRequest";
import { validateParams } from "hardhat/internal/core/jsonrpc/types/input/validation";
import { JsonRpcTransactionData } from "hardhat/internal/core/providers/accounts";
import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  DefenderProviderConfig,
  EIP1193Provider,
  RequestArguments,
} from "hardhat/types";
import { Relayer } from "defender-relay-client";
import { ethers, UnsignedTransaction } from "ethers";
import { numberToHex } from "web3-utils";

export class DefenderProvider extends ProviderWrapper {
  public relayer: Relayer;
  public ethAddress: string | undefined;
  public chainId: number;

  constructor(
    provider: EIP1193Provider,
    config: DefenderProviderConfig,
    chainId: number
  ) {
    super(provider);
    this.chainId = chainId;
    this.relayer = new Relayer({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });
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
      txRequest.chainId = new BN(this.chainId);
      if (txRequest.nonce === undefined) {
        txRequest.nonce = await this._getNonce(txRequest.from);
      }

      const unsignedTx: UnsignedTransaction =
        await ethers.utils.resolveProperties({
          to: txRequest.to ? bufferToHex(txRequest.to) : undefined,
          nonce: txRequest.nonce?.toNumber(),

          gasLimit: txRequest.gas ? numberToHex(txRequest.gas) : undefined,
          gasPrice: txRequest.gasPrice?.toBuffer(),

          data: txRequest.data,
          value: txRequest.value ? numberToHex(txRequest.value) : undefined,
          chainId: this.chainId,

          // Typed-Transaction features
          type: 2,

          // EIP-2930; Type 1 & EIP-1559; Type 2
          //accessList?: AccessListish;

          // EIP-1559; Type 2
          maxPriorityFeePerGas: numberToHex(txRequest.maxPriorityFeePerGas!),
          maxFeePerGas: numberToHex(txRequest.maxFeePerGas!),
        });

      const txSignature = await this.relayer.sign({
        message: ethers.utils.serializeTransaction(unsignedTx),
      });
      const signedRawTx = ethers.utils.serializeTransaction(
        unsignedTx,
        txSignature
      );

      return this._wrappedProvider.request({
        method: "eth_sendRawTransaction",
        params: [signedRawTx],
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

  private _determineCorrectV = (msgHash: string, r: string, s: string) => {
    let v = 27;
    let pubKey = ethers.utils.recoverAddress(msgHash, {
      r,
      s,
      v,
    });
    console.log({ recoveredAddress1: pubKey });
    if (pubKey !== this.ethAddress) {
      v = 28;
      pubKey = ethers.utils.recoverAddress(msgHash, {
        r,
        s,
        v,
      });
      console.log({ recoveredAddress2: pubKey });
    }
    return new BN(v - 27);
  };
}
