import { BN, bufferToHex } from "ethereumjs-util";
import { rpcQuantityToBN } from "hardhat/internal/core/jsonrpc/types/base-types";
import { rpcTransactionRequest } from "hardhat/internal/core/jsonrpc/types/input/transactionRequest";
import { validateParams } from "hardhat/internal/core/jsonrpc/types/input/validation";
import { JsonRpcTransactionData } from "hardhat/internal/core/providers/accounts";
import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  DefenderSignerConfig,
  EIP1193Provider,
  RequestArguments,
} from "hardhat/types";
import { DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import { ethers } from "ethers";
import { numberToHex } from "web3-utils";
import { serializeTransaction } from "ethers/lib/utils";

export class DefenderSignerProvider extends ProviderWrapper {
  public signer: DefenderRelaySigner;
  public ethAddress: string | undefined;
  public chainId: number;

  constructor(
    provider: EIP1193Provider,
    config: DefenderSignerConfig,
    chainId: number
  ) {
    super(provider);
    this.chainId = chainId;
    const p = ethers.getDefaultProvider("rinkeby");
    this.signer = new DefenderRelaySigner(
      {
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
      },
      p
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
      txRequest.chainId = new BN(this.chainId);
      if (txRequest.nonce === undefined) {
        txRequest.nonce = await this._getNonce(txRequest.from);
      }

      const unsignedTx = await ethers.utils.resolveProperties({
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

      const txSignature = await this.signer.signTransaction(unsignedTx);
      const signedRawTx = serializeTransaction(unsignedTx, txSignature);

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
      this.ethAddress = await this.signer.getAddress();
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
