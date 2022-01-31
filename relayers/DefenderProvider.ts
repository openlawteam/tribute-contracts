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
      tx.from = await this._getSender();
      // tx = {
      //   gas, from, data, maxFeePerGas, maxPriorityFeePerGas
      // }

      const [txRequest] = validateParams(params, rpcTransactionRequest);
      txRequest.chainId = new BN(this.chainId);
      if (txRequest.nonce === undefined) {
        txRequest.nonce = await this._getNonce(txRequest.from);
      }
      // txRequest = {
      //  gas, from, data, maxFeePerGas, maxPriorityFeePerGas, nonce, chainId,
      //  to, gasPrice, value, accessList,
      // }

      //   const txParams: UnsignedTransaction = pick(txRequest, [
      //     "from",
      //     "to",
      //     "value",
      //     "nonce",
      //     "data",
      //     "chainId",
      //     "maxFeePerGas",
      //     "maxPriorityFeePerGas",
      //   ]);
      //   console.log({ txParams });

      //   txParams.gasLimit = txRequest.gas;

      const unsignedTx: UnsignedTransaction =
        await ethers.utils.resolveProperties({
          to: txRequest.to ? bufferToHex(txRequest.to) : undefined,
          nonce: txRequest.nonce?.toNumber(),

          gasLimit: txRequest.gas ? numberToHex(txRequest.gas) : undefined, //BigNumberish;
          gasPrice: txRequest.gasPrice?.toBuffer(), //BigNumberish

          data: txRequest.data, //BytesLike;
          value: txRequest.value ? numberToHex(txRequest.value) : undefined, //BigNumberish;
          chainId: this.chainId,

          // Typed-Transaction features
          type: 2,

          // EIP-2930; Type 1 & EIP-1559; Type 2
          //accessList?: AccessListish;

          // EIP-1559; Type 2
          maxPriorityFeePerGas: numberToHex(txRequest.maxPriorityFeePerGas!), //BigNumberish;
          maxFeePerGas: numberToHex(txRequest.maxFeePerGas!),
        });

      //   const transaction: FeeMarketEIP1559Transaction =
      //     FeeMarketEIP1559Transaction.fromTxData(txParams, {
      //       common,
      //     });

      // hashed or raw message?
      //   const messageHash: Buffer = transaction.getMessageToSign(); // hashed message
      // const message: string = hexlify(messageHash);
      // console.log({ message });
      // const payload: SignMessagePayload = {
      //   message,
      // };
      //   const digestBuffer = transaction.getMessageToSign(true);
      //   const message = hexlify(digestBuffer);
      //   console.log({ message });
      //   const txSignature: string = await this.signer._signDigest(message);
      //   console.log({ txSignature });

      const serializedTx = ethers.utils.serializeTransaction(unsignedTx);
      const transactionSignature = await this.relayer.sign({
        message: ethers.utils.keccak256(serializedTx),
      });
      const s = ethers.utils.serializeTransaction(
        unsignedTx,
        transactionSignature
      );
      console.log({ s });

      //   const signedTx: FeeMarketEIP1559Transaction =
      //     FeeMarketEIP1559Transaction.fromTxData(
      //       {
      //         ...txParams,
      //         ...txSignature,
      //         // get signature_y_parity
      //         v: this._determineCorrectV(message, txSignature.r, txSignature.s),
      //       },
      //       {
      //         common,
      //       }
      //     );

      console.log({ sender: this.ethAddress });
      const signedRawTx = s; //bufferToHex(s);
      console.log(signedRawTx);
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
