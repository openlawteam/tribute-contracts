import { bufferToHex } from "ethereumjs-util";
import { rpcQuantityToBigInt, rpcQuantityToNumber, numberToRpcQuantity, rpcQuantity } from "hardhat/internal/core/jsonrpc/types/base-types";
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
import {
  keccak256,
  serializeTransaction,
  UnsignedTransaction,
} from "ethers/lib/utils";

export class GcpKmsSignerProvider extends ProviderWrapper {
  public ethAddress: string | undefined;
  public chainId: number;
  public signer: GcpKmsSigner;
  public maxRetries: number;
  public network: string;
  public txTimeout: number;
  public increaseFactor: number;

  constructor(
    provider: EIP1193Provider,
    config: GcpKmsSignerConfig,
    chainId: number,
    network: string,
    increaseFactor: number = 135, // base 100 (35% increase)
    txTimeout: number = 5 * 60 * 1000, // 5 minutes
    maxRetries: number = 5, // maximum number of retries
  ) {
    super(provider);
    this.chainId = chainId;
    this.signer = new GcpKmsSigner(
      {
        ...config,
      },
      undefined
    );
    this.network = network;
    this.increaseFactor = increaseFactor;
    this.maxRetries = maxRetries;
    this.txTimeout = txTimeout;
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
      txRequest.chainId = rpcQuantityToBigInt(numberToHex(this.chainId));
      if (txRequest.nonce === undefined) {
        // @ts-ignore
        txRequest.nonce = await this._getNonce(txRequest.from);
      }
      const maxPriorityFeePerGas = txRequest.maxPriorityFeePerGas;
      const maxFeePerGas = txRequest.maxFeePerGas;
      // const { maxPriorityFeePerGas, maxFeePerGas } = await this._getFeeData();
      // const gasPrice = await this._getGasPrice();

      const unsignedTx: UnsignedTransaction =
        await ethers.utils.resolveProperties({
          to: txRequest.to ? bufferToHex(txRequest.to) : undefined,
          nonce: txRequest.nonce !== undefined ? Number(txRequest.nonce.toString()) : undefined,

          gasLimit: txRequest.gas
            ? numberToHex(txRequest.gas.toString())
            : undefined,
          gasPrice: txRequest.gasPrice,
          data: txRequest.data, //BytesLike;
          value: txRequest.value
            ? numberToHex(txRequest.value.toString())
            : undefined,
          chainId: this.chainId,
          type: 2, // Typed-Transaction features - EIP-1559; Type 2
          // @ts-ignore
          maxPriorityFeePerGas: maxPriorityFeePerGas,
          // @ts-ignore
          maxFeePerGas: maxFeePerGas,
        });

      const txSignature = await this.signer._signDigest(
        keccak256(serializeTransaction(unsignedTx))
      );
      const signedRawTx = serializeTransaction(unsignedTx, txSignature);

      // Send the transaction
      const txHash = await this._wrappedProvider.request({
        method: "eth_sendRawTransaction",
        params: [signedRawTx],
      }) as string;

      // Enable fee bumping only for Polygon network
      if (this.network === "polygon") { 
        // Wait for a specified time period for the transaction to be mined
        const isMined = await this.waitForTransaction(txHash);

        if (!isMined) {
          // Transaction was not mined within the timeout period
          // Resend the transaction with a higher fee
          return await this.resendTransactionWithHigherFee(txRequest, this.maxRetries);
        }
      }

      return txHash;

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

  private async _getNonce(address: Buffer): Promise<number> {
    const response = (await this._wrappedProvider.request({
      method: "eth_getTransactionCount",
      params: [bufferToHex(address), "pending"],
    })) as string;
    return rpcQuantityToNumber(response);
  }

  private async waitForTransaction(txHash: string): Promise<boolean> {
    const timeoutMs: number = this.txTimeout;

    return new Promise<boolean>((resolve) => {
      let timeout = setTimeout(() => {
        clearTimeout(checkInterval);
        resolve(false); // Timeout reached without confirmation
      }, timeoutMs);

      let checkInterval = setInterval(async () => {
        try {
          const txReceipt = await this._wrappedProvider.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          }) as { blockNumber: string };

          if (txReceipt && txReceipt.blockNumber) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve(true); // Transaction confirmed
          }
        } catch (err) {
          // Log the error but don't reject to keep checking until timeout
          console.error("Error checking transaction receipt:", err);
        }
      }, 30000); // Check every 30 seconds to prevent rate limiting
    });
  }

  private async resendTransactionWithHigherFee(txRequest: any, retryCount: number): Promise<unknown> {
    // Base case: if retryCount is 0, stop retrying
    if (retryCount <= 0) {
      throw new Error("Maximum retry attempts reached. Transaction canceled due to high fees.");
    }

    // Calculate new gas fees. Increases the previous fees by a certain percentage.
    const increaseFactor = BigInt(this.increaseFactor);
    const baseFactor = BigInt(100);

    let newMaxPriorityFeePerGas = (BigInt(txRequest.maxPriorityFeePerGas) * increaseFactor + baseFactor / BigInt(2)) / baseFactor;
    let newMaxFeePerGas = (BigInt(txRequest.maxFeePerGas) * increaseFactor + baseFactor / BigInt(2)) / baseFactor;

    const newTxRequest = {
      ...txRequest,
      maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      maxFeePerGas: newMaxFeePerGas,
    };

    try {
      // Create a new transaction object with the increased fees
      const newTxRequest = {
        ...txRequest,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
        maxFeePerGas: newMaxFeePerGas,
      };

      // Prepare the unsigned transaction as before
      const unsignedTx: UnsignedTransaction = await ethers.utils.resolveProperties({
        to: newTxRequest.to ? bufferToHex(newTxRequest.to) : undefined,
        nonce: newTxRequest.nonce, // Use the same nonce
        gasLimit: newTxRequest.gas ? numberToHex(newTxRequest.gas.toString()) : undefined,
        // EIP-1559 parameters
        type: 2, // Ensure it's an EIP-1559 transaction
        maxPriorityFeePerGas: numberToRpcQuantity(newMaxPriorityFeePerGas),
        maxFeePerGas: numberToRpcQuantity(newMaxFeePerGas),
        // Other transaction parameters
        data: newTxRequest.data,
        value: newTxRequest.value ? numberToHex(newTxRequest.value.toString()) : undefined,
        chainId: this.chainId,
      });

      // Sign the new transaction
      const txSignature = await this.signer._signDigest(
        keccak256(serializeTransaction(unsignedTx))
      );
      const signedRawTx = serializeTransaction(unsignedTx, txSignature);

      const txHash = await this._wrappedProvider.request({
        method: "eth_sendRawTransaction",
        params: [signedRawTx],
      }) as string;

      const isMined = await this.waitForTransaction(txHash);
      if (!isMined) {
        console.log(`Transaction not mined within timeout. Retrying... Attempts left: ${retryCount - 1}`);
        // Recursive call with decremented retryCount
        return await this.resendTransactionWithHigherFee(newTxRequest, retryCount - 1);
      }

      // Transaction was mined successfully
      return txHash;
    } catch (error) {
      console.error("Error sending transaction: ", error);
      // Recursive call with decremented retryCount if there was an error sending the transaction
      return await this.resendTransactionWithHigherFee(newTxRequest, retryCount - 1);
    }
  }

}
