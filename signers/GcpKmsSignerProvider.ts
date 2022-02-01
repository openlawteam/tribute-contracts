import { BN, bufferToHex } from "ethereumjs-util";
import { rpcQuantityToBN } from "hardhat/internal/core/jsonrpc/types/base-types";
import { rpcTransactionRequest } from "hardhat/internal/core/jsonrpc/types/input/transactionRequest";
import { validateParams } from "hardhat/internal/core/jsonrpc/types/input/validation";
import { JsonRpcTransactionData } from "hardhat/internal/core/providers/accounts";
import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  GcpKmsSignerConfig,
  EIP1193Provider,
  RequestArguments,
} from "hardhat/types";
import { ethers } from "ethers";
import { numberToHex } from "web3-utils";
import { GcpKmsSigner } from "ethers-gcp-kms-signer";
import { keccak256, serializeTransaction } from "ethers/lib/utils";

export class GcpKmsSignerProvider extends ProviderWrapper {
  public ethAddress: string | undefined;
  public chainId: number;
  public signer: GcpKmsSigner;

  constructor(
    provider: EIP1193Provider,
    config: GcpKmsSignerConfig,
    chainId: number
  ) {
    super(provider);
    this.chainId = chainId;
    this.signer = new GcpKmsSigner(
      {
        ...config,
      },
      undefined
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

        data: txRequest.data, //BytesLike;
        value: txRequest.value ? numberToHex(txRequest.value) : undefined,
        chainId: this.chainId,

        // Typed-Transaction features - EIP-1559; Type 2
        type: 2,

        // EIP-2930; Type 1 & EIP-1559; Type 2
        //   accessList: txRequest.accessList ? txRequest.accessList : undefined,

        // EIP-1559; Type 2
        maxPriorityFeePerGas: numberToHex(txRequest.maxPriorityFeePerGas!),
        maxFeePerGas: numberToHex(txRequest.maxFeePerGas!),
      });

      const txSignature = await this.signer._signDigest(
        keccak256(serializeTransaction(unsignedTx))
      );
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
