import { BankExtension } from "../generated/templates";
import { BankCreated } from "../generated/BankFactory/BankFactory";
import { Bank } from "../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";

// helper
function loadOrCreateBank(address: string): Bank {
  let bank = Bank.load(address);
  if (bank == null) {
    bank = new Bank(address);
  }
  return bank as Bank;
}

/**
 * handleBankCreated
 *
 * @param event BankCreated
 * Start indexing the bank;
 * `event.params.bankAddress` is the address of the new bank contract
 * `event.params.daoAddress` is the address of the banks dao contract
 *
 *  BankExtension.create(event.params.daoAddress, event.params.bankAddress);
 */
export function handleBankCreated(event: BankCreated): void {
  log.info(
    "**************** handleBankCreated event fired. bankAddress: {}, daoAddress: {}",
    [
      event.params.bankAddress.toHexString(),
      event.params.daoAddress.toHexString(),
    ]
  );

  let bank = loadOrCreateBank(event.params.daoAddress.toHexString());

  bank.createdAt = event.block.timestamp.toString();
  bank.bankAddress = event.params.bankAddress;
  bank.daoAddress = event.params.daoAddress;
  bank.balance = BigInt.fromI32(0);

  BankExtension.create(event.params.daoAddress);

  bank.save();
}
